import { useEffect, useRef } from 'react'
import { LIST_IDS } from '@/config/constant'
import { useNavActiveId } from '@/store/common/hook'
import { useActiveListId } from '@/store/list/hook'
import listAction from '@/store/list/action'
import MusicList from '@/screens/Home/Views/Mylist/MusicList'

export default () => {
  const navActiveId = useNavActiveId()
  const activeListId = useActiveListId()
  const restoreListIdRef = useRef<string>(LIST_IDS.DEFAULT)

  useEffect(() => {
    if (navActiveId != 'nav_history' && activeListId && activeListId != LIST_IDS.HISTORY) {
      restoreListIdRef.current = activeListId
    }
  }, [navActiveId, activeListId])

  useEffect(() => {
    if (navActiveId == 'nav_history') {
      if (activeListId != LIST_IDS.HISTORY) listAction.setActiveList(LIST_IDS.HISTORY)
      return
    }

    if (activeListId == LIST_IDS.HISTORY && restoreListIdRef.current != LIST_IDS.HISTORY) {
      listAction.setActiveList(restoreListIdRef.current)
    }
  }, [navActiveId, activeListId])

  return navActiveId == 'nav_history' ? <MusicList /> : null
}
