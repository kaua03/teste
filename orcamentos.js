// orcamentos.js

let itensTemporarios = [];
let valorTotalTemporario = 0;

/**
 * Iniciado pelo Roteador quando clica em Orçamentos
 */
function initOrcamentos() {
    console.log("🟢 Módulo Orçamentos Inicializado.");
    buscarOrcamentosSupabase();
}

/**
 * Alterna entre Listagem e Formulário Novo
 */
function alternarSubTelaOrcamento(modo) {
    const viewLista = document.getElementById('view-lista-orcamentos');
    const viewNovo = document.getElementById('view-novo-orcamento');

    if (modo === 'novo') {
        document.getElementById('db-cliente-nome').value = '';
        document.getElementById('db-veiculo-placa').value = '';
        document.getElementById('db-status').value = 'Rascunho';
        itensTemporarios = [];
        atualizarResumoItens();
        
        viewLista.classList.add('hidden');
        viewNovo.classList.remove('hidden');
    } else {
        viewNovo.classList.add('hidden');
        viewLista.classList.remove('hidden');
        buscarOrcamentosSupabase();
    }
}

/**
 * Lê os dados da Tabela (Supabase)
 */
async function buscarOrcamentosSupabase() {
    try {
        const { data: orcamentos, error } = await window.banco
            .from('orcamentos')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;
        renderizarTabelaReal(orcamentos);
    } catch (erro) {
        console.error("Erro ao buscar orçamentos:", erro);
        document.getElementById('tabela-orcamentos-real').innerHTML = `
            <tr><td colspan="5" class="p-8 text-center text-red-500 font-bold bg-red-50">Falha ao conectar no banco de dados.</td></tr>`;
    }
}

/**
 * Grava o Orçamento na Tabela (Supabase)
 */
async function salvarOrcamentoReal() {
    const nome = document.getElementById('db-cliente-nome').value;
    const placa = document.getElementById('db-veiculo-placa').value;
    const status = document.getElementById('db-status').value;

    if (!nome || !placa) { alert("Nome do Cliente e Placa são obrigatórios."); return; }
    if (itensTemporarios.length === 0) { alert("O orçamento precisa de peças/serviços."); return; }

    const btnSalvar = document.getElementById('btn-salvar-db');
    btnSalvar.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-xl"></i> GRAVANDO...';
    btnSalvar.disabled = true;

    try {
        // Envia os dados e o JSONB dos itens para o PostgresSQL
        const { error } = await window.banco.from('orcamentos').insert([
            {
                cliente_nome: nome,
                veiculo_placa: placa,
                valor_total: valorTotalTemporario,
                status: status,
                itens: itensTemporarios
            }
        ]);

        if (error) throw error;

        // Limpa e volta
        alternarSubTelaOrcamento('lista');
        
    } catch (erro) {
        console.error("Erro ao gravar:", erro);
        alert("Erro ao gravar no banco. Veja o console.");
    } finally {
        btnSalvar.innerHTML = '<i class="ph-bold ph-floppy-disk text-xl"></i> GRAVAR NO SISTEMA';
        btnSalvar.disabled = false;
    }
}

/**
 * Adiciona Item no Carrinho (Interface)
 */
function adicionarItemDB() {
    const desc = document.getElementById('item-desc').value;
    const qtd = parseFloat(document.getElementById('item-qtd').value);
    const val = parseFloat(document.getElementById('item-val').value);

    if(!desc || !qtd || !val) return;

    itensTemporarios.push({
        id_temp: Date.now(),
        descricao: desc,
        quantidade: qtd,
        valor_unitario: val,
        subtotal: qtd * val
    });

    document.getElementById('item-desc').value = '';
    document.getElementById('item-val').value = '';
    document.getElementById('item-desc').focus();
    atualizarResumoItens();
}

function removerItemDB(id) {
    itensTemporarios = itensTemporarios.filter(i => i.id_temp !== id);
    atualizarResumoItens();
}

function atualizarResumoItens() {
    const format = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const divLista = document.getElementById('lista-itens-db');
    valorTotalTemporario = 0;

    if (itensTemporarios.length === 0) {
        divLista.innerHTML = '<div class="text-center text-slate-400 py-6 text-[10px] md:text-xs uppercase font-bold tracking-wider">Nenhum item adicionado.</div>';
        document.getElementById('db-total').innerText = "R$ 0,00";
        return;
    }

    divLista.innerHTML = itensTemporarios.map(item => {
        valorTotalTemporario += item.subtotal;
        return `
        <div class="bg-white p-3 rounded-lg border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 shadow-sm">
            <div class="text-xs md:text-sm"><span class="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded mr-2">${item.quantidade}x</span><span class="text-slate-700 font-bold">${item.descricao}</span> <span class="text-[10px] md:text-xs text-slate-400 ml-1">(${format(item.valor_unitario)})</span></div>
            <div class="flex items-center gap-4 w-full md:w-auto justify-between"><span class="font-black text-slate-900 text-sm md:text-base">${format(item.subtotal)}</span><button onclick="removerItemDB(${item.id_temp})" class="text-slate-400 hover:text-red-500 bg-slate-50 p-1.5 rounded transition"><i class="ph-bold ph-trash text-lg"></i></button></div>
        </div>`;
    }).join('');

    document.getElementById('db-total').innerText = format(valorTotalTemporario);
}

