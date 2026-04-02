import { useSceneStore } from '../../store/sceneStore'

const RATIOS = {
  '16:9':   16 / 9,
  '9:16':   9 / 16,
  '2.39:1': 2.39,
}

/**
 * Returns CSS position/size for the frame rectangle, centered in the container.
 * Uses CSS aspect-ratio so it responds to container resize automatically.
 */
function getCropStyle(ratio) {
  if (ratio >= 1) {
    return {
      top: 0, bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      aspectRatio: String(ratio),
      height: '100%',
      maxWidth: '100%',
    }
  }
  return {
    left: 0, right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    aspectRatio: String(ratio),
    width: '100%',
    maxHeight: '100%',
  }
}

/**
 * Darkens everything outside the active frame using a CSS box-shadow punch-out.
 */
function AspectCrop({ ratio }) {
  const cropStyle = getCropStyle(ratio)
  return (
    <>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
      <div style={{
        ...cropStyle,
        position: 'absolute',
        background: 'transparent',
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
        outline: '1px solid rgba(255,255,255,0.4)',
        pointerEvents: 'none',
      }} />
    </>
  )
}

/**
 * Draws rule-of-thirds lines + intersection dots inside the active frame area.
 */
function RuleOfThirds({ ratio }) {
  const style = getCropStyle(ratio)
  return (
    <div style={{ ...style, position: 'absolute' }}>
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
  const ratio = RATIOS[aspectRatio]

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      <AspectCrop ratio={ratio} />
      {showRuleOfThirds && <RuleOfThirds ratio={ratio} />}
    </div>
  )
}
