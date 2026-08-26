/**
 * AutoManager - Motor do Dashboard
 * Desenvolvido para alta performance e modularidade.
 */

// ==========================================
// 1. CONFIGURAÇÃO DO SUPABASE (BANCO DE DADOS)
// ==========================================
const SUPABASE_URL = 'https://SUA-URL-AQUI.supabase.co';
const SUPABASE_KEY = 'SUA-CHAVE-PUBLICA-AQUI';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Utilitário de formatação rápida
const formataMoeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ==========================================
// 2. CONTROLE DO MENU MOBILE (FAB EXPANSÍVEL)
// ==========================================
const fabMainBtn = document.getElementById('fab-main-btn');
const fabMenu = document.getElementById('fab-menu');
const fabIcon = document.getElementById('fab-icon');
let isFabOpen = false;

fabMainBtn.addEventListener('click', () => {
    isFabOpen = !isFabOpen;
    if (isFabOpen) {
        // Mostra o menu com animação
        fabMenu.classList.remove('hidden');
        // Pequeno atraso para a transição do Tailwind funcionar após remover o hidden
        setTimeout(() => {
            fabMenu.classList.remove('scale-95', 'opacity-0');
            fabMenu.classList.add('scale-100', 'opacity-100');
        }, 10);
        
        // Gira e troca o ícone do botão principal
        fabIcon.classList.replace('ph-list', 'ph-x');
        fabMainBtn.classList.replace('bg-blue-600', 'bg-slate-800');
        fabMainBtn.classList.add('rotate-90');
    } else {
        // Esconde com animação
        fabMenu.classList.remove('scale-100', 'opacity-100');
        fabMenu.classList.add('scale-95', 'opacity-0');
        
        // Volta o botão ao normal
        fabIcon.classList.replace('ph-x', 'ph-list');
        fabMainBtn.classList.replace('bg-slate-800', 'bg-blue-600');
        fabMainBtn.classList.remove('rotate-90');

        setTimeout(() => { fabMenu.classList.add('hidden'); }, 300);
    }
});

// ==========================================
// 3. RENDERIZAÇÃO DOS DADOS (MOCK PARA SEXTA-FEIRA)
// ==========================================
async function carregarDadosDashboard() {
    // Nota de Engenharia: Quando o Supabase estiver populado, trocaremos estes dados 
    // mockados por chamadas "await supabase.from('orcamentos').select('*')"
    
    // 1. Atualizar KPIs Topo
    document.getElementById('kpi-faturamento').innerText = formataMoeda(85420.50);
    document.getElementById('kpi-receber').innerText = formataMoeda(12300.00);
    document.getElementById('kpi-orcamentos').innerText = "18";

    // 2. Popular Tabela Recentes (Simulando uma leitura rápida do banco)
    const orcamentosRecentes = [
        { id: 5104, cliente: "Larissa Silva", placa: "RXY9A21", val: 1850.00, status: "Aprovado", cor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
        { id: 5103, cliente: "João Transportes", placa: "ABC-1234", val: 4500.00, status: "Aguardando Peça", cor: "bg-orange-50 text-orange-600 border-orange-200" },
        { id: 5102, cliente: "Marcos Mecânica", placa: "XYZ-9876", val: 320.00, status: "Rascunho", cor: "bg-slate-100 text-slate-600 border-slate-200" },
        { id: 5101, cliente: "Empresa Log Alfa", placa: "DEF-5678", val: 12400.00, status: "Em Análise", cor: "bg-blue-50 text-blue-600 border-blue-200" }
    ];

    const tabela = document.getElementById('tabela-recentes');
    tabela.innerHTML = orcamentosRecentes.map(orc => `
        <tr class="hover:bg-slate-50 transition-colors cursor-pointer">
            <td class="px-5 py-3 md:py-4">
                <p class="font-bold text-slate-800">${orc.cliente}</p>
                <p class="text-[10px] text-slate-400 font-bold uppercase">#${orc.id}</p>
            </td>
            <td class="px-5 py-3 md:py-4 font-bold text-slate-500 uppercase">${orc.placa}</td>
            <td class="px-5 py-3 md:py-4 font-black text-slate-800 text-right">${formataMoeda(orc.val)}</td>
            <td class="px-5 py-3 md:py-4 text-center">
                <span class="border px-2.5 py-1 rounded-md text-[10px] font-bold ${orc.cor} shadow-sm">${orc.status}</span>
            </td>
        </tr>
    `).join('');

    // 3. Renderizar Gráficos Premium
    renderizarGraficos();
}

// ==========================================
// 4. GRÁFICOS ANALÍTICOS (O PODER DOS DADOS)
// ==========================================
function renderizarGraficos() {
    Chart.defaults.font.family = 'Inter, sans-serif';
    Chart.defaults.color = '#94a3b8';

    // Gráfico de Linha (Fluxo de Caixa)
    const ctxLinha = document.getElementById('chartFaturamento').getContext('2d');
    const gradientLinha = ctxLinha.createLinearGradient(0, 0, 0, 300);
    gradientLinha.addColorStop(0, 'rgba(37, 99, 235, 0.3)'); // Blue 600 translúcido
    gradientLinha.addColorStop(1, 'rgba(37, 99, 235, 0.0)');

    new Chart(ctxLinha, {
        type: 'line',
        data: {
            labels: ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'],
            datasets: [{
                label: 'Faturamento',
                data: [42000, 58000, 55000, 75000, 68000, 85420],
                borderColor: '#2563eb',
                backgroundColor: gradientLinha,
                borderWidth: 3,
                fill: true,
                tension: 0.4, // Transforma linhas retas em curvas fluidas
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
                y: { grid: { color: '#f1f5f9' }, border: { display: false }, ticks: { maxTicksLimit: 6 } }
            },
            interaction: { mode: 'index', intersect: false }
        }
    });

    // Gráfico de Rosca (Status da Frota)
    new Chart(document.getElementById('chartFrota').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Entregues', 'Na Oficina', 'Aguardando Peça'],
            datasets: [{
                data: [65, 25, 10],
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'], // Emerald, Blue, Amber
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%', // Deixa a rosca mais fina e moderna
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 20 } }
            }
        }
    });
}

// ==========================================
// 5. INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    carregarDadosDashboard();
});
