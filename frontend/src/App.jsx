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
      mercado: 'Mercado',
      compras: 'Compras',
      transporte: 'Transporte',
      saude: 'Saúde',
      casa: 'Casa',
      assinaturas: 'Assinaturas',
      lazer: 'Lazer',
      investimentos: 'Investimentos',
      aluguel: 'Aluguel',
      telefone: 'Telefone',
      internet: 'Internet',
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

  function formatMonthLabel(month) {
    const [year, monthNumber] = month.split('-')

    const monthNames = {
      '01': 'Janeiro',
      '02': 'Fevereiro',
      '03': 'Março',
      '04': 'Abril',
      '05': 'Maio',
      '06': 'Junho',
      '07': 'Julho',
      '08': 'Agosto',
      '09': 'Setembro',
      '10': 'Outubro',
      '11': 'Novembro',
      '12': 'Dezembro',
    }

    return `${monthNames[monthNumber] || month} ${year}`
  }

  const monthlyTrendChartData = monthlyTrend.map((item) => ({
    name: item.month.split('-').reverse().join('/'),
    income: item.income,
    expenses: item.expenses,
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
    .sort((a, b) => b.value - a.value)

  const donutLegendItems = expenseByCategory.slice(0, 6)

  const topExpenses = transactions
    .filter((transaction) => transaction.direction === 'out')
    .sort((a, b) => b.absolute_amount - a.absolute_amount)
    .slice(0, 5)
    .map((transaction) => ({
      name: (transaction.normalized_description || transaction.raw_description).slice(
        0,
        24
      ),
      value: transaction.absolute_amount,
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
                {months.length > 0 ? (
                  months.map((month) => (
                    <li
                      key={month}
                      className={filters.month === month ? 'active' : ''}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          month: prev.month === month ? '' : month,
                        }))
                      }
                    >
                      {formatMonthLabel(month)}
                    </li>
                  ))
                ) : (
                  <>
                    <li>Janeiro</li>
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
                  </>
                )}
              </ul>
            </div>
          </aside>

          <div className="dashboard-content">
            <section className="summary-grid section-spacing">
              <div className="card kpi-card">
                <p>Entrada do mês</p>
                <h2 className="green">R$ {monthlyIncome.toFixed(2)}</h2>
              </div>

              <div className="card kpi-card">
                <p>Saída do mês</p>
                <h2 className="red">R$ {monthlyExpenses.toFixed(2)}</h2>
              </div>

              <div className="card kpi-card">
                <p>Saldo do mês</p>
                <h2 className={monthlyBalance >= 0 ? 'green' : 'red'}>
                  R$ {monthlyBalance.toFixed(2)}
                </h2>
              </div>

              <div className="table-container donut-card">
                <h2>Despesas no mês</h2>

                <div className="donut-content">
                  <div className="donut-chart-wrapper">
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
                          innerRadius={34}
                          outerRadius={58}
                          paddingAngle={2}
                        >
                          {(expenseByCategory.length
                            ? expenseByCategory
                            : [{ name: 'Sem dados', value: 1 }]
                          ).map((entry, index) => (
                            <Cell
                              key={`month-cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="donut-legend">
                    {donutLegendItems.map((item, index) => (
                      <div key={item.name} className="donut-legend-item">
                        <div className="donut-legend-label">
                          <span
                            className="donut-legend-color"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <span>{formatCategory(item.name)}</span>
                        </div>

                        <strong>R$ {Number(item.value).toFixed(2)}</strong>
                      </div>
                    ))}

                    {!donutLegendItems.length && (
                      <div className="donut-legend-empty">
                        Sem despesas categorizadas
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="analytics-grid">
              <div className="table-container analytics-main-card">
                <h2>Análise mensal</h2>

                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyTrendChartData}
                      barCategoryGap="28%"
                      barGap={6}
                    >
                      <XAxis dataKey="name" stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" />
                      <Tooltip />
                      <Bar dataKey="income" fill="#22c55e" barSize={26} radius={[6, 6, 0, 0]} />
                      <Bar
                        dataKey="expenses"
                        fill="#ef4444"
                        barSize={26}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="table-container analytics-side-card">
                <h2>Top gastos</h2>

                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topExpenses}
                      layout="vertical"
                      barCategoryGap="26%"
                    >
                      <XAxis type="number" stroke="#a1a1aa" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#a1a1aa"
                        width={150}
                      />
                      <Tooltip />
                      <Bar dataKey="value" fill="#ef4444" barSize={18} radius={[0, 6, 6, 0]} />
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