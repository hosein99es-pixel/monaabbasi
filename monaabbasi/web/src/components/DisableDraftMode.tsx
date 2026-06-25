'use client'

import Link from 'next/link'
import {useEffect, useState} from 'react'

export function DisableDraftMode() {
  const [showExitButton, setShowExitButton] = useState(false)

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      try {
        setShowExitButton(window.self === window.top)
      } catch {
        setShowExitButton(false)
      }
    })

    return () => cancelAnimationFrame(animationFrame)
  }, [])

  if (!showExitButton) return null

  return (
    <Link className="disable-draft-mode" href="/api/draft-mode/disable" prefetch={false}>
      Exit preview mode
    </Link>
  )
}
