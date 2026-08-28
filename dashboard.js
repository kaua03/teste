// ========================================================
// AutoManager - Módulo Dashboard Analítico
// ========================================================

let dashChartFluxo = null;
let dashChartOS = null;

// VARIÁVEIS GLOBAIS DE CACHE PARA O MODAL DRILL-DOWN LER RAPIDAMENTE
let dashCacheReceitas = [];
let dashCacheOrdens = [];

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

        const receitas = reqReceber.data || [];
        const despesas = reqPagar.data || [];
        const ordens = reqOS.data || [];

        // Abastece a memória viva da tela
        dashCacheReceitas = receitas;
        dashCacheOrdens = ordens;

        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();
        const hojeISO = hoje.toISOString().split('T')[0];

        // Métrica 1: Faturamento do Mês
        let faturamentoMes = 0;
        receitas.forEach(r => {
            if (r.status === 'Pago' && r.data_pagamento) {
                const d = new Date(r.data_pagamento + 'T12:00:00Z');
                if (d.getMonth() === mesAtual && d.getFullYear() === anoAtual) {
                    faturamentoMes += r.valor;
                }
            }
        });

        // Métrica 2: A Receber
        let aReceber = 0;
        receitas.forEach(r => {
            if (r.status === 'Pendente' && r.data_vencimento >= hojeISO) {
                aReceber += r.valor;
            }
        });

        // Métrica 3: Inadimplência
        let contasAtrasadas = 0;
        receitas.forEach(r => {
            if (r.status === 'Pendente' && r.data_vencimento < hojeISO) {
                contasAtrasadas++;
            }
        });

        // Métrica 4: O.S em Andamento
        let osAbertas = 0;
        let contagemStatusOS = {};
        
        ordens.forEach(o => {
            contagemStatusOS[o.status] = (contagemStatusOS[o.status] || 0) + 1;
            if (!['Fechado', 'Finalizado', 'Não Usar', 'Orçamento'].includes(o.status)) {
                osAbertas++;
            }
        });

        // INJETANDO NA TELA
        document.getElementById('dash-fat').innerText = faturamentoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('dash-rec').innerText = aReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('dash-os').innerText = `${osAbertas} `;
        document.getElementById('dash-inad').innerText = `${contasAtrasadas} `;

        // PROCESSANDO GRÁFICOS
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

            const sumRec = receitas.reduce((acc, curr) => {
                if (curr.status === 'Pago' && curr.data_pagamento) {
                    const dp = new Date(curr.data_pagamento + 'T12:00:00Z');
                    if (dp.getMonth() === mesTarget && dp.getFullYear() === anoTarget) return acc + curr.valor;
                }
                return acc;
            }, 0);

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
                    borderColor: '#10b981', 
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
                    borderColor: '#ef4444', 
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

    const labelsOS = Object.keys(contagemStatus);
    const dadosOS = Object.values(contagemStatus);
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

