import { NextRequest, NextResponse } from 'next/server'
import { autoDepositService } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API: Starting auto deposit execution')
    
    // Get user ID from the request body or headers
    const body = await request.json().catch(() => ({}))
    const userId = body.userId
    
    if (!userId) {
      console.log('❌ API: No user ID provided')
      return NextResponse.json({ 
        success: false, 
        error: 'User ID required' 
      }, { status: 400 })
    }
    
    console.log(`🔍 API: Executing auto deposits for user: ${userId}`)
    
    // Execute auto deposits for the user
    const result = await autoDepositService.executeAutoDeposits(userId)
    
    console.log(`✅ API: Auto deposit execution completed:`, result)
    
    return NextResponse.json({
      success: true,
      executed: result.executed,
      message: `Executed ${result.executed} auto deposits`
    })
    
  } catch (error) {
    console.error('❌ API: Error executing auto deposits:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Also support GET for testing/manual triggers
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID required as query parameter' 
      }, { status: 400 })
    }
    
    console.log(`🔍 API (GET): Executing auto deposits for user: ${userId}`)
    
    const result = await autoDepositService.executeAutoDeposits(userId)
    
    return NextResponse.json({
      success: true,
      executed: result.executed,
      message: `Executed ${result.executed} auto deposits`
    })
    
  } catch (error) {
    console.error('❌ API (GET): Error executing auto deposits:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}