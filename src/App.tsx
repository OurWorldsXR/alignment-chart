import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { prompts } from './prompts'

type Point = { x: number; y: number }
type Placements = Record<string, Point>
type ModelContext = {
  registerTool: (tool: {
    name: string
    title: string
    description: string
    inputSchema: object
    annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }
    execute: (input: unknown) => object
  }, options: { signal: AbortSignal }) => void | Promise<void>
}

const STORAGE_KEY = 'ourworlds-alignment-chart-v1'
const clamp = (value: number) => Math.max(0, Math.min(100, value))

function readSaved(): Placements {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return Object.fromEntries(
      prompts.flatMap(({ id }) => {
        const point = (parsed as Record<string, unknown>)[id]
        if (!point || typeof point !== 'object') return []
        const { x, y } = point as Record<string, unknown>
        return typeof x === 'number' && Number.isFinite(x) &&
          typeof y === 'number' && Number.isFinite(y)
          ? [[id, { x: clamp(x), y: clamp(y) }] as const]
          : []
      }),
    )
  } catch {
    return {}
  }
}

function downloadJson(placements: Placements) {
  const data = {
    format: 'ourworlds-alignment-chart',
    version: 1,
    exportedAt: new Date().toISOString(),
    axes: {
      x: { low: 'Never a good idea', high: 'Always a good idea' },
      y: { low: 'No pressure', high: 'Lots of pressure' },
    },
    responses: prompts.map(({ id, label }) => ({
      id,
      label,
      position: placements[id] ?? null,
    })),
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `ourworlds-alignment-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function App() {
  const [placements, setPlacements] = useState<Placements>(readSaved)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const draggingId = useRef<string | null>(null)
  const dragStart = useRef<Point | null>(null)
  const dragMoved = useRef(false)
  const [saveStatus, setSaveStatus] = useState('Saved on this device')
  const placedCount = Object.keys(placements).length
  const selected = prompts.find((prompt) => prompt.id === selectedId)
  const selectedPosition = selectedId ? placements[selectedId] : undefined

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(placements))
      setSaveStatus('Saved on this device')
    } catch {
      setSaveStatus('Could not save here — export your work')
    }
  }, [placements])

  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext
    if (!context?.registerTool) return
    const lifecycle = new AbortController()
    try {
      void Promise.resolve(context.registerTool({
        name: 'place_practice',
        title: 'Place a filmmaking practice',
        description: 'Place one existing practice on the teacher-led alignment chart using 0–100 coordinates. X goes from never to always a good idea; Y goes from no to lots of pressure.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', enum: prompts.map(({ id }) => id) },
            x: { type: 'number', minimum: 0, maximum: 100 },
            y: { type: 'number', minimum: 0, maximum: 100 },
          },
          required: ['id', 'x', 'y'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (!input || typeof input !== 'object') throw new Error('Expected a practice and coordinates')
          const { id, x, y } = input as Record<string, unknown>
          if (typeof id !== 'string' || !prompts.some((prompt) => prompt.id === id) ||
            typeof x !== 'number' || !Number.isFinite(x) || x < 0 || x > 100 ||
            typeof y !== 'number' || !Number.isFinite(y) || y < 0 || y > 100) {
            throw new Error('Invalid practice ID or coordinates')
          }
          flushSync(() => {
            setPlacements((current) => ({ ...current, [id]: { x, y } }))
            setSelectedId(id)
          })
          return { id, position: { x, y } }
        },
      }, { signal: lifecycle.signal })).catch(() => {})
    } catch { /* Optional browser capability */ }
    return () => lifecycle.abort()
  }, [])

  function positionFromPointer(clientX: number, clientY: number): Point | null {
    const rect = boardRef.current?.getBoundingClientRect()
    if (!rect) return null
    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100),
      y: clamp(((clientY - rect.top) / rect.height) * 100),
    }
  }

  function place(id: string, point: Point) {
    setPlacements((current) => ({ ...current, [id]: point }))
  }

  function moveSelected(axis: keyof Point, value: number) {
    if (!selectedId || !selectedPosition) return
    place(selectedId, { ...selectedPosition, [axis]: clamp(value) })
  }

  function clearChart() {
    if (placedCount && !window.confirm('Clear all placements from this chart? Export first if you want to keep them.')) return
    setPlacements({})
    setSelectedId(null)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="identity">
          <span className="eyebrow">OURWORLDS · CREATIVE FUTURES</span>
          <h1>When is it OK to use AI?</h1>
        </div>
        <div className="toolbar">
          <span className="saved-indicator" aria-live="polite">{saveStatus}</span>
          <button className="button button-secondary" onClick={() => downloadJson(placements)}>Export data</button>
          <button className="button button-quiet" onClick={clearChart} disabled={placedCount === 0}>Clear chart</button>
        </div>
      </header>

      <div className="workspace">
        <section className="prompt-panel" aria-labelledby="prompt-heading">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">FILMMAKING</span>
              <h2 id="prompt-heading">Practices</h2>
            </div>
            <span className="count">{placedCount}/{prompts.length} placed</span>
          </div>
          <p className="instruction">Choose a practice, then tap or click where it belongs on the chart. Move it as the conversation changes.</p>
          <div className="prompt-list">
            {prompts.map((prompt, index) => {
              const placed = Boolean(placements[prompt.id])
              return (
                <button
                  key={prompt.id}
                  className={`prompt-row${selectedId === prompt.id ? ' selected' : ''}`}
                  onClick={() => setSelectedId(prompt.id)}
                  aria-pressed={selectedId === prompt.id}
                >
                  <span className="prompt-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="prompt-label">{prompt.label}</span>
                  <span className={`prompt-status${placed ? ' is-placed' : ''}`} aria-label={placed ? 'Placed' : 'Not placed'}>{placed ? '●' : '○'}</span>
                </button>
              )
            })}
          </div>
          <p className="draft-note">Working labels · course copy under review</p>
        </section>

        <section className="chart-panel" aria-labelledby="chart-heading">
          <div className="chart-heading">
            <div>
              <span className="section-kicker">CLASS DISCUSSION</span>
              <h2 id="chart-heading">Place each practice</h2>
            </div>
            <span className="chart-hint">{selected ? `Selected: ${selected.label}` : 'Select a practice to begin'}</span>
          </div>
          <div className="chart-frame">
            <span className="axis-label axis-top">No pressure</span>
            <span className="axis-label axis-bottom">Lots of pressure</span>
            <span className="axis-label axis-left">Never a good idea</span>
            <span className="axis-label axis-right">Always a good idea</span>
            <div
              className={`chart-board${selectedId ? ' can-place' : ''}`}
              ref={boardRef}
              role="group"
              tabIndex={0}
              aria-label="Alignment chart. Select a practice, then click or press Enter to place it."
              onClick={(event) => {
                if (!selectedId || draggingId.current) return
                const point = positionFromPointer(event.clientX, event.clientY)
                if (point) place(selectedId, point)
              }}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  if (selectedId) place(selectedId, placements[selectedId] ?? { x: 50, y: 50 })
                }
              }}
            >
              <div className="gridline vertical" aria-hidden="true" />
              <div className="gridline horizontal" aria-hidden="true" />
              {prompts.map((prompt, index) => {
                const position = placements[prompt.id]
                if (!position) return null
                return (
                  <button
                    key={prompt.id}
                    type="button"
                    className={`chart-card${selectedId === prompt.id ? ' active' : ''}`}
                    style={{ left: `${position.x}%`, top: `${position.y}%` }}
                    aria-label={`${prompt.label}. Use arrow keys to adjust its position.`}
                    onClick={(event) => { event.stopPropagation(); setSelectedId(prompt.id) }}
                    onPointerDown={(event) => {
                      event.stopPropagation()
                      setSelectedId(prompt.id)
                      draggingId.current = prompt.id
                      dragStart.current = { x: event.clientX, y: event.clientY }
                      dragMoved.current = false
                      event.currentTarget.setPointerCapture(event.pointerId)
                    }}
                    onPointerMove={(event) => {
                      if (draggingId.current !== prompt.id) return
                      const start = dragStart.current
                      if (!dragMoved.current && start && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 5) return
                      dragMoved.current = true
                      const point = positionFromPointer(event.clientX, event.clientY)
                      if (point) place(prompt.id, point)
                    }}
                    onPointerUp={(event) => {
                      if (draggingId.current === prompt.id && dragMoved.current) {
                        const point = positionFromPointer(event.clientX, event.clientY)
                        if (point) place(prompt.id, point)
                      }
                      draggingId.current = null
                      dragStart.current = null
                      dragMoved.current = false
                    }}
                    onPointerCancel={() => { draggingId.current = null; dragStart.current = null; dragMoved.current = false }}
                    onKeyDown={(event) => {
                      const delta = event.shiftKey ? 5 : 1
                      const change: Record<string, Point> = {
                        ArrowLeft: { x: -delta, y: 0 }, ArrowRight: { x: delta, y: 0 },
                        ArrowUp: { x: 0, y: -delta }, ArrowDown: { x: 0, y: delta },
                      }
                      const offset = change[event.key]
                      if (!offset) return
                      event.preventDefault()
                      event.stopPropagation()
                      place(prompt.id, { x: clamp(position.x + offset.x), y: clamp(position.y + offset.y) })
                    }}
                  >
                    <span className="card-number">{index + 1}</span>
                    <span className="card-text">{prompt.label}</span>
                  </button>
                )
              })}
              {placedCount === 0 && <div className="empty-chart" aria-hidden="true">Choose a practice to start the discussion</div>}
            </div>
          </div>
          {selected && (
            <div className="selection-controls">
              <div className="selection-title">
                <span className="section-kicker">SELECTED PRACTICE</span>
                <strong>{selected.label}</strong>
              </div>
              {selectedPosition ? (
                <div className="adjustment-controls">
                  <label>Good idea <input type="range" min="0" max="100" value={selectedPosition.x} onChange={(event) => moveSelected('x', Number(event.target.value))} /></label>
                  <label>Pressure <input type="range" min="0" max="100" value={selectedPosition.y} onChange={(event) => moveSelected('y', Number(event.target.value))} /></label>
                  <button className="button button-quiet" onClick={() => setPlacements((current) => {
                    const next = { ...current }
                    delete next[selected.id]
                    return next
                  })}>Remove</button>
                </div>
              ) : <span className="selection-tip">Tap the chart to place it.</span>}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
