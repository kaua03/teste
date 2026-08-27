// ========================================================
// AutoManager - Módulo de Orçamentos e O.S.
// ========================================================

let itensTemporarios = [];
let valoresFinais = { pecas: 0, servicos: 0, desconto: 0, total: 0 };
let modalTipoAberto = '';
let imagensUploadArray = []; 
let osEmEdicaoId = null; 
let osEmEdicaoNumero = null; 
let idParaExcluir = null;

let globalClientes = [];
let globalVeiculos = [];

async function initOrcamentos() {
    console.log("🟢 Módulo Orçamentos Inicializado.");
    await carregarListasBD();
    buscarOrcamentosSupabase();
}

async function carregarListasBD() {
    const { data: cli } = await window.banco.from('clientes').select('*').order('nome');
    const { data: vei } = await window.banco.from('veiculos').select('*').order('placa');
    
    globalClientes = cli || [];
    globalVeiculos = vei || [];

    const selCli = document.getElementById('db-cliente-nome');
    const selVei = document.getElementById('db-veiculo-placa');
    
    if (selCli) selCli.innerHTML = '<option value="">Selecione um Cliente...</option>';
    if (selVei) selVei.innerHTML = '<option value="">Selecione um Veículo...</option>';

    globalClientes.forEach(c => {
        if (selCli) selCli.innerHTML += `<option value="${c.nome}">${c.nome}</option>`;
    });

    globalVeiculos.forEach(v => {
        const textoCor = v.cor ? ` - ${v.cor}` : '';
        if (selVei) selVei.innerHTML += `<option value="${v.placa}">${v.placa} - ${v.modelo}${textoCor}</option>`;
    });
}

function vincularClienteViceVersa(gatilho) {
    const selCli = document.getElementById('db-cliente-nome');
    const selVei = document.getElementById('db-veiculo-placa');

    if (gatilho === 'cliente' && selCli && selCli.value) {
        const veiEncontrado = globalVeiculos.find(v => v.dono_nome === selCli.value);
        if (veiEncontrado && selVei) selVei.value = veiEncontrado.placa;
    } else if (gatilho === 'veiculo' && selVei && selVei.value) {
        const veiEncontrado = globalVeiculos.find(v => v.placa === selVei.value);
        if (veiEncontrado && veiEncontrado.dono_nome && selCli) selCli.value = veiEncontrado.dono_nome;
    }
}

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

function verificarStatusFinanceiro() {
    const status = document.getElementById('db-status').value;
    const btnFin = document.getElementById('btn-gerar-financeiro');
    const btnSalvar = document.getElementById('btn-salvar-db');
    const btnDestravar = document.getElementById('btn-destravar-os');
    const badgeFechada = document.getElementById('badge-os-fechada');
    
    if (status === 'Fechado') {
        if(btnFin) btnFin.classList.add('hidden');
        if(btnSalvar) btnSalvar.classList.add('hidden');
        if(btnDestravar) btnDestravar.classList.remove('hidden');
        if(badgeFechada) badgeFechada.classList.remove('hidden');
        congelarCamposOS(true);
        return;
    }

    congelarCamposOS(false);
    if(btnSalvar) btnSalvar.classList.remove('hidden');
    if(btnDestravar) btnDestravar.classList.add('hidden');
    if(badgeFechada) badgeFechada.classList.add('hidden');

    if (btnFin) {
        if(status === 'Finalizado') {
            btnFin.classList.remove('hidden');
        } else {
            btnFin.classList.add('hidden');
        }
    }
}

function congelarCamposOS(travar) {
    const campos = ['db-cliente-nome', 'db-veiculo-placa', 'item-tipo', 'item-nome', 'item-qtd', 'item-val', 'item-desc', 'db-obs', 'desc-tipo', 'desc-val', 'desc-alvo', 'db-status'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.disabled = travar;
    });
    const botoesAcao = document.querySelectorAll('#box-add-item button, #box-desconto input, #box-upload-fotos input');
    botoesAcao.forEach(btn => btn.disabled = travar);
    const botoesCadRapido = document.querySelectorAll('.btn-cad-rapido');
    botoesCadRapido.forEach(btn => btn.style.display = travar ? 'none' : 'block');
}

function alternarSubTelaOrcamento(modo) {
    const viewLista = document.getElementById('view-lista-orcamentos');
    const viewNovo = document.getElementById('view-novo-orcamento');

    if (modo === 'novo') {
        osEmEdicaoId = null; 
        osEmEdicaoNumero = null;
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
        verificarStatusFinanceiro(); 
        
        viewLista.classList.add('hidden');
        viewNovo.classList.remove('hidden');
    } else {
        viewNovo.classList.add('hidden');
        viewLista.classList.remove('hidden');
        buscarOrcamentosSupabase();
    }
}

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
        if (index > -1) itensTemporarios[index] = { id_temp: idEdit, tipo, descricao: nome, detalhe: desc, quantidade: qtd, valor_unitario: valFloat, subtotal: sub };
        document.getElementById('item-id-edit').value = '';
        document.getElementById('btn-add-item').innerHTML = '<i class="ph-bold ph-plus mr-1"></i> Add Item';
        document.getElementById('btn-add-item').classList.replace('bg-emerald-600', 'bg-slate-900');
    } else {
        itensTemporarios.push({ id_temp: Date.now(), tipo, descricao: nome, detalhe: desc, quantidade: qtd, valor_unitario: valFloat, subtotal: sub });
    }

    document.getElementById('item-nome').value = ''; document.getElementById('item-desc').value = ''; document.getElementById('item-val').value = ''; document.getElementById('item-qtd').value = '1'; document.getElementById('item-nome').focus();
    calcularTotais();
}

