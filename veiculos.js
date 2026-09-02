// ========================================================
// MOTOR DO MODAL GENÉRICO (Forçado para sobrescrever cache)
// ========================================================
window.acaoConfirmacaoGlobal = null;

window.abrirModalConfirmacao = function(titulo, texto, callbackAcao, tipo = 'perigo') {
    // Título sempre texto puro por segurança
    document.getElementById('titulo-confirmacao').innerText = titulo;
    
    // A MÁGICA AQUI: innerHTML sem trava de segurança para interpretar o Negrito
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

// ========================================================
// AutoManager - Módulo de Veículos
// ========================================================

let veiculoEmEdicaoId = null;
let globalClientesCache = [];

async function initVeiculos() {
    console.log("🟢 Módulo Veículos Inicializado.");
    await carregarClientesParaSelect();
    buscarVeiculosSupabase();
}

function dispararAlertaVeiculo(msg, tipo = 'erro') {
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

// ---- MÁSCARA DE PLACA ----
function mascaraGeralVeiculo(tipo, campo) {
    let v = campo.value;
    if (tipo === 'placa') {
        v = v.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 7);
        if (v.length > 4 && /[0-9]/.test(v[4])) { 
            v = v.substring(0, 3) + '-' + v.substring(3); 
        }
        campo.value = v;
    }
}

async function carregarClientesParaSelect() {
    try {
        const { data: clientes } = await window.banco.from('clientes').select('nome').order('nome');
        globalClientesCache = clientes || [];
        const selectDono = document.getElementById('vei-dono');
        if (selectDono) {
            selectDono.innerHTML = '<option value="">Sem vínculo / Selecione o Proprietário...</option>';
            globalClientesCache.forEach(c => {
                selectDono.innerHTML += `<option value="${c.nome}">${c.nome}</option>`;
            });
        }
    } catch(e) {
        console.error("Erro ao carregar clientes para o select", e);
    }
}

function alternarSubTelaVeiculos(modo) {
    const viewLista = document.getElementById('view-lista-veiculos');
    const viewNovo = document.getElementById('view-form-veiculo');

    if (modo === 'novo') {
        veiculoEmEdicaoId = null; 
        document.getElementById('titulo-tela-veiculo').innerText = 'Novo Veículo';
        
        // Limpa formulário
        ['vei-placa', 'vei-modelo', 'vei-cor', 'vei-ano', 'vei-dono'].forEach(id => {
            document.getElementById(id).value = '';
        });
        
        viewLista.classList.add('hidden');
        viewNovo.classList.remove('hidden');
        document.getElementById('vei-placa').focus();
    } else {
        viewNovo.classList.add('hidden');
        viewLista.classList.remove('hidden');
        buscarVeiculosSupabase();
    }
}

// ---- SUPABASE CRUD ----
async function buscarVeiculosSupabase() {
    try {
        const { data: veiculos, error } = await window.banco.from('veiculos').select('*').order('placa', { ascending: true });
        if (error) throw error;
        renderizarTabelaVeiculos(veiculos);
    } catch (erro) {
        const tbody = document.getElementById('tabela-veiculos-real');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500 font-bold bg-red-50">Falha de conexão com o banco.</td></tr>`;
        }
    }
}

async function salvarVeiculoBD() {
    const placa = document.getElementById('vei-placa').value;
    const modelo = document.getElementById('vei-modelo').value;
    const cor = document.getElementById('vei-cor').value;
    const ano = document.getElementById('vei-ano').value;
    const dono = document.getElementById('vei-dono').value;

    if (!placa || !modelo) { dispararAlertaVeiculo("Placa e Modelo são obrigatórios."); return; }

    const btnSalvar = document.getElementById('btn-salvar-vei');
    btnSalvar.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-lg"></i> Salvando...';
    btnSalvar.disabled = true;

    try {
        const payload = { placa, modelo, cor, ano, dono_nome: dono };
        
        if (veiculoEmEdicaoId) {
            const { error } = await window.banco.from('veiculos').update(payload).eq('id', veiculoEmEdicaoId);
            if (error) throw error;
            dispararAlertaVeiculo("Veículo atualizado com sucesso!", "sucesso");
        } else {
            const { error } = await window.banco.from('veiculos').insert([payload]);
            if (error) throw error;
            dispararAlertaVeiculo("Veículo cadastrado com sucesso!", "sucesso");
        }
        alternarSubTelaVeiculos('lista');
    } catch (erro) {
        if(erro.code === '23505') dispararAlertaVeiculo("Esta placa já existe no banco de dados.");
        else dispararAlertaVeiculo("Falha ao salvar veículo.");
    } finally {
        btnSalvar.innerHTML = '<i class="ph-bold ph-floppy-disk text-lg"></i> Salvar Veículo';
        btnSalvar.disabled = false;
    }
}

