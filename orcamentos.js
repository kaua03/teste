<div class="max-w-7xl mx-auto w-full pb-28 md:pb-4 flex flex-col relative font-sans min-h-screen">
    
    <div id="loading-screen" class="absolute inset-0 bg-slate-50 z-[2000] flex flex-col items-center justify-center transition-opacity duration-300 rounded-2xl hidden">
        <div class="relative w-20 h-20 mb-4">
            <div class="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <i class="ph-fill ph-car-profile absolute inset-0 flex items-center justify-center text-3xl text-blue-600"></i>
        </div>
        <h2 class="text-lg font-black text-slate-800 tracking-tight">Carregando Módulo...</h2>
        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Sincronizando Banco de Dados</p>
    </div>

    <div id="view-lista-orcamentos" class="space-y-6 block fade-in">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div>
                <h2 class="text-2xl font-black text-slate-800 tracking-tight">Ordens de Serviço</h2>
                <p class="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">Histórico e Gerenciamento</p>
            </div>
            
            <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div class="relative w-full sm:w-64">
                    <i class="ph-bold ph-magnifying-glass absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg"></i>
                    <input type="text" id="input-pesquisa-os" onkeyup="window.filtrarTabelaOS()" placeholder="Buscar O.S, cliente, status..." class="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 transition-colors bg-slate-50 focus:bg-white shadow-sm">
                </div>
                <button onclick="window.alternarSubTelaOrcamento('novo')" class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-[0_4px_12px_rgba(37,99,235,0.3)] transition-transform transform active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap">
                    <i class="ph-bold ph-plus text-lg"></i> Nova O.S.
                </button>
            </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1">
            <div class="w-full overflow-x-auto">
                <table class="w-full text-left whitespace-nowrap">
                    <thead class="bg-slate-50/80 border-b border-slate-100">
                        <tr class="text-slate-500 text-[10px] md:text-xs uppercase tracking-wider font-bold">
                            <th class="p-4 md:p-5">Data / O.S</th>
                            <th class="p-4 md:p-5">Cliente / Veículo</th>
                            <th class="p-4 md:p-5 text-right">Valor Final</th>
                            <th class="p-4 md:p-5 text-center">Status</th>
                            <th class="p-4 md:p-5 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="tabela-orcamentos-real" class="text-xs md:text-sm divide-y divide-slate-100">
                        </tbody>
                </table>
            </div>
        </div>
    </div>

    <div id="view-novo-orcamento" class="hidden fade-in space-y-6">
        
        <div class="flex items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div class="flex items-center gap-4">
                <button onclick="window.alternarSubTelaOrcamento('lista')" class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-slate-600">
                    <i class="ph-bold ph-arrow-left text-lg"></i>
                </button>
                <div>
                    <h2 id="titulo-tela-os" class="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">Emissão de O.S.</h2>
                    <p class="text-[10px] md:text-xs text-blue-600 font-bold uppercase mt-0.5 tracking-wider">Modo Detalhado de Orçamentação</p>
                </div>
            </div>
            <div id="badge-os-fechada" class="hidden px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                </div>
        </div>

        <div class="flex gap-2 sm:gap-6 border-b border-slate-200 px-2 overflow-x-auto">
            <button id="aba-dados" onclick="window.mudarAbaOS('dados')" class="pb-3 px-2 font-black text-blue-600 border-b-2 border-blue-600 transition-colors whitespace-nowrap text-sm">Detalhes da O.S.</button>
            <button id="aba-fin" onclick="window.mudarAbaOS('fin')" class="pb-3 px-2 font-bold text-slate-400 border-b-2 border-transparent hover:text-slate-600 transition-colors whitespace-nowrap text-sm flex items-center gap-2 hidden"><i class="ph-bold ph-wallet text-lg"></i> Gestão Financeira</button>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            <div class="xl:col-span-2 flex flex-col gap-6 relative">
                
                <div id="aba-conteudo-dados" class="space-y-6 fade-in block">
                    <div class="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 class="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wider mb-5 border-b border-slate-50 pb-3 flex items-center gap-2"><div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs border border-blue-100">1</div> Cliente e Veículo</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <div class="flex justify-between items-center mb-1"><label class="block text-[10px] font-bold text-slate-400 uppercase">Cliente Vinculado <span class="text-red-500">*</span></label><button onclick="window.abrirModalCadastro('cliente')" class="btn-cad-rapido text-[10px] text-blue-600 font-bold hover:underline bg-blue-50 px-2 py-0.5 rounded transition">+ Cadastrar</button></div>
                                <select id="db-cliente-nome" onchange="window.vincularClienteViceVersa('cliente')" class="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-700 bg-slate-50 cursor-pointer transition">
                                    <option value="">Carregando Clientes...</option>
                                </select>
                            </div>
                            <div>
                                <div class="flex justify-between items-center mb-1"><label class="block text-[10px] font-bold text-slate-400 uppercase">Veículo / Placa <span class="text-red-500">*</span></label><button onclick="window.abrirModalCadastro('veiculo')" class="btn-cad-rapido text-[10px] text-blue-600 font-bold hover:underline bg-blue-50 px-2 py-0.5 rounded transition">+ Cadastrar</button></div>
                                <select id="db-veiculo-placa" onchange="window.vincularClienteViceVersa('veiculo')" class="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-700 bg-slate-50 cursor-pointer uppercase transition">
                                    <option value="">Carregando Veículos...</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 class="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wider mb-5 border-b border-slate-50 pb-3 flex items-center gap-2"><div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs border border-blue-100">2</div> Peças e Serviços</h3>
                        <div id="box-add-item" class="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner mb-6 space-y-3">
                            <div class="flex flex-col md:flex-row gap-3">
                                <div class="w-full md:w-32"><select id="item-tipo" class="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm font-bold bg-white text-slate-600 shadow-sm"><option value="Peça">Peça</option><option value="Serviço">Serviço</option></select></div>
                                <div class="flex-1"><input type="text" id="item-nome" placeholder="Ex: Kit Correia Dentada" class="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm font-bold shadow-sm bg-white"></div>
                                <div class="flex gap-3">
                                    <input type="number" id="item-qtd" placeholder="Qtd" value="1" class="w-20 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm text-center font-bold shadow-sm bg-white">
                                    <input type="text" id="item-val" placeholder="R$ 0,00" onkeyup="window.mascaraMoeda(this)" class="w-28 md:w-32 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm font-bold shadow-sm bg-white">
                                </div>
                            </div>
                            <div class="flex flex-col md:flex-row gap-3">
                                <div class="flex-1"><input type="text" id="item-desc" placeholder="Observação do Item (Opcional)..." class="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm font-medium shadow-sm bg-white"></div>
                                <input type="hidden" id="item-id-edit" value="">
                                <button onclick="window.adicionarOuEditarItem()" id="btn-add-item" class="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-lg font-bold transition-all text-sm shadow-md py-2.5 flex items-center justify-center"><i class="ph-bold ph-plus mr-1"></i> Add Item</button>
                            </div>
                        </div>
                        <div id="lista-itens-db" class="space-y-3 min-h-[100px]"><div class="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200"><i class="ph-fill ph-package text-3xl text-slate-300 mb-2"></i><p class="text-[10px] md:text-xs text-slate-400 uppercase font-bold tracking-wider">Nenhum item adicionado à O.S.</p></div></div>
                    </div>

                    <div class="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 class="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wider mb-5 border-b border-slate-50 pb-3 flex items-center gap-2"><div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs border border-blue-100">3</div> Detalhes e Anexos Digitais</h3>
                        <div class="space-y-5">
                            <div>
                                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Observação Geral da O.S (Aparece no PDF)</label>
                                <textarea id="db-obs" rows="3" placeholder="Ex: Cliente relatou barulho ao frear..." class="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 text-sm font-medium text-slate-700 bg-slate-50 resize-none"></textarea>
                            </div>
                            <div id="box-upload-fotos">
                                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Fotos e Evidências (Salvas apenas no sistema)</label>
                                <label class="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition">
                                    <div class="flex flex-col items-center justify-center pt-5 pb-6"><i class="ph-bold ph-camera text-2xl text-slate-400 mb-1"></i><p class="text-xs text-slate-500 font-bold">Clique para adicionar fotos</p></div>
                                    <input type="file" id="input-anexos" class="hidden" multiple accept="image/*" onchange="window.processarImagens(event)" />
                                </label>
                            </div>
                            <div id="preview-anexos" class="flex flex-wrap gap-3 mt-4 hidden"></div>
                        </div>
                    </div>
                </div>
                
                <div id="aba-conteudo-fin" class="fade-in hidden w-full">
                    
                    <div id="fin-bloqueado-box" class="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hidden">
                        <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100"><i class="ph-fill ph-lock-key text-4xl text-slate-300"></i></div>
                        <h3 class="text-lg font-black text-slate-700 mb-1">O.S. não registrada</h3>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Salve a O.S. pela primeira vez para liberar o Faturamento.</p>
                    </div>

                    <div id="fin-liberado-box" class="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 hidden w-full">
                        <h3 class="text-xl font-black text-slate-800 flex items-center gap-2 mb-1"><i class="ph-fill ph-wallet text-emerald-500 text-2xl"></i> Painel Financeiro</h3>
                        <p class="text-xs text-slate-500 font-medium mb-6 pb-4 border-b border-slate-100" id="fin-aba-subtitulo">Gerencie os pagamentos atrelados a esta Ordem de Serviço.</p>

                        <div id="fin-gerador-box" class="space-y-6">
                            <div>
                                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-2">Modalidade de Acerto</label>
                                <select id="tab-fin-tipo" onchange="window.mudarTipoFaturamentoTab()" class="w-full border border-slate-300 p-3.5 rounded-xl text-sm bg-slate-50 focus:bg-white focus:border-emerald-500 font-bold text-slate-800 shadow-sm cursor-pointer transition-colors">
                                    <option value="avista">Pagamento Total na Entrega (À Vista)</option>
                                    <option value="entrada_parcela">Dar uma Entrada + Parcelar o Saldo</option>
                                    <option value="parcelado">Parcelar o Valor Total (Sem Entrada)</option>
                                </select>
                            </div>

                            <div id="tab-box-entrada" class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                                <div>
                                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor Recebido (R$)</label>
                                    <input type="text" id="tab-fin-entrada" onkeyup="window.mascaraMoeda(this); window.checarSomaGeradorTab()" placeholder="0,00" class="w-full border border-slate-300 p-3 rounded-xl text-lg bg-white outline-none focus:border-emerald-500 font-black text-emerald-600 shadow-sm transition-colors">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Forma de Pagto.</label>
                                    <select id="tab-fin-forma-entrada" onchange="window.checarSomaGeradorTab()" class="w-full border border-slate-300 p-3 rounded-xl text-sm bg-white focus:border-emerald-500 font-bold text-slate-800 cursor-pointer shadow-sm">
                                        <option value="Pix" selected>Pix</option>
                                        <option value="Dinheiro">Dinheiro Físico</option>
                                        <option value="Cartão de Débito">Cartão de Débito</option>
                                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                                        <option value="Boleto">Boleto</option>
                                        <option value="Transferência">Transferência Bancária</option>
                                    </select>
                                </div>
                            </div>

                            <div id="tab-box-parcelamento" class="hidden space-y-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nº Parcelas</label>
                                        <input type="number" id="tab-fin-parcelas" oninput="window.checarSomaGeradorTab()" value="1" min="1" max="120" class="w-full border border-slate-300 p-3 rounded-xl text-center text-lg bg-white outline-none focus:border-emerald-500 font-black text-slate-800 shadow-sm transition-colors">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">1º Vencimento</label>
                                        <input type="date" id="tab-fin-vencimento-base" onchange="window.checarSomaGeradorTab()" class="w-full border border-slate-300 p-3 rounded-xl text-sm bg-white outline-none focus:border-emerald-500 font-bold text-slate-800 shadow-sm">
                                    </div>
                                </div>
                                <div id="tab-fin-simulacao" class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-medium shadow-inner space-y-2 mt-2 max-h-64 overflow-y-auto"></div>
                            </div>
                            
                            <button onclick="window.processarLancarFinanceiroTab()" id="btn-salvar-fin-tab" class="w-full bg-emerald-600 text-white font-black py-4 rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.4)] hover:bg-emerald-700 transition transform active:scale-95 flex items-center justify-center gap-2 mt-4"><i class="ph-bold ph-check-circle text-xl"></i> Gerar Faturamento e Fechar O.S</button>
                        </div>

                        <div id="fin-editor-box" class="hidden space-y-4 w-full">
                            <div id="lista-financeiro-vinculado" class="space-y-3 w-full">
                                </div>
                        </div>
                    </div>
                </div>

            </div>

            <div class="space-y-6 sticky top-24 h-fit mb-10 xl:mb-0">
                
                <div class="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-emerald-200 hidden mb-6" id="box-auditoria-financeira">
                    <div class="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
                        <h3 class="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center"><i class="ph-bold ph-scales text-emerald-500 mr-2 text-lg"></i> Auditoria</h3>
                    </div>
                    <div class="space-y-4">
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center shadow-inner">
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total da O.S</p>
                            <h4 class="text-2xl font-black text-slate-800" id="fin-aba-total-os">R$ 0,00</h4>
                        </div>
                        
                        <div class="flex justify-center"><i class="ph-bold ph-arrows-down-up text-xl text-slate-300"></i></div>
                        
                        <div class="p-4 rounded-xl border transition-colors shadow-inner text-center" id="fin-aba-soma-box">
                            <p class="text-[10px] font-bold uppercase tracking-wider mb-1" id="fin-aba-soma-label">Soma Lançamentos</p>
                            <h4 class="text-2xl font-black" id="fin-aba-soma">R$ 0,00</h4>
                        </div>
                        
                        <div id="fin-aba-alerta" class="hidden bg-red-50 p-3 rounded-lg border border-red-100 text-red-600 text-[10px] font-bold text-center leading-relaxed">
                            <i class="ph-bold ph-warning text-lg mb-1 block"></i> Os valores não batem. Ajuste as parcelas para a conta fechar!
                        </div>
                    </div>

                    <div class="mt-6 pt-6 border-t border-slate-100 space-y-3">
                        <button id="btn-salvar-fin-edicao" onclick="window.salvarFinanceiroEditado()" class="hidden w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:bg-blue-700 transition transform active:scale-95 flex items-center justify-center gap-2 text-sm">
                            <i class="ph-bold ph-floppy-disk text-lg"></i> SALVAR FINANCEIRO
                        </button>
                        <button id="btn-estornar-fin" onclick="window.limparFinanceiroAtual()" class="hidden w-full bg-white text-red-500 font-bold py-3 rounded-xl border border-red-200 hover:bg-red-50 transition transform active:scale-95 flex items-center justify-center gap-2 text-xs">
                            <i class="ph-bold ph-trash text-lg"></i> Apagar Lançamentos
                        </button>
                    </div>
                </div>

                <div class="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100" id="box-desconto">
                    <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2 flex items-center"><i class="ph-bold ph-tag text-blue-500 mr-2"></i> Desconto</h3>
                    <div class="space-y-3">
                        <div class="flex gap-2">
                            <select id="desc-tipo" onchange="window.calcularTotais()" class="w-1/3 border border-slate-200 rounded-lg p-2.5 outline-none text-sm font-bold text-slate-600 bg-slate-50"><option value="perc">%</option><option value="val">R$</option></select>
                            <input type="text" id="desc-val" onkeyup="this.value = this.value.replace(/[^0-9,]/g, ''); window.calcularTotais()" placeholder="0,00" class="flex-1 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm font-bold">
                        </div>
                        <select id="desc-alvo" onchange="window.calcularTotais()" class="w-full border border-slate-200 rounded-lg p-2.5 outline-none text-sm font-bold text-slate-600 bg-slate-50"><option value="total">No Total da O.S</option><option value="pecas">Somente nas Peças</option><option value="servicos">Somente nos Serviços</option></select>
                    </div>
                </div>

                <div id="box-caixa-preta" class="bg-slate-900 text-white p-5 md:p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col">
                    <div class="mb-5" id="box-status">
                        <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Status da O.S</label>
                        <select id="db-status" onchange="window.verificarStatusFinanceiro()" class="w-full border border-slate-700 rounded-xl p-3.5 bg-slate-800 text-white outline-none text-sm font-bold focus:border-blue-500 shadow-inner transition-colors">
                            <option value="Em Aberto" selected>Em Aberto</option>
                            <option value="Aguardando Aprovação">Aguardando Aprovação</option>
                            <option value="Aguardando Peça">Aguardando Peça</option>
                            <option value="Aguardando Pagamento">Aguardando Pagamento</option>
                            <option value="Aprovado">Aprovado</option>
                            <option value="Em Execução">Em Execução</option>
                            <option value="Finalizado">Finalizado</option>
                            <option value="Fechado" class="hidden" disabled>Fechado (Faturado)</option>
                            <option value="Não Usar">Não Usar</option>
                            <option value="Orçamento">Orçamento</option>
                        </select>
                    </div>

                    <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-3 mb-6 shadow-inner">
                        <div class="flex justify-between text-sm text-slate-400 font-medium"><span>Peças:</span> <span id="resumo-pecas">R$ 0,00</span></div>
                        <div class="flex justify-between text-sm text-slate-400 font-medium"><span>Serviços:</span> <span id="resumo-servicos">R$ 0,00</span></div>
                        <div class="flex justify-between text-sm text-red-400 font-bold"><span>Desconto:</span> <span id="resumo-desc">- R$ 0,00</span></div>
                        <div class="border-t border-slate-700 pt-3 mt-2 flex justify-between items-end">
                            <span class="font-bold text-slate-300 text-xs">VALOR FINAL:</span>
                            <span class="font-black text-2xl md:text-3xl text-blue-400 tracking-tight" id="db-total">R$ 0,00</span>
                        </div>
                    </div>
                    
                    <button onclick="window.salvarOrcamentoReal()" id="btn-salvar-db" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition-transform transform active:scale-95 flex justify-center items-center gap-2 text-sm md:text-base"><i class="ph-bold ph-floppy-disk text-xl"></i> SALVAR O.S.</button>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="modal-confirmacao-exclusao" class="hidden fixed inset-0 bg-slate-900/80 z-[1000] flex items-center justify-center p-4 fade-in">
    <div class="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden transform transition-all">
        <div class="p-6 text-center">
            <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100"><i class="ph-bold ph-trash text-3xl text-red-500"></i></div>
            <h3 class="text-xl font-black text-slate-800 mb-2">Excluir O.S. <span id="exc-os-num" class="text-red-600"></span>?</h3>
            <p class="text-sm text-slate-500 font-medium">Esta ação apagará permanentemente a ordem de serviço e todos os seus itens. <br>Não pode ser desfeita.</p>
        </div>
        <div class="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
            <button onclick="window.fecharModalExclusao()" class="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-sm">Cancelar</button>
            <button onclick="window.confirmarExclusao()" class="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md flex items-center justify-center gap-2"><i class="ph-bold ph-warning"></i> Excluir</button>
        </div>
    </div>
