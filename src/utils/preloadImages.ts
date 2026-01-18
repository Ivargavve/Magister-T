// Centralized image preloading utility
// Preloads critical images to prevent flash of unstyled content on first visit

// Import all critical images that need preloading (WebP format for better compression)
import classroomBackground from '../assets/classlighter.webp'
import sidebarBackground from '../assets/sidebarbackground.webp'
import chatBackgroundPaper from '../assets/chatbackgroundpaper.webp'
import chalkboard from '../assets/chalkboard.webp'
import chatHistoryPaper from '../assets/chathistorypaper.webp'
import topOfChatPlank from '../assets/topofchatplank.webp'

// MagisterAvatar images
import original1 from '../assets/magister-t/original12_new.webp'
import original2 from '../assets/magister-t/original22_new.webp'
import reading from '../assets/magister-t/read2_new.webp'
import ideaBubble from '../assets/magister-t/idea2_new.webp'
import wink from '../assets/magister-t/wink2_new.webp'
import blink from '../assets/magister-t/blink2_new.webp'
import pelare from '../assets/magister-t/pelare.webp'

// All images to preload, ordered by priority (most critical first)
const imagesToPreload = [
  // Critical - visible immediately on page load
  classroomBackground,
  sidebarBackground,
  chalkboard,

  // High priority - visible shortly after load
  chatHistoryPaper,
  topOfChatPlank,
  chatBackgroundPaper,

  // MagisterAvatar images - large but important for UX
  original1,
  original2,
  pelare,
  reading,
  ideaBubble,
  wink,
  blink,
]

/**
 * Preloads all critical images for the application.
 * Call this as early as possible in the app lifecycle.
 */
export function preloadImages(): void {
  imagesToPreload.forEach(src => {
    const img = new Image()
    img.src = src
  })
}

/**
 * Preloads images with a Promise that resolves when all images are loaded.
 * Useful if you want to show a loading state until images are ready.
 */
export function preloadImagesAsync(): Promise<void[]> {
  return Promise.all(
    imagesToPreload.map(src => {
      return new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => resolve() // Don't fail on error, just continue
        img.src = src
      })
    })
  )
}

export default preloadImages
