"use client"

import type React from "react"

import { useEffect, useState } from "react"

export function MobileBlocker({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Check if device is mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      return mobileRegex.test(userAgent)
    }

    if (checkMobile()) {
      setIsMobile(true)
    }
  }, [])

  if (!isClient) {
    return <>{children}</>
  }

  if (isMobile) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          {/* Header Icon */}
          <div className="mb-6 flex justify-center">
            <div className="bg-indigo-100 rounded-full p-4">
              <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20m0 0l-.75 3M9 20l-3-3m3 3h6m0-6v6m0-6l.75-3M15 14l.75-3m0 0l.75 3m-6-9v-1a3 3 0 013-3h6a3 3 0 013 3v1m-3 0V5a3 3 0 00-3-3h-6a3 3 0 00-3 3v4"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Desktop Only</h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            This system is optimized for desktop and laptop use. Please access this application from a desktop computer
            for the best experience.
          </p>

          {/* Features List */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-left">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-gray-700">Full-featured dashboard</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-gray-700">Better performance</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-gray-700">Optimized for large screens</span>
            </div>
          </div>

          {/* CTA */}
          <p className="text-sm text-gray-500">We recommend using Google Chrome or Safari on your desktop</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