</div>

<div id="modal-senha-destravar" class="hidden fixed inset-0 bg-slate-900/90 z-[1500] flex items-center justify-center p-4 fade-in">
    <div class="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden transform transition-all">
        <div class="p-6 text-center">
            <div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-600"><i class="ph-bold ph-lock-key-open text-3xl text-blue-500"></i></div>
            <h3 class="text-xl font-black text-white mb-2">Destravar a O.S?</h3>
            <p class="text-xs text-slate-400 font-medium mb-6">A O.S entrará em modo de edição temporária. Lembre-se de conferir se o Financeiro bate na Auditoria se alterar valores. <br><br><b>Digite a senha gerencial:</b></p>
            <input type="password" id="input-senha-reabrir" placeholder="Senha..." class="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-center text-white font-bold outline-none focus:border-blue-500 tracking-widest text-lg">
        </div>
        <div class="p-4 bg-slate-800 border-t border-slate-700 flex gap-3">
            <button onclick="window.fecharModalDestravar()" class="flex-1 py-3 bg-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-600 transition-colors text-sm">Cancelar</button>
            <button onclick="window.processarDestravarOS()" class="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors shadow-md flex items-center justify-center gap-2 text-sm"><i class="ph-bold ph-lock-key-open"></i> Destravar</button>
        </div>
    </div>
</div>

