import { useEffect } from 'react'

/**
 * Custom hook for detecting swipe-back gestures
 * @param {Function} onSwipeBack - Callback function to execute on swipe back
 * @param {Object} options - Configuration options
 */
export function useSwipeBack(onSwipeBack, options = {}) {
  const {
    threshold = 50, // Minimum distance to trigger swipe
    edgeThreshold = 50, // Distance from left edge to start detection
    enabled = true
  } = options

  useEffect(() => {
    if (!enabled || typeof onSwipeBack !== 'function') return

    let touchStartX = 0
    let touchStartY = 0
    let touchEndX = 0
    let touchEndY = 0
    let isSwipeFromEdge = false

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
      
      // Check if touch started near left edge
      isSwipeFromEdge = touchStartX <= edgeThreshold
    }

    const handleTouchMove = (e) => {
      touchEndX = e.touches[0].clientX
      touchEndY = e.touches[0].clientY
    }

    const handleTouchEnd = () => {
      if (!isSwipeFromEdge) return

      const deltaX = touchEndX - touchStartX
      const deltaY = Math.abs(touchEndY - touchStartY)
      
      // Check if it's a horizontal swipe from left to right
      // and vertical movement is minimal (to distinguish from scrolling)
      if (deltaX > threshold && deltaY < threshold * 2) {
        onSwipeBack()
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onSwipeBack, threshold, edgeThreshold, enabled])
}
