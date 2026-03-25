import { addHistoryMusic } from '@/core/history'
import playerState from '@/store/player/state'

export default () => {
  const handleMusicToggle = () => {
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (!musicInfo) return
    void addHistoryMusic(musicInfo)
  }

  global.app_event.on('musicToggled', handleMusicToggle)
}
