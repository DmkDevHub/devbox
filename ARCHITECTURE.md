# ARCHITECTURE.md

> DevBox — Technical Architecture

## 1. 시스템 개요

DevBox는 Vue 3 SPA와 Vercel Functions 기반 서버리스 API로 구성한다.

### 핵심 구조

- 프론트엔드: Vue 3 + Vite
- 화면 스타일: Tailwind CSS
- 라우팅: Vue Router
- 백엔드: Vercel Functions
- 데이터베이스: Neon PostgreSQL
- 배포: Vercel

### 데이터 흐름

```text
PC / Mobile Browser
        |
        v
    Vue 3 SPA
        |
        +-- JSON Formatter
        +-- SQL Formatter
        +-- Base64 Converter
        +-- Date Converter
        +-- UUID Generator
        +-- Text Tools
        |       |
        |       +-- 브라우저 내부 처리
        |
        +-- Bookmark Manager
                |
                | HTTPS / JSON
                v
          Vercel Functions
                |
                +-- 입력 검증
                +-- 요청 제한
                +-- 오류 처리
                |
                v
          Neon PostgreSQL
```

기존 개발자 도구 6개는 API나 DB를 사용하지 않는다.

## 2. 기술 스택

| 영역 | 기술 | 역할 |
|---|---|---|
| Frontend | Vue 3 | 화면 개발 |
| Build | Vite | 개발 및 빌드 |
| Language | JavaScript | 개발 언어 |
| UI | Tailwind CSS v4 + `@tailwindcss/vite` | 화면 스타일 |
| Routing | Vue Router | 페이지 이동 |
| Backend | Vercel Functions | 서버 API |
| Database | Neon PostgreSQL | 데이터 저장 |
| DB Driver | @neondatabase/serverless | DB 연결 |
| Validation | Zod | API 입력 검증 |
| SQL Formatter | sql-formatter | SQL 정렬 |
| Testing | Vitest, Playwright | 단위 테스트 및 브라우저 통합 검증 |
| Hosting | Vercel | 배포 |

### 설계 원칙

- 별도 Spring Boot 서버 없음
- 별도 Express 서버 없음
- ORM 사용하지 않음
- 전역 상태 관리 라이브러리 초기 도입 없음
- API 호출은 기본 fetch 사용
- 필수 라이브러리만 설치

## 3. 프로젝트 폴더 구조

```text
devbox/
├── api/
│   ├── bookmarks.js
│   ├── bookmarks/
│   │   └── [id].js
│   └── _lib/
│       ├── db.js
│       ├── rateLimit.js
│       ├── validation.js
│       └── response.js
│
├── db/
│   ├── schema.sql
│   ├── rate-limit.sql
│   └── runtime-role-grants.sql
│
├── src/
│   ├── components/
│   │   ├── AppHeader.vue
│   │   ├── AppNavigation.vue
│   │   ├── ToolCard.vue
│   │
│   ├── views/
│   │   ├── HomeView.vue
│   │   ├── ToolView.vue
│   │   └── NotFoundView.vue
│   │
│   ├── tools/
│   │   ├── JsonTool.vue, SqlTool.vue, Base64Tool.vue
│   │   ├── DateTool.vue, UuidTool.vue, TextTool.vue
│   │   └── BookmarkTool.vue
│   │
│   ├── services/
│   │   └── bookmarkApi.js
│   │
│   ├── utils/
│   │   ├── tools.js, json.js, sql.js, base64.js
│   │   ├── date.js, uuid.js, text.js, url.js
│   │
│   ├── router/
│   │   └── index.js
│   │
│   ├── styles/
│   │   └── main.css
│   │
│   ├── App.vue
│   └── main.js
│
├── tests/
│   ├── tools.test.js
│   ├── bookmarkApi.test.js
│   ├── bookmarks-api.test.js
│   ├── rateLimit.test.js
│   └── BookmarkTool.test.js
│
├── public/
│   └── favicon.svg
├── docs/
│   └── worklogs/
│       └── YYYY-MM/
│           └── YYYY-MM-DD.md
│
├── .env.example
├── .env.local
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── AGENTS.md
├── PRD.md
├── ARCHITECTURE.md
├── TASKS.md
└── CHANGELOG.md
```

