import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// GET /api/health - Health check endpoint for production monitoring
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Database connectivity check
    let dbStatus = 'healthy'
    let dbError = null
    
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      dbStatus = 'unhealthy'
      dbError = error instanceof Error ? error.message : 'Unknown database error'
      logger.error('Health check - Database error:', error)
    }

    // Memory usage check
    const memUsage = process.memoryUsage()
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    }

    // ERP connectivity check (optional)
    let erpStatus = 'unknown'
    try {
      const erpUrl = process.env.ERP_API_URL || 'http://itmsql01:44612'
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(`${erpUrl}/web/health`, {
        method: 'GET',
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        erpStatus = 'healthy'
      } else {
        erpStatus = 'unhealthy'
      }
    } catch (error) {
      erpStatus = 'unhealthy'
      logger.warn('Health check - ERP connectivity error:', error)
    }

    const responseTime = Date.now() - startTime
    const overallStatus = dbStatus === 'healthy' ? 'healthy' : 'unhealthy'

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbStatus,
          error: dbError,
        },
        erp: {
          status: erpStatus,
          url: process.env.ERP_API_URL || 'http://itmsql01:44612',
        },
      },
      memory: memUsageMB,
      node: {
        version: process.version,
        platform: process.platform,
      },
    }

    // Return appropriate HTTP status based on health
    const statusCode = overallStatus === 'healthy' ? 200 : 503
    
    return NextResponse.json(healthData, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })

  } catch (error) {
    logger.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  }
}
