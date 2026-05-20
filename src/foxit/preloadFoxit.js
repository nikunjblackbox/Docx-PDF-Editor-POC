import { FOXIT_LIB_PATH } from './constants'
import { loadScript } from './loadScript'
import { hasFoxitLicense, licenseKey, licenseSN } from './license'

let readyWorkerPromise = null

export function ensureFoxitWorker() {
  if (!hasFoxitLicense) {
    return Promise.reject(new Error('Foxit license is not configured.'))
  }

  if (!readyWorkerPromise) {
    readyWorkerPromise = (async () => {
      await loadScript(`${FOXIT_LIB_PATH}preload-jr-worker.js`)

      if (!window.preloadJrWorker) {
        throw new Error('Foxit preloadJrWorker did not initialize.')
      }

      return window.preloadJrWorker({
        workerPath: FOXIT_LIB_PATH,
        enginePath: `${FOXIT_LIB_PATH}jr-engine/gsdk`,
        fontPath: 'https://webpdf.foxitsoftware.com/webfonts/',
        licenseSN,
        licenseKey,
      })
    })()
  }

  return readyWorkerPromise
}

export { FOXIT_LIB_PATH } from './constants'
