// ========================================================
// AutoManager - Módulo de Orçamentos e O.S.
// ========================================================

let itensTemporarios = [];
let valoresFinais = { pecas: 0, servicos: 0, desconto: 0, total: 0 };
let modalTipoAberto = '';
let imagensUploadArray = []; // Guarda as fotos carregadas na O.S.

function initOrcamentos() {
    console.log("🟢 Módulo Orçamentos Inicializado.");
    buscarOrcamentosSupabase();
}

function dispararAlerta(msg, tipo = 'erro') {
    const corBg = tipo === 'erro' ? 'bg-red-500' : 'bg-emerald-500';
    const icone = tipo === 'erro' ? 'ph-warning-circle' : 'ph-check-circle';
    const alertaAntigo = document.getElementById('alerta-toast-flutuante');
    if (alertaAntigo) alertaAntigo.remove();
    const toast = document.createElement('div');
    toast.id = 'alerta-toast-flutuante';
    toast.className = `fixed top-20 right-4 md:right-8 z-[1000] ${corBg} text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 fade-in font-inter`;
    toast.innerHTML = `<i class="ph-bold ${icone} text-2xl"></i> <span class="font-bold text-sm">${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast) toast.remove(); }, 4000);
}

function alternarSubTelaOrcamento(modo) {
    const viewLista = document.getElementById('view-lista-orcamentos');
    const viewNovo = document.getElementById('view-novo-orcamento');

    if (modo === 'novo') {
        document.getElementById('db-cliente-nome').value = '';
        document.getElementById('db-veiculo-placa').value = '';
        document.getElementById('db-status').value = 'Em Aberto';
        document.getElementById('desc-val').value = '';
        document.getElementById('db-obs').value = '';
        
        itensTemporarios = [];
        imagensUploadArray = [];
        document.getElementById('preview-anexos').innerHTML = '';
        document.getElementById('preview-anexos').classList.add('hidden');
        
        calcularTotais();
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

/**
 * ========================================================
 * MOTOR DE ITENS AVANÇADO (COM DETALHES DA PEÇA)
 * ========================================================
 */
function adicionarOuEditarItem() {
    const tipo = document.getElementById('item-tipo').value;
    const nome = document.getElementById('item-nome').value;
    const desc = document.getElementById('item-desc').value; // Observação específica do item
    const qtd = parseFloat(document.getElementById('item-qtd').value);
    const valString = document.getElementById('item-val').value;
    const idEdit = document.getElementById('item-id-edit').value;

    if(!nome) { dispararAlerta("O nome do Item (Peça/Serviço) é obrigatório."); return; }
    if(!qtd || qtd <= 0) { dispararAlerta("A quantidade deve ser maior que zero."); return; }
    
    const valFloat = reverterMoeda(valString);
    if(valFloat <= 0) { dispararAlerta("O valor unitário não pode ser vazio."); return; }

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

    document.getElementById('item-nome').value = '';
    document.getElementById('item-desc').value = '';
    document.getElementById('item-val').value = '';
    document.getElementById('item-qtd').value = '1';
    document.getElementById('item-nome').focus();
    
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
            // Renderiza o detalhe (observação) apenas se existir
            let HTMLdetalhe = item.detalhe ? `<p class="text-xs text-slate-500 mt-1 italic pl-1"><i class="ph-fill ph-info text-blue-400 mr-1"></i>${item.detalhe}</p>` : '';

            return `
            <div class="bg-white p-3 md:p-4 rounded-xl border border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 shadow-sm hover:border-blue-200 transition-colors">
                <div class="flex-1">
                    <div class="flex items-center">
                        <span class="border ${badgeClass} px-2 py-0.5 rounded text-[10px] font-black uppercase mr-2 shadow-sm">${item.tipo}</span>
                        <span class="font-bold text-slate-800 text-sm">${item.quantidade}x ${item.descricao}</span> 
                        <span class="text-xs text-slate-400 ml-1">(${formataDinheiro(item.valor_unitario)})</span>
                    </div>
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

/**
 * ========================================================
 * UPLOAD DE FOTOS (CONVERSÃO EM BASE64 NO FRONT-END)
 * ========================================================
 */
function processarImagens(event) {
    const files = event.target.files;
    const previewContainer = document.getElementById('preview-anexos');
    
    if(files.length > 0) previewContainer.classList.remove('hidden');

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Str = e.target.result;
            // Salva na memória
            imagensUploadArray.push(base64Str);
            
            // Desenha na tela (Preview)
            const imgBox = document.createElement('div');
            imgBox.className = "w-20 h-20 rounded-xl overflow-hidden shadow-sm border border-slate-200 relative group";
            imgBox.innerHTML = `
                <img src="${base64Str}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all cursor-pointer" onclick="this.parentElement.remove(); removerImagemArray('${base64Str}')">
                    <i class="ph-bold ph-trash text-white text-xl"></i>
                </div>
            `;
            previewContainer.appendChild(imgBox);
        };
        reader.readAsDataURL(file);
    });
}

