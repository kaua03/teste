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

// DICIONÁRIO DE CORES DOS STATUS
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
    const elAno = document.getElementById('dash-ano-grafico');
    if(elAno) elAno.innerText = new Date().getFullYear();
    await compilarDadosReais();
}

async function compilarDadosReais() {
    try {
        const [reqReceber, reqPagar, reqOS] = await Promise.all([
            window.banco.from('contas_receber').select('*').order('data_vencimento', { ascending: true }),
            window.banco.from('contas_pagar').select('*'),
            window.banco.from('orcamentos').select('*').order('id', { ascending: false })
        ]);

        dashCacheReceitas = reqReceber.data || [];
        dashCacheDespesas = reqPagar.data || [];
        dashCacheOrdens = reqOS.data || [];

        // Verifica se a tela ainda está ativa antes de continuar
        if(!document.getElementById('dash-fat')) return;

        mudarPeriodoDash('mes');
        renderizarGraficosHistoricos();

    } catch(e) {
        console.error("Falha ao compilar dashboard:", e);
        const elFat = document.getElementById('dash-fat');
        if(elFat) {
            elFat.innerText = "Erro";
            document.getElementById('dash-rec').innerText = "Erro";
        }
    }
}

function verificarDentroDoPeriodo(dataStringISO, periodo) {
    if (!dataStringISO) return false;
    if (periodo === 'geral') return true;
    
    const dataObj = new Date(dataStringISO + 'T12:00:00Z');
    const hoje = new Date();
    
    if (periodo === 'mes') {
        return dataObj.getMonth() === hoje.getMonth() && dataObj.getFullYear() === hoje.getFullYear();
    } else if (periodo === 'semana') {
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(hoje.getDate() - 7);
        seteDiasAtras.setHours(0,0,0,0);
        return dataObj >= seteDiasAtras && dataObj <= hoje;
    }
    return false;
}

function mudarPeriodoDash(periodo) {
    periodoAtualDash = periodo;
    
    const btnSemana = document.getElementById('btn-periodo-semana');
    // TRAVA DE SEGURANÇA: Se o botão não existe, o usuário não está mais nesta tela
    if (!btnSemana) return; 

    const btnMes = document.getElementById('btn-periodo-mes');
    const btnGeral = document.getElementById('btn-periodo-geral');
    
    const classesInativo = "px-4 py-2 text-xs font-bold rounded-lg text-slate-500 hover:bg-slate-50 transition-colors";
    const classesAtivo = "px-4 py-2 text-xs font-bold rounded-lg bg-blue-50 text-blue-600 shadow-sm transition-colors";

    btnSemana.className = periodo === 'semana' ? classesAtivo : classesInativo;
    btnMes.className = periodo === 'mes' ? classesAtivo : classesInativo;
    btnGeral.className = periodo === 'geral' ? classesAtivo : classesInativo;

    const labels = document.querySelectorAll('.lbl-periodo');
    const textoLabel = periodo === 'semana' ? '7 Dias' : (periodo === 'mes' ? 'Mês' : 'Geral');
    labels.forEach(l => l.innerText = textoLabel);

    atualizarCardsMatematica();
}

function atualizarCardsMatematica() {
    let faturamento = 0;
    let despesasTotal = 0;
    let aReceber = 0;
    let contasAtrasadas = 0;
    let osAbertas = 0;
    
    const hojeISO = new Date().toISOString().split('T')[0];

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

    dashCacheDespesas.forEach(d => {
        if (d.status === 'Pago' && verificarDentroDoPeriodo(d.data_pagamento, periodoAtualDash)) {
            despesasTotal += d.valor;
        }
    });

    dashCacheOrdens.forEach(o => {
        if (!['Fechado', 'Finalizado', 'Não Usar', 'Orçamento'].includes(o.status)) {
            if (verificarDentroDoPeriodo(o.data_criacao, periodoAtualDash)) {
                osAbertas++;
            }
        }
    });

    // TRAVA DE SEGURANÇA ANTES DE INJETAR
    const elFat = document.getElementById('dash-fat');
    if (!elFat) return;

    elFat.innerText = faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('dash-desp').innerText = despesasTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('dash-rec').innerText = aReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('dash-os').innerText = `${osAbertas}`;
    document.getElementById('dash-inad').innerText = `${contasAtrasadas}`;
}

