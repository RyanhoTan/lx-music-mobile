import { defaultHeaders } from '@/components/common/Image'

export const getHomeNavBlurSource = (pic: string | number | null | undefined) => {
  if (!pic) return null
  if (typeof pic == 'number') return pic

  const uri = pic.startsWith('/') ? `file://${pic}` : pic
  return uri.startsWith('http://') || uri.startsWith('https://')
    ? { uri, headers: defaultHeaders }
    : { uri }
}

export const getHomeNavForegroundPalette = (isDarkTheme: boolean) => {
  return isDarkTheme
    ? {
        primary: 'rgba(255,255,255,0.94)',
        secondary: 'rgba(255,255,255,0.62)',
      }
    : {
        primary: 'rgba(16, 20, 26, 0.9)',
        secondary: 'rgba(16, 20, 26, 0.58)',
      }
}
