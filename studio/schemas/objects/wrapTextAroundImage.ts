import {defineType, defineField, defineArrayMember} from 'sanity'

export default defineType({
  name: 'wrapTextAroundImage',
  title: 'Tekst om afbeelding',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Afbeelding',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt-tekst',
          type: 'string',
          description: 'Belangrijk voor toegankelijkheid en SEO',
        }),
        defineField({
          name: 'caption',
          title: 'Bijschrift',
          type: 'string',
          description: 'Optioneel bijschrift onder de afbeelding',
        }),
      ],
    }),
    defineField({
      name: 'position',
      title: 'Positie',
      type: 'string',
      options: {
        list: [
          {title: 'Links', value: 'left'},
          {title: 'Rechts', value: 'right'},
        ],
        layout: 'radio',
      },
      initialValue: 'left',
    }),
    defineField({
      name: 'width',
      title: 'Breedte (%)',
      type: 'number',
      description: 'Breedte van de afbeelding als percentage van de container',
      initialValue: 30,
    }),
    defineField({
      name: 'content',
      title: 'Inhoud',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
      description: 'Tekst die om de afbeelding loopt',
    }),
  ],
  preview: {
    select: {image: 'image', position: 'position', width: 'width'},
    prepare({image, position, width}: {image: unknown; position?: string; width?: number}) {
      return {
        title: 'Tekst om afbeelding',
        subtitle: `Positie: ${position || 'links'}, Breedte: ${width || 30}%`,
        media: image,
      }
    },
  },
})
