import { applyPendingHistoryList, savePendingHistoryMusic } from '@/core/history'
import playerState from '@/store/player/state'

export default async() => {
  await applyPendingHistoryList()

  const handleMusicToggle = () => {
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (!musicInfo) return
    void savePendingHistoryMusic(musicInfo)
  }

  global.app_event.on('musicToggled', handleMusicToggle)
}
