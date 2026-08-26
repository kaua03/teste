// js/router.js
async function navegarPara(nomeDaTela) {
    const visor = document.getElementById('visor-da-tv');
    
    // 1. Efeito visual de carregamento
    visor.innerHTML = '<div class="flex justify-center p-10"><div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>';
    
    try {
        // 2. Busca o arquivo HTML correspondente
        const resposta = await fetch(`pages/${nomeDaTela}.html`);
        
        if (!resposta.ok) throw new Error("Tela não encontrada");
        
        const html = await resposta.text();
        
        // 3. Joga o HTML dentro do visor
        visor.innerHTML = html;
        
        // 4. Executa a função de inicialização específica daquela tela
        if (nomeDaTela === 'dashboard' && typeof initDashboard === 'function') {
            initDashboard();
        }
        
        // 5. Atualiza o visual do menu (Menu Mobile e Desktop)
        atualizarMenuAtivo(nomeDaTela);
        
    } catch (erro) {
        console.error("Erro ao carregar a tela:", erro);
        visor.innerHTML = '<div class="p-8 text-center text-red-500 font-bold">Erro ao carregar o módulo.</div>';
    }
}

function atualizarMenuAtivo(tela) {
    document.querySelectorAll('.nav-btn, .nav-item-mob').forEach(btn => {
        if (btn.getAttribute('data-target') === tela) {
            btn.classList.add('bg-blue-600', 'text-white', 'active');
            btn.classList.remove('text-slate-400');
        } else {
            btn.classList.remove('bg-blue-600', 'text-white', 'active');
            btn.classList.add('text-slate-400');
        }
    });
}
