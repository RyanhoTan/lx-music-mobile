import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { PanResponder, StyleSheet, View } from 'react-native'

import Status from './Status'
import { useProgress } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { COMPONENT_IDS } from '@/config/constant'
import { usePageVisible } from '@/store/common/hook'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { useBufferProgress } from '@/plugins/player'
import { useSettingValue } from '@/store/setting/hook'
import { useDrag } from '@/utils/hooks'

const FONT_SIZE = 11
const TRACK_HEIGHT = scaleSizeH(4)
const TRACK_TOUCH_HEIGHT = scaleSizeH(22)
const THUMB_SIZE = scaleSizeW(12)
const THUMB_HALO_SIZE = scaleSizeW(24)

const PlayTimeCurrent = ({ timeStr, color }: { timeStr: string, color: string }) => {
  return <Text size={FONT_SIZE} color={color}>{timeStr}</Text>
}

const PlayTimeMax = memo(({ timeStr, color }: { timeStr: string, color: string }) => {
  return <Text size={FONT_SIZE} color={color}>{timeStr}</Text>
})

const ProgressPressLayer = memo(({ onDragState, setDragProgress, onSetProgress }: {
  onDragState: (drag: boolean) => void
  setDragProgress: (progress: number) => void
  onSetProgress: (progress: number) => void
}) => {
  const {
    onLayout,
    onDragStart,
    onDragEnd,
    onDrag,
  } = useDrag(onSetProgress, onDragState, setDragProgress)

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderMove: (evt, gestureState) => {
        onDrag(gestureState.dx)
      },
      onPanResponderGrant: (evt, gestureState) => {
        onDragStart(gestureState.dx, evt.nativeEvent.locationX)
      },
      onPanResponderRelease: () => {
        onDragEnd()
      },
    }),
  ).current

  return <View onLayout={onLayout} style={styles.progressPressLayer} {...panResponder.panHandlers} />
})

const GlassProgress = ({ progress, duration, buffered, allowSeek }: {
  progress: number
  duration: number
  buffered: number
  allowSeek: boolean
}) => {
  const [draging, setDraging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  const durationRef = useRef(duration)

  useEffect(() => {
    durationRef.current = duration
  }, [duration])

  const onSetProgress = useCallback((nextProgress: number) => {
    global.app_event.setProgress(nextProgress * durationRef.current)
  }, [])

  const displayProgress = draging ? dragProgress : progress
  const fillWidth = `${displayProgress * 100}%` as const
  const playedWidth = `${progress * 100}%` as const
  const bufferedWidth = `${buffered * 100}%` as const
  const thumbStyle = draging ? styles.progressThumbActive : null
  const thumbHaloStyle = draging ? styles.progressThumbHaloActive : null

  return (
    <View style={styles.progressShell}>
      <View style={styles.progressTrack}>
        <View style={styles.progressTrackBase} />
        <View style={[styles.progressBuffered, { width: bufferedWidth }]} />
        {
          draging
            ? <View style={[styles.progressGhostFill, { width: playedWidth }]} />
            : null
        }
        <View style={[styles.progressFill, { width: fillWidth }]}>
          <View style={styles.progressFillMidTone} />
          <View style={[styles.progressThumbHalo, thumbHaloStyle]} />
          <View style={[styles.progressThumb, thumbStyle]} />
        </View>
      </View>
      {
        allowSeek
          ? <ProgressPressLayer onDragState={setDraging} setDragProgress={setDragProgress} onSetProgress={onSetProgress} />
          : null
      }
    </View>
  )
}

export default ({ isHome, statusColor, timeColor, separatorColor }: {
  isHome: boolean
  statusColor: string
  timeColor: string
  separatorColor: string
}) => {
  const [autoUpdate, setAutoUpdate] = useState(true)
  const { maxPlayTimeStr, nowPlayTimeStr, progress, maxPlayTime } = useProgress(autoUpdate)
  const buffered = useBufferProgress()
  const allowProgressBarSeek = useSettingValue('common.allowProgressBarSeek')

  usePageVisible([COMPONENT_IDS.home], useCallback((visible) => {
    if (isHome) setAutoUpdate(visible)
  }, [isHome]))

  return (
    <View style={styles.container}>
      <View style={styles.metaRow}>
        <View style={styles.status}>
          <Status autoUpdate={autoUpdate} color={statusColor} />
        </View>
        <View style={styles.time}>
          <PlayTimeCurrent timeStr={nowPlayTimeStr} color={timeColor} />
          <Text size={FONT_SIZE} color={separatorColor}> / </Text>
          <PlayTimeMax timeStr={maxPlayTimeStr} color={timeColor} />
        </View>
      </View>
      <GlassProgress progress={progress} duration={maxPlayTime} buffered={buffered} allowSeek={allowProgressBarSeek} />
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleSizeH(4),
  },
  status: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingRight: scaleSizeW(10),
  },
  time: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
  },
  progressShell: {
    height: TRACK_TOUCH_HEIGHT,
    justifyContent: 'center',
  },
  progressTrack: {
    justifyContent: 'center',
  },
  progressTrackBase: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT,
    backgroundColor: 'rgba(14,16,20,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  progressBuffered: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressGhostFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT,
    backgroundColor: 'rgba(246,246,246,0.96)',
    overflow: 'visible',
  },
  progressFillMidTone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '56%',
    borderRadius: TRACK_HEIGHT,
    backgroundColor: 'rgba(91, 77, 77, 0.78)',
  },
  progressFillTail: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '28%',
    borderRadius: TRACK_HEIGHT,
    backgroundColor: 'rgba(170,170,170,0.82)',
  },
  progressThumbHalo: {
    position: 'absolute',
    right: -(THUMB_HALO_SIZE / 2),
    top: -((THUMB_HALO_SIZE - TRACK_HEIGHT) / 2),
    width: THUMB_HALO_SIZE,
    height: THUMB_HALO_SIZE,
    borderRadius: THUMB_HALO_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.28)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
  },
  progressThumbHaloActive: {
    backgroundColor: 'rgba(255,255,255,0.34)',
    shadowOpacity: 0.42,
    shadowRadius: 999,
  },
  progressThumb: {
    position: 'absolute',
    right: -(THUMB_SIZE / 2),
    top: -((THUMB_SIZE - TRACK_HEIGHT) / 2),
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  progressThumbActive: {
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  progressPressLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
})
