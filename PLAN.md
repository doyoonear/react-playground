# 만다라트 차트 - 서버 저장 + Google 로그인 구현 계획

## 현재 상태

- **프론트엔드**: React 19 + TanStack Start + Zustand (localStorage persist)
- **배포**: Cloudflare Workers (`react-playground.doyoonleee.workers.dev`)
- **DB/API/인증**: 없음. 모든 데이터는 브라우저 localStorage에만 저장
- **서버 함수**: `createServerFn` 예시만 존재 (`src/data/demo.punk-songs.ts`), 실사용 없음

## 구현 목표

1. Cloudflare D1 데이터베이스에 만다라트 데이터 저장
2. Google OAuth 로그인으로 사용자 식별 (크로스 디바이스)
3. TanStack Start `createServerFn`으로 API 엔드포인트 구현
4. 로그인한 사용자만 자기 데이터 조회/수정 가능

---

## 1단계: Cloudflare D1 데이터베이스 설정

### 1-1. D1 데이터베이스 생성 (CLI)

```bash
wrangler d1 create mandalart-db
```

출력되는 `database_id`를 기록.

### 1-2. wrangler.jsonc에 D1 바인딩 추가

```jsonc
{
  "$schema": "https://developers.cloudflare.com/workers/wrangler/configuration/",
  "name": "react-playground",
  "compatibility_date": "2025-02-01",
  "compatibility_flags": ["nodejs_compat"],
  "main": "dist/server/server.js",
  "assets": {
    "directory": "dist/client"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "mandalart-db",
      "database_id": "<생성된 ID>"
    }
  ]
}
```

### 1-3. DB 스키마 생성

