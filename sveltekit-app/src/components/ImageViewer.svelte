<script lang="ts">
  import { onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import { urlFor } from '$lib/sanity/image'
  import type { Image } from '@sanity/types'
  import { ChevronLeft, ChevronRight, X } from 'lucide-svelte'

  type ImageInput = string | { src: string; alt?: string } | Image

  interface Props {
    images?: ImageInput[]
    startIndex?: number
    theme?: 'dark' | 'light'
    open?: boolean
    onclose?: () => void
    onchange?: (index: number) => void
  }

  let {
    images = [],
    startIndex = 0,
    theme = 'dark',
    open = $bindable(false),
    onclose,
    onchange,
  }: Props = $props()

  let index = $state(Math.max(0, startIndex))
  let embla: { destroy: () => void; selectedScrollSnap: () => number; scrollTo: (i: number) => void; scrollPrev: () => void; scrollNext: () => void; on: (e: string, cb: () => void) => void } | null = null
  let emblaNode: HTMLElement | null = $state(null)

  const clamp = (n: number) => {
    if (!images || images.length === 0) return 0
    return Math.min(Math.max(0, n), images.length - 1)
  }

  $effect(() => {
    if (!browser) return
    if (open) {
      window.addEventListener('keydown', onKey)
    } else {
      window.removeEventListener('keydown', onKey)
    }
    return () => window.removeEventListener('keydown', onKey)
  })

  onDestroy(() => {
    if (browser) window.removeEventListener('keydown', onKey)
  })

  function getSrc(item: ImageInput | undefined) {
    if (!item) return undefined
    if (typeof item === 'string') return item
    if ((item as Image & { asset?: unknown })?.asset || (item as { _type?: string })?._type === 'image') {
      try {
        return urlFor(item as Image).url()
      } catch {
        // fallthrough to src property if present
      }
    }
    return (item as { src?: string }).src
  }

  const current = $derived((() => {
    const raw = images[index] as ImageInput | undefined
    const src = getSrc(raw)
    const alt = typeof raw === 'string' ? '' : ((raw as { alt?: string; altText?: string })?.alt ?? (raw as { altText?: string })?.altText ?? '')
    return src ? { src, alt } : undefined
  })())

  $effect(() => {
    if (open) index = clamp(startIndex)
  })

  $effect(() => {
    if (!browser) return
    if (open && emblaNode) initEmbla()
    if (!open) destroyEmbla()
  })

  $effect(() => {
    if (browser && embla && typeof index === 'number') {
      const cur = embla.selectedScrollSnap ? embla.selectedScrollSnap() : 0
      if (cur !== index) embla.scrollTo(index)
    }
  })

  $effect(() => {
    if (images && index >= images.length) {
      index = Math.max(0, images.length - 1)
    }
  })

  $effect(() => {
    if (browser && images && images.length) {
      const preload = (i: number) => {
        const s = getSrc(images[(i + images.length) % images.length])
        if (s) {
          const img = new window.Image()
          img.src = s
        }
      }
      preload(index + 1)
      preload(index - 1)
    }
  })

  async function initEmbla() {
    if (!emblaNode || !browser) return
    if (embla) embla.destroy()
    const mod = await import('embla-carousel')
    const Embla = mod?.default ?? mod
    embla = Embla(emblaNode, { loop: true, startIndex: index })
    embla.on('select', () => {
      const sel = embla!.selectedScrollSnap()
      index = typeof sel === 'number' ? sel : index
      onchange?.(index)
    })
  }

  function destroyEmbla() {
    if (embla) {
      try { embla.destroy() } catch { /* ignore */ }
      embla = null
    }
  }

  const prev = () => {
    if (embla) { embla.scrollPrev(); return }
    if (!images || images.length === 0) return
    index = (index - 1 + images.length) % images.length
    onchange?.(index)
  }

  const next = () => {
    if (embla) { embla.scrollNext(); return }
    if (!images || images.length === 0) return
    index = (index + 1) % images.length
    onchange?.(index)
  }

  const onKey = (e: KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowLeft') prev()
    if (e.key === 'ArrowRight') next()
    if (e.key === 'Escape') close()
  }

  function close() {
    open = false
    onclose?.()
  }

  const FALLBACK_SRC =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="Arial, sans-serif" font-size="20">Image not found</text></svg>`
    )

  function handleImgError(e: Event) {
    const target = e.currentTarget as HTMLImageElement | null
    if (target) target.src = FALLBACK_SRC
  }
</script>

{#if open}
  <div class="image-viewer {theme}" role="dialog" aria-modal="true" aria-label="Image viewer">
    <div class="image-viewer__frame" role="document">
      <section class="image-viewer__section" role="group">
        <button class="image-viewer__close" onclick={close} aria-label="Close"><X size="2rem" /></button>

        <button
          class="image-viewer__nav image-viewer__nav--left"
          onclick={prev}
          aria-label="Previous image"
          disabled={images.length <= 1}
        >
          <ChevronLeft size="2rem" />
        </button>

        <div
          class="image-viewer__embla"
          bind:this={emblaNode}
          role="region"
          aria-label="Image carousel"
        >
          <div class="image-viewer__embla-container">
            {#each images as item}
              {#if getSrc(item)}
                <div class="image-viewer__slide">
                  <img src={getSrc(item)} alt="kardonkel" onerror={handleImgError} />
                </div>
              {/if}
            {/each}
          </div>
        </div>

        <button
          class="image-viewer__nav image-viewer__nav--right"
          onclick={next}
          aria-label="Next image"
          disabled={images.length <= 1}
        >
          <ChevronRight size="2rem" />
        </button>

        <div class="image-viewer__caption">{index + 1} / {images.length}</div>
      </section>
    </div>
  </div>
{/if}

<style>
  .image-viewer {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .image-viewer.dark {
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
  }

  .image-viewer.light {
    background: rgba(255, 255, 255, 0.95);
    color: #000;
  }

  .image-viewer__frame {
    position: relative;
    max-width: 100%;
    max-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .image-viewer__embla {
    overflow: hidden;
    width: 95vw;
    height: 95vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .image-viewer__embla-container {
    display: flex;
    height: 100%;
  }

  .image-viewer__slide {
    flex: 0 0 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
  }

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 4px;
  }

  .image-viewer__nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: inherit;
    padding: 0.5rem;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .image-viewer__nav:active,
  .image-viewer__close:active {
    scale: 0.95;
  }

  .image-viewer__nav[disabled] {
    opacity: 0.4;
    cursor: default;
  }

  .image-viewer__nav--left {
    left: 0.8rem;
  }

  .image-viewer__nav--right {
    right: 0.8rem;
  }

  .image-viewer__close {
    position: absolute;
    right: 1rem;
    top: 1rem;
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .image-viewer__caption {
    position: absolute;
    bottom: 0.5rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.9rem;
    opacity: 0.9;
  }
</style>
