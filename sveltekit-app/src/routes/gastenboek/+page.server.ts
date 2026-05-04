import {serverClient, writeClient} from '$lib/sanity/client.server'
import groq from 'groq'
import {fail} from '@sveltejs/kit'
import type {Actions, PageServerLoad} from './$types'

const guestbookQuery = groq`*[_type == "guestbookEntry"] | order(_createdAt desc) {
  _id,
  _createdAt,
  name,
  message
}`

export const load: PageServerLoad = async () => {
  const entries = await serverClient.fetch(guestbookQuery)
  return {entries}
}

export const actions: Actions = {
  default: async ({request}) => {
    const data = await request.formData()
    const name = (data.get('name') as string)?.trim()
    const message = (data.get('message') as string)?.trim()

    if (!name || name.length < 1) {
      return fail(400, {error: 'Naam is verplicht', name, message})
    }
    if (!message || message.length < 1) {
      return fail(400, {error: 'Bericht is verplicht', name, message})
    }
    if (name.length > 100) {
      return fail(400, {error: 'Naam mag maximaal 100 tekens zijn', name, message})
    }
    if (message.length > 1000) {
      return fail(400, {error: 'Bericht mag maximaal 1000 tekens zijn', name, message})
    }

    await writeClient.create({
      _type: 'guestbookEntry',
      name,
      message,
    })

    return {success: true}
  },
}
