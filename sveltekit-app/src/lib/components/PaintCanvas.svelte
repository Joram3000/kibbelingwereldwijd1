<script lang="ts">
  import {onMount, onDestroy} from 'svelte'
  import PartySocket from 'partysocket'

  export let coloringSheetSrc: string | null = null
  export let roomId: string = 'default'

  // --- Canvas ---
  let colorCanvas: HTMLCanvasElement
  let colorCtx: CanvasRenderingContext2D

  // --- Drawing state ---
  let isDrawing = false
  let lastX = 0
  let lastY = 0
  let currentStrokePts: Array<[number, number]> = []
  let hasStrokeStart = false
  let strokeStartCanvas: OffscreenCanvas
  let strokeStartCtx: OffscreenCanvasRenderingContext2D

  // --- Dwell ---
  let dwellTimer: ReturnType<typeof setInterval> | null = null
  let dwellX = 0
  let dwellY = 0
  const DWELL_MS = 50
  const DWELL_ALPHA = 0.04

  // --- rAF throttle ---
  let rafId: number | null = null

  // --- Tools ---
  type Tool = 'brush' | 'eraser'
  let activeTool: Tool = 'brush'
  let brushColor = '#f5c842'
  let brushSize = 18
  let brushOpacity = 0.3

  const blendModes = [
    {value: 'source-over', label: 'Normal'},
    {value: 'multiply', label: 'Multiply'},
    {value: 'darken', label: 'Darken'},
    {value: 'color', label: 'Kleur'},
    {value: 'overlay', label: 'Overlay'},
    {value: 'color-burn', label: 'Burn'},
  ]
  let blendMode = 'multiply'

  // --- History (OffscreenCanvas — GPU blit, no CPU pixel copy) ---
  let history: OffscreenCanvas[] = []
  let historyIndex = -1
  const MAX_HISTORY = 30

  // --- Timers / loading ---
  let fallbackTimer: ReturnType<typeof setTimeout>
  let saveTimer: ReturnType<typeof setTimeout>
  let loading = true

  const CANVAS_W = 800
  const CANVAS_H = 600

  // localStorage key per room — second line of defense if PartyKit is slow/down
  const LS_KEY = `kleurplaat-backup-${roomId}`

  const palette = [
    '#f5c842',
    '#e8521a',
    '#d42b2b',
    '#e87c1a',
    '#2b8a3e',
    '#1971c2',
    '#7048e8',
    '#f06595',
    '#ffffff',
    '#c8c8c8',
    '#7a5230',
    '#000000',
  ]

  // --- PartyKit ---
  let socket: PartySocket
  const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST ?? 'localhost:1999'

  onMount(() => {
    colorCtx = colorCanvas.getContext('2d')!

    // Reusable offscreen canvas for stroke-start (GPU → GPU blit, no getImageData)
    strokeStartCanvas = new OffscreenCanvas(CANVAS_W, CANVAS_H)
    strokeStartCtx = strokeStartCanvas.getContext('2d')!

    socket = new PartySocket({host: PARTYKIT_HOST, room: roomId})

    socket.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data)

      if (msg.type === 'state') {
        clearTimeout(fallbackTimer)
        colorCtx.fillStyle = '#ffffff'
        colorCtx.fillRect(0, 0, CANVAS_W, CANVAS_H)

        if (msg.snapshot) {
          const img = new Image()
          img.onload = () => {
            colorCtx.drawImage(img, 0, 0)
            for (const stroke of msg.strokes ?? []) applyRemote(stroke)
            saveSnapshot()
            saveToLocalStorage()
            loading = false
          }
          img.src = msg.snapshot
        } else {
          for (const stroke of msg.strokes ?? []) applyRemote(stroke)
          saveSnapshot()
          loading = false
        }
        return
      }

      applyRemote(msg)
    })

    // Fallback: server silent after 5s → restore from localStorage or init white
    fallbackTimer = setTimeout(() => {
      if (history.length === 0) {
        const cached = localStorage.getItem(LS_KEY)
        if (cached) {
          const img = new Image()
          img.onload = () => {
            colorCtx.drawImage(img, 0, 0)
            saveSnapshot()
            loading = false
          }
          img.src = cached
        } else {
          colorCtx.fillStyle = '#ffffff'
          colorCtx.fillRect(0, 0, CANVAS_W, CANVAS_H)
          saveSnapshot()
          loading = false
        }
      } else {
        loading = false
      }
    }, 5000)
  })

  onDestroy(() => {
    clearTimeout(fallbackTimer)
    clearTimeout(saveTimer)
    stopDwell()
    if (rafId !== null) cancelAnimationFrame(rafId)
    socket?.close()
  })

  function send(event: object) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(event))
    }
  }

  // --- Unified draw primitive ---
  // local=true applies the selected blendMode via globalCompositeOperation
  // remote strokes always use source-over (we don't know the sender's blend mode)
  type DrawCmd =
    | {
        type: 'dot'
        x: number
        y: number
        color: string
        size: number
        tool: string
        opacity: number
      }
    | {
        type: 'stroke'
        x1: number
        y1: number
        x2: number
        y2: number
        color: string
        size: number
        tool: string
        opacity: number
      }

  function applyMark(cmd: DrawCmd, local = false) {
    const isEraser = cmd.tool === 'eraser'
    colorCtx.globalCompositeOperation =
      !isEraser && local ? (blendMode as GlobalCompositeOperation) : 'source-over'
    colorCtx.globalAlpha = isEraser ? 1 : cmd.opacity
    colorCtx.beginPath()
    if (cmd.type === 'dot') {
      colorCtx.arc(cmd.x, cmd.y, cmd.size / 2, 0, Math.PI * 2)
      colorCtx.fillStyle = isEraser ? '#ffffff' : cmd.color
      colorCtx.fill()
    } else {
      colorCtx.moveTo(cmd.x1, cmd.y1)
      colorCtx.lineTo(cmd.x2, cmd.y2)
      colorCtx.strokeStyle = isEraser ? '#ffffff' : cmd.color
      colorCtx.lineWidth = cmd.size
      colorCtx.lineCap = 'round'
      colorCtx.lineJoin = 'round'
      colorCtx.stroke()
    }
    colorCtx.globalAlpha = 1
    colorCtx.globalCompositeOperation = 'source-over'
  }

  function applyRemote(event: any) {
    if (event.type === 'dot' || event.type === 'stroke') {
      applyMark({...event, opacity: event.opacity ?? 1}, false)
    }
  }

  // --- History (GPU OffscreenCanvas — drawImage stays on GPU, no CPU pixel transfer) ---
  function saveSnapshot() {
    const snap = new OffscreenCanvas(CANVAS_W, CANVAS_H)
    snap.getContext('2d')!.drawImage(colorCanvas, 0, 0)
    history = history.slice(0, historyIndex + 1)
    history.push(snap)
    if (history.length > MAX_HISTORY) history.shift()
    historyIndex = history.length - 1
  }

  function undo() {
    if (historyIndex <= 0) return
    historyIndex--
    colorCtx.drawImage(history[historyIndex], 0, 0)
  }

  function redo() {
    if (historyIndex >= history.length - 1) return
    historyIndex++
    colorCtx.drawImage(history[historyIndex], 0, 0)
  }

  // --- Pos: always live rect so scroll doesn't offset strokes ---
  function getPos(e: PointerEvent): [number, number] {
    const rect = colorCanvas.getBoundingClientRect()
    const scaleX = CANVAS_W / rect.width
    const scaleY = CANVAS_H / rect.height
    return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY]
  }

  // --- rAF-throttled render (decouple pointermove from paint) ---
  function scheduleRender() {
    if (rafId !== null) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      redrawBrushStroke()
    })
  }

  // --- Drawing ---
  function startDraw(e: PointerEvent) {
    colorCanvas.setPointerCapture(e.pointerId)
    isDrawing = true
    ;[lastX, lastY] = getPos(e)

    if (activeTool === 'brush') {
      strokeStartCtx.drawImage(colorCanvas, 0, 0) // GPU copy, replaces getImageData
      hasStrokeStart = true
      currentStrokePts = [[lastX, lastY]]
      scheduleRender()
      startDwell()
    } else {
      applyMark(
        {
          type: 'dot',
          x: lastX,
          y: lastY,
          color: brushColor,
          size: brushSize,
          tool: activeTool,
          opacity: brushOpacity,
        },
        true,
      )
    }

    send({
      type: 'dot',
      x: lastX,
      y: lastY,
      color: brushColor,
      size: brushSize,
      tool: activeTool,
      opacity: brushOpacity,
    })
  }

  function draw(e: PointerEvent) {
    if (!isDrawing) return

    // getCoalescedEvents gives higher-res stroke path between frames
    const coalescedEvents: PointerEvent[] = e.getCoalescedEvents?.() ?? []
    const eventList: PointerEvent[] = coalescedEvents.length > 0 ? coalescedEvents : [e]

    if (activeTool === 'brush') {
      for (const ce of eventList) {
        currentStrokePts.push(getPos(ce))
      }
      const [newX, newY] = getPos(eventList[eventList.length - 1])
      send({
        type: 'stroke',
        x1: lastX,
        y1: lastY,
        x2: newX,
        y2: newY,
        color: brushColor,
        size: brushSize,
        tool: activeTool,
        opacity: brushOpacity,
      })
      ;[lastX, lastY] = [newX, newY]
      scheduleRender()
    } else {
      let prevX = lastX
      let prevY = lastY
      for (const ce of eventList) {
        const [x, y] = getPos(ce)
        applyMark(
          {
            type: 'stroke',
            x1: prevX,
            y1: prevY,
            x2: x,
            y2: y,
            color: brushColor,
            size: brushSize,
            tool: activeTool,
            opacity: brushOpacity,
          },
          true,
        )
        send({
          type: 'stroke',
          x1: prevX,
          y1: prevY,
          x2: x,
          y2: y,
          color: brushColor,
          size: brushSize,
          tool: activeTool,
          opacity: brushOpacity,
        })
        ;[prevX, prevY] = [x, y]
      }
      ;[lastX, lastY] = [prevX, prevY]
    }
  }

  function endDraw() {
    if (!isDrawing) return
    isDrawing = false
    stopDwell()
    hasStrokeStart = false
    currentStrokePts = []
    saveSnapshot()
    scheduleSave()
  }

  // Redraws the entire current stroke as a single smooth Bézier path — no joints, no opacity dots
  function redrawBrushStroke() {
    if (!hasStrokeStart) return
    colorCtx.drawImage(strokeStartCanvas, 0, 0)

    colorCtx.globalCompositeOperation = blendMode as GlobalCompositeOperation
    colorCtx.globalAlpha = brushOpacity
    colorCtx.strokeStyle = brushColor
    colorCtx.lineWidth = brushSize
    colorCtx.lineCap = 'round'
    colorCtx.lineJoin = 'round'
    colorCtx.beginPath()

    const pts = currentStrokePts
    if (pts.length === 1) {
      const [x, y] = pts[0]
      colorCtx.fillStyle = brushColor
      colorCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
      colorCtx.fill()
    } else if (pts.length === 2) {
      colorCtx.moveTo(pts[0][0], pts[0][1])
      colorCtx.lineTo(pts[1][0], pts[1][1])
      colorCtx.stroke()
    } else {
      colorCtx.moveTo(pts[0][0], pts[0][1])
      for (let i = 0; i < pts.length - 1; i++) {
        const midX = (pts[i][0] + pts[i + 1][0]) / 2
        const midY = (pts[i][1] + pts[i + 1][1]) / 2
        colorCtx.quadraticCurveTo(pts[i][0], pts[i][1], midX, midY)
      }
      colorCtx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1])
      colorCtx.stroke()
    }

    colorCtx.globalAlpha = 1
    colorCtx.globalCompositeOperation = 'source-over'
  }

  // --- Dwell (kleur opbouwen als je stilstaat) ---
  function startDwell() {
    stopDwell()
    dwellX = lastX
    dwellY = lastY
    dwellTimer = setInterval(() => {
      if (!isDrawing || activeTool !== 'brush') return
      if (Math.abs(lastX - dwellX) > 3 || Math.abs(lastY - dwellY) > 3) {
        dwellX = lastX
        dwellY = lastY
        return
      }
      colorCtx.globalCompositeOperation = blendMode as GlobalCompositeOperation
      colorCtx.globalAlpha = DWELL_ALPHA
      colorCtx.beginPath()
      colorCtx.arc(lastX, lastY, brushSize / 2, 0, Math.PI * 2)
      colorCtx.fillStyle = brushColor
      colorCtx.fill()
      colorCtx.globalAlpha = 1
      colorCtx.globalCompositeOperation = 'source-over'
      // Bake dwell into stroke-start so subsequent movement preserves it
      strokeStartCtx.drawImage(colorCanvas, 0, 0)
      currentStrokePts = [[lastX, lastY]]
    }, DWELL_MS)
  }

  function stopDwell() {
    if (dwellTimer !== null) {
      clearInterval(dwellTimer)
      dwellTimer = null
    }
  }

  // --- Persistence ---
  function saveToLocalStorage() {
    try {
      localStorage.setItem(LS_KEY, colorCanvas.toDataURL('image/webp', 0.85))
    } catch {
      // localStorage full — ignore
    }
  }

  function scheduleSave() {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      const data = colorCanvas.toDataURL('image/webp', 0.92)
      send({type: 'snapshot', data})
      saveToLocalStorage()
    }, 2000)
  }

  // --- Export ---
  function download() {
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = CANVAS_W
    exportCanvas.height = CANVAS_H
    const ctx = exportCanvas.getContext('2d')!

    const doExport = () => {
      const link = document.createElement('a')
      link.download = 'mijn-kleurplaat.png'
      link.href = exportCanvas.toDataURL('image/png')
      link.click()
    }

    if (coloringSheetSrc) {
      const img = new Image()
      img.onload = () => {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        ctx.globalCompositeOperation = 'multiply'
        ctx.drawImage(colorCanvas, 0, 0)
        ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H)
        ctx.globalCompositeOperation = 'source-over'
        doExport()
      }
      img.src = coloringSheetSrc
    } else {
      ctx.drawImage(colorCanvas, 0, 0)
      doExport()
    }
  }

  $: canUndo = historyIndex > 0
  $: canRedo = historyIndex < history.length - 1
