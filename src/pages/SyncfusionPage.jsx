import {
  DocumentEditorContainerComponent,
  Toolbar,
} from '@syncfusion/ej2-react-documenteditor'

DocumentEditorContainerComponent.Inject(Toolbar)

function SyncfusionPage() {
  return (
    <section className="page">
      <h2>Syncfusion DOCX Editor</h2>
      <p className="note">
        Full Word-style editor UI. Uses Syncfusion document service.
      </p>
      <section className="editor-wrapper">
        <DocumentEditorContainerComponent
          id="docx-editor-container"
          height="100%"
          enableToolbar
          serviceUrl="https://document.syncfusion.com/web-services/docx-editor/api/documenteditor/"
        />
      </section>
      <p className="note">
        This route is for feature comparison and requires Syncfusion licensing
        for production use.
      </p>
    </section>
  )
}

export default SyncfusionPage
