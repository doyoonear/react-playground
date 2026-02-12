# React Playground

다양한 미니 프로젝트들을 실험하고 테스트하는 pnpm workspace 기반 모노레포입니다.

## 프로젝트 구조

```
react-playground/
├── apps/
│   ├── portal/          Vite SPA — 포털 홈페이지 (port 3000)
│   └── mandalart/       TanStack Start + Cloudflare Workers — 만다라트 차트 (port 3001)
│
├── packages/
│   ├── ui/              @react-playground/ui — 공유 UI 컴포넌트
│   └── config/          @react-playground/config — 공유 빌드 설정
│
├── pnpm-workspace.yaml
└── package.json
```

각 앱은 독립적인 빌드/배포 설정을 가지며, `packages/` 하위의 공유 코드는 빌드 시 각 앱에 번들링됩니다.

## 시작하기

```bash
pnpm install
```

### 개발 서버

```bash
pnpm dev              # 전체 앱 동시 실행
pnpm dev:portal       # 포털만 실행 (port 3000)
pnpm dev:mandalart    # 만다라트만 실행 (port 3001)
```

### 빌드

```bash
pnpm build            # 전체 빌드
pnpm build:portal     # 포털만 빌드
pnpm build:mandalart  # 만다라트만 빌드
```

## 배포

각 앱은 독립적으로 배포됩니다.

```bash
pnpm deploy:mandalart   # Cloudflare Workers에 만다라트 배포
```

**만다라트 Live URL**: https://react-playground.doyoonleee.workers.dev

## 신규 프로젝트 추가

1. `apps/` 하위에 새 디렉토리를 생성합니다.

```
apps/
├── portal/
├── mandalart/
└── new-app/           ← 신규 앱
    ├── package.json
    ├── vite.config.ts
    └── src/
```

2. `package.json`에 워크스페이스 이름을 지정합니다.

```json
{
  "name": "@react-playground/new-app",
  "private": true
}
```

3. 공유 패키지가 필요하면 dependency로 추가합니다.

```json
{
  "dependencies": {
    "@react-playground/ui": "workspace:*",
    "@react-playground/config": "workspace:*"
  }
}
```

4. 루트 `package.json`에 스크립트를 추가합니다.

```json
{
  "scripts": {
    "dev:new-app": "pnpm --filter @react-playground/new-app dev",
    "build:new-app": "pnpm --filter @react-playground/new-app build"
  }
}
```

5. `pnpm install`을 실행하면 워크스페이스 심링크가 자동으로 설정됩니다.

## 공유 패키지

### @react-playground/ui

프레임워크에 비의존적인 공유 UI 컴포넌트입니다. `renderLink` prop을 통해 각 앱의 라우터에 맞는 Link 컴포넌트를 주입할 수 있습니다.

```tsx
import { Header } from '@react-playground/ui'

<Header
  navItems={[{ label: 'Home', to: '/' }]}
  user={user}
  onLogin={login}
  onLogout={logout}
  renderLink={(item) => <Link to={item.to}>{item.label}</Link>}
/>
```

### @react-playground/config

공유 TypeScript, Tailwind CSS, PostCSS 설정입니다.

```json
// tsconfig.json
{ "extends": "@react-playground/config/tsconfig.base.json" }
```

UI 패키지의 Tailwind 클래스가 감지되도록 각 앱의 `tailwind.config.js`에 경로를 추가해야 합니다.

```js
content: [
  './src/**/*.{js,jsx,ts,tsx}',
  '../../packages/ui/src/**/*.{js,jsx,ts,tsx}',
]
```
