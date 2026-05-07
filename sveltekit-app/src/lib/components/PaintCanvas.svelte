<script lang="ts">
  import {onMount} from 'svelte'

  export let coloringSheetSrc: string | null = null

  // --- State ---
  let colorCanvas: HTMLCanvasElement
  let colorCtx: CanvasRenderingContext2D

  let isDrawing = false
  let lastX = 0
  let lastY = 0

  type Tool = 'brush' | 'eraser'
  let activeTool: Tool = 'brush'
  let brushColor = '#f5c842' // Kibbelinggeel
  let brushSize = 18

  // Undo/redo history of the color layer
  let history: ImageData[] = []
  let historyIndex = -1
  const MAX_HISTORY = 30

  const CANVAS_W = 800
  const CANVAS_H = 600

  // Preset colors
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

  // --- Init ---
  onMount(() => {
    colorCtx = colorCanvas.getContext('2d', {willReadFrequently: true})!

    colorCtx.fillStyle = '#ffffff'
    colorCtx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    saveSnapshot()
  })

  // --- Snapshot helpers ---
  function saveSnapshot() {
    const snap = colorCtx.getImageData(0, 0, CANVAS_W, CANVAS_H)
    history = history.slice(0, historyIndex + 1)
    history.push(snap)
    if (history.length > MAX_HISTORY) history.shift()
    historyIndex = history.length - 1
  }

  function undo() {
    if (historyIndex <= 0) return
    historyIndex--
    colorCtx.putImageData(history[historyIndex], 0, 0)
  }

  function redo() {
    if (historyIndex >= history.length - 1) return
    historyIndex++
    colorCtx.putImageData(history[historyIndex], 0, 0)
  }

  // --- Pointer helpers ---
  function getPos(e: PointerEvent): [number, number] {
    const rect = colorCanvas.getBoundingClientRect()
    const scaleX = CANVAS_W / rect.width
    const scaleY = CANVAS_H / rect.height
    return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY]
  }

  // --- Drawing ---
  function startDraw(e: PointerEvent) {
    colorCanvas.setPointerCapture(e.pointerId)
    isDrawing = true
    ;[lastX, lastY] = getPos(e)
    // Draw a dot on click
    drawDot(lastX, lastY)
  }

  function draw(e: PointerEvent) {
    if (!isDrawing) return
    const [x, y] = getPos(e)
    applyStroke(lastX, lastY, x, y)
    ;[lastX, lastY] = [x, y]
  }

  function endDraw() {
    if (!isDrawing) return
    isDrawing = false
    saveSnapshot()
  }

  function drawDot(x: number, y: number) {
    colorCtx.beginPath()
    colorCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
    colorCtx.fillStyle = activeTool === 'eraser' ? '#ffffff' : brushColor
    colorCtx.fill()
  }

  function applyStroke(x1: number, y1: number, x2: number, y2: number) {
    colorCtx.beginPath()
    colorCtx.moveTo(x1, y1)
    colorCtx.lineTo(x2, y2)
    colorCtx.strokeStyle = activeTool === 'eraser' ? '#ffffff' : brushColor
    colorCtx.lineWidth = brushSize
    colorCtx.lineCap = 'round'
    colorCtx.lineJoin = 'round'
    colorCtx.stroke()
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
        // 1. witte achtergrond
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        // 2. kleurlaag met multiply zodat wit wegvalt
        ctx.globalCompositeOperation = 'multiply'
        ctx.drawImage(colorCanvas, 0, 0)
        // 3. kleurplaat-lijnen eroverheen (ook multiply, zwart blijft zwart)
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

  function clearCanvas() {
    colorCtx.fillStyle = '#ffffff'
    colorCtx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    saveSnapshot()
  }

  $: canUndo = historyIndex > 0
  $: canRedo = historyIndex < history.length - 1
</script>

<div class="paint-app">
  <!-- Toolbar -->
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
        />
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
      <button class="action-btn" on:click={undo} disabled={!canUndo} title="Ongedaan maken">
        Undo
      </button>
      <button class="action-btn" on:click={redo} disabled={!canRedo} title="Opnieuw"> Redo </button>
      <button class="action-btn danger" on:click={clearCanvas} title="Alles wissen"> Reset </button>
      <button class="action-btn primary" on:click={download} title="Opslaan als PNG">
        Opslaan
      </button>
    </div>
  </div>

  <div class="canvas-wrapper">
    <!-- Kleurplaat onderop als achtergrond -->
    {#if coloringSheetSrc}
      <img class="sheet-img" src={coloringSheetSrc} alt="" aria-hidden="true" />
    {/if}
    <!-- Tekencanvas eroverheen; mix-blend-mode:multiply maakt wit transparant -->
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
    />
  </div>
</div>

<style>
  .paint-app {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    font-family: system-ui, sans-serif;
    user-select: none;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    background: #d4d0c8;
    border: 2px solid #ffffff;
    border-bottom: 2px solid #808080;
    padding: 6px 10px;
    width: 100%;
    box-sizing: border-box;
  }

  .tool-group {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-right: 12px;
    border-right: 2px solid #808080;
  }

  .tool-group:last-child {
    border-right: none;
  }

  .tool-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #d4d0c8;
    border: 2px solid transparent;
    border-top-color: #ffffff;
    border-left-color: #ffffff;
    border-bottom-color: #808080;
    border-right-color: #808080;
    cursor: pointer;
    color: #222;
  }

  .tool-btn:active,
  .tool-btn.active {
    border-top-color: #808080;
    border-left-color: #808080;
    border-bottom-color: #ffffff;
    border-right-color: #ffffff;
    background: #c0bdb5;
  }

  .size-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }

  .size-label input[type='range'] {
    width: 80px;
  }

  .size-val {
    min-width: 22px;
    font-size: 12px;
  }

  .palette {
    gap: 4px;
    flex-wrap: wrap;
    max-width: 200px;
  }

  .color-swatch {
    width: 22px;
    height: 22px;
    border: 2px solid #808080;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
  }

  .color-swatch.selected {
    border: 2px solid #000;
    outline: 2px solid #ffffff;
  }

  .color-picker {
    width: 22px;
    height: 22px;
    border: 2px solid #808080;
    padding: 0;
    cursor: pointer;
    background: none;
  }

  .action-btn {
    padding: 4px 10px;
    font-size: 12px;
    background: #d4d0c8;
    border: 2px solid transparent;
    border-top-color: #ffffff;
    border-left-color: #ffffff;
    border-bottom-color: #808080;
    border-right-color: #808080;
    cursor: pointer;
  }

  .action-btn:hover:not(:disabled) {
    background: #c8c4bc;
  }

  .action-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .action-btn.danger {
    color: #c00;
  }

  .action-btn.primary {
    font-weight: bold;
  }

  .canvas-wrapper {
    position: relative;
    display: inline-block;
    border: 2px solid #808080;
    border-top-color: #404040;
    border-left-color: #404040;
    line-height: 0;
  }

  .sheet-img {
    display: block;
    max-width: 100%;
    width: 100%;
    pointer-events: none;
    user-select: none;
  }

  .canvas-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    mix-blend-mode: multiply;
    touch-action: none;
  }
</style>
