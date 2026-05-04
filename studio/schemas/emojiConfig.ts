import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'emojiConfig',
  title: 'Emoji configuratie',
  type: 'document',
  fields: [
    defineField({
      name: 'emojis',
      title: "Emoji's",
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'emoji',
              title: 'Emoji (tekst)',
              type: 'string',
              description: 'Vul een tekst-emoji in, óf upload een afbeelding hieronder.',
            }),
            defineField({
              name: 'image',
              title: 'Afbeelding (optioneel)',
              type: 'image',
              description: 'Upload een afbeelding als alternatief voor een tekst-emoji. WebP werkt het best.',
              options: {accept: 'image/*'},
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'Wordt ingevoegd als tekst wanneer iemand op dit item klikt, bv. [kibibeling].',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {title: 'label', subtitle: 'emoji', media: 'image'},
          },
        },
      ],
    }),
  ],
  preview: {
    select: {},
    prepare: () => ({title: 'Emoji configuratie'}),
  },
})
