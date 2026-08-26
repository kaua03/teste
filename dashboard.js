// dashboard.js

/**
 * Função principal chamada pelo Roteador (SPA) assim que o dashboard.html é carregado.
 */
function initDashboard() {
    console.log("🟢 Módulo Dashboard Inicializado.");
    
    // 1. Simulação de Leitura de Dados
    carregarDadosDashboard();
    
    // 2. Renderização dos Gráficos
    renderizarGraficosDashboard();
}

/**
 * Alimenta os KPIs e a tabela com dados. 
 * (Quando ligarmos o Supabase, os selects reais entrarão aqui)
 */
function carregarDadosDashboard() {
    const formataDin = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Alimentando KPIs
    document.getElementById('dash-fat').innerText = formataDin(85420.50);
    document.getElementById('dash-rec').innerText = formataDin(12300.00);
    document.getElementById('dash-orc').innerText = "18";
    document.getElementById('dash-inad').innerText = "3 Notas";

    // Alimentando Tabela de Recentes
    const recentes = [
        { cliente: 'Larissa Silva', placa: 'RXY9A21', val: 1250, st: 'Aprovado', bg: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
        { cliente: 'João Logística', placa: 'ABC-1234', val: 3400, st: 'Pendente', bg: 'bg-amber-50 text-amber-600 border-amber-200' },
        { cliente: 'Carlos Peças', placa: 'XYZ-9876', val: 450, st: 'Rascunho', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
        { cliente: 'Viação Alfa', placa: 'DEF-5678', val: 14500, st: 'Concluído', bg: 'bg-emerald-50 text-emerald-600 border-emerald-200' }
    ];
    
    const tabelaHTML = recentes.map(orc => `
        <tr class="hover:bg-slate-50 transition-colors cursor-pointer">
            <td class="px-5 py-4">
                <p class="font-bold text-slate-800">${orc.cliente}</p>
                <p class="text-[10px] text-slate-400 font-bold uppercase">Fiat Strada 2024</p>
            </td>
            <td class="px-5 py-4 font-bold text-slate-500 uppercase">${orc.placa}</td>
            <td class="px-5 py-4 font-black text-slate-800 text-right">${formataDin(orc.val)}</td>
            <td class="px-5 py-4 text-center">
                <span class="border px-2.5 py-1 rounded-md text-[10px] font-bold ${orc.bg} shadow-sm">${orc.st}</span>
            </td>
        </tr>
    `).join('');

    document.getElementById('lista-recentes').innerHTML = tabelaHTML;
}

/**
 * Desenha os gráficos utilizando a biblioteca Chart.js já importada no index
 */
function renderizarGraficosDashboard() {
    Chart.defaults.font.family = 'Inter, sans-serif';
    Chart.defaults.color = '#94a3b8';

    // =====================================
    // Gráfico 1: Fluxo de Caixa (Linha com gradiente)
    // =====================================
    const canvasFaturamento = document.getElementById('chartFaturamento');
    if(canvasFaturamento) {
        const ctxLinha = canvasFaturamento.getContext('2d');
        const gradient = ctxLinha.createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, 'rgba(37, 99, 235, 0.25)'); // Azul 600 com 25% opacidade
        gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');

        new Chart(ctxLinha, {
            type: 'line',
            data: {
                labels: ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'],
                datasets: [{
                    label: 'Faturamento Mensal',
                    data: [42000, 58000, 55000, 75000, 68000, 85420],
                    borderColor: '#2563eb',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4, // Curva premium
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#2563eb',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, border: { display: false } },
                    y: { border: { display: false }, grid: { color: '#f1f5f9' }, ticks: { maxTicksLimit: 6 } }
                }
            }
        });
    }

    // =====================================
    // Gráfico 2: Status da Frota (Rosca fina)
    // =====================================
    const canvasFrota = document.getElementById('chartFrota');
    if(canvasFrota) {
        new Chart(canvasFrota, {
            type: 'doughnut',
            data: {
                labels: ['Concluídos', 'Em Serviço', 'Aguardando'],
                datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%', // Furo maior no meio
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 20 } }
                }
            }
        });
    }
}
