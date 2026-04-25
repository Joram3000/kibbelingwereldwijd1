import blockContent from './blockContent'
import {wrapTextAroundImage} from './objects/wrapTextAroundImage'
import post from './post'
import {carousel} from './objects/carousel'
import {youtube} from './objects/youtube'
import {vimeo} from './objects/vimeo'
import {imageGallery} from './objects/imageGallery'

export const schemaTypes = [
  post,
  blockContent,
  wrapTextAroundImage,
  carousel,
  youtube,
  vimeo,
  imageGallery,
]
