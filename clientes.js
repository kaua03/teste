// ========================================================
// MOTOR DO MODAL GENÉRICO (Global, Seguro e de Alta Performance)
// ========================================================
if (typeof window.abrirModalConfirmacao === 'undefined') {
    window.acaoConfirmacaoGlobal = null;

    window.abrirModalConfirmacao = function(titulo, texto, callbackAcao, tipo = 'perigo') {
        // Título sempre texto puro por segurança
        document.getElementById('titulo-confirmacao').innerText = titulo;
        
        // A MÁGICA AQUI: innerHTML para interpretar as tags HTML (como o <b> de negrito)
        document.getElementById('texto-confirmacao').innerHTML = texto; 
        
        const iconeBox = document.getElementById('icone-confirmacao');
        const btnConfirmar = document.getElementById('btn-confirmar-acao');

        if (tipo === 'perigo') {
            iconeBox.className = "w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100";
            iconeBox.innerHTML = '<i class="ph-bold ph-warning text-3xl text-red-500"></i>';
            btnConfirmar.className = "flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md flex items-center justify-center gap-2";
            btnConfirmar.innerHTML = '<i class="ph-bold ph-trash"></i> Excluir';
        } else {
            iconeBox.className = "w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100";
            iconeBox.innerHTML = '<i class="ph-bold ph-question text-3xl text-blue-500"></i>';
            btnConfirmar.className = "flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2";
            btnConfirmar.innerHTML = '<i class="ph-bold ph-check"></i> Confirmar';
        }

        window.acaoConfirmacaoGlobal = callbackAcao;
        document.getElementById('modal-confirmacao-generica').classList.remove('hidden');
    };

    window.fecharModalConfirmacao = function() {
        window.acaoConfirmacaoGlobal = null;
        document.getElementById('modal-confirmacao-generica').classList.add('hidden');
    };

    window.executarAcaoConfirmada = function() {
        if (typeof window.acaoConfirmacaoGlobal === 'function') {
            window.acaoConfirmacaoGlobal();
        }
        window.fecharModalConfirmacao();
    };
}

// ========================================================
// AutoManager - Módulo de Clientes
// ========================================================

let clienteEmEdicaoId = null;

function initClientes() {
    console.log("🟢 Módulo Clientes Inicializado.");
    buscarClientesSupabase();
}

function dispararAlertaCliente(msg, tipo = 'erro') {
    const corBg = tipo === 'erro' ? 'bg-red-500' : 'bg-emerald-500';
    const icone = tipo === 'erro' ? 'ph-warning-circle' : 'ph-check-circle';
    const alertaAntigo = document.getElementById('alerta-toast-flutuante');
    if (alertaAntigo) alertaAntigo.remove();
    
    const toast = document.createElement('div');
    toast.id = 'alerta-toast-flutuante';
    toast.className = `fixed top-20 right-4 md:right-8 z-[2000] ${corBg} text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 fade-in font-inter`;
    toast.innerHTML = `<i class="ph-bold ${icone} text-2xl"></i> <span class="font-bold text-sm">${msg}</span>`;
    
    document.body.appendChild(toast);
    setTimeout(() => { if (toast) toast.remove(); }, 4000);
}

function alternarSubTelaClientes(modo) {
    const viewLista = document.getElementById('view-lista-clientes');
    const viewNovo = document.getElementById('view-form-cliente');

    if (modo === 'novo') {
        clienteEmEdicaoId = null; 
        document.getElementById('titulo-tela-cliente').innerText = 'Novo Cliente';
        
        // Limpa formulário
        ['cli-nome', 'cli-doc', 'cli-tel', 'cli-email', 'cli-cep', 'cli-rua', 'cli-num', 'cli-bairro', 'cli-cidade'].forEach(id => {
            document.getElementById(id).value = '';
        });
        
        viewLista.classList.add('hidden');
        viewNovo.classList.remove('hidden');
        document.getElementById('cli-nome').focus();
    } else {
        viewNovo.classList.add('hidden');
        viewLista.classList.remove('hidden');
        buscarClientesSupabase();
    }
}

