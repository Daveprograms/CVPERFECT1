'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [clientReady, setClientReady] = useState(false)
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setClientReady(true)
  }, [])

  useEffect(() => {
    if (!clientReady) return

    const mountEl = mountRef.current
    if (!mountEl) return

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 8

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)

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

    const material = new THREE.PointsMaterial({
      size: 8,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      sizeAttenuation: false,
      blending: THREE.AdditiveBlending
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    let animationId = 0
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

    mountEl.appendChild(renderer.domElement)
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      mountEl.replaceChildren()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [clientReady, particleCount, color, speed])

  const shellClass = `fixed inset-0 pointer-events-none z-0 ${className}`

  // Single stable host node (always same ref) — avoids React replace/removal fighting Three.js canvas
  return (
    <div
      ref={mountRef}
      className={shellClass}
      style={{ background: 'transparent' }}
      aria-hidden
    />
  )
} 