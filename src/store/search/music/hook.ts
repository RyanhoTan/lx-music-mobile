import { useEffect, useState } from 'react'
import state from './state'

export const useSearchMusicInfo = () => {
  const [value, update] = useState({
    ...state,
    listInfos: { ...state.listInfos },
    maxPages: { ...state.maxPages },
    sources: [...state.sources],
  })

  useEffect(() => {
    global.state_event.on('searchMusicInfoChanged', update)
    return () => {
      global.state_event.off('searchMusicInfoChanged', update)
    }
  }, [])

  return value
}
