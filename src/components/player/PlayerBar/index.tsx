import { memo, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useKeyboard } from '@/utils/hooks'

import Pic from './components/Pic'
import Title from './components/Title'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import ImageBackground from '@/components/common/ImageBackground'
import { defaultHeaders } from '@/components/common/Image'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import { getPlayerBarImageAverageBrightness } from './native'

const imageBrightnessCache = new Map<string, number>()

const getCoverUri = (pic: string | number | null | undefined) => {
  if (!pic || typeof pic == 'number') return null
  if (pic.startsWith('/')) return `file://${pic}`
  return pic
}

const getPlayerBarTextColors = (isDarkTheme: boolean, imageBrightness: number | null) => {
  const useDarkForeground = !isDarkTheme && (imageBrightness == null || imageBrightness >= 0.54)

  return useDarkForeground
    ? {
        primary: 'rgba(16, 20, 26, 0.94)',
        secondary: 'rgba(16, 20, 26, 0.72)',
        tertiary: 'rgba(16, 20, 26, 0.42)',
      }
    : {
        primary: 'rgba(255,255,255,0.96)',
        secondary: 'rgba(255,255,255,0.74)',
        tertiary: 'rgba(255,255,255,0.48)',
      }
}

export default memo(({ isHome = false }: { isHome?: boolean }) => {
  const { keyboardShown } = useKeyboard()
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const [imageBrightness, setImageBrightness] = useState<number | null>(null)
  const coverUri = useMemo(() => getCoverUri(musicInfo.pic), [musicInfo.pic])
  const containerStyle = useMemo(() => (
    theme.isDark
      ? styles.containerDark
      : styles.containerLight
  ), [theme.isDark])
  const blurOverlayStyle = useMemo(() => (
    theme.isDark
      ? styles.blurOverlayDark
      : styles.blurOverlayLight
  ), [theme.isDark])
  const shadowStyle = useMemo(() => (
    theme.isDark
      ? styles.shadowWrapDark
      : styles.shadowWrapLight
  ), [theme.isDark])
  const textColors = useMemo(() => getPlayerBarTextColors(theme.isDark, imageBrightness), [imageBrightness, theme.isDark])
  const blurSource = useMemo(() => {
    if (!musicInfo.pic) return null
    if (typeof musicInfo.pic == 'number') return musicInfo.pic
    if (!coverUri) return null
    return coverUri.startsWith('http://') || coverUri.startsWith('https://')
      ? { uri: coverUri, headers: defaultHeaders }
      : { uri: coverUri }
  }, [coverUri, musicInfo.pic])

  useEffect(() => {
    let canceled = false

    if (!coverUri) {
      setImageBrightness(null)
      return () => {
        canceled = true
      }
    }

    const cachedBrightness = imageBrightnessCache.get(coverUri)
    if (cachedBrightness != null) {
      setImageBrightness(cachedBrightness)
      return () => {
        canceled = true
      }
    }

    setImageBrightness(null)

    void getPlayerBarImageAverageBrightness(coverUri).then(result => {
      if (canceled || result == null) return
      const nextBrightness = Math.max(0, Math.min(1, result))
      imageBrightnessCache.set(coverUri, nextBrightness)
      setImageBrightness(nextBrightness)
    }).catch(() => {
      if (canceled) return
      setImageBrightness(null)
    })

    return () => {
      canceled = true
    }
  }, [coverUri])

  const playerComponent = useMemo(() => (
    <View pointerEvents="box-none" style={styles.floatingLayer}>
      <View style={[
        styles.shadowWrap,
        shadowStyle,
      ]}>
        <View style={[
          styles.container,
          containerStyle,
        ]}>
          {
            blurSource
              ? (
                <ImageBackground
                  style={styles.blurBackground}
                  imageStyle={styles.blurBackgroundImage}
                  source={blurSource}
                  blurRadius={14}
                  resizeMode="cover"
                >
                  <View style={[styles.blurOverlay, blurOverlayStyle]} />
                </ImageBackground>
                )
              : <View pointerEvents="none" style={[styles.blurFallback, blurOverlayStyle]} />
          }
          <Pic isHome={isHome} />
          <View style={styles.center}>
            <Title isHome={isHome} color={textColors.primary} />
            <PlayInfo
              isHome={isHome}
              statusColor={textColors.secondary}
              timeColor={textColors.secondary}
              separatorColor={textColors.tertiary}
            />
          </View>
          <View style={styles.right}>
            <ControlBtn />
          </View>
        </View>
      </View>
    </View>
  ), [blurOverlayStyle, blurSource, containerStyle, isHome, shadowStyle, textColors])

  return autoHidePlayBar && keyboardShown ? null : playerComponent
})


const styles = createStyle({
  floatingLayer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    alignItems: 'center',
  },
  shadowWrap: {
    width: '100%',
    minWidth: 292,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowRadius: 30,
  },
  shadowWrapDark: {
    shadowOpacity: 0.5,
  },
  shadowWrapLight: {
    shadowOpacity: 0.18,
  },
  container: {
    width: '100%',
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 14,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  containerDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  containerLight: {
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderColor: 'rgba(255,255,255,0.42)',
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  blurBackgroundImage: {
    opacity: 0.98,
  },
  blurOverlay: {
    flex: 1,
  },
  blurOverlayDark: {
    backgroundColor: 'rgba(18, 22, 28, 0.32)',
  },
  blurOverlayLight: {
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  blurFallback: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  center: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingLeft: 14,
    paddingRight: 14,
  },
  right: {
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    justifyContent: 'center',
  },
})
