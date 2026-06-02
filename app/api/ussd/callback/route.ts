import { NextRequest, NextResponse } from 'next/server'

// Handles all USSD menu interactions from Moolre.
// Must respond within 5 seconds or the session dies.
// Reads/writes ussd_sessions table to track session state.
// Returns { session_operation: 'continue' | 'end', session_msg: string }.
// Validates all input — never assume valid data from user.
// Menu states: main_menu → book_session | view_plan | pay_sessions | session_balance
export async function POST(_req: NextRequest) {
  return NextResponse.json({
    session_operation: 'end',
    session_msg: 'Service temporarily unavailable.',
  })
}
