import {serverClient} from '$lib/sanity/client.server'
import {agendaQuery} from '$lib/sanity/queries'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async () => {
  const events = await serverClient.fetch(agendaQuery)
  return {events}
}