`_lib`는 API 공통 구현 코드로 사용하며 외부 HTTP 엔드포인트로 노출되지 않도록 배포 결과를 검증한다.

실제 프로젝트 생성 시 필요한 파일만 만들고 빈 파일을 불필요하게 생성하지 않는다.

폴더 구조 예시는 현재 구현 파일과 동기화한다. 루트 `vercel.json`에서 Vite 빌드 출력(`dist`)과 SPA fallback을 설정하며 `/api` 요청은 fallback에서 제외한다. 설정은 로컬 Vercel 런타임에서 경로 동작을 확인하고, 실제 Vercel 배포 검증은 Phase 8에서 수행한다.

## 4. Vue 컴포넌트 설계

### App.vue

- 전체 화면 컨테이너
- 공통 헤더
- 내비게이션
- RouterView
- 다크 모드 적용

### HomeView.vue

- DevBox 소개
- 7개 도구 카드 목록
- 도구 페이지 이동

### ToolView.vue

- URL의 toolId 확인
- 해당 도구 컴포넌트 표시
- 도구 제목 및 설명 표시
- 존재하지 않는 도구 처리

### ToolCard.vue

- 도구 아이콘
- 도구명
- 설명
- 이동 링크

### 개별 Tool 컴포넌트

각 도구는 독립 컴포넌트로 구성한다.

공통 레이아웃은 재사용하되 도구별 입력 및 처리 로직은 해당 도구의 특성에 따라 구현한다.

## 5. 라우팅 설계

| 경로 | 화면 |
|---|---|
| / | 메인 |
| /tools/json | JSON Formatter |
| /tools/sql | SQL Formatter |
| /tools/base64 | Base64 Converter |
| /tools/date | Date Converter |
| /tools/uuid | UUID Generator |
| /tools/text | Text Tools |
| /tools/bookmarks | Bookmark Manager |
| 그 외 | 404 |

도구 목록은 `src/utils/tools.js`에서 관리한다.

도구 목록의 ID, 제목, 설명, 경로를 하나의 데이터 정의로 관리하여 메뉴와 메인 카드의 불일치를 방지한다.

## 6. 프론트엔드 상태 관리

전역 상태 관리 라이브러리는 초기 버전에서 사용하지 않는다.

### 로컬 상태

- 도구 입력값
- 변환 결과
- 오류 메시지
- 북마크 폼 입력값
- API 로딩 상태

Vue의 ref, reactive, computed를 사용한다.

### 브라우저 저장

localStorage는 다크 모드 선택 등의 UI 설정에만 사용한다.

북마크 데이터의 최종 저장소는 Neon PostgreSQL이다.

## 7. 개발자 도구 처리 구조

### JSON

- JSON.parse
- JSON.stringify

### SQL

- sql-formatter
- 방언별 포맷팅 옵션
- SQL 실행 기능 없음

### Base64

- TextEncoder
- TextDecoder
- 브라우저 Base64 API

### Date

- JavaScript Date API
- 초 및 밀리초 단위 변환
- UTC와 로컬 시간 표시 구분

### UUID

- crypto.randomUUID()

### Text

- JavaScript 문자열 API
- 줄 및 단어 분리 처리

도구별 계산은 필요한 경우 `src/utils/`에 순수 함수로 분리하여 테스트한다.

## 8. 북마크 데이터베이스 설계

### bookmarks 테이블

```sql
CREATE TABLE IF NOT EXISTS bookmarks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    category VARCHAR(50),
    description VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at
ON bookmarks (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_bookmarks_category
ON bookmarks (category);

CREATE OR REPLACE FUNCTION set_bookmark_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookmarks_set_updated_at ON bookmarks;
CREATE TRIGGER bookmarks_set_updated_at
BEFORE UPDATE ON bookmarks
FOR EACH ROW
EXECUTE FUNCTION set_bookmark_updated_at();
```

### 컬럼 규칙

- id: DB 자동 생성
- title: 필수
- url: 필수
- category: 선택
- description: 선택
- created_at: 생성 시각
- updated_at: 수정 시 갱신

