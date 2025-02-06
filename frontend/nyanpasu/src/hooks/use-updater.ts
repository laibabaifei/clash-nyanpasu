import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { OS } from '@/consts'
import { UpdaterIgnoredAtom, UpdaterInstanceAtom } from '@/store/updater'
import { commands, unwrapResult, useNyanpasu } from '@nyanpasu/interface'
import { Update } from '@tauri-apps/plugin-updater'
import { useIsAppImage } from './use-consts'

export function useUpdaterPlatformSupported() {
  const [supported, setSupported] = useState(false)
  const isAppImage = useIsAppImage()
  useEffect(() => {
    switch (OS) {
      case 'macos':
      case 'windows':
        setSupported(true)
        break
      case 'linux':
        setSupported(!!isAppImage.data)
        break
    }
  }, [isAppImage.data])
  return supported
}

export default function useUpdater() {
  const { nyanpasuConfig } = useNyanpasu()
  const updaterIgnored = useAtomValue(UpdaterIgnoredAtom)
  const setUpdaterInstance = useSetAtom(UpdaterInstanceAtom)
  const isPlatformSupported = useUpdaterPlatformSupported()

  useEffect(() => {
    const run = async () => {
      if (nyanpasuConfig?.enable_auto_check_update && isPlatformSupported) {
        const metadata = unwrapResult(await commands.checkUpdate())
        if (metadata) {
          const updater = new Update({
            rid: metadata.rid,
            available: metadata.available,
            currentVersion: metadata.current_version,
            version: metadata.version,
            rawJson: metadata.raw_json as Record<string, unknown>,
          })
          if (updaterIgnored !== updater.version) {
            setUpdaterInstance(updater || null)
          }
        }
      }
    }
    run().catch(console.error)
  }, [
    isPlatformSupported,
    nyanpasuConfig?.enable_auto_check_update,
    setUpdaterInstance,
    updaterIgnored,
  ])
}
