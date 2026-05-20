import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import DocxJsEditorPage from './pages/DocxJsEditorPage'
import FoxitWebPage from './pages/FoxitWebPage'
import HomePage from './pages/HomePage'
import QuillFreePage from './pages/QuillFreePage'
import SyncfusionPage from './pages/SyncfusionPage'
import './App.css'

function App() {
  return (
    <main className="app-shell">
      <header className="header">
        <h1>Document Editor Library POC</h1>
        <p>Switch routes to test DOCX and PDF editor libraries.</p>
      </header>

      <nav className="nav-tabs">
        <NavLink to="/" end>
          Overview
        </NavLink>
        <NavLink to="/docx-js-editor">docx-js-editor (MIT)</NavLink>
        <NavLink to="/syncfusion">Syncfusion (Commercial)</NavLink>
        <NavLink to="/quill-free">Quill (Free)</NavLink>
        <NavLink to="/foxit-web">Foxit Web (Commercial)</NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/docx-js-editor" element={<DocxJsEditorPage />} />
        <Route path="/syncfusion" element={<SyncfusionPage />} />
        <Route path="/quill-free" element={<QuillFreePage />} />
        <Route path="/foxit-web" element={<FoxitWebPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  )
}

export default App
