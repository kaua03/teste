// ========================================================
// AutoManager - Módulo Contas a Pagar
// ========================================================

let contaPagarEmEdicaoId = null;
let idContaParaBaixar = null;
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
        document.getElementById('pag-venc').value = new Date().toISOString().split('T')[0]; // Data de hoje
        
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
    
    // Converte a máscara "1.200,50" para float "1200.50" pro banco
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

// ---- BAIXA DE CONTA (PAGAMENTO) ----
function abrirModalBaixaPagar(dadosCodificados) {
    const conta = JSON.parse(decodeURIComponent(dadosCodificados));
    idContaParaBaixar = conta.id;
    
    document.getElementById('baixa-pagar-desc').innerText = conta.descricao;
    document.getElementById('baixa-pagar-val').innerText = conta.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('baixa-pagar-data').value = new Date().toISOString().split('T')[0]; // Sugere hoje
    
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

// RENDERIZAÇÃO
function renderizarTabelaPagar() {
    const tbody = document.getElementById('tabela-pagar-real');
    
    // Filtra pelo que está selecionado na aba
    let dadosFiltrados = cacheContasPagar.filter(c => c.status === abaAtivaPagar);
    
    if (dadosFiltrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center"><i class="ph-fill ph-check-circle text-4xl text-slate-300 mb-3"></i><p class="text-sm font-bold text-slate-500">Nenhuma conta ${abaAtivaPagar.toLowerCase()} encontrada.</p></td></tr>`; return;
    }
    
    const hoje = new Date().toISOString().split('T')[0];

    tbody.innerHTML = dadosFiltrados.map(conta => {
        const jsonCodificado = encodeURIComponent(JSON.stringify(conta));
        const valorBR = conta.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        // Verifica atraso
        let statusBadge = '';
        let infoData = '';

        if (conta.status === 'Pago') {
            statusBadge = `<span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold uppercase"><i class="ph-bold ph-check mr-1"></i>Pago</span>`;
            const dataPagBR = new Date(conta.data_pagamento + 'T12:00:00Z').toLocaleDateString('pt-BR');
            infoData = `<p class="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5">Pago em: ${dataPagBR}</p><p class="text-xs font-bold text-slate-500">Via ${conta.forma_pagamento}</p>`;
        } else {
            const dataVencBR = new Date(conta.data_vencimento + 'T12:00:00Z').toLocaleDateString('pt-BR');
            if (conta.data_vencimento < hoje) {
                statusBadge = `<span class="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold uppercase"><i class="ph-bold ph-warning mr-1"></i>Atrasado</span>`;
                infoData = `<p class="text-[10px] text-red-500 font-bold uppercase tracking-wider mb-0.5">Venceu: ${dataVencBR}</p>`;
            } else {
                statusBadge = `<span class="bg-orange-100 text-orange-700 px-2 py-1 rounded text-[10px] font-bold uppercase">No Prazo</span>`;
                infoData = `<p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Vence: ${dataVencBR}</p>`;
            }
        }

        // Se estiver pago, não mostra botão de pagar, nem editar
        let botoesAcao = '';
        if(conta.status === 'Pendente') {
            botoesAcao = `
            <button onclick="abrirModalBaixaPagar('${jsonCodificado}')" class="bg-emerald-500 text-white hover:bg-emerald-600 border border-emerald-600 px-3 py-2 rounded-lg transition text-xs font-bold shadow-sm" title="Informar Pagamento">Pagar</button>
            <button onclick="" class="bg-white text-slate-400 hover:text-red-500 border border-slate-200 p-2 rounded-lg transition" title="Excluir"><i class="ph-bold ph-trash text-lg"></i></button>`;
        } else {
             botoesAcao = `<span class="text-[10px] font-bold text-slate-400 uppercase"><i class="ph-bold ph-lock-key"></i> Liquidado</span>`;
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