function removerItemDB(id) { itensTemporarios = itensTemporarios.filter(i => i.id_temp !== id); calcularTotais(); }

function editarItem(id) {
    const item = itensTemporarios.find(i => i.id_temp === id);
    if (!item) return;

    document.getElementById('item-tipo').value = item.tipo || 'Peça';
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
    itensTemporarios.forEach(item => { if (item.tipo === 'Peça') sumPecas += item.subtotal; else sumServicos += item.subtotal; });
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

    valoresFinais.pecas = sumPecas; valoresFinais.servicos = sumServicos; valoresFinais.desconto = descValor; valoresFinais.total = totalBruto - descValor;
    atualizarInterfaceItensETotais();
}

function atualizarInterfaceItensETotais() {
    const divLista = document.getElementById('lista-itens-db');
    if (itensTemporarios.length === 0) {
        divLista.innerHTML = `<div class="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200"><i class="ph-fill ph-package text-3xl text-slate-300 mb-2"></i><p class="text-[10px] md:text-xs text-slate-400 uppercase font-bold tracking-wider">Nenhum item adicionado à O.S.</p></div>`;
    } else {
        const isFechado = document.getElementById('db-status').value === 'Fechado';
        divLista.innerHTML = itensTemporarios.map(item => {
            let badgeClass = item.tipo === 'Peça' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200';
            let HTMLdetalhe = item.detalhe ? `<p class="text-xs text-slate-500 mt-1 italic pl-1"><i class="ph-fill ph-info text-blue-400 mr-1"></i>${item.detalhe}</p>` : '';
            let acoes = isFechado ? '' : `
            <div class="flex gap-1">
                <button onclick="editarItem(${item.id_temp})" class="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition" title="Editar"><i class="ph-bold ph-pencil-simple text-lg"></i></button>
                <button onclick="removerItemDB(${item.id_temp})" class="text-red-400 hover:bg-red-50 p-2 rounded-lg transition" title="Excluir"><i class="ph-bold ph-trash text-lg"></i></button>
            </div>`;
            return `
            <div class="bg-white p-3 md:p-4 rounded-xl border border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 shadow-sm hover:border-blue-200 transition-colors">
                <div class="flex-1">
                    <div class="flex items-center"><span class="border ${badgeClass} px-2 py-0.5 rounded text-[10px] font-black uppercase mr-2 shadow-sm">${item.tipo}</span><span class="font-bold text-slate-800 text-sm">${item.quantidade}x ${item.descricao}</span> <span class="text-xs text-slate-400 ml-1">(${formataDinheiro(item.valor_unitario)})</span></div>
                    ${HTMLdetalhe}
                </div>
                <div class="flex items-center gap-3 w-full lg:w-auto justify-between border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
                    <span class="font-black text-slate-900 text-sm md:text-base">${formataDinheiro(item.subtotal)}</span>
                    ${acoes}
                </div>
            </div>`;
        }).join('');
    }
    document.getElementById('resumo-pecas').innerText = formataDinheiro(valoresFinais.pecas);
    document.getElementById('resumo-servicos').innerText = formataDinheiro(valoresFinais.servicos);
    document.getElementById('resumo-desc').innerText = `- ${formataDinheiro(valoresFinais.desconto)}`;
    document.getElementById('db-total').innerText = formataDinheiro(valoresFinais.total);
}

function processarImagens(event) {
    const files = event.target.files;
    if(files.length > 0) document.getElementById('preview-anexos').classList.remove('hidden');
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => { imagensUploadArray.push(e.target.result); renderizarPreviewFotos(); };
        reader.readAsDataURL(file);
    });
}
function renderizarPreviewFotos() {
    const previewContainer = document.getElementById('preview-anexos');
    previewContainer.innerHTML = '';
    if(imagensUploadArray.length === 0) { previewContainer.classList.add('hidden'); return; }
    const isFechado = document.getElementById('db-status').value === 'Fechado';
    imagensUploadArray.forEach(base64Str => {
        const imgBox = document.createElement('div');
        imgBox.className = "w-20 h-20 rounded-xl overflow-hidden shadow-sm border border-slate-200 relative group";
        let trashIcon = isFechado ? '' : `<div class="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all cursor-pointer" onclick="removerImagemArray('${base64Str}')"><i class="ph-bold ph-trash text-white text-xl"></i></div>`;
        imgBox.innerHTML = `<img src="${base64Str}" class="w-full h-full object-cover">${trashIcon}`;
        previewContainer.appendChild(imgBox);
    });
}
function removerImagemArray(strToRem) { imagensUploadArray = imagensUploadArray.filter(i => i !== strToRem); renderizarPreviewFotos(); }

