// ========================================================
// AutoManager - Módulo Dashboard Analítico
// ========================================================

let dashChartFluxo = null;
let dashChartOS = null;

async function initDashboard() {
    console.log("🟢 Módulo Dashboard Inicializado.");
    document.getElementById('dash-ano-grafico').innerText = new Date().getFullYear();
    await compilarDadosReais();
}

async function compilarDadosReais() {
    try {
        // 1. Busca todos os dados cruciais simultaneamente
        const [reqReceber, reqPagar, reqOS] = await Promise.all([
            window.banco.from('contas_receber').select('*'),
            window.banco.from('contas_pagar').select('*'),
            window.banco.from('orcamentos').select('status')
        ]);

        const receitas = reqReceber.data || [];
        const despesas = reqPagar.data || [];
        const ordens = reqOS.data || [];

        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();
        const hojeISO = hoje.toISOString().split('T')[0];

        // Métrica 1: Faturamento do Mês (Soma do que foi PAGO neste mês)
        let faturamentoMes = 0;
        receitas.forEach(r => {
            if (r.status === 'Pago' && r.data_pagamento) {
                // Previne erros de fuso com T12:00
                const d = new Date(r.data_pagamento + 'T12:00:00Z');
                if (d.getMonth() === mesAtual && d.getFullYear() === anoAtual) {
                    faturamentoMes += r.valor;
                }
            }
        });

        // Métrica 2: A Receber (Soma de Pendentes que ainda não venceram ou vencem hoje)
        let aReceber = 0;
        receitas.forEach(r => {
            if (r.status === 'Pendente' && r.data_vencimento >= hojeISO) {
                aReceber += r.valor;
            }
        });

        // Métrica 3: Inadimplência (Quantidade de Contas Pendentes e Atrasadas)
        let contasAtrasadas = 0;
        receitas.forEach(r => {
            if (r.status === 'Pendente' && r.data_vencimento < hojeISO) {
                contasAtrasadas++;
            }
        });

        // Métrica 4: O.S em Andamento (Tudo que não está fechado, finalizado ou cancelado)
        let osAbertas = 0;
        let contagemStatusOS = {};
        
        ordens.forEach(o => {
            // Contagem geral para o Gráfico de Rosca
            contagemStatusOS[o.status] = (contagemStatusOS[o.status] || 0) + 1;
            
            // Regra para contar "Em Andamento"
            if (!['Fechado', 'Finalizado', 'Não Usar', 'Orçamento'].includes(o.status)) {
                osAbertas++;
            }
        });

        // ============================================
        // INJETANDO NA TELA
        // ============================================
        document.getElementById('dash-fat').innerText = faturamentoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('dash-rec').innerText = aReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('dash-os').innerText = `${osAbertas} O.S.`;
        document.getElementById('dash-inad').innerText = `${contasAtrasadas} Notas`;

        // ============================================
        // PROCESSANDO GRÁFICO DE FLUXO (ÚLTIMOS 6 MESES)
        // ============================================
        const labelsMeses = [];
        const dadosReceitas = [];
        const dadosDespesas = [];

        // Monta o array dos últimos 6 meses (do mais antigo pro atual)
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            
            // Pega o nome do mês (ex: "ago")
            const nomeMes = d.toLocaleString('pt-BR', { month: 'short' });
            labelsMeses.push(nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1));
            
            const mesTarget = d.getMonth();
            const anoTarget = d.getFullYear();

            // Soma Receitas daquele mês
            const sumRec = receitas.reduce((acc, curr) => {
                if (curr.status === 'Pago' && curr.data_pagamento) {
                    const dp = new Date(curr.data_pagamento + 'T12:00:00Z');
                    if (dp.getMonth() === mesTarget && dp.getFullYear() === anoTarget) return acc + curr.valor;
                }
                return acc;
            }, 0);

            // Soma Despesas daquele mês
            const sumDesp = despesas.reduce((acc, curr) => {
                if (curr.status === 'Pago' && curr.data_pagamento) {
                    const dp = new Date(curr.data_pagamento + 'T12:00:00Z');
                    if (dp.getMonth() === mesTarget && dp.getFullYear() === anoTarget) return acc + curr.valor;
                }
                return acc;
            }, 0);

            dadosReceitas.push(sumRec);
            dadosDespesas.push(sumDesp);
        }

        renderizarGraficos(labelsMeses, dadosReceitas, dadosDespesas, contagemStatusOS);

    } catch(e) {
        console.error("Falha ao compilar dashboard:", e);
        document.getElementById('dash-fat').innerText = "Erro";
        document.getElementById('dash-rec').innerText = "Erro";
    }
}

function renderizarGraficos(labelsMeses, dadosReceitas, dadosDespesas, contagemStatus) {
    // 1. Gráfico de Fluxo de Caixa (Linha)
    const ctxFluxo = document.getElementById('chartFluxo').getContext('2d');
    if(dashChartFluxo) dashChartFluxo.destroy();
    
    dashChartFluxo = new Chart(ctxFluxo, {
        type: 'line',
        data: {
            labels: labelsMeses,
            datasets: [
                {
                    label: 'Entradas (Receitas)',
                    data: dadosReceitas,
                    borderColor: '#10b981', // Emerald 500
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#10b981',
                    pointBorderWidth: 2,
                    pointRadius: 4
                },
                {
                    label: 'Saídas (Despesas)',
                    data: dadosDespesas,
                    borderColor: '#ef4444', // Red 500
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    borderDash: [5, 5],
                    tension: 0.4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#ef4444',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { font: { family: 'Inter', size: 10, weight: 'bold' }, usePointStyle: true, boxWidth: 8 } } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10, weight: 'bold' }, color: '#94a3b8' } },
                y: { border: { display: false }, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Inter', size: 10 }, color: '#94a3b8', callback: function(val){ return 'R$ ' + val; } } }
            }
        }
    });

    // 2. Gráfico de O.S (Rosca)
    const labelsOS = Object.keys(contagemStatus);
    const dadosOS = Object.values(contagemStatus);
    
    // Paleta de cores corporativa dinâmica para os status
    const coresOS = ['#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6', '#ec4899', '#64748b'];

    const ctxOS = document.getElementById('chartOS').getContext('2d');
    if(dashChartOS) dashChartOS.destroy();

    dashChartOS = new Chart(ctxOS, {
        type: 'doughnut',
        data: {
            labels: labelsOS.length > 0 ? labelsOS : ['Sem O.S'],
            datasets: [{
                data: dadosOS.length > 0 ? dadosOS : [1],
                backgroundColor: dadosOS.length > 0 ? coresOS : ['#f1f5f9'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 10, weight: 'bold' }, usePointStyle: true, boxWidth: 8, padding: 15 } }
            }
        }
    });
}
