// dashboard.js

async function initDashboard() {
    console.log("🟢 Dashboard Final Inicializado (Conectado ao Supabase).");
    await carregarDadosReaisDoBanco();
}

async function carregarDadosReaisDoBanco() {
    const formataDin = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    try {
        const { data: orcamentos, error: errOrc } = await window.banco
            .from('orcamentos')
            .select('*')
            .order('id', { ascending: false })
            .limit(5);

        if (errOrc) throw errOrc;

        const { data: financas, error: errFin } = await window.banco
            .from('financeiro')
            .select('*');

        if (errFin) throw errFin;

        let faturamentoReal = 0;
        let aReceberReal = 0;
        let notasInadimplentes = 0;

        financas.forEach(item => {
            if (item.tipo === 'Entrada' && item.status === 'Pago') faturamentoReal += item.valor;
            if (item.tipo === 'Entrada' && item.status === 'Pendente') {
                aReceberReal += item.valor;
                notasInadimplentes++;
            }
        });

        // TRAVA DE SEGURANÇA: Se o usuário já mudou de tela, cancela a operação silenciosamente.
        if (!document.getElementById('dash-fat')) return;

        document.getElementById('dash-fat').innerText = formataDin(faturamentoReal);
        document.getElementById('dash-rec').innerText = formataDin(aReceberReal);
        document.getElementById('dash-orc').innerText = orcamentos ? orcamentos.length.toString() : "0";
        document.getElementById('dash-inad').innerText = `${notasInadimplentes} Notas`;

        const tabela = document.getElementById('lista-recentes');
        
        if (!orcamentos || orcamentos.length === 0) {
            tabela.innerHTML = '<tr><td colspan="4" class="px-5 py-8 text-center text-slate-400 font-bold">Nenhum orçamento emitido ainda.</td></tr>';
        } else {
            tabela.innerHTML = orcamentos.map(orc => {
                let corBg = 'bg-slate-100 text-slate-600 border-slate-200';
                if (orc.status === 'Aprovado') corBg = 'bg-emerald-50 text-emerald-600 border-emerald-200';
                if (orc.status === 'Aguardando Peça') corBg = 'bg-amber-50 text-amber-600 border-amber-200';

                return `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-5 py-4">
                        <p class="font-bold text-slate-800">${orc.cliente_nome}</p>
                        <p class="text-[10px] text-slate-400 font-bold uppercase">Orç #${orc.id}</p>
                    </td>
                    <td class="px-5 py-4 font-bold text-slate-500 uppercase">${orc.veiculo_placa}</td>
                    <td class="px-5 py-4 font-black text-slate-800 text-right">${formataDin(orc.valor_total)}</td>
                    <td class="px-5 py-4 text-center">
                        <span class="border px-2.5 py-1 rounded-md text-[10px] font-bold ${corBg} shadow-sm">${orc.status}</span>
                    </td>
                </tr>`;
            }).join('');
        }

        renderizarGraficosDashboard();

    } catch (erro) {
        console.error("Erro Crítico de Conexão com o Supabase:", erro);
        if (document.getElementById('dash-fat')) {
            document.getElementById('dash-fat').innerText = "Erro";
            document.getElementById('lista-recentes').innerHTML = '<tr><td colspan="4" class="px-5 py-4 text-center text-red-500 font-bold">Falha ao ler o banco de dados.</td></tr>';
        }
    }
}

function renderizarGraficosDashboard() {
    Chart.defaults.font.family = 'Inter, sans-serif';
    Chart.defaults.color = '#94a3b8';

    const canvasFaturamento = document.getElementById('chartFaturamento');
    if(canvasFaturamento) {
        const ctxLinha = canvasFaturamento.getContext('2d');
        const gradient = ctxLinha.createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, 'rgba(37, 99, 235, 0.25)');
        gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');

        new Chart(ctxLinha, {
            type: 'line',
            data: {
                labels: ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'],
                datasets: [{
                    label: 'Faturamento',
                    data: [12000, 18000, 15000, 25000, 32000, 42000],
                    borderColor: '#2563eb', backgroundColor: gradient, borderWidth: 3, fill: true, tension: 0.4,
                    pointBackgroundColor: '#ffffff', pointBorderColor: '#2563eb', pointBorderWidth: 2, pointRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, border: { display: false } }, y: { border: { display: false }, grid: { color: '#f1f5f9' }, ticks: { maxTicksLimit: 5 } } } }
        });
    }

    const canvasFrota = document.getElementById('chartFrota');
    if(canvasFrota) {
        new Chart(canvasFrota, {
            type: 'doughnut',
            data: {
                labels: ['Prontos', 'Na Oficina'],
                datasets: [{ data: [75, 25], backgroundColor: ['#10b981', '#3b82f6'], borderWidth: 0, hoverOffset: 4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 20 } } } }
        });
    }
}
