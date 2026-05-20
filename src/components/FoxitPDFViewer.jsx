import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { loadFoxitSdk } from '../foxit/loadFoxitSdk'
import { ensureFoxitWorker, FOXIT_LIB_PATH } from '../foxit/preloadFoxit'

const FoxitPDFViewer = forwardRef(function FoxitPDFViewer({ onError }, ref) {
  const containerRef = useRef(null)
  const pdfuiRef = useRef(null)

  useImperativeHandle(ref, () => pdfuiRef.current)

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
    let pdfui = null

    async function initViewer() {
      try {
        const [readyWorker, { UIExtension, addons }] = await Promise.all([
          ensureFoxitWorker(),
          loadFoxitSdk(),
        ])

        if (cancelled || !containerRef.current) {
          return
        }

        pdfui = new UIExtension.PDFUI({
          viewerOptions: {
            libPath: FOXIT_LIB_PATH,
            jr: {
              readyWorker,
            },
          },
          renderTo: containerRef.current,
          appearance: UIExtension.appearances.adaptive,
          addons,
        })

        pdfuiRef.current = pdfui
      } catch (error) {
        onError?.(
          error instanceof Error ? error.message : 'Failed to initialize Foxit viewer.',
        )
      }
    }

    initViewer()

    function handleResize() {
      pdfuiRef.current?.redraw()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelled = true
      window.removeEventListener('resize', handleResize)
      pdfui?.destroy?.()
      pdfuiRef.current = null
    }
  }, [onError])

  return <div className="foxit-pdf-viewer" ref={containerRef} />
})

export default FoxitPDFViewer
