import {defineType, defineArrayMember} from 'sanity'

export default defineType({
  title: 'Block Content',
  name: 'blockContent',
  type: 'array',
  of: [
    defineArrayMember({
      title: 'Block',
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'H1', value: 'h1'},
        {title: 'H2', value: 'h2'},
        {title: 'H3', value: 'h3'},
        {title: 'H4', value: 'h4'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [{title: 'Bullet', value: 'bullet'}],
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
        ],
        annotations: [
          {
            title: 'URL',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'wrapTextAroundImage',
      title: 'Wrap Text Around Image Embed',
    }),
    defineArrayMember({
      type: 'carousel',
      title: 'Carousel Embed',
    }),
    defineArrayMember({
      type: 'youtube',
      title: 'YouTube Embed',
    }),
    defineArrayMember({
      type: 'vimeo',
      title: 'Vimeo Embed',
    }),
    defineArrayMember({
      type: 'imageGallery',
      title: 'Image Gallery Embed',
    }),
  ],
})
