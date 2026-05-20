export const licenseKey = import.meta.env.VITE_FOXIT_LICENSE_KEY ?? ''
export const licenseSN = import.meta.env.VITE_FOXIT_LICENSE_SN ?? ''

export const hasFoxitLicense = Boolean(licenseKey && licenseSN)
