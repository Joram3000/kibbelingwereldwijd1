import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'

import {schemaTypes} from './schemas'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID!
const dataset = process.env.SANITY_STUDIO_DATASET!

export default defineConfig({
  name: 'kibbeling-backend',
  title: 'Kibbeling Backend',
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Inhoud')
          .items([
            S.listItem().title('Posts').schemaType('post').child(S.documentTypeList('post')),
            S.listItem()
              .title('Gastenboek')
              .schemaType('guestbookEntry')
              .child(
                S.documentTypeList('guestbookEntry')
                  .title('Gastenboek berichten')
                  .defaultOrdering([{field: '_createdAt', direction: 'desc'}]),
              ),
            S.listItem()
              .title('Agenda')
              .schemaType('agendaItem')
              .child(
                S.documentTypeList('agendaItem')
                  .title('Agenda items')
                  .defaultOrdering([{field: 'date', direction: 'asc'}]),
              ),
            S.listItem()
              .title('Emoji configuratie')
              .schemaType('emojiConfig')
              .child(
                S.editor()
                  .title('Emoji configuratie')
                  .schemaType('emojiConfig')
                  .documentId('emojiConfig'),
              ),
          ]),
    }),
    presentationTool({
      previewUrl: {
        origin: process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:5173',
        previewMode: {
          enable: '/preview/enable',
          disable: '/preview/disable',
        },
      },
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
})