</script>

<div class="paint-app">
  <div class="toolbar">
    <div class="tool-group">
      <button
        class="tool-btn"
        class:active={activeTool === 'brush'}
        on:click={() => (activeTool = 'brush')}
        title="Kwast"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 17c2-2 4-3 6-4l5-9a1.5 1.5 0 00-2-2L3 7c-1 2-2 4-4 6"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <circle cx="3.5" cy="16.5" r="2" fill="currentColor" />
        </svg>
      </button>
      <button
        class="tool-btn"
        class:active={activeTool === 'eraser'}
        on:click={() => (activeTool = 'eraser')}
        title="Gum"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect
            x="2"
            y="9"
            width="16"
            height="8"
            rx="1.5"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path d="M6 9V5a4 4 0 018 0v4" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </button>
    </div>

    <div class="tool-group">
      <label class="size-label">
        <span>Dikte</span>
        <input type="range" min="2" max="60" bind:value={brushSize} />
        <span class="size-val">{brushSize}</span>
      </label>
      <label class="size-label">
        <span>Dekking</span>
        <input type="range" min="0.05" max="0.3" step="0.05" bind:value={brushOpacity} />
        <span class="size-val">{Math.round(brushOpacity * 100)}%</span>
      </label>
    </div>

    <div class="tool-group palette">
      {#each palette as color}
        <button
          class="color-swatch"
          class:selected={brushColor === color && activeTool === 'brush'}
          style="background:{color}"
          on:click={() => {
            brushColor = color
            activeTool = 'brush'
          }}
          title={color}
        ></button>
      {/each}
      <input
        type="color"
        bind:value={brushColor}
        on:input={() => (activeTool = 'brush')}
        title="Eigen kleur"
        class="color-picker"
      />
    </div>

    <div class="tool-group">
      <label class="size-label">
        <span>Blend</span>
        <select class="blend-select" bind:value={blendMode}>
          {#each blendModes as m}
            <option value={m.value}>{m.label}</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="tool-group">
      <button class="action-btn" on:click={undo} disabled={!canUndo}>Undo</button>
      <button class="action-btn" on:click={redo} disabled={!canRedo}>Redo</button>
      <button class="action-btn primary" on:click={download}>Opslaan</button>
    </div>
  </div>

  <div class="canvas-wrapper">
    {#if coloringSheetSrc}
      <img class="sheet-img" src={coloringSheetSrc} alt="" aria-hidden="true" />
    {/if}
    {#if loading}
      <div class="loading-overlay">
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
      </div>
    {/if}
    <canvas
      bind:this={colorCanvas}
      width={CANVAS_W}
      height={CANVAS_H}
      class="canvas-layer"
      style="cursor: {activeTool === 'eraser' ? 'cell' : 'crosshair'}"
      on:pointerdown={startDraw}
      on:pointermove={draw}
      on:pointerup={endDraw}
      on:pointerleave={endDraw}
    ></canvas>
  </div>
</div>

<style>
  .paint-app {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    font-family: system-ui, sans-serif;
    user-select: none;
  }

  /* ── Toolbar ── */
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    background: #d4d0c8;
    padding: 6px 10px;
    width: 100%;
    box-sizing: border-box;
  }

  .tool-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* Palette spans a full row below other controls on all sizes */
  .tool-group.palette {
    flex: 1 1 100%;
    order: 10;
    gap: 4px;
    flex-wrap: wrap;
  }

  .tool-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #d4d0c8;
    border: 2px solid #808080;
    cursor: pointer;
    color: #222;
    touch-action: manipulation;
  }

  .tool-btn:active,
  .tool-btn.active {
    background: #c0bdb5;
  }

  .size-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }

  .size-label input[type='range'] {
    width: 90px;
  }

  .size-val {
    min-width: 22px;
    font-size: 12px;
  }

  .blend-select {
    font-size: 12px;
    background: #d4d0c8;
    border: 2px solid #808080;
    border-top-color: #404040;
    border-left-color: #404040;
    padding: 2px 4px;
    cursor: pointer;
  }

  .color-swatch {
    flex: 1;
    min-width: 24px;
    max-width: 36px;
    height: 28px;
    border: 2px solid #808080;
    cursor: pointer;
    padding: 0;
    touch-action: manipulation;
  }

  .color-swatch.selected {
    border: 2px solid #000;
    outline: 2px solid #ffffff;
  }

  .color-picker {
    flex: 1;
    min-width: 24px;
    max-width: 36px;
    height: 28px;
    border: 2px solid #808080;
    padding: 0;
    cursor: pointer;
    background: none;
    touch-action: manipulation;
  }

  .action-btn {
    padding: 6px 10px;
    font-size: 13px;
    min-height: 40px;
    background: #d4d0c8;
    border: 2px solid transparent;
    border-top-color: #ffffff;
    border-left-color: #ffffff;
    border-bottom-color: #808080;
    border-right-color: #808080;
    cursor: pointer;
    touch-action: manipulation;
  }

  .action-btn:active:not(:disabled) {
    background: #c0bdb5;
  }

  .action-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .action-btn.primary {
    font-weight: bold;
  }

  /* ── Canvas ── */
  .canvas-wrapper {
    position: relative;
    display: block;
    width: 100%;
    border: 2px solid #808080;
    border-top-color: #404040;
    border-left-color: #404040;
    line-height: 0;
    box-sizing: border-box;
  }

  .sheet-img {
    display: block;
    width: 100%;
    pointer-events: none;
    user-select: none;
  }

  .canvas-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    mix-blend-mode: multiply; /* sheet lines always visible */
    touch-action: none;
  }

  /* ── Loading ── */
  .loading-overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.85);
  }

  .loading-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #808080;
    animation: bounce 1s infinite ease-in-out;
  }

  .loading-dot:nth-child(2) {
    animation-delay: 0.15s;
  }
  .loading-dot:nth-child(3) {
    animation-delay: 0.3s;
  }

  @keyframes bounce {
    0%,
    80%,
    100% {
      transform: scale(0.7);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* ── Desktop: palette hoeft niet per se eigen rij ── */
  @media (min-width: 700px) {
    .tool-group.palette {
      flex: 0 1 auto;
      order: 0;
      max-width: 220px;
    }

    .color-swatch,
    .color-picker {
      flex: 0 0 auto;
      width: 24px;
      max-width: none;
      height: 24px;
    }
  }
</style>
