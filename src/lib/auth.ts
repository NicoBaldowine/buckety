import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  name?: string
}

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, name?: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0]
          }
        }
      })

      if (error) {
        console.error('Sign up error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, user: data.user, session: data.session }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      console.log('🔐 Auth service: Starting signIn with:', { email, password: '***' })
      console.log('🔐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      
      // Sign in directly without timeout wrapper for better error handling
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      console.log('🔐 Supabase response:', { data, error })

      if (error) {
        console.error('❌ Sign in error:', error)
        // Better error messages for common issues
        if (error.message?.includes('Failed to fetch')) {
          return { success: false, error: 'Connection error. Please check your internet and try again.' }
        }
        if (error.message?.includes('Invalid login credentials')) {
          return { success: false, error: 'Invalid email or password' }
        }
        return { success: false, error: error.message || 'Sign in failed. Please try again.' }
      }

      // Verify session was created
      if (!data.session) {
        console.error('❌ No session created')
        return { success: false, error: 'No session created' }
      }

      console.log('✅ Sign in successful, returning:', { success: true, user: data.user?.id, session: !!data.session })
      return { success: true, user: data.user, session: data.session }
    } catch (error: any) {
      console.error('💥 Sign in error:', error)
      if (error.message?.includes('Failed to fetch')) {
        return { success: false, error: 'Connection error. Please check your internet and try again.' }
      }
      return { success: false, error: error.message || 'An unexpected error occurred. Please try again.' }
    }
  },

  // Sign in with Google
  async signInWithGoogle() {
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback'
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      })

      if (error) {
        console.error('Google sign in error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Google sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        // Handle invalid refresh token errors
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found') ||
            error.message?.includes('User from sub claim in JWT does not exist')) {
          console.warn('Invalid auth session detected, clearing auth state:', error.message)
          // Clear the invalid session from storage
          await supabase.auth.signOut({ scope: 'local' })
          return null
        }
        console.error('Get session error:', error)
        return null
      }
      return session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  },

  // Get current user
  async getUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        // Handle invalid refresh token errors
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found') ||
            error.message?.includes('User from sub claim in JWT does not exist')) {
          console.warn('Invalid auth session detected, clearing auth state:', error.message)
          // Clear the invalid session from storage
          await supabase.auth.signOut({ scope: 'local' })
          return null
        }
        console.error('Get user error:', error)
        return null
      }
      
      if (!user) {
        return null
      }

      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0]
      }
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  },

  // Verify OTP code
  async verifyOTP(email: string, token: string) {
    try {
      console.log('🔐 Auth service: Starting verifyOTP with:', { email, token, type: 'signup' })
      
      // First try with 'signup' type
      let { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      })

      console.log('🔐 Supabase verifyOtp response (signup):', { data, error })

      // If signup fails, try with 'email' type as fallback
      if (error) {
        console.log('🔄 Trying with "email" type as fallback...')
        const fallbackResult = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email'
        })
        data = fallbackResult.data
        error = fallbackResult.error
        console.log('🔐 Supabase verifyOtp response (email):', { data: fallbackResult.data, error: fallbackResult.error })
      }

      if (error) {
        console.error('❌ OTP verification error:', error)
        // Provide more specific error messages
        let errorMessage = error.message
        if (error.message.includes('Token has expired')) {
          errorMessage = 'Verification code has expired. Please request a new code.'
        } else if (error.message.includes('Invalid token')) {
          errorMessage = 'Invalid verification code. Please check the code and try again.'
        }
        return { success: false, error: errorMessage }
      }

      console.log('✅ OTP verification successful:', { user: data.user?.id, session: !!data.session })
      return { success: true, user: data.user, session: data.session }
    } catch (error) {
      console.error('💥 OTP verification error:', error)
      return { success: false, error: 'An unexpected error occurred during verification. Please try again.' }
    }
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Request password reset (sends OTP to email)
  async requestPasswordReset(email: string) {
    try {
      console.log('🔐 Requesting password reset for:', email)
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) {
        console.error('❌ Password reset request error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Password reset email sent')
      return { success: true }
    } catch (error: any) {
      console.error('💥 Password reset request error:', error)
      return { success: false, error: 'Failed to send reset email. Please try again.' }
    }
  },

  // Verify OTP for password reset
  async verifyPasswordResetOTP(email: string, token: string) {
    try {
      console.log('🔐 Verifying password reset OTP')
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery'
      })
      
      if (error) {
        console.error('❌ OTP verification error:', error)
        let errorMessage = error.message
        if (error.message.includes('Token has expired')) {
          errorMessage = 'Verification code has expired. Please request a new one.'
        } else if (error.message.includes('Invalid token')) {
          errorMessage = 'Invalid verification code. Please check and try again.'
        }
        return { success: false, error: errorMessage }
      }
      
      console.log('✅ OTP verified successfully')
      return { success: true, session: data.session }
    } catch (error: any) {
      console.error('💥 OTP verification error:', error)
      return { success: false, error: 'Verification failed. Please try again.' }
    }
  },

  // Update password (after OTP verification)
  async updatePassword(newPassword: string) {
    try {
      console.log('🔐 Updating password')
      
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        console.error('❌ Password update error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Password updated successfully')
      return { success: true, user: data.user }
    } catch (error: any) {
      console.error('💥 Password update error:', error)
      return { success: false, error: 'Failed to update password. Please try again.' }
    }
  },

  // Update user profile (name)
  async updateUserProfile(updates: { name?: string }) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    })
    
    if (error) {
      console.error('Profile update error:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, user: data.user }
  }
}