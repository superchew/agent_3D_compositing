import { useRef, useEffect, useState } from 'react'
import { useSceneStore } from '../../store/sceneStore'

const RATIOS = {
  '16:9':   16 / 9,
  '9:16':   9 / 16,
  '2.39:1': 2.39,
}

/**
 * Computes pixel rect for the crop area centered in the container.
 */
function computeCropRect(containerW, containerH, targetRatio) {
  const containerRatio = containerW / containerH
  let w, h
  if (containerRatio > targetRatio) {
    // Container is wider than target — pillarbox (bars on sides)
    h = containerH
    w = h * targetRatio
  } else {
    // Container is taller than target — letterbox (bars on top/bottom)
    w = containerW
    h = w / targetRatio
  }
  return {
    left: (containerW - w) / 2,
    top: (containerH - h) / 2,
    width: w,
    height: h,
  }
}

function AspectCrop({ rect }) {
  return (
    <>
      {/* Darken everything */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} />
      {/* Punch out the crop area */}
      <div style={{
        position: 'absolute',
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        background: 'transparent',
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
        outline: '1px solid rgba(255,255,255,0.3)',
        pointerEvents: 'none',
      }} />
    </>
  )
}

function RuleOfThirds({ rect }) {
  return (
    <div style={{
      position: 'absolute',
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <line x1="33.33%" y1="0" x2="33.33%" y2="100%" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        <line x1="66.66%" y1="0" x2="66.66%" y2="100%" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        <line x1="0" y1="33.33%" x2="100%" y2="33.33%" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        <line x1="0" y1="66.66%" x2="100%" y2="66.66%" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        {['33.33%', '66.66%'].flatMap(x =>
          ['33.33%', '66.66%'].map(y => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="white" fillOpacity="0.5" />
          ))
        )}
      </svg>
    </div>
  )
}

export default function ViewportOverlays() {
  const { showRuleOfThirds, aspectRatio } = useSceneStore()
  const containerRef = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = containerRef.current?.parentElement
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const ratio = RATIOS[aspectRatio]
  const rect = size.w > 0 ? computeCropRect(size.w, size.h, ratio) : { left: 0, top: 0, width: 0, height: 0 }

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-20">
      {size.w > 0 && <AspectCrop rect={rect} />}
      {size.w > 0 && showRuleOfThirds && <RuleOfThirds rect={rect} />}
    </div>
  )
}
