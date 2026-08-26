// router.js

async function navegarPara(nomeDaTela) {
    const visor = document.getElementById('visor-da-tv');
    
    // Efeito de carregamento
    visor.innerHTML = '<div class="flex justify-center p-10"><div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>';
    
    try {
        // Busca o arquivo HTML da tela solicitada
        const resposta = await fetch(`${nomeDaTela}.html`);
        
        if (!resposta.ok) throw new Error("Tela não encontrada");
        
        const html = await resposta.text();
        visor.innerHTML = html;
        
        // ========================================================
        // O CÉREBRO DO ROTEADOR (A MÁGICA ACONTECE AQUI)
        // ========================================================
        if (nomeDaTela === 'dashboard' && typeof initDashboard === 'function') {
            initDashboard();
        } 
        else if (nomeDaTela === 'orcamentos' && typeof initOrcamentos === 'function') {
            initOrcamentos(); // <--- ERA ISSO QUE ESTAVA FALTANDO!
        }
        
        atualizarMenuAtivo(nomeDaTela);
        
    } catch (erro) {
        console.error("Erro ao carregar a tela:", erro);
        visor.innerHTML = `
            <div class="p-8 text-center bg-red-50 rounded-xl border border-red-100 m-6">
                <i class="ph-fill ph-warning-circle text-4xl text-red-500 mb-2"></i>
                <h3 class="text-lg font-bold text-red-700">Erro de Carregamento</h3>
                <p class="text-sm text-red-600 mt-2">Verifique se você está rodando no GitHub Pages.</p>
            </div>`;
    }
}

function atualizarMenuAtivo(tela) {
    document.querySelectorAll('.nav-btn, .nav-item-mob').forEach(btn => {
        if (btn.getAttribute('data-target') === tela) {
            btn.classList.add('text-blue-600', 'active');
            btn.classList.remove('text-slate-400');
        } else {
            btn.classList.remove('text-blue-600', 'active');
            btn.classList.add('text-slate-400');
        }
    });
}
