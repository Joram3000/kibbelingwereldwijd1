<script lang="ts">
  import type { CustomBlockComponentProps } from '@portabletext/svelte'
  import ImageViewer from './ImageViewer.svelte'
  import { urlFor } from '$lib/sanity/image'
  import type { Image } from '@sanity/types'

  const { portableText }: { portableText: CustomBlockComponentProps } = $props()

  const { value } = portableText
  const { images = [], title } = value ?? {}

  let viewerOpen = $state(false)
  let viewerStart = $state(0)

  type ImageItem = string | { src: string; alt?: string } | Image

  function getSrc(item: ImageItem | undefined) {
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

  function getAltFromSrc(s: unknown) {
    if (typeof s !== 'string') return ''
    return s.split('/').pop()?.replace(/\.[^.]+$/, '') ?? ''
  }
</script>

<div class="image-gallery">
  {#if title}
    <h2>{title}</h2>
  {/if}
  <div class="image-gallery__grid">
    {#each images as imageItem, i}
      <button
        onclick={() => {
          viewerStart = i
          viewerOpen = true
        }}
        class="image-gallery__thumb-btn"
        aria-label={`Open image viewer for image ${i + 1}`}
      >
        <img src={getSrc(imageItem)} alt={getAltFromSrc(getSrc(imageItem))} class="image-gallery__thumb" />
      </button>
    {/each}
  </div>
  <ImageViewer {images} startIndex={viewerStart} bind:open={viewerOpen} theme="dark" />
</div>

<style>
  .image-gallery {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .image-gallery__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding: 0;
    width: 100%;
    justify-items: stretch;
    align-items: stretch;
  }

  .image-gallery__thumb-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: block;
    width: 100%;
    height: 100%;
  }

  .image-gallery__thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    cursor: pointer;
  }
</style>
