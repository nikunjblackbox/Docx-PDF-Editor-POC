/** @typedef {{ licenseSN: string, licenseKey: string }} FoxitLicense */

function trimEnv(value) {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim().replace(/^['"]|['"]$/g, '')
}

export const licenseSN = trimEnv(import.meta.env.VITE_FOXIT_LICENSE_SN)
export const licenseKey = trimEnv(import.meta.env.VITE_FOXIT_LICENSE_KEY)

export const hasFoxitLicense = Boolean(licenseSN && licenseKey)

/** @returns {FoxitLicense | null} */
export function getFoxitLicense() {
  if (!hasFoxitLicense) {
    return null
  }
  return { licenseSN, licenseKey }
}

export function getFoxitLicenseHint() {
  if (!import.meta.env.VITE_FOXIT_LICENSE_SN && !import.meta.env.VITE_FOXIT_LICENSE_KEY) {
    return 'Add VITE_FOXIT_LICENSE_SN and VITE_FOXIT_LICENSE_KEY to .env, then restart npm run dev.'
  }
  if (!licenseSN || !licenseKey) {
    return 'License values are empty after trim. Remove extra quotes/spaces in .env and restart the dev server.'
  }
  return `License loaded (SN length: ${licenseSN.length}, key length: ${licenseKey.length}). If the viewer still fails, the keys may be expired, for the wrong product, or not valid for localhost.`
}
