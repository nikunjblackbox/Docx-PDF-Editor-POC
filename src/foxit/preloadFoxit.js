import { FOXIT_LIB_PATH } from './constants'
import { getFoxitLicense, hasFoxitLicense } from './license'
import { loadScript } from './loadScript'

let readyWorkerPromise = null

export function ensureFoxitWorker() {
  const license = getFoxitLicense()
  if (!hasFoxitLicense || !license) {
    return Promise.reject(new Error('Foxit license is not configured.'))
  }

  if (!readyWorkerPromise) {
    readyWorkerPromise = (async () => {
      await loadScript(`${FOXIT_LIB_PATH}preload-jr-worker.js`)

      if (!window.preloadJrWorker) {
        throw new Error('Foxit preloadJrWorker did not initialize.')
      }

      try {
        return await window.preloadJrWorker({
          workerPath: FOXIT_LIB_PATH,
          enginePath: `${FOXIT_LIB_PATH}jr-engine/gsdk`,
          fontPath: 'https://webpdf.foxitsoftware.com/webfonts/',
          licenseSN: license.licenseSN,
          licenseKey: license.licenseKey,
        })
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        throw new Error(
          `Foxit license rejected: ${detail}. Use Web SDK trial keys from https://developers.foxit.com/products/web/ (must match SDK v11).`,
          { cause: error },
        )
      }
    })()
  }

  return readyWorkerPromise
}

export { FOXIT_LIB_PATH } from './constants'
