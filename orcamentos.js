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
let osParaDestravarId = null;
let osParaDestravarDados = null; 

let globalClientes = [];
let globalVeiculos = [];
let currentOSFinanceiro = []; 

// ========================================================
// FUNÇÕES UTILITÁRIAS (HOISTED PARA EVITAR ERROS)
// ========================================================
function formataDinheiro(v) {
    const val = Number(v) || 0;
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mascaraMoeda(campo) {
    let valor = campo.value.replace(/\D/g, ''); 
    if (valor === '') { campo.value = ''; return; }
    valor = (parseInt(valor, 10) / 100).toFixed(2);
    campo.value = valor.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
}

function formatarDataISO(dataObj) {
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const dia = String(dataObj.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function valorParaInput(v) {
    let val = Number(v) || 0;
    val = val.toFixed(2);
    val = val.replace('.', ',');
    val = val.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return val;
}

function reverterMoeda(texto) {
    if(!texto) return 0;
    let limpo = texto.toString().replace(/[^\d,-]/g, '');
    return parseFloat(limpo.replace(',', '.')) || 0;
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

// ========================================================
// INICIALIZAÇÃO
// ========================================================
async function initOrcamentos() {
    await carregarListasBD();
    await buscarOrcamentosSupabase();
    document.getElementById('view-novo-orcamento').classList.add('hidden');
    document.getElementById('view-lista-orcamentos').classList.remove('hidden');
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

    globalClientes.forEach(c => { if (selCli) selCli.innerHTML += `<option value="${c.nome}">${c.nome}</option>`; });
    globalVeiculos.forEach(v => { const tc = v.cor ? ` - ${v.cor}` : ''; if (selVei) selVei.innerHTML += `<option value="${v.placa}">${v.placa} - ${v.modelo}${tc}</option>`; });
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

// ========================================================
// SISTEMA DE ABAS DA O.S E RENDERIZAÇÃO FINANCEIRA
// ========================================================
function mudarAbaOS(aba) {
    const btnDados = document.getElementById('aba-dados');
    const btnFin = document.getElementById('aba-fin');
    const contDados = document.getElementById('aba-conteudo-dados');
    const contFin = document.getElementById('aba-conteudo-fin');

    if (aba === 'dados') {
        btnDados.className = 'pb-3 px-2 font-black text-blue-600 border-b-2 border-blue-600 transition-colors whitespace-nowrap text-sm';
        btnFin.className = 'pb-3 px-2 font-bold text-slate-400 border-b-2 border-transparent hover:text-slate-600 transition-colors whitespace-nowrap text-sm flex items-center gap-2';
        contDados.classList.remove('hidden');
        contFin.classList.add('hidden');
    } else {
        btnFin.className = 'pb-3 px-2 font-black text-emerald-600 border-b-2 border-emerald-600 transition-colors whitespace-nowrap text-sm flex items-center gap-2';
        btnDados.className = 'pb-3 px-2 font-bold text-slate-400 border-b-2 border-transparent hover:text-slate-600 transition-colors whitespace-nowrap text-sm';
        contFin.classList.remove('hidden');
        contDados.classList.add('hidden');
        renderizarAbaFinanceiro();
    }
}

async function recarregarFinanceiroDaOS() {
    if(!osEmEdicaoNumero) return;
    const { data: finRecords } = await window.banco.from('contas_receber')
        .select('*').like('descricao', `%O.S #${osEmEdicaoNumero}%`).order('data_vencimento', { ascending: true });
    
    currentOSFinanceiro = finRecords || [];
    if (!document.getElementById('aba-conteudo-fin').classList.contains('hidden')) {
        renderizarAbaFinanceiro();
    }
}

function renderizarAbaFinanceiro() {
    const boxBloqueado = document.getElementById('fin-bloqueado-box');
    const boxLiberado = document.getElementById('fin-liberado-box');
    const boxGerador = document.getElementById('fin-gerador-box');
    const boxEditor = document.getElementById('fin-editor-box');
    const btnRefazer = document.getElementById('btn-estornar-fin');
    const btnSalvarEdicao = document.getElementById('btn-salvar-fin-edicao');
    const subtitulo = document.getElementById('fin-aba-subtitulo');
    
    document.getElementById('fin-aba-total-os').innerText = formataDinheiro(valoresFinais.total);

    if (!osEmEdicaoId) {
        boxBloqueado.classList.remove('hidden');
        boxLiberado.classList.add('hidden');
        if(btnSalvarEdicao) btnSalvarEdicao.classList.add('hidden');
        if(btnRefazer) btnRefazer.classList.add('hidden');
        return;
    }

    boxBloqueado.classList.add('hidden');
    boxLiberado.classList.remove('hidden'); 

    if (!currentOSFinanceiro || currentOSFinanceiro.length === 0) {
        // TELA DE GERADOR
        boxGerador.classList.remove('hidden');
        boxEditor.classList.add('hidden');
        if(btnRefazer) btnRefazer.classList.add('hidden');
        if(btnSalvarEdicao) btnSalvarEdicao.classList.add('hidden');
        
        if (window.isVisualizacaoModo) {
            boxGerador.classList.add('hidden');
            subtitulo.innerText = "Esta O.S. não possui lançamentos financeiros.";
            document.getElementById('fin-aba-soma').innerText = 'R$ 0,00';
            atualizarPlacarAuditoria(0, 'btn-salvar-fin-tab');
        } else {
            subtitulo.innerText = "Defina como o cliente vai pagar para gerar os boletos/parcelas.";
            document.getElementById('tab-fin-tipo').value = 'avista';
            mudarTipoFaturamentoTab();
        }
    } else {
        // TELA DE EDITOR
        boxGerador.classList.add('hidden');
        boxEditor.classList.remove('hidden');
        
        if (window.isVisualizacaoModo) {
            if(btnSalvarEdicao) btnSalvarEdicao.classList.add('hidden');
            subtitulo.innerText = "Lançamentos financeiros atrelados à O.S.";
        } else {
            if(btnSalvarEdicao) btnSalvarEdicao.classList.remove('hidden');
            subtitulo.innerText = "Você pode alterar os valores, datas e meios de pagamento das parcelas abaixo.";
        }
        
        const hasPago = currentOSFinanceiro.some(r => r.status === 'Pago' || r.categoria === 'Adiantamento');
        if (hasPago || window.isVisualizacaoModo) {
            if(btnRefazer) btnRefazer.classList.add('hidden'); 
        } else {
            if(btnRefazer) btnRefazer.classList.remove('hidden'); 
        }
        
        const listaDiv = document.getElementById('lista-financeiro-vinculado');
        let html = '';
        
        const statusAtual = document.getElementById('db-status').value;
        const isTravadoGlobal = (statusAtual === 'Fechado' && !window.isOSDestravada) || window.isVisualizacaoModo;

        currentOSFinanceiro.forEach((rec, idx) => {
            const isPago = rec.status === 'Pago' || rec.categoria === 'Adiantamento';
            const trancaGeral = isTravadoGlobal ? 'disabled' : '';
            const trancaParaPago = isPago ? 'disabled' : trancaGeral;
            
            let iconeStatus = isPago ? `<span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center shadow-sm"><i class="ph-bold ph-check mr-1"></i> Liquidado</span>` : `<span class="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center shadow-sm"><i class="ph-bold ph-clock mr-1"></i> Pendente</span>`;
            
            const badgeTipo = rec.categoria === 'Adiantamento' || rec.descricao.includes('Acerto Imediato') ? 'Entrada / À Vista' : `Parcela ${rec.descricao.split(' ')[1] || (idx+1)}`;
            const corCard = isPago ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50';
            const trancaClasses = (isPago || isTravadoGlobal) ? 'bg-transparent border-transparent text-emerald-900' : 'border-slate-300 bg-white focus:border-blue-500 text-slate-800';

            html += `
            <div class="p-4 rounded-xl border ${corCard} shadow-sm flex flex-col gap-4">
                <div class="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span class="text-[10px] font-black text-slate-500 uppercase tracking-wider">${badgeTipo}</span>
                    ${iconeStatus}
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-[9px] font-bold text-slate-400 uppercase mb-1">Vencimento / Pagto</label>
                        <input type="date" id="edit-rec-data-${idx}" value="${rec.data_vencimento}" ${trancaParaPago} class="w-full p-2.5 rounded-xl text-xs font-bold outline-none border ${trancaClasses}">
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-slate-400 uppercase mb-1">Forma de Pagto.</label>
                        <select id="edit-rec-forma-${idx}" ${trancaParaPago} class="w-full p-2.5 rounded-xl text-xs font-bold outline-none border ${trancaClasses} cursor-pointer">
                            <option value="Pix" ${rec.forma_pagamento === 'Pix' ? 'selected' : ''}>Pix</option>
                            <option value="Dinheiro" ${rec.forma_pagamento === 'Dinheiro' ? 'selected' : ''}>Dinheiro Físico</option>
                            <option value="Cartão de Débito" ${rec.forma_pagamento === 'Cartão de Débito' ? 'selected' : ''}>Cartão de Débito</option>
                            <option value="Cartão de Crédito" ${rec.forma_pagamento === 'Cartão de Crédito' ? 'selected' : ''}>Cartão de Crédito</option>
                            <option value="Boleto" ${rec.forma_pagamento === 'Boleto' ? 'selected' : ''}>Boleto</option>
                            <option value="Transferência" ${rec.forma_pagamento === 'Transferência' ? 'selected' : ''}>Transferência Bancária</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-slate-400 uppercase mb-1">Valor (R$)</label>
                        <input type="text" id="edit-rec-val-${idx}" onkeyup="mascaraMoeda(this); window.checarSomaFinanceiroEdit()" value="${valorParaInput(rec.valor)}" ${trancaParaPago} class="w-full p-2.5 rounded-xl text-sm font-black outline-none border ${trancaClasses}">
                    </div>
                </div>
                ${!isPago && !isTravadoGlobal ? `<div class="flex justify-end pt-2"><button onclick="excluirParcelaManual(${rec.id})" class="text-[10px] text-red-500 font-bold hover:underline flex items-center gap-1"><i class="ph-bold ph-trash"></i> Excluir Lançamento</button></div>` : ''}
            </div>`;
        });
        
        if (!isTravadoGlobal) {
            html += `
            <div class="mt-4 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 border-dashed">
                 <p class="text-[10px] md:text-xs text-slate-500 font-medium">Você precisa adicionar uma parcela extra?</p>
                <button onclick="adicionarNovaParcelaManual()" class="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-slate-900 transition-transform transform active:scale-95 text-xs md:text-sm flex items-center gap-2"><i class="ph-bold ph-plus"></i> Novo Lançamento</button>
            </div>`;
        }

        listaDiv.innerHTML = html;
        window.checarSomaFinanceiroEdit();
    }
}

function atualizarPlacarAuditoria(somaFinanceiro, btnIdToBlock = 'btn-salvar-fin-edicao') {
    const elSomaBox = document.getElementById('fin-aba-soma-box');
    const elAlerta = document.getElementById('fin-aba-alerta');
    const btnSalvar = document.getElementById(btnIdToBlock);
    
    if (somaFinanceiro > 0 && Math.abs(valoresFinais.total - somaFinanceiro) > 0.05) {
        if(elSomaBox) elSomaBox.className = 'p-4 rounded-xl border transition-colors shadow-inner border-red-300 bg-red-50 text-red-600 text-center';
        if(elAlerta) elAlerta.classList.remove('hidden');
        if(btnSalvar && !window.isVisualizacaoModo) { btnSalvar.disabled = true; btnSalvar.classList.add('opacity-50', 'cursor-not-allowed'); }
    } else {
        if(elSomaBox) elSomaBox.className = 'p-4 rounded-xl border transition-colors shadow-inner border-emerald-300 bg-emerald-50 text-emerald-700 text-center';
        if(elAlerta) elAlerta.classList.add('hidden');
        if(btnSalvar && !window.isVisualizacaoModo) { btnSalvar.disabled = false; btnSalvar.classList.remove('opacity-50', 'cursor-not-allowed'); }
    }
}

// -----------------------------------------------------------------------------------
// AUDITORIA EM TEMPO REAL AO DIGITAR VALORES 
// -----------------------------------------------------------------------------------
window.checarSomaGeradorTab = function() {
    const activeEl = document.activeElement;
    
    if (activeEl && (activeEl.id === 'tab-fin-entrada' || activeEl.id === 'tab-fin-parcelas')) {
        window.gerarLinhasParcelasTab();
        return;
    }

    const tipo = document.getElementById('tab-fin-tipo').value;
    let soma = 0;
    
    if (tipo !== 'parcelado') {
        soma += reverterMoeda(document.getElementById('tab-fin-entrada').value) || 0;
    }
    
    if (tipo !== 'avista') {
        const parcelas = Math.max(1, parseInt(document.getElementById('tab-fin-parcelas').value) || 1);
        for(let i=1; i<=parcelas; i++) {
            const inputParc = document.getElementById(`tab-parc-val-${i}`);
            if(inputParc) soma += reverterMoeda(inputParc.value) || 0;
        }
    }
    
    document.getElementById('fin-aba-soma').innerText = formataDinheiro(soma);
    atualizarPlacarAuditoria(soma, 'btn-salvar-fin-tab');
}

window.checarSomaFinanceiroEdit = function() {
    let soma = 0;
    currentOSFinanceiro.forEach((rec, idx) => {
        const inputVal = document.getElementById(`edit-rec-val-${idx}`);
        if(inputVal) soma += reverterMoeda(inputVal.value);
        else soma += rec.valor;
    });
    
    document.getElementById('fin-aba-soma').innerText = formataDinheiro(soma);
    atualizarPlacarAuditoria(soma, 'btn-salvar-fin-edicao');
}

// ----------------------------------------------------
// GERADOR DE PARCELAS TAB
// ----------------------------------------------------
function mudarTipoFaturamentoTab() {
    const tipo = document.getElementById('tab-fin-tipo').value;
    const boxEntrada = document.getElementById('tab-box-entrada');
    const boxParcelamento = document.getElementById('tab-box-parcelamento');
    const inputEntrada = document.getElementById('tab-fin-entrada');

    let d = new Date(); d.setMonth(d.getMonth() + 1);
    const dataMesQueVem = formatarDataISO(d);

    if (tipo === 'avista') {
        boxEntrada.classList.remove('hidden'); boxParcelamento.classList.add('hidden');
        inputEntrada.value = formataDinheiro(valoresFinais.total); inputEntrada.readOnly = true;
        inputEntrada.classList.add('bg-slate-100', 'cursor-not-allowed'); inputEntrada.classList.remove('bg-white');
    } else if (tipo === 'entrada_parcela') {
        boxEntrada.classList.remove('hidden'); boxParcelamento.classList.remove('hidden');
        inputEntrada.readOnly = false; inputEntrada.value = ''; 
        inputEntrada.classList.remove('bg-slate-100', 'cursor-not-allowed'); inputEntrada.classList.add('bg-white');
        document.getElementById('tab-fin-vencimento-base').value = dataMesQueVem;
    } else if (tipo === 'parcelado') {
        boxEntrada.classList.add('hidden'); boxParcelamento.classList.remove('hidden');
        inputEntrada.value = '0,00';
        document.getElementById('tab-fin-vencimento-base').value = dataMesQueVem;
    }
    window.gerarLinhasParcelasTab();
}

window.gerarLinhasParcelasTab = function() {
    const tipo = document.getElementById('tab-fin-tipo').value;
    let entrada = (tipo === 'avista') ? valoresFinais.total : ((tipo === 'parcelado') ? 0 : reverterMoeda(document.getElementById('tab-fin-entrada').value) || 0);
    let restante = valoresFinais.total - entrada; if(restante < 0) restante = 0;

    const divSimulacao = document.getElementById('tab-fin-simulacao');
    if (tipo === 'avista' || restante === 0) {
        divSimulacao.innerHTML = `<div class="p-3 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-xl text-center"><i class="ph-bold ph-check-circle mr-1"></i> A Entrada cobre 100% da O.S. Nenhuma parcela extra será gerada.</div>`;
        document.getElementById('tab-fin-parcelas').disabled = true;
        
        document.getElementById('fin-aba-soma').innerText = formataDinheiro(entrada);
        atualizarPlacarAuditoria(entrada, 'btn-salvar-fin-tab');
        return;
    }

    document.getElementById('tab-fin-parcelas').disabled = false;
    const numDigitado = parseInt(document.getElementById('tab-fin-parcelas').value);
    const parcelas = Math.max(1, isNaN(numDigitado) ? 1 : numDigitado);
    const dataBaseStr = document.getElementById('tab-fin-vencimento-base').value;
    
    let html = ''; let dataBase = dataBaseStr ? new Date(dataBaseStr + 'T12:00:00Z') : new Date();
    let centavosTotal = Math.round(restante * 100);
    let centavosPorParcela = Math.floor(centavosTotal / parcelas);
    let restoCentavos = centavosTotal % parcelas;

    const activeEl = document.activeElement;
    const apenasAtualizar = (activeEl && (activeEl.id === 'tab-fin-entrada' || activeEl.id === 'tab-fin-parcelas') && divSimulacao.children.length === parcelas);

    let somaGerada = entrada;

    for(let i=1; i<=parcelas; i++) {
        let valorParc = (centavosPorParcela + (i <= restoCentavos ? 1 : 0)) / 100;
        somaGerada += valorParc;
        let d = new Date(dataBase); d.setMonth(d.getMonth() + (i - 1)); let dateVal = formatarDataISO(d);

        if (apenasAtualizar) {
            const inputParc = document.getElementById(`tab-parc-val-${i}`);
            if (inputParc) inputParc.value = valorParaInput(valorParc);
        } else {
            html += `
            <div class="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <span class="font-black text-[10px] md:text-xs text-blue-600 w-16 uppercase">Parc ${i}/${parcelas}</span>
                <input type="text" id="tab-parc-val-${i}" onkeyup="mascaraMoeda(this); window.checarSomaGeradorTab()" value="${valorParaInput(valorParc)}" class="w-24 border border-slate-300 p-2 rounded-lg text-xs font-black text-slate-800 outline-none focus:border-emerald-500">
                <input type="date" id="tab-parc-data-${i}" value="${dateVal}" class="flex-1 border border-slate-300 p-2 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-500">
                <select id="tab-parc-forma-${i}" class="flex-1 border border-slate-300 p-2 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer">
                    <option value="Cartão de Crédito" selected>Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Pix">Pix</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Dinheiro">Dinheiro Físico</option>
                    <option value="Transferência">Transferência Bancária</option>
                </select>
            </div>`;
        }
    }
    
    if (!apenasAtualizar) {
        divSimulacao.innerHTML = html;
    }
    
    document.getElementById('fin-aba-soma').innerText = formataDinheiro(somaGerada);
    atualizarPlacarAuditoria(somaGerada, 'btn-salvar-fin-tab');
}

async function processarLancarFinanceiroTab() {
    const tipo = document.getElementById('tab-fin-tipo').value;
    const total = valoresFinais.total;
    const entrada = (tipo === 'avista') ? total : ((tipo === 'parcelado') ? 0 : reverterMoeda(document.getElementById('tab-fin-entrada').value) || 0);
    const formaEntrada = document.getElementById('tab-fin-forma-entrada').value;
    const dataAtualStr = formatarDataISO(new Date()); 
    const parcelas = (tipo === 'avista') ? 0 : Math.max(1, parseInt(document.getElementById('tab-fin-parcelas').value) || 1);
    const cliente = document.getElementById('db-cliente-nome').value;

    let somaParcelas = entrada;
    if(tipo !== 'avista') {
        for(let i=1; i<=parcelas; i++) somaParcelas += reverterMoeda(document.getElementById(`tab-parc-val-${i}`).value) || 0;
        if (Math.abs(somaParcelas - total) > 0.05) { dispararAlerta("As parcelas não batem com o saldo da O.S.", "erro"); return; }
    }
    
    const btnSalvar = document.getElementById('btn-salvar-fin-tab');
    btnSalvar.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-xl"></i> Gerando...';
    btnSalvar.disabled = true;

    let records = [];
    if(entrada > 0) {
        records.push({
            descricao: `Acerto Imediato O.S #${osEmEdicaoNumero} - ${cliente}`,
            categoria: 'Serviços O.S', valor: entrada,
            data_vencimento: dataAtualStr, status: 'Pago', data_pagamento: dataAtualStr, forma_pagamento: formaEntrada
        });
    }

    if (parcelas > 0) {
        for(let i=1; i<=parcelas; i++) {
            records.push({
                descricao: `Parcela ${i}/${parcelas} O.S #${osEmEdicaoNumero} - ${cliente}`,
                categoria: 'Serviços O.S',
                valor: reverterMoeda(document.getElementById(`tab-parc-val-${i}`).value),
                data_vencimento: document.getElementById(`tab-parc-data-${i}`).value,
                status: 'Pendente', forma_pagamento: document.getElementById(`tab-parc-forma-${i}`).value
            });
        }
    }

    try {
        const clienteObj = globalClientes.find(c => c.nome === cliente) || {};
        const veiculoObj = globalVeiculos.find(v => v.placa === document.getElementById('db-veiculo-placa').value) || {};
        const payloadJSONB = { lista_itens: itensTemporarios, resumo: valoresFinais, cliente_dados: clienteObj, veiculo_dados: veiculoObj };
        
        const { error: errOS } = await window.banco.from('orcamentos').update({ status: 'Fechado', itens: payloadJSONB }).eq('id', osEmEdicaoId);
        if(errOS) throw errOS;

        if (records.length > 0) await window.banco.from('contas_receber').insert(records);
        
        dispararAlerta("O.S Faturada com sucesso!", "sucesso");
        alternarSubTelaOrcamento('lista');
    } catch (e) { dispararAlerta("Erro ao faturar no banco."); } 
    finally { btnSalvar.innerHTML = '<i class="ph-bold ph-check-circle text-xl"></i> Gerar Faturamento e Fechar O.S'; btnSalvar.disabled = false; }
}

async function salvarFinanceiroEditado() {
    const btnSalvar = document.getElementById('btn-salvar-fin-edicao');
    btnSalvar.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-lg"></i> Salvando...';
    btnSalvar.disabled = true;

    try {
        let snap = { entrada: 0, forma_entrada: '', data_entrada: '', parcelas: [] };
        
        for(let i=0; i<currentOSFinanceiro.length; i++) {
            const rec = currentOSFinanceiro[i];
            const isPago = rec.status === 'Pago' || rec.categoria === 'Adiantamento';
            
            const inputVal = document.getElementById(`edit-rec-val-${i}`);
            const inputData = document.getElementById(`edit-rec-data-${i}`);
            const inputForma = document.getElementById(`edit-rec-forma-${i}`);
            
            const valorCorreto = inputVal ? reverterMoeda(inputVal.value) : rec.valor;
            const dataCorreta = inputData ? inputData.value : rec.data_vencimento;
            const formaCorreta = inputForma ? inputForma.value : rec.forma_pagamento;

            if (!isPago && inputVal && inputData && inputForma) {
                await window.banco.from('contas_receber').update({ 
                    valor: valorCorreto, 
                    data_vencimento: dataCorreta, 
                    forma_pagamento: formaCorreta 
                }).eq('id', rec.id);
            }

            if (rec.categoria === 'Adiantamento' || rec.descricao.includes('Acerto Imediato')) {
                snap.entrada += valorCorreto;
                snap.forma_entrada = formaCorreta;
                snap.data_entrada = dataCorreta;
            } else {
                snap.parcelas.push({ numero: snap.parcelas.length + 1, valor: valorCorreto, data_vencimento: dataCorreta, forma_pagamento: formaCorreta });
            }
        }

        const { data: oldOrc } = await window.banco.from('orcamentos').select('itens').eq('id', osEmEdicaoId).single();
        if (oldOrc && oldOrc.itens) {
            oldOrc.itens.financeiro = snap;
            await window.banco.from('orcamentos').update({ itens: oldOrc.itens }).eq('id', osEmEdicaoId);
        }

        dispararAlerta("Lançamentos financeiros salvos e atualizados!", "sucesso");
        await recarregarFinanceiroDaOS();
    } catch(e) { 
        dispararAlerta("Erro ao salvar o financeiro no banco."); 
    } finally {
        btnSalvar.innerHTML = '<i class="ph-bold ph-floppy-disk text-lg"></i> SALVAR FINANCEIRO';
        btnSalvar.disabled = false;
    }
}

async function excluirParcelaManual(id) {
    if(!confirm("Atenção: Deseja excluir este lançamento definitivamente?")) return;
    try {
        const { error } = await window.banco.from('contas_receber').delete().eq('id', id);
        if (error) throw error;
        dispararAlerta("Parcela excluída com sucesso.", "sucesso");
        await recarregarFinanceiroDaOS();
    } catch(e) { dispararAlerta("Erro ao excluir."); }
}

async function adicionarNovaParcelaManual() {
    const cliente = document.getElementById('db-cliente-nome').value;
    if(!cliente) { dispararAlerta("Defina um cliente na aba 'Detalhes da O.S.' primeiro."); return; }
    
    let somaAtual = 0;
    currentOSFinanceiro.forEach((r, idx) => {
        const inputVal = document.getElementById(`edit-rec-val-${idx}`);
        if(inputVal) somaAtual += reverterMoeda(inputVal.value);
        else somaAtual += r.valor;
    });
    
    let valorSugerido = valoresFinais.total - somaAtual;
    if(valorSugerido < 0) valorSugerido = 0;

    const novaParcela = {
        descricao: `Parcela O.S #${osEmEdicaoNumero} - ${cliente}`,
        categoria: 'Serviços O.S',
        valor: parseFloat(valorSugerido.toFixed(2)),
        data_vencimento: formatarDataISO(new Date()),
        status: 'Pendente',
        forma_pagamento: 'Cartão de Crédito'
    };

    try {
        const { error } = await window.banco.from('contas_receber').insert([novaParcela]);
        if (error) throw error;
        dispararAlerta("Lançamento extra inserido na lista.", "sucesso");
        await recarregarFinanceiroDaOS();
    } catch(e) { dispararAlerta("Erro ao criar lançamento extra."); }
}

async function limparFinanceiroAtual() {
    if(!confirm("Atenção: Isso apagará todas as parcelas atuais desta O.S para que você gere o financeiro novamente do zero. Continuar?")) return;
    try {
        await window.banco.from('contas_receber').delete().like('descricao', `%O.S #${osEmEdicaoNumero}%`);
        
        const { data: oldOrc } = await window.banco.from('orcamentos').select('itens').eq('id', osEmEdicaoId).single();
        if (oldOrc && oldOrc.itens) {
            delete oldOrc.itens.financeiro;
            await window.banco.from('orcamentos').update({ itens: oldOrc.itens }).eq('id', osEmEdicaoId);
        }
        
        currentOSFinanceiro = [];
        renderizarAbaFinanceiro();
        dispararAlerta("Financeiro estornado. Pode gerar novamente.", "sucesso");
    } catch(e) { dispararAlerta("Erro ao limpar financeiro"); }
}

// ----------------------------------------------------
// TELA E REGRAS DE TRAVA
// ----------------------------------------------------
function verificarStatusFinanceiro() {
    const status = document.getElementById('db-status').value;
    const badgeFechada = document.getElementById('badge-os-fechada');
    const abaFinBtn = document.getElementById('aba-fin');
    
    const isTravadoLocalmente = (status === 'Fechado' && !window.isOSDestravada) || window.isVisualizacaoModo;

    if (isTravadoLocalmente) {
        if(badgeFechada) {
            badgeFechada.classList.remove('hidden');
            if (window.isVisualizacaoModo) {
                badgeFechada.innerHTML = '<i class="ph-fill ph-eye text-lg"></i><span class="text-xs font-black uppercase tracking-wider hidden md:block">Modo Visualização</span>';
                badgeFechada.className = "bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm";
            } else {
                badgeFechada.innerHTML = '<i class="ph-fill ph-lock-key text-lg"></i><span class="text-xs font-black uppercase tracking-wider hidden md:block">Fechada / Leitura</span>';
                badgeFechada.className = "bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm";
            }
        }
        congelarCamposOS(true);
    } else {
        congelarCamposOS(false);
        if(badgeFechada) badgeFechada.classList.add('hidden');
    }
    
    if (status === 'Finalizado' || status === 'Fechado' || currentOSFinanceiro.length > 0) {
        abaFinBtn.classList.remove('hidden');
    } else {
        abaFinBtn.classList.add('hidden');
        if(!window.isVisualizacaoModo) mudarAbaOS('dados'); 
    }
}

function congelarCamposOS(travar) {
    const campos = ['db-cliente-nome', 'db-veiculo-placa', 'item-tipo', 'item-nome', 'item-qtd', 'item-val', 'item-desc', 'db-obs', 'desc-tipo', 'desc-val', 'desc-alvo', 'db-status'];
    campos.forEach(id => { const el = document.getElementById(id); if(el) el.disabled = travar; });

    const botoesAcao = document.querySelectorAll('#box-add-item button, #box-desconto input, #box-upload-fotos input, #btn-salvar-db');
    botoesAcao.forEach(btn => btn.disabled = travar);
    
    const btnSalvarObj = document.getElementById('btn-salvar-db');
    if(btnSalvarObj) {
        if(travar) btnSalvarObj.classList.add('opacity-50', 'cursor-not-allowed');
        else btnSalvarObj.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    
    const botoesCadRapido = document.querySelectorAll('.btn-cad-rapido');
    botoesCadRapido.forEach(btn => btn.style.display = travar ? 'none' : 'block');
    
    const camposFinEdit = document.querySelectorAll('#fin-editor-box input, #fin-editor-box select');
    camposFinEdit.forEach(el => el.disabled = travar);
}

function alternarSubTelaOrcamento(modo) {
    const viewLista = document.getElementById('view-lista-orcamentos');
    const viewNovo = document.getElementById('view-novo-orcamento');

    if (modo === 'novo') {
        osEmEdicaoId = null; 
        osEmEdicaoNumero = null;
        currentOSFinanceiro = []; 
        window.isOSDestravada = false;
        window.isVisualizacaoModo = false;
        
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
        mudarAbaOS('dados'); 
        
        viewLista.classList.add('hidden');
        viewNovo.classList.remove('hidden');
    } else {
        viewNovo.classList.add('hidden');
        viewLista.classList.remove('hidden');
        window.isOSDestravada = false;
        window.isVisualizacaoModo = false;
        buscarOrcamentosSupabase();
    }
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
    
    if(!document.getElementById('aba-conteudo-fin').classList.contains('hidden')){
        if(currentOSFinanceiro.length > 0) {
            window.checarSomaFinanceiroEdit();
        } else if (document.getElementById('fin-gerador-box') && !document.getElementById('fin-gerador-box').classList.contains('hidden')) {
            window.checarSomaGeradorTab();
        }
    }
}

function atualizarInterfaceItensETotais() {
    const divLista = document.getElementById('lista-itens-db');
    if (itensTemporarios.length === 0) {
        divLista.innerHTML = `<div class="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200"><i class="ph-fill ph-package text-3xl text-slate-300 mb-2"></i><p class="text-[10px] md:text-xs text-slate-400 uppercase font-bold tracking-wider">Nenhum item adicionado à O.S.</p></div>`;
    } else {
        const isTravadoGeral = (document.getElementById('db-status').value === 'Fechado' && !window.isOSDestravada) || window.isVisualizacaoModo;
        
        divLista.innerHTML = itensTemporarios.map(item => {
            let badgeClass = item.tipo === 'Peça' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200';
            let HTMLdetalhe = item.detalhe ? `<p class="text-xs text-slate-500 mt-1 italic pl-1"><i class="ph-fill ph-info text-blue-400 mr-1"></i>${item.detalhe}</p>` : '';
            
            let acoes = isTravadoGeral ? '' : `
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
    
    const finPecas = document.getElementById('fin-resumo-pecas');
    if(finPecas) finPecas.innerText = formataDinheiro(valoresFinais.pecas);
    const finServicos = document.getElementById('fin-resumo-servicos');
    if(finServicos) finServicos.innerText = formataDinheiro(valoresFinais.servicos);
    const finDesc = document.getElementById('fin-resumo-desc');
    if(finDesc) finDesc.innerText = `- ${formataDinheiro(valoresFinais.desconto)}`;
    const finTotalOs = document.getElementById('fin-aba-total-os');
    if(finTotalOs) finTotalOs.innerText = formataDinheiro(valoresFinais.total);
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
    
    const isTravadoGeral = (document.getElementById('db-status').value === 'Fechado' && !window.isOSDestravada) || window.isVisualizacaoModo;

    imagensUploadArray.forEach(base64Str => {
        const imgBox = document.createElement('div');
        imgBox.className = "w-20 h-20 rounded-xl overflow-hidden shadow-sm border border-slate-200 relative group";
        
        let trashIcon = isTravadoGeral ? '' : `<div class="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all cursor-pointer" onclick="removerImagemArray('${base64Str}')"><i class="ph-bold ph-trash text-white text-xl"></i></div>`;
        
        imgBox.innerHTML = `<img src="${base64Str}" class="w-full h-full object-cover">${trashIcon}`;
        previewContainer.appendChild(imgBox);
    });
}

function removerImagemArray(strToRem) { 
    imagensUploadArray = imagensUploadArray.filter(i => i !== strToRem); 
    renderizarPreviewFotos(); 
}

// -----------------------------------------------------------------------------------
// COMUNICAÇÃO COM O BANCO E LISTAGEM
// -----------------------------------------------------------------------------------
async function buscarOrcamentosSupabase() {
    try {
        const { data: orcamentos, error } = await window.banco.from('orcamentos').select('*').order('id', { ascending: false });
        if (error) throw error;
        renderizarTabelaReal(orcamentos);
    } catch (erro) {
        console.error("Erro no Supabase:", erro);
        document.getElementById('tabela-orcamentos-real').innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500 font-bold bg-red-50">Falha de conexão com o servidor.</td></tr>`;
    }
}

async function salvarOrcamentoReal() {
    const nome = document.getElementById('db-cliente-nome').value;
    const placa = document.getElementById('db-veiculo-placa').value;
    const status = document.getElementById('db-status').value;
    const obs = document.getElementById('db-obs').value;

    if (!nome || !placa) { dispararAlerta("Cliente e Placa são obrigatórios."); return; }
    if (itensTemporarios.length === 0) { dispararAlerta("A O.S precisa de peças ou serviços."); return; }

    if (currentOSFinanceiro.length > 0) {
        let somaF = 0; currentOSFinanceiro.forEach(r => somaF += r.valor);
        if (Math.abs(valoresFinais.total - somaF) > 0.05) {
            dispararAlerta("O valor da O.S mudou. Ajuste as parcelas na aba 'Gestão Financeira' para a conta fechar!", "erro");
            mudarAbaOS('fin');
            return;
        }
    }

    const btnSalvar = document.getElementById('btn-salvar-db');
    btnSalvar.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-xl"></i> SALVANDO...';
    btnSalvar.disabled = true;

    try {
        const clienteObj = globalClientes.find(c => c.nome === nome) || {};
        const veiculoObj = globalVeiculos.find(v => v.placa === placa) || {};
        const payloadJSONB = { lista_itens: itensTemporarios, resumo: valoresFinais, cliente_dados: clienteObj, veiculo_dados: veiculoObj };

        if (osEmEdicaoId) {
            const { data: oldOrc } = await window.banco.from('orcamentos').select('itens').eq('id', osEmEdicaoId).single();
            if (oldOrc && oldOrc.itens && oldOrc.itens.financeiro) {
                payloadJSONB.financeiro = oldOrc.itens.financeiro;
            }

            const { error } = await window.banco.from('orcamentos').update({ cliente_nome: nome, veiculo_placa: placa, valor_total: valoresFinais.total, status: status, observacao: obs, anexos: imagensUploadArray, itens: payloadJSONB }).eq('id', osEmEdicaoId);
            if (error) throw error;
            
            dispararAlerta("O.S atualizada com sucesso!", "sucesso");
            alternarSubTelaOrcamento('lista');
        } else {
            const { error } = await window.banco.from('orcamentos').insert([{ cliente_nome: nome, veiculo_placa: placa, valor_total: valoresFinais.total, status: status, observacao: obs, anexos: imagensUploadArray, itens: payloadJSONB }]);
            if (error) throw error;
            dispararAlerta("O.S salva! Vá em 'Gestão Financeira' se desejar faturar agora.", "sucesso");
            alternarSubTelaOrcamento('lista');
        }
    } catch (erro) { dispararAlerta("Falha de comunicação com o servidor."); } 
    finally { btnSalvar.innerHTML = '<i class="ph-bold ph-floppy-disk text-xl"></i> SALVAR O.S.'; btnSalvar.disabled = false; }
}

async function abrirEdicaoOS(dadosCodificados, abaAlvo = 'dados', isVisualizacao = false) {
    const orc = JSON.parse(decodeURIComponent(dadosCodificados));
    osEmEdicaoId = orc.id;
    osEmEdicaoNumero = orc.numero_os; 
    window.isVisualizacaoModo = isVisualizacao;
    if (isVisualizacao) window.isOSDestravada = false;
    
    document.getElementById('titulo-tela-os').innerText = `O.S. #${orc.numero_os}`;
    
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
    
    if(imagensUploadArray.length > 0) { document.getElementById('preview-anexos').classList.remove('hidden'); renderizarPreviewFotos(); }

    const descValor = orc.itens?.resumo?.desconto || 0;
    if (descValor > 0) {
        document.getElementById('desc-tipo').value = 'val';
        const descInput = document.getElementById('desc-val');
        descInput.value = (descValor * 100).toString(); mascaraMoeda(descInput);
    } else { document.getElementById('desc-val').value = ''; }

    calcularTotais();
    
    await recarregarFinanceiroDaOS();
    verificarStatusFinanceiro(); 
    
    document.getElementById('view-lista-orcamentos').classList.add('hidden');
    document.getElementById('view-novo-orcamento').classList.remove('hidden');
    
    mudarAbaOS(abaAlvo); 
}

window.abrirVisualizacaoOS = function(dadosCodificados) {
    abrirEdicaoOS(dadosCodificados, 'dados', true);
}

function abrirFaturamentoDireto(dadosCodificados) {
    abrirEdicaoOS(dadosCodificados, 'fin', false);
}

// ----------------------------------------------------
// CADASTRO RÁPIDO E VIA CEP
// ----------------------------------------------------
function abrirModalCadastro(tipo) {
    modalTipoAberto = tipo;
    const modal = document.getElementById('modal-cadastro-rapido'); 
    const titulo = document.getElementById('modal-titulo'); 
    const conteudo = document.getElementById('modal-conteudo');
    const btnSalvar = document.querySelector('#modal-cadastro-rapido button:last-child');
    
    if (tipo === 'cliente') {
        titulo.innerHTML = '<i class="ph-bold ph-user-plus mr-2"></i>Cadastrar Novo Cliente';
        btnSalvar.innerHTML = '<i class="ph-bold ph-check"></i> Salvar Cliente';
        conteudo.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="md:col-span-2">
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome Completo <span class="text-red-500 text-sm">*</span></label>
                <input type="text" id="cad-nome" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-bold text-slate-800">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">CPF</label>
                <input type="text" id="cad-doc" onkeyup="mascaraGeral('cpf', this)" maxlength="14" placeholder="000.000.000-00" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium text-slate-800">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Celular / WhatsApp <span class="text-red-500 text-sm">*</span></label>
                <input type="text" id="cad-tel" onkeyup="mascaraGeral('tel', this)" maxlength="15" placeholder="(00) 00000-0000" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
            </div>
            <div class="md:col-span-2">
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">E-mail</label>
                <input type="email" id="cad-email" placeholder="cliente@email.com" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
            </div>
            <div class="md:col-span-2 border-t border-slate-100 pt-3 mt-1">
                <label class="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase mb-1"><span>CEP</span><span id="cep-status" class="hidden text-[9px]"></span></label>
                <input type="text" id="cad-cep" onkeyup="mascaraGeral('cep', this)" onblur="buscarCEP(this.value)" maxlength="9" placeholder="00000-000" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-bold text-slate-700">
            </div>
            <div class="md:col-span-2 flex gap-2">
                <div class="flex-1">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Endereço (Rua/Av)</label>
                    <input type="text" id="cad-rua" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-100 outline-none">
                </div>
                <div class="w-20">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Número</label>
                    <input type="text" id="cad-num" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-bold">
                </div>
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bairro</label>
                <input type="text" id="cad-bairro" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-100 outline-none">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cidade / UF</label>
                <input type="text" id="cad-cidade" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-100 outline-none">
            </div>
        </div>`;
    } else {
        titulo.innerHTML = '<i class="ph-bold ph-jeep mr-2"></i>Cadastrar Novo Veículo';
        btnSalvar.innerHTML = '<i class="ph-bold ph-check"></i> Salvar Veículo';
        
        let optionsDono = '<option value="">Sem vínculo / Selecione o Proprietário...</option>';
        const clienteOS = document.getElementById('db-cliente-nome').value;
        globalClientes.forEach(c => {
            const selected = (c.nome === clienteOS) ? 'selected' : '';
            optionsDono += `<option value="${c.nome}" ${selected}>${c.nome}</option>`;
        });

        conteudo.innerHTML = `
        <div class="space-y-4">
            <div class="border-b border-slate-100 pb-4 mb-2">
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dono / Proprietário do Veículo</label>
                <select id="cad-dono" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-bold text-slate-800 cursor-pointer transition">
                    ${optionsDono}
                </select>
                <p class="text-[9px] text-slate-400 mt-1 italic">* Puxa automaticamente o cliente selecionado na O.S.</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div class="col-span-2 md:col-span-1">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Placa (Padrão ou Mercosul) <span class="text-red-500 text-sm">*</span></label>
                    <input type="text" id="cad-placa" onkeyup="mascaraGeral('placa', this)" maxlength="8" placeholder="ABC-1234" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-black uppercase text-blue-700">
                </div>
                <div class="col-span-2 md:col-span-1">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome / Modelo <span class="text-red-500 text-sm">*</span></label>
                    <input type="text" id="cad-modelo" placeholder="Ex: Fiat Toro" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
                </div>
            </div>
            <div class="grid grid-cols-3 gap-3">
                <div class="col-span-2">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cor</label>
                    <input type="text" id="cad-cor" placeholder="Ex: Branco" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ano</label>
                    <input type="number" id="cad-ano" placeholder="2024" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
                </div>
            </div>
        </div>`;
    }
    document.body.style.overflow = 'hidden'; 
    modal.classList.remove('hidden');
}

function fecharModalCadastro() { 
    document.body.style.overflow = 'auto'; 
    document.getElementById('modal-cadastro-rapido').classList.add('hidden'); 
}

async function buscarCEP(cepInput) {
    const cep = cepInput.replace(/\D/g, '');
    if (cep.length !== 8) return;

    const statusSpan = document.getElementById('cep-status');
    if(statusSpan) {
        statusSpan.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Buscando...';
        statusSpan.className = 'text-[9px] text-blue-500 uppercase';
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await response.json();
        
        if (!dados.erro) {
            document.getElementById('cad-rua').value = dados.logradouro;
            document.getElementById('cad-bairro').value = dados.bairro;
            document.getElementById('cad-cidade').value = `${dados.localidade} / ${dados.uf}`;
            document.getElementById('cad-num').focus();
            
            if(statusSpan) {
                statusSpan.innerHTML = '<i class="ph-bold ph-check"></i> Encontrado';
                statusSpan.className = 'text-[9px] text-emerald-500 uppercase';
                setTimeout(() => statusSpan.classList.add('hidden'), 2500);
            }
        } else {
            dispararAlerta("CEP não encontrado.");
            if(statusSpan) { statusSpan.innerHTML = '<i class="ph-bold ph-x"></i> Inválido'; statusSpan.className = 'text-[9px] text-red-500 uppercase'; }
        }
    } catch (e) { 
        dispararAlerta("Falha ao buscar CEP.");
        if(statusSpan) statusSpan.classList.add('hidden');
    }
}

async function processarSalvamentoModal() {
    const btnSalvar = document.querySelector('#modal-cadastro-rapido button:last-child');
    const textoOriginal = modalTipoAberto === 'cliente' ? '<i class="ph-bold ph-check"></i> Salvar Cliente' : '<i class="ph-bold ph-check"></i> Salvar Veículo';
    btnSalvar.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Salvando...';
    btnSalvar.disabled = true;

    try {
        if (modalTipoAberto === 'cliente') {
            const nome = document.getElementById('cad-nome').value;
            const doc = document.getElementById('cad-doc').value;
            const tel = document.getElementById('cad-tel').value;
            const email = document.getElementById('cad-email').value;
            const cep = document.getElementById('cad-cep').value;
            const rua = document.getElementById('cad-rua').value;
            const num = document.getElementById('cad-num').value;
            const bairro = document.getElementById('cad-bairro').value;
            const cidade = document.getElementById('cad-cidade').value;

            if(!nome || !tel) { dispararAlerta("Nome e Celular são obrigatórios."); return; }
            
            const { error } = await window.banco.from('clientes').insert([{ nome, documento: doc, telefone: tel, email, cep, endereco: rua, numero: num, bairro, cidade }]);
            if (error) throw error;
            
            await carregarListasBD(); 
            document.getElementById('db-cliente-nome').value = nome; 
            dispararAlerta("Cliente salvo no banco com sucesso!", "sucesso");
        } else {
            const placa = document.getElementById('cad-placa').value;
            const modelo = document.getElementById('cad-modelo').value;
            const cor = document.getElementById('cad-cor').value;
            const ano = document.getElementById('cad-ano').value;
            
            if(!placa || !modelo) { dispararAlerta("Placa e Modelo obrigatórios."); return; }
            
            const dono = document.getElementById('cad-dono').value || '';
            
            const { error } = await window.banco.from('veiculos').insert([{ placa, modelo, cor, ano, dono_nome: dono }]);
            if (error) throw error;
            
            await carregarListasBD(); 
            document.getElementById('db-veiculo-placa').value = placa; 
            if(dono) document.getElementById('db-cliente-nome').value = dono; 
            
            dispararAlerta("Veículo salvo no banco com sucesso!", "sucesso");
        }
        fecharModalCadastro();
    } catch (erro) {
        if(erro.code === '23505') dispararAlerta("Este registro (Placa ou Documento) já existe no banco.");
        else dispararAlerta("Falha ao salvar no banco de dados.");
    } finally {
        btnSalvar.innerHTML = textoOriginal;
        btnSalvar.disabled = false;
    }
}

// ----------------------------------------------------
// MOTOR DE IMPRESSÃO - PDF ISOLADO
// ----------------------------------------------------
window.gerarPDFSupabase = function(dadosCodificados) {
    const orc = JSON.parse(decodeURIComponent(dadosCodificados));
    
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

    const itensReais = orc.itens?.lista_itens || [];
    let calcPecas = 0; let calcServicos = 0;
    const pecas = itensReais.filter(i => i.tipo === 'Peça');
    const servicos = itensReais.filter(i => i.tipo === 'Serviço');
    itensReais.forEach(i => { if(i.tipo==='Peça') calcPecas+=i.subtotal; else calcServicos+=i.subtotal; });
    const calcDesc = orc.itens?.resumo?.desconto || 0;
    const calcTotal = (calcPecas + calcServicos) - calcDesc;
    
    let htmlTabela = `<table style="width: 100%; text-align: left; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">`;
    htmlTabela += `<thead style="background-color: #000000; color: white;"><tr><th style="padding: 6px 10px; width: 10%; border-top-left-radius: 4px;">Tipo</th><th style="padding: 6px 10px; width: 5%;">Qtd</th><th style="padding: 6px 10px; width: 45%;">Descrição Serviço / Peça</th><th style="padding: 6px 10px; text-align: right; width: 20%;">V. Unitário</th><th style="padding: 6px 10px; text-align: right; width: 20%; border-top-right-radius: 4px;">Subtotal</th></tr></thead><tbody>`;
    
    if(pecas.length > 0) {
        htmlTabela += `<tr><td colspan="5" style="background-color: #F3F4F6; font-weight: bold; padding: 6px 10px; color: #000000; text-transform: uppercase; font-size: 10px; border-bottom: 1px solid #D1D5DB;">1. Peças e Componentes</td></tr>`;
        htmlTabela += pecas.map(i => `<tr><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">${i.tipo}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #000000;">${i.quantidade}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB;"><div style="font-weight: bold; color: #000000;">${i.descricao}</div>${i.detalhe ? `<div style="font-size: 9px; color: #4B5563; font-style: italic; margin-top: 1px;">Obs: ${i.detalhe}</div>` : ''}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; color: #000000;">${formataDinheiro(i.valor_unitario)}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #000000;">${formataDinheiro(i.subtotal)}</td></tr>`).join('');
    }
    if(servicos.length > 0) {
        htmlTabela += `<tr><td colspan="5" style="background-color: #F3F4F6; font-weight: bold; padding: 6px 10px; color: #000000; text-transform: uppercase; font-size: 10px; border-top: 1px solid #000000; border-bottom: 1px solid #D1D5DB;">2. Mão de Obra e Serviços</td></tr>`;
        htmlTabela += servicos.map(i => `<tr><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">${i.tipo}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #000000;">${i.quantidade}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB;"><div style="font-weight: bold; color: #000000;">${i.descricao}</div>${i.detalhe ? `<div style="font-size: 9px; color: #4B5563; font-style: italic; margin-top: 1px;">Obs: ${i.detalhe}</div>` : ''}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; color: #000000;">${formataDinheiro(i.valor_unitario)}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #000000;">${formataDinheiro(i.subtotal)}</td></tr>`).join('');
    }
    htmlTabela += `</tbody></table>`;
    document.getElementById('pdf-container-itens').innerHTML = htmlTabela;

    document.getElementById('pdf-tot-pecas').innerText = formataDinheiro(calcPecas);
    document.getElementById('pdf-tot-servicos').innerText = formataDinheiro(calcServicos);
    document.getElementById('pdf-tot-desc').innerText = `- ${formataDinheiro(calcDesc)}`;
    document.getElementById('pdf-tot-final').innerText = formataDinheiro(calcTotal);

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
    if (fin && (fin.entrada > 0 || (fin.parcelas && fin.parcelas.length > 0))) {
        let htmlFin = `<h3 style="font-size: 10px; color: #000000; text-transform: uppercase; margin: 0 0 6px 0; border-bottom: 1px solid #D1D5DB; padding-bottom: 4px; font-weight: bold;">Condições de Pagamento Combinadas</h3>`;
        htmlFin += `<table style="width: 100%; border-collapse: collapse; font-size: 10px;">`;
        if (fin.entrada > 0) {
            const dataEntradaBR = new Date(fin.data_entrada + 'T12:00:00Z').toLocaleDateString('pt-BR');
            htmlFin += `<tr><td style="padding: 4px; border-bottom: 1px dashed #e2e8f0;"><b>Acerto Imediato:</b> ${formataDinheiro(fin.entrada)} (Via ${fin.forma_entrada} em ${dataEntradaBR}) - <span style="font-weight: bold; color: #000000;">PAGO</span></td></tr>`;
        }
        if (fin.parcelas && fin.parcelas.length > 0) {
            fin.parcelas.forEach(p => {
                const dataBR = new Date(p.data_vencimento + 'T12:00:00Z').toLocaleDateString('pt-BR');
                htmlFin += `<tr><td style="padding: 4px; border-bottom: 1px dashed #e2e8f0;"><b>Parcela ${p.numero}/${fin.parcelas.length}:</b> ${formataDinheiro(p.valor)} - Vencimento: ${dataBR} (Via ${p.forma_pagamento})</td></tr>`;
            });
        }
        htmlFin += `</table>`;
        containerFin.innerHTML = htmlFin;
        containerFin.style.display = 'block';
    } else {
        containerFin.innerHTML = '';
        containerFin.style.display = 'none';
    }

    const el = document.getElementById('pdf-template-real');
    el.style.left = '0'; el.style.top = '0'; el.style.zIndex = '9999';

    html2pdf().set({ 
        margin: 0.3, filename: `OS_${orc.numero_os}.pdf`, image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } 
    }).from(el).outputPdf('bloburl').then((pdfUrl) => {
        window.open(pdfUrl, '_blank');
        el.style.left = '-9999px'; el.style.top = '-9999px';
    });
}
