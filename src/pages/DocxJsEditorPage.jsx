import { useCallback, useEffect, useRef, useState } from 'react';
import { DocxEditor } from '@eigenpal/docx-js-editor';
import '@eigenpal/docx-js-editor/styles.css';
import { saveBlobToLocalFolder } from '../utils/saveToLocalFolder';

const DEFAULT_DOCX_FILE = '647476 - DRAFT Response to NFOA 2026-05-12.docx';
const DEFAULT_DOCX_URL = `/${encodeURIComponent(DEFAULT_DOCX_FILE)}`;

function DocxJsEditorPage() {
	const editorRef = useRef(null);
	const editorWrapperRef = useRef(null);
	const [documentBuffer, setDocumentBuffer] = useState(null);
	const [fileBaseName, setFileBaseName] = useState('docx-js-editor-document');
	const [status, setStatus] = useState('Upload a DOCX file to begin.');
	const [isBusy, setIsBusy] = useState(false);
	const [error, setError] = useState('');

	const applyFitToScreenZoom = useCallback(() => {
		const docxEditor = editorRef.current;
		const wrapperElement = editorWrapperRef.current;
		if (!docxEditor || !wrapperElement) {
			return false;
		}

		const pagedEditorRef = docxEditor.getEditorRef?.();
		const layout = pagedEditorRef?.getLayout?.();
		const pageWidth = layout?.pageSize?.w || layout?.pages?.[0]?.size?.w;
		if (!pageWidth) {
			return false;
		}

		const availableWidth = Math.max(wrapperElement.clientWidth - 24, 0);
		if (!availableWidth) {
			return false;
		}

		const zoom = Math.max(0.3, Math.min(1, availableWidth / pageWidth));
		docxEditor.setZoom(zoom);
		return true;
	}, []);

	useEffect(() => {
		let isActive = true;

		const loadDefaultDocx = async () => {
			setIsBusy(true);
			setError('');
			setStatus(`Loading ${DEFAULT_DOCX_FILE}...`);

			try {
				const response = await fetch(DEFAULT_DOCX_URL);
				if (!response.ok) {
					throw new Error('Default DOCX request failed');
				}

				const buffer = await response.arrayBuffer();
				if (!isActive) {
					return;
				}

				setDocumentBuffer(buffer);
				setFileBaseName(
					DEFAULT_DOCX_FILE.replace(/\.docx$/i, '') || 'docx-js-editor-document',
				);
				setStatus(`Loaded ${DEFAULT_DOCX_FILE}`);
			} catch {
				if (!isActive) {
					return;
				}
				setError(`Could not load default file: ${DEFAULT_DOCX_FILE}`);
				setStatus('Upload a DOCX file to begin.');
			} finally {
				if (isActive) {
					setIsBusy(false);
				}
			}
		};

		loadDefaultDocx();

		return () => {
			isActive = false;
		};
	}, []);

	useEffect(() => {
		if (!documentBuffer) {
			return undefined;
		}

		let isActive = true;
		let resizeTimer = null;
		let retryTimer = null;
		let retries = 0;

		const scheduleFitZoom = () => {
			if (!isActive) {
				return;
			}

			const applied = applyFitToScreenZoom();
			if (applied || retries >= 20) {
				return;
			}

			retries += 1;
			retryTimer = window.setTimeout(scheduleFitZoom, 120);
		};

		const handleViewportResize = () => {
			window.clearTimeout(resizeTimer);
			resizeTimer = window.setTimeout(() => {
				retries = 0;
				scheduleFitZoom();
			}, 120);
		};

		scheduleFitZoom();
		window.addEventListener('resize', handleViewportResize);
		window.addEventListener('orientationchange', handleViewportResize);

		return () => {
			isActive = false;
			window.clearTimeout(resizeTimer);
			window.clearTimeout(retryTimer);
			window.removeEventListener('resize', handleViewportResize);
			window.removeEventListener('orientationchange', handleViewportResize);
		};
	}, [applyFitToScreenZoom, documentBuffer]);

	const handleUpload = async (event) => {
		const [file] = event.target.files ?? [];
		if (!file) {
			return;
		}

		if (!file.name.toLowerCase().endsWith('.docx')) {
			setError('Please upload a .docx file.');
			event.target.value = '';
			return;
		}

		setIsBusy(true);
		setError('');
		setStatus(`Loading ${file.name}...`);

		try {
			const buffer = await file.arrayBuffer();
			setDocumentBuffer(buffer);
			setFileBaseName(
				file.name.replace(/\.docx$/i, '') || 'docx-js-editor-document',
			);
			setStatus(`Loaded ${file.name}`);
		} catch {
			setError('Failed to load document.');
			setStatus('Load failed.');
		} finally {
			setIsBusy(false);
			event.target.value = '';
		}
	};

	const handleSave = async () => {
		if (!editorRef.current) {
			setError('Editor is not ready yet.');
			return;
		}

		setIsBusy(true);
		setError('');
		setStatus('Saving document...');

		try {
			const buffer = await editorRef.current.save({ selective: true });
			if (!buffer) {
				throw new Error('No document buffer returned');
			}

			const blob = new Blob([buffer], {
				type:
					'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			});
			const targetFileName = `${fileBaseName || 'docx-js-editor-document'}.docx`;
			const { folderName, fileName } = await saveBlobToLocalFolder(
				blob,
				targetFileName,
			);
			setStatus(`Saved to ${folderName}/${fileName}`);
		} catch {
			setError('Failed to save document.');
			setStatus('Save failed.');
		} finally {
			setIsBusy(false);
		}
	};

	return (
		<section className='page word-viewer-page'>
			<h2>docx-js-editor Route (MIT)</h2>
			<p className='note'>
				Testing `@eigenpal/docx-js-editor` with native DOCX buffer open/save API.
			</p>

			<div className='controls'>
				<label className='upload-label'>
					<input
						type='file'
						accept='.docx'
						disabled={isBusy}
						onChange={handleUpload}
					/>
					Open .docx
				</label>
				<button
					type='button'
					disabled={isBusy || !documentBuffer}
					onClick={handleSave}
				>
					Save .docx
				</button>
			</div>

			<p className='note'>Status: {status}</p>
			{error ? <p className='error'>{error}</p> : null}

			<section className='editor-wrapper docx-js-wrapper' ref={editorWrapperRef}>
				{documentBuffer ? (
					<DocxEditor
						ref={editorRef}
						documentBuffer={documentBuffer}
						mode='editing'
						onChange={() => {}}
					/>
				) : (
					<div className='empty-state'>Open a .docx file to start editing.</div>
				)}
			</section>
			<p className='note'>
				License: MIT. Best for POC evaluation where you want open-source DOCX-first
				editing.
			</p>
			<p className='note'>
				Saved files are written directly to the project&apos;s `saved-docx` folder.
			</p>
		</section>
	);
}

export default DocxJsEditorPage;
