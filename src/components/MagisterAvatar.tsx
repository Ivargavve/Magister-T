import { useState, useEffect, useRef, useCallback } from 'react'
import original1 from '../assets/magister-t/original1.png'
import original2 from '../assets/magister-t/original2.png'
import reading from '../assets/magister-t/reading.png'
import idea from '../assets/magister-t/idea.png'
import wink from '../assets/magister-t/wink.png'
import blink from '../assets/magister-t/blink.png'
import heart from '../assets/magister-t/heart1.png'
import pelare from '../assets/magister-t/pelare.png'

type AvatarState = 'idle' | 'reading' | 'idea' | 'wink'

interface MagisterPortraitProps {
  isThinking?: boolean      // User sent message, waiting for response
  isResponding?: boolean    // AI is streaming response
  showWink?: boolean        // Show wink (user said thanks etc)
}

// Minimum display times in ms
const MIN_READING_TIME = 1000
const MIN_IDEA_TIME = 1500

// Preload all images on module load
const preloadImages = [original1, original2, reading, idea, wink, blink, heart, pelare]
preloadImages.forEach(src => {
  const img = new Image()
  img.src = src
})

function MagisterPortrait({ isThinking = false, isResponding = false, showWink = false }: MagisterPortraitProps) {
  const [currentOriginal, setCurrentOriginal] = useState<1 | 2>(1)
  const [avatarState, setAvatarState] = useState<AvatarState>('idle')
  const [isBlinking, setIsBlinking] = useState(false)
  const [showHeart, setShowHeart] = useState(false)
  const winkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ideaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const readingStartTimeRef = useRef<number>(0)
  const ideaStartTimeRef = useRef<number>(0)
  const minTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Handle click on avatar - show heart for random duration
  const handleAvatarClick = useCallback(() => {
    // Clear any existing heart timeout
    if (heartTimeoutRef.current) {
      clearTimeout(heartTimeoutRef.current)
    }

    // Show heart
    setShowHeart(true)

    // Random duration between 0.2s and 2s
    const duration = Math.random() * 1800 + 200
    heartTimeoutRef.current = setTimeout(() => {
      setShowHeart(false)
    }, duration)
  }, [])

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
      // User sent message, AI is thinking - show reading
      if (avatarState !== 'reading') {
        setAvatarState('reading')
        readingStartTimeRef.current = Date.now()
      }
    } else if (isResponding) {
      // AI started responding - transition from reading to idea
      if (avatarState === 'reading') {
        // Ensure reading was shown for minimum time
        const readingElapsed = Date.now() - readingStartTimeRef.current
        const remainingReadingTime = Math.max(0, MIN_READING_TIME - readingElapsed)

        if (minTimeoutRef.current) clearTimeout(minTimeoutRef.current)

        minTimeoutRef.current = setTimeout(() => {
          setAvatarState('idea')
          ideaStartTimeRef.current = Date.now()

          // After minimum idea time, go back to idle
          if (ideaTimeoutRef.current) clearTimeout(ideaTimeoutRef.current)
          ideaTimeoutRef.current = setTimeout(() => {
            setAvatarState('idle')
          }, MIN_IDEA_TIME)
        }, remainingReadingTime)
      } else if (avatarState !== 'idea') {
        // Direct to idea if not coming from reading
        setAvatarState('idea')
        ideaStartTimeRef.current = Date.now()

        if (ideaTimeoutRef.current) clearTimeout(ideaTimeoutRef.current)
        ideaTimeoutRef.current = setTimeout(() => {
          setAvatarState('idle')
        }, MIN_IDEA_TIME)
      }
    } else if (!isThinking && !isResponding && !showWink) {
      // Only go to idle if no minimum time requirements are pending
      if (avatarState === 'idea') {
        const ideaElapsed = Date.now() - ideaStartTimeRef.current
        if (ideaElapsed >= MIN_IDEA_TIME) {
          setAvatarState('idle')
        } else {
          // Schedule transition to idle after remaining time
          const remainingTime = MIN_IDEA_TIME - ideaElapsed
          if (ideaTimeoutRef.current) clearTimeout(ideaTimeoutRef.current)
          ideaTimeoutRef.current = setTimeout(() => {
            setAvatarState('idle')
          }, remainingTime)
        }
      } else if (avatarState === 'reading') {
        // If stuck in reading state, go to idle
        const readingElapsed = Date.now() - readingStartTimeRef.current
        if (readingElapsed >= MIN_READING_TIME) {
          setAvatarState('idle')
        } else {
          const remainingTime = MIN_READING_TIME - readingElapsed
          if (minTimeoutRef.current) clearTimeout(minTimeoutRef.current)
          minTimeoutRef.current = setTimeout(() => {
            setAvatarState('idle')
          }, remainingTime)
        }
      } else {
        setAvatarState('idle')
      }
    }

    return () => {
      if (winkTimeoutRef.current) clearTimeout(winkTimeoutRef.current)
      if (ideaTimeoutRef.current) clearTimeout(ideaTimeoutRef.current)
      if (minTimeoutRef.current) clearTimeout(minTimeoutRef.current)
    }
  }, [isThinking, isResponding, showWink, avatarState])

  // Random switching between original1 and original2 when idle
  useEffect(() => {
    if (avatarState !== 'idle') return

    const scheduleSwitch = () => {
      // Random interval between 5-20 seconds
      const interval = Math.random() * 15000 + 5000
      return setTimeout(() => {
        setCurrentOriginal(prev => prev === 1 ? 2 : 1)
        scheduleSwitch()
      }, interval)
    }

    const timeoutId = scheduleSwitch()
    return () => clearTimeout(timeoutId)
  }, [avatarState])

  // Random blinking during idle
  useEffect(() => {
    if (avatarState !== 'idle') {
      setIsBlinking(false)
      return
    }

    const scheduleBlink = () => {
      // Random interval between 3-10 seconds
      const interval = Math.random() * 7000 + 3000
      return setTimeout(() => {
        setIsBlinking(true)
        // Blink for 200ms
        setTimeout(() => {
          setIsBlinking(false)
        }, 200)
        scheduleBlink()
      }, interval)
    }

    const timeoutId = scheduleBlink()
    return () => clearTimeout(timeoutId)
  }, [avatarState])

  // Get the current image based on state
  const getCurrentImage = () => {
    // Heart takes priority (on click)
    if (showHeart) return heart

    switch (avatarState) {
      case 'reading':
        return reading
      case 'idea':
        return idea
      case 'wink':
        return wink
      case 'idle':
      default:
        // Show blink image briefly during idle
        if (isBlinking) return blink
        return currentOriginal === 1 ? original1 : original2
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Container positioned at bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        {/* Pillar - behind avatar */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 z-0">
          <img
            src={pelare}
            alt=""
            className="w-full object-contain"
          />
        </div>
        {/* Avatar - in front of pillar, clickable */}
        <div
          className="relative w-64 h-64 z-10 mb-16 cursor-pointer"
          onClick={handleAvatarClick}
        >
          <img
            src={getCurrentImage()}
            alt="Magister T"
            className={`w-full h-full object-contain ${showHeart ? 'scale-110' : ''}`}
          />
        </div>
      </div>
    </div>
  )
}

export default MagisterPortrait
