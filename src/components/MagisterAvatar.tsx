import { useState, useEffect } from 'react'
import frame1 from '../assets/magister-t/frame-1.png'
import frame2 from '../assets/magister-t/frame-2.png'
import frame3 from '../assets/magister-t/frame-3.png'

interface MagisterAvatarProps {
  size: 'small' | 'large'
  isThinking: boolean
}

const frames = [frame1, frame2, frame3]

function MagisterAvatar({ size, isThinking }: MagisterAvatarProps) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % 3)
    }, isThinking ? 300 : 1000)

    return () => clearInterval(interval)
  }, [isThinking])

  const sizeClasses = size === 'large'
    ? 'w-24 h-24'
    : 'w-8 h-8'

  return (
    <div
      className={`${sizeClasses} rounded-full overflow-hidden flex-shrink-0 ${
        isThinking ? 'animate-thinking' : ''
      }`}
    >
      <img
        src={frames[frame]}
        alt="Magister T"
        className="w-full h-full object-cover"
      />
    </div>
  )
}

export default MagisterAvatar
