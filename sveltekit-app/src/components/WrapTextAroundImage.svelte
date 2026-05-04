<script lang="ts">
  import { PortableText } from '@portabletext/svelte'
  import type { CustomBlockComponentProps } from '@portabletext/svelte'
  import { urlFor } from '$lib/sanity/image'

  const { portableText }: { portableText: CustomBlockComponentProps } = $props()

  const { image, position = 'left', width = 30, content = [] } = portableText?.value ?? {}
</script>

<div class="wrap-image">
  {#if image}
    <figure class="wrap-image__figure wrap-image__figure--{position}" style:width="{width}%">
      <img src={urlFor(image).url()} alt={image.alt || ''} />
      {#if image.caption}
        <figcaption class="wrap-image__caption">{image.caption}</figcaption>
      {/if}
    </figure>
  {/if}

  <div class="wrap-image__content">
    <PortableText components={{}} value={content} />
  </div>
</div>

<style>
  .wrap-image {
    overflow: auto;
    height: 100%;
  }

  figure {
    max-width: 40rem;
  }

  .wrap-image__figure--left {
    float: left;
    margin-right: 1rem;
  }

  .wrap-image__figure--right {
    float: right;
    margin-left: 1rem;
  }

  img {
    display: block;
    width: 100%;
    height: auto;
  }

  .wrap-image__caption {
    font-size: 0.875rem;
    color: #666;
  }

  .wrap-image__content {
    overflow: auto;
  }

  :global(.wrap-image__content p) {
    margin: 0 0 0.75rem 0;
  }

  @media (max-width: 700px) {
    figure {
      float: none;
      width: 50% !important;
      max-width: 100%;
      margin: 0 0 1rem 0;
    }

    .wrap-image__content {
      overflow: visible;
    }
  }
</style>
