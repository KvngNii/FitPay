import { NextResponse } from 'next/server'

// Handles all USSD menu interactions from Moolre.
// Must respond within 5 seconds or the session dies.
// Reads/writes ussd_sessions table to track session state.
// Request: { sessionId, new, msisdn, network, message, extension, data }
// Response: { message: string, reply: boolean } — reply:true=continue, reply:false=end
// Validates all input — never assume valid data from user.
// Menu states: main_menu → book_session | view_plan | pay_sessions | session_balance
export async function POST() {
  return NextResponse.json({
    message: 'Service temporarily unavailable.',
    reply: false,
  })
}
