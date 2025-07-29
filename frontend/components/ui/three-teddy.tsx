'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface ThreeBackgroundProps {
  className?: string
  message?: string
}

export default function ThreeBackground({ 
  className = '', 
  message = "Welcome back! Click signin 😊"
}: ThreeBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [showMessage, setShowMessage] = useState(false)

  console.log('ThreeBackground component rendering...')

  useEffect(() => {
    console.log('ThreeBackground useEffect running...')
    if (!mountRef.current) {
      console.log('Mount ref not available')
      return
    }

    console.log('Creating space background with floating dots...')

    let isComponentMounted = true

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000, 0)

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 0, 8)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)

    // Create floating dots (asteroids/stars)
    const dotsGeometry = new THREE.BufferGeometry()
    const dotsCount = 100
    const positions = []
    const colors = []
    const sizes = []

    for (let i = 0; i < dotsCount; i++) {
      // Random positions in 3D space
      positions.push(
        (Math.random() - 0.5) * 20, // x
        (Math.random() - 0.5) * 20, // y
        (Math.random() - 0.5) * 10  // z
      )
      
      // Random colors (whites, blues, purples)
      const colorChoices = [0xffffff, 0x87CEEB, 0xDDA0DD, 0xB0E0E6, 0xF0F8FF]
      const color = colorChoices[Math.floor(Math.random() * colorChoices.length)]
      const colorHex = new THREE.Color(color)
      colors.push(colorHex.r, colorHex.g, colorHex.b)
      
      // Random sizes
      sizes.push(Math.random() * 3 + 1)
    }

    dotsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    dotsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    dotsGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))

    const dotsMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    })

    const dots = new THREE.Points(dotsGeometry, dotsMaterial)
    scene.add(dots)

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambientLight)

    // Animation variables
    let startTime = Date.now()

    // Animation
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      
      const elapsed = Date.now() - startTime
      
      // Gentle rotation of the dots
      dots.rotation.y += 0.001
      dots.rotation.x += 0.0005
      
      // Floating motion
      dots.position.y = Math.sin(elapsed * 0.0005) * 0.5
      
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
    
    // Test render to make sure it's working
    renderer.render(scene, camera)
    console.log('Test render completed')
    
    animate()
    console.log('Space background with floating dots created!')
    console.log('Renderer canvas added to DOM:', renderer.domElement)
    console.log('Mount ref element:', mountRef.current)

    // Show message after a short delay
    setTimeout(() => setShowMessage(true), 1000)

    // Cleanup
    return () => {
      console.log('Cleaning up Three.js background')
      isComponentMounted = false
      try {
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
        renderer.dispose()
      } catch (error) {
        console.log('Cleanup error (safe to ignore):', error)
      }
    }
  }, [message])

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mountRef} 
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'transparent' }}
      />
      
      {/* Welcome Message - appears after a short delay */}
      {showMessage && (
        <div className="fixed left-1/2 top-1/2 transform translate-x-4 translate-y-16 z-10 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg max-w-xs animate-fade-in">
            <p className="text-gray-800 font-medium text-xs text-center">
              {message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 