파일: `schema.sql`

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  picture TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mandalart (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  year TEXT NOT NULL,
  title TEXT DEFAULT '',
  keyword TEXT DEFAULT '',
  commitment TEXT DEFAULT '',
  cells TEXT NOT NULL, -- JSON string of MandalartCell[]
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_mandalart_user_id ON mandalart(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_users_google_id ON users(google_id);
```

적용:
```bash
wrangler d1 execute mandalart-db --file=./schema.sql        # 프로덕션
wrangler d1 execute mandalart-db --file=./schema.sql --local # 로컬
```

---

## 2단계: Google OAuth 설정

### 2-1. Google Cloud Console 설정 (수동)

1. https://console.cloud.google.com 접속
2. 프로젝트 생성 또는 선택
3. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
4. Application type: Web application
5. Authorized redirect URIs 추가:
   - `http://localhost:3000/api/auth/callback/google` (개발)
   - `https://react-playground.doyoonleee.workers.dev/api/auth/callback/google` (프로덕션)
6. Client ID와 Client Secret 기록

### 2-2. 환경 변수 설정

`.dev.vars` (로컬 개발):
```
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
SESSION_SECRET=<random-32-char-string>
```

프로덕션 (Cloudflare Dashboard 또는 CLI):
```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put SESSION_SECRET
```

---

## 3단계: 서버 함수 구현

### 3-1. Cloudflare 환경 헬퍼

파일: `src/server/env.ts`

- Cloudflare Worker 환경에서 D1 바인딩과 환경 변수에 접근하는 헬퍼
- TanStack Start의 서버 컨텍스트에서 `getEvent()` → `event.context.cloudflare.env` 활용

### 3-2. 인증 서버 함수

파일: `src/server/auth.ts`

| 함수 | 메서드 | 설명 |
|------|--------|------|
| `getGoogleAuthURL` | GET | Google OAuth URL 생성 후 리다이렉트 |
| `handleGoogleCallback` | GET | 콜백 처리, 사용자 생성/조회, 세션 쿠키 설정 |
| `getCurrentUser` | GET | 세션 쿠키로 현재 사용자 정보 반환 |
| `logout` | POST | 세션 삭제, 쿠키 제거 |

OAuth 플로우:
1. 프론트에서 `getGoogleAuthURL()` 호출 → Google 로그인 페이지로 리다이렉트
2. Google이 `/api/auth/callback/google`으로 code 전달
3. code → access_token 교환 → Google userinfo API 호출
4. DB에 사용자 저장 (또는 기존 사용자 조회)
5. 세션 생성 → 쿠키에 세션 ID 저장
6. 만다라트 페이지로 리다이렉트

세션 관리:
- 쿠키 이름: `session_id`
- HttpOnly, Secure, SameSite=Lax
- 만료: 30일
- DB sessions 테이블에 저장

### 3-3. 인증 콜백 API 라우트

파일: `src/routes/api/auth/callback/google.ts`

- TanStack Start의 API route로 구현
- GET 요청 처리 → code 파라미터로 토큰 교환 → 유저 upsert → 세션 생성 → 리다이렉트

### 3-4. 만다라트 CRUD 서버 함수

파일: `src/server/mandalart.ts`

| 함수 | 메서드 | 설명 |
|------|--------|------|
| `getMandalart` | GET | 현재 사용자의 만다라트 조회 (year 파라미터로 필터) |
| `saveMandalart` | POST | 만다라트 저장 (upsert - 있으면 업데이트, 없으면 생성) |
| `deleteMandalart` | POST | 만다라트 삭제 |

모든 함수에서:
1. 세션 쿠키 → user_id 확인
2. 인증 안 됐으면 401 반환
3. user_id로 데이터 필터링 (다른 사용자 데이터 접근 불가)

---

## 4단계: 프론트엔드 구현

### 4-1. 인증 스토어

파일: `src/stores/auth.ts`

```typescript
interface AuthStore {
  user: { id: string; name: string; email: string; picture: string } | null
  isLoading: boolean
  checkAuth: () => Promise<void>   // getCurrentUser 서버 함수 호출
  login: () => void                // Google 로그인 시작
  logout: () => Promise<void>      // 로그아웃
}
```

### 4-2. 만다라트 스토어 수정

파일: `src/stores/mandalart.ts` (기존 파일 수정)

변경사항:
- localStorage persist 유지 (오프라인/비로그인 시 폴백)
- 로그인 상태면 서버에서 데이터 로드 → 스토어에 반영
- 셀/메타데이터 변경 시 디바운스로 서버에 자동 저장
- `syncToServer()`, `loadFromServer()` 액션 추가

### 4-3. Header에 로그인 버튼 추가

파일: `src/components/Header.tsx` (수정)

- 비로그인: "Google로 로그인" 버튼
- 로그인: 사용자 프로필 사진 + 이름 + "로그아웃" 버튼

### 4-4. 만다라트 페이지 수정

파일: `src/routes/mandalart.tsx` (수정)

변경사항:
- 페이지 진입 시 `checkAuth()` → 로그인 상태 확인
- 로그인 상태면 서버에서 데이터 로드
- 비로그인이면 기존 localStorage 모드로 동작 (로그인 유도 배너 표시)
- 데이터 변경 시 디바운스로 서버 자동 저장 (1초 후)

---

## 5단계: 빌드/배포

```bash
# 로컬 테스트
pnpm dev

# 타입 체크
pnpm tsc --noEmit

# 빌드
pnpm build

# 배포
pnpm deploy
```

---

## 파일 생성/수정 목록

### 새로 생성
| 파일 | 설명 |
|------|------|
| `schema.sql` | D1 데이터베이스 스키마 |
| `src/server/env.ts` | Cloudflare 환경 접근 헬퍼 |
| `src/server/auth.ts` | 인증 서버 함수 (OAuth + 세션) |
| `src/server/mandalart.ts` | 만다라트 CRUD 서버 함수 |
| `src/stores/auth.ts` | 인증 상태 관리 스토어 |
| `src/routes/api/auth/callback/google.ts` | Google OAuth 콜백 라우트 |

### 수정
| 파일 | 변경 |
|------|------|
| `wrangler.jsonc` | D1 바인딩 추가 |
| `.dev.vars` | Google OAuth 환경 변수 |
| `src/stores/mandalart.ts` | 서버 동기화 로직 추가 |
| `src/components/Header.tsx` | 로그인/로그아웃 UI |
| `src/routes/mandalart.tsx` | 서버 데이터 로드/저장 연동 |
| `src/routes/__root.tsx` | 인증 상태 초기화 |

---

## 사전 준비 (수동)

1. **Google Cloud Console**에서 OAuth 클라이언트 생성 → Client ID, Secret 확보
2. **Cloudflare D1** 생성: `wrangler d1 create mandalart-db` → database_id 확보
3. `.dev.vars`에 환경 변수 입력
4. `schema.sql` 실행하여 테이블 생성
