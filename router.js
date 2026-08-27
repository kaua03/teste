// ========================================================
// AutoManager - Roteador Master (SPA)
// ========================================================

async function navegarPara(tela) {
    try {
        // SISTEMA DE SEGURANÇA (Verifica se está logado)
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        
        if (!usuarioLogado && tela !== 'login') {
            tela = 'login'; // Força ir pro login se tentar burlar
        }

        // CAMUFLAGEM DE MENUS SE FOR A TELA DE LOGIN
        if (tela === 'login') {
            document.getElementById('sidebar-desktop').classList.add('hidden');
            document.getElementById('header-top').classList.add('hidden');
            document.getElementById('nav-mobile').classList.add('hidden');
            document.getElementById('main-wrapper').classList.remove('md:ml-20');
        } else {
            document.getElementById('sidebar-desktop').classList.remove('hidden');
            document.getElementById('header-top').classList.remove('hidden');
            document.getElementById('nav-mobile').classList.remove('hidden');
            document.getElementById('main-wrapper').classList.add('md:ml-20');
            
            // Coloca a inicial do nome do usuario no icone
            const avatar = document.getElementById('user-avatar');
            if(avatar && usuarioLogado) avatar.innerText = usuarioLogado.nome.charAt(0).toUpperCase();
        }

        // Atualiza cores dos botões
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.dataset.target === tela) {
                btn.classList.add('bg-blue-600', 'text-white', 'shadow-md');
                btn.classList.remove('text-slate-400', 'hover:bg-slate-800');
            } else {
                btn.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
                btn.classList.add('text-slate-400', 'hover:bg-slate-800');
            }
        });

        document.querySelectorAll('.nav-item-mob').forEach(btn => {
            if (btn.dataset.target === tela) {
                btn.classList.add('text-blue-600');
                btn.classList.remove('text-slate-400', 'hover:text-slate-600');
            } else {
                btn.classList.remove('text-blue-600');
                btn.classList.add('text-slate-400', 'hover:text-slate-600');
            }
        });

        // Injeta a tela
        const response = await fetch(tela + '.html');
        if (!response.ok) throw new Error(`Tela ${tela} não encontrada`);
        const html = await response.text();
        document.getElementById('visor-da-tv').innerHTML = html;

        // Inicia motores
        if (tela === 'dashboard' && typeof initDashboard === 'function') initDashboard();
        if (tela === 'orcamentos' && typeof initOrcamentos === 'function') initOrcamentos();
        if (tela === 'clientes' && typeof initClientes === 'function') initClientes();
        if (tela === 'veiculos' && typeof initVeiculos === 'function') initVeiculos();
        if (tela === 'contas_pagar' && typeof initContasPagar === 'function') initContasPagar();
        if (tela === 'contas_receber' && typeof initContasReceber === 'function') initContasReceber();

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
