import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    console.log('=== CUSTOM LOGIN ENDPOINT ===')
    console.log('Email:', email)
    console.log('Password:', password)
    
    // Jednoduchá validace
    if (email === 'admin' && password === 'admin') {
      console.log('✅ Login successful!')
      
      // Vytvořit jednoduchý session token
      const sessionData = {
        user: {
          id: '1',
          email: 'admin',
          name: 'Admin User',
          role: 'ADMIN'
        },
        loginTime: new Date().toISOString()
      }
      
      // Vytvořit response s cookie
      const response = NextResponse.json({
        success: true,
        message: 'Přihlášení úspěšné!',
        user: sessionData.user
      })
      
      // Nastavit session cookie
      response.cookies.set('user-session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: false, // Pro HTTP development
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 // 24 hours
      })
      
      return response
    } else {
      console.log('❌ Login failed')
      return NextResponse.json({
        success: false,
        message: 'Neplatné přihlašovací údaje'
      }, { status: 401 })
    }
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({
      success: false,
      message: 'Došlo k chybě při přihlašování'
    }, { status: 500 })
  }
}
