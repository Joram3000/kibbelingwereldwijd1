<script lang="ts">
  import type { CustomBlockComponentProps } from '@portabletext/svelte'
  import EmblaCarousel from 'embla-carousel'
  import { onMount, onDestroy } from 'svelte'
  import { urlFor } from '$lib/sanity/image'
  import Youtube from './Youtube.svelte'
  import { ChevronLeft, ChevronRight } from 'lucide-svelte'

  interface CarouselData {
    slides?: Array<{ _type: string; asset?: any; caption?: string; url?: string }>
  }

  interface Props {
    portableText?: CustomBlockComponentProps
    CarouselData?: CarouselData
  }

  const { portableText, CarouselData }: Props = $props()

  const carouselData = $derived(CarouselData ?? (portableText as CustomBlockComponentProps & { value?: CarouselData })?.value ?? (portableText as unknown as CarouselData))

  const emblaOptions = {
    loop: true,
    speed: 10,
    draggable: true,
    slidesToScroll: 1,
  }

  let emblaEl: HTMLElement | null = $state(null)
  let embla: ReturnType<typeof EmblaCarousel> | null = null
  let canPrev = $state(false)
  let canNext = $state(false)
  let selectedIndex = $state(0)
  let slidesCount = $state(0)

  const updateButtons = () => {
    if (!embla) return
    canPrev = embla.canScrollPrev()
    canNext = embla.canScrollNext()
  }

  const updateSelected = () => {
    if (!embla) return
    selectedIndex = embla.selectedScrollSnap()
  }

  const prev = () => {
    embla?.scrollPrev()
    updateButtons()
  }

  const next = () => {
    embla?.scrollNext()
    updateButtons()
  }

  onMount(() => {
    if (!emblaEl) return
    embla = EmblaCarousel(emblaEl, emblaOptions)
    slidesCount = embla.scrollSnapList().length ?? 0
    updateButtons()
    updateSelected()
    embla.on('select', () => {
      updateButtons()
      updateSelected()
    })
    embla.on('resize', () => {
      slidesCount = embla!.scrollSnapList().length ?? slidesCount
      updateButtons()
      updateSelected()
    })
  })

  onDestroy(() => {
    embla?.destroy()
    embla = null
  })
</script>

<div class="carousel">
  <div class="carousel__viewport" bind:this={emblaEl}>
    <div class="carousel__container">
      {#each carouselData?.slides ?? [] as slide}
        <div class="carousel__slide">
          {#if slide._type === 'image'}
            <img src={urlFor(slide.asset as any).url()} alt={slide.caption || ''} />
            {#if slide.caption}
              <p>{slide.caption}</p>
            {/if}
          {/if}

          {#if slide._type === 'youtube'}
            <div class="carousel__youtube">
              <Youtube value={slide.url} />
              {#if slide.caption}
                <p>{slide.caption}</p>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="carousel__gradient"></div>
  </div>

  <div class="carousel__nav-wrapper">
    <button
      class="carousel__nav carousel__nav--left"
      onclick={prev}
      aria-label="Previous slide"
      aria-disabled={!canPrev}
      disabled={!canPrev}
    >
      <ChevronLeft size="2rem" />
    </button>

    <button
      class="carousel__nav carousel__nav--right"
      onclick={next}
      aria-label="Next slide"
      aria-disabled={!canNext}
      disabled={!canNext}
    >
      <ChevronRight size="2rem" />
    </button>
  </div>

  {#if slidesCount > 1}
    <div class="carousel__dots" role="tablist" aria-label="Carousel pagination">
      {#each Array(slidesCount) as _, idx}
        <button
          class="carousel__dot {idx === selectedIndex ? 'carousel__dot--active' : ''}"
          aria-label="Slide {idx + 1}"
          aria-pressed={idx === selectedIndex}
          onclick={() => embla?.scrollTo(idx)}
        ></button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .carousel {
    position: relative;
    overflow: visible;
    box-sizing: content-box;
  }

  .carousel__viewport {
    position: relative;
    overflow: hidden;
    padding-inline: 2rem;
    box-sizing: content-box;
  }

  .carousel__container {
    display: flex;
    gap: 0;
    align-items: stretch;
  }

  .carousel__slide {
    flex: 1 0 90%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    margin-right: 1rem;
    position: relative;
  }

  .carousel__gradient {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 1),
      rgba(0, 0, 0, 0) 20%,
      rgba(0, 0, 0, 0) 80%,
      rgba(0, 0, 0, 1)
    );
    z-index: 5;
  }

  img {
    width: 100%;
    height: auto;
  }

  .carousel__youtube {
    width: 100%;
  }

  .carousel__dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding-inline: 1rem;
  }

  .carousel__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.35);
    border: none;
    padding: 0;
    cursor: pointer;
    transition:
      transform 120ms ease,
      background 120ms ease,
      opacity 120ms ease;
  }

  .carousel__dot--active {
    transform: scale(1.4);
    background: rgba(255, 255, 255, 0.85);
  }

  .carousel__dot:focus {
    outline: 2px solid Highlight;
    outline-offset: 3px;
  }

  .carousel__nav-wrapper {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    pointer-events: none;
    padding-inline: 0.8rem;
    z-index: 10;
    overflow: visible;
  }

  .carousel__nav {
    position: relative;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: inherit;
    border-radius: 1rem;
    padding: 1rem;
    cursor: pointer;
    pointer-events: auto;
    transition:
      transform 120ms ease,
      opacity 120ms ease;
  }

  .carousel__nav:active {
    transform: scale(0.9);
  }

  .carousel__nav[disabled] {
    opacity: 0.45;
    cursor: default;
    pointer-events: none;
  }

  @media (max-width: 600px) {
    .carousel__viewport {
      padding-inline: 0;
    }

    .carousel__slide {
      flex: 1 0 100%;
    }

    .carousel__nav {
      width: 40px;
      height: 40px;
    }
  }
</style>