// ---- MÁSCARAS ESTABELECIDAS PARA PESSOA FÍSICA ----
function mascaraGeralCliente(tipo, campo) {
    let v = campo.value;
    if (tipo === 'cpf') {
        v = v.replace(/\D/g, "");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        campo.value = v;
    } else if (tipo === 'cep') {
        v = v.replace(/\D/g, ""); v = v.replace(/^(\d{5})(\d)/, "$1-$2"); campo.value = v;
    } else if (tipo === 'tel') {
        v = v.replace(/\D/g, ""); v = v.replace(/^(\d{2})(\d)/g, "($1) $2"); v = v.replace(/(\d)(\d{4})$/, "$1-$2"); campo.value = v;
    }
}

// ---- API VIA CEP ----
async function buscarCEPCliente(cepInput) {
    const cep = cepInput.replace(/\D/g, '');
    if (cep.length !== 8) return;

    const statusSpan = document.getElementById('cli-cep-status');
    if(statusSpan) {
        statusSpan.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Buscando...';
        statusSpan.className = 'text-[9px] text-blue-500 uppercase';
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await response.json();
        
        if (!dados.erro) {
            document.getElementById('cli-rua').value = dados.logradouro;
            document.getElementById('cli-bairro').value = dados.bairro;
            document.getElementById('cli-cidade').value = `${dados.localidade} / ${dados.uf}`;
            document.getElementById('cli-num').focus();
            
            if(statusSpan) {
                statusSpan.innerHTML = '<i class="ph-bold ph-check"></i> Encontrado';
                statusSpan.className = 'text-[9px] text-emerald-500 uppercase';
                setTimeout(() => statusSpan.classList.add('hidden'), 2500);
            }
        } else {
            dispararAlertaCliente("CEP não encontrado.");
            if(statusSpan) { statusSpan.innerHTML = '<i class="ph-bold ph-x"></i> Inválido'; statusSpan.className = 'text-[9px] text-red-500 uppercase'; }
        }
    } catch (e) { 
        dispararAlertaCliente("Falha ao buscar CEP.");
        if(statusSpan) statusSpan.classList.add('hidden');
    }
}

// ---- SUPABASE CRUD ----
async function buscarClientesSupabase() {
    try {
        const { data: clientes, error } = await window.banco.from('clientes').select('*').order('nome', { ascending: true });
        if (error) throw error;
        renderizarTabelaClientes(clientes);
    } catch (erro) {
        document.getElementById('tabela-clientes-real').innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500 font-bold bg-red-50">Falha de conexão com o banco.</td></tr>`;
    }
}

async function salvarClienteBD() {
    const nome = document.getElementById('cli-nome').value;
    const doc = document.getElementById('cli-doc').value;
    const tel = document.getElementById('cli-tel').value;
    const email = document.getElementById('cli-email').value;
    const cep = document.getElementById('cli-cep').value;
    const rua = document.getElementById('cli-rua').value;
    const num = document.getElementById('cli-num').value;
    const bairro = document.getElementById('cli-bairro').value;
    const cidade = document.getElementById('cli-cidade').value;

    if (!nome || !tel) { dispararAlertaCliente("Nome e Celular são obrigatórios."); return; }

    const btnSalvar = document.getElementById('btn-salvar-cli');
    btnSalvar.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-lg"></i> Salvando...';
    btnSalvar.disabled = true;

    try {
        const payload = { nome, documento: doc, telefone: tel, email, cep, endereco: rua, numero: num, bairro, cidade };
        
        if (clienteEmEdicaoId) {
            const { error } = await window.banco.from('clientes').update(payload).eq('id', clienteEmEdicaoId);
            if (error) throw error;
            dispararAlertaCliente("Cliente atualizado com sucesso!", "sucesso");
        } else {
            const { error } = await window.banco.from('clientes').insert([payload]);
            if (error) throw error;
            dispararAlertaCliente("Cliente cadastrado com sucesso!", "sucesso");
        }
        alternarSubTelaClientes('lista');
    } catch (erro) {
        dispararAlertaCliente("Falha ao salvar cliente.");
    } finally {
        btnSalvar.innerHTML = '<i class="ph-bold ph-floppy-disk text-lg"></i> Salvar Cliente';
        btnSalvar.disabled = false;
    }
}

