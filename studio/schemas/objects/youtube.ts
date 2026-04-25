import {defineType, defineField} from 'sanity'

export const youtube = defineType({
  name: 'youtube',
  title: 'YouTube',
  type: 'object',
  description: 'Een YouTube embed die in de carousel gebruikt kan worden.',
  fields: [
    defineField({
      name: 'url',
      title: 'YouTube URL',
      type: 'url',
      description: 'Volledige YouTube URL (bijv. https://www.youtube.com/watch?v=...)',
      validation: (Rule) => [
        Rule.required().error('Een geldige YouTube URL is vereist om de video te tonen.'),
        Rule.custom((val) => {
          if (!val) return true
          try {
            const u = new URL(val)
            return /^(www\.)?(youtube\.com|youtu\.be)$/.test(u.hostname)
              ? true
              : 'URL moet van YouTube (youtube.com of youtu.be) zijn'
          } catch (e) {
            return 'Ongeldige URL'
          }
        }),
      ],
    }),
  ],
  preview: {
    select: {url: 'url', caption: 'caption'},
    prepare({url, caption}) {
      return {
        title: caption || 'YouTube video',
        subtitle: url || '',
      }
    },
  },
})
