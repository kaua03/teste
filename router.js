// ========================================================
// AutoManager - Roteador Master (SPA)
// ========================================================

async function navegarPara(tela) {
    const loader = document.getElementById('global-loader');
    
    // Liga a Tela de Carregamento imediatamente
    if(loader) {
        loader.classList.remove('hidden');
        loader.style.opacity = '1';
    }

    try {
        const usuarioLogadoStr = localStorage.getItem('usuarioLogado');
        const usuarioLogado = usuarioLogadoStr ? JSON.parse(usuarioLogadoStr) : null;
        
        if (!usuarioLogado && tela !== 'login') {
            tela = 'login'; 
        }

        // SALVA A TELA ATUAL NA MEMÓRIA (Se não for o login)
        if (tela !== 'login') {
            localStorage.setItem('lastRoute', tela);
        }

        const sidebar = document.getElementById('sidebar-desktop');
        const header = document.getElementById('header-top');
        const navMob = document.getElementById('nav-mobile');
        const mainWrap = document.getElementById('main-wrapper');

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
            
            // Injeta dados do usuário no Menu Superior
            if(usuarioLogado) {
                const avatar = document.getElementById('user-avatar');
                if(avatar) avatar.innerText = usuarioLogado.nome.charAt(0).toUpperCase();
                
                const dropName = document.getElementById('dropdown-user-name');
                const dropEmail = document.getElementById('dropdown-user-email');
                if(dropName) dropName.innerText = usuarioLogado.nome;
                if(dropEmail) dropEmail.innerText = usuarioLogado.email;
            }
        }

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

        const response = await fetch(tela + '.html');
        if (!response.ok) throw new Error(`Tela ${tela} não encontrada`);
        const html = await response.text();
        document.getElementById('visor-da-tv').innerHTML = html;

        // O AWAIT AQUI SEGURA O LOADING ATÉ O BANCO DE DADOS TERMINAR (Elimina as tabelas vazias)
        if (tela === 'dashboard' && typeof initDashboard === 'function') await initDashboard();
        if (tela === 'orcamentos' && typeof initOrcamentos === 'function') await initOrcamentos();
        if (tela === 'clientes' && typeof initClientes === 'function') await initClientes();
        if (tela === 'veiculos' && typeof initVeiculos === 'function') await initVeiculos();
        if (tela === 'contas_pagar' && typeof initContasPagar === 'function') await initContasPagar();
        if (tela === 'contas_receber' && typeof initContasReceber === 'function') await initContasReceber();

    } catch (erro) {
        console.error("Erro no Roteador:", erro);
        document.getElementById('visor-da-tv').innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-slate-400">
                <i class="ph-bold ph-warning-circle text-5xl mb-4 text-red-400"></i>
                <h2 class="text-xl font-bold text-slate-700">Erro 404</h2>
                <p>O módulo <b>${tela}</b> não pôde ser carregado.</p>
            </div>
        `;
    } finally {
        // Desliga a Tela de Carregamento suavemente ao final do processo
        if(loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.classList.add('hidden'), 300);
        }
    }
}
