import { useCallback, useRef, forwardRef, useImperativeHandle, useState, useMemo } from 'react'
import { View } from 'react-native'
import Input, { type InputType, type InputProps } from '@/components/common/Input'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import ImageBackground from '@/components/common/ImageBackground'
import { Icon } from '@/components/common/Icon'
import { getHomeNavBlurSource } from '@/screens/Home/navAppearance'

export interface SearchInputProps {
  onChangeText: (text: string) => void
  onSubmit: (text: string) => void
  onBlur: () => void
  onTouchStart: () => void
}

export interface SearchInputType {
  setText: (text: string) => void
  // getText: () => string
  focus: () => void
  blur: () => void
}

export default forwardRef<SearchInputType, SearchInputProps>(({ onChangeText, onSubmit, onBlur, onTouchStart }, ref) => {
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const blurSource = useMemo(() => getHomeNavBlurSource(musicInfo.pic), [musicInfo.pic])
  const shellTone = theme.isDark ? styles.shellDark : styles.shellLight
  const blurOverlayTone = theme.isDark ? styles.blurOverlayDark : styles.blurOverlayLight
  const iconColor = theme.isDark ? 'rgba(255,255,255,0.62)' : 'rgba(16, 20, 26, 0.58)'

  useImperativeHandle(ref, () => ({
    // getText() {
    //   return text.trim()
    // },
    setText(text) {
      setText(text)
    },
    focus() {
      inputRef.current?.focus()
    },
    blur() {
      inputRef.current?.blur()
    },
  }))

  const handleChangeText = (text: string) => {
    setText(text)
    onChangeText(text.trim())
  }

  const handleClearText = useCallback(() => {
    setText('')
    onChangeText('')
    onSubmit('')
  }, [onChangeText, onSubmit])

  const handleSubmit = useCallback<NonNullable<InputProps['onSubmitEditing']>>(({ nativeEvent: { text } }) => {
    onSubmit(text)
  }, [onSubmit])

  return (
    <View style={styles.container}>
      <View style={[styles.shell, shellTone]}>
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
                <View style={[styles.blurOverlay, blurOverlayTone]} />
              </ImageBackground>
              )
            : <View pointerEvents="none" style={[styles.blurBackground, blurOverlayTone]} />
        }
        <View style={styles.icon}>
          <Icon name="search-2" color={iconColor} size={16} />
        </View>
        <Input
          ref={inputRef}
          placeholder="Search for something..."
          value={text}
          onChangeText={handleChangeText}
          style={styles.input}
          onBlur={onBlur}
          onSubmitEditing={handleSubmit}
          onClearText={handleClearText}
          onTouchStart={onTouchStart}
          clearBtn
        />
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  shell: {
    minHeight: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowRadius: 18,
  },
  shellDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    shadowOpacity: 0.16,
  },
  shellLight: {
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderColor: 'rgba(255,255,255,0.42)',
    shadowOpacity: 0.08,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  blurBackgroundImage: {
    opacity: 0.5,
  },
  blurOverlay: {
    flex: 1,
  },
  blurOverlayDark: {
    backgroundColor: 'rgba(18, 22, 28, 0.3)',
  },
  blurOverlayLight: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  icon: {
    flexGrow: 0,
    flexShrink: 0,
    paddingLeft: 12,
    paddingRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingLeft: 4,
    paddingRight: 0,
  },
})
