# DevBox

Vue 3 + Vite 기반 개발자 도구 모음과 Vercel Functions / Neon PostgreSQL 기반 공개 북마크 관리 앱입니다.

## 요구 환경

- Node.js 22.18.0 이상(22.x) 또는 24.12.0 이상
- npm

## 로컬 개발

```bash
npm install
npm run dev
```

Vite 개발 서버는 프런트엔드만 제공합니다. 북마크 API까지 로컬에서 실행하려면 Vercel CLI와 프로젝트 환경변수가 필요합니다.

```bash
npx vercel dev
```

## 빌드 및 테스트

```bash
npm run build
npm test
```

Vercel은 `vercel.json`에 지정한 `npm run build` 명령으로 빌드하고 `dist` 디렉터리를 정적 출력물로 사용합니다. 루트 `api/`의 파일은 Vercel Functions로 배포됩니다.

## 환경변수

`.env.example`을 참고해 로컬 환경을 구성합니다. 실제 값은 저장소에 커밋하지 않습니다.

| 변수 | 용도 |
|---|---|
| `DATABASE_URL` | 제한된 권한의 Neon 런타임 역할 연결 문자열 |
| `RATE_LIMIT_SECRET` | IP 주소 해시를 위한 임의의 비밀값(최소 32자) |
| `PUBLIC_WRITES_ENABLED` | 정확히 `true`일 때만 북마크 쓰기 API 허용; 기본값은 비활성 |

Vercel 프로젝트의 **Settings → Environment Variables**에서 Production 및 Preview에 필요한 값을 각각 설정합니다. 비밀값을 `VITE_` 접두사로 만들거나 프런트엔드 코드에 넣지 마세요. `PUBLIC_WRITES_ENABLED`는 기본적으로 `false`로 두고, 공개 쓰기 활성화 전에는 [AGENTS.md](AGENTS.md)와 [ARCHITECTURE.md](ARCHITECTURE.md)의 공개 API 보안 및 복구 조건을 완료해야 합니다.

## Vercel 배포 준비

1. Vercel에서 이 저장소를 새 프로젝트로 가져옵니다.
2. Root Directory가 저장소 루트인지 확인합니다.
3. Framework Preset은 Vite 또는 Other로 선택하고, Build Command `npm run build`, Output Directory `dist`를 확인합니다. `vercel.json`이 이 값을 지정합니다.
4. 배포 환경변수를 설정합니다. 실제 DB 연결 문자열은 운영용 Neon 제한 런타임 역할을 사용합니다.
5. 먼저 Preview 배포에서 SPA 직접 경로, `/api` 함수 응답, 환경변수 및 보안 설정을 검증합니다.
6. 계정 사용량·복구 조건과 보안 차단 기준을 확인한 뒤 Production 배포 및 공개 쓰기 여부를 결정합니다.

이 저장소만으로는 Vercel 프로젝트 연결, 계정 사용량/요금 한도, 운영 데이터 복구 가능 기간을 확인할 수 없습니다. 해당 계정 확인 및 실제 Preview/Production 배포는 별도 작업입니다.
