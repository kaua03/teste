// ========================================================
// AutoManager - Roteador Master (SPA)
// ========================================================

async function navegarPara(tela) {
    try {
        // 1. Atualiza o visual dos botões no Menu Desktop (Lateral)
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if(btn.dataset.target === tela) {
                btn.classList.add('bg-blue-600', 'text-white', 'shadow-md');
                btn.classList.remove('text-slate-400', 'hover:bg-slate-800');
            } else {
                btn.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
                btn.classList.add('text-slate-400', 'hover:bg-slate-800');
            }
        });

        // 2. Atualiza o visual dos botões no Menu Mobile (Inferior)
        document.querySelectorAll('.nav-item-mob').forEach(btn => {
            if(btn.dataset.target === tela) {
                btn.classList.add('text-blue-600');
                btn.classList.remove('text-slate-400', 'hover:text-slate-600');
            } else {
                btn.classList.remove('text-blue-600');
                btn.classList.add('text-slate-400', 'hover:text-slate-600');
            }
        });

        // 3. Busca o arquivo HTML correspondente
        const response = await fetch(tela + '.html');
        if (!response.ok) throw new Error(`Tela ${tela} não encontrada`);
        const html = await response.text();
        
        // 4. Injeta o HTML no meio da tela (Visor da TV)
        document.getElementById('visor-da-tv').innerHTML = html;

        // 5. A MÁGICA: Liga o motor do módulo que acabou de ser carregado
        if (tela === 'dashboard' && typeof initDashboard === 'function') initDashboard();
        if (tela === 'orcamentos' && typeof initOrcamentos === 'function') initOrcamentos();
        if (tela === 'clientes' && typeof initClientes === 'function') initClientes();
        if (tela === 'veiculos' && typeof initVeiculos === 'function') initVeiculos();

    } catch (erro) {
        console.error("Erro no Roteador:", erro);
        document.getElementById('visor-da-tv').innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-slate-400">
                <i class="ph-bold ph-warning-circle text-5xl mb-4 text-red-400"></i>
                <h2 class="text-xl font-bold text-slate-700">Erro 404</h2>
                <p>O módulo <b>${tela}</b> não pôde ser carregado.</p>
            </div>
        `;
    }
}
