import { createFileRoute } from '@tanstack/react-router'
import { useMandalartStore } from '../stores/mandalart'
import { useState } from 'react'

export const Route = createFileRoute('/mandalart')({ component: Mandalart })

function Mandalart() {
  const { data, updateMetadata, updateCell, resetSection, resetAll } = useMandalartStore()
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState('')
  const [hoveredSection, setHoveredSection] = useState<number | null>(null)
  const [showSaveMessage, setShowSaveMessage] = useState(false)

  const handleCellClick = (cellId: string, currentValue: string) => {
    setEditingCell(cellId)
    setTempValue(currentValue)
  }

  const handleSave = () => {
    if (editingCell) {
      updateCell(editingCell, tempValue)
      setEditingCell(null)
      setTempValue('')
    }
  }

  const handleCancel = () => {
    setEditingCell(null)
    setTempValue('')
  }

  const handleBlur = () => {
    // 모바일에서만 포커스를 잃으면 자동 저장
    if (window.innerWidth < 640) { // sm breakpoint
      handleSave()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleSaveMetadata = () => {
    setShowSaveMessage(true)
    setTimeout(() => setShowSaveMessage(false), 2000)
  }

  const getCellColor = (sectionIndex: number, cellIndex: number) => {
    const isCenter = cellIndex === 4

    // 5번째 섹션 (sectionIndex 4)의 색상
    if (sectionIndex === 4) {
      if (isCenter) {
        return 'bg-[#FFD8DF]' // 가운데는 핑크색
      }
      return 'bg-[#e8f5d0]' // 가운데 제외한 나머지는 연두색
    }

    // 다른 섹션들
    if (isCenter) {
      return 'bg-[#e8f5d0]' // 각 섹션의 가운데는 연두색
    }
    return 'bg-white' // 나머지는 흰색
  }

  const handleResetSection = (sectionIndex: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`섹션 ${sectionIndex + 1}을 초기화하시겠습니까?`)) {
      resetSection(sectionIndex)
    }
  }

  const handleResetAll = () => {
    if (confirm('모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      resetAll()
    }
  }

  const renderSection = (sectionIndex: number) => {
    const startIdx = sectionIndex * 9
    const sectionCells = data.cells.slice(startIdx, startIdx + 9)

    return (
      <div
        className="relative"
        onMouseEnter={() => setHoveredSection(sectionIndex)}
        onMouseLeave={() => setHoveredSection(null)}
      >
        {hoveredSection === sectionIndex && (
          <button
            onClick={(e) => handleResetSection(sectionIndex, e)}
            className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 bg-white border border-gray-300 rounded-full p-1 shadow-md hover:bg-red-50 hover:border-red-300 transition-colors"
            title="섹션 초기화"
          >
            <svg
              className="w-3 h-3 text-gray-600 hover:text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}
        <div className="grid grid-cols-3 gap-0 border-2 border-[#4a7c35]">
          {sectionCells.map((cell) => {
            const isEditing = editingCell === cell.id
            return (
              <div
                key={cell.id}
                className={`${getCellColor(cell.sectionIndex, cell.cellIndex)} border border-[#4a7c35] h-16 sm:h-20 md:h-24 p-1.5 overflow-auto cursor-text relative`}
                onClick={() => !isEditing && handleCellClick(cell.id, cell.value)}
              >
                {isEditing ? (
                  <div className="flex flex-col h-full">
                    <textarea
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      onBlur={handleBlur}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="flex-1 w-full text-center bg-transparent outline-none text-xs sm:text-sm resize-none sm:mb-1"
                    />
                    <div className="hidden sm:flex gap-1 justify-center">
                      <button
                        onClick={handleCancel}
                        className="p-0.5 rounded hover:bg-gray-100 transition-colors"
                        title="취소 (Esc)"
                      >
                        <svg
                          className="w-3.5 h-3.5 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={handleSave}
                        className="p-0.5 rounded hover:bg-green-100 transition-colors"
                        title="저장 (Ctrl+Enter)"
                      >
                        <svg
                          className="w-3.5 h-3.5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-xs sm:text-sm text-center break-words w-full h-full whitespace-pre-wrap">
                    {cell.value}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffef7] py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-end gap-1">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  년도
                </label>
                <input
                  type="text"
                  value={data.year}
                  onChange={(e) => updateMetadata('year', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="2025"
                />
              </div>
              <button
                onClick={handleSaveMetadata}
                className="flex items-center justify-center p-1.5 text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 transition-colors shrink-0"
                title="저장"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 flex items-end gap-1">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  제목
                </label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => updateMetadata('title', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="만다라트 차트"
                />
              </div>
              <button
                onClick={handleSaveMetadata}
                className="flex items-center justify-center p-1.5 text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 transition-colors shrink-0"
                title="저장"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-end gap-1">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                키워드
              </label>
              <input
                type="text"
                value={data.keyword}
                onChange={(e) => updateMetadata('keyword', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="2025년 KEYWORD / 2025년 다짐"
              />
            </div>
            <button
              onClick={handleSaveMetadata}
              className="flex items-center justify-center p-1.5 text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 transition-colors shrink-0"
              title="저장"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          </div>
          <div className="flex items-end gap-1">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                다짐
              </label>
              <input
                type="text"
                value={data.commitment}
                onChange={(e) => updateMetadata('commitment', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="쉽게 포기하지 말고 잇는 한번 해봐자 !!"
              />
            </div>
            <button
              onClick={handleSaveMetadata}
              className="flex items-center justify-center p-1.5 text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 transition-colors shrink-0"
              title="저장"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              전체 초기화
            </button>
          </div>
          {showSaveMessage && (
            <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg text-sm font-medium animate-fade-in">
              저장되었습니다
            </div>
          )}
        </div>

        <div className="bg-white p-2 sm:p-3 rounded-lg shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-1.5 overflow-y-auto snap-y snap-mandatory h-[calc(100vh-220px)] sm:h-auto sm:overflow-visible">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((sectionIndex) => (
              <div key={sectionIndex} className="snap-start sm:snap-none">
                {renderSection(sectionIndex)}
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 text-center mt-2">
            <span className="sm:hidden">셀 클릭하여 수정 | 포커스 잃으면 자동 저장 | Esc로 취소</span>
            <span className="hidden sm:inline">셀 클릭하여 수정 | Ctrl+Enter로 저장 | Esc로 취소</span>
          </div>
        </div>
      </div>
    </div>
  )
}