function abrirEdicaoCliente(dadosCodificados) {
    const cli = JSON.parse(decodeURIComponent(dadosCodificados));
    clienteEmEdicaoId = cli.id;
    
    document.getElementById('titulo-tela-cliente').innerText = `Editar Cliente`;
    
    document.getElementById('cli-nome').value = cli.nome || '';
    document.getElementById('cli-doc').value = cli.documento || '';
    document.getElementById('cli-tel').value = cli.telefone || '';
    document.getElementById('cli-email').value = cli.email || '';
    document.getElementById('cli-cep').value = cli.cep || '';
    document.getElementById('cli-rua').value = cli.endereco || '';
    document.getElementById('cli-num').value = cli.numero || '';
    document.getElementById('cli-bairro').value = cli.bairro || '';
    document.getElementById('cli-cidade').value = cli.cidade || '';

    document.getElementById('view-lista-clientes').classList.add('hidden');
    document.getElementById('view-form-cliente').classList.remove('hidden');
}

// ---- EXCLUSÃO INTEGRADA AO NOVO MODAL GENÉRICO ----
function abrirModalExclusaoCli(id, nome) {
    window.abrirModalConfirmacao(
        "Excluir Cliente?",
        `Você está prestes a excluir <b class="text-slate-800">${nome}</b>. Esta ação não pode ser desfeita.`,
        function() { executarExclusaoCliente(id); }, 
        "perigo"
    );
}

async function executarExclusaoCliente(id) {
    try {
        const { error } = await window.banco.from('clientes').delete().eq('id', id);
        if (error) throw error;
        dispararAlertaCliente("Cliente apagado permanentemente.", "sucesso");
        buscarClientesSupabase();
    } catch (erro) {
        dispararAlertaCliente("Falha ao excluir o cliente.");
    }
}

// RENDERIZAÇÃO
function renderizarTabelaClientes(dados) {
    const tbody = document.getElementById('tabela-clientes-real');
    if (dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center"><i class="ph-fill ph-users text-4xl text-slate-300 mb-3"></i><p class="text-sm font-bold text-slate-500">Nenhum cliente cadastrado.</p></td></tr>`; return;
    }
    
    tbody.innerHTML = dados.map(cli => {
        const dataStr = new Date(cli.data_criacao).toLocaleDateString('pt-BR');
        const cliJSON = encodeURIComponent(JSON.stringify(cli));
        
        const partesNome = cli.nome.split(' ');
        let sigla = partesNome[0].charAt(0).toUpperCase();
        if(partesNome.length > 1) sigla += partesNome[partesNome.length - 1].charAt(0).toUpperCase();

        return `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 md:p-5">
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">${dataStr}</p>
                <p class="font-black text-slate-800 text-xs md:text-sm">CLI #${String(cli.id).padStart(4,'0')}</p>
            </td>
            <td class="p-4 md:p-5">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-black flex items-center justify-center text-xs shrink-0">${sigla}</div>
                    <div>
                        <p class="font-bold text-slate-700 text-sm">${cli.nome}</p>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">${cli.documento || 'Sem Documento'}</p>
                    </div>
                </div>
            </td>
            <td class="p-4 md:p-5">
                <p class="font-bold text-slate-700 text-sm">${cli.telefone}</p>
                <p class="text-[10px] text-slate-500 font-medium mt-0.5">${cli.email || 'Sem e-mail'}</p>
            </td>
            <td class="p-4 md:p-5">
                <p class="font-bold text-slate-600 text-xs md:text-sm">${cli.cidade || 'Não informada'}</p>
            </td>
            <td class="p-4 md:p-5 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    <button onclick="abrirEdicaoCliente('${cliJSON}')" class="bg-white text-blue-500 hover:bg-blue-50 border border-slate-200 p-2 rounded-lg transition" title="Editar"><i class="ph-bold ph-pencil-simple text-lg"></i></button>
                    <button onclick="abrirModalExclusaoCli(${cli.id}, '${cli.nome.replace(/'/g, "\\'")}')" class="bg-white text-slate-400 hover:text-red-500 border border-slate-200 p-2 rounded-lg transition" title="Excluir"><i class="ph-bold ph-trash text-lg"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}
