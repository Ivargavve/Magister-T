interface HeaderProps {
  onClear: () => void
  hasMessages: boolean
}

function Header({ onClear, hasMessages }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-dark-700 bg-dark-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
          T
        </div>
        <div>
          <h1 className="text-lg font-semibold text-dark-100">Magister T</h1>
          <p className="text-xs text-dark-400">Din guide till att tänka själv</p>
        </div>
      </div>
      {hasMessages && (
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-700 rounded-md transition-colors"
        >
          Ny chatt
        </button>
      )}
    </header>
  )
}

export default Header
