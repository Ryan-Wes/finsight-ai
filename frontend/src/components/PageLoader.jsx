export default function PageLoader({ title = 'Carregando...' }) {
  return (
    <main className="page-loader-screen">
      <div className="page-loader">
        <div className="page-loader-header">
          <div className="page-loader-title shimmer-block loader-title" />
          <div className="page-loader-subtitle shimmer-block loader-subtitle" />
        </div>

        <div className="page-loader-kpis">
          <div className="page-loader-card shimmer-block" />
          <div className="page-loader-card shimmer-block" />
          <div className="page-loader-card shimmer-block" />
        </div>

        <div className="page-loader-main shimmer-block" />
      </div>
    </main>
  )
}