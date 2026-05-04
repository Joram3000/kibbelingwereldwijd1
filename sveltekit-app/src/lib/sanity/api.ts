import {PUBLIC_SANITY_DATASET, PUBLIC_SANITY_PROJECT_ID} from '$env/static/public'
import {env} from '$env/dynamic/public'

export function assertEnvVar<T>(value: T | undefined, name: string): T {
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export const dataset = assertEnvVar(PUBLIC_SANITY_DATASET, 'PUBLIC_SANITY_DATASET')

export const projectId = assertEnvVar(PUBLIC_SANITY_PROJECT_ID, 'PUBLIC_SANITY_PROJECT_ID')

export const apiVersion = env.PUBLIC_SANITY_API_VERSION || '2025-10-22'

export const studioUrl = env.PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333'
