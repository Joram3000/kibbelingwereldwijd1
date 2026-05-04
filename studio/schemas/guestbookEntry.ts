import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'guestbookEntry',
  title: 'Gastenboek',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Naam',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'email',
      title: 'E-mail',
      type: 'string',
      validation: (Rule) => Rule.required().email().error('Voer een geldig e-mailadres in'),
    }),
    defineField({
      name: 'message',
      title: 'Bericht',
      type: 'text',
      validation: (Rule) => Rule.required().max(1000),
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'message'},
  },
})
