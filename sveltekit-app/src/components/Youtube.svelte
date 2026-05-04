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
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    )
    videoId = match ? match[1] : null
  }
</script>

<div class="youtube">
  {#if videoId}
    <div class="youtube__inner">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    </div>
  {/if}
</div>

<style>
  .youtube {
    width: 100%;
    max-width: 100%;
  }

  .youtube__inner {
    width: 100%;
    aspect-ratio: 16 / 9;
    position: relative;
    padding-top: 56.25%;
    overflow: hidden;
  }

  .youtube__inner iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
  }
</style>
