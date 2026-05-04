import type {PortableTextBlock} from '@portabletext/types'
import type {ImageAsset, Slug} from '@sanity/types'
import groq from 'groq'

export const postQuery = groq`*[_type == "post" && slug.current == $slug][0]`
export const postsQuery = groq`*[_type == "post" && defined(slug.current)] | order(_createdAt desc)`

export const guestbookQuery = groq`*[_type == "guestbookEntry"] | order(_createdAt desc) {
  _id,
  _createdAt,
  name,
  message
}`

export const emojiConfigQuery = groq`*[_type == "emojiConfig" && _id == "emojiConfig"][0] {
  emojis[] { emoji, label }
}`

export interface Post {
  _type: 'post'
  _createdAt: string
  title?: string
  slug: Slug
  excerpt?: string
  mainImage?: ImageAsset
  body: PortableTextBlock[]
}

export interface GuestbookEntry {
  _id: string
  _createdAt: string
  name: string
  message: string
  email?: string
}

export interface EmojiOption {
  emoji: string
  label: string
}

export const agendaQuery = groq`*[_type == "agendaItem" && dateTime(date) >= dateTime(now())] | order(date asc) {
  _id,
  title,
  date,
  endDate,
  location,
  description,
  image,
  link,
  linkLabel
}`

export interface AgendaItem {
  _id: string
  title: string
  date: string
  endDate?: string
  location?: string
  description?: string
  image?: import('@sanity/types').Image
  link?: string
  linkLabel?: string
}

export const DEFAULT_EMOJIS: EmojiOption[] = [
  {emoji: '😄', label: 'Blij'},
  {emoji: '❤️', label: 'Hart'},
  {emoji: '😂', label: 'Haha'},
  {emoji: '😮', label: 'Wauw'},
  {emoji: '🔥', label: 'Vuur'},
  {emoji: '👍', label: 'Top'},
  {emoji: '🎉', label: 'Feest'},
  {emoji: '😎', label: 'Cool'},
  {emoji: '🤔', label: 'Hmm'},
  {emoji: '😢', label: 'Verdriet'},
  {emoji: '🙏', label: 'Dankjewel'},
  {emoji: '💪', label: 'Sterk'},
  {emoji: '🐟', label: 'Vis'},
  {emoji: '🍟', label: 'Friet'},
]
