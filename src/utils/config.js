/**
 * Configuration utilities for the application
 */

/**
 * Validate if a URL is a valid HTTP/HTTPS URL
 */
const isValidUrl = (urlString) => {
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch (e) {
    return false
  }
}

/**
 * Get the API base URL from environment variables
 * Supports both full URL override and host+port configuration
 */
export const getApiUrl = () => {
  // Allow full API URL override for production/distributed environments
  const apiUrl = import.meta.env.VITE_API_URL
  if (apiUrl) {
    if (!isValidUrl(apiUrl)) {
      console.warn(`Invalid VITE_API_URL: ${apiUrl}. Using default configuration.`)
    } else {
      return apiUrl
    }
  }
  
  // Fall back to port-based configuration for local development
  const host = import.meta.env.VITE_API_HOST || 'localhost'
  const port = import.meta.env.VITE_API_PORT || '5000'
  return `http://${host}:${port}/api`
}

export default {
  getApiUrl,
}
