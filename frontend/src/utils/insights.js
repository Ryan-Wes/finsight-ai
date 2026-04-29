function formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    })
}

function formatInsightCategory(category) {
    if (!category) return ''

    const categoryMap = {
        nao_identificado: 'Não identificado',
        outros: 'Outros',
        alimentacao: 'Alimentação',
        transporte: 'Transporte',
        moradia: 'Moradia',
        saude: 'Saúde',
        educacao: 'Educação',
        lazer: 'Lazer',
        tecnologia: 'Tecnologia',
        servicos: 'Serviços',
        movimentacoes: 'Movimentações',
    }

    return categoryMap[category] || category
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function generateInsights({
    summary,
    byCategory,
    transactions,
    isYearView = false,
    reserveNet = 0,
    reserveDependency = 0,
}) {
    const insights = []

    if (!summary) return insights

    const periodLabel = isYearView ? 'ano' : 'mês'

    const income = Number(summary.total_income || 0)
    const expenses = Number(summary.total_expenses || 0)
    const reserveValue = Number(reserveNet || 0)

    const unidentifiedCategoryKeys = [
        'nao_identificado',
        'não_identificado',
        'nao identificado',
        'não identificado',
    ]

    const isUnidentifiedCategory = (category) =>
        unidentifiedCategoryKeys.includes(String(category || '').toLowerCase())

    if (income > 0 && expenses > 0) {
        insights.push({
            type: expenses > income ? 'alert' : 'positive',
            title: expenses > income ? 'Atenção ao ritmo' : 'Controle financeiro',
            message:
                expenses > income
                    ? `Aqui acendeu um alerta: suas saídas passaram da renda neste ${periodLabel}. Eu começaria revisando os maiores gastos primeiro.`
                    : `Boa: suas saídas ficaram abaixo da renda neste ${periodLabel}. Isso mostra que seu fluxo financeiro respirou bem.`,
        })
    } else {
        insights.push({
            type: 'info',
            title: 'Controle financeiro',
            message: `Ainda não há dados suficientes para comparar entradas e saídas neste ${periodLabel}.`,
        })
    }

    if (byCategory?.length) {
        const unidentified = byCategory.find((item) =>
            isUnidentifiedCategory(item.category)
        )

        const unidentifiedTotal = Number(unidentified?.expense_total || 0)

        if (unidentifiedTotal > 0) {
            insights.push({
                type: 'alert',
                title: 'Categorias pendentes',
                message: `Tem ${formatCurrency(unidentifiedTotal)} sem categoria. Categorizar isso melhora bastante a leitura dos seus gastos.`,
            })
        } else {
            const topCategory = [...byCategory].sort(
                (a, b) => b.expense_total - a.expense_total
            )[0]

            insights.push({
                type: 'info',
                title: 'Padrão de consumo',
                message: `${formatInsightCategory(topCategory.category)} foi a categoria que mais pesou neste ${periodLabel}. Bom ponto para acompanhar de perto.`,
            })
        }
    } else {
        insights.push({
            type: 'info',
            title: 'Padrão de consumo',
            message: `Ainda não encontrei gastos categorizados neste ${periodLabel}.`,
        })
    }

    if (reserveValue > 0) {
        insights.push({
            type: 'warning',
            title: 'Reserva inteligente',
            message: `Você aumentou sua reserva em ${formatCurrency(reserveValue)} neste ${periodLabel}. Esse é um ótimo sinal de folga financeira.`,
        })
    } else if (reserveValue < 0) {
        insights.push({
            type: 'warning',
            title: 'Reserva inteligente',
            message: `Você usou ${formatCurrency(Math.abs(reserveValue))} da reserva neste ${periodLabel}. Isso representou ${Number(reserveDependency || 0).toFixed(1).replace('.', ',')}% das suas saídas.`,
        })
    } else {
        insights.push({
            type: 'warning',
            title: 'Reserva inteligente',
            message: `Sua reserva ficou estável neste ${periodLabel}. Sem aplicações ou resgates relevantes no período.`,
        })
    }

    return insights.slice(0, 3)
}