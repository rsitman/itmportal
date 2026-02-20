'use client'

import React from 'react'

interface AuthErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface AuthErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class AuthErrorBoundary extends React.Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // console.error('AuthErrorBoundary caught an error:', error, errorInfo)
    
    // Ignore CLIENT_FETCH_ERROR as it's expected behavior
    if (error.message?.includes('CLIENT_FETCH_ERROR')) {
      // console.warn('CLIENT_FETCH_ERROR is normal when not authenticated')
      return
    }
  }

  render() {
    if (this.state.hasError) {
      // For CLIENT_FETCH_ERROR, just render children normally
      if (this.state.error?.message?.includes('CLIENT_FETCH_ERROR')) {
        return this.props.children
      }
      
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Došlo k chybě</h2>
            <p className="text-gray-600 mb-4">
              Nastal problém s autentizací. Zkuste se znovu přihlásit.
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Zpět na přihlášení
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
