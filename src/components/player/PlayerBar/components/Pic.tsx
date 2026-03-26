import { StyleSheet, TouchableOpacity } from 'react-native'
import { navigations } from '@/navigation'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import { LIST_IDS, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import Image from '@/components/common/Image'
import { useCallback } from 'react'
import { setLoadErrorPicUrl, setMusicInfo } from '@/core/player/playInfo'

const PIC_HEIGHT = scaleSizeH(64)

const styles = StyleSheet.create({
  container: {
    width: PIC_HEIGHT,
    height: PIC_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(180,188,198,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: scaleSizeH(8),
    right: scaleSizeH(8),
    height: scaleSizeH(12),
    borderBottomLeftRadius: scaleSizeH(12),
    borderBottomRightRadius: scaleSizeH(12),
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  shade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  innerLine: {
    position: 'absolute',
    top: 1,
    left: scaleSizeH(6),
    right: scaleSizeH(6),
    height: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.34)',
  },
})

export default ({ isHome }: { isHome: boolean }) => {
  const musicInfo = usePlayerMusicInfo()
  const handlePress = () => {
    // console.log('')
    // console.log(playMusicInfo)
    if (!musicInfo.id) return
    navigations.pushPlayDetailScreen(commonState.componentIds.home!)

    // toast(global.i18n.t('play_detail_todo_tip'), 'long')
  }

  const handleLongPress = () => {
    if (!isHome) return
    const listId = playerState.playMusicInfo.listId
    if (!listId || listId == LIST_IDS.DOWNLOAD) return
    global.app_event.jumpListPosition()
  }

  const handleError = useCallback((url: string | number) => {
    setLoadErrorPicUrl(url as string)
    setMusicInfo({
      pic: null,
    })
  }, [])

  return (
    <TouchableOpacity onLongPress={handleLongPress} onPress={handlePress} activeOpacity={0.78} style={styles.container}>
      <Image url={musicInfo.pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={styles.image} onError={handleError} />
    </TouchableOpacity>
  )
}


// const styles = StyleSheet.create({
//   playInfoImg: {

//   },
// })