async function buscarOrcamentosSupabase() {
    try {
        const { data: orcamentos, error } = await window.banco.from('orcamentos').select('*').order('id', { ascending: false });
        if (error) throw error;
        renderizarTabelaReal(orcamentos);
    } catch (erro) {
        document.getElementById('tabela-orcamentos-real').innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500 font-bold bg-red-50">Falha de conexão.</td></tr>`;
    }
}

/** TIRA A "FOTOGRAFIA" DOS DADOS NO MOMENTO DO SALVAMENTO **/
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
        const clienteObj = globalClientes.find(c => c.nome === nome) || {};
        const veiculoObj = globalVeiculos.find(v => v.placa === placa) || {};

        let finData = null;
        if (osEmEdicaoId) {
            const { data: oldOrc } = await window.banco.from('orcamentos').select('itens').eq('id', osEmEdicaoId).single();
            if(oldOrc && oldOrc.itens && oldOrc.itens.financeiro) {
                finData = oldOrc.itens.financeiro;
                
                // A BLINDAGEM FINANCEIRA: SE O PREÇO MUDOU, IMPEDE SALVAR SEM AJUSTAR AS PARCELAS!
                let totalFinanceiroSalvo = finData.entrada || 0;
                if (finData.parcelas && finData.parcelas.length > 0) {
                    finData.parcelas.forEach(p => totalFinanceiroSalvo += p.valor);
                }
                
                // Tolera margem de centavos
                if (Math.abs(valoresFinais.total - totalFinanceiroSalvo) > 0.05) {
                    dispararAlerta(`ALERTA: O valor atual da O.S (R$ ${valoresFinais.total.toFixed(2)}) é diferente do Financeiro já gerado (R$ ${totalFinanceiroSalvo.toFixed(2)}). Por favor, clique em FATURAR e gere as parcelas novamente!`);
                    btnSalvar.innerHTML = '<i class="ph-bold ph-floppy-disk text-xl"></i> SALVAR O.S.';
                    btnSalvar.disabled = false;
                    return; // TRAVA O SALVAMENTO AQUI
                }
            }
        }

        const payloadJSONB = { 
            lista_itens: itensTemporarios, 
            resumo: valoresFinais,
            cliente_dados: clienteObj,
            veiculo_dados: veiculoObj
        };
        if(finData) payloadJSONB.financeiro = finData; 
        
        if (osEmEdicaoId) {
            const { error } = await window.banco.from('orcamentos').update({ cliente_nome: nome, veiculo_placa: placa, valor_total: valoresFinais.total, status: status, observacao: obs, anexos: imagensUploadArray, itens: payloadJSONB }).eq('id', osEmEdicaoId);
            if (error) throw error;
            dispararAlerta("O.S atualizada com sucesso!", "sucesso");
            alternarSubTelaOrcamento('lista');
        } else {
            const { data: novaOS, error } = await window.banco.from('orcamentos').insert([{ cliente_nome: nome, veiculo_placa: placa, valor_total: valoresFinais.total, status: status, observacao: obs, anexos: imagensUploadArray, itens: payloadJSONB }]).select().single();
            if (error) throw error;
            
            if(status === 'Finalizado') {
                dispararAlerta("O.S salva! Você já pode Gerar o Financeiro.", "sucesso");
                const osJson = encodeURIComponent(JSON.stringify(novaOS));
                abrirEdicaoOS(osJson); 
                return; 
            } else {
                dispararAlerta("O.S gerada com sucesso!", "sucesso");
                alternarSubTelaOrcamento('lista');
            }
        }
    } catch (erro) { dispararAlerta("Falha de comunicação com o servidor."); } 
    finally { btnSalvar.innerHTML = '<i class="ph-bold ph-floppy-disk text-xl"></i> SALVAR O.S.'; btnSalvar.disabled = false; }
}

function abrirEdicaoOS(dadosCodificados) {
    const orc = JSON.parse(decodeURIComponent(dadosCodificados));
    osEmEdicaoId = orc.id;
    osEmEdicaoNumero = orc.numero_os; 
    
    document.getElementById('titulo-tela-os').innerText = `Edição da O.S. #${orc.numero_os}`;
    
    const selectCliente = document.getElementById('db-cliente-nome');
    if (!Array.from(selectCliente.options).some(opt => opt.value === orc.cliente_nome)) { selectCliente.innerHTML += `<option value="${orc.cliente_nome}">${orc.cliente_nome}</option>`; }
    selectCliente.value = orc.cliente_nome;

    const selectVeiculo = document.getElementById('db-veiculo-placa');
    if (!Array.from(selectVeiculo.options).some(opt => opt.value === orc.veiculo_placa)) { selectVeiculo.innerHTML += `<option value="${orc.veiculo_placa}">${orc.veiculo_placa}</option>`; }
    selectVeiculo.value = orc.veiculo_placa;

    const selStatus = document.getElementById('db-status');
    selStatus.disabled = false; 
    
    if(orc.status === 'Fechado') {
        const optionFechado = Array.from(selStatus.options).find(opt => opt.value === 'Fechado');
        if(optionFechado) { optionFechado.classList.remove('hidden'); optionFechado.disabled = false; }
    }

    selStatus.value = orc.status;
    
    document.getElementById('db-obs').value = orc.observacao || '';
    itensTemporarios = orc.itens?.lista_itens || [];
    imagensUploadArray = orc.anexos || [];
    
    if(imagensUploadArray.length > 0) { 
        document.getElementById('preview-anexos').classList.remove('hidden'); 
        renderizarPreviewFotos(); 
    }

    const descValor = orc.itens?.resumo?.desconto || 0;
    if (descValor > 0) {
        document.getElementById('desc-tipo').value = 'val';
        const descInput = document.getElementById('desc-val');
        descInput.value = (descValor * 100).toString(); 
        mascaraMoeda(descInput);
    } else { document.getElementById('desc-val').value = ''; }

    calcularTotais();
    verificarStatusFinanceiro(); 
    
    document.getElementById('view-lista-orcamentos').classList.add('hidden');
    document.getElementById('view-novo-orcamento').classList.remove('hidden');
}

