import type { ReactNode } from 'react'

import './Header.css'

interface NavItem {
  label: string
  to: string
  external?: boolean
}

interface User {
  name: string | null
  email: string
  picture: string | null
}

interface HeaderProps {
  navItems: NavItem[]
  user?: User | null
  onLogin?: () => void
  onLogout?: () => void
  renderLink?: (item: NavItem) => ReactNode
}

function Header({ navItems, user, onLogin, onLogout, renderLink }: HeaderProps) {
  const defaultRenderLink = (item: NavItem) => (
    <a href={item.to}>{item.label}</a>
  )

  const linkRenderer = renderLink || defaultRenderLink

  return (
    <header className="header">
      <nav className="nav">
        {navItems.map((item) => (
          <div key={item.to} className="nav-item">
            {item.external ? (
              <a href={item.to}>{item.label}</a>
            ) : (
              linkRenderer(item)
            )}
          </div>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name || 'User'}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm">{user.name || user.email}</span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                >
                  로그아웃
                </button>
              )}
            </>
          ) : onLogin ? (
            <button
              onClick={onLogin}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
            >
              Google로 로그인
            </button>
          ) : null}
        </div>
      </nav>
    </header>
  )
}

export { Header }
export type { HeaderProps, NavItem, User }
