import { useState } from 'react'

const particles = ['✨', '🎉', '💖', '⭐', '🌸']

export function useConfettiBurst() {
  const [bursts, setBursts] = useState<{ id: string; x: number; y: number }[]>([])

  const fire = (x: number, y: number) => {
    const id = crypto.randomUUID()
    setBursts((b) => [...b, { id, x, y }])
    setTimeout(() => {
      setBursts((b) => b.filter((burst) => burst.id !== id))
    }, 700)
  }

  const node = (
    <>
      {bursts.map((b) => (
        <ConfettiBurst key={b.id} x={b.x} y={b.y} />
      ))}
    </>
  )

  return { fire, node }
}

function ConfettiBurst({ x, y }: { x: number; y: number }) {
  const [pieces] = useState(() =>
    Array.from({ length: 7 }, (_, i) => ({
      emoji: particles[i % particles.length],
      angle: (i / 7) * Math.PI * 2 + Math.random() * 0.5,
      distance: 34 + Math.random() * 22,
      rotate: Math.random() * 60 - 30,
    })),
  )

  return (
    <div className="confetti-root" style={{ left: x, top: y }}>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              '--dx': `${Math.cos(p.angle) * p.distance}px`,
              '--dy': `${Math.sin(p.angle) * p.distance}px`,
              '--rot': `${p.rotate}deg`,
            } as React.CSSProperties
          }
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}
