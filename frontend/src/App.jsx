import { useEffect, useState } from 'react'
import './index.css'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

function App() {
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [months, setMonths] = useState([])
  const [byCategory, setByCategory] = useState([])
  const [monthlyTrend, setMonthlyTrend] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadResults, setUploadResults] = useState([])
  const [uploading, setUploading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const [filters, setFilters] = useState({
    month: '',
  })

  const COLORS = ['#a78bfa', '#22c55e', '#ef4444', '#facc15', '#38bdf8', '#f97316']

  const formatCategory = (name) => {
    const map = {
      movimentacoes: 'Movimentações',
      alimentacao: 'Alimentação',
      outros: 'Outros',
      roupas: 'Roupas',
      carro: 'Carro',
    }

    return map[name] || name
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError('')

        const queryParams = new URLSearchParams()

        if (filters.month) queryParams.append('month', filters.month)
        queryParams.append('limit', 100)

        const queryString = queryParams.toString()

        const monthsResponse = await fetch(
          'http://127.0.0.1:8000/api/transactions/months'
        )

        if (!monthsResponse.ok) {
          throw new Error('Erro ao buscar meses')
        }

        const monthsData = await monthsResponse.json()
        setMonths(monthsData.months || [])

        const [
          transactionsResponse,
          summaryResponse,
          byCategoryResponse,
          monthlyTrendResponse,
        ] = await Promise.all([
          fetch(`http://127.0.0.1:8000/api/transactions?${queryString}`),
          fetch(`http://127.0.0.1:8000/api/summary/consolidated?${queryString}`),
          fetch(`http://127.0.0.1:8000/api/summary/by-category?${queryString}`),
          fetch('http://127.0.0.1:8000/api/summary/monthly-trend'),
        ])

        if (
          !transactionsResponse.ok ||
          !summaryResponse.ok ||
          !byCategoryResponse.ok ||
          !monthlyTrendResponse.ok
        ) {
          throw new Error('Erro ao buscar dados da API')
        }

        const transactionsData = await transactionsResponse.json()
        const summaryData = await summaryResponse.json()
        const byCategoryData = await byCategoryResponse.json()
        const monthlyTrendData = await monthlyTrendResponse.json()

        setTransactions(transactionsData.items || [])
        setSummary(summaryData)
        setByCategory(byCategoryData.by_category || [])
        setMonthlyTrend(monthlyTrendData.monthly_trend || [])
      } catch (err) {
        setError(err.message || 'Erro inesperado')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filters])

  async function handleUploadFiles() {
    if (!selectedFiles.length) {
      return
    }

    try {
      setUploading(true)
      setError('')

      const formData = new FormData()

      selectedFiles.forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch('http://127.0.0.1:8000/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar arquivos')
      }

      const data = await response.json()
      setUploadResults(data.results || [])
      setSelectedFiles([])

      const queryParams = new URLSearchParams()
      if (filters.month) queryParams.append('month', filters.month)
      queryParams.append('limit', 100)

      const queryString = queryParams.toString()

      const [
        transactionsResponse,
        summaryResponse,
        byCategoryResponse,
        monthlyTrendResponse,
      ] = await Promise.all([
        fetch(`http://127.0.0.1:8000/api/transactions?${queryString}`),
        fetch(`http://127.0.0.1:8000/api/summary/consolidated?${queryString}`),
        fetch(`http://127.0.0.1:8000/api/summary/by-category?${queryString}`),
        fetch('http://127.0.0.1:8000/api/summary/monthly-trend'),
      ])

      if (
        !transactionsResponse.ok ||
        !summaryResponse.ok ||
        !byCategoryResponse.ok ||
        !monthlyTrendResponse.ok
      ) {
        throw new Error('Erro ao atualizar dashboard após upload')
      }

      const transactionsData = await transactionsResponse.json()
      const summaryData = await summaryResponse.json()
      const byCategoryData = await byCategoryResponse.json()
      const monthlyTrendData = await monthlyTrendResponse.json()

      setTransactions(transactionsData.items || [])
      setSummary(summaryData)
      setByCategory(byCategoryData.by_category || [])
      setMonthlyTrend(monthlyTrendData.monthly_trend || [])
    } catch (err) {
      setError(err.message || 'Erro ao enviar arquivos')
    } finally {
      setUploading(false)
    }
  }

  async function handleResetDatabase() {
    try {
      setResetting(true)
      setError('')
      setUploadResults([])

      const response = await fetch('http://127.0.0.1:8000/api/dev/reset', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao limpar base')
      }

      setTransactions([])
      setSummary({
        total_income: 0,
        total_expenses: 0,
        net_cashflow: 0,
      })
      setByCategory([])
      setMonthlyTrend([])
      setMonths([])
      setSelectedFiles([])
      setFilters({
        month: '',
      })
    } catch (err) {
      setError(err.message || 'Erro ao limpar base')
    } finally {
      setResetting(false)
    }
  }

  function handleSelectedFiles(filesList) {
    const filesArray = Array.from(filesList || [])
    setSelectedFiles(filesArray)
  }

  const monthlyTrendChartData = monthlyTrend.map((item) => ({
    name: item.month.split('-').reverse().join('/'),
    income: item.income,
    expenses: item.expenses,
    cashflow: item.cashflow,
  }))

  const monthlyIncome = Number(summary?.total_income ?? 0)
  const monthlyExpenses = Number(summary?.total_expenses ?? 0)
  const monthlyBalance = monthlyIncome - monthlyExpenses

  const expenseByCategory = byCategory
    .filter((item) => item.expense_total > 0)
    .map((item) => ({
      name: item.category,
      value: item.expense_total,
    }))

  const topExpenses = transactions
    .filter((t) => t.direction === 'out')
    .sort((a, b) => b.absolute_amount - a.absolute_amount)
    .slice(0, 5)
    .map((t) => ({
      name: (t.normalized_description || t.raw_description).slice(0, 20),
      value: t.absolute_amount,
    }))

  if (loading) return <h1>Carregando...</h1>
  if (error) return <h1>{error}</h1>

  return (
    <main>
      <div className="container">
        <header className="header">
          <h1>FinSight AI</h1>
          <p>Análise real do seu fluxo financeiro</p>

          <div style={{ marginTop: '16px' }}>
            <a
              href="/transactions"
              style={{ color: '#a78bfa', textDecoration: 'none' }}
            >
              Ver transações →
            </a>
            
          </div>
          
        </header>
<div className="dashboard-toolbar">
              <button
                className="filter-button"
                onClick={() => setShowUpload(!showUpload)}
              >
                {showUpload ? 'Ocultar importação' : 'Importar arquivos'}
              </button>
            </div>

            {showUpload && (
              <section className="table-container" style={{ marginBottom: '24px' }}>
                <h3 style={{ opacity: 0.8 }}>Importar dados</h3>

                <div
                  className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    handleSelectedFiles(e.dataTransfer.files)
                  }}
                >
                  <p className="upload-title">
                    Arraste PDFs/CSVs aqui ou escolha no botão
                  </p>

                  <p className="upload-subtitle">
                    Você pode enviar vários arquivos de uma vez
                  </p>

                  <div className="upload-actions">
                    <label className="filter-button upload-label">
                      Escolher arquivos
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.csv"
                        className="hidden-file-input"
                        onChange={(e) => handleSelectedFiles(e.target.files)}
                      />
                    </label>

                    <button
                      className="filter-button"
                      onClick={handleUploadFiles}
                      disabled={uploading || !selectedFiles.length}
                    >
                      {uploading ? 'Enviando...' : 'Enviar arquivos'}
                    </button>

                    <button
                      className="secondary-button"
                      onClick={handleResetDatabase}
                      disabled={resetting}
                    >
                      {resetting ? 'Limpando...' : 'Limpar base'}
                    </button>
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h3 style={{ marginBottom: '12px' }}>
                      Arquivos selecionados ({selectedFiles.length})
                    </h3>

                    <div className="top-category-list">
                      {selectedFiles.map((file) => (
                        <div
                          key={`${file.name}-${file.size}`}
                          className="top-category-item"
                        >
                          <span>{file.name}</span>
                          <strong>{(file.size / 1024).toFixed(1)} KB</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadResults.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h3 style={{ marginBottom: '12px' }}>
                      Resultado do upload
                    </h3>

                    <div className="top-category-list">
                      {uploadResults.map((result, index) => (
                        <div
                          key={`${result.filename}-${index}`}
                          className="top-category-item"
                        >
                          <span>{result.original_filename || result.filename}</span>
                          <strong
                            style={{ color: result.error ? '#ef4444' : '#22c55e' }}
                          >
                            {result.error
                              ? `Erro: ${result.error}`
                              : `OK • inseridas: ${result.inserted_count ?? 0} • ignoradas: ${result.skipped_count ?? 0}`}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
        <div className="dashboard-layout">
          <aside className="sidebar">
            <div className="sidebar-section">
              <p>Ano</p>
              <ul>
                <li className="active">2026</li>
                <li>2025</li>
                <li>2024</li>
              </ul>
            </div>

            <div className="sidebar-section">
              <p>Mês</p>
              <ul>
                <li className="active">Janeiro</li>
                <li>Fevereiro</li>
                <li>Março</li>
                <li>Abril</li>
                <li>Maio</li>
                <li>Junho</li>
                <li>Julho</li>
                <li>Agosto</li>
                <li>Setembro</li>
                <li>Outubro</li>
                <li>Novembro</li>
                <li>Dezembro</li>
              </ul>
            </div>
          </aside>

          <div className="dashboard-content">
            

            <section className="top-grid section-spacing">
              {summary && (
                <div className="cards">
                  <div className="card">
                    <p>Saldo do mês</p>
                    <h2 className={monthlyBalance >= 0 ? 'green' : 'red'}>
                      R$ {monthlyBalance.toFixed(2)}
                    </h2>
                  </div>

                  <div className="card">
                    <p>Despesa do mês</p>
                    <h2 className="red">
                      R$ {monthlyExpenses.toFixed(2)}
                    </h2>
                  </div>
                </div>
              )}

              <div className="table-container">
                <h2>
                  Despesas por categoria {filters.month ? `(${filters.month})` : ''}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ width: 200, height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={
                            expenseByCategory.length
                              ? expenseByCategory
                              : [{ name: 'Sem dados', value: 1 }]
                          }
                          dataKey="value"
                          nameKey="name"
                          innerRadius={60}
                          outerRadius={100}
                        >
                          {expenseByCategory.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ flex: 1 }}>
                    {expenseByCategory.map((item, index) => (
                      <div
                        key={item.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <span>{formatCategory(item.name)}</span>
                        </div>

                        <strong>R$ {Number(item.value).toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="bottom-grid">
              <div className="table-container">
                <h2>Entrada vs saída por mês</h2>

                <div style={{ width: '100%', height: 230 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrendChartData}>
                      <XAxis dataKey="name" stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" />
                      <Tooltip />
                      <Bar dataKey="income" fill="#22c55e" />
                      <Bar dataKey="expenses" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="table-container">
                <h2>Top gastos</h2>

                <div style={{ width: '100%', height: 230 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topExpenses} layout="vertical">
                      <XAxis type="number" stroke="#a1a1aa" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#a1a1aa"
                        width={180}
                      />
                      <Tooltip />
                      <Bar dataKey="value" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App