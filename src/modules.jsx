import { vehicleLabel, driverName, fmtDate, fmtBRL, maintenanceCost, oilStatus, preventiveInfo, docStatus, statusBadge } from './lib/calc'

// Config declarativa dos módulos CRUD. Para criar um novo módulo basta adicionar um item aqui.
const V = { key: 'vehicleId', label: 'Veículo', type: 'vehicle', required: true }
const D = (key = 'motoristaId', label = 'Motorista') => ({ key, label, type: 'driver' })
const T = (key, label, extra = {}) => ({ key, label, type: 'text', ...extra })
const N = (key, label, extra = {}) => ({ key, label, type: 'number', ...extra })
const DT = (key, label, extra = {}) => ({ key, label, type: 'date', ...extra })
const S = (key, label, options, extra = {}) => ({ key, label, type: 'select', options, ...extra })
const veh = { key: 'vehicleId', label: 'Veículo', render: (r, db) => vehicleLabel(db, r.vehicleId) }
const pill = (lvl, txt) => <span className={'pill ' + lvl}>{txt}</span>

export const MODULES = [
  { path: 'frota', module: 'vehicles', icon: '🚛', title: 'Frota', singular: 'Veículo', manage: true,
    fields: [N('numero', 'Número interno', { required: true }), T('placa', 'Placa', { required: true }), T('marca', 'Marca'), T('modelo', 'Modelo'), T('versao', 'Versão'), N('ano', 'Ano'),
      T('tipo', 'Tipo', { default: 'Utilitário de carga' }), S('carroceria', 'Carroceria', ['Baú', 'Aberta']), T('combustivel', 'Combustível', { default: 'Diesel' }), N('kmAtual', 'KM atual', { default: 0 }),
      D('motoristaId', 'Motorista responsável'), T('setor', 'Setor', { default: 'Logística' }), S('status', 'Status', ['Disponível', 'Pendente', 'Em Manutenção', 'Bloqueado', 'Inativo'], { default: 'Disponível' }),
      DT('dataAquisicao', 'Data de aquisição'), { key: 'observacoes', label: 'Observações', type: 'textarea', full: true }],
    columns: [{ key: 'numero', label: 'Nº' }, { key: 'placa', label: 'Placa' }, { key: 'm', label: 'Veículo', render: (r) => `${r.marca || ''} ${r.modelo || ''}` },
      { key: 'kmAtual', label: 'KM', render: (r) => Number(r.kmAtual || 0).toLocaleString('pt-BR') }, { key: 'mot', label: 'Motorista', render: (r, db) => driverName(db, r.motoristaId) },
      { key: 'status', label: 'Status', render: (r) => <span className={'badge ' + statusBadge(r.status)}>{r.status}</span> }] },

  { path: 'motoristas', module: 'drivers', icon: '👨‍✈️', title: 'Motoristas', singular: 'Motorista', manage: true,
    fields: [T('nome', 'Nome', { required: true }), S('cnh', 'CNH', ['A', 'B', 'C', 'D', 'E'], { default: 'D' }), DT('validadeCnh', 'Validade da CNH'), T('telefone', 'Telefone'), S('status', 'Status', ['Ativo', 'Inativo'], { default: 'Ativo' })],
    columns: [{ key: 'nome', label: 'Nome' }, { key: 'cnh', label: 'CNH' }, { key: 'validadeCnh', label: 'Validade', render: (r) => fmtDate(r.validadeCnh) }, { key: 'telefone', label: 'Telefone' }, { key: 'status', label: 'Status' }] },

  { path: 'manutencoes', module: 'maintenance', icon: '🔧', title: 'Manutenções', singular: 'Manutenção', manage: true,
    fields: [V, S('tipo', 'Tipo', ['Preventiva', 'Corretiva', 'Preditiva'], { default: 'Corretiva' }), S('status', 'Status', ['Aguardando', 'Em manutenção', 'Aguardando peça', 'Finalizada', 'Cancelada'], { default: 'Em manutenção' }),
      T('oficina', 'Oficina'), D(), N('km', 'KM'), DT('dataEntrada', 'Entrada'), DT('dataPrevista', 'Previsão'), DT('dataConclusao', 'Conclusão'),
      { key: 'problema', label: 'Problema', type: 'textarea', full: true }, { key: 'servicos', label: 'Serviços', type: 'textarea', full: true },
      N('pecas', 'Peças (R$)', { default: 0 }), N('maoObra', 'Mão de obra (R$)', { default: 0 }), N('outros', 'Outros (R$)', { default: 0 }), T('garantia', 'Garantia')],
    columns: [veh, { key: 'tipo', label: 'Tipo' }, { key: 'status', label: 'Status' }, { key: 'oficina', label: 'Oficina' }, { key: 'dataEntrada', label: 'Entrada', render: (r) => fmtDate(r.dataEntrada) }, { key: 'c', label: 'Custo', render: (r) => fmtBRL(maintenanceCost(r)) }] },

  { path: 'preventivas', module: 'preventive', icon: '📅', title: 'Preventivas', singular: 'Preventiva', manage: true,
    fields: [V, T('servico', 'Serviço', { required: true }), N('periodicidadeKm', 'Periodicidade (km)'), N('periodicidadeMeses', 'Periodicidade (meses)'), DT('ultimaExecucaoData', 'Última execução'), N('ultimaExecucaoKm', 'KM da última execução'), S('prioridade', 'Prioridade', ['Alta', 'Média', 'Baixa'], { default: 'Média' }), T('responsavel', 'Responsável')],
    columns: [veh, { key: 'servico', label: 'Serviço' }, { key: 'prox', label: 'Próxima', render: (r, db) => { const s = preventiveInfo(db, r); return pill(s.status, fmtDate(s.proxData) + ' / ' + s.kmRestante + ' km') } }, { key: 'prioridade', label: 'Prioridade' }] },

  { path: 'oleo', module: 'oil', icon: '🛢️', title: 'Troca de Óleo', singular: 'Troca de óleo', manage: true,
    fields: [V, T('tipoOleo', 'Tipo de óleo'), T('marca', 'Marca'), N('litros', 'Litros'), S('filtro', 'Trocou filtro?', ['Sim', 'Não']), DT('data', 'Data'), N('km', 'KM'), N('periodicidadeKm', 'Periodicidade (km)', { default: 10000 }), N('periodicidadeMeses', 'Periodicidade (meses)', { default: 6 }), T('oficina', 'Oficina'), N('custo', 'Custo (R$)', { default: 0 })],
    columns: [veh, { key: 'tipoOleo', label: 'Óleo' }, { key: 'data', label: 'Data', render: (r) => fmtDate(r.data) }, { key: 'st', label: 'Situação', render: (r, db) => { const s = oilStatus(db, r); return pill(s.status, s.status === 'r' ? 'Atrasada' : s.status === 'y' ? 'Próxima' : 'Em dia') } }, { key: 'custo', label: 'Custo', render: (r) => fmtBRL(r.custo) }] },

  { path: 'abastecimentos', module: 'refuels', icon: '⛽', title: 'Abastecimentos', singular: 'Abastecimento', operate: true,
    fields: [V, D(), DT('data', 'Data'), T('posto', 'Posto'), S('combustivel', 'Combustível', ['Diesel', 'Gasolina', 'Etanol', 'GNV']), N('litros', 'Litros'), N('valor', 'Valor (R$)'), N('km', 'KM')],
    columns: [veh, { key: 'data', label: 'Data', render: (r) => fmtDate(r.data) }, { key: 'posto', label: 'Posto' }, { key: 'litros', label: 'Litros' }, { key: 'valor', label: 'Valor', render: (r) => fmtBRL(r.valor) }] },

  { path: 'pneus', module: 'tires', icon: '🛞', title: 'Pneus', singular: 'Pneu', manage: true,
    fields: [V, T('marca', 'Marca'), T('modelo', 'Modelo'), T('medida', 'Medida'), T('posicao', 'Posição'), DT('dataInstalacao', 'Instalação'), N('kmInstalacao', 'KM instalação'), N('valor', 'Valor (R$)'), DT('dataRetirada', 'Retirada'), N('kmRetirada', 'KM retirada'), T('motivo', 'Motivo')],
    columns: [veh, { key: 'marca', label: 'Marca' }, { key: 'posicao', label: 'Posição' }, { key: 'dataInstalacao', label: 'Instalado', render: (r) => fmtDate(r.dataInstalacao) }, { key: 'valor', label: 'Valor', render: (r) => fmtBRL(r.valor) }] },

  { path: 'avarias', module: 'damages', icon: '⚠️', title: 'Avarias', singular: 'Avaria', operate: true,
    fields: [V, D(), DT('data', 'Data'), T('tipo', 'Tipo'), S('classificacao', 'Classificação', ['Leve', 'Moderada', 'Crítica']), S('status', 'Status', ['Aberta', 'Em reparo', 'Resolvida'], { default: 'Aberta' }), T('responsavel', 'Responsável'), DT('prazo', 'Prazo'), N('custo', 'Custo (R$)', { default: 0 }), { key: 'descricao', label: 'Descrição', type: 'textarea', full: true }],
    columns: [veh, { key: 'tipo', label: 'Tipo' }, { key: 'classificacao', label: 'Gravidade', render: (r) => pill({ Crítica: 'r', Moderada: 'y', Leve: 'g' }[r.classificacao] || 'gray', r.classificacao) }, { key: 'status', label: 'Status' }, { key: 'data', label: 'Data', render: (r) => fmtDate(r.data) }] },

  { path: 'documentacao', module: 'documents', icon: '📄', title: 'Documentação', singular: 'Documento', manage: true,
    fields: [V, S('tipo', 'Tipo', ['Licenciamento', 'IPVA', 'Seguro', 'Vistoria', 'Outro']), T('numero', 'Número'), DT('dataVencimento', 'Vencimento'), N('custo', 'Custo (R$)', { default: 0 }), { key: 'observacoes', label: 'Observações', type: 'textarea', full: true }],
    columns: [veh, { key: 'tipo', label: 'Tipo' }, { key: 'numero', label: 'Número' }, { key: 'v', label: 'Vencimento', render: (r) => pill(docStatus(r), fmtDate(r.dataVencimento)) }] },

  { path: 'oficinas', module: 'workshops', icon: '🏭', title: 'Oficinas', singular: 'Oficina', manage: true,
    fields: [T('nome', 'Nome', { required: true }), T('cnpj', 'CNPJ'), T('contato', 'Contato'), T('especialidade', 'Especialidade'), N('prazoMedio', 'Prazo médio (dias)'), N('valorMedio', 'Valor médio (R$)'), T('garantia', 'Garantia')],
    columns: [{ key: 'nome', label: 'Nome' }, { key: 'especialidade', label: 'Especialidade' }, { key: 'contato', label: 'Contato' }, { key: 'prazoMedio', label: 'Prazo (dias)' }] },

  { path: 'checklists', module: 'checklists', icon: '✅', title: 'Checklists', singular: 'Checklist', operate: true,
    fields: [V, D(), DT('data', 'Data'), T('hora', 'Hora'), N('km', 'KM'), { key: 'itens', label: 'Itens do Checklist', type: 'checklist' }, S('situacao', 'SITUAÇÃO', ['OK', 'Pendência'], { default: 'OK' }), { key: 'observacoes', label: 'Observações', type: 'textarea', full: true }],
    columns: [veh, { key: 'data', label: 'Data', render: (r) => fmtDate(r.data) }, { key: 'km', label: 'KM' }, { key: 'situacao', label: 'Situação', render: (r) => pill(r.situacao === 'OK' ? 'g' : 'r', r.situacao) }] },

  { path: 'auditoria', module: 'kmLog', icon: '📜', title: 'Auditoria de KM', singular: 'Log', manage: false,
    fields: [],
    columns: [veh, { key: 'kmAnterior', label: 'KM Anterior' }, { key: 'kmAtual', label: 'KM Atual' }, { key: 'data', label: 'Data', render: (r) => fmtDate(r.data) }, { key: 'usuario', label: 'Usuário' }, { key: 'origem', label: 'Origem' }] },
]
