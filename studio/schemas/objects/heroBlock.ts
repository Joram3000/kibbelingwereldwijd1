import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'heroBlock',
  type: 'object',
  title: 'Hero blok',
  groups: [
    {name: 'content', title: 'Inhoud'},
    {name: 'cta', title: 'Call to Action'},
    {name: 'background', title: 'Achtergrond'},
    {name: 'styling', title: 'Stijl'},
  ],
  fields: [
    defineField({
      name: 'headingText',
      title: 'Koptekst',
      type: 'string',
      group: 'content',
      description: 'Hoofdtekst van het hero-gedeelte',
    }),
    defineField({
      name: 'subheading',
      title: 'Subtitel',
      type: 'text',
      group: 'content',
      description: 'Ondersteunende tekst onder de koptekst',
    }),
    defineField({
      name: 'contentAlignment',
      title: 'Uitlijning inhoud',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'Links', value: 'left'},
          {title: 'Midden', value: 'center'},
          {title: 'Rechts', value: 'right'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'center',
    }),
    defineField({
      name: 'textColor',
      title: 'Tekstkleur',
      type: 'string',
      group: 'styling',
      description: 'Hex-kleur voor tekst (bijv. #ffffff)',
      validation: (Rule) =>
        Rule.regex(/^#[0-9A-Fa-f]{6}$/, 'Moet een geldige hex-kleur zijn (bijv. #ffffff)'),
      initialValue: '#ffffff',
    }),
    defineField({
      name: 'ctaButton',
      title: 'Call to Action knop',
      type: 'object',
      group: 'cta',
      fields: [
        defineField({name: 'text', title: 'Knoptekst', type: 'string'}),
        defineField({
          name: 'link',
          title: 'Koppeling',
          type: 'url',
          validation: (Rule) =>
            Rule.uri({allowRelative: true, scheme: ['https', 'http', 'mailto', 'tel']}),
        }),
        defineField({
          name: 'openInNewTab',
          title: 'Openen in nieuw tabblad',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'backgroundColor',
          title: 'Achtergrondkleur knop',
          type: 'string',
          description: 'Hex-kleur voor knopachtergrond (bijv. #007bff)',
          validation: (Rule) =>
            Rule.regex(/^#[0-9A-Fa-f]{6}$/, 'Moet een geldige hex-kleur zijn (bijv. #007bff)'),
          initialValue: '#007bff',
        }),
        defineField({
          name: 'textColor',
          title: 'Tekstkleur knop',
          type: 'string',
          description: 'Hex-kleur voor knoptekst (bijv. #ffffff)',
          validation: (Rule) =>
            Rule.regex(/^#[0-9A-Fa-f]{6}$/, 'Moet een geldige hex-kleur zijn (bijv. #ffffff)'),
          initialValue: '#ffffff',
        }),
      ],
    }),
    defineField({
      name: 'backgroundType',
      title: 'Achtergrondtype',
      type: 'string',
      group: 'background',
      options: {
        list: [
          {title: 'Kleur', value: 'color'},
          {title: 'Media', value: 'media'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'color',
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Achtergrondkleur',
      type: 'string',
      group: 'background',
      description: 'Hex-kleur voor achtergrond (bijv. #000000)',
      validation: (Rule) =>
        Rule.regex(/^#[0-9A-Fa-f]{6}$/, 'Moet een geldige hex-kleur zijn (bijv. #000000)'),
      initialValue: '#000000',
      hidden: ({parent}) => parent?.backgroundType === 'media',
    }),
    defineField({
      name: 'mediaType',
      title: 'Mediatype',
      type: 'string',
      group: 'background',
      options: {
        list: [
          {title: 'Afbeelding', value: 'image'},
          {title: 'Video', value: 'video'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      hidden: ({parent}) => parent?.backgroundType === 'color',
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Achtergrondafbeelding',
      type: 'image',
      group: 'background',
      options: {hotspot: true},
      hidden: ({parent}) => parent?.backgroundType === 'color' || parent?.mediaType === 'video',
    }),
    defineField({
      name: 'videoType',
      title: 'Videotype',
      type: 'string',
      group: 'background',
      options: {
        list: [
          {title: 'Video uploaden', value: 'upload'},
          {title: 'Externe video (YouTube/Vimeo)', value: 'external'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      hidden: ({parent}) => parent?.backgroundType === 'color' || parent?.mediaType === 'image',
    }),
    defineField({
      name: 'uploadedVideo',
      title: 'Video uploaden',
      type: 'file',
      group: 'background',
      options: {accept: 'video/mp4,video/webm,video/ogg'},
      hidden: ({parent}) =>
        parent?.backgroundType === 'color' ||
        parent?.mediaType === 'image' ||
        parent?.videoType === 'external',
    }),
    defineField({
      name: 'externalVideoUrl',
      title: 'Externe video-URL',
      type: 'url',
      group: 'background',
      description: 'YouTube- of Vimeo-URL',
      hidden: ({parent}) =>
        parent?.backgroundType === 'color' ||
        parent?.mediaType === 'image' ||
        parent?.videoType === 'upload',
    }),
    defineField({
      name: 'posterImage',
      title: 'Posterafbeelding',
      type: 'image',
      group: 'background',
      options: {hotspot: true},
      hidden: ({parent}) =>
        parent?.backgroundType === 'color' ||
        parent?.mediaType === 'image' ||
        parent?.videoType === 'upload',
    }),
    defineField({
      name: 'overlayColor',
      title: 'Overlaykleur',
      type: 'string',
      group: 'styling',
      description: 'Optionele overlaykleur in hex-formaat (bijv. #000000)',
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value) return true
          return /^#[0-9A-Fa-f]{6}$/.test(value) || 'Moet een geldige hex-kleur zijn (bijv. #000000)'
        }),
    }),
    defineField({
      name: 'overlayOpacity',
      title: 'Overlay-doorzichtigheid',
      type: 'number',
      group: 'styling',
      description: 'Doorzichtigheid in procenten (0–100)',
      validation: (Rule) => Rule.min(0).max(100),
      initialValue: 50,
      hidden: ({parent}) => !parent?.overlayColor,
    }),
  ],
  preview: {
    select: {title: 'headingText', subtitle: 'subheading', media: 'backgroundImage'},
    prepare({title, subtitle, media}) {
      return {
        title: title || 'Hero blok',
        subtitle: subtitle || 'Geen subtitel',
        media,
      }
    },
  },
})
