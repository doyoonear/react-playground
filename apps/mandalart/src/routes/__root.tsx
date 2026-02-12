import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Link } from '@tanstack/react-router'
import { useEffect } from 'react'

import { Header } from '@react-playground/ui'
import type { NavItem } from '@react-playground/ui'
import { useAuthStore } from '../stores/auth'

import appCss from '../styles.css?url'

const navItems: NavItem[] = [
  { label: 'Home', to: 'http://localhost:3000', external: true },
  { label: 'Mandalart', to: '/' },
]

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Mandalart Chart',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { user, login, logout, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Header
          navItems={navItems}
          user={user}
          onLogin={login}
          onLogout={logout}
          renderLink={(item) => <Link to={item.to}>{item.label}</Link>}
        />
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
