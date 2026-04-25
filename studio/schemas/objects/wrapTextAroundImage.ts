import {defineType, defineField, defineArrayMember} from 'sanity'

export const wrapTextAroundImage = defineType({
  name: 'wrapTextAroundImage',
  title: 'Wrap Text Around Image',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
          description: 'Important for accessibility and SEO',
        }),
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'string',
          description: 'Optional caption to display below the image',
        }),
      ],
    }),
    defineField({
      name: 'position',
      title: 'Position',
      type: 'string',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
      },
      initialValue: 'left',
    }),
    defineField({
      name: 'width',
      title: 'Width (%)',
      type: 'number',
      description: 'Width of the image as percentage of container',
      initialValue: 30,
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
      description: 'Text that will wrap around the image',
    }),
  ],
  preview: {
    select: {image: 'image', position: 'position', width: 'width'},
    prepare(value: Record<string, any>) {
      const {image, position, width} = value
      return {
        title: 'Text with Wrapped Image',
        subtitle: `Position: ${position || 'left'}, Width: ${width || 30}%`,
        media: image,
      }
    },
  },
})
