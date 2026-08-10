import { google, slides_v1 } from 'googleapis'
import { env } from '@/lib/env'
import { getGoogleAuth } from '@/lib/google/auth'

export async function getPresentation(): Promise<slides_v1.Schema$Presentation> {
  const slidesApi = google.slides({ version: 'v1', auth: getGoogleAuth() })
  const res = await slidesApi.presentations.get({
    presentationId: env.slides.presentationId(),
  })
  return res.data
}
