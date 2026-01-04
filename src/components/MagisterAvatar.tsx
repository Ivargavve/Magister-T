import frame3 from '../assets/magister-t/frame-3.png'

interface MagisterPortraitProps {
  isThinking?: boolean
}

function MagisterPortrait({ isThinking = false }: MagisterPortraitProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      {/* Portrait container with glow effect */}
      <div
        className={`relative animate-float ${isThinking ? 'animate-thinking' : ''}`}
      >
        {/* Glow background */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-3xl scale-110" />

        {/* Portrait image */}
        <div className="relative w-56 h-56 rounded-3xl overflow-hidden portrait-glow glow-subtle">
          <img
            src={frame3}
            alt="Magister T"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Status indicator */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card">
            <div
              className={`w-2 h-2 rounded-full ${
                isThinking ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
              }`}
            />
            <span className="text-xs text-dark-300 font-medium">
              {isThinking ? 'Funderar...' : 'Redo'}
            </span>
          </div>
        </div>
      </div>

      {/* Name and description */}
      <div className="mt-8 text-center">
        <h3 className="text-xl font-semibold gradient-text">Magister T</h3>
        <p className="mt-2 text-sm text-dark-500 max-w-[200px]">
          Din guide till att tanka sjalv
        </p>
      </div>

      {/* Thinking indicator when loading */}
      {isThinking && (
        <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-xl glass">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 typing-dot" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 typing-dot" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 typing-dot" />
          </div>
          <span className="text-sm text-dark-400">Tanker...</span>
        </div>
      )}
    </div>
  )
}

export default MagisterPortrait
