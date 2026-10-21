<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  createBookmark,
  deleteBookmark,
  getBookmark,
  getBookmarks,
  updateBookmark,
} from '../services/bookmarkApi'
import { getSafeHttpUrl } from '../utils/url'

const bookmarks = ref([])
const pagination = ref({ page: 1, limit: 20, total: 0 })
const page = ref(1)
const search = ref('')
const category = ref('')
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const statusMessage = ref('')
const editingId = ref(null)
const expandedId = ref(null)
const expandedBookmark = ref(null)
const detailLoading = ref(false)
const detailError = ref('')
const deleteTarget = ref(null)
const debounceTimer = ref(null)
const requestController = ref(null)
const form = reactive({ title: '', url: '', category: '', description: '' })

const totalPages = computed(() => Math.max(1, Math.ceil(pagination.value.total / pagination.value.limit)))
const isEditing = computed(() => editingId.value !== null)
const categorySuggestions = computed(() => [...new Set(bookmarks.value.map((item) => item.category).filter(Boolean))])

function explainError(error) {
  if (error.status === 429) {
    return error.retryAfter
      ? `요청이 많습니다. ${error.retryAfter}초 후 다시 시도해 주세요.`
      : '요청이 많습니다. 잠시 후 다시 시도해 주세요.'
  }
  return error.message || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

async function loadBookmarks() {
  requestController.value?.abort()
  const controller = new AbortController()
  requestController.value = controller
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await getBookmarks({
      page: page.value,
      limit: 20,
      search: search.value.trim(),
      category: category.value.trim(),
      signal: controller.signal,
    })
    bookmarks.value = result.data
    pagination.value = result.pagination
  } catch (error) {
    if (error.name !== 'AbortError') errorMessage.value = explainError(error)
  } finally {
    if (requestController.value === controller) {
      loading.value = false
      requestController.value = null
    }
  }
}

function scheduleSearch() {
  window.clearTimeout(debounceTimer.value)
  if (page.value !== 1) page.value = 1
  debounceTimer.value = window.setTimeout(loadBookmarks, 300)
}

function goToPage(nextPage) {
  if (nextPage < 1 || nextPage > totalPages.value || nextPage === page.value || loading.value) return
  window.clearTimeout(debounceTimer.value)
  debounceTimer.value = null
  page.value = nextPage
  loadBookmarks()
}

function clearForm() {
  editingId.value = null
  Object.assign(form, { title: '', url: '', category: '', description: '' })
}

function startEditing(bookmark) {
  editingId.value = bookmark.id
  Object.assign(form, {
    title: bookmark.title,
    url: bookmark.url,
    category: bookmark.category || '',
    description: bookmark.description || '',
  })
  statusMessage.value = `${bookmark.title} 편집 중입니다.`
  errorMessage.value = ''
  document.querySelector('#bookmark-title')?.focus()
}

async function toggleDetails(bookmark) {
  if (expandedId.value === bookmark.id) {
    expandedId.value = null
    expandedBookmark.value = null
    detailError.value = ''
    return
  }

  expandedId.value = bookmark.id
  expandedBookmark.value = null
  detailError.value = ''
  detailLoading.value = true
  try {
    const result = await getBookmark(bookmark.id)
    if (expandedId.value === bookmark.id) expandedBookmark.value = result.data
  } catch (error) {
    if (expandedId.value === bookmark.id) detailError.value = explainError(error)
  } finally {
    if (expandedId.value === bookmark.id) detailLoading.value = false
  }
}

async function submitForm() {
  if (saving.value) return
  saving.value = true
  errorMessage.value = ''
  statusMessage.value = ''
  const payload = {
    title: form.title.trim(),
    url: form.url.trim(),
    category: form.category.trim(),
    description: form.description.trim(),
  }

  try {
    if (isEditing.value) {
      await updateBookmark(editingId.value, payload)
      statusMessage.value = '북마크를 수정했습니다.'
    } else {
      await createBookmark(payload)
      statusMessage.value = '북마크를 등록했습니다.'
    }
    clearForm()
    page.value = 1
    await loadBookmarks()
  } catch (error) {
    errorMessage.value = explainError(error)
  } finally {
    saving.value = false
  }
}

function askToDelete(bookmark) {
  deleteTarget.value = bookmark
}

