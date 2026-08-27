// ========================================================
// AutoManager - Módulo Contas a Pagar
// ========================================================

let contaPagarEmEdicaoId = null;
let idContaParaBaixar = null;
let idParaExcluirPagar = null;
let abaAtivaPagar = 'Pendente'; 
let cacheContasPagar = [];

async function initContasPagar() {
    console.log("🟢 Módulo Contas a Pagar Inicializado.");
    buscarContasPagarSupabase();
}

function dispararAlertaPagar(msg, tipo = 'erro') {
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

function alternarSubTelaPagar(modo) {
    const viewLista = document.getElementById('view-lista-pagar');
    const viewNovo = document.getElementById('view-form-pagar');

    if (modo === 'novo') {
        contaPagarEmEdicaoId = null; 
        document.getElementById('titulo-tela-pagar').innerText = 'Nova Despesa';
        
        document.getElementById('pag-desc').value = '';
        document.getElementById('pag-cat').value = 'Outros';
        document.getElementById('pag-val').value = '';
        document.getElementById('pag-venc').value = new Date().toISOString().split('T')[0];
        
        viewLista.classList.add('hidden');
        viewNovo.classList.remove('hidden');
        document.getElementById('pag-desc').focus();
    } else {
        viewNovo.classList.add('hidden');
        viewLista.classList.remove('hidden');
        buscarContasPagarSupabase();
    }
}

function mudarAbaPagar(aba) {
    abaAtivaPagar = aba;
    const btnPend = document.getElementById('aba-pendentes');
    const btnPagas = document.getElementById('aba-pagas');

    if(aba === 'Pendente') {
        btnPend.className = "flex-1 py-2.5 rounded-lg text-sm font-bold bg-white text-slate-800 shadow-sm border border-slate-200 transition-all";
        btnPagas.className = "flex-1 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-700 transition-all";
    } else {
        btnPagas.className = "flex-1 py-2.5 rounded-lg text-sm font-bold bg-white text-slate-800 shadow-sm border border-slate-200 transition-all";
        btnPend.className = "flex-1 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-700 transition-all";
    }
    renderizarTabelaPagar();
}

function mascaraMoeda(campo) {
    let valor = campo.value.replace(/\D/g, ''); 
    if (valor === '') { campo.value = ''; return; }
    valor = (parseInt(valor, 10) / 100).toFixed(2);
    campo.value = valor.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
}

async function buscarContasPagarSupabase() {
    try {
        const { data, error } = await window.banco.from('contas_pagar').select('*').order('data_vencimento', { ascending: true });
        if (error) throw error;
        cacheContasPagar = data;
        renderizarTabelaPagar();
    } catch (erro) {
        document.getElementById('tabela-pagar-real').innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500 font-bold bg-red-50">Falha ao buscar financeiro.</td></tr>`;
    }
}

async function salvarContaPagarBD() {
    const desc = document.getElementById('pag-desc').value;
    const cat = document.getElementById('pag-cat').value;
    const valString = document.getElementById('pag-val').value;
    const venc = document.getElementById('pag-venc').value;

    if (!desc || !valString || !venc) { dispararAlertaPagar("Preencha descrição, valor e vencimento."); return; }
    
    const valFloat = parseFloat(valString.replace(/\./g, '').replace(',', '.'));
    if (valFloat <= 0) { dispararAlertaPagar("O valor deve ser maior que zero."); return; }

    const btnSalvar = document.getElementById('btn-salvar-pagar');
    btnSalvar.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-lg"></i> Salvando...';
    btnSalvar.disabled = true;

    try {
        const payload = { descricao: desc, categoria: cat, valor: valFloat, data_vencimento: venc };
        
        if (contaPagarEmEdicaoId) {
            const { error } = await window.banco.from('contas_pagar').update(payload).eq('id', contaPagarEmEdicaoId);
            if (error) throw error;
            dispararAlertaPagar("Conta atualizada!", "sucesso");
        } else {
            const { error } = await window.banco.from('contas_pagar').insert([payload]);
            if (error) throw error;
            dispararAlertaPagar("Nova conta registrada!", "sucesso");
        }
        alternarSubTelaPagar('lista');
    } catch (erro) {
        dispararAlertaPagar("Erro ao salvar conta no banco.");
    } finally {
        btnSalvar.innerHTML = '<i class="ph-bold ph-floppy-disk text-lg"></i> Salvar Despesa';
        btnSalvar.disabled = false;
    }
}

// ---- EDIÇÃO ----
function abrirEdicaoPagar(dadosCodificados) {
    const conta = JSON.parse(decodeURIComponent(dadosCodificados));
    contaPagarEmEdicaoId = conta.id;
    
    document.getElementById('titulo-tela-pagar').innerText = 'Editar Despesa';
    
    document.getElementById('pag-desc').value = conta.descricao || '';
    document.getElementById('pag-cat').value = conta.categoria || 'Outros';
    
    const inputVal = document.getElementById('pag-val');
    inputVal.value = (conta.valor * 100).toString();
    mascaraMoeda(inputVal);
    
    document.getElementById('pag-venc').value = conta.data_vencimento || '';
    
    document.getElementById('view-lista-pagar').classList.add('hidden');
    document.getElementById('view-form-pagar').classList.remove('hidden');
}

// ---- BAIXA (PAGAMENTO) ----
function abrirModalBaixaPagar(dadosCodificados) {
    const conta = JSON.parse(decodeURIComponent(dadosCodificados));
    idContaParaBaixar = conta.id;
    
    document.getElementById('baixa-pagar-desc').innerText = conta.descricao;
    document.getElementById('baixa-pagar-val').innerText = conta.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('baixa-pagar-data').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('modal-baixa-pagar').classList.remove('hidden');
}

function fecharModalBaixaPagar() {
    idContaParaBaixar = null;
    document.getElementById('modal-baixa-pagar').classList.add('hidden');
}

async function confirmarBaixaPagar() {
    if(!idContaParaBaixar) return;
    const dataPag = document.getElementById('baixa-pagar-data').value;
    const formaPag = document.getElementById('baixa-pagar-forma').value;

    if(!dataPag) { dispararAlertaPagar("Informe a data do pagamento."); return; }

    try {
        const { error } = await window.banco.from('contas_pagar').update({ status: 'Pago', data_pagamento: dataPag, forma_pagamento: formaPag }).eq('id', idContaParaBaixar);
        if (error) throw error;
        
        dispararAlertaPagar("Conta baixada com sucesso!", "sucesso");
        fecharModalBaixaPagar();
        buscarContasPagarSupabase();
    } catch (erro) {
        dispararAlertaPagar("Falha ao registrar o pagamento.");
    }
}

// ---- REVERSÃO DE PAGAMENTO ----
async function reverterBaixaPagar(id) {
    try {
        const { error } = await window.banco.from('contas_pagar').update({ status: 'Pendente', data_pagamento: null, forma_pagamento: null }).eq('id', id);
        if (error) throw error;
        
        dispararAlertaPagar("Pagamento desfeito! A conta voltou para Pendentes.", "sucesso");
        buscarContasPagarSupabase();
    } catch (erro) {
        dispararAlertaPagar("Falha ao reverter o pagamento.");
    }
}

// ---- EXCLUSÃO ----
function abrirModalExclusaoPagar(id) {
    idParaExcluirPagar = id;
    document.getElementById('modal-exclusao-pagar').classList.remove('hidden');
}

function fecharModalExclusaoPagar() {
    idParaExcluirPagar = null;
    document.getElementById('modal-exclusao-pagar').classList.add('hidden');
}

async function confirmarExclusaoPagar() {
    if(!idParaExcluirPagar) return;
    try {
        const { error } = await window.banco.from('contas_pagar').delete().eq('id', idParaExcluirPagar);
        if(error) throw error;
        dispararAlertaPagar("Conta excluída com sucesso.", "sucesso");
        fecharModalExclusaoPagar();
        buscarContasPagarSupabase();
    } catch(e) {
        dispararAlertaPagar("Erro ao excluir conta.");
    }
}

// RENDERIZAÇÃO
function renderizarTabelaPagar() {
    const tbody = document.getElementById('tabela-pagar-real');
    
    let dadosFiltrados = cacheContasPagar.filter(c => c.status === abaAtivaPagar);
    
    if (dadosFiltrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center"><i class="ph-fill ph-check-circle text-4xl text-slate-300 mb-3"></i><p class="text-sm font-bold text-slate-500">Nenhuma conta ${abaAtivaPagar.toLowerCase()} encontrada.</p></td></tr>`; return;
    }

    tbody.innerHTML = dadosFiltrados.map(conta => {
        const jsonCodificado = encodeURIComponent(JSON.stringify(conta));
        const valorBR = conta.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        let statusBadge = '';
        let infoData = '';

        if (conta.status === 'Pago') {
            statusBadge = `<span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold uppercase"><i class="ph-bold ph-check mr-1"></i>Pago</span>`;
            const dataPagBR = new Date(conta.data_pagamento + 'T12:00:00Z').toLocaleDateString('pt-BR');
            infoData = `<p class="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5">Pago em</p><p class="font-bold text-slate-800 text-sm">${dataPagBR}</p><p class="text-[9px] font-bold text-slate-400 mt-0.5">Via ${conta.forma_pagamento}</p>`;
        } else {
            // LÓGICA BLINDADA DE DATAS
            const dataVencBR = new Date(conta.data_vencimento + 'T12:00:00Z').toLocaleDateString('pt-BR');
            const dataAtual = new Date();
            const hoje = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate());
            
            const partesVenc = conta.data_vencimento.split('-');
            const venc = new Date(partesVenc[0], partesVenc[1] - 1, partesVenc[2]);
            
            const diffTime = venc.getTime() - hoje.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            let corTexto, textoDias, badgeHtml;

            if (diffDays < 0) {
                corTexto = 'text-red-500';
                textoDias = `Atrasado há ${Math.abs(diffDays)} dia${Math.abs(diffDays) > 1 ? 's' : ''}`;
                badgeHtml = `<span class="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold uppercase"><i class="ph-bold ph-warning mr-1"></i>Atrasado</span>`;
            } else if (diffDays === 0) {
                corTexto = 'text-orange-500';
                textoDias = 'Vence Hoje';
                badgeHtml = `<span class="bg-orange-100 text-orange-700 px-2 py-1 rounded text-[10px] font-bold uppercase"><i class="ph-bold ph-clock mr-1"></i>Hoje</span>`;
            } else if (diffDays === 1) {
                corTexto = 'text-blue-500';
                textoDias = 'Vence Amanhã';
                badgeHtml = `<span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase">A Vencer</span>`;
            } else {
                corTexto = 'text-slate-500';
                textoDias = `Vence em ${diffDays} dias`;
                badgeHtml = `<span class="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase">No Prazo</span>`;
            }

            statusBadge = badgeHtml;
            infoData = `<p class="text-[10px] ${corTexto} font-bold uppercase tracking-wider mb-0.5">${textoDias}</p><p class="font-bold text-slate-800 text-sm">${dataVencBR}</p>`;
        }

        // BOTÕES 100% QUADRADOS E BASEADOS EM ÍCONES
        let botoesAcao = '';
        if(conta.status === 'Pendente') {
            botoesAcao = `
            <button onclick="abrirModalBaixaPagar('${jsonCodificado}')" class="bg-emerald-500 text-white hover:bg-emerald-600 border border-emerald-600 w-9 h-9 flex items-center justify-center rounded-lg transition shadow-sm" title="Pagar"><i class="ph-bold ph-check text-lg"></i></button>
            <button onclick="abrirEdicaoPagar('${jsonCodificado}')" class="bg-white text-blue-500 hover:bg-blue-50 border border-slate-200 w-9 h-9 flex items-center justify-center rounded-lg transition shadow-sm" title="Editar"><i class="ph-bold ph-pencil-simple text-lg"></i></button>
            <button onclick="abrirModalExclusaoPagar(${conta.id})" class="bg-white text-slate-400 hover:text-red-500 border border-slate-200 w-9 h-9 flex items-center justify-center rounded-lg transition shadow-sm" title="Excluir"><i class="ph-bold ph-trash text-lg"></i></button>`;
        } else {
             botoesAcao = `
             <button onclick="reverterBaixaPagar(${conta.id})" class="bg-orange-500 text-white hover:bg-orange-600 border border-orange-600 w-9 h-9 flex items-center justify-center rounded-lg transition shadow-sm" title="Reverter Pagamento"><i class="ph-bold ph-arrow-u-up-left text-lg"></i></button>
             <button onclick="abrirModalExclusaoPagar(${conta.id})" class="bg-white text-slate-400 hover:text-red-500 border border-slate-200 w-9 h-9 flex items-center justify-center rounded-lg transition shadow-sm" title="Excluir"><i class="ph-bold ph-trash text-lg"></i></button>`;
        }

        return `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 md:p-5">${infoData}</td>
            <td class="p-4 md:p-5">
                <p class="font-bold text-slate-800 text-sm">${conta.descricao}</p>
                <p class="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">${conta.categoria}</p>
            </td>
            <td class="p-4 md:p-5 font-black text-red-600 text-right text-sm">${valorBR}</td>
            <td class="p-4 md:p-5 text-center">${statusBadge}</td>
            <td class="p-4 md:p-5 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    ${botoesAcao}
                </div>
            </td>
        </tr>`;
    }).join('');
}
