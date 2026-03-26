import { useLrcPlay } from '@/plugins/lyric'
import { useStatusText } from '@/store/player/hook'
// import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'


export default ({ autoUpdate, color }: { autoUpdate: boolean, color: string }) => {
  const { text } = useLrcPlay(autoUpdate)
  const statusText = useStatusText()
  // console.log('render status')

  const status = text || statusText

  return <Text numberOfLines={1} size={11} color={color}>{status || ' '}</Text>
}

// const styles = createStyle({
//   text: {
//     // fontSize: 10,
//     // lineHeight: 18,
//     // height: 18,
//     // height: '100%',
//     // backgroundColor: 'rgba(0,0,0,0.2)',
//   },
// })