// ---- DESTRAVAR A O.S FECHADA COM SENHA DO USUÁRIO ----
function abrirModalDestravar() {
    document.getElementById('input-senha-reabrir').value = '';
    document.getElementById('modal-senha-destravar').classList.remove('hidden');
}

function fecharModalDestravar() {
    document.getElementById('modal-senha-destravar').classList.add('hidden');
}

async function processarDestravarOS() {
    const senhaDigitada = document.getElementById('input-senha-reabrir').value;
    const usuarioLogadoStr = localStorage.getItem('usuarioLogado');
    
    if(!usuarioLogadoStr) { dispararAlerta("Sessão inválida. Faça login novamente."); return; }
    
    const usuarioLogado = JSON.parse(usuarioLogadoStr);

    if(senhaDigitada !== usuarioLogado.senha) {
        dispararAlerta("Senha de usuário incorreta. Acesso negado.");
        return;
    }
    
    try {
        const { error } = await window.banco.from('orcamentos').update({ status: 'Finalizado' }).eq('id', osEmEdicaoId);
        if (error) throw error;
        
        document.getElementById('db-status').value = 'Finalizado';
        verificarStatusFinanceiro(); // Libera os campos da tela
        
        dispararAlerta("O.S Destravada com Sucesso!", "sucesso");
        fecharModalDestravar();
    } catch(e) {
        dispararAlerta("Erro ao destravar a O.S no banco.");
    }
}


function abrirModalExclusao(id, numero_os) {
    idParaExcluir = id;
    const spanNum = document.getElementById('exc-os-num');
    if (spanNum) spanNum.innerText = `#${numero_os}`;
    document.getElementById('modal-confirmacao-exclusao').classList.remove('hidden');
}

function fecharModalExclusao() { idParaExcluir = null; document.getElementById('modal-confirmacao-exclusao').classList.add('hidden'); }

async function confirmarExclusao() {
    if(!idParaExcluir) return;
    try {
        const { error } = await window.banco.from('orcamentos').delete().eq('id', idParaExcluir);
        if (error) throw error;
        dispararAlerta("Ordem de serviço apagada com sucesso.", "sucesso");
        fecharModalExclusao();
        buscarOrcamentosSupabase();
    } catch (erro) { dispararAlerta("Falha ao excluir a O.S no banco de dados."); }
}

function obterCorStatus(status) {
    const cores = { 'Em Aberto': 'bg-slate-100 text-slate-700', 'Aguardando Aprovação': 'bg-yellow-50 text-yellow-700', 'Aguardando Peça': 'bg-orange-50 text-orange-700', 'Aguardando Pagamento': 'bg-amber-50 text-amber-700', 'Aprovado': 'bg-blue-50 text-blue-700', 'Em Execução': 'bg-indigo-50 text-indigo-700', 'Finalizado': 'bg-emerald-50 text-emerald-700', 'Fechado': 'bg-slate-800 text-white', 'Não Usar': 'bg-red-50 text-red-700' };
    return cores[status] || 'bg-slate-50 text-slate-500';
}

