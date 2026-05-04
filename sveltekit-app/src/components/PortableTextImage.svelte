<script lang="ts">
  import type { CustomBlockComponentProps } from '@portabletext/svelte'
  import { urlFor } from '$lib/sanity/image'

  const { portableText }: { portableText: CustomBlockComponentProps } = $props()

  const { value } = portableText
</script>

<img src={urlFor(value).url()} alt={value.alt || ''} />

<style>
  img {
    max-width: 100%;
    height: auto;
  }
</style>