function abrirEdicaoVeiculo(dadosCodificados) {
    const vei = JSON.parse(decodeURIComponent(dadosCodificados));
    veiculoEmEdicaoId = vei.id;
    
    document.getElementById('titulo-tela-veiculo').innerText = `Editar Veículo`;
    
    document.getElementById('vei-placa').value = vei.placa || '';
    document.getElementById('vei-modelo').value = vei.modelo || '';
    document.getElementById('vei-cor').value = vei.cor || '';
    document.getElementById('vei-ano').value = vei.ano || '';
    
    // Garante que o cliente existe no select antes de setar
    const selectDono = document.getElementById('vei-dono');
    if (vei.dono_nome && !Array.from(selectDono.options).some(opt => opt.value === vei.dono_nome)) {
        selectDono.innerHTML += `<option value="${vei.dono_nome}">${vei.dono_nome}</option>`;
    }
    selectDono.value = vei.dono_nome || '';

    document.getElementById('view-lista-veiculos').classList.add('hidden');
    document.getElementById('view-form-veiculo').classList.remove('hidden');
}

// ---- EXCLUSÃO INTEGRADA AO NOVO MODAL GENÉRICO ----
function abrirModalExclusaoVei(id, modeloPlaca) {
    window.abrirModalConfirmacao(
        "Excluir Veículo?",
        `Você está prestes a excluir o veículo <b class="text-slate-800">${modeloPlaca}</b>. Esta ação não pode ser desfeita.`,
        function() { executarExclusaoVeiculo(id); }, 
        "perigo"
    );
}

async function executarExclusaoVeiculo(id) {
    try {
        const { error } = await window.banco.from('veiculos').delete().eq('id', id);
        if (error) throw error;
        dispararAlertaVeiculo("Veículo apagado permanentemente.", "sucesso");
        buscarVeiculosSupabase();
    } catch (erro) {
        dispararAlertaVeiculo("Falha ao excluir o veículo.");
    }
}

// RENDERIZAÇÃO
function renderizarTabelaVeiculos(dados) {
    const tbody = document.getElementById('tabela-veiculos-real');
    
    // TRAVA DE SEGURANÇA
    if (!tbody) return;

    if (dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center"><i class="ph-fill ph-jeep text-4xl text-slate-300 mb-3"></i><p class="text-sm font-bold text-slate-500">Nenhum veículo cadastrado.</p></td></tr>`; 
        return;
    }
    
    // ... (resto do map igual ao seu código atual)
    tbody.innerHTML = dados.map(vei => {
        const dataStr = new Date(vei.data_criacao).toLocaleDateString('pt-BR');
        const veiJSON = encodeURIComponent(JSON.stringify(vei));
        
        const stringIdentificacao = `${vei.placa} - ${vei.modelo}`;

        return `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 md:p-5">
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">${dataStr}</p>
                <p class="font-black text-slate-800 text-xs md:text-sm">VEI #${String(vei.id).padStart(4,'0')}</p>
            </td>
            <td class="p-4 md:p-5">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg shrink-0"><i class="ph-bold ph-car-profile"></i></div>
                    <div>
                        <p class="font-bold text-slate-700 text-sm">${vei.modelo}</p>
                        <p class="text-[10px] text-blue-600 font-black uppercase tracking-wider mt-0.5">${vei.placa}</p>
                    </div>
                </div>
            </td>
            <td class="p-4 md:p-5">
                <p class="font-bold text-slate-700 text-sm">${vei.cor || '---'}</p>
                <p class="text-[10px] text-slate-500 font-medium mt-0.5">Ano: ${vei.ano || '---'}</p>
            </td>
            <td class="p-4 md:p-5">
                <p class="font-bold text-slate-600 text-xs md:text-sm"><i class="ph-fill ph-user text-slate-400 mr-1"></i> ${vei.dono_nome || 'Sem Vínculo'}</p>
            </td>
            <td class="p-4 md:p-5 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    <button onclick="abrirEdicaoVeiculo('${veiJSON}')" class="bg-white text-blue-500 hover:bg-blue-50 border border-slate-200 p-2 rounded-lg transition" title="Editar"><i class="ph-bold ph-pencil-simple text-lg"></i></button>
                    <button onclick="abrirModalExclusaoVei(${vei.id}, '${stringIdentificacao.replace(/'/g, "\\'")}')" class="bg-white text-slate-400 hover:text-red-500 border border-slate-200 p-2 rounded-lg transition" title="Excluir"><i class="ph-bold ph-trash text-lg"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}
