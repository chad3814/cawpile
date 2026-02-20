'use client'

import { useEffect, useState } from 'react'
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

export type ToastType = 'success' | 'error' | 'info'

interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

interface ToastProps {
  message: ToastMessage
  onClose: (id: string) => void
}

function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(message.id)
    }, 5000)

    return () => clearTimeout(timer)
  }, [message.id, onClose])

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  }[message.type]

  const icon = {
    success: <CheckCircleIcon className="h-5 w-5 text-green-400" />,
    error: <XCircleIcon className="h-5 w-5 text-red-400" />,
    info: <CheckCircleIcon className="h-5 w-5 text-blue-400" />,
  }[message.type]

  return (
    <div className={`rounded-md border p-4 ${bgColor} shadow-lg`}>
      <div className="flex">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-800">{message.message}</p>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={() => onClose(message.id)}
            className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  messages: ToastMessage[]
  onClose: (id: string) => void
}

export function ToastContainer({ messages, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-2 max-w-sm">
      {messages.map((message) => (
        <Toast key={message.id} message={message} onClose={onClose} />
      ))}
    </div>
  )
}

// Toast hook for managing toast state
export function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  const showToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(7)
    setMessages((prev) => [...prev, { id, type, message }])
  }

  const removeToast = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id))
  }

  return {
    messages,
    showToast,
    removeToast,
  }
}