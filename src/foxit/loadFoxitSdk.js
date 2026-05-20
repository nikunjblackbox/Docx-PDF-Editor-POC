import { FOXIT_LIB_PATH } from './constants'
import { loadScript } from './loadScript'

let sdkPromise = null

export function loadFoxitSdk() {
  if (!sdkPromise) {
    sdkPromise = (async () => {
      await loadScript(`${FOXIT_LIB_PATH}UIExtension.full.js`)

      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      const addonScript = isMobile
        ? `${FOXIT_LIB_PATH}uix-addons/allInOne.mobile.js`
        : `${FOXIT_LIB_PATH}uix-addons/allInOne.js`

      await loadScript(addonScript)

      if (!window.UIExtension) {
        throw new Error('Foxit UIExtension did not initialize.')
      }

      return {
        UIExtension: window.UIExtension,
        addons: window.UIXAddons,
      }
    })()
  }

  return sdkPromise
}
