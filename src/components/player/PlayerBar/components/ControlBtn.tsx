import { memo, useCallback, useMemo, useRef } from 'react'
import { Animated, Pressable, StyleSheet, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useIsPlay } from '@/store/player/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useHorizontalMode } from '@/utils/hooks'
import { scaleSizeW } from '@/utils/pixelRatio'

const TRANSITION_DURATION = 200
const BUTTON_SIZE = scaleSizeW(42)
const PRIMARY_BUTTON_SIZE = scaleSizeW(54)

const handlePlayPrev = () => {
  void playPrev()
}
const handlePlayNext = () => {
  void playNext()
}

const GlassControlButton = memo(({ iconName, onPress, isPrimary = false }: {
  iconName: string
  onPress: () => void
  isPrimary?: boolean
}) => {
  const scale = useRef(new Animated.Value(1)).current
  const glow = useRef(new Animated.Value(0)).current

  const animateTo = useCallback((nextScale: number, nextGlow: number) => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: nextScale,
        duration: TRANSITION_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(glow, {
        toValue: nextGlow,
        duration: TRANSITION_DURATION,
        useNativeDriver: false,
      }),
    ]).start()
  }, [glow, scale])

  const animatedStyle = useMemo(() => {
    const backgroundColor = glow.interpolate({
      inputRange: [0, 1],
      outputRange: [
        isPrimary ? 'rgba(176,184,194,0.48)' : 'rgba(142,150,161,0.32)',
        isPrimary ? 'rgba(202,209,218,0.62)' : 'rgba(174,182,192,0.46)',
      ],
    })
    const borderColor = glow.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.34)'],
    })
    const shadowOpacity = glow.interpolate({
      inputRange: [0, 1],
      outputRange: [isPrimary ? 0.18 : 0.1, isPrimary ? 0.34 : 0.22],
    })
    const shadowRadius = glow.interpolate({
      inputRange: [0, 1],
      outputRange: [isPrimary ? 14 : 10, isPrimary ? 24 : 18],
    })
    return {
      backgroundColor,
      borderColor,
      shadowOpacity,
      shadowRadius,
      transform: [{ scale }],
    }
  }, [glow, isPrimary, scale])

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => { animateTo(1.08, 1) }}
      onHoverOut={() => { animateTo(1, 0) }}
      onPressIn={() => { animateTo(isPrimary ? 0.92 : 0.96, 1) }}
      onPressOut={() => { animateTo(1, 0) }}
      style={styles.pressable}
    >
      <Animated.View style={[
        styles.controlBtn,
        isPrimary ? styles.controlBtnPrimary : styles.controlBtnNormal,
        animatedStyle,
      ]}>
        <Icon name={iconName} color='#fff' size={isPrimary ? 22 : 18} />
      </Animated.View>
    </Pressable>
  )
})

const PlayPrevBtn = () => <GlassControlButton iconName='prevMusic' onPress={handlePlayPrev} />

const PlayNextBtn = () => <GlassControlButton iconName='nextMusic' onPress={handlePlayNext} />

const TogglePlayBtn = () => {
  const isPlay = useIsPlay()

  return <GlassControlButton iconName={isPlay ? 'pause' : 'play'} onPress={togglePlay} isPrimary />
}

export default () => {
  const isHorizontalMode = useHorizontalMode()
  return (
    <View style={styles.container}>
      {/* <TouchableOpacity activeOpacity={0.5} onPress={toggleNextPlayMode}>
        <Text style={{ ...styles.cotrolBtn }}>
          <Icon name={playModeIcon} style={{ color: theme.secondary10 }} size={18} />
        </Text>
      </TouchableOpacity>
    */}
      {/* {btnPrev} */}
      { isHorizontalMode ? <PlayPrevBtn /> : null }
      <TogglePlayBtn />
      <PlayNextBtn />
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleSizeW(8),
  },
  pressable: {
    borderRadius: PRIMARY_BUTTON_SIZE / 2,
  },
  controlBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  buttonSurface: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonTopSheen: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 0,
    height: '42%',
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  buttonBottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '46%',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  buttonInnerLine: {
    position: 'absolute',
    top: 1,
    left: 6,
    right: 6,
    height: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.34)',
  },
  controlBtnNormal: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
  },
  controlBtnPrimary: {
    width: PRIMARY_BUTTON_SIZE,
    height: PRIMARY_BUTTON_SIZE,
    borderRadius: PRIMARY_BUTTON_SIZE / 2,
  },
})
