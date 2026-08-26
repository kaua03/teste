// ========================================================
// AutoManager - Módulo de Orçamentos e O.S.
// ========================================================

let itensTemporarios = [];
let valoresFinais = { pecas: 0, servicos: 0, desconto: 0, total: 0 };
let modalTipoAberto = '';
let imagensUploadArray = []; 
let osEmEdicaoId = null; 
let idParaExcluir = null;

function initOrcamentos() {
    console.log("🟢 Módulo Orçamentos Inicializado.");
    buscarOrcamentosSupabase();
}

/**
 * SISTEMA DE ALERTAS (TOAST FLUTUANTE)
 */
function dispararAlerta(msg, tipo = 'erro') {
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

function alternarSubTelaOrcamento(modo) {
    const viewLista = document.getElementById('view-lista-orcamentos');
    const viewNovo = document.getElementById('view-novo-orcamento');

    if (modo === 'novo') {
        osEmEdicaoId = null; 
        document.getElementById('titulo-tela-os').innerText = 'Emissão de O.S.';
        
        document.getElementById('db-cliente-nome').value = '';
        document.getElementById('db-veiculo-placa').value = '';
        document.getElementById('db-status').value = 'Em Aberto';
        document.getElementById('desc-val').value = '';
        document.getElementById('db-obs').value = '';
        
        itensTemporarios = [];
        imagensUploadArray = [];
        const preview = document.getElementById('preview-anexos');
        if (preview) { preview.innerHTML = ''; preview.classList.add('hidden'); }
        
        calcularTotais();
        viewLista.classList.add('hidden');
        viewNovo.classList.remove('hidden');
    } else {
        viewNovo.classList.add('hidden');
        viewLista.classList.remove('hidden');
        buscarOrcamentosSupabase();
    }
}

/**
 * MÁSCARAS DE DADOS REGEX
 */
const formataDinheiro = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function mascaraMoeda(campo) {
    let valor = campo.value.replace(/\D/g, ''); 
    if (valor === '') { campo.value = ''; return; }
    valor = (parseInt(valor, 10) / 100).toFixed(2);
    campo.value = valor.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
}

function reverterMoeda(texto) {
    if(!texto) return 0;
    return parseFloat(texto.replace(/\./g, '').replace(',', '.'));
}

function mascaraGeral(tipo, campo) {
    let v = campo.value;
    if (tipo === 'cpf') {
        v = v.replace(/\D/g, ""); v = v.replace(/(\d{3})(\d)/, "$1.$2"); v = v.replace(/(\d{3})(\d)/, "$1.$2"); v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2"); campo.value = v;
    } else if (tipo === 'cep') {
        v = v.replace(/\D/g, ""); v = v.replace(/^(\d{5})(\d)/, "$1-$2"); campo.value = v;
    } else if (tipo === 'tel') {
        v = v.replace(/\D/g, ""); v = v.replace(/^(\d{2})(\d)/g, "($1) $2"); v = v.replace(/(\d)(\d{4})$/, "$1-$2"); campo.value = v;
    } else if (tipo === 'placa') {
        v = v.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 7);
        if (v.length > 4 && /[0-9]/.test(v[4])) { v = v.substring(0, 3) + '-' + v.substring(3); }
        campo.value = v;
    }
}

/**
 * LÓGICA DE ITENS E DESCONTOS
 */
