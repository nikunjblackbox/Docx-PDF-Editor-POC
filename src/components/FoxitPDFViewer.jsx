import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { getFoxitLicense } from '../foxit/license'
import { loadFoxitSdk } from '../foxit/loadFoxitSdk'
import { ensureFoxitWorker, FOXIT_LIB_PATH } from '../foxit/preloadFoxit'

const FoxitPDFViewer = forwardRef(function FoxitPDFViewer({ onError, onReady }, ref) {
  const containerRef = useRef(null)
  const [pdfui, setPdfui] = useState(null)

  useImperativeHandle(ref, () => pdfui, [pdfui])

  useEffect(() => {
    const stylesheet = document.createElement('link')
    stylesheet.rel = 'stylesheet'
    stylesheet.href = `${FOXIT_LIB_PATH}UIExtension.css`
    document.head.appendChild(stylesheet)

    return () => {
      stylesheet.remove()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let instance = null

    async function initViewer() {
      try {
        const [readyWorker, { UIExtension, addons }] = await Promise.all([
          ensureFoxitWorker(),
          loadFoxitSdk(),
        ])

        if (cancelled || !containerRef.current) {
          return
        }

        const license = getFoxitLicense()
        instance = new UIExtension.PDFUI({
          viewerOptions: {
            libPath: FOXIT_LIB_PATH,
            jr: {
              readyWorker,
              ...(license
                ? {
                    licenseSN: license.licenseSN,
                    licenseKey: license.licenseKey,
                  }
                : {}),
            },
          },
          renderTo: containerRef.current,
          appearance: UIExtension.appearances.adaptive,
          addons,
        })

        setPdfui(instance)
        onReady?.(instance)
      } catch (error) {
        onError?.(
          error instanceof Error ? error.message : 'Failed to initialize Foxit viewer.',
        )
      }
    }

    initViewer()

    function handleResize() {
      instance?.redraw?.()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelled = true
      window.removeEventListener('resize', handleResize)
      instance?.destroy?.()
      setPdfui(null)
    }
  }, [onError, onReady])

  return <div className="foxit-pdf-viewer" ref={containerRef} />
})

export default FoxitPDFViewer
