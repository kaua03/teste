// orcamentos.js

let itensTemporarios = [];
let valoresFinais = { pecas: 0, servicos: 0, desconto: 0, total: 0 };
let modalTipoAberto = '';

function initOrcamentos() {
    console.log("🟢 Módulo Orçamentos Inicializado.");
    buscarOrcamentosSupabase();
}

function alternarSubTelaOrcamento(modo) {
    const viewLista = document.getElementById('view-lista-orcamentos');
    const viewNovo = document.getElementById('view-novo-orcamento');

    if (modo === 'novo') {
        // Reseta tudo
        document.getElementById('db-cliente-nome').value = '';
        document.getElementById('db-veiculo-placa').value = '';
        document.getElementById('db-status').value = 'Orçamento';
        document.getElementById('desc-val').value = '';
        itensTemporarios = [];
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
 * ========================================================
 * MÁSCARAS E FUNÇÕES AUXILIARES
 * ========================================================
 */
const formataDinheiro = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function mascaraMoeda(campo, evento) {
    let valor = campo.value.replace(/\D/g, ''); // Remove tudo que não for número
    if (valor === '') { campo.value = ''; return; }
    
    valor = (parseInt(valor, 10) / 100).toFixed(2); // Divide por 100 para ter os centavos
    // Formata o número de volta para string brasileira: 1.000,00
    campo.value = valor.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
}

function reverterMoeda(texto) {
    if(!texto) return 0;
    return parseFloat(texto.replace(/\./g, '').replace(',', '.'));
}

function mascaraGeral(tipo, campo) {
    let v = campo.value;
    if (tipo === 'cpf') {
        v = v.replace(/\D/g, "");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        campo.value = v;
    } else if (tipo === 'cep') {
        v = v.replace(/\D/g, "");
        v = v.replace(/^(\d{5})(\d)/, "$1-$2");
        campo.value = v;
    } else if (tipo === 'tel') {
        v = v.replace(/\D/g, "");
        v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
        v = v.replace(/(\d)(\d{4})$/, "$1-$2");
        campo.value = v;
    } else if (tipo === 'placa') {
        // Aceita placa antiga (ABC-1234) e Mercosul (ABC1D23)
        v = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (v.length > 3) v = v.replace(/^([A-Z]{3})([0-9A-Z]{0,4})/, "$1-$2");
        campo.value = v;
    }
}

/**
 * ========================================================
 * MOTOR DE ITENS E CÁLCULO DE DESCONTOS (O NÚCLEO)
 * ========================================================
 */
function adicionarOuEditarItem() {
    const tipo = document.getElementById('item-tipo').value;
    const desc = document.getElementById('item-desc').value;
    const qtd = parseFloat(document.getElementById('item-qtd').value);
    const valString = document.getElementById('item-val').value;
    const idEdit = document.getElementById('item-id-edit').value;

    if(!desc || !qtd || !valString) return;
    
    const valFloat = reverterMoeda(valString);
    const sub = qtd * valFloat;

    if (idEdit) {
        // Modo Edição
        const index = itensTemporarios.findIndex(i => i.id_temp == idEdit);
        if (index > -1) {
            itensTemporarios[index] = { id_temp: idEdit, tipo, descricao: desc, quantidade: qtd, valor_unitario: valFloat, subtotal: sub };
        }
        document.getElementById('item-id-edit').value = '';
        document.getElementById('btn-add-item').innerHTML = '<i class="ph-bold ph-plus mr-1"></i> Add';
        document.getElementById('btn-add-item').classList.replace('bg-emerald-600', 'bg-slate-800');
    } else {
        // Modo Novo
        itensTemporarios.push({ id_temp: Date.now(), tipo, descricao: desc, quantidade: qtd, valor_unitario: valFloat, subtotal: sub });
    }

    document.getElementById('item-desc').value = '';
    document.getElementById('item-val').value = '';
    document.getElementById('item-qtd').value = '1';
    document.getElementById('item-desc').focus();
    
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
    document.getElementById('item-desc').value = item.descricao;
    document.getElementById('item-qtd').value = item.quantidade;
    
    // Alimenta e simula a digitação para a máscara funcionar
    const inputVal = document.getElementById('item-val');
    inputVal.value = (item.valor_unitario * 100).toString(); 
    mascaraMoeda(inputVal);

    document.getElementById('item-id-edit').value = item.id_temp;
    
    const btn = document.getElementById('btn-add-item');
    btn.innerHTML = '<i class="ph-bold ph-check mr-1"></i> Salvar';
    btn.classList.replace('bg-slate-800', 'bg-emerald-600');
}

function calcularTotais() {
    let sumPecas = 0;
    let sumServicos = 0;

    // 1. Somatória base
    itensTemporarios.forEach(item => {
        if (item.tipo === 'Peça') sumPecas += item.subtotal;
        else sumServicos += item.subtotal;
    });

    let totalBruto = sumPecas + sumServicos;
    let descValor = 0;

    // 2. Lógica de Desconto
    const descTipo = document.getElementById('desc-tipo').value; // 'perc' ou 'val'
    const descAlvo = document.getElementById('desc-alvo').value; // 'total', 'pecas', 'servicos'
    let inputDesc = document.getElementById('desc-val').value.replace(',', '.'); // Converte , para . para cálculo
    let descFator = parseFloat(inputDesc) || 0;

    if (descFator > 0) {
        let baseDeCalculo = 0;
        if (descAlvo === 'total') baseDeCalculo = totalBruto;
        else if (descAlvo === 'pecas') baseDeCalculo = sumPecas;
        else if (descAlvo === 'servicos') baseDeCalculo = sumServicos;

        if (descTipo === 'perc') {
            descValor = baseDeCalculo * (descFator / 100);
        } else {
            // Se for valor fixo, não pode ser maior que a base
            descValor = descFator > baseDeCalculo ? baseDeCalculo : descFator; 
        }
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
        divLista.innerHTML = '<div class="text-center text-slate-400 py-6 text-[10px] md:text-xs uppercase font-bold tracking-wider bg-slate-50 rounded-xl border border-dashed border-slate-200">Nenhum item adicionado.</div>';
    } else {
        divLista.innerHTML = itensTemporarios.map(item => {
            let badgeClass = item.tipo === 'Peça' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200';
            return `
            <div class="bg-white p-3 md:p-4 rounded-xl border border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 shadow-sm">
                <div class="flex-1">
                    <span class="border ${badgeClass} px-2 py-0.5 rounded text-[10px] font-black uppercase mr-2">${item.tipo}</span>
                    <span class="font-bold text-slate-800 text-sm">${item.quantidade}x ${item.descricao}</span> 
                    <span class="text-xs text-slate-400 ml-1">(${formataDinheiro(item.valor_unitario)})</span>
                </div>
                <div class="flex items-center gap-3 w-full lg:w-auto justify-between border-t lg:border-t-0 border-slate-100 pt-2 lg:pt-0">
                    <span class="font-black text-slate-900 text-sm md:text-base">${formataDinheiro(item.subtotal)}</span>
                    <div class="flex gap-1">
                        <button onclick="editarItem(${item.id_temp})" class="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition" title="Editar"><i class="ph-bold ph-pencil-simple text-lg"></i></button>
                        <button onclick="removerItemDB(${item.id_temp})" class="text-red-400 hover:bg-red-50 p-2 rounded-lg transition" title="Excluir"><i class="ph-bold ph-trash text-lg"></i></button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    // Atualiza Painel Escuro
    document.getElementById('resumo-pecas').innerText = formataDinheiro(valoresFinais.pecas);
    document.getElementById('resumo-servicos').innerText = formataDinheiro(valoresFinais.servicos);
    document.getElementById('resumo-desc').innerText = `- ${formataDinheiro(valoresFinais.desconto)}`;
    document.getElementById('db-total').innerText = formataDinheiro(valoresFinais.total);
}


/**
 * ========================================================
 * BANCO DE DADOS (SUPABASE) E TABELA
 * ========================================================
 */
async function buscarOrcamentosSupabase() {
    try {
        const { data: orcamentos, error } = await window.banco.from('orcamentos').select('*').order('id', { ascending: false });
        if (error) throw error;
        renderizarTabelaReal(orcamentos);
    } catch (erro) {
        console.error("Erro na listagem:", erro);
    }
}

async function salvarOrcamentoReal() {
    const nome = document.getElementById('db-cliente-nome').value;
    const placa = document.getElementById('db-veiculo-placa').value;
    const status = document.getElementById('db-status').value;

    if (!nome || !placa) { alert("Vincule um Cliente e uma Placa."); return; }
    if (itensTemporarios.length === 0) { alert("A O.S precisa de peças ou serviços."); return; }

    const btnSalvar = document.getElementById('btn-salvar-db');
    btnSalvar.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-xl"></i> SALVANDO O.S...';
    btnSalvar.disabled = true;

    try {
        // Empacotamos TUDO (Itens e Resumo Financeiro) no JSONB do banco
        const payloadJSONB = {
            lista_itens: itensTemporarios,
            resumo: valoresFinais
        };

        const { error } = await window.banco.from('orcamentos').insert([
            {
                cliente_nome: nome,
                veiculo_placa: placa,
                valor_total: valoresFinais.total, // Salva o valor final real
                status: status,
                itens: payloadJSONB // Suporta objetos complexos naturalmente!
            }
        ]);

        if (error) throw error;
        alternarSubTelaOrcamento('lista');
        
    } catch (erro) {
        console.error(erro);
        alert("Falha ao salvar a O.S.");
    } finally {
        btnSalvar.innerHTML = '<i class="ph-bold ph-floppy-disk text-xl"></i> SALVAR O.S.';
        btnSalvar.disabled = false;
    }
}

function obterCorStatus(status) {
    const cores = {
        'Orçamento': 'bg-slate-100 text-slate-600 border-slate-200',
        'Em Aberto': 'bg-slate-100 text-slate-600 border-slate-200',
        'Aguardando Aprovação': 'bg-amber-50 text-amber-600 border-amber-200',
        'Aguardando Pagamento': 'bg-amber-50 text-amber-600 border-amber-200',
        'Aguardando Peça': 'bg-orange-50 text-orange-600 border-orange-200',
        'Aprovado': 'bg-blue-50 text-blue-600 border-blue-200',
        'Em Execução': 'bg-blue-50 text-blue-600 border-blue-200',
        'Finalizado': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Não Usar': 'bg-red-50 text-red-600 border-red-200'
    };
    return cores[status] || cores['Orçamento'];
}

function renderizarTabelaReal(dados) {
    const tbody = document.getElementById('tabela-orcamentos-real');
    if (dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-400 font-medium">Nenhuma O.S registrada.</td></tr>';
        return;
    }

    tbody.innerHTML = dados.map(orc => {
        const dataStr = new Date(orc.data_criacao).toLocaleDateString('pt-BR');
        const corBg = obterCorStatus(orc.status);

        return `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 md:p-5">
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">${dataStr}</p>
                <p class="font-black text-slate-800 text-xs md:text-sm">O.S #${String(orc.id).padStart(4,'0')}</p>
            </td>
            <td class="p-4 md:p-5">
                <p class="font-bold text-slate-700 text-xs md:text-sm">${orc.cliente_nome}</p>
                <p class="text-[10px] text-blue-600 font-bold uppercase tracking-wider">${orc.veiculo_placa}</p>
            </td>
            <td class="p-4 md:p-5 font-black text-slate-800 text-right text-xs md:text-sm">${formataDinheiro(orc.valor_total)}</td>
            <td class="p-4 md:p-5 text-center">
                <span class="${corBg} border px-3 py-1 rounded-md text-[10px] font-bold shadow-sm whitespace-nowrap">${orc.status}</span>
            </td>
            <td class="p-4 md:p-5 text-center">
                <!-- Ações vazias por enquanto, preparadas para PDF -->
                <button class="bg-white text-slate-400 hover:text-blue-600 border border-slate-200 p-2 rounded-lg transition-colors"><i class="ph-bold ph-printer text-lg"></i></button>
            </td>
        </tr>`;
    }).join('');
}

/**
 * ========================================================
 * MODAL CADASTRO RÁPIDO & INTEGRAÇÃO VIA CEP
 * ========================================================
 */
function abrirModalCadastro(tipo) {
    modalTipoAberto = tipo;
    const modal = document.getElementById('modal-cadastro-rapido');
    const titulo = document.getElementById('modal-titulo');
    const conteudo = document.getElementById('modal-conteudo');

    if (tipo === 'cliente') {
        titulo.innerHTML = '<i class="ph-bold ph-user-plus mr-2"></i>Cadastrar Novo Cliente';
        conteudo.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome Completo / Razão Social</label>
                    <input type="text" id="cad-nome" class="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-bold">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">CPF / CNPJ</label>
                    <input type="text" id="cad-doc" onkeyup="mascaraGeral('cpf', this)" maxlength="14" placeholder="000.000.000-00" class="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Celular / WhatsApp</label>
                    <input type="text" id="cad-tel" onkeyup="mascaraGeral('tel', this)" maxlength="15" placeholder="(00) 00000-0000" class="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">CEP (Busca Automática)</label>
                    <input type="text" id="cad-cep" onkeyup="mascaraGeral('cep', this)" onblur="buscarCEP(this.value)" maxlength="9" placeholder="00000-000" class="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium text-blue-600">
                </div>
                <div class="md:col-span-2 flex gap-3">
                    <div class="flex-1">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Endereço (Rua/Av)</label>
                        <input type="text" id="cad-rua" class="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-slate-100 outline-none">
                    </div>
                    <div class="w-24">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Número</label>
                        <input type="text" id="cad-num" class="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-bold">
                    </div>
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bairro</label>
                    <input type="text" id="cad-bairro" class="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-slate-100 outline-none">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cidade / UF</label>
                    <input type="text" id="cad-cidade" class="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-slate-100 outline-none">
                </div>
            </div>
        `;
    } else {
        titulo.innerHTML = '<i class="ph-bold ph-jeep mr-2"></i>Cadastrar Novo Veículo';
        conteudo.innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Placa do Veículo</label>
                    <input type="text" id="cad-placa" onkeyup="mascaraGeral('placa', this)" maxlength="8" placeholder="ABC-1234" class="w-full border border-slate-300 p-3 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-black uppercase text-blue-700">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome / Modelo</label>
                        <input type="text" id="cad-modelo" placeholder="Ex: Fiat Toro" class="w-full border border-slate-300 p-3 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cor</label>
                        <input type="text" id="cad-cor" placeholder="Ex: Branco" class="w-full border border-slate-300 p-3 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ano</label>
                        <input type="number" id="cad-ano" placeholder="2024" class="w-full border border-slate-300 p-3 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vincular a Cliente</label>
                        <select id="cad-vinculo" class="w-full border border-slate-300 p-3 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
                            <option value="">Selecione...</option>
                            <option value="1">Kauã Freitas</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }
    
    modal.classList.remove('hidden');
}

function fecharModalCadastro() {
    document.getElementById('modal-cadastro-rapido').classList.add('hidden');
}

async function buscarCEP(cepInput) {
    const cep = cepInput.replace(/\D/g, '');
    if (cep.length !== 8) return;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await response.json();
        
        if (!dados.erro) {
            document.getElementById('cad-rua').value = dados.logradouro;
            document.getElementById('cad-bairro').value = dados.bairro;
            document.getElementById('cad-cidade').value = `${dados.localidade} / ${dados.uf}`;
            document.getElementById('cad-num').focus(); // Joga o cursor para o número
        }
    } catch (e) { console.error("Erro no CEP", e); }
}

function processarSalvamentoModal() {
    // Aqui no futuro faremos um supabase.from('clientes').insert(...)
    alert("Simulação: " + (modalTipoAberto === 'cliente' ? "Cliente" : "Veículo") + " salvo com sucesso! No próximo passo ligamos as tabelas reais.");
    fecharModalCadastro();
}
