// ========================================================
// AutoManager - Módulo de Orçamentos e O.S.
// ========================================================

let itensTemporarios = [];
let valoresFinais = { pecas: 0, servicos: 0, desconto: 0, total: 0 };
let modalTipoAberto = '';

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
    toast.className = `fixed top-20 right-4 md:right-8 z-[600] ${corBg} text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 fade-in font-inter`;
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
        v = v.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 7);
        if (v.length > 4) {
            if (/[0-9]/.test(v[4])) {
                v = v.substring(0, 3) + '-' + v.substring(3);
            }
        }
        campo.value = v;
    }
}

/**
 * LÓGICA DE ITENS E DESCONTOS
 */
function adicionarOuEditarItem() {
    const tipo = document.getElementById('item-tipo').value;
    const desc = document.getElementById('item-desc').value;
    const qtd = parseFloat(document.getElementById('item-qtd').value);
    const valString = document.getElementById('item-val').value;
    const idEdit = document.getElementById('item-id-edit').value;

    if(!desc) { dispararAlerta("A descrição do Item é obrigatória."); return; }
    if(!qtd || qtd <= 0) { dispararAlerta("A quantidade deve ser maior que zero."); return; }
    
    const valFloat = reverterMoeda(valString);
    if(valFloat <= 0) { dispararAlerta("O valor unitário não pode ser vazio."); return; }

    const sub = qtd * valFloat;

    if (idEdit) {
        const index = itensTemporarios.findIndex(i => i.id_temp == idEdit);
        if (index > -1) {
            itensTemporarios[index] = { id_temp: idEdit, tipo, descricao: desc, quantidade: qtd, valor_unitario: valFloat, subtotal: sub };
        }
        document.getElementById('item-id-edit').value = '';
        document.getElementById('btn-add-item').innerHTML = '<i class="ph-bold ph-plus mr-1"></i> Add';
        document.getElementById('btn-add-item').classList.replace('bg-emerald-600', 'bg-slate-900');
    } else {
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

        if (descTipo === 'perc') {
            descValor = baseDeCalculo * (descFator / 100);
        } else {
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
        divLista.innerHTML = `
        <div class="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <i class="ph-fill ph-package text-3xl text-slate-300 mb-2"></i>
            <p class="text-[10px] md:text-xs text-slate-400 uppercase font-bold tracking-wider">Nenhum item adicionado à O.S.</p>
        </div>`;
    } else {
        divLista.innerHTML = itensTemporarios.map(item => {
            let badgeClass = item.tipo === 'Peça' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200';
            return `
            <div class="bg-white p-3 md:p-4 rounded-xl border border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 shadow-sm hover:border-blue-200 transition-colors">
                <div class="flex-1">
                    <span class="border ${badgeClass} px-2 py-0.5 rounded text-[10px] font-black uppercase mr-2 shadow-sm">${item.tipo}</span>
                    <span class="font-bold text-slate-800 text-sm">${item.quantidade}x ${item.descricao}</span> 
                    <span class="text-xs text-slate-400 ml-1">(${formataDinheiro(item.valor_unitario)})</span>
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
 * BANCO DE DADOS (AGORA LENDO O NUMERO_OS)
 * ========================================================
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
        console.error("Erro na listagem:", erro);
        document.getElementById('tabela-orcamentos-real').innerHTML = `
            <tr><td colspan="5" class="p-8 text-center text-red-500 font-bold bg-red-50">Falha de conexão. Recarregue a página.</td></tr>`;
    }
}

async function salvarOrcamentoReal() {
    const nome = document.getElementById('db-cliente-nome').value;
    const placa = document.getElementById('db-veiculo-placa').value;
    const status = document.getElementById('db-status').value;

    if (!nome) { dispararAlerta("Selecione ou cadastre um Cliente primeiro."); return; }
    if (!placa) { dispararAlerta("Vincule a Placa do veículo."); return; }
    if (itensTemporarios.length === 0) { dispararAlerta("A O.S precisa de peças ou serviços para ser gravada."); return; }

    const btnSalvar = document.getElementById('btn-salvar-db');
    btnSalvar.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-xl"></i> SALVANDO...';
    btnSalvar.disabled = true;

    try {
        const payloadJSONB = { lista_itens: itensTemporarios, resumo: valoresFinais };
        
        const { error } = await window.banco.from('orcamentos').insert([{
            cliente_nome: nome, 
            veiculo_placa: placa, 
            valor_total: valoresFinais.total, 
            status: status, 
            itens: payloadJSONB
        }]);

        if (error) throw error;
        dispararAlerta("Ordem de Serviço salva com sucesso!", "sucesso");
        alternarSubTelaOrcamento('lista');
        
    } catch (erro) {
        console.error("Erro ao gravar:", erro);
        dispararAlerta("Falha de comunicação com o servidor.");
    } finally {
        btnSalvar.innerHTML = '<i class="ph-bold ph-floppy-disk text-xl"></i> SALVAR O.S.';
        btnSalvar.disabled = false;
    }
}

function obterCorStatus(status) {
    const cores = {
        'Em Aberto': 'bg-slate-100 text-slate-700 border-slate-200',
        'Aguardando Aprovação': 'bg-yellow-50 text-yellow-700 border-yellow-200',
        'Aguardando Peça': 'bg-orange-50 text-orange-700 border-orange-200',
        'Aguardando Pagamento': 'bg-amber-50 text-amber-700 border-amber-200',
        'Aprovado': 'bg-blue-50 text-blue-700 border-blue-200',
        'Em Execução': 'bg-indigo-50 text-indigo-700 border-indigo-200',
        'Finalizado': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Não Usar': 'bg-red-50 text-red-700 border-red-200',
        'Orçamento': 'bg-slate-50 text-slate-500 border-slate-200'
    };
    return cores[status] || cores['Em Aberto'];
}

function renderizarTabelaReal(dados) {
    const tbody = document.getElementById('tabela-orcamentos-real');
    
    if (dados.length === 0) {
        tbody.innerHTML = `
        <tr>
            <td colspan="5" class="p-10 text-center">
                <i class="ph-fill ph-receipt text-4xl text-slate-300 mb-3"></i>
                <p class="text-sm font-bold text-slate-500">Nenhuma O.S registrada no sistema.</p>
            </td>
        </tr>`;
        return;
    }

    tbody.innerHTML = dados.map(orc => {
        const dataStr = new Date(orc.data_criacao).toLocaleDateString('pt-BR');
        const corBg = obterCorStatus(orc.status);
        const orcJSON = encodeURIComponent(JSON.stringify(orc));

        return `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 md:p-5">
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">${dataStr}</p>
                <p class="font-black text-slate-800 text-xs md:text-sm">O.S #${orc.numero_os}</p>
            </td>
            <td class="p-4 md:p-5">
                <p class="font-bold text-slate-700 text-xs md:text-sm">${orc.cliente_nome}</p>
                <p class="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">${orc.veiculo_placa}</p>
            </td>
            <td class="p-4 md:p-5 font-black text-slate-800 text-right text-xs md:text-sm">${formataDinheiro(orc.valor_total)}</td>
            <td class="p-4 md:p-5 text-center">
                <span class="${corBg} border px-2 md:px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm whitespace-nowrap">${orc.status}</span>
            </td>
            <td class="p-4 md:p-5 text-center">
                <button onclick="gerarPDFSupabase('${orcJSON}')" class="bg-white text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 border border-slate-200 p-2 rounded-lg transition-colors shadow-sm" title="Baixar PDF">
                    <i class="ph-bold ph-file-pdf text-lg"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

/**
 * ========================================================
 * MODAL DE CADASTRO RÁPIDO E VIACEP
 * ========================================================
 */
function abrirModalCadastro(tipo) {
    modalTipoAberto = tipo;
    
    document.getElementById('visor-da-tv').classList.add('overflow-y-hidden');
    document.getElementById('visor-da-tv').classList.remove('overflow-y-auto');

    const modal = document.getElementById('modal-cadastro-rapido');
    const titulo = document.getElementById('modal-titulo');
    const conteudo = document.getElementById('modal-conteudo');

    if (tipo === 'cliente') {
        titulo.innerHTML = '<i class="ph-bold ph-user-plus mr-2"></i>Cadastrar Novo Cliente';
        conteudo.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                    <input type="text" id="cad-nome" class="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-bold text-slate-800">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">CPF</label>
                    <input type="text" id="cad-doc" onkeyup="mascaraGeral('cpf', this)" maxlength="14" placeholder="000.000.000-00" class="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium text-slate-800">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Celular / WhatsApp</label>
                    <input type="text" id="cad-tel" onkeyup="mascaraGeral('tel', this)" maxlength="15" placeholder="(00) 00000-0000" class="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">E-mail</label>
                    <input type="email" id="cad-email" placeholder="cliente@email.com" class="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
                </div>
                <div>
                    <label class="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
                        <span>CEP (Busca Automática)</span>
                        <span id="cep-status" class="hidden text-[9px]"></span>
                    </label>
                    <input type="text" id="cad-cep" onkeyup="mascaraGeral('cep', this)" onblur="buscarCEP(this.value)" maxlength="9" placeholder="00000-000" class="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-bold text-slate-700">
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
                <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-2 md:col-span-1">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Placa (Padrão ou Mercosul)</label>
                        <input type="text" id="cad-placa" onkeyup="mascaraGeral('placa', this)" maxlength="8" placeholder="ABC-1234" class="w-full border border-slate-300 p-3 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-black uppercase text-blue-700">
                    </div>
                    <div class="col-span-2 md:col-span-1">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome / Modelo</label>
                        <input type="text" id="cad-modelo" placeholder="Ex: Fiat Toro" class="w-full border border-slate-300 p-3 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-4">
                    <div class="col-span-2">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cor</label>
                        <input type="text" id="cad-cor" placeholder="Ex: Branco" class="w-full border border-slate-300 p-3 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ano</label>
                        <input type="number" id="cad-ano" placeholder="2024" class="w-full border border-slate-300 p-3 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
                    </div>
                </div>
            </div>
        `;
    }
    
    modal.classList.remove('hidden');
}

function fecharModalCadastro() {
    document.getElementById('visor-da-tv').classList.add('overflow-y-auto');
    document.getElementById('visor-da-tv').classList.remove('overflow-y-hidden');
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
                statusSpan.innerHTML = '<i class="ph-bold ph-check"></i> Encontrado!';
                statusSpan.className = 'text-[9px] text-emerald-500 uppercase';
                setTimeout(() => statusSpan.classList.add('hidden'), 2500);
            }
        } else {
            dispararAlerta("CEP não encontrado.");
            if(statusSpan) {
                statusSpan.innerHTML = '<i class="ph-bold ph-x"></i> Inválido';
                statusSpan.className = 'text-[9px] text-red-500 uppercase';
            }
        }
    } catch (e) { 
        dispararAlerta("Falha de conexão ao buscar o CEP.");
        if(statusSpan) statusSpan.classList.add('hidden');
    }
}

function processarSalvamentoModal() {
    if (modalTipoAberto === 'cliente') {
        const nome = document.getElementById('cad-nome').value;
        if(!nome) { dispararAlerta("O nome é obrigatório para vincular."); return; }
        
        const selectCliente = document.getElementById('db-cliente-nome');
        selectCliente.innerHTML += `<option value="${nome}" selected>${nome}</option>`;
        dispararAlerta("Cliente vinculado na O.S!", "sucesso");
    } else {
        const placa = document.getElementById('cad-placa').value;
        const modelo = document.getElementById('cad-modelo').value;
        if(!placa) { dispararAlerta("A placa é obrigatória."); return; }
        
        const selectVeiculo = document.getElementById('db-veiculo-placa');
        selectVeiculo.innerHTML += `<option value="${placa}" selected>${placa} - ${modelo}</option>`;
        dispararAlerta("Veículo vinculado à O.S!", "sucesso");
    }
    fecharModalCadastro();
}

/**
 * ========================================================
 * GERAÇÃO DE PDF
 * ========================================================
 */
function gerarPDFSupabase(dadosCodificados) {
    const orc = JSON.parse(decodeURIComponent(dadosCodificados));
    const format = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    document.getElementById('pdf-id').innerText = orc.numero_os;
    document.getElementById('pdf-data').innerText = new Date(orc.data_criacao).toLocaleDateString('pt-BR');
    document.getElementById('pdf-cli').innerText = orc.cliente_nome;
    document.getElementById('pdf-vei').innerText = orc.veiculo_placa;
    document.getElementById('pdf-tot').innerText = format(orc.valor_total);

    const itensReais = orc.itens.lista_itens || [];
    
    document.getElementById('pdf-itens').innerHTML = itensReais.map(i => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-transform: uppercase;">${i.tipo}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${i.quantidade}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${i.descricao}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${format(i.valor_unitario)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${format(i.subtotal)}</td>
        </tr>
    `).join('');

    const el = document.getElementById('pdf-template-real');
    el.style.left = '0';
    el.style.top = '0';
    el.style.zIndex = '9999';

    html2pdf().set({ 
        margin: 0.5, 
        filename: `OS_${orc.numero_os}_AutoManager.pdf`, 
        image: { type: 'jpeg', quality: 1 }, 
        html2canvas: { scale: 2 }, 
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } 
    }).from(el).save().then(() => {
        el.style.left = '-9999px';
        el.style.top = '-9999px';
    });
}
