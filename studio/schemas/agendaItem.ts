import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'agendaItem',
  title: 'Agenda',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'date',
      title: 'Datum',
      type: 'datetime',
      options: {dateFormat: 'DD-MM-YYYY', timeFormat: 'HH:mm'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'Einddatum (optioneel)',
      type: 'datetime',
      options: {dateFormat: 'DD-MM-YYYY', timeFormat: 'HH:mm'},
    }),
    defineField({
      name: 'location',
      title: 'Locatie',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Omschrijving',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'image',
      title: 'Afbeelding (optioneel)',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'link',
      title: 'Link (optioneel)',
      type: 'url',
    }),
    defineField({
      name: 'linkLabel',
      title: 'Linktekst',
      type: 'string',
    }),
  ],
  orderings: [
    {
      title: 'Datum oplopend',
      name: 'dateAsc',
      by: [{field: 'date', direction: 'asc'}],
    },
  ],
  preview: {
    select: {title: 'title', subtitle: 'date', location: 'location'},
    prepare({title, subtitle, location}) {
      const date = subtitle ? new Date(subtitle).toLocaleDateString('nl-NL') : ''
      return {title, subtitle: [date, location].filter(Boolean).join(' — ')}
    },
  },
})