// ========================================================
// SISTEMA DE DRILL-DOWN (LISTAGENS EM MODAL)
// ========================================================
function abrirDetalhesDashboard(tipo) {
    const modal = document.getElementById('modal-dash-detalhes');
    const header = document.getElementById('modal-dash-header');
    const titulo = document.getElementById('modal-dash-titulo');
    const thead = document.getElementById('modal-dash-thead');
    const tbody = document.getElementById('modal-dash-tbody');

    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    const hojeISO = hoje.toISOString().split('T')[0];

    let htmlHead = '';
    let htmlBody = '';

    if (tipo === 'fat') {
        header.className = 'p-4 md:p-5 flex justify-between items-center text-white shrink-0 rounded-t-2xl bg-emerald-500';
        titulo.innerHTML = '<i class="ph-bold ph-trend-up mr-2 text-2xl"></i> Detalhamento do Faturamento';
        htmlHead = `<th class="p-4 w-32">Data Pagto</th><th class="p-4">Descrição do Lançamento</th><th class="p-4 w-32">Método</th><th class="p-4 text-right w-40">Valor Recebido</th>`;
        
        const filtrados = dashCacheReceitas.filter(r => {
            if (r.status === 'Pago' && r.data_pagamento) {
                const d = new Date(r.data_pagamento + 'T12:00:00Z');
                return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
            }
            return false;
        });

        if(filtrados.length === 0) htmlBody = `<tr><td colspan="4" class="p-10 text-center text-slate-400 font-bold">Nenhum faturamento registrado neste mês.</td></tr>`;
        
        filtrados.forEach(r => {
            const dataBr = new Date(r.data_pagamento + 'T12:00:00Z').toLocaleDateString('pt-BR');
            const valorBr = r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            htmlBody += `<tr class="hover:bg-slate-50 transition-colors"><td class="p-4 font-bold text-slate-700">${dataBr}</td><td class="p-4 text-slate-600 font-medium">${r.descricao}</td><td class="p-4 text-slate-500 text-xs font-bold uppercase">${r.forma_pagamento || '-'}</td><td class="p-4 font-black text-emerald-600 text-right">${valorBr}</td></tr>`;
        });

    } else if (tipo === 'rec') {
        header.className = 'p-4 md:p-5 flex justify-between items-center text-white shrink-0 rounded-t-2xl bg-amber-500';
        titulo.innerHTML = '<i class="ph-bold ph-clock mr-2 text-2xl"></i> Entradas Futuras (A Receber)';
        htmlHead = `<th class="p-4 w-32">Vencimento</th><th class="p-4">Descrição do Lançamento</th><th class="p-4 text-right w-40">Valor Projetado</th>`;
        
        const filtrados = dashCacheReceitas.filter(r => r.status === 'Pendente' && r.data_vencimento >= hojeISO);

        if(filtrados.length === 0) htmlBody = `<tr><td colspan="3" class="p-10 text-center text-slate-400 font-bold">Nenhuma conta a receber pendente no prazo.</td></tr>`;
        
        filtrados.forEach(r => {
            const dataBr = new Date(r.data_vencimento + 'T12:00:00Z').toLocaleDateString('pt-BR');
            const valorBr = r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            htmlBody += `<tr class="hover:bg-amber-50/30 transition-colors"><td class="p-4 font-bold text-slate-700">${dataBr}</td><td class="p-4 text-slate-600 font-medium">${r.descricao}</td><td class="p-4 font-black text-amber-600 text-right">${valorBr}</td></tr>`;
        });

    } else if (tipo === 'os') {
        header.className = 'p-4 md:p-5 flex justify-between items-center text-white shrink-0 rounded-t-2xl bg-blue-500';
        titulo.innerHTML = '<i class="ph-bold ph-wrench mr-2 text-2xl"></i> Ordens de Serviço em Andamento';
        htmlHead = `<th class="p-4 w-24">Nº O.S</th><th class="p-4">Cliente Associado / Placa</th><th class="p-4 text-center w-32">Status Atual</th><th class="p-4 text-right w-40">Valor Parcial</th>`;
        
        const filtrados = dashCacheOrdens.filter(o => !['Fechado', 'Finalizado', 'Não Usar', 'Orçamento'].includes(o.status));

        if(filtrados.length === 0) htmlBody = `<tr><td colspan="4" class="p-10 text-center text-slate-400 font-bold">Nenhuma O.S em andamento na oficina.</td></tr>`;
        
        filtrados.forEach(o => {
            const valorBr = o.valor_total ? o.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
            htmlBody += `<tr class="hover:bg-blue-50/30 transition-colors"><td class="p-4 font-black text-blue-600">#${o.numero_os}</td><td class="p-4 text-slate-700 font-bold">${o.cliente_nome}<br><span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${o.veiculo_placa}</span></td><td class="p-4 text-center"><span class="bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm whitespace-nowrap">${o.status}</span></td><td class="p-4 font-black text-slate-800 text-right">${valorBr}</td></tr>`;
        });

    } else if (tipo === 'inad') {
        header.className = 'p-4 md:p-5 flex justify-between items-center text-white shrink-0 rounded-t-2xl bg-red-500';
        titulo.innerHTML = '<i class="ph-bold ph-warning-circle mr-2 text-2xl"></i> Alerta de Inadimplência';
        htmlHead = `<th class="p-4 w-32">Venceu Em</th><th class="p-4">Descrição da Cobrança</th><th class="p-4 text-right w-40">Valor em Atraso</th>`;
        
        const filtrados = dashCacheReceitas.filter(r => r.status === 'Pendente' && r.data_vencimento < hojeISO);

        if(filtrados.length === 0) htmlBody = `<tr><td colspan="3" class="p-10 text-center text-slate-400 font-bold">Oficina sem nenhuma inadimplência. Parabéns!</td></tr>`;
        
        filtrados.forEach(r => {
            const dataBr = new Date(r.data_vencimento + 'T12:00:00Z').toLocaleDateString('pt-BR');
            const valorBr = r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            htmlBody += `<tr class="hover:bg-red-50/50 transition-colors"><td class="p-4 font-bold text-red-500">${dataBr}</td><td class="p-4 text-slate-700 font-medium">${r.descricao}</td><td class="p-4 font-black text-red-600 text-right">${valorBr}</td></tr>`;
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
