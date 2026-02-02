# Cloudflare Workers 배포 가이드

> **Stack**: TanStack Start (React SSR Framework)
> **Platform**: Cloudflare Workers

## 개요

이 프로젝트는 TanStack Start를 사용하며, Cloudflare Workers에 배포하도록 구성되어 있습니다.

## 배포 명령어

```bash
pnpm run deploy
```

이 명령어는 다음을 수행합니다:
1. 프로젝트 빌드 (`pnpm build`)
2. Cloudflare Workers에 배포 (`wrangler deploy`)

## 주요 설정 파일

### 1. `wrangler.jsonc`

Cloudflare Workers 설정 파일입니다.

```jsonc
{
  "$schema": "https://developers.cloudflare.com/workers/wrangler/configuration/",
  "name": "react-playground",
  "compatibility_date": "2025-02-01",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry"
}
```

**핵심 설정:**
- `main`: `"@tanstack/react-start/server-entry"` - TanStack Start의 서버 엔트리 포인트
- `compatibility_flags`: `["nodejs_compat"]` - Node.js 호환성 활성화

### 2. `vite.config.ts`

Vite 빌드 설정입니다.

```typescript
import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
// ...

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: { name: 'ssr' },
    }),
    tanstackStart(),
    // ...
  ],
})
```

**핵심 설정:**
- `cloudflare({ viteEnvironment: { name: 'ssr' } })` - Cloudflare SSR 환경 설정
- 플러그인 순서 중요: `cloudflare()` → `tanstackStart()` → `viteReact()`

### 3. `package.json`

배포 스크립트 설정입니다.

```json
{
  "scripts": {
    "build": "vite build",
    "deploy": "pnpm build && wrangler deploy --config dist/server/wrangler.json"
  },
  "devDependencies": {
    "@cloudflare/vite-plugin": "^1.22.1",
    "wrangler": "^4.61.1"
  }
}
```

## 빌드 출력

빌드 시 다음 구조로 출력됩니다:

```
dist/
├── client/           # 클라이언트 assets (CSS, JS)
└── server/           # Worker 코드
    ├── index.js      # Worker 엔트리
    ├── wrangler.json # 자동 생성된 Wrangler 설정
    └── assets/       # SSR 모듈들
```

## 첫 배포 시 설정

### 1. Cloudflare 계정 연결

```bash
npx wrangler login
```

브라우저가 열리면 Cloudflare 계정으로 로그인하고 권한을 승인합니다.

### 2. 계정 확인

```bash
npx wrangler whoami
```

로그인된 계정과 권한을 확인할 수 있습니다.

## 환경 변수 설정

### 개발 환경 (.dev.vars)

로컬 개발 시 사용되는 환경 변수:

```env
# .dev.vars
MY_VAR=local_value
```

### 프로덕션 환경

Cloudflare 대시보드 또는 CLI로 설정:

```bash
npx wrangler secret put MY_SECRET
```

## 트러블슈팅

### 404 에러 발생 시

**증상**: 배포 후 사이트 접속 시 404 에러

**원인**:
- `wrangler.jsonc`에 `main` 필드 누락
- Cloudflare 플러그인 설정 누락

**해결**:
1. `wrangler.jsonc`에 `"main": "@tanstack/react-start/server-entry"` 추가
2. `vite.config.ts`에서 `cloudflare({ viteEnvironment: { name: 'ssr' } })` 설정 확인

### 빌드 오류 발생 시

**증상**: `The provided Wrangler config main field doesn't point to an existing file`

**해결**: `wrangler.jsonc`에서 물리적 파일 경로 대신 `@tanstack/react-start/server-entry` 사용

## 참고 자료

- [TanStack Start 공식 문서](https://tanstack.com/start/latest)
- [Cloudflare Workers 문서](https://developers.cloudflare.com/workers/)
- [Cloudflare Vite Plugin](https://developers.cloudflare.com/workers/vite-plugin/)
- [TanStack Start + Cloudflare 예제](https://github.com/TanStack/router/tree/main/examples/react/start-basic-cloudflare)

## 배포 URL

- **Production**: https://react-playground.doyoonleee.workers.dev
- **Dashboard**: https://dash.cloudflare.com (Workers & Pages 섹션)

## 주의사항

1. **Node.js 호환성**: `compatibility_flags`에 `"nodejs_compat"` 필수
2. **TanStack Start 버전**: v1.138.0 이상 필요
3. **플러그인 순서**: `cloudflare()` 플러그인은 `tanstackStart()` 전에 위치
4. **배포 설정**: `dist/server/wrangler.json` 사용 (빌드 시 자동 생성)
