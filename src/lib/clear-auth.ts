// Utility to clear all authentication data when encountering invalid refresh token errors
export function clearAllAuthData() {
  if (typeof window === 'undefined') return
  
  console.log('Clearing all authentication data...')
  
  // Clear all Supabase auth tokens
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase')) {
      console.log('Removing:', key)
      localStorage.removeItem(key)
    }
  })
  
  // Clear all session storage as well
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase')) {
      console.log('Removing from session:', key)
      sessionStorage.removeItem(key)
    }
  })
  
  // Clear cookies that might contain auth data
  document.cookie.split(";").forEach(function(c) { 
    const eqPos = c.indexOf("=")
    const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim()
    if (name.includes('sb-') || name.includes('supabase')) {
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;'
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname
    }
  })
  
  console.log('All authentication data cleared. Please refresh the page.')
}

// Auto-clear on load if we detect common auth errors in the URL
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search)
  const error = urlParams.get('error')
  const errorDescription = urlParams.get('error_description')
  
  if (error === 'invalid_request' || 
      errorDescription?.includes('Invalid Refresh Token') ||
      errorDescription?.includes('Refresh Token Not Found')) {
    console.warn('Auth error detected in URL, clearing auth data...')
    clearAllAuthData()
    // Remove error params from URL
    window.history.replaceState({}, document.title, window.location.pathname)
  }
}