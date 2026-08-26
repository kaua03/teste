// ========================================================
// AutoManager - Módulo de Veículos
// ========================================================

let veiculoEmEdicaoId = null;
let idVeiculoParaExcluir = null;

async function initVeiculos() {
    console.log("🟢 Módulo Veículos Inicializado.");
    await carregarClientesParaVeiculos();
    buscarVeiculosSupabase();
}

/** PUXA OS CLIENTES PARA O DROPDOWN DE DONO **/
async function carregarClientesParaVeiculos() {
    const { data: cli } = await window.banco.from('clientes').select('nome').order('nome');
    const selectDono = document.getElementById('vei-dono');
    
    if(selectDono) {
        selectDono.innerHTML = '<option value="">Sem vínculo / Selecione o Proprietário...</option>';
        if(cli) {
            cli.forEach(c => {
                selectDono.innerHTML += `<option value="${c.nome}">${c.nome}</option>`;
            });
        }
    }
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

function alternarSubTelaVeiculos(modo) {
    const viewLista = document.getElementById('view-lista-veiculos');
    const viewNovo = document.getElementById('view-form-veiculo');

    if (modo === 'novo') {
        veiculoEmEdicaoId = null; 
        document.getElementById('titulo-tela-veiculo').innerText = 'Novo Veículo';
        
        ['vei-placa', 'vei-modelo', 'vei-cor', 'vei-ano', 'vei-dono'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = '';
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

function mascaraPlacaVeiculo(campo) {
    let v = campo.value.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 7);
    if (v.length > 4) {
        if (/[0-9]/.test(v[4])) { // Se o 5º caractere for número, é placa antiga
            v = v.substring(0, 3) + '-' + v.substring(3);
        }
    }
    campo.value = v;
}

async function buscarVeiculosSupabase() {
    try {
        const { data: veiculos, error } = await window.banco.from('veiculos').select('*').order('id', { ascending: false });
        if (error) throw error;
        renderizarTabelaVeiculos(veiculos);
    } catch (erro) {
        document.getElementById('tabela-veiculos-real').innerHTML = `<tr><td colspan="4" class="p-8 text-center text-red-500 font-bold bg-red-50">Falha de conexão com o banco.</td></tr>`;
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
        if(erro.code === '23505') { 
            dispararAlertaVeiculo("Esta placa já está cadastrada no sistema.");
        } else {
            dispararAlertaVeiculo("Falha ao salvar veículo.");
        }
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
    
    const selDono = document.getElementById('vei-dono');
    if(selDono) selDono.value = vei.dono_nome || '';

    document.getElementById('view-lista-veiculos').classList.add('hidden');
    document.getElementById('view-form-veiculo').classList.remove('hidden');
}

// EXCLUSÃO
function abrirModalExclusaoVei(id, placa) {
    idVeiculoParaExcluir = id;
    document.getElementById('exc-vei-placa').innerText = placa;
    document.getElementById('modal-exclusao-veiculo').classList.remove('hidden');
}

function fecharModalExclusaoVei() {
    idVeiculoParaExcluir = null;
    document.getElementById('modal-exclusao-veiculo').classList.add('hidden');
}

async function confirmarExclusaoVei() {
    if(!idVeiculoParaExcluir) return;
    try {
        const { error } = await window.banco.from('veiculos').delete().eq('id', idVeiculoParaExcluir);
        if (error) throw error;
        dispararAlertaVeiculo("Veículo apagado permanentemente.", "sucesso");
        fecharModalExclusaoVei();
        buscarVeiculosSupabase();
    } catch (erro) {
        dispararAlertaVeiculo("Falha ao excluir o veículo.");
    }
}

// RENDERIZAÇÃO
function renderizarTabelaVeiculos(dados) {
    const tbody = document.getElementById('tabela-veiculos-real');
    if (dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-10 text-center"><i class="ph-fill ph-car text-4xl text-slate-300 mb-3"></i><p class="text-sm font-bold text-slate-500">Nenhum veículo cadastrado.</p></td></tr>`; return;
    }
    
    tbody.innerHTML = dados.map(vei => {
        const veiJSON = encodeURIComponent(JSON.stringify(vei));
        
        // Emblema do Dono
        const badgeDono = vei.dono_nome 
            ? `<span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm uppercase"><i class="ph-bold ph-user mr-1"></i>${vei.dono_nome}</span>` 
            : `<span class="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Sem vínculo</span>`;

        return `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 md:p-5">
                <div class="inline-block bg-white border-2 border-slate-800 rounded px-2 py-0.5 shadow-sm text-center">
                    <span class="text-[10px] text-blue-700 font-black tracking-widest block leading-none pt-0.5 uppercase">Brasil</span>
                    <span class="font-black text-slate-800 text-sm tracking-widest uppercase">${vei.placa}</span>
                </div>
            </td>
            <td class="p-4 md:p-5">${badgeDono}</td>
            <td class="p-4 md:p-5">
                <p class="font-bold text-slate-700 text-sm">${vei.modelo}</p>
                <p class="font-bold text-slate-500 text-[10px] uppercase tracking-wider mt-0.5">${vei.cor || '--'} / ${vei.ano || '--'}</p>
            </td>
            <td class="p-4 md:p-5 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    <button onclick="abrirEdicaoVeiculo('${veiJSON}')" class="bg-white text-blue-500 hover:bg-blue-50 border border-slate-200 p-2 rounded-lg transition" title="Editar"><i class="ph-bold ph-pencil-simple text-lg"></i></button>
                    <button onclick="abrirModalExclusaoVei(${vei.id}, '${vei.placa}')" class="bg-white text-slate-400 hover:text-red-500 border border-slate-200 p-2 rounded-lg transition" title="Excluir"><i class="ph-bold ph-trash text-lg"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}