<div id="modal-cadastro-rapido" class="hidden fixed inset-0 bg-slate-900/80 z-[500] flex items-center justify-center p-4 pb-28 md:pb-4 fade-in">
    <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-full overflow-hidden">
        <div class="bg-blue-600 p-4 md:p-5 flex justify-between items-center text-white shrink-0 rounded-t-2xl">
            <h3 id="modal-titulo" class="font-bold text-lg tracking-tight">Novo Cadastro</h3>
            <button onclick="window.fecharModalCadastro()" class="hover:bg-blue-700 p-1.5 rounded-lg transition"><i class="ph-bold ph-x text-xl"></i></button>
        </div>
        <div class="p-4 md:p-6 overflow-y-auto flex-1" id="modal-conteudo"></div>
        <div class="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
            <button onclick="window.fecharModalCadastro()" class="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition text-sm">Cancelar</button>
            <button onclick="window.processarSalvamentoModal()" class="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition text-sm flex items-center gap-2"><i class="ph-bold ph-check"></i> Salvar</button>
        </div>
    </div>
</div>

<div style="position: fixed; top: 0; left: 200vw; width: 800px; opacity: 0; pointer-events: none; z-index: -9999; background-color: white;">
    <div id="pdf-template-real" style="padding: 30px 40px; color: #000000; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="border-bottom: 2px solid #000000; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
                <h1 style="font-size: 24px; font-weight: 900; margin: 0; color: #000000; text-transform: uppercase; letter-spacing: -0.5px;">AUTOMANAGER OFICINA</h1>
                <p style="font-size: 9px; color: #4B5563; margin: 2px 0 0 0; font-weight: bold; text-transform: uppercase;">Serviços Automotivos Avançados</p>
                <p style="font-size: 9px; color: #6B7280; margin: 1px 0 0 0;">CNPJ: 00.000.000/0001-00 | Rua Fictícia, 123 - Centro</p>
            </div>
            <div style="text-align: right;">
                <h2 style="font-size: 18px; font-weight: 900; color: #000000; margin: 0; letter-spacing: -0.5px;">ORDEM DE SERVIÇO <span id="pdf-id"></span></h2>
                <p style="font-size: 10px; margin: 4px 0 0 0; color: #000000;"><span style="font-weight: bold;">Abertura:</span> <span id="pdf-data-abertura"></span></p>
                <p style="font-size: 10px; margin: 1px 0 0 0; color: #000000;"><span style="font-weight: bold;">Emissão:</span> <span id="pdf-data-emissao"></span></p>
                <p style="font-size: 10px; margin: 1px 0 0 0; color: #000000;"><span style="font-weight: bold;">Status:</span> <span id="pdf-status"></span></p>
            </div>
        </div>
        <div style="border: 1px solid #000000; padding: 10px; margin-bottom: 20px; font-size: 11px; line-height: 1.6; color: #000000; background-color: #F9FAFB;">
            <div style="display: flex; flex-wrap: wrap; margin-bottom: 4px;">
                <div style="width: 50%;"><span style="font-weight: 900;">NOME:</span> <span id="pdf-cli-nome" style="text-transform: uppercase;"></span></div>
                <div style="width: 25%;"><span style="font-weight: 900;">CPF:</span> <span id="pdf-cli-doc"></span></div>
                <div style="width: 25%;"><span style="font-weight: 900;">CELULAR:</span> <span id="pdf-cli-tel"></span></div>
            </div>
            <div style="margin-bottom: 4px;"><span style="font-weight: 900;">ENDEREÇO:</span> <span id="pdf-cli-end" style="text-transform: uppercase;"></span></div>
            <div style="border-top: 1px dashed #9CA3AF; margin: 8px 0;"></div>
            <div style="display: flex; flex-wrap: wrap;">
                <div style="width: 50%;"><span style="font-weight: 900;">VEÍCULO:</span> <span id="pdf-vei-mod" style="text-transform: uppercase;"></span></div>
                <div style="width: 25%;"><span style="font-weight: 900;">PLACA:</span> <span id="pdf-vei-placa" style="font-weight: 900; text-transform: uppercase;"></span></div>
                <div style="width: 25%;"><span style="font-weight: 900;">COR/ANO:</span> <span id="pdf-vei-det" style="text-transform: uppercase;"></span></div>
            </div>
        </div>
        
        <div id="pdf-container-itens"></div>
        
        <div style="display: flex; gap: 20px; margin-top: 15px;">
            <div style="flex: 2;">
                <div id="pdf-container-obs" style="display: none; border: 1px solid #000000; border-radius: 4px; padding: 10px; background-color: #F9FAFB; height: 100%;">
                    <h3 style="font-size: 10px; color: #000000; text-transform: uppercase; margin: 0 0 6px 0; border-bottom: 1px solid #D1D5DB; padding-bottom: 4px; font-weight: bold;">Observações da O.S.</h3>
                    <p id="pdf-obs-texto" style="font-size: 11px; color: #000000; margin: 0; line-height: 1.4;"></p>
                </div>
            </div>
            <div style="flex: 1;">
                <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #000000;">
                    <tr><td style="padding: 6px 10px; border-bottom: 1px solid #D1D5DB; color: #000000;">Total Peças</td><td style="padding: 6px 10px; border-bottom: 1px solid #D1D5DB; text-align: right; font-weight: bold; color: #000000;" id="pdf-tot-pecas">R$ 0,00</td></tr>
                    <tr><td style="padding: 6px 10px; border-bottom: 1px solid #D1D5DB; color: #000000;">Total Serviços</td><td style="padding: 6px 10px; border-bottom: 1px solid #D1D5DB; text-align: right; font-weight: bold; color: #000000;" id="pdf-tot-servicos">R$ 0,00</td></tr>
                    <tr><td style="padding: 6px 10px; border-bottom: 1px solid #000000; color: #000000; font-weight: bold;">Desconto</td><td style="padding: 6px 10px; border-bottom: 1px solid #000000; text-align: right; font-weight: bold; color: #000000;" id="pdf-tot-desc">- R$ 0,00</td></tr>
                    <tr style="background-color: #E5E7EB;"><td style="padding: 8px 10px; font-weight: 900; font-size: 12px; color: #000000;">VALOR TOTAL</td><td style="padding: 8px 10px; text-align: right; font-weight: 900; font-size: 15px; color: #000000;" id="pdf-tot-final">R$ 0,00</td></tr>
                </table>
            </div>
        </div>
        
        <div id="pdf-container-financeiro" style="display: none; margin-top: 15px; border: 1px solid #000000; border-radius: 4px; padding: 10px; background-color: #F9FAFB;"></div>

        <div style="margin-top: 50px; display: flex; justify-content: center; gap: 60px; padding: 0 30px;">
            <div style="flex: 2; display: flex; flex-direction: column; align-items: center;">
                <div style="width: 100%; max-width: 300px; border-bottom: 1px solid #000000; height: 40px; margin-bottom: 5px;"></div>
                <p style="font-size: 10px; font-weight: bold; color: #000000; margin: 0; text-transform: uppercase;">Assinatura do Cliente</p>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                <div style="display: flex; align-items: flex-end; justify-content: center; height: 40px; margin-bottom: 5px; gap: 6px;">
                    <div style="width: 35px; border-bottom: 1px solid #000000; height: 1px;"></div><div style="width: 1px; height: 14px; background-color: #000000; transform: rotate(15deg);"></div><div style="width: 35px; border-bottom: 1px solid #000000; height: 1px;"></div><div style="width: 1px; height: 14px; background-color: #000000; transform: rotate(15deg);"></div><div style="width: 45px; border-bottom: 1px solid #000000; height: 1px;"></div>
                </div>
                <p style="font-size: 10px; font-weight: bold; color: #000000; margin: 0; text-transform: uppercase;">Data</p>
            </div>
        </div>
    </div>
</div>

// ========================================================
// AutoManager - Módulo de Orçamentos e O.S.
// ========================================================

window.itensTemporarios = [];
window.valoresFinais = { pecas: 0, servicos: 0, desconto: 0, total: 0 };
window.modalTipoAberto = '';
window.imagensUploadArray = []; 
window.osEmEdicaoId = null; 
window.osEmEdicaoNumero = null; 
window.idParaExcluir = null;
window.osParaDestravarId = null;
window.osParaDestravarDados = null; 
window.globalClientes = [];
window.globalVeiculos = [];
window.currentOSFinanceiro = []; 
window.isVisualizacaoModo = false;
window.isOSDestravada = false;

