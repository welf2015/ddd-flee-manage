"use client"

import { useEffect, useState } from "react"
import { Bell, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastNotificationProps {
  title: string
  message: string
  type?: "info" | "success" | "warning" | "error"
  duration?: number
}

export function ToastNotification({ title, message, type = "info", duration = 2000 }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  if (!isVisible) return null

  const colors = {
    info: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 min-w-[300px] max-w-md",
        "animate-in slide-in-from-bottom-4 duration-300",
        isVisible ? "opacity-100" : "opacity-0",
      )}
    >
      <div className={cn("rounded-lg shadow-lg p-4 text-white flex items-start gap-3", colors[type])}>
        <Bell className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm opacity-90">{message}</p>
        </div>
        <button onClick={() => setIsVisible(false)} className="flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Hook for using toast notifications
export function useToast() {
  const [toasts, setToasts] = useState<ToastNotificationProps[]>([])

  const showToast = (toast: ToastNotificationProps) => {
    setToasts((prev) => [...prev, { ...toast, duration: toast.duration || 2000 }])
    setTimeout(() => {
      setToasts((prev) => prev.slice(1))
    }, toast.duration || 2000)
  }

  return { toasts, showToast }
}
