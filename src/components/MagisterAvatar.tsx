import { useState, useEffect, useRef } from 'react'
import original1 from '../assets/magister-t/original12_new.png'
import original2 from '../assets/magister-t/original22_new.png'
import reading from '../assets/magister-t/read2_new.png'
import ideaBubble from '../assets/magister-t/idea2_new.png'
import wink from '../assets/magister-t/wink2_new.png'
import blink from '../assets/magister-t/blink2_new.png'
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
const preloadImages = [original1, original2, reading, ideaBubble, wink, blink, pelare]
preloadImages.forEach(src => {
  const img = new Image()
  img.src = src
})

// Minimum time between blinks in ms
const MIN_BLINK_COOLDOWN = 3000

function MagisterPortrait({ isThinking = false, isResponding = false, showWink = false }: MagisterPortraitProps) {
  const [currentOriginal, setCurrentOriginal] = useState<1 | 2>(1)
  const [avatarState, setAvatarState] = useState<AvatarState>('idle')
  const [isBlinking, setIsBlinking] = useState(false)
  const winkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ideaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const readingStartTimeRef = useRef<number>(0)
  const ideaStartTimeRef = useRef<number>(0)
  const minTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastBlinkTimeRef = useRef<number>(0)
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blinkDurationRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      // Random interval between 7-22 seconds
      const interval = Math.random() * 15000 + 7000
      return setTimeout(() => {
        setCurrentOriginal(prev => prev === 1 ? 2 : 1)
        scheduleSwitch()
      }, interval)
    }

    const timeoutId = scheduleSwitch()
    return () => clearTimeout(timeoutId)
  }, [avatarState])

  // Random blinking during idle - uses refs to prevent multiple instances
  useEffect(() => {
    // Clear any existing blink timeouts
    if (blinkTimeoutRef.current) {
      clearTimeout(blinkTimeoutRef.current)
      blinkTimeoutRef.current = null
    }
    if (blinkDurationRef.current) {
      clearTimeout(blinkDurationRef.current)
      blinkDurationRef.current = null
    }

    if (avatarState !== 'idle') {
      setIsBlinking(false)
      return
    }

    const scheduleBlink = () => {
      // Random interval between 6-12 seconds
      const interval = Math.random() * 6000 + 6000

      blinkTimeoutRef.current = setTimeout(() => {
        // Check cooldown - don't blink if we blinked too recently
        const timeSinceLastBlink = Date.now() - lastBlinkTimeRef.current
        if (timeSinceLastBlink < MIN_BLINK_COOLDOWN) {
          // Schedule next attempt after cooldown expires
          scheduleBlink()
          return
        }

        // Do the blink
        lastBlinkTimeRef.current = Date.now()
        setIsBlinking(true)

        // End blink after 250ms
        blinkDurationRef.current = setTimeout(() => {
          setIsBlinking(false)
          // Schedule next blink
          scheduleBlink()
        }, 250)
      }, interval)
    }

    scheduleBlink()

    return () => {
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current)
        blinkTimeoutRef.current = null
      }
      if (blinkDurationRef.current) {
        clearTimeout(blinkDurationRef.current)
        blinkDurationRef.current = null
      }
    }
  }, [avatarState])

  // Get the current image based on state
  const getCurrentImage = () => {
    switch (avatarState) {
      case 'reading':
        return reading
      case 'idea':
        // In idea state, show idle image (bubble is overlaid separately)
        if (isBlinking) return blink
        return currentOriginal === 1 ? original1 : original2
      case 'wink':
        return wink
      case 'idle':
      default:
        // Show blink image briefly during idle
        if (isBlinking) return blink
        return currentOriginal === 1 ? original1 : original2
    }
  }

  // Check if we should show the idea bubble
  const showIdeaBubble = avatarState === 'idea'

  return (
    <div className="relative h-full w-full overflow-visible z-20">
      {/* Container positioned at bottom right - scales with viewport height */}
      <div className="absolute bottom-0 left-1/2 -translate-x-[43%] max-h-[95vh]" style={{ height: 'min(720px, 90vh)' }}>
        {/* Pillar - behind avatar */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-0" style={{ width: 'min(500px, 62vh)' }}>
          <img
            src={pelare}
            alt=""
            className="w-full object-contain"
          />
        </div>
        {/* Avatar - in front of pillar, scales with container */}
        <div className="relative z-10 mb-8 h-full aspect-square">
          <img
            src={getCurrentImage()}
            alt="Magister T"
            className="w-full h-full object-contain"
          />
          {/* Idea bubble overlay */}
          {showIdeaBubble && (
            <img
              src={ideaBubble}
              alt=""
              className="absolute inset-0 w-full h-full object-contain animate-fade-in"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default MagisterPortrait
