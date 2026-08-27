// ========================================================
// AutoManager - Módulo Contas a Receber
// ========================================================

let contaReceberEmEdicaoId = null;
let idContaParaReceber = null;
let idParaExcluirReceber = null;
let abaAtivaReceber = 'Pendente'; 
let cacheContasReceber = [];

async function initContasReceber() {
    console.log("🟢 Módulo Contas a Receber Inicializado.");
    buscarContasReceberSupabase();
}

function dispararAlertaReceber(msg, tipo = 'erro') {
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

function alternarSubTelaReceber(modo) {
    const viewLista = document.getElementById('view-lista-receber');
    const viewNovo = document.getElementById('view-form-receber');

    if (modo === 'novo') {
        contaReceberEmEdicaoId = null; 
        document.getElementById('titulo-tela-receber').innerText = 'Nova Receita';
        
        document.getElementById('rec-desc').value = '';
        document.getElementById('rec-cat').value = 'Serviços O.S';
        document.getElementById('rec-val').value = '';
        document.getElementById('rec-venc').value = new Date().toISOString().split('T')[0];
        
        viewLista.classList.add('hidden');
        viewNovo.classList.remove('hidden');
        document.getElementById('rec-desc').focus();
    } else {
        viewNovo.classList.add('hidden');
        viewLista.classList.remove('hidden');
        buscarContasReceberSupabase();
    }
}

function mudarAbaReceber(aba) {
    abaAtivaReceber = aba;
    const btnPend = document.getElementById('aba-pendentes-rec');
    const btnPagas = document.getElementById('aba-recebidas');

    if(aba === 'Pendente') {
        btnPend.className = "flex-1 py-2.5 rounded-lg text-sm font-bold bg-white text-slate-800 shadow-sm border border-slate-200 transition-all";
        btnPagas.className = "flex-1 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-700 transition-all";
    } else {
        btnPagas.className = "flex-1 py-2.5 rounded-lg text-sm font-bold bg-white text-slate-800 shadow-sm border border-slate-200 transition-all";
        btnPend.className = "flex-1 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-700 transition-all";
    }
    renderizarTabelaReceber();
}

async function buscarContasReceberSupabase() {
    try {
        const { data, error } = await window.banco.from('contas_receber').select('*').order('data_vencimento', { ascending: true });
        if (error) throw error;
        cacheContasReceber = data;
        renderizarTabelaReceber();
    } catch (erro) {
        document.getElementById('tabela-receber-real').innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500 font-bold bg-red-50">Falha ao buscar financeiro.</td></tr>`;
    }
}

async function salvarContaReceberBD() {
    const desc = document.getElementById('rec-desc').value;
    const cat = document.getElementById('rec-cat').value;
    const valString = document.getElementById('rec-val').value;
    const venc = document.getElementById('rec-venc').value;

    if (!desc || !valString || !venc) { dispararAlertaReceber("Preencha descrição, valor e vencimento."); return; }
    
    const valFloat = parseFloat(valString.replace(/\./g, '').replace(',', '.'));
    if (valFloat <= 0) { dispararAlertaReceber("O valor deve ser maior que zero."); return; }

    const btnSalvar = document.getElementById('btn-salvar-receber');
    btnSalvar.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-lg"></i> Salvando...';
    btnSalvar.disabled = true;

    try {
        const payload = { descricao: desc, categoria: cat, valor: valFloat, data_vencimento: venc };
        
        if (contaReceberEmEdicaoId) {
            const { error } = await window.banco.from('contas_receber').update(payload).eq('id', contaReceberEmEdicaoId);
            if (error) throw error;
            dispararAlertaReceber("Receita atualizada!", "sucesso");
        } else {
            const { error } = await window.banco.from('contas_receber').insert([payload]);
            if (error) throw error;
            dispararAlertaReceber("Nova receita registrada!", "sucesso");
        }
        alternarSubTelaReceber('lista');
    } catch (erro) {
        dispararAlertaReceber("Erro ao salvar receita no banco.");
    } finally {
        btnSalvar.innerHTML = '<i class="ph-bold ph-floppy-disk text-lg"></i> Salvar Receita';
        btnSalvar.disabled = false;
    }
}

// ---- EDIÇÃO ----
function abrirEdicaoReceber(dadosCodificados) {
    const conta = JSON.parse(decodeURIComponent(dadosCodificados));
    contaReceberEmEdicaoId = conta.id;
    
    document.getElementById('titulo-tela-receber').innerText = 'Editar Receita';
    
    document.getElementById('rec-desc').value = conta.descricao || '';
    document.getElementById('rec-cat').value = conta.categoria || 'Serviços O.S';
    
    const inputVal = document.getElementById('rec-val');
    inputVal.value = (conta.valor * 100).toString();
    mascaraMoeda(inputVal); // Aproveita do orcamentos.js
    
    document.getElementById('rec-venc').value = conta.data_vencimento || '';
    
    document.getElementById('view-lista-receber').classList.add('hidden');
    document.getElementById('view-form-receber').classList.remove('hidden');
}

// ---- BAIXA (RECEBIMENTO) ----
function abrirModalBaixaReceber(dadosCodificados) {
    const conta = JSON.parse(decodeURIComponent(dadosCodificados));
    idContaParaReceber = conta.id;
    
    document.getElementById('baixa-receber-desc').innerText = conta.descricao;
    document.getElementById('baixa-receber-val').innerText = conta.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('baixa-receber-data').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('modal-baixa-receber').classList.remove('hidden');
}

function fecharModalBaixaReceber() {
    idContaParaReceber = null;
    document.getElementById('modal-baixa-receber').classList.add('hidden');
}

async function confirmarBaixaReceber() {
    if(!idContaParaReceber) return;
    const dataPag = document.getElementById('baixa-receber-data').value;
    const formaPag = document.getElementById('baixa-receber-forma').value;

    if(!dataPag) { dispararAlertaReceber("Informe a data do recebimento."); return; }

    try {
        const { error } = await window.banco.from('contas_receber').update({ status: 'Pago', data_pagamento: dataPag, forma_pagamento: formaPag }).eq('id', idContaParaReceber);
        if (error) throw error;
        
        dispararAlertaReceber("Recebimento confirmado com sucesso!", "sucesso");
        fecharModalBaixaReceber();
        buscarContasReceberSupabase();
    } catch (erro) {
        dispararAlertaReceber("Falha ao registrar a entrada.");
    }
}

// ---- REVERSÃO DE RECEBIMENTO ----
async function reverterBaixaReceber(id) {
    try {
        const { error } = await window.banco.from('contas_receber').update({ status: 'Pendente', data_pagamento: null, forma_pagamento: null }).eq('id', id);
        if (error) throw error;
        
        dispararAlertaReceber("Baixa desfeita! A receita voltou para A Receber.", "sucesso");
        buscarContasReceberSupabase();
    } catch (erro) {
        dispararAlertaReceber("Falha ao reverter a entrada.");
    }
}

// ---- EXCLUSÃO ----
function abrirModalExclusaoReceber(id) {
    idParaExcluirReceber = id;
    document.getElementById('modal-exclusao-receber').classList.remove('hidden');
}

function fecharModalExclusaoReceber() {
    idParaExcluirReceber = null;
    document.getElementById('modal-exclusao-receber').classList.add('hidden');
}

async function confirmarExclusaoReceber() {
    if(!idParaExcluirReceber) return;
    try {
        const { error } = await window.banco.from('contas_receber').delete().eq('id', idParaExcluirReceber);
        if(error) throw error;
        dispararAlertaReceber("Receita excluída com sucesso.", "sucesso");
        fecharModalExclusaoReceber();
        buscarContasReceberSupabase();
    } catch(e) {
        dispararAlertaReceber("Erro ao excluir receita.");
    }
}

// RENDERIZAÇÃO
function renderizarTabelaReceber() {
    const tbody = document.getElementById('tabela-receber-real');
    
    let dadosFiltrados = cacheContasReceber.filter(c => c.status === abaAtivaReceber);
    
    if (dadosFiltrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center"><i class="ph-fill ph-check-circle text-4xl text-slate-300 mb-3"></i><p class="text-sm font-bold text-slate-500">Nenhuma conta ${abaAtivaReceber.toLowerCase()} encontrada.</p></td></tr>`; return;
    }
    
    const hoje = new Date().toISOString().split('T')[0];

    tbody.innerHTML = dadosFiltrados.map(conta => {
        const jsonCodificado = encodeURIComponent(JSON.stringify(conta));
        const valorBR = conta.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        let statusBadge = '';
        let infoData = '';

        if (conta.status === 'Pago') {
            statusBadge = `<span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold uppercase"><i class="ph-bold ph-check mr-1"></i>Recebido</span>`;
            const dataPagBR = new Date(conta.data_pagamento + 'T12:00:00Z').toLocaleDateString('pt-BR');
            infoData = `<p class="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5">Recebido em</p><p class="font-bold text-slate-800 text-sm">${dataPagBR}</p><p class="text-[9px] font-bold text-slate-400 mt-0.5">Via ${conta.forma_pagamento}</p>`;
        } else {
            // LÓGICA BLINDADA DE DATAS
            const dataVencBR = new Date(conta.data_vencimento + 'T12:00:00Z').toLocaleDateString('pt-BR');
            const dataAtual = new Date();
            const hojeData = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate());
            
            const partesVenc = conta.data_vencimento.split('-');
            const venc = new Date(partesVenc[0], partesVenc[1] - 1, partesVenc[2]);
            
            const diffTime = venc.getTime() - hojeData.getTime();
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

        // BOTOES MINIMALISTAS QUADRADOS
        let botoesAcao = '';
        if(conta.status === 'Pendente') {
            botoesAcao = `
            <button onclick="abrirModalBaixaReceber('${jsonCodificado}')" class="bg-emerald-500 text-white hover:bg-emerald-600 border border-emerald-600 w-9 h-9 flex items-center justify-center rounded-lg transition shadow-sm" title="Receber"><i class="ph-bold ph-check text-lg"></i></button>
            <button onclick="abrirEdicaoReceber('${jsonCodificado}')" class="bg-white text-blue-500 hover:bg-blue-50 border border-slate-200 w-9 h-9 flex items-center justify-center rounded-lg transition shadow-sm" title="Editar"><i class="ph-bold ph-pencil-simple text-lg"></i></button>
            <button onclick="abrirModalExclusaoReceber(${conta.id})" class="bg-white text-slate-400 hover:text-red-500 border border-slate-200 w-9 h-9 flex items-center justify-center rounded-lg transition shadow-sm" title="Excluir"><i class="ph-bold ph-trash text-lg"></i></button>`;
        } else {
             botoesAcao = `
             <button onclick="reverterBaixaReceber(${conta.id})" class="bg-orange-500 text-white hover:bg-orange-600 border border-orange-600 w-9 h-9 flex items-center justify-center rounded-lg transition shadow-sm" title="Reverter Recebimento"><i class="ph-bold ph-arrow-u-up-left text-lg"></i></button>
             <button onclick="abrirModalExclusaoReceber(${conta.id})" class="bg-white text-slate-400 hover:text-red-500 border border-slate-200 w-9 h-9 flex items-center justify-center rounded-lg transition shadow-sm" title="Excluir"><i class="ph-bold ph-trash text-lg"></i></button>`;
        }

        return `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 md:p-5">${infoData}</td>
            <td class="p-4 md:p-5">
                <p class="font-bold text-slate-800 text-sm">${conta.descricao}</p>
                <p class="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">${conta.categoria}</p>
            </td>
            <!-- ATENÇÃO: VALOR AQUI É VERDE (EMERALD) -->
            <td class="p-4 md:p-5 font-black text-emerald-600 text-right text-sm">${valorBR}</td>
            <td class="p-4 md:p-5 text-center">${statusBadge}</td>
            <td class="p-4 md:p-5 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    ${botoesAcao}
                </div>
            </td>
        </tr>`;
    }).join('');
}
