import avatar from '../assets/magister-t/original1.png'

interface MagisterSmallAvatarProps {
  isThinking?: boolean
}

/**
 * Small avatar component for use in chat messages
 */
function MagisterSmallAvatar({ isThinking = false }: MagisterSmallAvatarProps) {
  return (
    <div
      className={`relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ${
        isThinking ? 'animate-pulse' : ''
      }`}
    >
      {/* Subtle glow background */}
      <div className="absolute inset-0 bg-magister-500/20 blur-sm" />

      {/* Portrait image */}
      <img
        src={avatar}
        alt="Magister T"
        className="relative w-full h-full object-cover"
      />

      {/* Thinking indicator dot */}
      {isThinking && (
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-amber-400 rounded-full border border-dark-800 animate-pulse" />
      )}
    </div>
  )
}

export default MagisterSmallAvatar
