const libraries = [
  {
    name: 'docx-js-editor',
    route: '/docx-js-editor',
    license: 'MIT (free)',
    notes: 'Open-source DOCX-first editor using native document buffer + save API.',
  },
  {
    name: 'Syncfusion DOCX Editor',
    route: '/syncfusion',
    license: 'Commercial (community license available)',
    notes: 'Closest Microsoft Word-like experience in browser.',
  },
  {
    name: 'Quill Editor',
    route: '/quill-free',
    license: 'MIT (free)',
    notes: 'Free rich-text editor with DOCX open/save conversion for POC.',
  },
  {
    name: 'Foxit Web PDF Editor',
    route: '/foxit-web',
    license: 'Commercial (trial/community license from Foxit)',
    notes: 'Native PDF editing in the browser via Foxit PDF SDK for Web.',
  },
]

function HomePage() {
  return (
    <section className="page">
      <h2>Library Routes</h2>
      <p className="note">Use these routes to compare editor options quickly.</p>
      <div className="library-list">
        {libraries.map((library) => (
          <article key={library.route} className="library-card">
            <h3>{library.name}</h3>
            <p>
              <strong>Route:</strong> <code>{library.route}</code>
            </p>
            <p>
              <strong>License:</strong> {library.license}
            </p>
            <p>{library.notes}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default HomePage
