import { NextResponse } from 'next/server'
import { fetchBackend } from '@/lib/server/backendBaseUrl'

export async function GET() {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        frontend: 'healthy',
        backend: 'checking...'
      }
    }

    // Check backend health
    try {
      const response = await fetchBackend('/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        const backendHealth = await response.json()
        healthData.services.backend = backendHealth.status || 'healthy'
      } else {
        healthData.services.backend = 'unhealthy'
      }
    } catch (error) {
      healthData.services.backend = 'unreachable'
    }

    // Determine overall status
    const isHealthy = healthData.services.frontend === 'healthy' && 
                     healthData.services.backend === 'healthy'

    return NextResponse.json(healthData, { 
      status: isHealthy ? 200 : 503 
    })
  } catch (error) {
    console.error('❌ Health check failed:', error)
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}
