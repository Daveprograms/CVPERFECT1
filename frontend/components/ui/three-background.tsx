'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface ThreeBackgroundProps {
  className?: string
  particleCount?: number
  color?: string
  speed?: number
}

export default function ThreeBackground({ 
  className = '', 
  particleCount = 50,
  color = '#6366f1',
  speed = 0.3
}: ThreeBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    
    if (!mountRef.current) {
      console.log('Mount ref not available')
      return
    }

    console.log('Starting Three.js background initialization...')

    // Scene
    const scene = new THREE.Scene()
    console.log('Scene created')

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 8
    console.log('Camera created')

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    console.log('Renderer created')

    // Create particles
    const geometry = new THREE.BufferGeometry()
    const positions = []
    const colors = []

    for (let i = 0; i < particleCount; i++) {
      // Random positions in a sphere
      const radius = 6
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      
      positions.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      )
      
      // Color - make it brighter
      const colorHex = new THREE.Color(color)
      colors.push(colorHex.r, colorHex.g, colorHex.b)
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    console.log('Geometry created with', particleCount, 'particles')

    // Material - make particles bigger and brighter
    const material = new THREE.PointsMaterial({
      size: 8,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      sizeAttenuation: false,
      blending: THREE.AdditiveBlending
    })
    console.log('Material created')

    // Points
    const points = new THREE.Points(geometry, material)
    scene.add(points)
    console.log('Points added to scene')

    // Animation
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      
      points.rotation.x += 0.002 * speed
      points.rotation.y += 0.003 * speed
      
      renderer.render(scene, camera)
    }

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    // Mount and start
    mountRef.current.appendChild(renderer.domElement)
    animate()
    console.log('Three.js background started successfully')

    // Cleanup
    return () => {
      console.log('Cleaning up Three.js background')
      isMountedRef.current = false
      
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      
      // Safely remove renderer DOM element
      if (renderer && renderer.domElement && renderer.domElement.parentNode) {
        try {
          renderer.domElement.parentNode.removeChild(renderer.domElement)
        } catch (error) {
          console.warn('Could not remove renderer DOM element:', error)
        }
      }
      
      window.removeEventListener('resize', handleResize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [particleCount, color, speed])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return (
    <div 
      ref={mountRef} 
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ 
        background: 'transparent'
      }}
    />
  )
} 