function removerImagemArray(strToRem) {
    imagensUploadArray = imagensUploadArray.filter(i => i !== strToRem);
    if(imagensUploadArray.length === 0) {
        document.getElementById('preview-anexos').classList.add('hidden');
    }
}

/**
 * ========================================================
 * SUPABASE (AGORA SALVANDO OBSERVAÇÕES E FOTOS)
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
        // Empacota toda a inteligência no JSONB
        const payloadJSONB = { lista_itens: itensTemporarios, resumo: valoresFinais };
        
        const { error } = await window.banco.from('orcamentos').insert([{
            cliente_nome: nome, 
            veiculo_placa: placa, 
            valor_total: valoresFinais.total, 
            status: status, 
            observacao: obs,       // Coluna nova
            anexos: imagensUploadArray, // Coluna nova (JSONB Array)
            itens: payloadJSONB
        }]);

        if (error) throw error;
        dispararAlerta("Ordem de Serviço salva com sucesso!", "sucesso");
        alternarSubTelaOrcamento('lista');
        
    } catch (erro) {
        dispararAlerta("Falha de comunicação com o servidor.");
    } finally {
        btnSalvar.innerHTML = '<i class="ph-bold ph-floppy-disk text-xl"></i> SALVAR O.S.';
        btnSalvar.disabled = false;
    }
}

function renderizarTabelaReal(dados) {
    const tbody = document.getElementById('tabela-orcamentos-real');
    if (dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center"><i class="ph-fill ph-receipt text-4xl text-slate-300 mb-3"></i><p class="text-sm font-bold text-slate-500">Nenhuma O.S registrada.</p></td></tr>`;
        return;
    }

    const coresStatus = {
        'Em Aberto': 'bg-slate-100 text-slate-700', 'Aguardando Aprovação': 'bg-yellow-50 text-yellow-700', 
        'Aguardando Peça': 'bg-orange-50 text-orange-700', 'Aprovado': 'bg-blue-50 text-blue-700', 
        'Finalizado': 'bg-emerald-50 text-emerald-700', 'Não Usar': 'bg-red-50 text-red-700'
    };

    tbody.innerHTML = dados.map(orc => {
        const dataStr = new Date(orc.data_criacao).toLocaleDateString('pt-BR');
        const corBg = coresStatus[orc.status] || 'bg-slate-50 text-slate-500';
        const orcJSON = encodeURIComponent(JSON.stringify(orc));

        return `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 md:p-5"><p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">${dataStr}</p><p class="font-black text-slate-800 text-sm">O.S #${orc.numero_os}</p></td>
            <td class="p-4 md:p-5"><p class="font-bold text-slate-700 text-sm">${orc.cliente_nome}</p><p class="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">${orc.veiculo_placa}</p></td>
            <td class="p-4 md:p-5 font-black text-slate-800 text-right text-sm">${formataDinheiro(orc.valor_total)}</td>
            <td class="p-4 md:p-5 text-center"><span class="${corBg} border px-2 py-1.5 rounded-lg text-[10px] font-bold shadow-sm whitespace-nowrap">${orc.status}</span></td>
            <td class="p-4 md:p-5 text-center"><button onclick="gerarPDFSupabase('${orcJSON}')" class="bg-white text-slate-500 hover:text-red-600 border border-slate-200 p-2 rounded-lg transition-colors shadow-sm" title="Abrir PDF"><i class="ph-bold ph-file-pdf text-lg"></i></button></td>
        </tr>`;
    }).join('');
}

/**
 * ========================================================
 * MOTOR DE PDF INTELIGENTE (RENDERIZAÇÃO DE CONCESSIONÁRIA)
 * ========================================================
 */
