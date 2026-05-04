import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'emojiConfig',
  title: 'Emoji configuratie',
  type: 'document',
  fields: [
    defineField({
      name: 'emojis',
      title: 'Emoji\'s',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'emoji',
              title: 'Emoji',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {title: 'emoji', subtitle: 'label'},
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
