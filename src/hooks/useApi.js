import { useState, useCallback } from 'react'
import { getApiUrl } from '../utils/config'

/**
 * Custom hook for making API calls with loading and error states
 */
export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const request = useCallback(async (method, endpoint, data = null) => {
    setLoading(true)
    setError(null)

    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data)
      }

      const response = await fetch(`${getApiUrl()}${endpoint}`, options)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setLoading(false)
      return { success: true, data: result }
    } catch (err) {
      setError(err.message)
      setLoading(false)
      return { success: false, error: err.message }
    }
  }, [])

  const get = useCallback((endpoint) => request('GET', endpoint), [request])
  const post = useCallback((endpoint, data) => request('POST', endpoint, data), [request])
  const put = useCallback((endpoint, data) => request('PUT', endpoint, data), [request])
  const del = useCallback((endpoint) => request('DELETE', endpoint), [request])

  return { loading, error, get, post, put, delete: del }
}
