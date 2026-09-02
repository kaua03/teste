// ========================================================
// AutoManager - Módulo Dashboard Analítico
// ========================================================

let dashChartFluxo = null;
let dashChartOS = null;

// VARIÁVEIS GLOBAIS DE CACHE PARA RECALCULO INSTANTÂNEO
let dashCacheReceitas = [];
let dashCacheDespesas = [];
let dashCacheOrdens = [];

// ESTADO GLOBAL DO PERÍODO SELECIONADO
let periodoAtualDash = 'mes'; 

// DICIONÁRIO DE CORES DOS STATUS (SUPERPODER DE UI)
const getCorStatusDashboard = (status) => {
    const cores = {
        'Em Aberto': 'bg-slate-100 text-slate-700 border-slate-200',
        'Aguardando Aprovação': 'bg-yellow-50 text-yellow-700 border-yellow-200',
        'Aguardando Peça': 'bg-orange-50 text-orange-700 border-orange-200',
        'Aguardando Pagamento': 'bg-amber-50 text-amber-700 border-amber-200',
        'Aprovado': 'bg-blue-50 text-blue-700 border-blue-200',
        'Em Execução': 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
    return cores[status] || 'bg-slate-50 text-slate-500 border-slate-200';
};

async function initDashboard() {
    console.log("🟢 Módulo Dashboard Inicializado.");
    document.getElementById('dash-ano-grafico').innerText = new Date().getFullYear();
    await compilarDadosReais();
}

async function compilarDadosReais() {
    try {
        const [reqReceber, reqPagar, reqOS] = await Promise.all([
            window.banco.from('contas_receber').select('*').order('data_vencimento', { ascending: true }),
            window.banco.from('contas_pagar').select('*'),
            window.banco.from('orcamentos').select('*').order('id', { ascending: false })
        ]);

        // Guarda os dados na "memória viva"
        dashCacheReceitas = reqReceber.data || [];
        dashCacheDespesas = reqPagar.data || [];
        dashCacheOrdens = reqOS.data || [];

        // Força a atualização da interface com base no filtro padrão (Mês)
        mudarPeriodoDash('mes');

        // Os gráficos sempre mostram uma foto global/histórica 
        // (independentes do filtro de cima, para você ver a tendência)
        renderizarGraficosHistoricos();

    } catch(e) {
        console.error("Falha ao compilar dashboard:", e);
        document.getElementById('dash-fat').innerText = "Erro";
        document.getElementById('dash-rec').innerText = "Erro";
    }
}

function verificarDentroDoPeriodo(dataStringISO, periodo) {
    if (!dataStringISO) return false;
    if (periodo === 'geral') return true;
    
    // Converte a string do banco (YYYY-MM-DD) para um objeto de Data Javascript
    const dataObj = new Date(dataStringISO + 'T12:00:00Z');
    const hoje = new Date();
    
    if (periodo === 'mes') {
        return dataObj.getMonth() === hoje.getMonth() && dataObj.getFullYear() === hoje.getFullYear();
    } else if (periodo === 'semana') {
        // Pega os últimos 7 dias corridos
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(hoje.getDate() - 7);
        seteDiasAtras.setHours(0,0,0,0);
        return dataObj >= seteDiasAtras && dataObj <= hoje;
    }
    return false;
}

function mudarPeriodoDash(periodo) {
    periodoAtualDash = periodo;
    
    // 1. Atualiza as Cores dos Botões
    const btnSemana = document.getElementById('btn-periodo-semana');
    const btnMes = document.getElementById('btn-periodo-mes');
    const btnGeral = document.getElementById('btn-periodo-geral');
    
    const classesInativo = "px-4 py-2 text-xs font-bold rounded-lg text-slate-500 hover:bg-slate-50 transition-colors";
    const classesAtivo = "px-4 py-2 text-xs font-bold rounded-lg bg-blue-50 text-blue-600 shadow-sm transition-colors";

    btnSemana.className = periodo === 'semana' ? classesAtivo : classesInativo;
    btnMes.className = periodo === 'mes' ? classesAtivo : classesInativo;
    btnGeral.className = periodo === 'geral' ? classesAtivo : classesInativo;

    // 2. Atualiza a Escrita Dinâmica nos Cards
    const labels = document.querySelectorAll('.lbl-periodo');
    const textoLabel = periodo === 'semana' ? '7 Dias' : (periodo === 'mes' ? 'Mês' : 'Geral');
    labels.forEach(l => l.innerText = textoLabel);

    // 3. Roda a Matemática Instantânea nos Cards
    atualizarCardsMatematica();
}

function atualizarCardsMatematica() {
    let faturamento = 0;
    let despesasTotal = 0;
    let aReceber = 0;
    let contasAtrasadas = 0;
    let osAbertas = 0;
    
    const hojeISO = new Date().toISOString().split('T')[0];

    // Varredura de Receitas
    dashCacheReceitas.forEach(r => {
        if (r.status === 'Pago' && verificarDentroDoPeriodo(r.data_pagamento, periodoAtualDash)) {
            faturamento += r.valor;
        }
        if (r.status === 'Pendente') {
            if (r.data_vencimento >= hojeISO && verificarDentroDoPeriodo(r.data_vencimento, periodoAtualDash)) {
                aReceber += r.valor;
            }
            if (r.data_vencimento < hojeISO && verificarDentroDoPeriodo(r.data_vencimento, periodoAtualDash)) {
                contasAtrasadas++;
            }
        }
    });

    // Varredura de Despesas
    dashCacheDespesas.forEach(d => {
        if (d.status === 'Pago' && verificarDentroDoPeriodo(d.data_pagamento, periodoAtualDash)) {
            despesasTotal += d.valor;
        }
    });

    // Varredura de Ordens de Serviço
    dashCacheOrdens.forEach(o => {
        if (!['Fechado', 'Finalizado', 'Não Usar', 'Orçamento'].includes(o.status)) {
            // Conta O.S que foram ABERTAS dentro do período selecionado
            if (verificarDentroDoPeriodo(o.data_criacao, periodoAtualDash)) {
                osAbertas++;
            }
        }
    });

    // Injeta os resultados processados na UI (Tela)
    document.getElementById('dash-fat').innerText = faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('dash-desp').innerText = despesasTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('dash-rec').innerText = aReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('dash-os').innerText = `${osAbertas}`;
    document.getElementById('dash-inad').innerText = `${contasAtrasadas}`;
}

function renderizarGraficosHistoricos() {
    // Processamento de Dados Históricos (Últimos 6 Meses) - Imune ao botão de filtro
    const labelsMeses = [];
    const dadosReceitas = [];
    const dadosDespesas = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const nomeMes = d.toLocaleString('pt-BR', { month: 'short' });
        labelsMeses.push(nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1));
        
        const mesTarget = d.getMonth();
        const anoTarget = d.getFullYear();

        const sumRec = dashCacheReceitas.reduce((acc, curr) => {
            if (curr.status === 'Pago' && curr.data_pagamento) {
                const dp = new Date(curr.data_pagamento + 'T12:00:00Z');
                if (dp.getMonth() === mesTarget && dp.getFullYear() === anoTarget) return acc + curr.valor;
            }
            return acc;
        }, 0);

        const sumDesp = dashCacheDespesas.reduce((acc, curr) => {
            if (curr.status === 'Pago' && curr.data_pagamento) {
                const dp = new Date(curr.data_pagamento + 'T12:00:00Z');
                if (dp.getMonth() === mesTarget && dp.getFullYear() === anoTarget) return acc + curr.valor;
            }
            return acc;
        }, 0);

        dadosReceitas.push(sumRec);
        dadosDespesas.push(sumDesp);
    }

    // Gráfico de Fluxo de Caixa (Linha)
    const ctxFluxo = document.getElementById('chartFluxo').getContext('2d');
    if(dashChartFluxo) dashChartFluxo.destroy();
    
    dashChartFluxo = new Chart(ctxFluxo, {
        type: 'line',
        data: {
            labels: labelsMeses,
            datasets: [
                {
                    label: 'Entradas (Receitas)', data: dadosReceitas, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 3, tension: 0.4, fill: true, pointBackgroundColor: '#fff', pointBorderColor: '#10b981', pointBorderWidth: 2, pointRadius: 4
                },
                {
                    label: 'Saídas (Despesas)', data: dadosDespesas, borderColor: '#ef4444', backgroundColor: 'transparent', borderWidth: 3, borderDash: [5, 5], tension: 0.4, pointBackgroundColor: '#fff', pointBorderColor: '#ef4444', pointBorderWidth: 2, pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { font: { family: 'Inter', size: 10, weight: 'bold' }, usePointStyle: true, boxWidth: 8 } } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10, weight: 'bold' }, color: '#94a3b8' } },
                y: { border: { display: false }, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Inter', size: 10 }, color: '#94a3b8', callback: function(val){ return 'R$ ' + val; } } }
            }
        }
    });

    // Gráfico de Status da Oficina (Pizza)
    let contagemStatusOS = {};
    dashCacheOrdens.forEach(o => { contagemStatusOS[o.status] = (contagemStatusOS[o.status] || 0) + 1; });

    const labelsOS = Object.keys(contagemStatusOS);
    const dadosOS = Object.values(contagemStatusOS);
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
                borderWidth: 0, hoverOffset: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '70%',
            plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 10, weight: 'bold' }, usePointStyle: true, boxWidth: 8, padding: 15 } } }
        }
    });
}

