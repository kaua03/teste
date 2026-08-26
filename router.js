// router.js
async function navegarPara(nomeDaTela) {
    const visor = document.getElementById('visor-da-tv');
    
    // Efeito de carregamento
    visor.innerHTML = '<div class="flex justify-center p-10"><div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>';
    
    try {
        // Busca o arquivo HTML na mesma pasta (Sem o 'pages/')
        const resposta = await fetch(`${nomeDaTela}.html`);
        
        if (!resposta.ok) throw new Error("Tela não encontrada");
        
        const html = await resposta.text();
        
        // Joga o HTML dentro do visor
        visor.innerHTML = html;
        
        // Executa o motor da tela específica
        if (nomeDaTela === 'dashboard' && typeof initDashboard === 'function') {
            initDashboard();
        }
        
        atualizarMenuAtivo(nomeDaTela);
        
    } catch (erro) {
        console.error("Erro ao carregar a tela:", erro);
        visor.innerHTML = `
            <div class="p-8 text-center bg-red-50 rounded-xl border border-red-100 m-6">
                <i class="ph-fill ph-warning-circle text-4xl text-red-500 mb-2"></i>
                <h3 class="text-lg font-bold text-red-700">O navegador bloqueou o carregamento!</h3>
                <p class="text-sm text-red-600 mt-2">Você abriu o arquivo direto do computador (file:///).<br>Para a arquitetura SPA funcionar localmente, você precisa usar a extensão <b>Live Server</b> do VS Code ou subir os arquivos para o <b>GitHub Pages</b>.</p>
            </div>`;
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
