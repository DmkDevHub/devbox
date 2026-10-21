# Changelog

사용자에게 의미 있는 기능 추가, 변경, 오류 수정, 보안 개선을 기록한다. 문서 검토나 내부 정리는 날짜별 작업 로그에만 남긴다.

## [Unreleased]

### Added

- Vue 3 + Vite 기반 DevBox 공통 화면, 반응형 내비게이션, 7개 도구 안내 카드, 기본 경로, 다크 모드 설정 및 favicon.
- JSON Formatter, SQL Formatter, Base64 Converter, Date Converter, UUID Generator, Text Tools의 브라우저 내 처리 기능.
- 북마크 목록·상세 조회, 등록·수정·삭제를 위한 Vercel Functions API와 검색·카테고리 필터·페이지네이션. 공개 쓰기는 `PUBLIC_WRITES_ENABLED=true`로 별도 활성화하기 전까지 비활성화.
- 공개 북마크 관리 화면의 검색·카테고리 필터·페이지 이동, 상세 정보, 등록·수정·삭제 폼과 공개 편집·개인정보 주의 안내.

### Changed

### Fixed

### Security

- 공개 북마크 화면에서 `http/https` 링크만 새 탭으로 열고 `noopener noreferrer`를 적용.
- Neon 공유 테이블 기반 IP별 API 호출 제한을 추가하고, 해시 IP·원자 카운터·429/Retry-After·제한기 장애 시 fail closed를 적용.
- 애플리케이션 DB 연결을 테이블 소유권과 DB/역할 생성 권한이 없는 제한 런타임 역할로 분리.

