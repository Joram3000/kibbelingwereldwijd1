import {defineType, defineField} from 'sanity'

export const vimeo = defineType({
  name: 'vimeo',
  title: 'Vimeo',
  type: 'object',
  fields: [
    defineField({
      name: 'url',
      type: 'url',
      validation: (Rule) => [
        Rule.required().error('Een geldige Vimeo URL is vereist om de video te tonen.'),
        Rule.custom((val) => {
          if (!val) return true
          try {
            const u = new URL(val)
            return /^(www\.)?(vimeo\.com|player\.vimeo\.com)$/.test(u.hostname)
              ? true
              : 'URL moet van Vimeo (vimeo.com of player.vimeo.com) zijn'
          } catch (e) {
            return 'Ongeldige URL'
          }
        }),
      ],
    }),
  ],
  preview: {
    select: {url: 'url'},
    prepare({url}) {
      return {
        title: 'Vimeo Video',
        subtitle: url,
      }
    },
  },
})
