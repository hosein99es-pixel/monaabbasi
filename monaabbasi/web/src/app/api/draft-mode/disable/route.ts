import {cookies, draftMode} from 'next/headers'
import {redirect} from 'next/navigation'

const perspectiveCookieName = 'sanity-preview-perspective'

export async function GET(request: Request) {
  const draftModeStore = await draftMode()
  const cookieStore = await cookies()
  const redirectTo = new URL(request.url).searchParams.get('redirect') || '/en'

  draftModeStore.disable()
  cookieStore.delete(perspectiveCookieName)

  redirect(redirectTo)
}