function renderizarGraficosHistoricos() {
    const elFluxo = document.getElementById('chartFluxo');
    // TRAVA DE SEGURANÇA
    if (!elFluxo) return;

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

    const ctxFluxo = elFluxo.getContext('2d');
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
        header.className = 'p-5 md:p-6 flex justify-between items-center text-white shrink-0 rounded-t-2xl bg-emerald-500 shadow-md z-20 relative';
        titulo.innerHTML = '<i class="ph-bold ph-trend-up mr-3 text-2xl md:text-3xl opacity-90"></i> Detalhamento do Faturamento';
        htmlHead = `<th class="px-6 py-4 w-32 text-left">Data Pagto</th><th class="px-6 py-4 text-left">Descrição do Lançamento</th><th class="px-6 py-4 w-32 text-center">Método</th><th class="px-6 py-4 text-right w-48">Valor Recebido</th>`;
        
        const filtrados = dashCacheReceitas.filter(r => r.status === 'Pago' && verificarDentroDoPeriodo(r.data_pagamento, periodoAtualDash));

        if(filtrados.length === 0) {
            htmlBody = `<tr><td colspan="4"><div class="flex flex-col items-center justify-center py-16 text-slate-400"><div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4"><i class="ph-fill ph-receipt text-4xl text-slate-300"></i></div><p class="font-bold text-sm">Nenhum faturamento registrado neste período.</p></div></td></tr>`;
        } else {
            filtrados.forEach(r => {
                const dataBr = new Date(r.data_pagamento + 'T12:00:00Z').toLocaleDateString('pt-BR');
                const valorBr = r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                htmlBody += `<tr class="hover:bg-emerald-50/30 transition-colors align-middle">
                    <td class="px-6 py-4"><span class="text-[11px] font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap shadow-sm">${dataBr}</span></td>
                    <td class="px-6 py-4 text-sm font-bold text-slate-700">${r.descricao}</td>
                    <td class="px-6 py-4 text-center"><span class="text-[10px] font-black uppercase text-slate-500 tracking-wider">${r.forma_pagamento || '-'}</span></td>
                    <td class="px-6 py-4 font-black text-emerald-600 text-right text-base md:text-lg tracking-tight">${valorBr}</td>
                </tr>`;
            });
        }

    } else if (tipo === 'desp') {
        header.className = 'p-5 md:p-6 flex justify-between items-center text-white shrink-0 rounded-t-2xl bg-rose-500 shadow-md z-20 relative';
        titulo.innerHTML = '<i class="ph-bold ph-trend-down mr-3 text-2xl md:text-3xl opacity-90"></i> Detalhamento de Saídas (Despesas)';
        htmlHead = `<th class="px-6 py-4 w-32 text-left">Data Pagto</th><th class="px-6 py-4 text-left">Descrição da Despesa</th><th class="px-6 py-4 w-32 text-center">Método</th><th class="px-6 py-4 text-right w-48">Valor Pago</th>`;
        
        const filtrados = dashCacheDespesas.filter(d => d.status === 'Pago' && verificarDentroDoPeriodo(d.data_pagamento, periodoAtualDash));

        if(filtrados.length === 0) {
            htmlBody = `<tr><td colspan="4"><div class="flex flex-col items-center justify-center py-16 text-slate-400"><div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4"><i class="ph-fill ph-wallet text-4xl text-slate-300"></i></div><p class="font-bold text-sm">Nenhuma despesa paga neste período.</p></div></td></tr>`;
        } else {
            filtrados.forEach(d => {
                const dataBr = new Date(d.data_pagamento + 'T12:00:00Z').toLocaleDateString('pt-BR');
                const valorBr = d.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                htmlBody += `<tr class="hover:bg-rose-50/30 transition-colors align-middle">
                    <td class="px-6 py-4"><span class="text-[11px] font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap shadow-sm">${dataBr}</span></td>
                    <td class="px-6 py-4 text-sm font-bold text-slate-700">${d.descricao}</td>
                    <td class="px-6 py-4 text-center"><span class="text-[10px] font-black uppercase text-slate-500 tracking-wider">${d.forma_pagamento || '-'}</span></td>
                    <td class="px-6 py-4 font-black text-rose-600 text-right text-base md:text-lg tracking-tight">${valorBr}</td>
                </tr>`;
            });
        }

    } else if (tipo === 'rec') {
        header.className = 'p-5 md:p-6 flex justify-between items-center text-white shrink-0 rounded-t-2xl bg-amber-500 shadow-md z-20 relative';
        titulo.innerHTML = '<i class="ph-bold ph-clock mr-3 text-2xl md:text-3xl opacity-90"></i> Entradas Futuras (A Receber)';
        htmlHead = `<th class="px-6 py-4 w-32 text-left">Vencimento</th><th class="px-6 py-4 text-left">Descrição do Lançamento</th><th class="px-6 py-4 text-right w-48">Valor Projetado</th>`;
        
        const filtrados = dashCacheReceitas.filter(r => r.status === 'Pendente' && r.data_vencimento >= hojeISO && verificarDentroDoPeriodo(r.data_vencimento, periodoAtualDash));

        if(filtrados.length === 0) {
            htmlBody = `<tr><td colspan="3"><div class="flex flex-col items-center justify-center py-16 text-slate-400"><div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4"><i class="ph-fill ph-calendar-check text-4xl text-slate-300"></i></div><p class="font-bold text-sm">Nenhuma conta a receber para este período.</p></div></td></tr>`;
        } else {
            filtrados.forEach(r => {
                const dataBr = new Date(r.data_vencimento + 'T12:00:00Z').toLocaleDateString('pt-BR');
                const valorBr = r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                htmlBody += `<tr class="hover:bg-amber-50/30 transition-colors align-middle">
                    <td class="px-6 py-4"><span class="text-[11px] font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap shadow-sm">${dataBr}</span></td>
                    <td class="px-6 py-4 text-sm font-bold text-slate-700">${r.descricao}</td>
                    <td class="px-6 py-4 font-black text-amber-600 text-right text-base md:text-lg tracking-tight">${valorBr}</td>
                </tr>`;
            });
        }

    } else if (tipo === 'os') {
        header.className = 'p-5 md:p-6 flex justify-between items-center text-white shrink-0 rounded-t-2xl bg-blue-500 shadow-md z-20 relative';
        titulo.innerHTML = '<i class="ph-bold ph-wrench mr-3 text-2xl md:text-3xl opacity-90"></i> Ordens de Serviço em Andamento';
        htmlHead = `<th class="px-6 py-4 w-32 text-left">Data / O.S</th><th class="px-6 py-4 text-left">Cliente Associado / Placa</th><th class="px-6 py-4 text-center w-36">Status Atual</th><th class="px-6 py-4 text-right w-48">Valor Parcial</th>`;
        
        const filtrados = dashCacheOrdens.filter(o => !['Fechado', 'Finalizado', 'Não Usar', 'Orçamento'].includes(o.status) && verificarDentroDoPeriodo(o.data_criacao, periodoAtualDash));

        if(filtrados.length === 0) {
            htmlBody = `<tr><td colspan="4"><div class="flex flex-col items-center justify-center py-16 text-slate-400"><div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4"><i class="ph-fill ph-car text-4xl text-slate-300"></i></div><p class="font-bold text-sm">Nenhuma O.S aberta neste período.</p></div></td></tr>`;
        } else {
            filtrados.forEach(o => {
                const dataBr = new Date(o.data_criacao).toLocaleDateString('pt-BR');
                const valorBr = o.valor_total ? o.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
                const corStatus = getCorStatusDashboard(o.status);

                htmlBody += `<tr class="hover:bg-blue-50/30 transition-colors align-middle">
                    <td class="px-6 py-4">
                        <div class="flex flex-col items-start gap-1">
                            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">${dataBr}</span>
                            <span class="font-black text-blue-600 text-sm">#${o.numero_os}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <p class="text-sm font-bold text-slate-700">${o.cliente_nome}</p>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">${o.veiculo_placa}</p>
                    </td>
                    <td class="px-6 py-4 text-center"><span class="${corStatus} border px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm whitespace-nowrap">${o.status}</span></td>
                    <td class="px-6 py-4 font-black text-slate-800 text-right text-base md:text-lg tracking-tight">${valorBr}</td>
                </tr>`;
            });
        }

    } else if (tipo === 'inad') {
        header.className = 'p-5 md:p-6 flex justify-between items-center text-white shrink-0 rounded-t-2xl bg-purple-500 shadow-md z-20 relative';
        titulo.innerHTML = '<i class="ph-bold ph-warning-circle mr-3 text-2xl md:text-3xl opacity-90"></i> Alerta de Inadimplência';
        htmlHead = `<th class="px-6 py-4 w-32 text-left">Venceu Em</th><th class="px-6 py-4 text-left">Descrição da Cobrança</th><th class="px-6 py-4 text-right w-48">Valor em Atraso</th>`;
        
        const filtrados = dashCacheReceitas.filter(r => r.status === 'Pendente' && r.data_vencimento < hojeISO && verificarDentroDoPeriodo(r.data_vencimento, periodoAtualDash));

        if(filtrados.length === 0) {
            htmlBody = `<tr><td colspan="3"><div class="flex flex-col items-center justify-center py-16 text-slate-400"><div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4"><i class="ph-fill ph-check-circle text-4xl text-slate-300"></i></div><p class="font-bold text-sm">Oficina sem nenhuma inadimplência. Parabéns!</p></div></td></tr>`;
        } else {
            filtrados.forEach(r => {
                const dataBr = new Date(r.data_vencimento + 'T12:00:00Z').toLocaleDateString('pt-BR');
                const valorBr = r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                htmlBody += `<tr class="hover:bg-purple-50/30 transition-colors align-middle">
                    <td class="px-6 py-4"><span class="text-[11px] font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 whitespace-nowrap shadow-sm">${dataBr}</span></td>
                    <td class="px-6 py-4 text-sm font-bold text-slate-700">${r.descricao}</td>
                    <td class="px-6 py-4 font-black text-purple-600 text-right text-base md:text-lg tracking-tight">${valorBr}</td>
                </tr>`;
            });
        }
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
