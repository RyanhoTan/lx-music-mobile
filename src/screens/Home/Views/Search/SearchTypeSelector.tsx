import { useEffect, useMemo, useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'

import Button from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { type SearchType } from '@/store/search/state'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { getSearchSetting } from '@/utils/data'
import { BorderWidths } from '@/theme'
import { useSearchMusicInfo } from '@/store/search/music/hook'
import { handlePlayList } from '@/components/OnlineList/listAction'
import { useIsPlay, usePlayMusicInfo } from '@/store/player/hook'
import { togglePlay } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'

const SEARCH_TYPE_LIST = [
  'music',
  'songlist',
] as const

let lastSearchPlayId = ''

export default () => {
  const t = useI18n()
  const theme = useTheme()
  const searchMusicInfo = useSearchMusicInfo()
  const playMusicInfo = usePlayMusicInfo()
  const isPlay = useIsPlay()
  const [type, setType] = useState<SearchType>('music')

  useEffect(() => {
    void getSearchSetting().then(info => {
      setType(info.type)
    })
  }, [])

  const list = useMemo(() => {
    return SEARCH_TYPE_LIST.map(type => ({ label: t(`search_type_${type}`), id: type }))
  }, [t])

  const currentSearchPlayId = useMemo(() => {
    const text = searchMusicInfo.searchText.trim()
    return text ? `search__${searchMusicInfo.source}__${text}` : ''
  }, [searchMusicInfo.searchText, searchMusicInfo.source])

  const currentSearchList = useMemo(() => {
    return searchMusicInfo.listInfos[searchMusicInfo.source]?.list ?? []
  }, [searchMusicInfo.listInfos, searchMusicInfo.source])

  const isCurrentSearchControlled = useMemo(() => {
    if (!currentSearchPlayId || lastSearchPlayId != currentSearchPlayId) return false
    if (playMusicInfo.listId != LIST_IDS.DEFAULT || !playMusicInfo.musicInfo) return false
    return currentSearchList.some(item => item.id == playMusicInfo.musicInfo?.id)
  }, [currentSearchList, currentSearchPlayId, playMusicInfo])

  const handleTypeChange = (type: SearchType) => {
    setType(type)
    global.app_event.searchTypeChanged(type)
  }

  const handlePlay = () => {
    if (type != 'music') return
    if (!currentSearchPlayId || !currentSearchList.length) return
    if (isCurrentSearchControlled) {
      togglePlay()
      return
    }
    lastSearchPlayId = currentSearchPlayId
    handlePlayList(currentSearchList)
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps={'always'} horizontal={true}>
      <Button
        style={{ ...styles.playButton, backgroundColor: theme['c-button-background'] }}
        onPress={handlePlay}
        disabled={type != 'music'}
      >
        <View style={styles.playButtonContent}>
          <Icon name={isCurrentSearchControlled && isPlay ? 'pause' : 'play'} color={theme['c-button-font']} size={11} />
          <Text style={styles.playButtonText} color={theme['c-button-font']} size={13}>{t('play')}</Text>
        </View>
      </Button>
      {
        list.map(t => (
          <TouchableOpacity style={styles.button} onPress={() => { handleTypeChange(t.id) }} key={t.id}>
            <Text style={{ ...styles.buttonText, borderBottomColor: type == t.id ? theme['c-primary-background-active'] : 'transparent' }} color={type == t.id ? theme['c-primary-font-active'] : theme['c-font']}>{t.label}</Text>
          </TouchableOpacity>
        ))
      }
    </ScrollView>
  )
}

const styles = createStyle({
  container: {
    height: '100%',
    flexGrow: 0,
    flexShrink: 1,
    // paddingLeft: 5,
    // paddingRight: 5,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  button: {
    // height: 38,
    // lineHeight: 38,
    justifyContent: 'center',
    paddingLeft: 8,
    paddingRight: 8,
    // width: 80,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  playButton: {
    justifyContent: 'center',
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 4,
    marginTop: 6,
    marginBottom: 6,
    marginLeft: 8,
    marginRight: 6,
  },
  playButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButtonText: {
    marginLeft: 4,
  },
  buttonText: {
    // height: 38,
    // lineHeight: 38,
    textAlign: 'center',
    paddingLeft: 2,
    paddingRight: 2,
    // paddingTop: 10,
    paddingTop: 3,
    paddingBottom: 3,
    borderBottomWidth: BorderWidths.normal3,
    // width: 80,
  },
})
