import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/admin'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { isAdmin: false, isSuperAdmin: false },
        { status: 401 }
      )
    }

    return NextResponse.json({
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
    })
  } catch (error) {
    console.error('Error checking admin access:', error)
    return NextResponse.json(
      { isAdmin: false, isSuperAdmin: false },
      { status: 500 }
    )
  }
}