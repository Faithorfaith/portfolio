import { createClient } from './supabase/client'

// Cache for data fetching with deduplication
type CacheEntry<T> = {
  data: T
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheEntry<any>>()

// Deduplicate concurrent requests
const requestMap = new Map<string, Promise<any>>()

/**
 * Fetch data with caching, deduplication, and TTL
 * Prevents N+1 queries and redundant API calls
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> {
  // Check cache first
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data
  }

  // Deduplicate concurrent requests
  if (requestMap.has(key)) {
    return requestMap.get(key)!
  }

  // Create new request
  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, timestamp: Date.now(), ttl })
      requestMap.delete(key)
      return data
    })
    .catch((err) => {
      requestMap.delete(key)
      throw err
    })

  requestMap.set(key, promise)
  return promise
}

/**
 * Batch load multiple Supabase queries in parallel with caching
 * Reduces total database queries
 */
export async function batchFetch(
  queries: Array<{
    key: string
    table: string
    select?: string
    where?: Record<string, any>
  }>
) {
  const supabase = createClient()
  
  return Promise.all(
    queries.map((query) =>
      fetchWithCache(
        query.key,
        async () => {
          let q = supabase.from(query.table).select(query.select || '*')
          
          if (query.where) {
            Object.entries(query.where).forEach(([key, value]) => {
              q = q.eq(key, value)
            })
          }
          
          const { data, error } = await q
          if (error) throw error
          return data
        },
        5 * 60 * 1000 // 5 minute cache
      )
    )
  )
}

/**
 * Clear cache for a specific key or all cache
 */
export function clearCache(key?: string) {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

/**
 * Prefetch data to warm up the cache
 */
export async function prefetch(
  key: string,
  fetcher: () => Promise<any>,
  ttl?: number
) {
  return fetchWithCache(key, fetcher, ttl).catch(() => {
    // Silently fail prefetch
  })
}