/**
 * Renderiza a Tabela
 */
function renderizarTabelaReal(dados) {
    const format = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const tbody = document.getElementById('tabela-orcamentos-real');

    if (dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-400 font-medium">Nenhum orçamento emitido no banco de dados.</td></tr>';
        return;
    }

    tbody.innerHTML = dados.map(orc => {
        const dataObj = new Date(orc.data_criacao);
        const dataStr = dataObj.toLocaleDateString('pt-BR');

        let corStatus = 'bg-slate-100 text-slate-600 border-slate-200';
        if(orc.status.includes('Aprovado')) corStatus = 'bg-emerald-50 text-emerald-600 border-emerald-200';
        if(orc.status.includes('Aguardando')) corStatus = 'bg-amber-50 text-amber-600 border-amber-200';

        // Prepara os dados para o gerador de PDF ler sem bater no banco de novo
        const orcJSON = encodeURIComponent(JSON.stringify(orc));

        return `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 md:p-5">
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">${dataStr}</p>
                <p class="font-black text-slate-800 text-xs md:text-sm">#${orc.id}</p>
            </td>
            <td class="p-4 md:p-5">
                <p class="font-bold text-slate-700 text-xs md:text-sm">${orc.cliente_nome}</p>
                <p class="text-[10px] text-blue-600 font-bold uppercase tracking-wider">${orc.veiculo_placa}</p>
            </td>
            <td class="p-4 md:p-5 font-black text-slate-800 text-right text-xs md:text-sm">${format(orc.valor_total)}</td>
            <td class="p-4 md:p-5 text-center">
                <span class="${corStatus} border px-2 md:px-3 py-1 rounded-md text-[10px] font-bold shadow-sm whitespace-nowrap">${orc.status}</span>
            </td>
            <td class="p-4 md:p-5 text-center">
                <button onclick="gerarPDFSupabase('${orcJSON}')" class="bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 p-2 rounded-lg transition-colors shadow-sm" title="Baixar PDF">
                    <i class="ph-bold ph-file-pdf text-lg"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

/**
 * Geração de PDF Oficial
 */
function gerarPDFSupabase(dadosCodificados) {
    const orc = JSON.parse(decodeURIComponent(dadosCodificados));
    const format = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    document.getElementById('pdf-id').innerText = String(orc.id).padStart(4, '0');
    document.getElementById('pdf-data').innerText = new Date(orc.data_criacao).toLocaleDateString('pt-BR');
    document.getElementById('pdf-cli').innerText = orc.cliente_nome;
    document.getElementById('pdf-vei').innerText = orc.veiculo_placa;
    document.getElementById('pdf-tot').innerText = format(orc.valor_total);

    document.getElementById('pdf-tabela-itens').innerHTML = orc.itens.map(i => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${i.quantidade}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${i.descricao}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${format(i.valor_unitario)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${format(i.subtotal)}</td>
        </tr>
    `).join('');

    const el = document.getElementById('pdf-template-real');
    html2pdf().set({ margin: 0, filename: `Orcamento_${orc.id}.pdf`, image: { type: 'jpeg', quality: 1 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } }).from(el).save();
}

/**
 * ========================================================
 * CONTROLE DA JANELA DE CADASTRO RÁPIDO (MODAL)
 * ========================================================
 */
function abrirModalCadastro(tipo) {
    const modal = document.getElementById('modal-cadastro-rapido');
    const titulo = document.getElementById('modal-titulo');
    const conteudo = document.getElementById('modal-conteudo');

    if (tipo === 'cliente') {
        titulo.innerHTML = '<i class="ph-bold ph-user-plus mr-2"></i>Cadastrar Novo Cliente';
        conteudo.innerHTML = `
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                <input type="text" placeholder="Ex: Maria Souza" class="w-full border border-slate-300 p-3 rounded-xl text-sm bg-slate-50 outline-none focus:border-blue-500 font-medium">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Telefone (WhatsApp)</label>
                <input type="text" placeholder="(00) 00000-0000" class="w-full border border-slate-300 p-3 rounded-xl text-sm bg-slate-50 outline-none focus:border-blue-500 font-medium">
            </div>
        `;
    } else {
        titulo.innerHTML = '<i class="ph-bold ph-jeep mr-2"></i>Cadastrar Novo Veículo';
        conteudo.innerHTML = `
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Placa (Normal ou Mercosul)</label>
                <input type="text" placeholder="Ex: ABC-1234" class="w-full border border-slate-300 p-3 rounded-xl text-sm bg-slate-50 outline-none focus:border-blue-500 font-bold uppercase">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Marca / Modelo / Ano</label>
                <input type="text" placeholder="Ex: Fiat Toro 2024" class="w-full border border-slate-300 p-3 rounded-xl text-sm bg-slate-50 outline-none focus:border-blue-500 font-medium">
            </div>
        `;
    }
    
    modal.classList.remove('hidden');
}

function fecharModalCadastro() {
    document.getElementById('modal-cadastro-rapido').classList.add('hidden');
}
