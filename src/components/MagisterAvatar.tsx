import { useState, useEffect, useRef } from 'react'
import original1 from '../assets/magister-t/original1.png'
import original2 from '../assets/magister-t/original2.png'
import reading from '../assets/magister-t/reading.png'
import idea from '../assets/magister-t/idea.png'
import wink from '../assets/magister-t/wink.png'

type AvatarState = 'idle' | 'reading' | 'idea' | 'wink'

interface MagisterPortraitProps {
  isThinking?: boolean      // User sent message, waiting for response
  isResponding?: boolean    // AI is streaming response
  showWink?: boolean        // Show wink (user said thanks etc)
}

function MagisterPortrait({ isThinking = false, isResponding = false, showWink = false }: MagisterPortraitProps) {
  const [currentOriginal, setCurrentOriginal] = useState<1 | 2>(1)
  const [avatarState, setAvatarState] = useState<AvatarState>('idle')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const winkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ideaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasRespondingRef = useRef(false)

  // Handle state transitions based on props
  useEffect(() => {
    // Clear any pending wink timeout when state changes
    if (winkTimeoutRef.current) {
      clearTimeout(winkTimeoutRef.current)
      winkTimeoutRef.current = null
    }

    if (showWink) {
      // Show wink for 2 seconds then return to idle
      setAvatarState('wink')
      winkTimeoutRef.current = setTimeout(() => {
        setAvatarState('idle')
      }, 2000)
    } else if (isThinking && !isResponding) {
      // User sent message, AI is thinking
      setAvatarState('reading')
      wasRespondingRef.current = false
    } else if (isResponding) {
      // AI started responding - show idea
      if (!wasRespondingRef.current) {
        setAvatarState('idea')
        wasRespondingRef.current = true

        // After 2 seconds of responding, go back to idle
        if (ideaTimeoutRef.current) {
          clearTimeout(ideaTimeoutRef.current)
        }
        ideaTimeoutRef.current = setTimeout(() => {
          setAvatarState('idle')
        }, 2000)
      }
    } else {
      // Back to idle
      setAvatarState('idle')
      wasRespondingRef.current = false
    }

    return () => {
      if (winkTimeoutRef.current) {
        clearTimeout(winkTimeoutRef.current)
      }
      if (ideaTimeoutRef.current) {
        clearTimeout(ideaTimeoutRef.current)
      }
    }
  }, [isThinking, isResponding, showWink])

  // Random switching between original1 and original2 when idle
  useEffect(() => {
    if (avatarState !== 'idle') return

    const scheduleSwitch = () => {
      // Random interval between 5-20 seconds
      const interval = Math.random() * 15000 + 5000
      return setTimeout(() => {
        setIsTransitioning(true)
        setTimeout(() => {
          setCurrentOriginal(prev => prev === 1 ? 2 : 1)
          setIsTransitioning(false)
        }, 150) // Short fade transition
        scheduleSwitch()
      }, interval)
    }

    const timeoutId = scheduleSwitch()
    return () => clearTimeout(timeoutId)
  }, [avatarState])

  // Get the current image based on state
  const getCurrentImage = () => {
    switch (avatarState) {
      case 'reading':
        return reading
      case 'idea':
        return idea
      case 'wink':
        return wink
      case 'idle':
      default:
        return currentOriginal === 1 ? original1 : original2
    }
  }

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className={`w-56 h-56 overflow-hidden transition-opacity duration-150 ${isTransitioning ? 'opacity-80' : 'opacity-100'}`}>
        <img
          src={getCurrentImage()}
          alt="Magister T"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}

export default MagisterPortrait
