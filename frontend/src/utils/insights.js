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

function getTransactionLabel(transaction) {
    const typeLabels = {
        purchase: 'uma compra no cartão',
        credit_card_bill_payment: 'pagamento de fatura',
        pix_out: 'Pix enviado',
        transfer_out: 'transferência enviada',
        bill_payment: 'pagamento de boleto',
    }

    return (
        transaction.display_description ||
        transaction.normalized_description ||
        transaction.raw_description ||
        typeLabels[transaction.transaction_type] ||
        'esse lançamento'
    )
}

export function generateInsights({
    summary,
    byCategory,
    transactions,
    isYearView = false,
}) {
    const insights = []

    if (!summary) return insights

    const periodLabel = isYearView ? 'ano' : 'mês'

    const income = Number(summary.total_income || 0)
    const expenses = Number(summary.total_expenses || 0)

    const unidentifiedCategoryKeys = [
        'nao_identificado',
        'não_identificado',
        'nao identificado',
        'não identificado',
    ]

    const isUnidentifiedCategory = (category) =>
        unidentifiedCategoryKeys.includes(String(category || '').toLowerCase())

    const expenseTypes = [
        'purchase',
        'credit_card_bill_payment',
        'pix_out',
        'transfer_out',
        'bill_payment',
    ]

    const expenseTransactions = transactions
        .filter((t) => expenseTypes.includes(t.transaction_type))
        .map((t) => ({
            ...t,
            value: Math.abs(Number(t.absolute_amount || t.amount || 0)),
        }))
        .filter((t) => t.value > 0)

    const totalExpensesValue = expenseTransactions.reduce(
        (total, t) => total + t.value,
        0
    )

    if (income > 0 && expenses > 0) {
        insights.push({
            type: expenses > income ? 'alert' : 'positive',
            title: expenses > income ? 'Atenção ao ritmo' : 'Controle financeiro',
            message:
                expenses > income
                    ? `Aqui acendeu um alerta: seus gastos passaram da renda neste ${periodLabel}. Eu começaria revisando os maiores lançamentos primeiro.`
                    : `Boa: seus gastos ficaram abaixo da renda neste ${periodLabel}. Isso indica que o fluxo financeiro está respirando bem.`,
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
                message: `Tem ${formatCurrency(unidentifiedTotal)} em gastos que ainda estão sem identificação. Vale categorizar isso para eu conseguir te entregar uma análise mais precisa.`,
            })
        } else {
            const topCategory = [...byCategory].sort(
                (a, b) => b.expense_total - a.expense_total
            )[0]

            if (topCategory && topCategory.expense_total > 0) {
                insights.push({
                    type: 'info',
                    title: 'Padrão de consumo',
                    message: `Olhando seus gastos, ${formatInsightCategory(topCategory.category)} foi onde o dinheiro mais pesou neste ${periodLabel}.`,
                })
            }
        }
    }

    const sortedExpenses = [...expenseTransactions].sort((a, b) => b.value - a.value)
    const maxExpense = sortedExpenses[0]

    if (maxExpense && totalExpensesValue > 0) {
        const pct = (maxExpense.value / totalExpensesValue) * 100
        const label = getTransactionLabel(maxExpense)

        if (pct >= 30) {
            insights.push({
                type: 'alert',
                title: 'Maior impacto',
                message: `Esse gasto aqui pesou bastante: ${label}, com ${formatCurrency(maxExpense.value)}. Ele sozinho consumiu ${pct.toFixed(1).replace('.', ',')}% das suas saídas no ${periodLabel}.`,
            })
        }
    }

    const values = expenseTransactions.map((t) => t.value)

    if (values.length >= 5) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length

        const variance =
            values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) /
            values.length

        const stdDev = Math.sqrt(variance)

        if (stdDev < avg * 0.5) {
            insights.push({
                type: 'positive',
                title: 'Consistência',
                message: `Seus gastos estão bem distribuídos. Não encontrei grandes picos fora do padrão neste ${periodLabel}.`,
            })
        } else {
            insights.push({
                type: 'info',
                title: 'Variação',
                message: `Seus gastos oscilam bastante. Isso pode indicar alguns lançamentos pontuais puxando o total para cima.`,
            })
        }
    }

    return insights.slice(0, 4)
}