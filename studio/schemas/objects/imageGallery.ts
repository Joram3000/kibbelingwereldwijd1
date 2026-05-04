import {defineField, defineType, defineArrayMember} from 'sanity'

export default defineType({
  name: 'imageGallery',
  title: 'Afbeeldingengalerij',
  type: 'object',
  fields: [
    defineField({
      name: 'images',
      title: 'Afbeeldingen',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          name: 'image',
          title: 'Afbeelding',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              type: 'string',
              title: 'Alt-tekst',
              description: 'Voor toegankelijkheid en SEO.',
              validation: (Rule) => [Rule.warning('Voeg alt tekst toe voor toegankelijkheid')],
            }),
          ],
        }),
      ],
      options: {
        layout: 'grid',
      },
    }),
  ],
})
