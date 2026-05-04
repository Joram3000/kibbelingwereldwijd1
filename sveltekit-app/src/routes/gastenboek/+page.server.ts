import {serverClient, writeClient} from '$lib/sanity/client.server'
import {fail} from '@sveltejs/kit'
import type {Actions, PageServerLoad} from './$types'
import {guestbookQuery} from '$lib/sanity/queries'

export const load: PageServerLoad = async () => {
  const entries = await serverClient.fetch(guestbookQuery)
  return {entries}
}

export const actions: Actions = {
  default: async ({request}) => {
    const data = await request.formData()
    const name = (data.get('name') as string)?.trim()
    const email = (data.get('email') as string)?.trim()
    const message = (data.get('message') as string)?.trim()

    if (!name || name.length < 1) {
      return fail(400, {error: 'Naam is verplicht', name, email, message})
    }
    if (name.length > 100) {
      return fail(400, {error: 'Naam mag maximaal 100 tekens zijn', name, email, message})
    }
    if (!email || email.length < 1) {
      return fail(400, {error: 'E-mail is verplicht', name, email, message})
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(400, {error: 'Voer een geldig e-mailadres in', name, email, message})
    }
    if (!message || message.length < 1) {
      return fail(400, {error: 'Bericht is verplicht', name, email, message})
    }
    if (message.length > 1000) {
      return fail(400, {error: 'Bericht mag maximaal 1000 tekens zijn', name, email, message})
    }

    await writeClient.create({
      _type: 'guestbookEntry',
      name,
      email,
      message,
    })

    return {success: true}
  },
}
