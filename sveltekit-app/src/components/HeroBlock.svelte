<script lang="ts">
  import { urlFor } from '$lib/sanity/image'
  import type { HeroBlock } from '$lib/sanity/queries'

  const { heroBlock }: { heroBlock: HeroBlock } = $props()

  function buildEmbedUrl(url: string): string {
    if (!url) return ''

    const youtubeMatch = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^&\n?#]+)/)
    if (youtubeMatch) {
      const timeMatch = url.match(/[?&]t=(\d+)/)
      const startTime = timeMatch ? `&start=${timeMatch[1]}` : ''
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0&fs=0&disablekb=1&playlist=${youtubeMatch[1]}${startTime}`
    }

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      const timeMatch = url.match(/[#&]t=(\d+)s?/)
      const startTime = timeMatch ? `#t=${timeMatch[1]}s` : ''
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1&background=1&controls=0${startTime}`
    }

    return ''
  }

  const backgroundColor = $derived(
    heroBlock?.backgroundType === 'color' ? heroBlock?.backgroundColor : undefined
  )

  const backgroundImageUrl = $derived(
    heroBlock?.backgroundType === 'media' &&
      heroBlock?.mediaType === 'image' &&
      heroBlock?.backgroundImage
      ? urlFor(heroBlock.backgroundImage).url()
      : undefined
  )

  const embedUrl = $derived(
    heroBlock?.mediaType === 'video' && heroBlock?.externalVideoUrl
      ? buildEmbedUrl(heroBlock.externalVideoUrl)
      : undefined
  )
</script>

{#if heroBlock}
  <div
    class="hero"
    style:background-color={backgroundColor}
    style:background-image={backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined}
  >
    {#if embedUrl}
      {#if heroBlock.posterImage}
        <img
          class="hero__poster"
          src={urlFor(heroBlock.posterImage).url()}
          alt="Background Poster"
          draggable="false"
        />
      {/if}

      <iframe
        class="hero__video"
        src={embedUrl}
        loading="lazy"
        title="Background Video"
        frameborder="0"
        allow="autoplay; encrypted-media"
      ></iframe>
    {:else}
      <div>No embedUrl generated. Check console for debugging info.</div>
    {/if}

    {#if heroBlock?.overlayColor}
      <div
        class="hero__overlay"
        style:background-color={heroBlock.overlayColor}
        style:opacity={heroBlock.overlayOpacity ? heroBlock.overlayOpacity / 100 : 0.5}
      ></div>
    {/if}

    {#if heroBlock.headingText || heroBlock?.subheading || (heroBlock?.ctaButton?.text && heroBlock?.ctaButton?.link)}
      <div
        class="hero__content"
        style:text-align={heroBlock?.contentAlignment || 'center'}
        style:color={heroBlock?.textColor || '#ffffff'}
      >
        {#if heroBlock?.headingText}
          <h1 class="hero__heading">
            {heroBlock.headingText}
          </h1>
        {/if}

        {#if heroBlock?.subheading}
          <p class="hero__subheading">
            {heroBlock.subheading}
          </p>
        {/if}

        {#if heroBlock?.ctaButton?.text && heroBlock?.ctaButton?.link}
          <a
            href={heroBlock.ctaButton.link}
            class="hero__cta"
            target={heroBlock.ctaButton.openInNewTab ? '_blank' : '_self'}
            rel={heroBlock.ctaButton.openInNewTab ? 'noopener noreferrer' : ''}
            style:background-color={heroBlock.ctaButton.backgroundColor || '#007bff'}
            style:color={heroBlock.ctaButton.textColor || '#ffffff'}
          >
            {heroBlock.ctaButton.text}
          </a>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .hero {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hero__video {
    position: absolute;
    min-width: 100%;
    min-height: 100%;
    pointer-events: none;
  }

  .hero__poster {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .hero__overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .hero__content {
    position: relative;
    z-index: 2;
    padding: 2rem;
    width: 100%;
  }

  .hero__heading {
    font-size: 3rem;
    font-weight: bold;
    margin: 0 0 1rem 0;
    line-height: 1.2;
  }

  .hero__subheading {
    font-size: 1.25rem;
    margin: 0 0 2rem 0;
    line-height: 1.5;
  }

  .hero__cta {
    display: inline-block;
    padding: 0.75rem 2rem;
    border-radius: 0.375rem;
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.2s ease;
    border: none;
    cursor: pointer;
  }

  .hero__cta:hover {
    opacity: 0.9;
  }

  @media (max-width: 600px) {
    .hero__heading {
      font-size: 1.5rem;
    }

    .hero__subheading {
      font-size: 0.875rem;
    }

    .hero {
      aspect-ratio: 1/1;
      overflow: hidden;
      height: 50vh;
    }

    .hero__video {
      position: absolute;
      min-width: 100%;
      min-height: 100%;
      width: auto;
      aspect-ratio: 16/9;
      pointer-events: none;
    }
  }
</style>
