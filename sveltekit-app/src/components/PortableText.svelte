<script lang="ts">
  import { PortableText } from '@portabletext/svelte'
  import type { PortableTextBlock } from '@portabletext/types'

  import PortableTextImage from './PortableTextImage.svelte'
  import WrapTextAroundImage from './WrapTextAroundImage.svelte'
  import Carousel from './Carousel.svelte'
  import Youtube from './Youtube.svelte'
  import Vimeo from './Vimeo.svelte'
  import ImageGallery from './ImageGallery.svelte'
  import CtaSection from './CtaSection.svelte'

  const { value }: { value: PortableTextBlock[] } = $props()

  const components = {
    types: {
      image: PortableTextImage,
      wrapTextAroundImage: WrapTextAroundImage,
      carousel: Carousel,
      youtube: Youtube,
      vimeo: Vimeo,
      imageGallery: ImageGallery,
      ctaSection: CtaSection,
    },
  }
</script>

<PortableText {components} {value} />
