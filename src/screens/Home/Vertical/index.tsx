import { useEffect, useRef, useState } from 'react'
import { Animated, Easing } from 'react-native'
import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import { createStyle } from '@/utils/tools'

const HIDE_OFFSET = 32
const ANIMATION_DURATION = 220

const styles = createStyle({
  playerBarLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
})

export default () => {
  const [menuVisible, setMenuVisible] = useState(false)
  const translateY = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: menuVisible ? HIDE_OFFSET : 0,
        duration: ANIMATION_DURATION,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: menuVisible ? 0 : 1,
        duration: ANIMATION_DURATION - 20,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
  }, [menuVisible, opacity, translateY])

  return (
    <>
      <Content onMenuVisibleChange={setMenuVisible} />
      <Animated.View
        pointerEvents={menuVisible ? 'none' : 'box-none'}
        style={[
          styles.playerBarLayer,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <PlayerBar isHome />
      </Animated.View>
    </>
  )
}
