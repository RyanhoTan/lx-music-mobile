import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, PanResponder, Pressable, View } from 'react-native'
import { useKeyboard, useWindowSize } from '@/utils/hooks'

import Pic from './components/Pic'
import Title from './components/Title'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import ImageBackground from '@/components/common/ImageBackground'
import Image, { defaultHeaders } from '@/components/common/Image'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import { getPlayerBarImageAverageBrightness } from './native'
import { scaleSizeH } from '@/utils/pixelRatio'
import { useStatusbarHeight } from '@/store/common/hook'
import { setLoadErrorPicUrl, setMusicInfo } from '@/core/player/playInfo'

const imageBrightnessCache = new Map<string, number>()

const FLOATING_GAP = 16
const PLAYER_BAR_RADIUS = 20
const PLAYER_BAR_HORIZONTAL_PADDING = 14
const EXPANDED_PIC_SIZE = scaleSizeH(64)
const PIC_DRAG_ACTIVE_OFFSET = scaleSizeH(10)
const COLLAPSED_IMAGE_SIZE = scaleSizeH(52)
const COLLAPSED_SHELL_SIZE = COLLAPSED_IMAGE_SIZE + scaleSizeH(14)
const COLLAPSED_EDGE_GAP = 10
const COLLAPSED_RIGHT_PADDING = 40
const COLLAPSE_ANIMATION_DURATION = 220
const EXPAND_ANIMATION_DURATION = 320
const EXPAND_ANIMATION_EASING = Easing.bezier(0.2, 0.9, 0.22, 1)

const clamp = (value: number, min: number, max: number) => {
  if (value < min) return min
  if (value > max) return max
  return value
}

const getCollapsedVerticalPadding = (statusbarHeight: number) => {
  return statusbarHeight + COLLAPSED_EDGE_GAP
}

const getBubbleBounds = (windowWidth: number, windowHeight: number, statusbarHeight: number) => {
  const verticalPadding = getCollapsedVerticalPadding(statusbarHeight)
  return {
    minX: COLLAPSED_EDGE_GAP,
    maxX: Math.max(COLLAPSED_EDGE_GAP, windowWidth - COLLAPSED_SHELL_SIZE - COLLAPSED_RIGHT_PADDING),
    minY: verticalPadding,
    maxY: Math.max(verticalPadding, windowHeight - COLLAPSED_SHELL_SIZE - verticalPadding),
  }
}

const getDefaultBubblePosition = (windowWidth: number, windowHeight: number, statusbarHeight: number) => {
  const bounds = getBubbleBounds(windowWidth, windowHeight, statusbarHeight)
  return {
    x: bounds.maxX,
    y: bounds.maxY,
  }
}

const clampBubblePosition = (x: number, y: number, windowWidth: number, windowHeight: number, statusbarHeight: number) => {
  const bounds = getBubbleBounds(windowWidth, windowHeight, statusbarHeight)
  return {
    x: clamp(x, bounds.minX, bounds.maxX),
    y: clamp(y, bounds.minY, bounds.maxY),
  }
}