function adicionarOuEditarItem() {
    const tipo = document.getElementById('item-tipo').value;
    const nome = document.getElementById('item-nome').value;
    const desc = document.getElementById('item-desc').value;
    const qtd = parseFloat(document.getElementById('item-qtd').value);
    const valString = document.getElementById('item-val').value;
    const idEdit = document.getElementById('item-id-edit').value;

    if(!nome) { dispararAlerta("O nome do Item (Peça/Serviço) é obrigatório."); return; }
    if(!qtd || qtd <= 0) { dispararAlerta("A quantidade deve ser maior que zero."); return; }
    
    const valFloat = reverterMoeda(valString);
    if(valFloat <= 0) { dispararAlerta("O valor unitário não pode ser vazio ou zero."); return; }

    const sub = qtd * valFloat;

    if (idEdit) {
        const index = itensTemporarios.findIndex(i => i.id_temp == idEdit);
        if (index > -1) {
            itensTemporarios[index] = { id_temp: idEdit, tipo, descricao: nome, detalhe: desc, quantidade: qtd, valor_unitario: valFloat, subtotal: sub };
        }
        document.getElementById('item-id-edit').value = '';
        document.getElementById('btn-add-item').innerHTML = '<i class="ph-bold ph-plus mr-1"></i> Add Item';
        document.getElementById('btn-add-item').classList.replace('bg-emerald-600', 'bg-slate-900');
    } else {
        itensTemporarios.push({ id_temp: Date.now(), tipo, descricao: nome, detalhe: desc, quantidade: qtd, valor_unitario: valFloat, subtotal: sub });
    }

    document.getElementById('item-nome').value = ''; document.getElementById('item-desc').value = ''; document.getElementById('item-val').value = ''; document.getElementById('item-qtd').value = '1'; document.getElementById('item-nome').focus();
    calcularTotais();
}

function removerItemDB(id) {
    itensTemporarios = itensTemporarios.filter(i => i.id_temp !== id);
    calcularTotais();
}

function editarItem(id) {
    const item = itensTemporarios.find(i => i.id_temp === id);
    if (!item) return;

    document.getElementById('item-tipo').value = item.tipo;
    document.getElementById('item-nome').value = item.descricao;
    document.getElementById('item-desc').value = item.detalhe || '';
    document.getElementById('item-qtd').value = item.quantidade;
    
    const inputVal = document.getElementById('item-val');
    inputVal.value = (item.valor_unitario * 100).toString(); 
    mascaraMoeda(inputVal);

    document.getElementById('item-id-edit').value = item.id_temp;
    
    const btn = document.getElementById('btn-add-item');
    btn.innerHTML = '<i class="ph-bold ph-check mr-1"></i> Salvar Edição';
    btn.classList.replace('bg-slate-900', 'bg-emerald-600');
}

function calcularTotais() {
    let sumPecas = 0; let sumServicos = 0;
    itensTemporarios.forEach(item => {
        if (item.tipo === 'Peça') sumPecas += item.subtotal;
        else sumServicos += item.subtotal;
    });

    let totalBruto = sumPecas + sumServicos;
    let descValor = 0;
    const descTipo = document.getElementById('desc-tipo').value; 
    const descAlvo = document.getElementById('desc-alvo').value; 
    let descFator = parseFloat(document.getElementById('desc-val').value.replace(',', '.')) || 0;

    if (descFator > 0) {
        let baseDeCalculo = 0;
        if (descAlvo === 'total') baseDeCalculo = totalBruto;
        else if (descAlvo === 'pecas') baseDeCalculo = sumPecas;
        else if (descAlvo === 'servicos') baseDeCalculo = sumServicos;

        descValor = descTipo === 'perc' ? baseDeCalculo * (descFator / 100) : (descFator > baseDeCalculo ? baseDeCalculo : descFator); 
    }

    valoresFinais.pecas = sumPecas;
    valoresFinais.servicos = sumServicos;
    valoresFinais.desconto = descValor;
    valoresFinais.total = totalBruto - descValor;

    atualizarInterfaceItensETotais();
}

