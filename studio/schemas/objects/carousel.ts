import {defineType, defineField, defineArrayMember} from 'sanity'

export const carousel = defineType({
  name: 'carousel',
  title: 'Carousel',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
    }),
    defineField({
      name: 'slides',
      title: 'Slides',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},

          fields: [
            defineField({name: 'caption', type: 'string', title: 'Caption'}),
            defineField({name: 'link', type: 'url', title: 'Optional link'}),
          ],
        }),
        defineArrayMember({type: 'youtube'}),
      ],
    }),
  ],
})
