import { useMemo } from 'react'

/**
 * Normalizes paginated API response into items array and pagination metadata.
 *
 * @param {Object|Array|null|undefined} response - The API response
 * @param {Object} [fallback] - Fallback pagination values
 * @returns {{ items: Array, pagination: Object, totalCount: number, totalPages: number }}
 */
export function usePaginationData(response, fallback = { page: 1, limit: 10 }) {
  return useMemo(() => {
    const items = Array.isArray(response)
      ? response
      : (Array.isArray(response?.data) ? response.data : [])

    const pagination = response?.pagination || {
      page: fallback.page || 1,
      limit: fallback.limit || 10,
      total: items.length,
      totalPages: Math.ceil(items.length / (fallback.limit || 10)) || 1,
      hasNextPage: false,
      hasPrevPage: false,
    }

    const totalCount = pagination.total !== undefined ? pagination.total : items.length
    const totalPages = pagination.totalPages || 1

    return {
      items,
      pagination,
      totalCount,
      totalPages,
    }
  }, [response, fallback.page, fallback.limit])
}

export default usePaginationData
