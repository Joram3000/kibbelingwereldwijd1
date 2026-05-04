<script lang="ts">
  import {onMount} from 'svelte'

  interface Props {
    imageUrl?: string
    segments?: number
    speed?: number
    zoom?: number
    opacity?: number
    enabled?: boolean
  }

  const {
    imageUrl = '/logo.webp',
    segments = 8,
    speed = 0.08,
    zoom = 1.4,
    opacity = 0.45,
    enabled = true,
  }: Props = $props()

  let canvas: HTMLCanvasElement
  let gl: WebGLRenderingContext
  let animationFrame: number
  let texture: WebGLTexture | null = null

  let targetMouseX = 0
  let targetMouseY = 0
  let smoothMouseX = 0
  let smoothMouseY = 0
  // Velocity for spring physics
  let velX = 0
  let velY = 0

  const vertexShaderSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;

    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `

  const fragmentShaderSource = `
    precision mediump float;

    varying vec2 v_uv;

    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_segments;
    uniform float u_zoom;
    uniform vec2 u_mouse;

    const float PI = 3.14159265359;

    vec2 kaleidoUV(vec2 rotated, float segs, float radius, float aspect, float zoom) {
      float angle = atan(rotated.y, rotated.x);
      float segAngle = PI / segs;
      angle = mod(angle, 2.0 * segAngle);
      angle = abs(angle - segAngle);
      vec2 uv;
      uv.x = cos(angle) * radius / aspect;
      uv.y = sin(angle) * radius;
      return uv * zoom + 0.5;
    }

    void main() {
      vec2 uv = v_uv - 0.5;
      float aspect = u_resolution.x / u_resolution.y;

      float mouseRotation = u_mouse.x * PI;
      float cosR = cos(mouseRotation + u_time);
      float sinR = sin(mouseRotation + u_time);
      vec2 rotated = vec2(
        uv.x * aspect * cosR - uv.y * sinR,
        uv.x * aspect * sinR + uv.y * cosR
      );

      float radius = length(rotated);

      float dynamicZoom = u_zoom + u_mouse.x * u_zoom * 1.5;
      dynamicZoom = max(0.1, dynamicZoom);
      float radiusScale = 1.0 + u_mouse.y * 0.8;
      radiusScale = max(0.1, radiusScale);
      radius *= radiusScale;

      // Blend tussen floor en ceil segments voor organische overgang
      float segsLow  = floor(u_segments);
      float segsHigh = segsLow + 1.0;
      float blend = fract(u_segments);

      // Smoothstep zodat de blend pas begint/eindigt als segmenten op hun plek zijn
      float smoothBlend = smoothstep(0.0, 1.0, blend);

      vec2 uvLow  = kaleidoUV(rotated, segsLow,  radius, aspect, dynamicZoom);
      vec2 uvHigh = kaleidoUV(rotated, segsHigh, radius, aspect, dynamicZoom);

      vec4 colorLow  = texture2D(u_texture, uvLow);
      vec4 colorHigh = texture2D(u_texture, uvHigh);

      gl_FragColor = mix(colorLow, colorHigh, smoothBlend);
    }
  `

  function createShader(type: number, source: string) {
    const shader = gl.createShader(type)
    if (!shader) throw new Error('Could not create shader')
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      throw new Error('Shader compile error')
    }
    return shader
  }

  function createProgram() {
    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource)
    const program = gl.createProgram()
    if (!program) throw new Error('Could not create WebGL program')
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program))
      throw new Error('Program link error')
    }
    return program
  }

  function nextPow2(n: number) {
    let p = 1
    while (p < n) p <<= 1
    return p
  }

  function loadTexture(src: string) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const pw = nextPow2(img.width)
      const ph = nextPow2(img.height)
      const offscreen = document.createElement('canvas')
      offscreen.width = pw
      offscreen.height = ph
      offscreen.getContext('2d')!.drawImage(img, 0, 0, pw, ph)
      texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offscreen)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    }
    img.src = src
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`
    gl.viewport(0, 0, canvas.width, canvas.height)
  }

  onMount(() => {
    gl = canvas.getContext('webgl') as WebGLRenderingContext
    if (!gl) {
      console.warn('WebGL not supported')
      return
    }

    const program = createProgram()
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
    const timeLocation = gl.getUniformLocation(program, 'u_time')
    const segmentsLocation = gl.getUniformLocation(program, 'u_segments')
    const zoomLocation = gl.getUniformLocation(program, 'u_zoom')
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse')

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1
      targetMouseY = -((e.clientY / window.innerHeight) * 2 - 1)
    }

    window.addEventListener('mousemove', handleMouseMove)
    loadTexture(imageUrl)
    resize()
    window.addEventListener('resize', resize)

    function render(time: number) {
      if (!enabled || !texture) {
        animationFrame = requestAnimationFrame(render)
        return
      }

      // Spring physics: stiffness trekt naar target, damping remt af
      const stiffness = 0.04
      const damping = 0.75
      velX = velX * damping + (targetMouseX - smoothMouseX) * stiffness
      velY = velY * damping + (targetMouseY - smoothMouseY) * stiffness
      smoothMouseX += velX
      smoothMouseY += velY

      // Segmenten variëren vloeiend op basis van muis Y: base ± 6
      const dynamicSegments = segments + smoothMouseY * 6

      const dynamicSpeed = speed * (1 + smoothMouseY * 2)

      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)

      gl.enableVertexAttribArray(positionLocation)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      gl.uniform1f(timeLocation, time * 0.001 * dynamicSpeed)
      gl.uniform1f(segmentsLocation, dynamicSegments)
      gl.uniform1f(zoomLocation, zoom)
      gl.uniform2f(mouseLocation, smoothMouseX, smoothMouseY)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)

      gl.drawArrays(gl.TRIANGLES, 0, 6)

      animationFrame = requestAnimationFrame(render)
    }

    animationFrame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  })
</script>

<canvas bind:this={canvas} class="kaleidoscope-canvas" style:opacity></canvas>

<style>
  .kaleidoscope-canvas {
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
  }
</style>