function atualizarInterfaceItensETotais() {
    const divLista = document.getElementById('lista-itens-db');
    if (itensTemporarios.length === 0) {
        divLista.innerHTML = `<div class="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200"><i class="ph-fill ph-package text-3xl text-slate-300 mb-2"></i><p class="text-[10px] md:text-xs text-slate-400 uppercase font-bold tracking-wider">Nenhum item adicionado à O.S.</p></div>`;
    } else {
        divLista.innerHTML = itensTemporarios.map(item => {
            let badgeClass = item.tipo === 'Peça' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200';
            let HTMLdetalhe = item.detalhe ? `<p class="text-xs text-slate-500 mt-1 italic pl-1"><i class="ph-fill ph-info text-blue-400 mr-1"></i>${item.detalhe}</p>` : '';

            return `
            <div class="bg-white p-3 md:p-4 rounded-xl border border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 shadow-sm hover:border-blue-200 transition-colors">
                <div class="flex-1">
                    <div class="flex items-center"><span class="border ${badgeClass} px-2 py-0.5 rounded text-[10px] font-black uppercase mr-2 shadow-sm">${item.tipo}</span><span class="font-bold text-slate-800 text-sm">${item.quantidade}x ${item.descricao}</span> <span class="text-xs text-slate-400 ml-1">(${formataDinheiro(item.valor_unitario)})</span></div>
                    ${HTMLdetalhe}
                </div>
                <div class="flex items-center gap-3 w-full lg:w-auto justify-between border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
                    <span class="font-black text-slate-900 text-sm md:text-base">${formataDinheiro(item.subtotal)}</span>
                    <div class="flex gap-1">
                        <button onclick="editarItem(${item.id_temp})" class="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition" title="Editar"><i class="ph-bold ph-pencil-simple text-lg"></i></button>
                        <button onclick="removerItemDB(${item.id_temp})" class="text-red-400 hover:bg-red-50 p-2 rounded-lg transition" title="Excluir"><i class="ph-bold ph-trash text-lg"></i></button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    document.getElementById('resumo-pecas').innerText = formataDinheiro(valoresFinais.pecas);
    document.getElementById('resumo-servicos').innerText = formataDinheiro(valoresFinais.servicos);
    document.getElementById('resumo-desc').innerText = `- ${formataDinheiro(valoresFinais.desconto)}`;
    document.getElementById('db-total').innerText = formataDinheiro(valoresFinais.total);
}

/** UPLOAD DE FOTOS (Mantém no sistema, não vai pro PDF) */
function processarImagens(event) {
    const files = event.target.files;
    if(files.length > 0) document.getElementById('preview-anexos').classList.remove('hidden');

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagensUploadArray.push(e.target.result);
            renderizarPreviewFotos();
        };
        reader.readAsDataURL(file);
    });
}

function renderizarPreviewFotos() {
    const previewContainer = document.getElementById('preview-anexos');
    previewContainer.innerHTML = '';
    if(imagensUploadArray.length === 0) { previewContainer.classList.add('hidden'); return; }
    
    imagensUploadArray.forEach(base64Str => {
        const imgBox = document.createElement('div');
        imgBox.className = "w-20 h-20 rounded-xl overflow-hidden shadow-sm border border-slate-200 relative group";
        imgBox.innerHTML = `<img src="${base64Str}" class="w-full h-full object-cover"><div class="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all cursor-pointer" onclick="removerImagemArray('${base64Str}')"><i class="ph-bold ph-trash text-white text-xl"></i></div>`;
        previewContainer.appendChild(imgBox);
    });
}

function removerImagemArray(strToRem) {
    imagensUploadArray = imagensUploadArray.filter(i => i !== strToRem);
    renderizarPreviewFotos();
}


/**
 * ========================================================
 * SUPABASE CRUD E MODAL DE EXCLUSÃO
 * ========================================================
 */
async function buscarOrcamentosSupabase() {
    try {
        const { data: orcamentos, error } = await window.banco.from('orcamentos').select('*').order('id', { ascending: false });
        if (error) throw error;
        renderizarTabelaReal(orcamentos);
    } catch (erro) {
        document.getElementById('tabela-orcamentos-real').innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500 font-bold bg-red-50">Falha de conexão.</td></tr>`;
    }
}

async function salvarOrcamentoReal() {
    const nome = document.getElementById('db-cliente-nome').value;
    const placa = document.getElementById('db-veiculo-placa').value;
    const status = document.getElementById('db-status').value;
    const obs = document.getElementById('db-obs').value;

    if (!nome || !placa) { dispararAlerta("Cliente e Placa são obrigatórios."); return; }
    if (itensTemporarios.length === 0) { dispararAlerta("A O.S precisa de peças ou serviços."); return; }

    const btnSalvar = document.getElementById('btn-salvar-db');
    btnSalvar.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-xl"></i> SALVANDO...';
    btnSalvar.disabled = true;

    try {
        const payloadJSONB = { lista_itens: itensTemporarios, resumo: valoresFinais };
        
        if (osEmEdicaoId) {
            const { error } = await window.banco.from('orcamentos').update({
                cliente_nome: nome, veiculo_placa: placa, valor_total: valoresFinais.total, status: status, observacao: obs, anexos: imagensUploadArray, itens: payloadJSONB
            }).eq('id', osEmEdicaoId);
            if (error) throw error;
            dispararAlerta("O.S atualizada com sucesso!", "sucesso");
        } else {
            const { error } = await window.banco.from('orcamentos').insert([{
                cliente_nome: nome, veiculo_placa: placa, valor_total: valoresFinais.total, status: status, observacao: obs, anexos: imagensUploadArray, itens: payloadJSONB
            }]);
            if (error) throw error;
            dispararAlerta("O.S gerada com sucesso!", "sucesso");
        }
        alternarSubTelaOrcamento('lista');
    } catch (erro) {
        dispararAlerta("Falha de comunicação com o servidor.");
    } finally {
        btnSalvar.innerHTML = '<i class="ph-bold ph-floppy-disk text-xl"></i> SALVAR O.S.';
        btnSalvar.disabled = false;
    }
}

function abrirEdicaoOS(dadosCodificados) {
    const orc = JSON.parse(decodeURIComponent(dadosCodificados));
    osEmEdicaoId = orc.id;
    
    document.getElementById('titulo-tela-os').innerText = `Edição da O.S. #${orc.numero_os}`;
    
    const selectCliente = document.getElementById('db-cliente-nome');
    if (!Array.from(selectCliente.options).some(opt => opt.value === orc.cliente_nome)) { selectCliente.innerHTML += `<option value="${orc.cliente_nome}">${orc.cliente_nome}</option>`; }
    selectCliente.value = orc.cliente_nome;

    const selectVeiculo = document.getElementById('db-veiculo-placa');
    if (!Array.from(selectVeiculo.options).some(opt => opt.value === orc.veiculo_placa)) { selectVeiculo.innerHTML += `<option value="${orc.veiculo_placa}">${orc.veiculo_placa}</option>`; }
    selectVeiculo.value = orc.veiculo_placa;

    document.getElementById('db-status').value = orc.status;
    document.getElementById('db-obs').value = orc.observacao || '';

    itensTemporarios = orc.itens?.lista_itens || [];
    imagensUploadArray = orc.anexos || [];
    if(imagensUploadArray.length > 0) { document.getElementById('preview-anexos').classList.remove('hidden'); renderizarPreviewFotos(); }

    const descValor = orc.itens?.resumo?.desconto || 0;
    if (descValor > 0) {
        document.getElementById('desc-tipo').value = 'val';
        const descInput = document.getElementById('desc-val');
        descInput.value = (descValor * 100).toString(); 
        mascaraMoeda(descInput);
    } else { document.getElementById('desc-val').value = ''; }

    calcularTotais();
    document.getElementById('view-lista-orcamentos').classList.add('hidden');
    document.getElementById('view-novo-orcamento').classList.remove('hidden');
}

// LÓGICA DO MODAL DE EXCLUSÃO
function abrirModalExclusao(id, numero_os) {
    idParaExcluir = id;
    const spanNum = document.getElementById('exc-os-num');
    if (spanNum) spanNum.innerText = `#${numero_os}`;
    document.getElementById('modal-confirmacao-exclusao').classList.remove('hidden');
}

function fecharModalExclusao() {
    idParaExcluir = null;
    document.getElementById('modal-confirmacao-exclusao').classList.add('hidden');
}

async function confirmarExclusao() {
    if(!idParaExcluir) return;
    try {
        const { error } = await window.banco.from('orcamentos').delete().eq('id', idParaExcluir);
        if (error) throw error;
        dispararAlerta("Ordem de serviço apagada com sucesso.", "sucesso");
        fecharModalExclusao();
        buscarOrcamentosSupabase();
    } catch (erro) {
        dispararAlerta("Falha ao excluir a O.S no banco de dados.");
    }
}

function obterCorStatus(status) {
    const cores = { 'Em Aberto': 'bg-slate-100 text-slate-700', 'Aguardando Aprovação': 'bg-yellow-50 text-yellow-700', 'Aguardando Peça': 'bg-orange-50 text-orange-700', 'Aguardando Pagamento': 'bg-amber-50 text-amber-700', 'Aprovado': 'bg-blue-50 text-blue-700', 'Em Execução': 'bg-indigo-50 text-indigo-700', 'Finalizado': 'bg-emerald-50 text-emerald-700', 'Não Usar': 'bg-red-50 text-red-700' };
    return cores[status] || 'bg-slate-50 text-slate-500';
}

function renderizarTabelaReal(dados) {
    const tbody = document.getElementById('tabela-orcamentos-real');
    if (dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center"><i class="ph-fill ph-receipt text-4xl text-slate-300 mb-3"></i><p class="text-sm font-bold text-slate-500">Nenhuma O.S registrada.</p></td></tr>`; return;
    }
    tbody.innerHTML = dados.map(orc => {
        const dataStr = new Date(orc.data_criacao).toLocaleDateString('pt-BR');
        const corBg = obterCorStatus(orc.status);
        const orcJSON = encodeURIComponent(JSON.stringify(orc));

        return `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 md:p-5"><p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">${dataStr}</p><p class="font-black text-slate-800 text-sm">O.S #${orc.numero_os}</p></td>
            <td class="p-4 md:p-5"><p class="font-bold text-slate-700 text-sm">${orc.cliente_nome}</p><p class="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">${orc.veiculo_placa}</p></td>
            <td class="p-4 md:p-5 font-black text-slate-800 text-right text-sm">${formataDinheiro(orc.valor_total)}</td>
            <td class="p-4 md:p-5 text-center"><span class="${corBg} border px-2 py-1.5 rounded-lg text-[10px] font-bold shadow-sm whitespace-nowrap">${orc.status}</span></td>
            <td class="p-4 md:p-5 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    <button onclick="abrirEdicaoOS('${orcJSON}')" class="bg-white text-blue-500 hover:bg-blue-50 border border-slate-200 p-2 rounded-lg transition" title="Editar"><i class="ph-bold ph-pencil-simple text-lg"></i></button>
                    <button onclick="abrirModalExclusao(${orc.id}, '${orc.numero_os}')" class="bg-white text-slate-400 hover:text-red-500 border border-slate-200 p-2 rounded-lg transition" title="Excluir"><i class="ph-bold ph-trash text-lg"></i></button>
                    <button onclick="gerarPDFSupabase('${orcJSON}')" class="bg-slate-800 text-white hover:bg-slate-900 border border-slate-800 p-2 rounded-lg transition" title="Abrir PDF"><i class="ph-bold ph-file-pdf text-lg"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

/** CADASTRO RAPIDO VIA CEP */
function abrirModalCadastro(tipo) {
    modalTipoAberto = tipo;
    document.getElementById('visor-da-tv').classList.add('overflow-y-hidden'); document.getElementById('visor-da-tv').classList.remove('overflow-y-auto');
    const modal = document.getElementById('modal-cadastro-rapido'); const titulo = document.getElementById('modal-titulo'); const conteudo = document.getElementById('modal-conteudo');
    if (tipo === 'cliente') {
        titulo.innerHTML = '<i class="ph-bold ph-user-plus mr-2"></i>Cadastrar Novo Cliente';
        conteudo.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-3"><div class="md:col-span-2"><label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome Completo</label><input type="text" id="cad-nome" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-bold text-slate-800"></div><div><label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">CPF</label><input type="text" id="cad-doc" onkeyup="mascaraGeral('cpf', this)" maxlength="14" placeholder="000.000.000-00" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium text-slate-800"></div><div><label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Celular / WhatsApp</label><input type="text" id="cad-tel" onkeyup="mascaraGeral('tel', this)" maxlength="15" placeholder="(00) 00000-0000" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium"></div><div class="md:col-span-2"><label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">E-mail</label><input type="email" id="cad-email" placeholder="cliente@email.com" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium"></div><div class="md:col-span-2 border-t border-slate-100 pt-3 mt-1"><label class="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase mb-1"><span>CEP</span><span id="cep-status" class="hidden text-[9px]"></span></label><input type="text" id="cad-cep" onkeyup="mascaraGeral('cep', this)" onblur="buscarCEP(this.value)" maxlength="9" placeholder="00000-000" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-bold text-slate-700"></div><div class="md:col-span-2 flex gap-2"><div class="flex-1"><label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Endereço (Rua/Av)</label><input type="text" id="cad-rua" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-100 outline-none"></div><div class="w-20"><label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Número</label><input type="text" id="cad-num" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-bold"></div></div><div><label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bairro</label><input type="text" id="cad-bairro" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-100 outline-none"></div><div><label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cidade / UF</label><input type="text" id="cad-cidade" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-100 outline-none"></div></div>`;
    } else {
        titulo.innerHTML = '<i class="ph-bold ph-jeep mr-2"></i>Cadastrar Novo Veículo';
        conteudo.innerHTML = `<div class="space-y-4"><div class="grid grid-cols-2 gap-3"><div class="col-span-2 md:col-span-1"><label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Placa (Padrão ou Mercosul)</label><input type="text" id="cad-placa" onkeyup="mascaraGeral('placa', this)" maxlength="8" placeholder="ABC-1234" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-black uppercase text-blue-700"></div><div class="col-span-2 md:col-span-1"><label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome / Modelo</label><input type="text" id="cad-modelo" placeholder="Ex: Fiat Toro" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium"></div></div><div class="grid grid-cols-3 gap-3"><div class="col-span-2"><label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cor</label><input type="text" id="cad-cor" placeholder="Ex: Branco" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium"></div><div><label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ano</label><input type="number" id="cad-ano" placeholder="2024" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium"></div></div></div>`;
    }
    modal.classList.remove('hidden');
}

function fecharModalCadastro() { document.getElementById('visor-da-tv').classList.add('overflow-y-auto'); document.getElementById('visor-da-tv').classList.remove('overflow-y-hidden'); document.getElementById('modal-cadastro-rapido').classList.add('hidden'); }
async function buscarCEP(cepInput) { /* Mantido */ }
function processarSalvamentoModal() { /* Mantido */ fecharModalCadastro(); }

/**
 * ========================================================
 * MOTOR DE IMPRESSÃO DE PDF (100% P&B E ALTO CONTRASTE)
 * ========================================================
 */
function gerarPDFSupabase(dadosCodificados) {
    const orc = JSON.parse(decodeURIComponent(dadosCodificados));
    const format = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    document.getElementById('pdf-id').innerText = orc.numero_os;
    
    // A MÁGICA DA AUDITORIA
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR');
    const horaFormatada = dataAtual.toLocaleTimeString('pt-BR');
    document.getElementById('pdf-data').innerText = `${dataFormatada} ${horaFormatada}`;

    document.getElementById('pdf-status').innerText = orc.status;
    document.getElementById('pdf-cli').innerText = orc.cliente_nome;
    document.getElementById('pdf-vei').innerText = orc.veiculo_placa;

    const itensReais = orc.itens.lista_itens || [];
    const resumo = orc.itens.resumo || { total: orc.valor_total, pecas: 0, servicos: 0, desconto: 0 };
    const pecas = itensReais.filter(i => i.tipo === 'Peça');
    const servicos = itensReais.filter(i => i.tipo === 'Serviço');
    
    let htmlTabela = `<table style="width: 100%; text-align: left; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">`;
    // Fundo PRETO ABSOLUTO, texto branco.
    htmlTabela += `<thead style="background-color: #000000; color: white;">
        <tr>
            <th style="padding: 6px 10px; width: 10%; border-top-left-radius: 4px;">Tipo</th>
            <th style="padding: 6px 10px; width: 5%;">Qtd</th>
            <th style="padding: 6px 10px; width: 45%;">Descrição Serviço / Peça</th>
            <th style="padding: 6px 10px; text-align: right; width: 20%;">V. Unitário</th>
            <th style="padding: 6px 10px; text-align: right; width: 20%; border-top-right-radius: 4px;">Subtotal</th>
        </tr>
    </thead><tbody>`;
    
    if(pecas.length > 0) {
        htmlTabela += `<tr><td colspan="5" style="background-color: #F3F4F6; font-weight: bold; padding: 6px 10px; color: #000000; text-transform: uppercase; font-size: 10px; border-bottom: 1px solid #D1D5DB;">1. Peças e Componentes</td></tr>`;
        htmlTabela += pecas.map(i => `<tr>
            <td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">${i.tipo}</td>
            <td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #000000;">${i.quantidade}</td>
            <td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB;"><div style="font-weight: bold; color: #000000;">${i.descricao}</div>${i.detalhe ? `<div style="font-size: 9px; color: #4B5563; font-style: italic; margin-top: 1px;">Obs: ${i.detalhe}</div>` : ''}</td>
            <td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; color: #000000;">${format(i.valor_unitario)}</td>
            <td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #000000;">${format(i.subtotal)}</td>
        </tr>`).join('');
    }
    if(servicos.length > 0) {
        htmlTabela += `<tr><td colspan="5" style="background-color: #F3F4F6; font-weight: bold; padding: 6px 10px; color: #000000; text-transform: uppercase; font-size: 10px; border-top: 1px solid #000000; border-bottom: 1px solid #D1D5DB;">2. Mão de Obra e Serviços</td></tr>`;
        htmlTabela += servicos.map(i => `<tr>
            <td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">${i.tipo}</td>
            <td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #000000;">${i.quantidade}</td>
            <td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB;"><div style="font-weight: bold; color: #000000;">${i.descricao}</div>${i.detalhe ? `<div style="font-size: 9px; color: #4B5563; font-style: italic; margin-top: 1px;">Obs: ${i.detalhe}</div>` : ''}</td>
            <td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; color: #000000;">${format(i.valor_unitario)}</td>
            <td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #000000;">${format(i.subtotal)}</td>
        </tr>`).join('');
    }
    htmlTabela += `</tbody></table>`;
    document.getElementById('pdf-container-itens').innerHTML = htmlTabela;

    document.getElementById('pdf-tot-pecas').innerText = format(resumo.pecas || 0);
    document.getElementById('pdf-tot-servicos').innerText = format(resumo.servicos || 0);
    document.getElementById('pdf-tot-desc').innerText = `- ${format(resumo.desconto || 0)}`;
    document.getElementById('pdf-tot-final').innerText = format(resumo.total || orc.valor_total);

    const boxObs = document.getElementById('pdf-container-obs');
    if(orc.observacao && orc.observacao.trim() !== '') { 
        document.getElementById('pdf-obs-texto').innerText = orc.observacao; 
        boxObs.style.display = 'block'; 
    } else { 
        boxObs.style.display = 'none'; 
    }

    const el = document.getElementById('pdf-template-real');
    el.style.left = '0'; el.style.top = '0'; el.style.zIndex = '9999';

    html2pdf().set({ 
        margin: 0.3, 
        filename: `OS_${orc.numero_os}.pdf`, 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2, useCORS: true }, 
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } 
    }).from(el).outputPdf('bloburl').then((pdfUrl) => {
        window.open(pdfUrl, '_blank');
        el.style.left = '-9999px'; el.style.top = '-9999px';
    });
}