async function confirmDelete() {
  if (!deleteTarget.value || saving.value) return
  saving.value = true
  errorMessage.value = ''
  statusMessage.value = ''
  const target = deleteTarget.value

  try {
    await deleteBookmark(target.id)
    deleteTarget.value = null
    if (editingId.value === target.id) clearForm()
    statusMessage.value = '북마크를 삭제했습니다.'
    page.value = 1
    await loadBookmarks()
  } catch (error) {
    errorMessage.value = explainError(error)
  } finally {
    saving.value = false
  }
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '날짜 정보 없음'
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

onMounted(loadBookmarks)
onBeforeUnmount(() => {
  window.clearTimeout(debounceTimer.value)
  requestController.value?.abort()
})
</script>

<template>
  <section class="bookmark-page" aria-label="공개 북마크 관리">
    <div class="bookmark-policy" role="note">
      <span class="bookmark-policy-icon" aria-hidden="true">ⓘ</span>
      <p>이 북마크 목록은 공개 공유 공간입니다. 누구나 등록, 수정, 삭제할 수 있으므로 개인정보나 비공개 URL을 등록하지 마세요.</p>
    </div>

    <div class="bookmark-layout">
      <section class="tool-workspace bookmark-list-panel" aria-labelledby="bookmark-list-heading">
        <div class="bookmark-panel-heading">
          <div>
            <div class="section-kicker">SHARED RESOURCES</div>
            <h2 id="bookmark-list-heading">개발 북마크</h2>
            <p>함께 모은 개발 자료를 찾아보세요.</p>
          </div>
          <span class="bookmark-count">{{ pagination.total }}개</span>
        </div>

        <div class="bookmark-filters">
          <label class="bookmark-control">
            <span>제목 검색</span>
            <input v-model="search" type="search" maxlength="200" placeholder="북마크 제목 검색" @input="scheduleSearch" />
          </label>
          <label class="bookmark-control">
            <span>카테고리 필터</span>
            <input
              v-model="category"
              type="search"
              maxlength="50"
              list="bookmark-category-options"
              placeholder="카테고리 입력 또는 선택"
              @input="scheduleSearch"
            />
            <datalist id="bookmark-category-options">
              <option v-for="suggestion in categorySuggestions" :key="suggestion" :value="suggestion" />
            </datalist>
          </label>
          <button v-if="search || category" class="text-button bookmark-clear-filter" type="button" @click="search = ''; category = ''; scheduleSearch()">
            조건 지우기
          </button>
        </div>

        <p v-if="statusMessage" class="bookmark-status" role="status">{{ statusMessage }}</p>
        <p v-if="errorMessage" class="tool-error" role="alert">{{ errorMessage }}</p>

        <div v-if="loading && !bookmarks.length" class="bookmark-state" role="status" aria-live="polite">
          <span class="bookmark-spinner" aria-hidden="true"></span> 북마크를 불러오고 있어요.
        </div>
        <div v-else-if="errorMessage && !bookmarks.length" class="bookmark-state bookmark-empty">
          <strong>목록을 불러오지 못했어요.</strong>
          <button class="secondary-button" type="button" :disabled="loading" @click="loadBookmarks">다시 시도</button>
        </div>
        <div v-else-if="!loading && !bookmarks.length && !errorMessage" class="bookmark-state bookmark-empty">
          <span aria-hidden="true">↗</span>
          <strong>{{ search || category ? '검색 결과가 없어요.' : '아직 등록된 북마크가 없어요.' }}</strong>
          <p>{{ search || category ? '검색어나 카테고리 조건을 바꿔보세요.' : '첫 번째 개발 자료를 공유해 보세요.' }}</p>
        </div>

        <div v-else class="bookmark-list" :aria-busy="loading">
          <article v-for="bookmark in bookmarks" :key="bookmark.id" class="bookmark-card">
            <div class="bookmark-card-main">
              <div class="bookmark-card-heading">
                <a v-if="getSafeHttpUrl(bookmark.url)" class="bookmark-title" :href="getSafeHttpUrl(bookmark.url)" target="_blank" rel="noopener noreferrer">
                  {{ bookmark.title }} <span aria-hidden="true">↗</span>
                </a>
                <span v-else class="bookmark-title">{{ bookmark.title }}</span>
                <span v-if="bookmark.category" class="bookmark-category">{{ bookmark.category }}</span>
              </div>
              <p v-if="bookmark.description" class="bookmark-description">{{ bookmark.description }}</p>
              <span class="bookmark-url">{{ bookmark.url }}</span>
            </div>
            <div class="bookmark-card-actions">
              <button class="bookmark-action" type="button" :aria-expanded="expandedId === bookmark.id" @click="toggleDetails(bookmark)">
                {{ expandedId === bookmark.id ? '간단히' : '상세 정보' }}
              </button>
              <button class="bookmark-action" type="button" :disabled="saving" @click="startEditing(bookmark)">수정</button>
              <button class="bookmark-action bookmark-delete-action" type="button" :disabled="saving" @click="askToDelete(bookmark)">삭제</button>
            </div>
            <div v-if="expandedId === bookmark.id" class="bookmark-details" :aria-busy="detailLoading">
              <p v-if="detailLoading" role="status">상세 정보를 불러오는 중…</p>
              <p v-else-if="detailError" class="bookmark-detail-error" role="alert">{{ detailError }}</p>
              <template v-else-if="expandedBookmark">
                <div><dt>주소</dt><dd><a v-if="getSafeHttpUrl(expandedBookmark.url)" :href="getSafeHttpUrl(expandedBookmark.url)" target="_blank" rel="noopener noreferrer">{{ expandedBookmark.url }}</a><span v-else>{{ expandedBookmark.url }}</span></dd></div>
                <div><dt>카테고리</dt><dd>{{ expandedBookmark.category || '미분류' }}</dd></div>
                <div><dt>설명</dt><dd>{{ expandedBookmark.description || '설명 없음' }}</dd></div>
                <div><dt>등록일</dt><dd>{{ formatDate(expandedBookmark.createdAt) }}</dd></div>
                <div><dt>수정일</dt><dd>{{ formatDate(expandedBookmark.updatedAt) }}</dd></div>
              </template>
            </div>
          </article>
        </div>

        <nav v-if="pagination.total > pagination.limit" class="bookmark-pagination" aria-label="북마크 페이지">
          <button class="secondary-button" type="button" :disabled="page <= 1 || loading" @click="goToPage(page - 1)">이전</button>
          <span>{{ page }} / {{ totalPages }} 페이지</span>
          <button class="secondary-button" type="button" :disabled="page >= totalPages || loading" @click="goToPage(page + 1)">다음</button>
        </nav>
      </section>

      <section class="tool-workspace bookmark-form-panel" aria-labelledby="bookmark-form-heading">
        <div class="section-kicker">CONTRIBUTE</div>
        <h2 id="bookmark-form-heading">{{ isEditing ? '북마크 수정' : '자료 공유하기' }}</h2>
        <p class="bookmark-form-intro">유용한 개발 문서와 도구를 다른 사람과 나눠보세요.</p>

        <form class="bookmark-form" @submit.prevent="submitForm">
          <label class="bookmark-control" for="bookmark-title">
            <span>제목 <b aria-hidden="true">*</b></span>
            <input id="bookmark-title" v-model="form.title" type="text" required maxlength="200" autocomplete="off" placeholder="예: Vue 공식 문서" />
          </label>
          <label class="bookmark-control" for="bookmark-url">
            <span>URL <b aria-hidden="true">*</b></span>
            <input id="bookmark-url" v-model="form.url" type="url" required maxlength="2048" placeholder="https://example.com" />
            <small>http 또는 https 주소만 등록할 수 있어요.</small>
          </label>
          <label class="bookmark-control" for="bookmark-category">
            <span>카테고리</span>
            <input id="bookmark-category" v-model="form.category" type="text" maxlength="50" placeholder="예: Frontend" />
          </label>
          <label class="bookmark-control" for="bookmark-description">
            <span>설명</span>
            <textarea id="bookmark-description" v-model="form.description" rows="3" maxlength="500" placeholder="자료에 대한 간단한 설명" />
            <small>{{ form.description.length }} / 500자</small>
          </label>
          <div class="bookmark-form-actions">
            <button class="primary-button" type="submit" :disabled="saving">
              {{ saving ? '저장 중…' : isEditing ? '수정 저장' : '북마크 등록' }}
            </button>
            <button v-if="isEditing" class="secondary-button" type="button" :disabled="saving" @click="clearForm">수정 취소</button>
          </div>
        </form>
      </section>
    </div>

    <div v-if="deleteTarget" class="bookmark-dialog-backdrop" @click.self="deleteTarget = null">
      <section class="bookmark-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-description">
        <span class="bookmark-dialog-icon" aria-hidden="true">!</span>
        <h2 id="delete-dialog-title">북마크를 삭제할까요?</h2>
        <p id="delete-dialog-description"><strong>{{ deleteTarget.title }}</strong> 항목을 공개 목록에서 삭제합니다. 이 작업은 되돌릴 수 없습니다.</p>
        <div class="bookmark-form-actions">
          <button class="secondary-button" type="button" :disabled="saving" @click="deleteTarget = null">취소</button>
          <button class="bookmark-confirm-delete" type="button" :disabled="saving" @click="confirmDelete">{{ saving ? '삭제 중…' : '삭제하기' }}</button>
        </div>
      </section>
    </div>
  </section>
</template>