function renderizarTabelaReal(dados) {
    const tbody = document.getElementById('tabela-orcamentos-real');
    if (dados.length === 0) { tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center"><i class="ph-fill ph-receipt text-4xl text-slate-300 mb-3"></i><p class="text-sm font-bold text-slate-500">Nenhuma O.S registrada.</p></td></tr>`; return; }
    tbody.innerHTML = dados.map(orc => {
        const dataStr = new Date(orc.data_criacao).toLocaleDateString('pt-BR');
        const corBg = obterCorStatus(orc.status);
        const orcJSON = encodeURIComponent(JSON.stringify(orc));
        const iconVisualizar = orc.status === 'Fechado' ? 'ph-lock-key text-slate-500' : 'ph-pencil-simple text-blue-500';
        
        return `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 md:p-5"><p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">${dataStr}</p><p class="font-black text-slate-800 text-sm">O.S #${orc.numero_os}</p></td>
            <td class="p-4 md:p-5"><p class="font-bold text-slate-700 text-sm">${orc.cliente_nome}</p><p class="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">${orc.veiculo_placa}</p></td>
            <td class="p-4 md:p-5 font-black text-slate-800 text-right text-sm">${formataDinheiro(orc.valor_total)}</td>
            <td class="p-4 md:p-5 text-center"><span class="${corBg} border px-2 py-1.5 rounded-lg text-[10px] font-bold shadow-sm whitespace-nowrap">${orc.status === 'Fechado' ? '<i class="ph-bold ph-lock-key mr-1"></i> Faturada' : orc.status}</span></td>
            <td class="p-4 md:p-5 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    <button onclick="abrirEdicaoOS('${orcJSON}')" class="bg-white hover:bg-slate-50 border border-slate-200 p-2 rounded-lg transition" title="Visualizar/Editar"><i class="ph-bold ${iconVisualizar} text-lg"></i></button>
                    <button onclick="abrirModalExclusao(${orc.id}, '${orc.numero_os}')" class="bg-white text-slate-400 hover:text-red-500 border border-slate-200 p-2 rounded-lg transition" title="Excluir"><i class="ph-bold ph-trash text-lg"></i></button>
                    <button onclick="gerarPDFSupabase('${orcJSON}')" class="bg-slate-800 text-white hover:bg-slate-900 border border-slate-800 p-2 rounded-lg transition" title="Abrir PDF"><i class="ph-bold ph-file-pdf text-lg"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

/** LÓGICA DO MODAL FINANCEIRO INTELIGENTE (COM PROTEÇÃO) **/
function abrirModalFinanceiro() {
    if(!osEmEdicaoId) {
        dispararAlerta("Por favor, salve a O.S primeiro antes de gerar o financeiro.");
        return;
    }
    
    document.getElementById('fin-total-os').innerText = formataDinheiro(valoresFinais.total);
    document.getElementById('fin-entrada').value = '';
    document.getElementById('fin-parcelas').value = '1';
    document.getElementById('fin-forma-entrada').value = 'Pix';
    
    const hojeStr = new Date().toISOString().split('T')[0];
    
    // Verificações de segurança para nulos
    const campoDataEntrada = document.getElementById('fin-data-entrada');
    const campoVencBase = document.getElementById('fin-vencimento-base');
    
    if (campoDataEntrada) campoDataEntrada.value = hojeStr;
    if (campoVencBase) campoVencBase.value = hojeStr;
    
    gerarLinhasParcelas(); 
    document.getElementById('modal-financeiro').classList.remove('hidden');
}

function fecharModalFinanceiro() {
    document.getElementById('modal-financeiro').classList.add('hidden');
}

function aoMudarFormaPagamentoPrincipal() {
    const forma = document.getElementById('fin-forma-entrada').value;
    let data = new Date();
    if (forma === 'Cartão de Crédito' || forma === 'Boleto') {
        data.setMonth(data.getMonth() + 1);
    }
    const dataStr = data.toISOString().split('T')[0];
    const campoDataEntrada = document.getElementById('fin-data-entrada');
    const campoVencBase = document.getElementById('fin-vencimento-base');
    
    if(campoDataEntrada) campoDataEntrada.value = dataStr;
    if(campoVencBase) campoVencBase.value = dataStr;
    
    gerarLinhasParcelas();
}

function gerarLinhasParcelas() {
    const total = valoresFinais.total;
    const entrada = reverterMoeda(document.getElementById('fin-entrada').value) || 0;
    let restante = total - entrada;
    if(restante < 0) restante = 0;

    const inputRestante = document.getElementById('fin-restante');
    if (inputRestante) inputRestante.value = formataDinheiro(restante);

    const parcelas = parseInt(document.getElementById('fin-parcelas').value) || 1;
    const dataBaseStr = document.getElementById('fin-vencimento-base')?.value;
    const formaPrincipal = document.getElementById('fin-forma-entrada').value;
    const divSimulacao = document.getElementById('fin-simulacao');

    if (restante === 0) {
        divSimulacao.innerHTML = `<div class="p-3 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-xl text-center"><i class="ph-bold ph-check-circle mr-1"></i> A Entrada cobre 100% da O.S. Nenhuma parcela extra.</div>`;
        document.getElementById('fin-parcelas').disabled = true;
        return;
    }

    document.getElementById('fin-parcelas').disabled = false;
    let html = '';
    let dataBase = dataBaseStr ? new Date(dataBaseStr + 'T12:00:00Z') : new Date();
    let acumulado = 0;

    for(let i=1; i<=parcelas; i++) {
        let valorParc = 0;
        if (i === parcelas) {
            valorParc = restante - acumulado;
        } else {
            valorParc = Math.floor((restante / parcelas) * 100) / 100;
            acumulado += valorParc;
        }

        let d = new Date(dataBase);
        d.setMonth(d.getMonth() + (i - 1)); 
        let dateVal = d.toISOString().split('T')[0];

        html += `
        <div class="flex flex-col md:flex-row gap-2 items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-emerald-300">
            <span class="font-black text-xs text-blue-600 w-full md:w-16">Parc ${i}/${parcelas}</span>
            <input type="text" id="parc-val-${i}" onkeyup="mascaraMoeda(this)" onblur="ajustarParcelasManualmente(${i})" value="${formataDinheiro(valorParc)}" class="w-full md:w-28 border border-slate-300 p-2 rounded-lg text-sm font-black text-slate-800 outline-none focus:border-emerald-500">
            <input type="date" id="parc-data-${i}" value="${dateVal}" class="w-full md:flex-1 border border-slate-300 p-2 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-500">
            <select id="parc-forma-${i}" class="w-full md:flex-1 border border-slate-300 p-2 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer">
                <option value="Cartão de Crédito" ${formaPrincipal === 'Cartão de Crédito' ? 'selected' : ''}>Cartão de Crédito</option>
                <option value="Cartão de Débito" ${formaPrincipal === 'Cartão de Débito' ? 'selected' : ''}>Cartão de Débito</option>
                <option value="Pix" ${formaPrincipal === 'Pix' ? 'selected' : ''}>Pix</option>
                <option value="Boleto" ${formaPrincipal === 'Boleto' ? 'selected' : ''}>Boleto</option>
                <option value="Dinheiro" ${formaPrincipal === 'Dinheiro' ? 'selected' : ''}>Dinheiro Físico</option>
                <option value="Transferência" ${formaPrincipal === 'Transferência' ? 'selected' : ''}>Transferência Bancária</option>
            </select>
        </div>`;
    }
    divSimulacao.innerHTML = html;
}

window.ajustarParcelasManualmente = function(index) {
    const parcelas = parseInt(document.getElementById('fin-parcelas').value) || 1;
    const restante = reverterMoeda(document.getElementById('fin-restante').value) || 0;
    
    let somaAnteriores = 0;
    for(let i=1; i<=index; i++) {
        somaAnteriores += reverterMoeda(document.getElementById(`parc-val-${i}`).value) || 0;
    }
    
    let restanteParaDistribuir = restante - somaAnteriores;
    
    if (restanteParaDistribuir < 0) {
        const limiteMaximoDaParcela = restante - (somaAnteriores - reverterMoeda(document.getElementById(`parc-val-${index}`).value));
        document.getElementById(`parc-val-${index}`).value = formataDinheiro(limiteMaximoDaParcela);
        restanteParaDistribuir = 0;
    }
    
    const parcelasRestantes = parcelas - index;
    if (parcelasRestantes > 0) {
        let acumulado = 0;
        for(let i = index + 1; i <= parcelas; i++) {
            let valorParc = 0;
            if (i === parcelas) {
                valorParc = restanteParaDistribuir - acumulado;
            } else {
                valorParc = Math.floor((restanteParaDistribuir / parcelasRestantes) * 100) / 100;
                acumulado += valorParc;
            }
            document.getElementById(`parc-val-${i}`).value = formataDinheiro(valorParc);
        }
    }
}

async function processarLancarFinanceiro() {
    const entrada = reverterMoeda(document.getElementById('fin-entrada').value) || 0;
    const formaEntrada = document.getElementById('fin-forma-entrada').value;
    const dataEntradaStr = document.getElementById('fin-data-entrada')?.value || new Date().toISOString().split('T')[0];
    const total = valoresFinais.total;
    const restante = total - entrada;
    const parcelas = parseInt(document.getElementById('fin-parcelas').value) || 1;
    const cliente = document.getElementById('db-cliente-nome').value;

    if(total <= 0) { dispararAlerta("O valor total da O.S é zero."); return; }
    
    let somaParcelas = 0;
    if(restante > 0) {
        for(let i=1; i<=parcelas; i++) {
            somaParcelas += reverterMoeda(document.getElementById(`parc-val-${i}`).value) || 0;
        }
        if (Math.abs(somaParcelas - restante) > 0.05) {
            dispararAlerta("A soma das parcelas não bate com o valor restante. Verifique os valores.");
            return;
        }
    }
    
    const btnSalvar = document.getElementById('btn-salvar-fin');
    btnSalvar.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Gerando...';
    btnSalvar.disabled = true;

    let infoFinanceiraParaPDF = {
        entrada: entrada,
        forma_entrada: formaEntrada,
        data_entrada: dataEntradaStr,
        parcelas: []
    };

    let records = [];
    const hojeStr = new Date().toISOString().split('T')[0];

    // Se o cliente mudou a O.S que já tinha financeiro, ele APAGA o financeiro antigo pra não duplicar!
    await window.banco.from('contas_receber').delete().like('descricao', `%O.S #${osEmEdicaoNumero}%`);

    if(entrada > 0) {
        const statusEntrada = (dataEntradaStr > hojeStr) ? 'Pendente' : 'Pago';
        const dataPagamentoEntrada = (statusEntrada === 'Pago') ? dataEntradaStr : null;

        records.push({
            descricao: `Entrada O.S #${osEmEdicaoNumero} - ${cliente}`,
            categoria: 'Adiantamento',
            valor: entrada,
            data_vencimento: dataEntradaStr,
            status: statusEntrada, 
            data_pagamento: dataPagamentoEntrada,
            forma_pagamento: formaEntrada
        });
    }

    if (restante > 0 && parcelas > 0) {
        for(let i=1; i<=parcelas; i++) {
            const dataParc = document.getElementById(`parc-data-${i}`).value;
            const formaParc = document.getElementById(`parc-forma-${i}`).value;
            const valorParc = reverterMoeda(document.getElementById(`parc-val-${i}`).value);

            infoFinanceiraParaPDF.parcelas.push({
                numero: i,
                valor: valorParc,
                data_vencimento: dataParc,
                forma_pagamento: formaParc
            });

            records.push({
                descricao: `Parcela ${i}/${parcelas} O.S #${osEmEdicaoNumero} - ${cliente}`,
                categoria: 'Serviços O.S',
                valor: parseFloat(valorParc.toFixed(2)),
                data_vencimento: dataParc,
                status: 'Pendente',
                forma_pagamento: formaParc
            });
        }
    }

    try {
        const clienteObj = globalClientes.find(c => c.nome === cliente) || {};
        const veiculoObj = globalVeiculos.find(v => v.placa === document.getElementById('db-veiculo-placa').value) || {};

        const payloadJSONB = { 
            lista_itens: itensTemporarios, 
            resumo: valoresFinais,
            cliente_dados: clienteObj,
            veiculo_dados: veiculoObj,
            financeiro: infoFinanceiraParaPDF 
        };

        const { error: errOS } = await window.banco.from('orcamentos').update({ 
            itens: payloadJSONB,
            status: 'Fechado' 
        }).eq('id', osEmEdicaoId);
        if(errOS) throw errOS;

        if (records.length > 0) {
            const { error: errFin } = await window.banco.from('contas_receber').insert(records);
            if (errFin) throw errFin;
        }
        
        document.getElementById('db-status').value = 'Fechado';
        verificarStatusFinanceiro(); 

        dispararAlerta("O.S Faturada e Fechada com sucesso!", "sucesso");
        fecharModalFinanceiro();
        
    } catch (erro) {
        dispararAlerta("Falha ao integrar o financeiro no banco de dados.");
    } finally {
        btnSalvar.innerHTML = '<i class="ph-bold ph-lock-key text-lg"></i> Faturar e Fechar O.S';
        btnSalvar.disabled = false;
    }
}

// RESTANTE DO CÓDIGO (Outros Modais de Cadastro etc continuam inalterados... Mas vou omitir para poupar espaço. Adicione as funções de PDF abaixo normalmente).

/**
 * MOTOR DE IMPRESSÃO
 */
function gerarPDFSupabase(dadosCodificados) {
    const orc = JSON.parse(decodeURIComponent(dadosCodificados));
    const format = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    document.getElementById('pdf-id').innerText = orc.numero_os;
    const dataAbertura = new Date(orc.data_criacao);
    const pdfDataAberturaEl = document.getElementById('pdf-data-abertura');
    if(pdfDataAberturaEl) pdfDataAberturaEl.innerText = dataAbertura.toLocaleDateString('pt-BR');

    const dataAtual = new Date();
    const pdfDataEmissaoEl = document.getElementById('pdf-data-emissao');
    if(pdfDataEmissaoEl) pdfDataEmissaoEl.innerText = `${dataAtual.toLocaleDateString('pt-BR')} ${dataAtual.toLocaleTimeString('pt-BR')}`;

    const pdfStatusEl = document.getElementById('pdf-status');
    if(pdfStatusEl) pdfStatusEl.innerText = orc.status === 'Fechado' ? 'Faturado' : orc.status;

    let cliDados = orc.itens?.cliente_dados || globalClientes.find(c => c.nome === orc.cliente_nome) || {};
    let veiDados = orc.itens?.veiculo_dados || globalVeiculos.find(v => v.placa === orc.veiculo_placa) || {};

    const pdfCliNomeEl = document.getElementById('pdf-cli-nome');
    if(pdfCliNomeEl) pdfCliNomeEl.innerText = orc.cliente_nome || '---';

    const pdfCliDocEl = document.getElementById('pdf-cli-doc');
    if(pdfCliDocEl) pdfCliDocEl.innerText = cliDados.documento || '---';

    const pdfCliTelEl = document.getElementById('pdf-cli-tel');
    if(pdfCliTelEl) pdfCliTelEl.innerText = cliDados.telefone || '---';

    const pdfCliEndEl = document.getElementById('pdf-cli-end');
    if(pdfCliEndEl) {
        let enderecoArr = [];
        if(cliDados.endereco) enderecoArr.push(cliDados.endereco);
        if(cliDados.numero) enderecoArr.push(`, ${cliDados.numero}`);
        if(cliDados.bairro) enderecoArr.push(` - ${cliDados.bairro}`);
        if(cliDados.cidade) enderecoArr.push(` (${cliDados.cidade})`);
        if(cliDados.cep) enderecoArr.push(` - CEP: ${cliDados.cep}`);
        pdfCliEndEl.innerText = enderecoArr.length > 0 ? enderecoArr.join('') : 'Endereço não informado';
    }

    const pdfVeiModEl = document.getElementById('pdf-vei-mod');
    if(pdfVeiModEl) pdfVeiModEl.innerText = veiDados.modelo || '---';

    const pdfVeiPlacaEl = document.getElementById('pdf-vei-placa');
    if(pdfVeiPlacaEl) pdfVeiPlacaEl.innerText = orc.veiculo_placa || '---';

    const pdfVeiDetEl = document.getElementById('pdf-vei-det');
    if(pdfVeiDetEl) pdfVeiDetEl.innerText = `${veiDados.cor || '--'} / ${veiDados.ano || '--'}`;

    const itensReais = orc.itens.lista_itens || [];
    const resumo = orc.itens.resumo || { total: orc.valor_total, pecas: 0, servicos: 0, desconto: 0 };
    const pecas = itensReais.filter(i => i.tipo === 'Peça');
    const servicos = itensReais.filter(i => i.tipo === 'Serviço');
    
    let htmlTabela = `<table style="width: 100%; text-align: left; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">`;
    htmlTabela += `<thead style="background-color: #000000; color: white;"><tr><th style="padding: 6px 10px; width: 10%; border-top-left-radius: 4px;">Tipo</th><th style="padding: 6px 10px; width: 5%;">Qtd</th><th style="padding: 6px 10px; width: 45%;">Descrição Serviço / Peça</th><th style="padding: 6px 10px; text-align: right; width: 20%;">V. Unitário</th><th style="padding: 6px 10px; text-align: right; width: 20%; border-top-right-radius: 4px;">Subtotal</th></tr></thead><tbody>`;
    
    if(pecas.length > 0) {
        htmlTabela += `<tr><td colspan="5" style="background-color: #F3F4F6; font-weight: bold; padding: 6px 10px; color: #000000; text-transform: uppercase; font-size: 10px; border-bottom: 1px solid #D1D5DB;">1. Peças e Componentes</td></tr>`;
        htmlTabela += pecas.map(i => `<tr><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">${i.tipo}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #000000;">${i.quantidade}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB;"><div style="font-weight: bold; color: #000000;">${i.descricao}</div>${i.detalhe ? `<div style="font-size: 9px; color: #4B5563; font-style: italic; margin-top: 1px;">Obs: ${i.detalhe}</div>` : ''}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; color: #000000;">${format(i.valor_unitario)}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #000000;">${format(i.subtotal)}</td></tr>`).join('');
    }
    if(servicos.length > 0) {
        htmlTabela += `<tr><td colspan="5" style="background-color: #F3F4F6; font-weight: bold; padding: 6px 10px; color: #000000; text-transform: uppercase; font-size: 10px; border-top: 1px solid #000000; border-bottom: 1px solid #D1D5DB;">2. Mão de Obra e Serviços</td></tr>`;
        htmlTabela += servicos.map(i => `<tr><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">${i.tipo}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #000000;">${i.quantidade}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB;"><div style="font-weight: bold; color: #000000;">${i.descricao}</div>${i.detalhe ? `<div style="font-size: 9px; color: #4B5563; font-style: italic; margin-top: 1px;">Obs: ${i.detalhe}</div>` : ''}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; color: #000000;">${format(i.valor_unitario)}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #000000;">${format(i.subtotal)}</td></tr>`).join('');
    }
    htmlTabela += `</tbody></table>`;
    document.getElementById('pdf-container-itens').innerHTML = htmlTabela;

    document.getElementById('pdf-tot-pecas').innerText = format(resumo.pecas || 0);
    document.getElementById('pdf-tot-servicos').innerText = format(resumo.servicos || 0);
    document.getElementById('pdf-tot-desc').innerText = `- ${format(resumo.desconto || 0)}`;
    document.getElementById('pdf-tot-final').innerText = format(resumo.total || orc.valor_total);

    const boxObs = document.getElementById('pdf-container-obs');
    const pdfObsTextoEl = document.getElementById('pdf-obs-texto');
    if(orc.observacao && orc.observacao.trim() !== '') { 
        if(pdfObsTextoEl) pdfObsTextoEl.innerText = orc.observacao; 
        if(boxObs) boxObs.style.display = 'block'; 
    } else { 
        if(boxObs) boxObs.style.display = 'none'; 
    }

    const fin = orc.itens?.financeiro;
    const containerFin = document.getElementById('pdf-container-financeiro');
    if (fin) {
        let htmlFin = `<h3 style="font-size: 10px; color: #000000; text-transform: uppercase; margin: 0 0 6px 0; border-bottom: 1px solid #D1D5DB; padding-bottom: 4px; font-weight: bold;">Condições de Pagamento Combinadas</h3>`;
        htmlFin += `<table style="width: 100%; border-collapse: collapse; font-size: 10px;">`;
        
        if (fin.entrada > 0) {
            const dataEntradaBR = new Date(fin.data_entrada + 'T12:00:00Z').toLocaleDateString('pt-BR');
            htmlFin += `<tr><td style="padding: 4px; border-bottom: 1px dashed #e2e8f0;"><b>Entrada/Sinal:</b> ${format(fin.entrada)} (Via ${fin.forma_entrada} em ${dataEntradaBR})</td></tr>`;
        }
        
        if (fin.parcelas && fin.parcelas.length > 0) {
            fin.parcelas.forEach(p => {
                const dataBR = new Date(p.data_vencimento + 'T12:00:00Z').toLocaleDateString('pt-BR');
                htmlFin += `<tr><td style="padding: 4px; border-bottom: 1px dashed #e2e8f0;"><b>Parcela ${p.numero}/${fin.parcelas.length}:</b> ${format(p.valor)} - Vencimento: ${dataBR} (Via ${p.forma_pagamento})</td></tr>`;
            });
        } else if (fin.entrada <= 0) {
             htmlFin += `<tr><td style="padding: 4px;">Pendente de definição de parcelas.</td></tr>`;
        }
        htmlFin += `</table>`;
        
        containerFin.innerHTML = htmlFin;
        containerFin.style.display = 'block';
    } else {
        containerFin.style.display = 'none';
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