### 날짜 규칙

- DB에는 TIMESTAMPTZ 사용
- API에서는 ISO 8601 문자열 반환
- 화면에서는 브라우저의 로컬 시간대로 표시

### ID 규칙

BIGINT 값은 JavaScript 정밀도 문제를 피하기 위해 API에서 문자열로 반환한다.

### 삭제 정책

- 기본적으로 단건 물리 삭제
- 전체 삭제 API 제공 금지
- 삭제 전 사용자 확인
- 데이터 복구는 백업 및 복원 절차에 의존

## 9. 북마크 API 설계

### API 목록

| Method | Endpoint | 기능 |
|---|---|---|
| GET | /api/bookmarks | 목록 조회 |
| GET | /api/bookmarks/:id | 상세 조회 |
| POST | /api/bookmarks | 등록 |
| PUT | /api/bookmarks/:id | 수정 |
| DELETE | /api/bookmarks/:id | 삭제 |

### 목록 요청

```text
GET /api/bookmarks?page=1&limit=20&search=vue&category=Frontend
```

### 목록 응답 예시

```json
{
  "data": [
    {
      "id": "1",
      "title": "Vue 공식 문서",
      "url": "https://vuejs.org",
      "category": "Frontend",
      "description": "Vue 개발 문서",
      "createdAt": "2026-10-21T00:00:00.000Z",
      "updatedAt": "2026-10-21T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### 등록 요청 예시

```json
{
  "title": "Vue 공식 문서",
  "url": "https://vuejs.org",
  "category": "Frontend",
  "description": "Vue 개발 문서"
}
```

### API 응답 기준

- GET 성공: 200
- POST 성공: 201
- DELETE 성공: 204
- 잘못된 요청: 400
- 존재하지 않는 데이터: 404
- 허용되지 않은 메서드: 405
- 요청 본문 크기 초과: 413
- 호출 제한: 429
- 서버 오류: 500
- 일시적인 서비스 장애: 503

### 오류 응답 예시

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값을 확인해주세요."
  }
}
```

서버 내부 SQL, DB 접속 문자열, 스택 트레이스는 반환하지 않는다.

## 10. 입력값 검증

Zod를 사용하여 서버에서 검증한다.

### 북마크 본문

- title: 1~200자
- url: 최대 2048자
- category: 최대 50자
- description: 최대 500자
- 정의되지 않은 속성 거부
- JSON 요청 본문 전체: 최대 16KB

### URL

- 올바른 URL 형식 검사
- http 또는 https만 허용
- javascript:, data:, file: 등 거부

### 목록

- page: 1 이상의 정수
- limit: 1~50 정수
- search: 최대 길이 제한
- category: 최대 길이 제한
- 정렬 기준은 서버에서 정의한 값만 허용

URL 검증은 안전한 프로토콜만 확인하는 것으로, 링크 목적지 자체의 신뢰성을 보장하지는 않는다.

## 11. DB 연결

### 라이브러리

`@neondatabase/serverless`

