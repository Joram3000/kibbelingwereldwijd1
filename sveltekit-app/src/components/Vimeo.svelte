<script lang="ts">
  import type { CustomBlockComponentProps } from '@portabletext/svelte'

  interface Props {
    portableText?: CustomBlockComponentProps
    value?: string | { url?: string }
  }

  const { portableText, value }: Props = $props()

  const resolvedValue = (portableText as CustomBlockComponentProps & { value?: unknown })?.value ?? value ?? portableText ?? {}

  const url: string | undefined =
    typeof resolvedValue === 'string'
      ? resolvedValue
      : ((resolvedValue as { url?: string })?.url) || undefined

  let videoId: string | null = null

  if (url) {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    videoId = match ? match[1] : null
  }
</script>

<div class="vimeo">
  {#if videoId}
    <div class="vimeo__inner">
      <iframe
        src={`https://player.vimeo.com/video/${videoId}`}
        title="Vimeo video player"
        loading="lazy"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>
  {/if}
</div>

<style>
  .vimeo {
    width: 100%;
    max-width: 100%;
  }

  .vimeo__inner {
    width: 100%;
    aspect-ratio: 16 / 9;
    position: relative;
    padding-top: 56.25%;
    overflow: hidden;
  }

  .vimeo__inner iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
  }
</style>
