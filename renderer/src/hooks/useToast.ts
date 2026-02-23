import { useState, useCallback } from 'react'
import type { ToastType } from '../components/Toast'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36)
    const newToast: ToastItem = { id, message, type }
    
    setToasts((prev) => [...prev, newToast])

    // Auto-remove após 3 segundos
    setTimeout(() => {
      removeToast(id)
    }, 3000)

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast])
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast])
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast])
  const warning = useCallback((message: string) => showToast(message, 'warning'), [showToast])

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    info,
    warning
  }
}