// ========================================================
// SISTEMA DE DRILL-DOWN (LISTAGENS EM MODAL COM FILTRO)
// ========================================================
function abrirDetalhesDashboard(tipo) {
    const modal = document.getElementById('modal-dash-detalhes');
    const header = document.getElementById('modal-dash-header');
    const titulo = document.getElementById('modal-dash-titulo');
    const thead = document.getElementById('modal-dash-thead');
    const tbody = document.getElementById('modal-dash-tbody');

    const hojeISO = new Date().toISOString().split('T')[0];

    let htmlHead = '';
    let htmlBody = '';

    if (tipo === 'fat') {
        header.className = 'p-4 md:p-5 flex justify-between items-center text-white shrink-0 rounded-t-2xl bg-emerald-500';
        titulo.innerHTML = '<i class="ph-bold ph-trend-up mr-2 text-2xl"></i> Detalhamento do Faturamento';
        htmlHead = `<th class="p-4 w-32">Data Pagto</th><th class="p-4">Descrição do Lançamento</th><th class="p-4 w-32">Método</th><th class="p-4 text-right w-40">Valor Recebido</th>`;
        
        const filtrados = dashCacheReceitas.filter(r => r.status === 'Pago' && verificarDentroDoPeriodo(r.data_pagamento, periodoAtualDash));

        if(filtrados.length === 0) htmlBody = `<tr><td colspan="4" class="p-10 text-center text-slate-400 font-bold">Nenhum faturamento registrado neste período.</td></tr>`;
        
        filtrados.forEach(r => {
            const dataBr = new Date(r.data_pagamento + 'T12:00:00Z').toLocaleDateString('pt-BR');
            const valorBr = r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            htmlBody += `<tr class="hover:bg-emerald-50/50 transition-colors"><td class="p-4 font-bold text-slate-700">${dataBr}</td><td class="p-4 text-slate-600 font-medium">${r.descricao}</td><td class="p-4 text-slate-500 text-xs font-bold uppercase">${r.forma_pagamento || '-'}</td><td class="p-4 font-black text-emerald-600 text-right">${valorBr}</td></tr>`;
        });

    } else if (tipo === 'desp') {
        header.className = 'p-4 md:p-5 flex justify-between items-center text-white shrink-0 rounded-t-2xl bg-rose-500';
        titulo.innerHTML = '<i class="ph-bold ph-trend-down mr-2 text-2xl"></i> Detalhamento de Saídas (Despesas)';
        htmlHead = `<th class="p-4 w-32">Data Pagto</th><th class="p-4">Descrição da Despesa</th><th class="p-4 w-32">Método</th><th class="p-4 text-right w-40">Valor Pago</th>`;
        
        const filtrados = dashCacheDespesas.filter(d => d.status === 'Pago' && verificarDentroDoPeriodo(d.data_pagamento, periodoAtualDash));

        if(filtrados.length === 0) htmlBody = `<tr><td colspan="4" class="p-10 text-center text-slate-400 font-bold">Nenhuma despesa paga neste período.</td></tr>`;
        
        filtrados.forEach(d => {
            const dataBr = new Date(d.data_pagamento + 'T12:00:00Z').toLocaleDateString('pt-BR');
            const valorBr = d.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            htmlBody += `<tr class="hover:bg-rose-50/50 transition-colors"><td class="p-4 font-bold text-slate-700">${dataBr}</td><td class="p-4 text-slate-600 font-medium">${d.descricao}</td><td class="p-4 text-slate-500 text-xs font-bold uppercase">${d.forma_pagamento || '-'}</td><td class="p-4 font-black text-rose-600 text-right">${valorBr}</td></tr>`;
        });

    } else if (tipo === 'rec') {
        header.className = 'p-4 md:p-5 flex justify-between items-center text-white shrink-0 rounded-t-2xl bg-amber-500';
        titulo.innerHTML = '<i class="ph-bold ph-clock mr-2 text-2xl"></i> Entradas Futuras (A Receber)';
        htmlHead = `<th class="p-4 w-32">Vencimento</th><th class="p-4">Descrição do Lançamento</th><th class="p-4 text-right w-40">Valor Projetado</th>`;
        
        const filtrados = dashCacheReceitas.filter(r => r.status === 'Pendente' && r.data_vencimento >= hojeISO && verificarDentroDoPeriodo(r.data_vencimento, periodoAtualDash));

        if(filtrados.length === 0) htmlBody = `<tr><td colspan="3" class="p-10 text-center text-slate-400 font-bold">Nenhuma conta a receber para este período.</td></tr>`;
        
        filtrados.forEach(r => {
            const dataBr = new Date(r.data_vencimento + 'T12:00:00Z').toLocaleDateString('pt-BR');
            const valorBr = r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            htmlBody += `<tr class="hover:bg-amber-50/30 transition-colors"><td class="p-4 font-bold text-slate-700">${dataBr}</td><td class="p-4 text-slate-600 font-medium">${r.descricao}</td><td class="p-4 font-black text-amber-600 text-right">${valorBr}</td></tr>`;
        });

    } else if (tipo === 'os') {
        header.className = 'p-4 md:p-5 flex justify-between items-center text-white shrink-0 rounded-t-2xl bg-blue-500';
        titulo.innerHTML = '<i class="ph-bold ph-wrench mr-2 text-2xl"></i> Ordens de Serviço em Andamento';
        // HTML ATUALIZADO: Coluna Data/O.S combinada
        htmlHead = `<th class="p-4 w-24">Data / O.S</th><th class="p-4">Cliente Associado / Placa</th><th class="p-4 text-center w-32">Status Atual</th><th class="p-4 text-right w-40">Valor Parcial</th>`;
        
        const filtrados = dashCacheOrdens.filter(o => !['Fechado', 'Finalizado', 'Não Usar', 'Orçamento'].includes(o.status) && verificarDentroDoPeriodo(o.data_criacao, periodoAtualDash));

        if(filtrados.length === 0) htmlBody = `<tr><td colspan="4" class="p-10 text-center text-slate-400 font-bold">Nenhuma O.S aberta neste período.</td></tr>`;
        
        filtrados.forEach(o => {
            // LÓGICA ATUALIZADA: Puxa a Data, o Valor e a Cor do Dicionário
            const dataBr = new Date(o.data_criacao).toLocaleDateString('pt-BR');
            const valorBr = o.valor_total ? o.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
            const corStatus = getCorStatusDashboard(o.status);

            htmlBody += `<tr class="hover:bg-blue-50/30 transition-colors">
                <td class="p-4">
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">${dataBr}</p>
                    <p class="font-black text-blue-600">#${o.numero_os}</p>
                </td>
                <td class="p-4 text-slate-700 font-bold">${o.cliente_nome}<br><span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${o.veiculo_placa}</span></td>
                <td class="p-4 text-center"><span class="${corStatus} border px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm whitespace-nowrap">${o.status}</span></td>
                <td class="p-4 font-black text-slate-800 text-right">${valorBr}</td>
            </tr>`;
        });

    } else if (tipo === 'inad') {
        header.className = 'p-4 md:p-5 flex justify-between items-center text-white shrink-0 rounded-t-2xl bg-purple-500';
        titulo.innerHTML = '<i class="ph-bold ph-warning-circle mr-2 text-2xl"></i> Alerta de Inadimplência';
        htmlHead = `<th class="p-4 w-32">Venceu Em</th><th class="p-4">Descrição da Cobrança</th><th class="p-4 text-right w-40">Valor em Atraso</th>`;
        
        const filtrados = dashCacheReceitas.filter(r => r.status === 'Pendente' && r.data_vencimento < hojeISO && verificarDentroDoPeriodo(r.data_vencimento, periodoAtualDash));

        if(filtrados.length === 0) htmlBody = `<tr><td colspan="3" class="p-10 text-center text-slate-400 font-bold">Sem inadimplência neste período de filtro!</td></tr>`;
        
        filtrados.forEach(r => {
            const dataBr = new Date(r.data_vencimento + 'T12:00:00Z').toLocaleDateString('pt-BR');
            const valorBr = r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            htmlBody += `<tr class="hover:bg-purple-50/50 transition-colors"><td class="p-4 font-bold text-purple-500">${dataBr}</td><td class="p-4 text-slate-700 font-medium">${r.descricao}</td><td class="p-4 font-black text-purple-600 text-right">${valorBr}</td></tr>`;
        });
    }

    thead.innerHTML = htmlHead;
    tbody.innerHTML = htmlBody;

    document.getElementById('visor-da-tv').classList.add('overflow-y-hidden'); 
    document.getElementById('visor-da-tv').classList.remove('overflow-y-auto');
    document.getElementById('modal-dash-detalhes').classList.remove('hidden');
}

function fecharModalDashDetalhes() {
    document.getElementById('visor-da-tv').classList.add('overflow-y-auto'); 
    document.getElementById('visor-da-tv').classList.remove('overflow-y-hidden');
    document.getElementById('modal-dash-detalhes').classList.add('hidden');
}
