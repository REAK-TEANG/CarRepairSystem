import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { prefetchRoute } from '@/lib/prefetch'

/**
 * Returns a function producing event handlers that warm a route's code and data
 * when the user shows intent (hover, keyboard focus, touch) before they click.
 */
export function useRoutePrefetch() {
  const queryClient = useQueryClient()
  return useMemo(
    () => (href) => {
      const warm = () => prefetchRoute(href, queryClient)
      return { onMouseEnter: warm, onFocus: warm, onTouchStart: warm }
    },
    [queryClient]
  )
}