### 환경변수

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
RATE_LIMIT_SECRET=replace-with-long-random-secret
PUBLIC_WRITES_ENABLED=false
```

위 문자열은 설명용 예시다.

실제 값은 서버 측 환경변수에 설정한다.

- 로컬 개발: .env.local
- 배포 환경: Vercel 환경변수

애플리케이션 `DATABASE_URL`은 `devbox_app_runtime`처럼 `bookmarks`와 `rate_limit_windows`의 CRUD 및 `bookmarks_id_seq` 사용만 가능한 역할을 사용한다. 이 역할은 테이블 소유권, schema CREATE, CREATEDB, CREATEROLE, SUPERUSER, BYPASSRLS 권한을 갖지 않는다. 스키마 마이그레이션에 필요한 관리자 접속 문자열은 앱에서 읽지 않는 별도 로컬 파일 또는 비밀 저장소에 둔다. 권한 부여 SQL은 `db/runtime-role-grants.sql`을 기준으로 한다.

접속 문자열과 비밀정보를 클라이언트 코드, 화면, 로그에 출력하지 않는다.

### 연결 예시

```javascript
import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL)
```

### 쿼리 예시

```javascript
const rows = await sql`
  SELECT id, title, url, category
  FROM bookmarks
  WHERE id = ${id}
`
```

SQL 값은 파라미터 바인딩 방식으로 처리한다.

동적인 컬럼명과 정렬 방향은 사용자 입력을 직접 사용하지 않고 서버에서 허용 목록으로 관리한다.

## 12. 프론트엔드 API 연동

파일:

`src/services/bookmarkApi.js`

담당 기능:
- getBookmarks
- getBookmark
- createBookmark
- updateBookmark
- deleteBookmark

컴포넌트에서 API 호출 로직을 반복 작성하지 않는다.

### UI 상태

- loading
- success
- error
- empty

등록·수정·삭제 요청 중 중복 실행을 방지한다.

목록 조회 시 검색 입력에는 디바운스를 적용한다.

## 13. 공개 API 보안

### SQL Injection

- 파라미터 바인딩 사용
- 문자열 결합으로 SQL 생성 금지
- 정렬 컬럼 허용 목록 사용

### XSS

- Vue 텍스트 바인딩 사용
- 사용자 입력에 v-html 사용 금지
- URL 프로토콜 검사
- 외부 링크에 rel="noopener noreferrer" 적용

### 요청 제한

- 서버 측 본문 크기 검사
- 필드 최대 길이 적용
- 목록 조회 건수 제한
- HTTP 메서드 제한

### CORS

기본적으로 프론트엔드와 API를 동일한 출처에서 제공한다.

필요 없는 교차 출처 허용 설정을 추가하지 않는다.

CORS는 API 인증 또는 남용 방지 수단이 아니다.

## 14. API 호출 제한 설계

공개 CRUD 특성상 자동화된 API 호출에 대한 방어가 필요하다.

### 초기 제한 목표

| 요청 | 제한 |
|---|---|
| GET | IP당 1분 60회 |
| POST | IP당 1분 5회 |
| PUT | IP당 1분 10회 |
| DELETE | IP당 1분 5회 |

실제 운영 상황에 따라 제한값은 조정할 수 있다.

### 구현 원칙

- 서버리스 메모리만 사용하는 호출 제한 금지
- Vercel WAF는 모든 플랜에서 고정 윈도우 제한을 제공하지만, Hobby는 규칙이 프로젝트당 1개라 요청 방식별 한도(GET 60, POST/DELETE 5, PUT 10)를 맞추기 어려워 API 내부 Neon 공유 테이블을 기준 제한기로 사용한다.
- Vercel 문서상 Hobby에는 월 1,000,000개 허용 요청이 포함되고 초과 허용 요청은 과금될 수 있다. WAF 규칙은 프로젝트 계정에서 설정하지 않았으며 필수 보호 기능의 전제로 삼지 않는다.
- Neon 테이블은 API 요청마다 원자적으로 카운터를 증가시킨다. 오래된 윈도우는 1일 보존 후 같은 쿼리에서 정리한다.
- 요청 횟수 증가는 원자적으로 처리
- Vercel이 제공하는 클라이언트 IP 헤더를 사용하고 원문 IP 대신 RATE_LIMIT_SECRET HMAC-SHA256 해시만 저장
- HTTP 429 반환
- Retry-After 헤더 제공
- RATE_LIMIT_SECRET 누락/약한 설정, 클라이언트 IP 누락, Neon 제한기 장애 시 읽기와 쓰기 모두 fail closed로 503 반환

참고: [Vercel WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [Vercel request headers](https://vercel.com/docs/headers/request-headers) (2026-10-21 확인)

### 추가 DB 구조

`db/rate-limit.sql`에서 공유 카운터 테이블을 생성한다.

테이블 정의는 `db/rate-limit.sql`을 기준으로 한다. 기간별 카운터는 동시 요청에 안전한 SQL로 갱신한다.

만료된 카운터의 정리 방법도 함께 구현한다.

제한기는 GET 60회, POST 5회, PUT 10회, DELETE 5회/분을 적용한다. 제한을 초과한 요청은 카운터가 더 증가하지 않으며, `Retry-After`는 해당 분이 끝날 때까지 남은 초다.

### 호출 제한 장애

호출 제한 시스템이 정상 동작하지 않으면 읽기와 쓰기 요청 모두 차단한다. 제한기 장애를 우회해 Neon 비용이나 스팸 요청이 계속 증가하는 상황을 막기 위한 정책이며, 가용성보다 남용 방지를 우선한다.

호출 제한만으로 대규모 트래픽 공격을 완전히 방어할 수는 없다.

## 15. 무료 운영 및 데이터 보호

### 운영 원칙

- Vercel 무료 플랜 우선
- Neon 무료 플랜 우선
- 불필요한 외부 서비스 추가 금지
- 사용량 및 제한 확인
- 예상 비용 발생 시 사용자 승인

### 공개 CRUD 위험

누구나 데이터를 변경할 수 있으므로 다음 위험이 존재한다.

- 악의적인 데이터 삭제
- 스팸 북마크 등록
- 과도한 API 요청
- 저장 용량 증가
- 피싱 또는 위험한 링크 등록

호출 제한은 위험을 완화할 뿐 완전히 방지하지 못한다.

### 운영 안전장치

- 정기적인 데이터 백업 방안
- 복구 가능 여부 및 보존 기간 확인
- DB 사용량 모니터링
- 오류 로그 확인
- 공개 쓰기 기능 긴급 중단 방법 제공
- PUBLIC_WRITES_ENABLED로 쓰기 API 제어
- 운영용 DB와 테스트용 DB 분리 권장

### 백업·복구 및 사용량 대응

- Neon의 복구 가능 시간 안에서 시점 복구 브랜치를 만들어 내용을 먼저 확인한 뒤, 검증 후에만 실제 브랜치 전환을 진행한다. Neon API의 restore 작업은 지정 시각의 상태를 새 브랜치로 만든다. 복구 가능 시간과 기능은 계정 플랜에서 확인한다.
- 별도 보관본이 필요하면 `pg_dump` 논리 백업을 암호화된 비공개 저장소에 보관하고, 복구 리허설은 격리된 브랜치/DB에서 수행한다.
- Neon Console의 프로젝트 Usage/Monitoring에서 compute·storage를 확인한다. 공식 프로젝트 정보 API도 현재 사용량과 history retention 필드를 제공한다.
- Vercel 팀 대시보드의 Usage 탭에서 팀을 선택하고 30일 범위와 프로젝트별 Functions, Requests, Data Transfer 사용량 및 예상 비용을 확인한다.
- 경고 한도, 실제 무료 잔여량 및 복구 보존 기간은 연결된 계정에서 별도로 확인한다.
- Neon Free는 현재 프로젝트별 월 100 CU-hours 및 1 GB 저장 공간을 포함하고, 복구 기록은 최대 6시간 또는 변경량 1 GB 등 제한이 있다. API 제한기는 매 요청마다 DB 쿼리를 추가하므로 무료 사용 한도 내 운영을 보장하지 않는다.
- 스팸/악성 링크가 발견되면 먼저 `PUBLIC_WRITES_ENABLED=false`로 쓰기를 중단하고, 보존이 필요한 시점의 백업/브랜치를 확보한 후 식별된 행만 검토·정리한다. 변경 뒤 쓰기 API는 제한 설정과 데이터 검토가 끝난 뒤에만 다시 연다.

Neon 시점 복구는 지정 시각의 상태에서 새 브랜치를 만들며, 복구 가능 시간 내에서만 가능하다. [Neon branch restore API](https://api-docs.neon.tech/reference/restoreprojectbranch), [Neon project usage/retention fields](https://api-docs.neon.tech/reference/getproject), [Neon pricing and Free allowances](https://neon.com/pricing), [Vercel Usage dashboard 안내](https://vercel.com/docs/pricing/manage-and-optimize-usage) (2026-10-21 확인). 실제 계정의 플랜·사용량·보존 기간과 복구 리허설은 별도 확인 대상이다.

로컬 및 운영 환경에서 `PUBLIC_WRITES_ENABLED`가 정확히 `true`일 때만 POST, PUT, DELETE를 허용한다. 기본값은 쓰기 비활성화이며, 비활성 요청에는 503과 `WRITES_DISABLED` 오류 코드를 반환한다.

공개 배포 환경에서는 검증이 끝나기 전까지 쓰기 기능을 비활성화한다.

## 16. 로컬 개발 환경

### 기본 환경

- Windows 11
- VS Code
- Node.js 22.18.0 이상(22.x) 또는 24.12.0 이상
- npm

Vue의 공식 Vite 기반 시작 절차에서 요구하는 Node.js 버전을 따른다. Node.js LTS 별칭만으로는 최소 버전이 명확하지 않으므로 프로젝트 생성 시 설치 버전을 확인한다.

Tailwind CSS는 v4의 Vite 플러그인(`@tailwindcss/vite`) 방식으로 설정한다. Tailwind CSS 버전이 바뀌면 설치 및 설정 절차를 다시 확인한다.

### 프론트엔드 실행

```bash
npm install
npm run dev
```

### 빌드

```bash
npm run build
```

### 테스트

```bash
npm run test
```

테스트 명령은 Vitest 설정 후 package.json에 정의한다.

### API 통합 실행

Vercel CLI의 로컬 실행 환경을 활용한다.

```bash
npx vercel dev
```

필요한 계정 연결 및 환경변수 구성을 먼저 완료해야 한다.

Vite 개발 서버만 실행하는 경우 `/api`가 자동으로 제공된다고 가정하지 않는다.

로컬 API 요청 경로와 환경변수 동작을 실제로 확인한다.

## 17. 배포 아키텍처

### 배포 구성

- 프론트엔드 빌드 결과: dist
- API: Vercel Functions
- DB: Neon PostgreSQL

### 배포 설정

- Vite 빌드 설정
- Node.js 실행 환경 확인
- Vercel 환경변수 설정
- Vue Router의 SPA fallback 설정
- `/api` 경로가 SPA fallback에 포함되지 않도록 처리
- 서버리스 함수 배포 결과 확인

설정 파일은 현재 Vercel 방식에 맞춰 작성하고 실제 배포 환경에서 검증한다.

### 배포 차단 조건

다음 조건이 충족되지 않으면 공개 쓰기 API 배포를 완료 처리하지 않는다.

- 서버 측 입력값 검증 완료
- 호출 제한 실동작 확인
- 비밀정보 노출 없음
- 백업 및 복구 절차 확인
- 쓰기 API 긴급 중단 가능
- 기본 보안 테스트 통과

## 18. 테스트 전략

### 단위 테스트

Vitest 활용:
- JSON 처리
- Base64 처리
- Date 변환
- Text 처리
- 입력값 검증
- SQL 포맷팅 대표 케이스

### API 테스트

- 정상 CRUD
- 잘못된 입력
- 존재하지 않는 ID
- 페이지네이션
- 검색 및 필터
- SQL Injection 시도
- 요청 크기 초과
- 호출 제한
- DB 장애

### UI 테스트

- PC 화면
- 모바일 화면
- 다크 모드
- 도구 페이지 이동
- 오류 및 로딩 상태
- 북마크 CRUD 화면

자동화가 불가능한 항목은 수동 검증 결과를 기록한다.

## 19. 작업 및 이력 관리

### TASKS.md

- Phase 진행 상태
- 완료 체크리스트
- 다음 작업
- 차단 사항

### CHANGELOG.md

- 주요 기능 추가
- 중요한 기능 변경
- 중요한 오류 수정
- 보안 개선

### 날짜별 작업 로그

`docs/worklogs/YYYY-MM/YYYY-MM-DD.md`

- 작업 시각
- Phase
- 변경 파일
- 테스트
- 문제 및 해결
- 남은 작업

## 20. 아키텍처 원칙

- 단순한 구조
- 프론트엔드와 서버 책임 분리
- 데이터베이스 비밀정보 보호
- 공개 API 보안 우선
- 불필요한 의존성 최소화
- PC 및 모바일 호환
- 무료 운영 한계 고려
- 기능별 단계적 개발
