import { memo, useMemo } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { confirmDialog, createStyle, exitApp as backHome } from '@/utils/tools'
import { NAV_MENUS } from '@/config/constant'
import type { InitState } from '@/store/common/state'
// import commonState from '@/store/common/state'
import { exitApp, setNavActiveId } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import ImageBackground from '@/components/common/ImageBackground'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { getHomeNavBlurSource, getHomeNavForegroundPalette } from '../navAppearance'

const NAV_WIDTH = 84
const ITEM_SIZE = 46

const styles = createStyle({
  container: {
    width: NAV_WIDTH,
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 8,
    marginRight: 10,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 8,
      height: 0,
    },
    shadowRadius: 28,
  },
  containerDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    shadowOpacity: 0.22,
  },
  containerLight: {
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderColor: 'rgba(255,255,255,0.42)',
    shadowOpacity: 0.12,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  blurBackgroundImage: {
    opacity: 0.58,
  },
  blurOverlay: {
    flex: 1,
  },
  blurOverlayDark: {
    backgroundColor: 'rgba(18, 22, 28, 0.38)',
  },
  blurOverlayLight: {
    backgroundColor: 'rgba(255,255,255,0.26)',
  },
  content: {
    flex: 1,
    paddingBottom: 10,
  },
  header: {
    paddingTop: 15,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    textAlign: 'center',
    marginLeft: 16,
  },
  menus: {
    flex: 1,
  },
  list: {
    alignItems: 'center',
    paddingBottom: 15,
  },
  menuItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
  idleShell: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeShell: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
  },
  activeShellDark: {
    backgroundColor: 'rgba(142,150,161,0.32)',
    borderColor: 'rgba(255,255,255,0.18)',
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  activeShellLight: {
    backgroundColor: 'rgba(176,184,194,0.32)',
    borderColor: 'rgba(255,255,255,0.26)',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
})

const Header = ({ iconColor }: { iconColor: string }) => {
  const statusBarHeight = useStatusbarHeight()
  return (
    <View style={{ paddingTop: statusBarHeight }}>
      <View style={styles.header}>
        <Icon name="logo" color={iconColor} size={22} />
        {/* <Text style={styles.headerText} size={16} color={theme['c-primary-dark-100-alpha-300']}>LX Music</Text> */}
      </View>
    </View>
  )
}

type IdType = InitState['navActiveId'] | 'nav_exit' | 'back_home'

const MenuItem = ({ id, icon, onPress }: {
  id: IdType
  icon: string
  onPress: (id: IdType) => void
}) => {
  const activeId = useNavActiveId()
  const theme = useTheme()
  const palette = useMemo(() => getHomeNavForegroundPalette(theme.isDark), [theme.isDark])
  const activeShellTone = theme.isDark ? styles.activeShellDark : styles.activeShellLight

  return activeId == id
    ? <View style={styles.menuItem}>
        <View style={[styles.activeShell, activeShellTone]}>
          <Icon name={icon} size={20} color={palette.primary} />
        </View>
      </View>
    : <TouchableOpacity style={styles.menuItem} onPress={() => { onPress(id) }} activeOpacity={0.72}>
        <View style={styles.idleShell}>
          <Icon name={icon} size={20} color={palette.secondary} />
        </View>
      </TouchableOpacity>
}

export default memo(() => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const palette = useMemo(() => getHomeNavForegroundPalette(theme.isDark), [theme.isDark])
  const blurSource = useMemo(() => getHomeNavBlurSource(musicInfo.pic), [musicInfo.pic])
  const containerTone = theme.isDark ? styles.containerDark : styles.containerLight
  const blurOverlayTone = theme.isDark ? styles.blurOverlayDark : styles.blurOverlayLight
  // console.log('render drawer nav')
  const showBackBtn = useSettingValue('common.showBackBtn')
  const showExitBtn = useSettingValue('common.showExitBtn')

  const handlePress = (id: IdType) => {
    switch (id) {
      case 'nav_exit':
        void confirmDialog({
          message: global.i18n.t('exit_app_tip'),
          confirmButtonText: global.i18n.t('list_remove_tip_button'),
        }).then(isExit => {
          if (!isExit) return
          exitApp('Exit Btn')
        })
        return
      case 'back_home':
        backHome()
        return
    }

    global.app_event.changeMenuVisible(false)
    setNavActiveId(id)
  }

  return (
    <View style={[styles.container, containerTone]}>
      {
        blurSource
          ? (
            <ImageBackground
              style={styles.blurBackground}
              imageStyle={styles.blurBackgroundImage}
              source={blurSource}
              blurRadius={18}
              resizeMode="cover"
            >
              <View style={[styles.blurOverlay, blurOverlayTone]} />
            </ImageBackground>
            )
          : <View pointerEvents="none" style={[styles.blurBackground, blurOverlayTone]} />
      }
      <View style={styles.content}>
        <Header iconColor={palette.primary} />
        <ScrollView style={styles.menus} contentContainerStyle={styles.list}>
          {NAV_MENUS.map(menu => <MenuItem key={menu.id} id={menu.id} icon={menu.icon} onPress={handlePress} />)}
        </ScrollView>
        {
          showBackBtn ? <MenuItem id="back_home" icon="home" onPress={handlePress} /> : null
        }
        {
          showExitBtn ? <MenuItem id="nav_exit" icon="exit2" onPress={handlePress} /> : null
        }
      </View>
    </View>
  )
})

