import {defineField, defineType, defineArrayMember} from 'sanity'

export const imageGallery = defineType({
  name: 'imageGallery',
  title: 'Image Gallery',
  type: 'object',

  fields: [
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          name: 'image',
          title: 'Image',
          options: {hotspot: true},
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alt text',
              description: 'Voor toegankelijkheid en SEO.',
              validation: (Rule) => [Rule.warning('Voeg alt tekst toe voor toegankelijkheid')],
            },
          ],
        }),
      ],
      options: {
        layout: 'grid',
      },
    }),
  ],
})
