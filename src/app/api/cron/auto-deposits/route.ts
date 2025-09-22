import { NextRequest, NextResponse } from 'next/server'
import { autoDepositService, supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ CRON: Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🕐 CRON: Starting auto deposit execution for all users')
    
    // Get all users who have active auto deposits
    const { data: autoDeposits, error } = await supabase
      .from('auto_deposits')
      .select('user_id')
      .eq('status', 'active')
      .lte('next_execution_date', new Date().toISOString())
    
    if (error) {
      console.error('❌ CRON: Error fetching auto deposits:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(autoDeposits?.map(ad => ad.user_id) || [])]
    console.log(`👥 CRON: Found ${uniqueUserIds.length} users with due auto deposits`)

    let totalExecuted = 0
    const results = []

    // Execute auto deposits for each user
    for (const userId of uniqueUserIds) {
      try {
        console.log(`🔄 CRON: Processing auto deposits for user: ${userId}`)
        const result = await autoDepositService.executeAutoDeposits(userId)
        
        if (result.executed > 0) {
          console.log(`✅ CRON: Executed ${result.executed} auto deposits for user: ${userId}`)
          totalExecuted += result.executed
        }
        
        results.push({
          userId,
          executed: result.executed,
          success: result.success
        })
      } catch (userError) {
        console.error(`❌ CRON: Error processing user ${userId}:`, userError)
        results.push({
          userId,
          executed: 0,
          success: false,
          error: userError instanceof Error ? userError.message : 'Unknown error'
        })
      }
    }

    console.log(`🎉 CRON: Completed auto deposit execution. Total executed: ${totalExecuted}`)

    return NextResponse.json({
      success: true,
      totalExecuted,
      usersProcessed: uniqueUserIds.length,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ CRON: Fatal error in auto deposit execution:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// For manual testing - remove in production
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 MANUAL TEST: Running auto deposit cron job manually')
    
    // Get all users who have active auto deposits
    const { data: autoDeposits, error } = await supabase
      .from('auto_deposits')
      .select('user_id')
      .eq('status', 'active')
    
    if (error) {
      console.error('❌ TEST: Error fetching auto deposits:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const uniqueUserIds = [...new Set(autoDeposits?.map(ad => ad.user_id) || [])]
    console.log(`👥 TEST: Found ${uniqueUserIds.length} users with active auto deposits`)

    let totalExecuted = 0
    const results = []

    for (const userId of uniqueUserIds) {
      try {
        console.log(`🔄 TEST: Processing auto deposits for user: ${userId}`)
        const result = await autoDepositService.executeAutoDeposits(userId)
        
        totalExecuted += result.executed
        results.push({
          userId,
          executed: result.executed,
          success: result.success
        })
      } catch (userError) {
        console.error(`❌ TEST: Error processing user ${userId}:`, userError)
        results.push({
          userId,
          executed: 0,
          success: false,
          error: userError instanceof Error ? userError.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      totalExecuted,
      usersProcessed: uniqueUserIds.length,
      results,
      timestamp: new Date().toISOString(),
      mode: 'manual_test'
    })

  } catch (error) {
    console.error('❌ TEST: Fatal error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}