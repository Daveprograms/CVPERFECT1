'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ThreeTest() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    console.log('Testing Three.js...')

    try {
      // Create a simple scene
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      const renderer = new THREE.WebGLRenderer({ alpha: true })
      
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setClearColor(0x000000, 0)
      
      // Create a simple cube
      const geometry = new THREE.BoxGeometry()
      const material = new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true })
      const cube = new THREE.Mesh(geometry, material)
      scene.add(cube)
      
      camera.position.z = 5
      
      // Animation
      const animate = () => {
        requestAnimationFrame(animate)
        cube.rotation.x += 0.01
        cube.rotation.y += 0.01
        renderer.render(scene, camera)
      }
      
      mountRef.current.appendChild(renderer.domElement)
      animate()
      
      console.log('Three.js test successful!')
      
      return () => {
        // Safely remove renderer DOM element
        if (renderer && renderer.domElement && renderer.domElement.parentNode) {
          try {
            renderer.domElement.parentNode.removeChild(renderer.domElement)
          } catch (error) {
            console.warn('Could not remove renderer DOM element:', error)
          }
        }
        geometry.dispose()
        material.dispose()
        renderer.dispose()
      }
    } catch (error) {
      console.error('Three.js test failed:', error)
    }
  }, [])

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  )
} 