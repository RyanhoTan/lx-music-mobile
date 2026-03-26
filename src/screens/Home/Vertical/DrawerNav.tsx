import { memo, useMemo } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { useI18n } from '@/lang'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { confirmDialog, createStyle, exitApp as backHome } from '@/utils/tools'
import { NAV_MENUS } from '@/config/constant'
import type { InitState } from '@/store/common/state'
// import { navigations } from '@/navigation'
// import commonState from '@/store/common/state'
import { exitApp, setNavActiveId } from '@/core/common'
import Text from '@/components/common/Text'
import { useSettingValue } from '@/store/setting/hook'
import { getHistoryListName } from '@/core/history'
import ImageBackground from '@/components/common/ImageBackground'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { getHomeNavBlurSource, getHomeNavForegroundPalette } from '../navAppearance'

const styles = createStyle({
  container: {
    flex: 1,
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 8,
    marginRight: 8,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 10,
      height: 0,
    },
    shadowRadius: 30,
  },
  containerDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    shadowOpacity: 0.24,
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
    opacity: 1,
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
    paddingTop: 20,
    paddingBottom: 34,
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
    paddingTop: 6,
    paddingBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    paddingTop: 13,
    paddingBottom: 13,
    paddingLeft: 18,
    paddingRight: 18,
    alignItems: 'center',
    marginLeft: 12,
    marginRight: 12,
    borderRadius: 22,
  },
  menuItemActiveDark: {
    backgroundColor: 'rgba(142,150,161,0.32)',
    borderColor: 'rgba(255,255,255,0.18)',
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  menuItemActiveLight: {
    backgroundColor: 'rgba(176,184,194,0.32)',
    borderColor: 'rgba(255,255,255,0.26)',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  iconContent: {
    width: 24,
    alignItems: 'center',
  },
  text: {
    paddingLeft: 20,
  },
  menuItemActive: {
    borderWidth: 1,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
  },
})

const Header = ({ iconColor, textColor }: { iconColor: string, textColor: string }) => {
  const statusBarHeight = useStatusbarHeight()
  return (
    <View style={{ paddingTop: statusBarHeight }}>
      <View style={styles.header}>
        <Icon name="logo" color={iconColor} size={28} />
        <Text style={styles.headerText} size={28} color={textColor}>LX Music</Text>
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
  const t = useI18n()
  const activeId = useNavActiveId()
  const theme = useTheme()
  const label = id == 'nav_history' ? getHistoryListName() : t(id)
  const palette = useMemo(() => getHomeNavForegroundPalette(theme.isDark), [theme.isDark])
  const activeTone = theme.isDark ? styles.menuItemActiveDark : styles.menuItemActiveLight

  return activeId == id
    ? <View style={[styles.menuItem, styles.menuItemActive, activeTone]}>
        <View style={styles.iconContent}>
          <Icon name={icon} size={20} color={palette.primary} />
        </View>
        <Text style={styles.text} color={palette.primary}>{label}</Text>
      </View>
    : <TouchableOpacity style={styles.menuItem} onPress={() => { onPress(id) }} activeOpacity={0.72}>
        <View style={styles.iconContent}>
          <Icon name={icon} size={20} color={palette.secondary} />
        </View>
        <Text style={styles.text} color={palette.secondary}>{label}</Text>
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
        <Header iconColor={palette.primary} textColor={palette.primary} />
        <ScrollView style={styles.menus}>
          <View style={styles.list}>
            {NAV_MENUS.map(menu => <MenuItem key={menu.id} id={menu.id} icon={menu.icon} onPress={handlePress} />)}
          </View>
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
