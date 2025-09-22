import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  
  // Since we're using OTP verification instead of deep links,
  // this callback route is no longer needed for email verification.
  // Redirect to login with info message
  return NextResponse.redirect(`${requestUrl.origin}/login?info=otp_verification_required`)
}