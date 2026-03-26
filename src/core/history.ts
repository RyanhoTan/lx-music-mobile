import { LIST_IDS, storageDataPrefix } from '@/config/constant'
import { clearListMusics, getListMusics, overwriteListMusics } from '@/core/list'
import { getData, removeData, saveData } from '@/plugins/storage'

const getHistoryTextMap = () => ({
  name: {
    en_us: 'History',
    zh_tw: '歷史記錄',
    default: '历史记录',
  },
  clear: {
    en_us: 'Clear',
    zh_tw: '清空',
    default: '清空',
  },
  clearConfirm: {
    en_us: 'Do you really want to clear all history?',
    zh_tw: '確定清空所有歷史記錄嗎？',
    default: '确定清空所有历史记录吗？',
  },
} as const)

const getLocaleValue = (values: Record<string, string>, langId?: string | null) => {
  const currentLangId = langId ?? global.i18n?.locale ?? 'zh_cn'
  return values[currentLangId] ?? values.default
}

const cloneMusicInfo = (musicInfo: LX.Music.MusicInfo): LX.Music.MusicInfo => {
  return JSON.parse(JSON.stringify(musicInfo)) as LX.Music.MusicInfo
}

const normalizeHistoryMusicInfo = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem): LX.Music.MusicInfo => {
  return cloneMusicInfo('progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo)
}

export const getHistoryListName = (langId?: string | null) => getLocaleValue(getHistoryTextMap().name, langId)
export const getHistoryClearLabel = (langId?: string | null) => getLocaleValue(getHistoryTextMap().clear, langId)
export const getHistoryClearConfirmText = (langId?: string | null) => getLocaleValue(getHistoryTextMap().clearConfirm, langId)

export const addHistoryMusic = async(musicInfo: LX.Music.MusicInfo | LX.Download.ListItem) => {
  const historyMusic = normalizeHistoryMusicInfo(musicInfo)
  const historyList = await getListMusics(LIST_IDS.HISTORY)

  await overwriteListMusics(
    LIST_IDS.HISTORY,
    [historyMusic, ...historyList.filter(item => item.id != historyMusic.id)],
  )
}

export const clearHistoryList = async() => {
  await clearListMusics([LIST_IDS.HISTORY])
}

export const savePendingHistoryMusic = async(musicInfo: LX.Music.MusicInfo | LX.Download.ListItem) => {
  const historyMusic = normalizeHistoryMusicInfo(musicInfo)
  const pendingHistoryList = await getData<LX.Music.MusicInfo[]>(storageDataPrefix.pendingHistoryList) ?? []
  pendingHistoryList.push(historyMusic)
  await saveData(storageDataPrefix.pendingHistoryList, pendingHistoryList)
}

export const applyPendingHistoryList = async() => {
  const pendingHistoryList = await getData<LX.Music.MusicInfo[]>(storageDataPrefix.pendingHistoryList)
  if (!pendingHistoryList?.length) return

  for (const musicInfo of pendingHistoryList) {
    await addHistoryMusic(musicInfo)
  }
  await removeData(storageDataPrefix.pendingHistoryList)
}