// ========================================================
// 1. FUNÇÕES UTILITÁRIAS E MÁSCARAS
// ========================================================
window.formataDinheiro = function(v) {
    const val = Number(v) || 0;
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

window.mascaraMoeda = function(campo) {
    let valor = campo.value.replace(/\D/g, ''); 
    if (valor === '') { campo.value = ''; return; }
    valor = (parseInt(valor, 10) / 100).toFixed(2);
    campo.value = valor.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
};

window.formatarDataISO = function(dataObj) {
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const dia = String(dataObj.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
};

window.valorParaInput = function(v) {
    let val = Number(v) || 0;
    val = val.toFixed(2);
    val = val.replace('.', ',');
    val = val.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return val;
}

window.reverterMoeda = function(texto) {
    if(!texto) return 0;
    let limpo = texto.toString().replace(/[^\d,-]/g, '');
    return parseFloat(limpo.replace(',', '.')) || 0;
};

window.mascaraGeral = function(tipo, campo) {
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
};

window.dispararAlerta = function(msg, tipo = 'erro') {
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
};

window.obterCorStatus = function(status) {
    const cores = { 'Em Aberto': 'bg-slate-100 text-slate-700', 'Aguardando Aprovação': 'bg-yellow-50 text-yellow-700', 'Aguardando Peça': 'bg-orange-50 text-orange-700', 'Aguardando Pagamento': 'bg-amber-50 text-amber-700', 'Aprovado': 'bg-blue-50 text-blue-700', 'Em Execução': 'bg-indigo-50 text-indigo-700', 'Finalizado': 'bg-emerald-50 text-emerald-700', 'Fechado': 'bg-slate-800 text-white', 'Não Usar': 'bg-red-50 text-red-700' };
    return cores[status] || 'bg-slate-50 text-slate-500';
};

// ========================================================
// 2. FUNÇÕES DE RENDERIZAÇÃO E CONSTRUÇÃO DE TELA (HTML)
// ========================================================
window.renderizarTabelaReal = function(dados) {
    const tbody = document.getElementById('tabela-orcamentos-real');
    if (!dados || dados.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center"><i class="ph-fill ph-receipt text-4xl text-slate-300 mb-3"></i><p class="text-sm font-bold text-slate-500">Nenhuma O.S registrada.</p></td></tr>`; 
        return; 
    }
    
    tbody.innerHTML = dados.map(orc => {
        const dataStr = new Date(orc.data_criacao).toLocaleDateString('pt-BR');
        const corBg = window.obterCorStatus(orc.status);
        const orcJSON = encodeURIComponent(JSON.stringify(orc));
        const isFechado = orc.status === 'Fechado';
        
        let btnAcao1 = `<div class="w-9 h-9"></div>`; 
        let btnAcao2 = `<button onclick="window.abrirEdicaoOS('${orcJSON}', 'dados', false)" class="w-9 h-9 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition shadow-sm" title="Editar"><i class="ph-bold ph-pencil-simple text-lg text-blue-500"></i></button>`;
        
        if (isFechado) {
            btnAcao1 = `<div class="w-9 h-9"></div>`; 
            btnAcao2 = `<button onclick="window.abrirModalDestravar('${orc.id}', '${orcJSON}')" class="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white border border-slate-300 hover:border-slate-800 rounded-lg transition shadow-sm" title="Reabrir O.S (Exige Senha)"><i class="ph-bold ph-lock-key text-lg"></i></button>`;
        } else if (orc.status === 'Finalizado') {
            btnAcao1 = `<button onclick="window.abrirFaturamentoDireto('${orcJSON}')" class="w-9 h-9 flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200 hover:border-emerald-500 rounded-lg transition shadow-sm" title="Faturar"><i class="ph-bold ph-money text-lg"></i></button>`;
        }
        
        return `
        <tr class="hover:bg-slate-50 transition-colors cursor-pointer" onclick="window.abrirVisualizacaoOS('${orcJSON}')">
            <td class="p-4 md:p-5"><p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">${dataStr}</p><p class="font-black text-slate-800 text-sm">O.S #${orc.numero_os}</p></td>
            <td class="p-4 md:p-5"><p class="font-bold text-slate-700 text-sm">${orc.cliente_nome}</p><p class="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">${orc.veiculo_placa}</p></td>
            <td class="p-4 md:p-5 font-black text-slate-800 text-right text-sm">${window.formataDinheiro(orc.valor_total)}</td>
            <td class="p-4 md:p-5 text-center"><span class="${corBg} border px-2 py-1.5 rounded-lg text-[10px] font-bold shadow-sm whitespace-nowrap">${isFechado ? '<i class="ph-bold ph-lock-key mr-1"></i> Faturada' : orc.status}</span></td>
            <td class="p-4 md:p-5 text-center" onclick="event.stopPropagation()">
                <div class="flex items-center justify-center gap-1.5">
                    ${btnAcao1}
                    ${btnAcao2}
                    <button onclick="window.abrirModalExclusao(${orc.id}, '${orc.numero_os}')" class="w-9 h-9 flex items-center justify-center bg-white text-slate-400 hover:text-red-500 border border-slate-200 rounded-lg transition shadow-sm" title="Excluir"><i class="ph-bold ph-trash text-lg"></i></button>
                    <button onclick="window.gerarPDFSupabase('${orcJSON}')" class="w-9 h-9 flex items-center justify-center bg-slate-800 text-white hover:bg-slate-900 border border-slate-800 rounded-lg transition shadow-sm" title="Abrir PDF"><i class="ph-bold ph-file-pdf text-lg"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
};

window.atualizarInterfaceItensETotais = function() {
    const divLista = document.getElementById('lista-itens-db');
    if (window.itensTemporarios.length === 0) {
        divLista.innerHTML = `<div class="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200"><i class="ph-fill ph-package text-3xl text-slate-300 mb-2"></i><p class="text-[10px] md:text-xs text-slate-400 uppercase font-bold tracking-wider">Nenhum item adicionado à O.S.</p></div>`;
    } else {
        const isTravadoGeral = (document.getElementById('db-status').value === 'Fechado' && !window.isOSDestravada) || window.isVisualizacaoModo;
        
        divLista.innerHTML = window.itensTemporarios.map(item => {
            let badgeClass = item.tipo === 'Peça' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200';
            let HTMLdetalhe = item.detalhe ? `<p class="text-xs text-slate-500 mt-1 italic pl-1"><i class="ph-fill ph-info text-blue-400 mr-1"></i>${item.detalhe}</p>` : '';
            
            let acoes = isTravadoGeral ? '' : `
            <div class="flex gap-1">
                <button onclick="window.editarItem(${item.id_temp})" class="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition" title="Editar"><i class="ph-bold ph-pencil-simple text-lg"></i></button>
                <button onclick="window.removerItemDB(${item.id_temp})" class="text-red-400 hover:bg-red-50 p-2 rounded-lg transition" title="Excluir"><i class="ph-bold ph-trash text-lg"></i></button>
            </div>`;

            return `
            <div class="bg-white p-3 md:p-4 rounded-xl border border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 shadow-sm hover:border-blue-200 transition-colors">
                <div class="flex-1">
                    <div class="flex items-center"><span class="border ${badgeClass} px-2 py-0.5 rounded text-[10px] font-black uppercase mr-2 shadow-sm">${item.tipo}</span><span class="font-bold text-slate-800 text-sm">${item.quantidade}x ${item.descricao}</span> <span class="text-xs text-slate-400 ml-1">(${window.formataDinheiro(item.valor_unitario)})</span></div>
                    ${HTMLdetalhe}
                </div>
                <div class="flex items-center gap-3 w-full lg:w-auto justify-between border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
                    <span class="font-black text-slate-900 text-sm md:text-base">${window.formataDinheiro(item.subtotal)}</span>
                    ${acoes}
                </div>
            </div>`;
        }).join('');
    }
    
    document.getElementById('resumo-pecas').innerText = window.formataDinheiro(window.valoresFinais.pecas);
    document.getElementById('resumo-servicos').innerText = window.formataDinheiro(window.valoresFinais.servicos);
    document.getElementById('resumo-desc').innerText = `- ${window.formataDinheiro(window.valoresFinais.desconto)}`;
    document.getElementById('db-total').innerText = window.formataDinheiro(window.valoresFinais.total);
    
    const finPecas = document.getElementById('fin-resumo-pecas');
    if(finPecas) finPecas.innerText = window.formataDinheiro(window.valoresFinais.pecas);
    const finServicos = document.getElementById('fin-resumo-servicos');
    if(finServicos) finServicos.innerText = window.formataDinheiro(window.valoresFinais.servicos);
    const finDesc = document.getElementById('fin-resumo-desc');
    if(finDesc) finDesc.innerText = `- ${window.formataDinheiro(window.valoresFinais.desconto)}`;
    const finTotalOs = document.getElementById('fin-aba-total-os');
    if(finTotalOs) finTotalOs.innerText = window.formataDinheiro(window.valoresFinais.total);
};

window.renderizarAbaFinanceiro = function() {
    const boxBloqueado = document.getElementById('fin-bloqueado-box');
    const boxLiberado = document.getElementById('fin-liberado-box');
    const boxGerador = document.getElementById('fin-gerador-box');
    const boxEditor = document.getElementById('fin-editor-box');
    const btnRefazer = document.getElementById('btn-estornar-fin');
    const btnSalvarEdicao = document.getElementById('btn-salvar-fin-edicao');
    const subtitulo = document.getElementById('fin-aba-subtitulo');
    
    document.getElementById('fin-aba-total-os').innerText = window.formataDinheiro(window.valoresFinais.total);

    if (!window.osEmEdicaoId) {
        boxBloqueado.classList.remove('hidden');
        boxLiberado.classList.add('hidden');
        if(btnSalvarEdicao) btnSalvarEdicao.classList.add('hidden');
        if(btnRefazer) btnRefazer.classList.add('hidden');
        return;
    }

    boxBloqueado.classList.add('hidden');
    boxLiberado.classList.remove('hidden'); 

    if (!window.currentOSFinanceiro || window.currentOSFinanceiro.length === 0) {
        boxGerador.classList.remove('hidden');
        boxEditor.classList.add('hidden');
        if(btnRefazer) btnRefazer.classList.add('hidden');
        if(btnSalvarEdicao) btnSalvarEdicao.classList.add('hidden');
        
        if (window.isVisualizacaoModo) {
            boxGerador.classList.add('hidden');
            subtitulo.innerText = "Esta O.S. não possui lançamentos financeiros.";
            document.getElementById('fin-aba-soma').innerText = 'R$ 0,00';
            window.atualizarPlacarAuditoria(0, 'btn-salvar-fin-tab');
        } else {
            subtitulo.innerText = "Defina como o cliente vai pagar para gerar os boletos/parcelas.";
            document.getElementById('tab-fin-tipo').value = 'avista';
            window.mudarTipoFaturamentoTab();
        }
    } else {
        boxGerador.classList.add('hidden');
        boxEditor.classList.remove('hidden');
        
        if (window.isVisualizacaoModo) {
            if(btnSalvarEdicao) btnSalvarEdicao.classList.add('hidden');
            subtitulo.innerText = "Lançamentos financeiros atrelados à O.S.";
        } else {
            if(btnSalvarEdicao) btnSalvarEdicao.classList.remove('hidden');
            subtitulo.innerText = "Você pode alterar os valores, datas e meios de pagamento das parcelas abaixo.";
        }
        
        const hasPago = window.currentOSFinanceiro.some(r => r.status === 'Pago' || r.categoria === 'Adiantamento');
        if (hasPago || window.isVisualizacaoModo) {
            if(btnRefazer) btnRefazer.classList.add('hidden'); 
        } else {
            if(btnRefazer) btnRefazer.classList.remove('hidden'); 
        }
        
        const listaDiv = document.getElementById('lista-financeiro-vinculado');
        let html = '';
        
        const statusAtual = document.getElementById('db-status').value;
        const isTravadoGlobal = (statusAtual === 'Fechado' && !window.isOSDestravada) || window.isVisualizacaoModo;

        window.currentOSFinanceiro.forEach((rec, idx) => {
            const isPago = rec.status === 'Pago' || rec.categoria === 'Adiantamento';
            const trancaGeral = isTravadoGlobal ? 'disabled' : '';
            const trancaParaPago = isPago ? 'disabled' : trancaGeral;
            
            let iconeStatus = isPago ? `<span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center shadow-sm"><i class="ph-bold ph-check mr-1"></i> Liquidado</span>` : `<span class="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center shadow-sm"><i class="ph-bold ph-clock mr-1"></i> Pendente</span>`;
            
            const badgeTipo = rec.categoria === 'Adiantamento' || rec.descricao.includes('Acerto Imediato') ? 'Entrada / À Vista' : `Parcela ${rec.descricao.split(' ')[1] || (idx+1)}`;
            const corCard = isPago ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white';
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
                        <input type="text" id="edit-rec-val-${idx}" onkeyup="window.mascaraMoeda(this); window.checarSomaFinanceiroEdit()" value="${window.valorParaInput(rec.valor)}" ${trancaParaPago} class="w-full p-2.5 rounded-xl text-sm font-black outline-none border ${trancaClasses}">
                    </div>
                </div>
                ${!isPago && !isTravadoGlobal ? `<div class="flex justify-end pt-2"><button onclick="window.excluirParcelaManual(${rec.id})" class="text-[10px] text-red-500 font-bold hover:underline flex items-center gap-1"><i class="ph-bold ph-trash"></i> Excluir Lançamento</button></div>` : ''}
            </div>`;
        });
        
        if (!isTravadoGlobal) {
            html += `
            <div class="mt-4 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 border-dashed">
                 <p class="text-[10px] md:text-xs text-slate-500 font-medium">Você precisa adicionar uma parcela extra?</p>
                <button onclick="window.adicionarNovaParcelaManual()" class="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-slate-900 transition-transform transform active:scale-95 text-xs md:text-sm flex items-center gap-2"><i class="ph-bold ph-plus"></i> Novo Lançamento</button>
            </div>`;
        }

        listaDiv.innerHTML = html;
        window.checarSomaFinanceiroEdit();
    }
};

window.renderizarPreviewFotos = function() {
    const previewContainer = document.getElementById('preview-anexos');
    previewContainer.innerHTML = '';
    
    if(window.imagensUploadArray.length === 0) { previewContainer.classList.add('hidden'); return; }
    
    const isTravadoGeral = (document.getElementById('db-status').value === 'Fechado' && !window.isOSDestravada) || window.isVisualizacaoModo;

    window.imagensUploadArray.forEach(base64Str => {
        const imgBox = document.createElement('div');
        imgBox.className = "w-20 h-20 rounded-xl overflow-hidden shadow-sm border border-slate-200 relative group";
        
        let trashIcon = isTravadoGeral ? '' : `<div class="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all cursor-pointer" onclick="window.removerImagemArray('${base64Str}')"><i class="ph-bold ph-trash text-white text-xl"></i></div>`;
        
        imgBox.innerHTML = `<img src="${base64Str}" class="w-full h-full object-cover">${trashIcon}`;
        previewContainer.appendChild(imgBox);
    });
};

window.atualizarPlacarAuditoria = function(somaFinanceiro, btnIdToBlock = 'btn-salvar-fin-edicao') {
    const elSomaBox = document.getElementById('fin-aba-soma-box');
    const elAlerta = document.getElementById('fin-aba-alerta');
    const btnSalvar = document.getElementById(btnIdToBlock);
    
    if (somaFinanceiro > 0 && Math.abs(window.valoresFinais.total - somaFinanceiro) > 0.05) {
        if(elSomaBox) elSomaBox.className = 'p-4 rounded-xl border transition-colors shadow-inner border-red-300 bg-red-50 text-red-600 text-center';
        if(elAlerta) elAlerta.classList.remove('hidden');
        if(btnSalvar && !window.isVisualizacaoModo) { btnSalvar.disabled = true; btnSalvar.classList.add('opacity-50', 'cursor-not-allowed'); }
    } else {
        if(elSomaBox) elSomaBox.className = 'p-4 rounded-xl border transition-colors shadow-inner border-emerald-300 bg-emerald-50 text-emerald-700 text-center';
        if(elAlerta) elAlerta.classList.add('hidden');
        if(btnSalvar && !window.isVisualizacaoModo) { btnSalvar.disabled = false; btnSalvar.classList.remove('opacity-50', 'cursor-not-allowed'); }
    }
};

window.filtrarTabelaOS = function() {
    const termo = document.getElementById('input-pesquisa-os').value.toLowerCase();
    const linhas = document.querySelectorAll('#tabela-orcamentos-real tr');
    
    linhas.forEach(linha => {
        const textoLinha = linha.innerText.toLowerCase();
        if (textoLinha.includes(termo)) {
            linha.style.display = '';
        } else {
            linha.style.display = 'none';
        }
    });
};

// ===================================================================================
// 3. COMUNICAÇÃO COM O BANCO DE DADOS E INIT GERAL
// ===================================================================================
window.initOrcamentos = async function() {
    await window.carregarListasBD();
    await window.buscarOrcamentosSupabase();
    document.getElementById('view-novo-orcamento').classList.add('hidden');
    document.getElementById('view-lista-orcamentos').classList.remove('hidden');
};

window.carregarListasBD = async function() {
    const { data: cli } = await window.banco.from('clientes').select('*').order('nome');
    const { data: vei } = await window.banco.from('veiculos').select('*').order('placa');
    window.globalClientes = cli || [];
    window.globalVeiculos = vei || [];

    const selCli = document.getElementById('db-cliente-nome');
    const selVei = document.getElementById('db-veiculo-placa');
    
    if (selCli) selCli.innerHTML = '<option value="">Selecione um Cliente...</option>';
    if (selVei) selVei.innerHTML = '<option value="">Selecione um Veículo...</option>';

    window.globalClientes.forEach(c => { if (selCli) selCli.innerHTML += `<option value="${c.nome}">${c.nome}</option>`; });
    window.globalVeiculos.forEach(v => { const tc = v.cor ? ` - ${v.cor}` : ''; if (selVei) selVei.innerHTML += `<option value="${v.placa}">${v.placa} - ${v.modelo}${tc}</option>`; });
};

window.vincularClienteViceVersa = function(gatilho) {
    const selCli = document.getElementById('db-cliente-nome');
    const selVei = document.getElementById('db-veiculo-placa');
    if (gatilho === 'cliente' && selCli && selCli.value) {
        const veiEncontrado = window.globalVeiculos.find(v => v.dono_nome === selCli.value);
        if (veiEncontrado && selVei) selVei.value = veiEncontrado.placa;
    } else if (gatilho === 'veiculo' && selVei && selVei.value) {
        const veiEncontrado = window.globalVeiculos.find(v => v.placa === selVei.value);
        if (veiEncontrado && veiEncontrado.dono_nome && selCli) selCli.value = veiEncontrado.dono_nome;
    }
};

window.buscarOrcamentosSupabase = async function() {
    try {
        const { data: orcamentos, error } = await window.banco.from('orcamentos').select('*').order('id', { ascending: false });
        if (error) throw error;
        window.renderizarTabelaReal(orcamentos);
    } catch (erro) {
        console.error("Erro no Supabase:", erro);
        document.getElementById('tabela-orcamentos-real').innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500 font-bold bg-red-50">Falha de conexão com o servidor.</td></tr>`;
    }
};

window.salvarOrcamentoReal = async function() {
    const nome = document.getElementById('db-cliente-nome').value;
    const placa = document.getElementById('db-veiculo-placa').value;
    const status = document.getElementById('db-status').value;
    const obs = document.getElementById('db-obs').value;

    if (!nome || !placa) { window.dispararAlerta("Cliente e Placa são obrigatórios."); return; }
    if (window.itensTemporarios.length === 0) { window.dispararAlerta("A O.S precisa de peças ou serviços."); return; }

    if (window.currentOSFinanceiro.length > 0) {
        let somaF = 0; window.currentOSFinanceiro.forEach(r => somaF += r.valor);
        if (Math.abs(window.valoresFinais.total - somaF) > 0.05) {
            window.dispararAlerta("O valor da O.S mudou. Ajuste as parcelas na aba 'Gestão Financeira' para a conta fechar!", "erro");
            window.mudarAbaOS('fin');
            return;
        }
    }

    const btnSalvar = document.getElementById('btn-salvar-db');
    btnSalvar.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-xl"></i> SALVANDO...';
    btnSalvar.disabled = true;

    try {
        const clienteObj = window.globalClientes.find(c => c.nome === nome) || {};
        const veiculoObj = window.globalVeiculos.find(v => v.placa === placa) || {};
        const payloadJSONB = { lista_itens: window.itensTemporarios, resumo: window.valoresFinais, cliente_dados: clienteObj, veiculo_dados: veiculoObj };

        if (window.osEmEdicaoId) {
            const { data: oldOrc } = await window.banco.from('orcamentos').select('itens').eq('id', window.osEmEdicaoId).single();
            if (oldOrc && oldOrc.itens && oldOrc.itens.financeiro) {
                payloadJSONB.financeiro = oldOrc.itens.financeiro;
            }

            const { error } = await window.banco.from('orcamentos').update({ cliente_nome: nome, veiculo_placa: placa, valor_total: window.valoresFinais.total, status: status, observacao: obs, anexos: window.imagensUploadArray, itens: payloadJSONB }).eq('id', window.osEmEdicaoId);
            if (error) throw error;
            
            window.dispararAlerta("O.S atualizada com sucesso!", "sucesso");
            window.alternarSubTelaOrcamento('lista');
        } else {
            const { error } = await window.banco.from('orcamentos').insert([{ cliente_nome: nome, veiculo_placa: placa, valor_total: window.valoresFinais.total, status: status, observacao: obs, anexos: window.imagensUploadArray, itens: payloadJSONB }]);
            if (error) throw error;
            window.dispararAlerta("O.S salva! Vá em 'Gestão Financeira' se desejar faturar agora.", "sucesso");
            window.alternarSubTelaOrcamento('lista');
        }
    } catch (erro) { window.dispararAlerta("Falha de comunicação com o servidor."); } 
    finally { btnSalvar.innerHTML = '<i class="ph-bold ph-floppy-disk text-xl"></i> SALVAR O.S.'; btnSalvar.disabled = false; }
};

window.salvarFinanceiroEditado = async function() {
    const btnSalvar = document.getElementById('btn-salvar-fin-edicao');
    btnSalvar.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-lg"></i> Salvando...';
    btnSalvar.disabled = true;

    try {
        let snap = { entrada: 0, forma_entrada: '', data_entrada: '', parcelas: [] };
        
        for(let i=0; i<window.currentOSFinanceiro.length; i++) {
            const rec = window.currentOSFinanceiro[i];
            const isPago = rec.status === 'Pago' || rec.categoria === 'Adiantamento';
            
            const inputVal = document.getElementById(`edit-rec-val-${i}`);
            const inputData = document.getElementById(`edit-rec-data-${i}`);
            const inputForma = document.getElementById(`edit-rec-forma-${i}`);
            
            const valorCorreto = inputVal ? window.reverterMoeda(inputVal.value) : rec.valor;
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

        const { data: oldOrc } = await window.banco.from('orcamentos').select('itens').eq('id', window.osEmEdicaoId).single();
        if (oldOrc && oldOrc.itens) {
            oldOrc.itens.financeiro = snap;
            await window.banco.from('orcamentos').update({ itens: oldOrc.itens }).eq('id', window.osEmEdicaoId);
        }

        window.dispararAlerta("Lançamentos financeiros salvos e atualizados!", "sucesso");
        await window.recarregarFinanceiroDaOS();
    } catch(e) { 
        window.dispararAlerta("Erro ao salvar o financeiro no banco."); 
    } finally {
        btnSalvar.innerHTML = '<i class="ph-bold ph-floppy-disk text-lg"></i> SALVAR FINANCEIRO';
        btnSalvar.disabled = false;
    }
};

window.processarLancarFinanceiroTab = async function() {
    const tipo = document.getElementById('tab-fin-tipo').value;
    const total = window.valoresFinais.total;
    const entrada = (tipo === 'avista') ? total : ((tipo === 'parcelado') ? 0 : window.reverterMoeda(document.getElementById('tab-fin-entrada').value) || 0);
    const formaEntrada = document.getElementById('tab-fin-forma-entrada').value;
    const dataAtualStr = window.formatarDataISO(new Date()); 
    const parcelas = (tipo === 'avista') ? 0 : Math.max(1, parseInt(document.getElementById('tab-fin-parcelas').value) || 1);
    const cliente = document.getElementById('db-cliente-nome').value;

    let somaParcelas = entrada;
    if(tipo !== 'avista') {
        for(let i=1; i<=parcelas; i++) somaParcelas += window.reverterMoeda(document.getElementById(`tab-parc-val-${i}`).value) || 0;
        if (Math.abs(somaParcelas - total) > 0.05) { window.dispararAlerta("As parcelas não batem com o saldo da O.S.", "erro"); return; }
    }
    
    const btnSalvar = document.getElementById('btn-salvar-fin-tab');
    btnSalvar.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-xl"></i> Gerando...';
    btnSalvar.disabled = true;

    let records = [];
    if(entrada > 0) {
        records.push({
            descricao: `Acerto Imediato O.S #${window.osEmEdicaoNumero} - ${cliente}`,
            categoria: 'Serviços O.S', valor: entrada,
            data_vencimento: dataAtualStr, status: 'Pago', data_pagamento: dataAtualStr, forma_pagamento: formaEntrada
        });
    }

    if (parcelas > 0) {
        for(let i=1; i<=parcelas; i++) {
            records.push({
                descricao: `Parcela ${i}/${parcelas} O.S #${window.osEmEdicaoNumero} - ${cliente}`,
                categoria: 'Serviços O.S',
                valor: window.reverterMoeda(document.getElementById(`tab-parc-val-${i}`).value),
                data_vencimento: document.getElementById(`tab-parc-data-${i}`).value,
                status: 'Pendente', forma_pagamento: document.getElementById(`tab-parc-forma-${i}`).value
            });
        }
    }

    try {
        const clienteObj = window.globalClientes.find(c => c.nome === cliente) || {};
        const veiculoObj = window.globalVeiculos.find(v => v.placa === document.getElementById('db-veiculo-placa').value) || {};
        const payloadJSONB = { lista_itens: window.itensTemporarios, resumo: window.valoresFinais, cliente_dados: clienteObj, veiculo_dados: veiculoObj };
        
        const { error: errOS } = await window.banco.from('orcamentos').update({ status: 'Fechado', itens: payloadJSONB }).eq('id', window.osEmEdicaoId);
        if(errOS) throw errOS;

        if (records.length > 0) await window.banco.from('contas_receber').insert(records);
        
        window.dispararAlerta("O.S Faturada com sucesso!", "sucesso");
        window.alternarSubTelaOrcamento('lista');
    } catch (e) { window.dispararAlerta("Erro ao faturar no banco."); } 
    finally { btnSalvar.innerHTML = '<i class="ph-bold ph-check-circle text-xl"></i> Gerar Faturamento e Fechar O.S'; btnSalvar.disabled = false; }
};

window.excluirParcelaManual = async function(id) {
    if(!confirm("Atenção: Deseja excluir este lançamento definitivamente?")) return;
    try {
        const { error } = await window.banco.from('contas_receber').delete().eq('id', id);
        if (error) throw error;
        window.dispararAlerta("Parcela excluída com sucesso.", "sucesso");
        await window.recarregarFinanceiroDaOS();
    } catch(e) { window.dispararAlerta("Erro ao excluir."); }
};

window.adicionarNovaParcelaManual = async function() {
    const cliente = document.getElementById('db-cliente-nome').value;
    if(!cliente) { window.dispararAlerta("Defina um cliente na aba 'Detalhes da O.S.' primeiro."); return; }
    
    let somaAtual = 0;
    window.currentOSFinanceiro.forEach((r, idx) => {
        const inputVal = document.getElementById(`edit-rec-val-${idx}`);
        if(inputVal) somaAtual += window.reverterMoeda(inputVal.value);
        else somaAtual += r.valor;
    });
    
    let valorSugerido = window.valoresFinais.total - somaAtual;
    if(valorSugerido < 0) valorSugerido = 0;

    const novaParcela = {
        descricao: `Parcela O.S #${window.osEmEdicaoNumero} - ${cliente}`,
        categoria: 'Serviços O.S',
        valor: parseFloat(valorSugerido.toFixed(2)),
        data_vencimento: window.formatarDataISO(new Date()),
        status: 'Pendente',
        forma_pagamento: 'Cartão de Crédito'
    };

    try {
        const { error } = await window.banco.from('contas_receber').insert([novaParcela]);
        if (error) throw error;
        window.dispararAlerta("Lançamento extra inserido na lista.", "sucesso");
        await window.recarregarFinanceiroDaOS();
    } catch(e) { window.dispararAlerta("Erro ao criar lançamento extra."); }
};

window.limparFinanceiroAtual = async function() {
    if(!confirm("Atenção: Isso apagará todas as parcelas atuais desta O.S para que você gere o financeiro novamente do zero. Continuar?")) return;
    try {
        await window.banco.from('contas_receber').delete().like('descricao', `%O.S #${window.osEmEdicaoNumero}%`);
        
        const { data: oldOrc } = await window.banco.from('orcamentos').select('itens').eq('id', window.osEmEdicaoId).single();
        if (oldOrc && oldOrc.itens) {
            delete oldOrc.itens.financeiro;
            await window.banco.from('orcamentos').update({ itens: oldOrc.itens }).eq('id', window.osEmEdicaoId);
        }
        
        window.currentOSFinanceiro = [];
        window.renderizarAbaFinanceiro();
        window.dispararAlerta("Financeiro estornado. Pode gerar novamente.", "sucesso");
    } catch(e) { window.dispararAlerta("Erro ao limpar financeiro"); }
};

window.confirmarExclusao = async function() {
    if(!window.idParaExcluir) return;
    try {
        const { error } = await window.banco.from('orcamentos').delete().eq('id', window.idParaExcluir);
        if (error) throw error;
        await window.banco.from('contas_receber').delete().like('descricao', `%O.S #${document.getElementById('exc-os-num').innerText.replace('#','')}%`);
        window.dispararAlerta("Ordem de serviço apagada.", "sucesso");
        window.fecharModalExclusao();
        window.buscarOrcamentosSupabase();
    } catch (erro) { window.dispararAlerta("Falha ao excluir."); }
};

window.processarDestravarOS = async function() {
    const senhaDigitada = document.getElementById('input-senha-reabrir').value;
    const usuarioLogadoStr = localStorage.getItem('usuarioLogado');
    if(!usuarioLogadoStr) { window.dispararAlerta("Sessão inválida. Faça login novamente."); return; }
    const usuarioLogado = JSON.parse(usuarioLogadoStr);

    if(senhaDigitada !== usuarioLogado.senha) { window.dispararAlerta("Senha incorreta. Acesso negado."); return; }
    
    try {
        const novoStatus = 'Em Aberto';
        const { error } = await window.banco.from('orcamentos').update({ status: novoStatus }).eq('id', window.osParaDestravarId);
        if (error) throw error;
        
        window.fecharModalDestravar();
        window.osParaDestravarDados.status = novoStatus;
        window.abrirEdicaoOS(encodeURIComponent(JSON.stringify(window.osParaDestravarDados)), 'dados', false);
        window.dispararAlerta("O.S destravada temporariamente para edição.", "sucesso");
    } catch(e) { window.dispararAlerta("Erro ao destravar a O.S no banco."); }
};

// ========================================================
// 4. MÉTODOS DE AÇÃO E INTERATIVIDADE (UI / EVENTOS GERAIS)
// ========================================================
window.abrirEdicaoOS = async function(dadosCodificados, abaAlvo = 'dados', isVisualizacao = false) {
    const orc = JSON.parse(decodeURIComponent(dadosCodificados));
    window.osEmEdicaoId = orc.id;
    window.osEmEdicaoNumero = orc.numero_os; 
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
    window.itensTemporarios = orc.itens?.lista_itens || [];
    window.imagensUploadArray = orc.anexos || [];
    
    if(window.imagensUploadArray.length > 0) { document.getElementById('preview-anexos').classList.remove('hidden'); window.renderizarPreviewFotos(); }

    const descValor = orc.itens?.resumo?.desconto || 0;
    if (descValor > 0) {
        document.getElementById('desc-tipo').value = 'val';
        const descInput = document.getElementById('desc-val');
        descInput.value = (descValor * 100).toString(); window.mascaraMoeda(descInput);
    } else { document.getElementById('desc-val').value = ''; }

    window.calcularTotais();
    
    await window.recarregarFinanceiroDaOS();
    window.verificarStatusFinanceiro(); 
    
    document.getElementById('view-lista-orcamentos').classList.add('hidden');
    document.getElementById('view-novo-orcamento').classList.remove('hidden');
    
    window.mudarAbaOS(abaAlvo); 
};

window.abrirVisualizacaoOS = function(dadosCodificados) {
    window.abrirEdicaoOS(dadosCodificados, 'dados', true);
};

window.abrirFaturamentoDireto = function(dadosCodificados) {
    window.abrirEdicaoOS(dadosCodificados, 'fin', false);
};

window.mudarTipoFaturamentoTab = function() {
    const tipo = document.getElementById('tab-fin-tipo').value;
    const boxEntrada = document.getElementById('tab-box-entrada');
    const boxParcelamento = document.getElementById('tab-box-parcelamento');
    const inputEntrada = document.getElementById('tab-fin-entrada');

    let d = new Date(); d.setMonth(d.getMonth() + 1);
    const dataMesQueVem = window.formatarDataISO(d);

    if (tipo === 'avista') {
        boxEntrada.classList.remove('hidden'); boxParcelamento.classList.add('hidden');
        inputEntrada.value = window.formataDinheiro(window.valoresFinais.total); inputEntrada.readOnly = true;
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
};

window.gerarLinhasParcelasTab = function() {
    const tipo = document.getElementById('tab-fin-tipo').value;
    let entrada = (tipo === 'avista') ? window.valoresFinais.total : ((tipo === 'parcelado') ? 0 : window.reverterMoeda(document.getElementById('tab-fin-entrada').value) || 0);
    let restante = window.valoresFinais.total - entrada; if(restante < 0) restante = 0;

    const divSimulacao = document.getElementById('tab-fin-simulacao');
    if (tipo === 'avista' || restante === 0) {
        divSimulacao.innerHTML = `<div class="p-3 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-xl text-center"><i class="ph-bold ph-check-circle mr-1"></i> A Entrada cobre 100% da O.S. Nenhuma parcela extra será gerada.</div>`;
        document.getElementById('tab-fin-parcelas').disabled = true;
        
        document.getElementById('fin-aba-soma').innerText = window.formataDinheiro(entrada);
        window.atualizarPlacarAuditoria(entrada, 'btn-salvar-fin-tab');
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
        let d = new Date(dataBase); d.setMonth(d.getMonth() + (i - 1)); let dateVal = window.formatarDataISO(d);

        if (apenasAtualizar) {
            const inputParc = document.getElementById(`tab-parc-val-${i}`);
            if (inputParc) inputParc.value = window.valorParaInput(valorParc);
        } else {
            html += `
            <div class="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <span class="font-black text-[10px] md:text-xs text-blue-600 w-16 uppercase">Parc ${i}/${parcelas}</span>
                <input type="text" id="tab-parc-val-${i}" onkeyup="window.mascaraMoeda(this); window.checarSomaGeradorTab()" value="${window.valorParaInput(valorParc)}" class="w-24 border border-slate-300 p-2 rounded-lg text-xs font-black text-slate-800 outline-none focus:border-emerald-500">
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
    
    document.getElementById('fin-aba-soma').innerText = window.formataDinheiro(somaGerada);
    window.atualizarPlacarAuditoria(somaGerada, 'btn-salvar-fin-tab');
};

window.checarSomaGeradorTab = function() {
    const activeEl = document.activeElement;
    
    if (activeEl && (activeEl.id === 'tab-fin-entrada' || activeEl.id === 'tab-fin-parcelas')) {
        window.gerarLinhasParcelasTab();
        return;
    }

    const tipo = document.getElementById('tab-fin-tipo').value;
    let soma = 0;
    
    if (tipo !== 'parcelado') {
        soma += window.reverterMoeda(document.getElementById('tab-fin-entrada').value) || 0;
    }
    
    if (tipo !== 'avista') {
        const parcelas = Math.max(1, parseInt(document.getElementById('tab-fin-parcelas').value) || 1);
        for(let i=1; i<=parcelas; i++) {
            const inputParc = document.getElementById(`tab-parc-val-${i}`);
            if(inputParc) soma += window.reverterMoeda(inputParc.value) || 0;
        }
    }
    
    document.getElementById('fin-aba-soma').innerText = window.formataDinheiro(soma);
    window.atualizarPlacarAuditoria(soma, 'btn-salvar-fin-tab');
};

window.checarSomaFinanceiroEdit = function() {
    let soma = 0;
    window.currentOSFinanceiro.forEach((rec, idx) => {
        const inputVal = document.getElementById(`edit-rec-val-${idx}`);
        if(inputVal) soma += window.reverterMoeda(inputVal.value);
        else soma += rec.valor;
    });
    
    document.getElementById('fin-aba-soma').innerText = window.formataDinheiro(soma);
    window.atualizarPlacarAuditoria(soma, 'btn-salvar-fin-edicao');
};

window.verificarStatusFinanceiro = function() {
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
        window.congelarCamposOS(true);
    } else {
        window.congelarCamposOS(false);
        if(badgeFechada) badgeFechada.classList.add('hidden');
    }
    
    if (status === 'Finalizado' || status === 'Fechado' || window.currentOSFinanceiro.length > 0) {
        abaFinBtn.classList.remove('hidden');
    } else {
        abaFinBtn.classList.add('hidden');
        if(!window.isVisualizacaoModo) window.mudarAbaOS('dados'); 
    }
};

window.congelarCamposOS = function(travar) {
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
};

window.alternarSubTelaOrcamento = function(modo) {
    const viewLista = document.getElementById('view-lista-orcamentos');
    const viewNovo = document.getElementById('view-novo-orcamento');

    if (modo === 'novo') {
        window.osEmEdicaoId = null; 
        window.osEmEdicaoNumero = null;
        window.currentOSFinanceiro = []; 
        window.isOSDestravada = false;
        window.isVisualizacaoModo = false;
        
        document.getElementById('titulo-tela-os').innerText = 'Emissão de O.S.';
        document.getElementById('db-cliente-nome').value = '';
        document.getElementById('db-veiculo-placa').value = '';
        document.getElementById('db-status').value = 'Em Aberto';
        document.getElementById('desc-val').value = '';
        document.getElementById('db-obs').value = '';
        
        window.itensTemporarios = [];
        window.imagensUploadArray = [];
        const preview = document.getElementById('preview-anexos');
        if (preview) { preview.innerHTML = ''; preview.classList.add('hidden'); }
        
        window.calcularTotais();
        window.verificarStatusFinanceiro(); 
        window.mudarAbaOS('dados'); 
        
        viewLista.classList.add('hidden');
        viewNovo.classList.remove('hidden');
    } else {
        viewNovo.classList.add('hidden');
        viewLista.classList.remove('hidden');
        window.isOSDestravada = false;
        window.isVisualizacaoModo = false;
        window.buscarOrcamentosSupabase();
    }
};

window.adicionarOuEditarItem = function() {
    const tipo = document.getElementById('item-tipo').value;
    const nome = document.getElementById('item-nome').value;
    const desc = document.getElementById('item-desc').value;
    const qtd = parseFloat(document.getElementById('item-qtd').value);
    const valString = document.getElementById('item-val').value;
    const idEdit = document.getElementById('item-id-edit').value;

    if(!nome) { window.dispararAlerta("O nome do Item (Peça/Serviço) é obrigatório."); return; }
    if(!qtd || qtd <= 0) { window.dispararAlerta("A quantidade deve ser maior que zero."); return; }
    const valFloat = window.reverterMoeda(valString);
    if(valFloat <= 0) { window.dispararAlerta("O valor unitário não pode ser vazio ou zero."); return; }

    const sub = qtd * valFloat;

    if (idEdit) {
        const index = window.itensTemporarios.findIndex(i => i.id_temp == idEdit);
        if (index > -1) window.itensTemporarios[index] = { id_temp: idEdit, tipo, descricao: nome, detalhe: desc, quantidade: qtd, valor_unitario: valFloat, subtotal: sub };
        document.getElementById('item-id-edit').value = '';
        document.getElementById('btn-add-item').innerHTML = '<i class="ph-bold ph-plus mr-1"></i> Add Item';
        document.getElementById('btn-add-item').classList.replace('bg-emerald-600', 'bg-slate-900');
    } else {
        window.itensTemporarios.push({ id_temp: Date.now(), tipo, descricao: nome, detalhe: desc, quantidade: qtd, valor_unitario: valFloat, subtotal: sub });
    }

    document.getElementById('item-nome').value = ''; document.getElementById('item-desc').value = ''; document.getElementById('item-val').value = ''; document.getElementById('item-qtd').value = '1'; document.getElementById('item-nome').focus();
    window.calcularTotais();
};

window.removerItemDB = function(id) { 
    window.itensTemporarios = window.itensTemporarios.filter(i => i.id_temp !== id); 
    window.calcularTotais(); 
};

window.editarItem = function(id) {
    const item = window.itensTemporarios.find(i => i.id_temp === id);
    if (!item) return;

    document.getElementById('item-tipo').value = item.tipo || 'Peça';
    document.getElementById('item-nome').value = item.descricao;
    document.getElementById('item-desc').value = item.detalhe || '';
    document.getElementById('item-qtd').value = item.quantidade;
    const inputVal = document.getElementById('item-val');
    inputVal.value = (item.valor_unitario * 100).toString(); 
    window.mascaraMoeda(inputVal);
    document.getElementById('item-id-edit').value = item.id_temp;
    
    const btn = document.getElementById('btn-add-item');
    btn.innerHTML = '<i class="ph-bold ph-check mr-1"></i> Salvar Edição';
    btn.classList.replace('bg-slate-900', 'bg-emerald-600');
};

window.calcularTotais = function() {
    let sumPecas = 0; let sumServicos = 0;
    window.itensTemporarios.forEach(item => { if (item.tipo === 'Peça') sumPecas += item.subtotal; else sumServicos += item.subtotal; });
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

    window.valoresFinais.pecas = sumPecas; 
    window.valoresFinais.servicos = sumServicos; 
    window.valoresFinais.desconto = descValor; 
    window.valoresFinais.total = totalBruto - descValor;
    
    window.atualizarInterfaceItensETotais();
    
    if(!document.getElementById('aba-conteudo-fin').classList.contains('hidden')){
        if(window.currentOSFinanceiro.length > 0) {
            window.checarSomaFinanceiroEdit();
        } else if (document.getElementById('fin-gerador-box') && !document.getElementById('fin-gerador-box').classList.contains('hidden')) {
            window.checarSomaGeradorTab();
        }
    }
};

window.abrirModalDestravar = function(id, orcJSONCodificado) {
    window.osParaDestravarId = id; 
    window.osParaDestravarDados = JSON.parse(decodeURIComponent(orcJSONCodificado));
    document.getElementById('input-senha-reabrir').value = '';
    document.getElementById('modal-senha-destravar').classList.remove('hidden');
};

window.fecharModalDestravar = function() { 
    document.getElementById('modal-senha-destravar').classList.add('hidden'); 
};

window.abrirModalExclusao = function(id, numero_os) {
    window.idParaExcluir = id;
    document.getElementById('exc-os-num').innerText = `#${numero_os}`;
    document.getElementById('modal-confirmacao-exclusao').classList.remove('hidden');
};

window.fecharModalExclusao = function() { 
    window.idParaExcluir = null; 
    document.getElementById('modal-confirmacao-exclusao').classList.add('hidden'); 
};

window.abrirModalCadastro = function(tipo) {
    window.modalTipoAberto = tipo;
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
                <input type="text" id="cad-doc" onkeyup="window.mascaraGeral('cpf', this)" maxlength="14" placeholder="000.000.000-00" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium text-slate-800">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Celular / WhatsApp <span class="text-red-500 text-sm">*</span></label>
                <input type="text" id="cad-tel" onkeyup="window.mascaraGeral('tel', this)" maxlength="15" placeholder="(00) 00000-0000" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
            </div>
            <div class="md:col-span-2">
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">E-mail</label>
                <input type="email" id="cad-email" placeholder="cliente@email.com" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-medium">
            </div>
            <div class="md:col-span-2 border-t border-slate-100 pt-3 mt-1">
                <label class="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase mb-1"><span>CEP</span><span id="cep-status" class="hidden text-[9px]"></span></label>
                <input type="text" id="cad-cep" onkeyup="window.mascaraGeral('cep', this)" onblur="window.buscarCEP(this.value)" maxlength="9" placeholder="00000-000" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-bold text-slate-700">
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
        window.globalClientes.forEach(c => {
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
                    <input type="text" id="cad-placa" onkeyup="window.mascaraGeral('placa', this)" maxlength="8" placeholder="ABC-1234" class="w-full border border-slate-300 p-2 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-black uppercase text-blue-700">
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
};

window.fecharModalCadastro = function() { 
    document.body.style.overflow = 'auto'; 
    document.getElementById('modal-cadastro-rapido').classList.add('hidden'); 
};

window.buscarCEP = async function(cepInput) {
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
            window.dispararAlerta("CEP não encontrado.");
            if(statusSpan) { statusSpan.innerHTML = '<i class="ph-bold ph-x"></i> Inválido'; statusSpan.className = 'text-[9px] text-red-500 uppercase'; }
        }
    } catch (e) { 
        window.dispararAlerta("Falha ao buscar CEP.");
        if(statusSpan) statusSpan.classList.add('hidden');
    }
};

window.processarSalvamentoModal = async function() {
    const btnSalvar = document.querySelector('#modal-cadastro-rapido button:last-child');
    const textoOriginal = window.modalTipoAberto === 'cliente' ? '<i class="ph-bold ph-check"></i> Salvar Cliente' : '<i class="ph-bold ph-check"></i> Salvar Veículo';
    btnSalvar.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Salvando...';
    btnSalvar.disabled = true;

    try {
        if (window.modalTipoAberto === 'cliente') {
            const nome = document.getElementById('cad-nome').value;
            const doc = document.getElementById('cad-doc').value;
            const tel = document.getElementById('cad-tel').value;
            const email = document.getElementById('cad-email').value;
            const cep = document.getElementById('cad-cep').value;
            const rua = document.getElementById('cad-rua').value;
            const num = document.getElementById('cad-num').value;
            const bairro = document.getElementById('cad-bairro').value;
            const cidade = document.getElementById('cad-cidade').value;

            if(!nome || !tel) { window.dispararAlerta("Nome e Celular são obrigatórios."); return; }
            
            const { error } = await window.banco.from('clientes').insert([{ nome, documento: doc, telefone: tel, email, cep, endereco: rua, numero: num, bairro, cidade }]);
            if (error) throw error;
            
            await window.carregarListasBD(); 
            document.getElementById('db-cliente-nome').value = nome; 
            window.dispararAlerta("Cliente salvo no banco com sucesso!", "sucesso");
        } else {
            const placa = document.getElementById('cad-placa').value;
            const modelo = document.getElementById('cad-modelo').value;
            const cor = document.getElementById('cad-cor').value;
            const ano = document.getElementById('cad-ano').value;
            
            if(!placa || !modelo) { window.dispararAlerta("Placa e Modelo obrigatórios."); return; }
            
            const dono = document.getElementById('cad-dono').value || '';
            
            const { error } = await window.banco.from('veiculos').insert([{ placa, modelo, cor, ano, dono_nome: dono }]);
            if (error) throw error;
            
            await window.carregarListasBD(); 
            document.getElementById('db-veiculo-placa').value = placa; 
            if(dono) document.getElementById('db-cliente-nome').value = dono; 
            
            window.dispararAlerta("Veículo salvo no banco com sucesso!", "sucesso");
        }
        window.fecharModalCadastro();
    } catch (erro) {
        if(erro.code === '23505') window.dispararAlerta("Este registro (Placa ou Documento) já existe no banco.");
        else window.dispararAlerta("Falha ao salvar no banco de dados.");
    } finally {
        btnSalvar.innerHTML = textoOriginal;
        btnSalvar.disabled = false;
    }
};

window.gerarPDFSupabase = async function(dadosCodificados) {
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

    let cliDados = orc.itens?.cliente_dados || window.globalClientes.find(c => c.nome === orc.cliente_nome) || {};
    let veiDados = orc.itens?.veiculo_dados || window.globalVeiculos.find(v => v.placa === orc.veiculo_placa) || {};

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
        htmlTabela += pecas.map(i => `<tr><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">${i.tipo}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #000000;">${i.quantidade}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB;"><div style="font-weight: bold; color: #000000;">${i.descricao}</div>${i.detalhe ? `<div style="font-size: 9px; color: #4B5563; font-style: italic; margin-top: 1px;">Obs: ${i.detalhe}</div>` : ''}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; color: #000000;">${window.formataDinheiro(i.valor_unitario)}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #000000;">${window.formataDinheiro(i.subtotal)}</td></tr>`).join('');
    }
    if(servicos.length > 0) {
        htmlTabela += `<tr><td colspan="5" style="background-color: #F3F4F6; font-weight: bold; padding: 6px 10px; color: #000000; text-transform: uppercase; font-size: 10px; border-top: 1px solid #000000; border-bottom: 1px solid #D1D5DB;">2. Mão de Obra e Serviços</td></tr>`;
        htmlTabela += servicos.map(i => `<tr><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">${i.tipo}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #000000;">${i.quantidade}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB;"><div style="font-weight: bold; color: #000000;">${i.descricao}</div>${i.detalhe ? `<div style="font-size: 9px; color: #4B5563; font-style: italic; margin-top: 1px;">Obs: ${i.detalhe}</div>` : ''}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; color: #000000;">${window.formataDinheiro(i.valor_unitario)}</td><td style="padding: 6px 10px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #000000;">${window.formataDinheiro(i.subtotal)}</td></tr>`).join('');
    }
    htmlTabela += `</tbody></table>`;
    document.getElementById('pdf-container-itens').innerHTML = htmlTabela;

    document.getElementById('pdf-tot-pecas').innerText = window.formataDinheiro(calcPecas);
    document.getElementById('pdf-tot-servicos').innerText = window.formataDinheiro(calcServicos);
    document.getElementById('pdf-tot-desc').innerText = `- ${window.formataDinheiro(calcDesc)}`;
    document.getElementById('pdf-tot-final').innerText = window.formataDinheiro(calcTotal);

    const boxObs = document.getElementById('pdf-container-obs');
    const pdfObsTextoEl = document.getElementById('pdf-obs-texto');
    if(orc.observacao && orc.observacao.trim() !== '') { 
        if(pdfObsTextoEl) pdfObsTextoEl.innerText = orc.observacao; 
        if(boxObs) boxObs.style.display = 'block'; 
    } else { 
        if(boxObs) boxObs.style.display = 'none'; 
    }

    const containerFin = document.getElementById('pdf-container-financeiro');
    containerFin.innerHTML = '';
    
    try {
        const { data: recordsFin } = await window.banco.from('contas_receber')
            .select('*').like('descricao', `%O.S #${orc.numero_os}%`).order('data_vencimento', { ascending: true });
            
        if (recordsFin && recordsFin.length > 0) {
            let htmlFin = `<h3 style="font-size: 10px; color: #000000; text-transform: uppercase; margin: 0 0 6px 0; border-bottom: 1px solid #D1D5DB; padding-bottom: 4px; font-weight: bold;">Condições de Pagamento Combinadas</h3>`;
            htmlFin += `<table style="width: 100%; border-collapse: collapse; font-size: 10px;">`;
            
            let counterParcela = 1;
            const parcelasPuras = recordsFin.filter(r => r.categoria !== 'Adiantamento' && !r.descricao.includes('Acerto Imediato'));
            const totalParcelas = parcelasPuras.length;

            recordsFin.forEach(rec => {
                const dataBR = new Date(rec.data_vencimento + 'T12:00:00Z').toLocaleDateString('pt-BR');
                if (rec.categoria === 'Adiantamento' || rec.descricao.includes('Acerto Imediato')) {
                    htmlFin += `<tr><td style="padding: 4px; border-bottom: 1px dashed #e2e8f0;"><b>Acerto Imediato:</b> ${window.formataDinheiro(rec.valor)} (Via ${rec.forma_pagamento} em ${dataBR}) - <span style="font-weight: bold; color: #000000;">PAGO</span></td></tr>`;
                } else {
                    htmlFin += `<tr><td style="padding: 4px; border-bottom: 1px dashed #e2e8f0;"><b>Parcela ${counterParcela}/${totalParcelas}:</b> ${window.formataDinheiro(rec.valor)} - Vencimento: ${dataBR} (Via ${rec.forma_pagamento})</td></tr>`;
                    counterParcela++;
                }
            });

            htmlFin += `</table>`;
            containerFin.innerHTML = htmlFin;
            containerFin.style.display = 'block';
        } else {
            containerFin.style.display = 'none';
        }
    } catch (e) {
        console.error("Erro ao buscar financeiro para PDF", e);
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
};

console.log("🟢 Módulo Orçamentos Carregado e Ancorado com Sucesso!");
