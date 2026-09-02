// ========================================================
// AutoManager - Roteador Master (SPA Ghost Render 2.0)
// ========================================================

// SUPERPODER 1: CACHE EM MEMÓRIA
// Guarda as telas já visitadas para nunca mais precisar fazer download delas.
const htmlCache = {}; 

async function navegarPara(tela) {
    const visor = document.getElementById('visor-da-tv');
    
    // 1. APAGA A LUZ IMEDIATAMENTE (Efeito Premium)
    if (visor) {
        visor.classList.remove('opacity-100', 'translate-y-0');
        visor.classList.add('opacity-0', 'translate-y-4'); // Joga a tela levemente para baixo no escuro
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

        // Layout Auth vs Sistema
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

        // Marcador visual do menu ativo
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

        // 2. BUSCA O HTML (NO CACHE OU NA REDE)
        if (!htmlCache[tela]) {
            const response = await fetch(tela + '.html');
            if (!response.ok) throw new Error(`Tela ${tela} não encontrada`);
            htmlCache[tela] = await response.text(); // Guarda na memória pra próxima vez
        }
        
        // Injeta a carcaça visual na tela
        visor.innerHTML = htmlCache[tela];

        // 3. ACENDE A LUZ ANTES DE CHAMAR O BANCO DE DADOS (Ghost Render)
        // O requestAnimationFrame garante que o navegador desenhou o HTML antes de animar a luz
        requestAnimationFrame(() => {
            visor.classList.remove('opacity-0', 'translate-y-4');
            visor.classList.add('opacity-100', 'translate-y-0');
        });

        // 4. CHAMA O BANCO DE DADOS EM SEGUNDO PLANO
        // REMOVEMOS O "await"! Agora a tela não congela esperando os dados. 
        // A UI carrega primeiro, e os dados "caem" nos spinners suavemente.
        if (tela === 'dashboard' && typeof initDashboard === 'function') initDashboard();
        if (tela === 'orcamentos' && typeof initOrcamentos === 'function') initOrcamentos();
        if (tela === 'clientes' && typeof initClientes === 'function') initClientes();
        if (tela === 'veiculos' && typeof initVeiculos === 'function') initVeiculos();
        if (tela === 'contas_pagar' && typeof initContasPagar === 'function') initContasPagar();
        if (tela === 'contas_receber' && typeof initContasReceber === 'function') initContasReceber();

    } catch (erro) {
        console.error("Erro no Roteador:", erro);
        visor.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-slate-400">
                <i class="ph-bold ph-warning-circle text-5xl mb-4 text-red-400"></i>
                <h2 class="text-xl font-bold text-slate-700">Erro 404</h2>
                <p>O módulo <b>${tela}</b> não pôde ser carregado.</p>
            </div>
        `;
        visor.classList.remove('opacity-0', 'translate-y-4');
        visor.classList.add('opacity-100', 'translate-y-0');
    }
}
