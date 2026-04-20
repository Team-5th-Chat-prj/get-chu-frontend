# Get-chu 프론트엔드

중고 거래 플랫폼 **Get-chu**의 프론트엔드 레포지토리입니다.

## 기술 스택

- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui (Radix UI 기반 컴포넌트)
- MUI (Material UI)
- Axios
- React Router v7
- React Hook Form
- STOMP (실시간 채팅)
- Motion (애니메이션)
- Recharts (차트)
- React DnD (드래그 앤 드롭)
- date-fns (날짜 처리)
- Sonner (토스트 알림)

## 실행 방법

### 사전 조건

백엔드 서버가 `localhost:8080`에서 실행 중이어야 합니다.
백엔드 실행 방법은 백엔드 레포 README를 참고해주세요.

### 프론트엔드 실행

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:5173` 접속

## 브랜치 전략

| 브랜치 | 설명 |
|---|---|
| `main` | 배포용 브랜치 |
| `develop` | 개발 통합 브랜치 (기본 브랜치) |
| `feature/기능명` | 기능 개발 브랜치 |

```
feature/기능명 → develop → main
```

## 주요 페이지

| 경로 | 페이지 |
|---|---|
| `/` | 홈 (상품 목록) |
| `/search` | 상품 검색 |
| `/products/:id` | 상품 상세 |
| `/chat` | 채팅 목록 |
| `/chat/:chatRoomId` | 채팅방 |
| `/my` | 마이페이지 |
| `/login` | 로그인 |
| `/signup` | 회원가입 |
