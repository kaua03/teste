// ========================================================
// AutoManager - Roteador Master (SPA Ghost Render)
// ========================================================

async function navegarPara(tela) {
    const visor = document.getElementById('visor-da-tv');
    
    // 1. APAGA A LUZ: Deixa o visor invisível imediatamente (sem Loader feio)
    if (visor) {
        visor.classList.remove('opacity-100');
        visor.classList.add('opacity-0');
    }

    try {
        const usuarioLogadoStr = localStorage.getItem('usuarioLogado');
        const usuarioLogado = usuarioLogadoStr ? JSON.parse(usuarioLogadoStr) : null;
        
        if (!usuarioLogado && tela !== 'login') {
            tela = 'login'; 
        }

        if (tela !== 'login') {
            localStorage.setItem('lastRoute', tela);
        }

        const sidebar = document.getElementById('sidebar-desktop');
        const header = document.getElementById('header-top');
        const navMob = document.getElementById('nav-mobile');
        const mainWrap = document.getElementById('main-wrapper');

        // Layout Auth
        if (tela === 'login') {
            if (sidebar) sidebar.style.display = 'none';
            if (header) header.style.display = 'none';
            if (navMob) navMob.style.display = 'none';
            if (mainWrap) mainWrap.classList.remove('md:ml-20');
        } else {
            if (sidebar) sidebar.style.display = '';
            if (header) header.style.display = '';
            if (navMob) navMob.style.display = '';
            if (mainWrap) mainWrap.classList.add('md:ml-20');
            
            if(usuarioLogado) {
                const avatar = document.getElementById('user-avatar');
                if(avatar) avatar.innerText = usuarioLogado.nome.charAt(0).toUpperCase();
                
                const dropName = document.getElementById('dropdown-user-name');
                const dropEmail = document.getElementById('dropdown-user-email');
                if(dropName) dropName.innerText = usuarioLogado.nome;
                if(dropEmail) dropEmail.innerText = usuarioLogado.email;
            }
        }

        // Estilo dos Botões
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

        // 2. BUSCA O HTML NO ESCURO
        const response = await fetch(tela + '.html');
        if (!response.ok) throw new Error(`Tela ${tela} não encontrada`);
        const html = await response.text();
        
        visor.innerHTML = html;

        // 3. SEGURA A EXECUÇÃO ATÉ O BANCO DE DADOS TERMINAR
        if (tela === 'dashboard' && typeof initDashboard === 'function') await initDashboard();
        if (tela === 'orcamentos' && typeof initOrcamentos === 'function') await initOrcamentos();
        if (tela === 'clientes' && typeof initClientes === 'function') await initClientes();
        if (tela === 'veiculos' && typeof initVeiculos === 'function') await initVeiculos();
        if (tela === 'contas_pagar' && typeof initContasPagar === 'function') await initContasPagar();
        if (tela === 'contas_receber' && typeof initContasReceber === 'function') await initContasReceber();

        // 4. ACENDE A LUZ: Tudo pronto, mostra a tela suavemente!
        setTimeout(() => {
            visor.classList.remove('opacity-0');
            visor.classList.add('opacity-100');
        }, 50);

    } catch (erro) {
        console.error("Erro no Roteador:", erro);
        visor.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-slate-400">
                <i class="ph-bold ph-warning-circle text-5xl mb-4 text-red-400"></i>
                <h2 class="text-xl font-bold text-slate-700">Erro 404</h2>
                <p>O módulo <b>${tela}</b> não pôde ser carregado.</p>
            </div>
        `;
        visor.classList.remove('opacity-0');
        visor.classList.add('opacity-100');
    }
}
