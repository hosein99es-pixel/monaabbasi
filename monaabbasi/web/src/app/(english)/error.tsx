'use client'

export default function ErrorState({reset}: {reset: () => void}) {
  return <html lang="en"><body><main className="unavailable"><p>The curtain paused unexpectedly.</p><button className="button primary" onClick={reset}>Try again</button></main></body></html>
}