const snapBubbleToEdge = (x: number, y: number, windowWidth: number, windowHeight: number, statusbarHeight: number) => {
  const bounds = getBubbleBounds(windowWidth, windowHeight, statusbarHeight)
  const nextY = clamp(y, bounds.minY, bounds.maxY)
  const centerX = x + COLLAPSED_SHELL_SIZE / 2

  return {
    x: centerX < windowWidth / 2 ? bounds.minX : bounds.maxX,
    y: nextY,
  }
}

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
  const windowSize = useWindowSize()
  const statusbarHeight = useStatusbarHeight()
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const [imageBrightness, setImageBrightness] = useState<number | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [isExpanding, setIsExpanding] = useState(false)
  const [isPicDragging, setIsPicDragging] = useState(false)
  const [playerAreaSize, setPlayerAreaSize] = useState({ width: windowSize.width, height: windowSize.height })
  const areaWidth = playerAreaSize.width || windowSize.width
  const areaHeight = playerAreaSize.height || windowSize.height
  const maxPicDragDistance = useMemo(() => {
    const barWidth = Math.max(0, areaWidth - FLOATING_GAP * 2)
    return Math.max(0, barWidth - PLAYER_BAR_HORIZONTAL_PADDING * 2 - EXPANDED_PIC_SIZE)
  }, [areaWidth])
  const picCollapseThreshold = useMemo(() => maxPicDragDistance * 0.5, [maxPicDragDistance])
  const [bubbleLocation, setBubbleLocation] = useState(() => getDefaultBubblePosition(areaWidth, areaHeight, statusbarHeight))
  const picDragX = useRef(new Animated.Value(0)).current
  const expandProgress = useRef(new Animated.Value(0)).current
  const bubblePositionRef = useRef(getDefaultBubblePosition(areaWidth, areaHeight, statusbarHeight))
  const bubbleDragStartRef = useRef(bubblePositionRef.current)
  const hasPlacedBubbleRef = useRef(false)
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
  const expandTranslateX = useMemo(() => Math.max(scaleSizeH(56), Math.min(scaleSizeH(132), areaWidth * 0.28)), [areaWidth])
  const expandedBarAnimatedStyle = useMemo(() => (
    isExpanding
      ? {
          opacity: expandProgress.interpolate({
            inputRange: [0, 0.22, 1],
            outputRange: [0, 0.88, 1],
          }),
          transform: [
            {
              translateX: expandProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [expandTranslateX, 0],
              }),
            },
            {
              scaleX: expandProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.94, 1],
              }),
            },
          ],
        }
      : null
  ), [expandProgress, expandTranslateX, isExpanding])
  const expandedContentAnimatedStyle = useMemo(() => (
    isExpanding
      ? {
          opacity: expandProgress.interpolate({
            inputRange: [0, 0.45, 1],
            outputRange: [0, 0, 1],
          }),
          transform: [
            {
              translateX: expandProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [scaleSizeH(24), 0],
              }),
            },
          ],
        }
      : null
  ), [expandProgress, isExpanding])

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

  useEffect(() => {
    Animated.timing(picDragX, {
      toValue: 0,
      duration: collapsed ? COLLAPSE_ANIMATION_DURATION : 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [collapsed, picDragX])

  useEffect(() => {
    const nextPosition = hasPlacedBubbleRef.current
      ? snapBubbleToEdge(
        bubblePositionRef.current.x,
        bubblePositionRef.current.y,
        areaWidth,
        areaHeight,
        statusbarHeight,
      )
      : getDefaultBubblePosition(areaWidth, areaHeight, statusbarHeight)

    bubblePositionRef.current = nextPosition
    setBubbleLocation(nextPosition)
  }, [areaHeight, areaWidth, statusbarHeight])

  const handleImageError = useCallback((url: string | number) => {
    setLoadErrorPicUrl(url as string)
    setMusicInfo({
      pic: null,
    })
  }, [])

  const collapsePlayerBar = useCallback(() => {
    expandProgress.stopAnimation()
    expandProgress.setValue(0)
    setIsExpanding(false)
    const nextPosition = hasPlacedBubbleRef.current
      ? snapBubbleToEdge(
        bubblePositionRef.current.x,
        bubblePositionRef.current.y,
        areaWidth,
        areaHeight,
        statusbarHeight,
      )
      : getDefaultBubblePosition(areaWidth, areaHeight, statusbarHeight)

    hasPlacedBubbleRef.current = true
    bubblePositionRef.current = nextPosition
    setBubbleLocation(nextPosition)
    setCollapsed(true)
  }, [areaHeight, areaWidth, expandProgress, statusbarHeight])

  const expandPlayerBar = useCallback(() => {
    setCollapsed(false)
    setIsExpanding(true)
    requestAnimationFrame(() => {
      expandProgress.stopAnimation()
      expandProgress.setValue(0)
      Animated.timing(expandProgress, {
        toValue: 1,
        duration: EXPAND_ANIMATION_DURATION,
        easing: EXPAND_ANIMATION_EASING,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return
        setIsExpanding(false)
        expandProgress.setValue(0)
      })
    })
  }, [expandProgress])

  const picPanResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gestureState) => {
      if (collapsed) return false
      if (gestureState.dx < PIC_DRAG_ACTIVE_OFFSET) return false
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
    },
    onPanResponderGrant: () => {
      setIsPicDragging(true)
    },
    onPanResponderMove: (_, gestureState) => {
      picDragX.setValue(clamp(gestureState.dx, 0, maxPicDragDistance))
    },
    onPanResponderRelease: (_, gestureState) => {
      setIsPicDragging(false)
      if (gestureState.dx >= picCollapseThreshold && maxPicDragDistance > 0) {
        collapsePlayerBar()
        return
      }
      Animated.timing(picDragX, {
        toValue: 0,
        duration: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
    },
    onPanResponderTerminate: () => {
      setIsPicDragging(false)
      Animated.timing(picDragX, {
        toValue: 0,
        duration: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
    },
  }), [collapsePlayerBar, collapsed, maxPicDragDistance, picCollapseThreshold, picDragX])

  const bubblePanResponder = useMemo(() => PanResponder.create({
    onPanResponderGrant: () => {
      bubbleDragStartRef.current = bubblePositionRef.current
    },
    onMoveShouldSetPanResponderCapture: (_, gestureState) => {
      if (!collapsed) return false
      return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2
    },
    onPanResponderMove: (_, gestureState) => {
      const nextPosition = clampBubblePosition(
        bubbleDragStartRef.current.x + gestureState.dx,
        bubbleDragStartRef.current.y + gestureState.dy,
        areaWidth,
        areaHeight,
        statusbarHeight,
      )
      bubblePositionRef.current = nextPosition
      setBubbleLocation(nextPosition)
    },
    onPanResponderRelease: () => {
      const nextPosition = snapBubbleToEdge(
        bubblePositionRef.current.x,
        bubblePositionRef.current.y,
        areaWidth,
        areaHeight,
        statusbarHeight,
      )
      bubblePositionRef.current = nextPosition
      setBubbleLocation(nextPosition)
    },
    onPanResponderTerminate: () => {
      const nextPosition = snapBubbleToEdge(
        bubblePositionRef.current.x,
        bubblePositionRef.current.y,
        areaWidth,
        areaHeight,
        statusbarHeight,
      )
      bubblePositionRef.current = nextPosition
      setBubbleLocation(nextPosition)
    },
  }), [areaHeight, areaWidth, collapsed, statusbarHeight])

  const picDragAnimatedStyle = useMemo(() => ({
    transform: [{ translateX: picDragX }],
  }), [picDragX])

  if (autoHidePlayBar && keyboardShown) return null

  return (
    <View
      pointerEvents="box-none"
      style={styles.rootLayer}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout
        if (!width || !height) return
        setPlayerAreaSize(prev => prev.width == width && prev.height == height ? prev : { width, height })
      }}
    >
      {
        collapsed
          ? (
            <Animated.View
              pointerEvents="auto"
              style={[
                styles.bubbleLayer,
                {
                  left: bubbleLocation.x,
                  top: bubbleLocation.y,
                },
              ]}
              {...bubblePanResponder.panHandlers}
            >
              <Pressable onPress={expandPlayerBar} style={styles.bubblePressable}>
                <View style={[
                  styles.bubbleShell,
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
                  <Image
                    url={musicInfo.pic}
                    style={styles.bubbleImage}
                    onError={handleImageError}
                  />
                </View>
              </Pressable>
            </Animated.View>
            )
          : (
            <View pointerEvents={isExpanding ? 'none' : 'box-none'} style={styles.expandedLayer}>
              <Animated.View style={[
                styles.shadowWrap,
                shadowStyle,
                expandedBarAnimatedStyle,
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
                  <Animated.View {...picPanResponder.panHandlers} style={picDragAnimatedStyle}>
                    <Pic isHome={isHome} />
                  </Animated.View>
                  {
                    isPicDragging
                      ? null
                      : (
                        <>
                          <Animated.View style={[
                            styles.center,
                            expandedContentAnimatedStyle,
                          ]}>
                            <Title isHome={isHome} color={textColors.primary} />
                            <PlayInfo
                              isHome={isHome}
                              statusColor={textColors.secondary}
                              timeColor={textColors.secondary}
                              separatorColor={textColors.tertiary}
                            />
                          </Animated.View>
                          <Animated.View style={[
                            styles.right,
                            expandedContentAnimatedStyle,
                          ]}>
                            <ControlBtn />
                          </Animated.View>
                        </>
                        )
                  }
                </View>
              </Animated.View>
            </View>
            )
      }
    </View>
  )
})


const styles = createStyle({
  rootLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  expandedLayer: {
    position: 'absolute',
    left: FLOATING_GAP,
    right: FLOATING_GAP,
    bottom: FLOATING_GAP,
    alignItems: 'center',
    zIndex: 10,
  },
  shadowWrap: {
    width: '100%',
    minWidth: 292,
    borderRadius: PLAYER_BAR_RADIUS,
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
    borderRadius: PLAYER_BAR_RADIUS,
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
  bubbleLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: COLLAPSED_SHELL_SIZE,
    height: COLLAPSED_SHELL_SIZE,
    zIndex: 30,
  },
  bubblePressable: {
    width: '100%',
    height: '100%',
  },
  bubbleShell: {
    width: '100%',
    height: '100%',
    padding: scaleSizeH(7),
    borderRadius: PLAYER_BAR_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  bubbleImage: {
    width: COLLAPSED_IMAGE_SIZE,
    height: COLLAPSED_IMAGE_SIZE,
    borderRadius: PLAYER_BAR_RADIUS,
    overflow: 'hidden',
  },
})