function gerarPDFSupabase(dadosCodificados) {
    const orc = JSON.parse(decodeURIComponent(dadosCodificados));
    const format = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Preenche Cabeçalho
    document.getElementById('pdf-id').innerText = orc.numero_os;
    document.getElementById('pdf-data').innerText = new Date(orc.data_criacao).toLocaleDateString('pt-BR');
    document.getElementById('pdf-status').innerText = orc.status;
    document.getElementById('pdf-cli').innerText = orc.cliente_nome;
    document.getElementById('pdf-vei').innerText = orc.veiculo_placa;

    // Resgata o JSON do banco
    const itensReais = orc.itens.lista_itens || [];
    const resumo = orc.itens.resumo || { total: orc.valor_total, pecas: 0, servicos: 0, desconto: 0 };

    // Filtra e Desenha a Tabela separando Peças de Serviços
    const pecas = itensReais.filter(i => i.tipo === 'Peça');
    const servicos = itensReais.filter(i => i.tipo === 'Serviço');
    
    let htmlTabela = '';
    
    if(pecas.length > 0) {
        htmlTabela += `<tr><td colspan="5" style="background-color: #f1f5f9; font-weight: bold; font-size: 11px; padding: 8px 12px; color: #475569; text-transform: uppercase;">1. Peças e Componentes</td></tr>`;
        htmlTabela += pecas.map(i => `
            <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #64748b;">${i.tipo}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 12px;">${i.quantidade}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">
                    <div style="font-weight: bold; font-size: 12px; color: #0f172a;">${i.descricao}</div>
                    ${i.detalhe ? `<div style="font-size: 10px; color: #64748b; margin-top: 3px; font-style: italic;">Obs: ${i.detalhe}</div>` : ''}
                </td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 12px;">${format(i.valor_unitario)}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-size: 12px; color: #0f172a;">${format(i.subtotal)}</td>
            </tr>
        `).join('');
    }

    if(servicos.length > 0) {
        htmlTabela += `<tr><td colspan="5" style="background-color: #f1f5f9; font-weight: bold; font-size: 11px; padding: 8px 12px; color: #475569; text-transform: uppercase; border-top: 2px solid #cbd5e1;">2. Mão de Obra e Serviços</td></tr>`;
        htmlTabela += servicos.map(i => `
            <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #64748b;">${i.tipo}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 12px;">${i.quantidade}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">
                    <div style="font-weight: bold; font-size: 12px; color: #0f172a;">${i.descricao}</div>
                    ${i.detalhe ? `<div style="font-size: 10px; color: #64748b; margin-top: 3px; font-style: italic;">Obs: ${i.detalhe}</div>` : ''}
                </td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 12px;">${format(i.valor_unitario)}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-size: 12px; color: #0f172a;">${format(i.subtotal)}</td>
            </tr>
        `).join('');
    }

    document.getElementById('pdf-itens').innerHTML = htmlTabela;

    // Preenche o Resumo Financeiro
    document.getElementById('pdf-tot-pecas').innerText = format(resumo.pecas || 0);
    document.getElementById('pdf-tot-servicos').innerText = format(resumo.servicos || 0);
    document.getElementById('pdf-tot-desc').innerText = `- ${format(resumo.desconto || 0)}`;
    document.getElementById('pdf-tot-final').innerText = format(resumo.total || orc.valor_total);

    // Preenche Observações Globais
    const boxObs = document.getElementById('pdf-container-obs');
    if(orc.observacao && orc.observacao.trim() !== '') {
        document.getElementById('pdf-obs-texto').innerText = orc.observacao;
        boxObs.style.display = 'block';
    } else {
        boxObs.style.display = 'none';
    }

    // Preenche Fotos (se existirem)
    const boxFotos = document.getElementById('pdf-container-fotos');
    const fotosGrid = document.getElementById('pdf-fotos-grid');
    if (orc.anexos && orc.anexos.length > 0) {
        fotosGrid.innerHTML = orc.anexos.map(imgBase64 => `
            <div style="width: 220px; height: 180px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background-color: #f1f5f9; display: flex; align-items: center; justify-content: center;">
                <img src="${imgBase64}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
            </div>
        `).join('');
        boxFotos.style.display = 'block';
    } else {
        boxFotos.style.display = 'none';
    }

    // Dispara o Gerador de PDF
    const el = document.getElementById('pdf-template-real');
    el.style.left = '0';
    el.style.top = '0';
    el.style.zIndex = '9999';

    html2pdf().set({ 
        margin: 0.4, 
        filename: `OS_${orc.numero_os}_AutoManager.pdf`, 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2, useCORS: true }, 
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } 
    }).from(el).outputPdf('bloburl').then((pdfUrl) => {
        window.open(pdfUrl, '_blank');
        el.style.left = '-9999px';
        el.style.top = '-9999px';
    });
}
