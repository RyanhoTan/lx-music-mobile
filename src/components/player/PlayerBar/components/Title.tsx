import { TouchableOpacity } from 'react-native'
import { navigations } from '@/navigation'
import { usePlayerMusicInfo } from '@/store/player/hook'
// import { toast } from '@/utils/tools'
import { useSettingValue } from '@/store/setting/hook'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import Text from '@/components/common/Text'
import { LIST_IDS } from '@/config/constant'
import { createStyle } from '@/utils/tools'


export default ({ isHome, color }: { isHome: boolean, color: string }) => {
  // const { t } = useTranslation()
  const musicInfo = usePlayerMusicInfo()
  const downloadFileName = useSettingValue('download.fileName')

  const handlePress = () => {
    // console.log('')
    // console.log(playMusicInfo)
    if (!musicInfo.id) return
    navigations.pushPlayDetailScreen(commonState.componentIds.home!)
    // toast(global.i18n.t('play_detail_todo_tip'), 'long')
  }

  const handleLongPress = () => {
    const listId = playerState.playMusicInfo.listId
    if (!listId || listId == LIST_IDS.DOWNLOAD) return
    global.app_event.jumpListPosition()
  }
  // console.log('render title')

  const title = musicInfo.id
    ? musicInfo.singer
      ? downloadFileName.replace('歌手', musicInfo.singer).replace('歌名', musicInfo.name)
      : musicInfo.name
    : ''
  // console.log(playMusicInfo)
  return (
    <TouchableOpacity style={styles.container} onLongPress={handleLongPress} onPress={handlePress} activeOpacity={0.7} >
      <Text size={15} color={color} numberOfLines={1} style={styles.title}>{title}</Text>
    </TouchableOpacity>
  )
}
// const Singer = () => {
//   const playMusicInfo = useGetter('player', 'playMusicInfo')
//   return (
//     <View style={{ flexGrow: 0, flexShrink: 0 }}>
//       <Text style={{ width: '100%', color: AppColors.normal }} numberOfLines={1}>
//         {playMusicInfo ? playMusicInfo.musicInfo.singer : ''}
//       </Text>
//     </View>
//   )
// }
// const MusicName = () => {
//   const playMusicInfo = useGetter('player', 'playMusicInfo')
//   return (
//     <View style={{ flexGrow: 0, flexShrink: 1 }}>
//       <Text style={{ width: '100%', color: AppColors.normal }} numberOfLines={1}>
//         {playMusicInfo ? playMusicInfo.musicInfo.name : '^-^'}
//       </Text>
//     </View>
//   )
// }

const styles = createStyle({
  container: {
    width: '100%',
    paddingBottom: 6,
  },
  title: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
})
