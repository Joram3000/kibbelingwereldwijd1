const TOKEN_RE = /〔[^〔〕]+〕/gu
const EMOJI_RE = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu

export const MESSAGE_MAX = 2000

export function visualLength(text: string): number {
  return text
    .replace(TOKEN_RE, '_')
    .replace(EMOJI_RE, '_')
    .length
}
