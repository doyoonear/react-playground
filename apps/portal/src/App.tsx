import { Header } from '@react-playground/ui'
import type { NavItem } from '@react-playground/ui'
import '@react-playground/ui/Header.css'

const MANDALART_URL = import.meta.env.VITE_MANDALART_URL || 'http://localhost:3001'

const navItems: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Mandalart', to: MANDALART_URL, external: true },
]

function App() {
  return (
    <>
      <Header navItems={navItems} />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              React Playground
            </h1>
            <p className="text-xl text-gray-600">
              다양한 미니 프로젝트들을 실험하고 테스트하는 공간입니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <a
              href={MANDALART_URL}
              className="block p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-green-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  만다라트 차트
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                목표를 9x9 그리드로 시각화하고 관리하는 만다라트 차트 도구
              </p>
              <div className="flex items-center text-green-600 font-medium">
                시작하기
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

export { App }
