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
let currentOSFinanceiro = []; // Memória viva das parcelas do banco

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

// -----------------------------------------------------------------------------------
// SISTEMA DE ABAS E RENDERIZAÇÃO FINANCEIRA
// -----------------------------------------------------------------------------------
function mudarAbaOS(aba) {
    const btnDados = document.getElementById('aba-dados');
    const btnFin = document.getElementById('aba-fin');
    const contDados = document.getElementById('aba-conteudo-dados');
    const contFin = document.getElementById('aba-conteudo-fin');
    const boxAuditoria = document.getElementById('box-auditoria-financeira');
    const boxDesconto = document.getElementById('box-desconto');

    if (aba === 'dados') {
        btnDados.className = 'pb-3 px-2 font-black text-blue-600 border-b-2 border-blue-600 transition-colors whitespace-nowrap text-sm';
        btnFin.className = 'pb-3 px-2 font-bold text-slate-400 border-b-2 border-transparent hover:text-slate-600 transition-colors whitespace-nowrap text-sm flex items-center gap-2';
        contDados.classList.remove('hidden');
        contFin.classList.add('hidden');
        boxAuditoria.classList.add('hidden');
        boxDesconto.classList.remove('hidden');
    } else {
        btnFin.className = 'pb-3 px-2 font-black text-emerald-600 border-b-2 border-emerald-600 transition-colors whitespace-nowrap text-sm flex items-center gap-2';
        btnDados.className = 'pb-3 px-2 font-bold text-slate-400 border-b-2 border-transparent hover:text-slate-600 transition-colors whitespace-nowrap text-sm';
        contFin.classList.remove('hidden');
        contDados.classList.add('hidden');
        boxAuditoria.classList.remove('hidden');
        boxDesconto.classList.add('hidden');
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

// A CHAVE DE OURO QUE FAZ A TELA APARECER
function renderizarAbaFinanceiro() {
    const boxBloqueado = document.getElementById('fin-bloqueado-box');
    const boxLiberado = document.getElementById('fin-liberado-box');
    const boxGerador = document.getElementById('fin-gerador-box');
    const boxEditor = document.getElementById('fin-editor-box');
    const btnRefazer = document.getElementById('btn-estornar-fin');
    const btnSalvarEdicao = document.getElementById('btn-salvar-fin-edicao');
    const subtitulo = document.getElementById('fin-aba-subtitulo');
    
    document.getElementById('fin-aba-total-os').innerText = formataDinheiro(valoresFinais.total);

    // REGRA 1: Se a O.S ainda não foi salva no banco
    if (!osEmEdicaoId) {
        boxBloqueado.classList.remove('hidden');
        boxLiberado.classList.add('hidden');
        if(btnSalvarEdicao) btnSalvarEdicao.classList.add('hidden');
        if(btnRefazer) btnRefazer.classList.add('hidden');
        return;
    }

    // REGRA 2: O.S salva. Libera o contêiner branco!
    boxBloqueado.classList.add('hidden');
    boxLiberado.classList.remove('hidden'); // ESTE É O COMANDO QUE FALTAVA NA SUA TELA BRANCA!

    if (!currentOSFinanceiro || currentOSFinanceiro.length === 0) {
        // TELA GERADORA
        boxGerador.classList.remove('hidden');
        boxEditor.classList.add('hidden');
        if(btnRefazer) btnRefazer.classList.add('hidden');
        if(btnSalvarEdicao) btnSalvarEdicao.classList.add('hidden');
        subtitulo.innerText = "Defina como o cliente vai pagar para gerar os boletos/parcelas.";
        
        document.getElementById('tab-fin-tipo').value = 'avista';
        mudarTipoFaturamentoTab();
    } else {
        // TELA EDITORA (Painel Vivo)
        boxGerador.classList.add('hidden');
        boxEditor.classList.remove('hidden');
        if(btnSalvarEdicao) btnSalvarEdicao.classList.remove('hidden');
        subtitulo.innerText = "Você pode alterar os valores, datas e meios de pagamento das parcelas abaixo.";
        
        const hasPago = currentOSFinanceiro.some(r => r.status === 'Pago' || r.categoria === 'Adiantamento');
        if (hasPago) {
            if(btnRefazer) btnRefazer.classList.add('hidden'); 
        } else {
            if(btnRefazer) btnRefazer.classList.remove('hidden'); 
        }
        
        const listaDiv = document.getElementById('lista-financeiro-vinculado');
        let html = '';
        const isOSFechada = document.getElementById('db-status').value === 'Fechado';

        currentOSFinanceiro.forEach((rec, idx) => {
            const isPago = rec.status === 'Pago' || rec.categoria === 'Adiantamento';
            const trancaGeral = isOSFechada ? 'disabled' : '';
            const trancaParaPago = isPago ? 'disabled' : trancaGeral;
            
            let iconeStatus = isPago ? `<span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center shadow-sm"><i class="ph-bold ph-check mr-1"></i> Liquidado</span>` : `<span class="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center shadow-sm"><i class="ph-bold ph-clock mr-1"></i> Pendente</span>`;
            
            const badgeTipo = rec.categoria === 'Adiantamento' || rec.descricao.includes('Acerto Imediato') ? 'Entrada / À Vista' : `Parcela ${rec.descricao.split(' ')[1] || (idx+1)}`;
            const corCard = isPago ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50';
            const trancaClasses = isPago ? 'bg-transparent border-transparent text-emerald-900' : 'border-slate-300 bg-white focus:border-blue-500 text-slate-800';

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
                            <option value="Dinheiro" ${rec.forma_pagamento === 'Dinheiro' ? 'selected' : ''}>Dinheiro</option>
                            <option value="Cartão de Débito" ${rec.forma_pagamento === 'Cartão de Débito' ? 'selected' : ''}>C. Débito</option>
                            <option value="Cartão de Crédito" ${rec.forma_pagamento === 'Cartão de Crédito' ? 'selected' : ''}>C. Crédito</option>
                            <option value="Boleto" ${rec.forma_pagamento === 'Boleto' ? 'selected' : ''}>Boleto</option>
                            <option value="Transferência" ${rec.forma_pagamento === 'Transferência' ? 'selected' : ''}>Transferência</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-slate-400 uppercase mb-1">Valor (R$)</label>
                        <input type="text" id="edit-rec-val-${idx}" onkeyup="mascaraMoeda(this)" onblur="checarSomaFinanceiroEdit()" value="${valorParaInput(rec.valor)}" ${trancaParaPago} class="w-full p-2.5 rounded-xl text-sm font-black outline-none border ${trancaClasses}">
                    </div>
                </div>
                ${!isPago && !isOSFechada ? `<div class="flex justify-end pt-2"><button onclick="excluirParcelaManual(${rec.id})" class="text-[10px] text-red-500 font-bold hover:underline flex items-center gap-1"><i class="ph-bold ph-trash"></i> Excluir Lançamento</button></div>` : ''}
            </div>`;
        });
        
        if (!isOSFechada) {
            html += `
            <div class="mt-4 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 border-dashed">
                 <p class="text-[10px] md:text-xs text-slate-500 font-medium">Você precisa adicionar uma parcela extra?</p>
                <button onclick="adicionarNovaParcelaManual()" class="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-slate-900 transition-transform transform active:scale-95 text-xs md:text-sm flex items-center gap-2"><i class="ph-bold ph-plus"></i> Novo Lançamento</button>
            </div>`;
        }

        listaDiv.innerHTML = html;
        checarSomaFinanceiroEdit();
    }
}

function atualizarPlacarAuditoria(somaFinanceiro) {
    const elSomaBox = document.getElementById('fin-aba-soma-box');
    const elAlerta = document.getElementById('fin-aba-alerta');
    const btnSalvar = document.getElementById('btn-salvar-fin-edicao');
    
    if (somaFinanceiro > 0 && Math.abs(valoresFinais.total - somaFinanceiro) > 0.05) {
        if(elSomaBox) elSomaBox.className = 'p-4 rounded-xl border transition-colors shadow-inner border-red-300 bg-red-50 text-red-600 text-center';
        if(elAlerta) elAlerta.classList.remove('hidden');
        if(btnSalvar) { btnSalvar.disabled = true; btnSalvar.classList.add('opacity-50', 'cursor-not-allowed'); }
    } else {
        if(elSomaBox) elSomaBox.className = 'p-4 rounded-xl border transition-colors shadow-inner border-emerald-300 bg-emerald-50 text-emerald-700 text-center';
        if(elAlerta) elAlerta.classList.add('hidden');
        if(btnSalvar) { btnSalvar.disabled = false; btnSalvar.classList.remove('opacity-50', 'cursor-not-allowed'); }
    }
}

window.checarSomaFinanceiroEdit = function() {
    let soma = 0;
    currentOSFinanceiro.forEach((rec, idx) => {
        const inputVal = document.getElementById(`edit-rec-val-${idx}`);
        if(inputVal) soma += reverterMoeda(inputVal.value);
        else soma += rec.valor;
    });
    
    document.getElementById('fin-aba-soma').innerText = formataDinheiro(soma);
    atualizarPlacarAuditoria(soma);
}

// ----------------------------------------------------
// AÇÕES DO EDITOR FINANCEIRO E GERADOR
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
    gerarLinhasParcelasTab();
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
        atualizarPlacarAuditoria(entrada);
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

    for(let i=1; i<=parcelas; i++) {
        let valorParc = (centavosPorParcela + (i <= restoCentavos ? 1 : 0)) / 100;
        let d = new Date(dataBase); d.setMonth(d.getMonth() + (i - 1)); let dateVal = formatarDataISO(d);

        html += `
        <div class="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <span class="font-black text-[10px] md:text-xs text-blue-600 w-16 uppercase">Parc ${i}/${parcelas}</span>
            <input type="text" id="tab-parc-val-${i}" onkeyup="mascaraMoeda(this)" onblur="ajustarParcelasManualmenteTab(${i})" value="${valorParaInput(valorParc)}" class="w-24 border border-slate-300 p-2 rounded-lg text-xs font-black text-slate-800 outline-none focus:border-emerald-500">
            <input type="date" id="tab-parc-data-${i}" value="${dateVal}" class="flex-1 border border-slate-300 p-2 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-500">
            <select id="tab-parc-forma-${i}" class="flex-1 border border-slate-300 p-2 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-500">
                <option value="Cartão de Crédito" selected>Cartão de Crédito</option>
                <option value="Boleto">Boleto</option>
                <option value="Pix">Pix</option>
            </select>
        </div>`;
    }
    divSimulacao.innerHTML = html;
    
    document.getElementById('fin-aba-soma').innerText = formataDinheiro(valoresFinais.total);
    atualizarPlacarAuditoria(valoresFinais.total);
}

window.ajustarParcelasManualmenteTab = function(index) {
    const parcelas = Math.max(1, parseInt(document.getElementById('tab-fin-parcelas').value) || 1);
    const entrada = (document.getElementById('tab-fin-tipo').value === 'parcelado') ? 0 : reverterMoeda(document.getElementById('tab-fin-entrada').value) || 0;
    const restante = valoresFinais.total - entrada;
    
    let somaAnteriores = 0;
    for(let i=1; i<=index; i++) { somaAnteriores += reverterMoeda(document.getElementById(`tab-parc-val-${i}`).value) || 0; }
    
    let restanteParaDistribuir = restante - somaAnteriores;
    if (restanteParaDistribuir < 0) {
        document.getElementById(`tab-parc-val-${index}`).value = valorParaInput(restante - (somaAnteriores - reverterMoeda(document.getElementById(`tab-parc-val-${index}`).value)));
        restanteParaDistribuir = 0;
    }
    
    const parcelasRestantes = parcelas - index;
    if (parcelasRestantes > 0) {
        let centavosRestantes = Math.round(restanteParaDistribuir * 100);
        let centavosPorParcela = Math.floor(centavosRestantes / parcelasRestantes);
        let restoCentavos = centavosRestantes % parcelasRestantes;

        for(let i = index + 1; i <= parcelas; i++) {
            let valorParc = (centavosPorParcela + ((i - index) <= restoCentavos ? 1 : 0)) / 100;
            document.getElementById(`tab-parc-val-${i}`).value = valorParaInput(valorParc);
        }
    }
}

async function processarLancarFinanceiroTab() {
    const tipo = document.getElementById('tab-fin-tipo').value;
    const total = valoresFinais.total;
    const entrada = (tipo === 'avista') ? total : ((tipo === 'parcelado') ? 0 : reverterMoeda(document.getElementById('tab-fin-entrada').value) || 0);
    const formaEntrada = document.getElementById('tab-fin-forma-entrada').value;
    const dataAtualStr = formatarDataISO(new Date()); 
    const parcelas = (tipo === 'avista') ? 0 : Math.max(1, parseInt(document.getElementById('tab-fin-parcelas').value) || 1);
    const cliente = document.getElementById('db-cliente-nome').value;

    let somaParcelas = 0;
    if(total - entrada > 0 && tipo !== 'avista') {
        for(let i=1; i<=parcelas; i++) somaParcelas += reverterMoeda(document.getElementById(`tab-parc-val-${i}`).value) || 0;
        if (Math.abs(somaParcelas - (total - entrada)) > 0.05) { dispararAlerta("As parcelas não batem com o saldo da O.S.", "erro"); return; }
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

    if (total - entrada > 0 && parcelas > 0) {
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

            // Se não está pago, atualiza direto no banco em tempo real
            if (!isPago && inputVal && inputData && inputForma) {
                await window.banco.from('contas_receber').update({ 
                    valor: valorCorreto, 
                    data_vencimento: dataCorreta, 
                    forma_pagamento: formaCorreta 
                }).eq('id', rec.id);
            }

            // Remonta o Snapshot interno para o PDF ficar espelhado
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

        dispararAlerta("Financeiro salvo e atualizado!", "sucesso");
        await recarregarFinanceiroDaOS();
    } catch(e) { 
        dispararAlerta("Erro ao salvar o financeiro."); 
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
        dispararAlerta("Parcela excluída.", "sucesso");
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
        dispararAlerta("Lançamento extra inserido.", "sucesso");
        await recarregarFinanceiroDaOS();
    } catch(e) { dispararAlerta("Erro ao criar lançamento extra."); }
}

async function limparFinanceiroAtual() {
    if(!confirm("Atenção: Isso apagará todas as parcelas atuais para que você gere o financeiro novamente do zero. Continuar?")) return;
    try {
        await window.banco.from('contas_receber').delete().like('descricao', `%O.S #${osEmEdicaoNumero}%`);
        
        const { data: oldOrc } = await window.banco.from('orcamentos').select('itens').eq('id', osEmEdicaoId).single();
        if (oldOrc && oldOrc.itens) {
            delete oldOrc.itens.financeiro;
            await window.banco.from('orcamentos').update({ itens: oldOrc.itens }).eq('id', osEmEdicaoId);
        }
        
        currentOSFinanceiro = [];
        renderizarAbaFinanceiro();
        dispararAlerta("Financeiro estornado.", "sucesso");
    } catch(e) { dispararAlerta("Erro ao limpar financeiro."); }
}

// ----------------------------------------------------
// SALVAMENTO DOS DADOS (ABA 1)
// ----------------------------------------------------
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
        const payloadJSONB = { lista_itens: itensTemporarios, resumo: valoresFinais, cliente_dados: clienteObj, veiculo_dados: veiculoObj };

        if (osEmEdicaoId) {
            const { data: oldOrc } = await window.banco.from('orcamentos').select('itens').eq('id', osEmEdicaoId).single();
            if (oldOrc && oldOrc.itens && oldOrc.itens.financeiro) { payloadJSONB.financeiro = oldOrc.itens.financeiro; }

            const { error } = await window.banco.from('orcamentos').update({ cliente_nome: nome, veiculo_placa: placa, valor_total: valoresFinais.total, status: status, observacao: obs, anexos: imagensUploadArray, itens: payloadJSONB }).eq('id', osEmEdicaoId);
            if (error) throw error;
            
            if (currentOSFinanceiro.length > 0) {
                let somaF = 0; currentOSFinanceiro.forEach(r => somaF += r.valor);
                if (Math.abs(valoresFinais.total - somaF) > 0.05) {
                    dispararAlerta("O.S atualizada! ATENÇÃO: O valor mudou. Acesse a aba 'Gestão Financeira' para corrigir as parcelas.", "erro");
                } else {
                    dispararAlerta("O.S atualizada com sucesso!", "sucesso");
                }
            } else {
                dispararAlerta("O.S atualizada com sucesso!", "sucesso");
            }
            alternarSubTelaOrcamento('lista');
        } else {
            const { error } = await window.banco.from('orcamentos').insert([{ cliente_nome: nome, veiculo_placa: placa, valor_total: valoresFinais.total, status: status, observacao: obs, anexos: imagensUploadArray, itens: payloadJSONB }]);
            if (error) throw error;
            dispararAlerta("O.S salva! Vá em 'Gestão Financeira' para faturar.", "sucesso");
            alternarSubTelaOrcamento('lista');
        }
    } catch (erro) { dispararAlerta("Falha de comunicação."); } 
    finally { btnSalvar.innerHTML = '<i class="ph-bold ph-floppy-disk text-xl"></i> SALVAR O.S.'; btnSalvar.disabled = false; }
}

async function abrirEdicaoOS(dadosCodificados, abaAlvo = 'dados') {
    const orc = JSON.parse(decodeURIComponent(dadosCodificados));
    osEmEdicaoId = orc.id;
    osEmEdicaoNumero = orc.numero_os; 
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

// -----------------------------------------------------------------------------------
// RENDERIZAÇÃO DA TABELA E CADEADOS
// -----------------------------------------------------------------------------------
function verificarStatusFinanceiro() {
    const status = document.getElementById('db-status').value;
    const badgeFechada = document.getElementById('badge-os-fechada');
    const abaFinBtn = document.getElementById('aba-fin');
    
    if (status === 'Fechado') {
        if(badgeFechada) badgeFechada.classList.remove('hidden');
        congelarCamposOS(true);
        abaFinBtn.classList.remove('hidden');
        return;
    }

    congelarCamposOS(false);
    if(badgeFechada) badgeFechada.classList.add('hidden');
    
    // Mostra a aba Financeiro só se estiver Finalizado, Fechado ou já tiver financeiro salvo
    if (status === 'Finalizado' || currentOSFinanceiro.length > 0) {
        abaFinBtn.classList.remove('hidden');
    } else {
        abaFinBtn.classList.add('hidden');
        mudarAbaOS('dados'); 
    }
}

function abrirModalDestravar(id, orcJSONCodificado) {
    osParaDestravarId = id; 
    osParaDestravarDados = JSON.parse(decodeURIComponent(orcJSONCodificado));
    document.getElementById('input-senha-reabrir').value = '';
    document.getElementById('modal-senha-destravar').classList.remove('hidden');
}

function fecharModalDestravar() { document.getElementById('modal-senha-destravar').classList.add('hidden'); }

async function processarDestravarOS() {
    const senhaDigitada = document.getElementById('input-senha-reabrir').value;
    const usuarioLogadoStr = localStorage.getItem('usuarioLogado');
    if(!usuarioLogadoStr) { dispararAlerta("Sessão inválida. Faça login novamente."); return; }
    const usuarioLogado = JSON.parse(usuarioLogadoStr);

    if(senhaDigitada !== usuarioLogado.senha) { dispararAlerta("Senha incorreta. Acesso negado."); return; }
    
    try {
        const novoStatus = 'Em Aberto';
        const { error } = await window.banco.from('orcamentos').update({ status: novoStatus }).eq('id', osParaDestravarId);
        if (error) throw error;
        
        fecharModalDestravar();
        osParaDestravarDados.status = novoStatus;
        abrirEdicaoOS(encodeURIComponent(JSON.stringify(osParaDestravarDados)), 'dados');
    } catch(e) { dispararAlerta("Erro ao destravar a O.S no banco."); }
}

function abrirModalExclusao(id, numero_os) {
    idParaExcluir = id;
    document.getElementById('exc-os-num').innerText = `#${numero_os}`;
    document.getElementById('modal-confirmacao-exclusao').classList.remove('hidden');
}

function fecharModalExclusao() { idParaExcluir = null; document.getElementById('modal-confirmacao-exclusao').classList.add('hidden'); }

async function confirmarExclusao() {
    if(!idParaExcluir) return;
    try {
        const { error } = await window.banco.from('orcamentos').delete().eq('id', idParaExcluir);
        if (error) throw error;
        await window.banco.from('contas_receber').delete().like('descricao', `%O.S #${document.getElementById('exc-os-num').innerText.replace('#','')}%`);
        dispararAlerta("Ordem de serviço apagada.", "sucesso");
        fecharModalExclusao();
        buscarOrcamentosSupabase();
    } catch (erro) { dispararAlerta("Falha ao excluir."); }
}

function obterCorStatus(status) {
    const cores = { 'Em Aberto': 'bg-slate-100 text-slate-700', 'Aguardando Aprovação': 'bg-yellow-50 text-yellow-700', 'Aguardando Peça': 'bg-orange-50 text-orange-700', 'Aguardando Pagamento': 'bg-amber-50 text-amber-700', 'Aprovado': 'bg-blue-50 text-blue-700', 'Em Execução': 'bg-indigo-50 text-indigo-700', 'Finalizado': 'bg-emerald-50 text-emerald-700', 'Fechado': 'bg-slate-800 text-white', 'Não Usar': 'bg-red-50 text-red-700' };
    return cores[status] || 'bg-slate-50 text-slate-500';
}

function renderizarTabelaReal(dados) {
    const tbody = document.getElementById('tabela-orcamentos-real');
    if (!dados || dados.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center"><i class="ph-fill ph-receipt text-4xl text-slate-300 mb-3"></i><p class="text-sm font-bold text-slate-500">Nenhuma O.S registrada.</p></td></tr>`; 
        return; 
    }
    
    tbody.innerHTML = dados.map(orc => {
        const dataStr = new Date(orc.data_criacao).toLocaleDateString('pt-BR');
        const corBg = obterCorStatus(orc.status);
        const orcJSON = encodeURIComponent(JSON.stringify(orc));
        const isFechado = orc.status === 'Fechado';
        
        let btnAcao1 = `<div class="w-9 h-9"></div>`; 
        let btnAcao2 = `<button onclick="abrirEdicaoOS('${orcJSON}', 'dados')" class="w-9 h-9 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition shadow-sm" title="Visualizar/Editar"><i class="ph-bold ph-pencil-simple text-lg text-blue-500"></i></button>`;
        
        if (isFechado) {
            btnAcao1 = `<div class="w-9 h-9"></div>`; 
            btnAcao2 = `<button onclick="abrirModalDestravar('${orc.id}', '${orcJSON}')" class="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white border border-slate-300 hover:border-slate-800 rounded-lg transition shadow-sm" title="Reabrir O.S (Exige Senha)"><i class="ph-bold ph-lock-key text-lg"></i></button>`;
        } else if (orc.status === 'Finalizado') {
            btnAcao1 = `<button onclick="abrirEdicaoOS('${orcJSON}', 'fin')" class="w-9 h-9 flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200 hover:border-emerald-500 rounded-lg transition shadow-sm" title="Gerar Financeiro"><i class="ph-bold ph-money text-lg"></i></button>`;
        }
        
        return `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 md:p-5"><p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">${dataStr}</p><p class="font-black text-slate-800 text-sm">O.S #${orc.numero_os}</p></td>
            <td class="p-4 md:p-5"><p class="font-bold text-slate-700 text-sm">${orc.cliente_nome}</p><p class="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">${orc.veiculo_placa}</p></td>
            <td class="p-4 md:p-5 font-black text-slate-800 text-right text-sm">${formataDinheiro(orc.valor_total)}</td>
            <td class="p-4 md:p-5 text-center"><span class="${corBg} border px-2 py-1.5 rounded-lg text-[10px] font-bold shadow-sm whitespace-nowrap">${isFechado ? '<i class="ph-bold ph-lock-key mr-1"></i> Faturada' : orc.status}</span></td>
            <td class="p-4 md:p-5 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    ${btnAcao1}
                    ${btnAcao2}
                    <button onclick="abrirModalExclusao(${orc.id}, '${orc.numero_os}')" class="w-9 h-9 flex items-center justify-center bg-white text-slate-400 hover:text-red-500 border border-slate-200 rounded-lg transition shadow-sm" title="Excluir"><i class="ph-bold ph-trash text-lg"></i></button>
                    <button onclick="gerarPDFSupabase('${orcJSON}')" class="w-9 h-9 flex items-center justify-center bg-slate-800 text-white hover:bg-slate-900 border border-slate-800 rounded-lg transition shadow-sm" title="Abrir PDF"><i class="ph-bold ph-file-pdf text-lg"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// ----------------------------------------------------
// DEMAIS MODAIS E FUNÇÕES GLOBAIS NATIVAS DO SISTEMA
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

    const boxObs = document.getElementById('pdf-container-obs');
    const pdfObsTextoEl = document.getElementById('pdf-obs-texto');
    if(orc.observacao && orc.observacao.trim() !== '') { 
        if(pdfObsTextoEl) pdfObsTextoEl.innerText = orc.observacao; 
        if(boxObs) boxObs.style.display = 'block'; 
    } else { 
        if(boxObs) boxObs.style.display = 'none'; 
    }

    const fin = orc.itens?.financeiro;
    if (fin) {
        let htmlFin = `<h3 style="font-size: 10px; color: #000000; text-transform: uppercase; margin: 0 0 6px 0; border-bottom: 1px solid #D1D5DB; padding-bottom: 4px; font-weight: bold;">Condições de Pagamento Combinadas</h3>`;
        htmlFin += `<table style="width: 100%; border-collapse: collapse; font-size: 10px;">`;
        if (fin.entrada > 0) {
            const dataEntradaBR = new Date(fin.data_entrada + 'T12:00:00Z').toLocaleDateString('pt-BR');
            htmlFin += `<tr><td style="padding: 4px; border-bottom: 1px dashed #e2e8f0;"><b>Acerto Imediato:</b> ${format(fin.entrada)} (Via ${fin.forma_entrada} em ${dataEntradaBR}) - <span style="font-weight: bold; color: #000000;">PAGO</span></td></tr>`;
        }
        if (fin.parcelas && fin.parcelas.length > 0) {
            fin.parcelas.forEach(p => {
                const dataBR = new Date(p.data_vencimento + 'T12:00:00Z').toLocaleDateString('pt-BR');
                htmlFin += `<tr><td style="padding: 4px; border-bottom: 1px dashed #e2e8f0;"><b>Parcela ${p.numero}/${fin.parcelas.length}:</b> ${format(p.valor)} - Vencimento: ${dataBR} (Via ${p.forma_pagamento})</td></tr>`;
            });
        }
        htmlFin += `</table>`;
        let divFin = document.createElement('div');
        divFin.innerHTML = htmlFin;
        document.getElementById('pdf-template-real').appendChild(divFin);
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
