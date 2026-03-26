import { useEffect, useRef, useState } from 'react'
import { Animated, Easing } from 'react-native'
import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import { createStyle } from '@/utils/tools'

const HIDE_OFFSET = 132
const ANIMATION_DURATION = 240

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
  const [showPlayerBar, setShowPlayerBar] = useState(true)
  const translateY = useRef(new Animated.Value(0)).current
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (menuVisible) {
      Animated.timing(translateY, {
        toValue: HIDE_OFFSET,
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setShowPlayerBar(false)
      })
      return
    }

    setShowPlayerBar(true)
    translateY.setValue(HIDE_OFFSET)
    requestAnimationFrame(() => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
    })
  }, [menuVisible, translateY])

  return (
    <>
      <Content onMenuVisibleChange={setMenuVisible} />
      {
        showPlayerBar
          ? (
            <Animated.View
              pointerEvents={menuVisible ? 'none' : 'box-none'}
              style={[
                styles.playerBarLayer,
                {
                  transform: [{ translateY }],
                },
              ]}
            >
              <PlayerBar isHome />
            </Animated.View>
            )
          : null
      }
    </>
  )
}
