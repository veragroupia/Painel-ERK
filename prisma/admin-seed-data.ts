// Dados de apoio para o seed do painel administrativo — insumos, combos,
// ofertas, opções do montador, despesas fixas e ajustes da loja.

export const ADMIN_EMAIL = 'dono@erkpratas.com.br';
export const ADMIN_SENHA_PADRAO = 'erkpratas@2026';

export const SUPPLIES = [
  { id: 'sup-massa-polir', name: 'Massa de polir branca', type: 'massa_polir', unit: 'g', stockQty: 40, unitCost: 0.18, lowStockThreshold: 150 },
  { id: 'sup-flanela', name: 'Flanela de acabamento', type: 'flanela', unit: 'unidade', stockQty: 34, unitCost: 3.2, lowStockThreshold: 10 },
  { id: 'sup-liquido', name: 'Líquido de limpeza para prata', type: 'liquido_limpeza', unit: 'ml', stockQty: 820, unitCost: 0.06, lowStockThreshold: 300 },
  { id: 'sup-escova', name: 'Escova de latão', type: 'escova', unit: 'unidade', stockQty: 9, unitCost: 6.5, lowStockThreshold: 4 },
  { id: 'sup-caixinha', name: 'Caixinha para joia', type: 'caixinha', unit: 'unidade', stockQty: 146, unitCost: 2.9, lowStockThreshold: 40 },
  { id: 'sup-saquinho', name: 'Saquinho antiácido', type: 'saquinho', unit: 'unidade', stockQty: 210, unitCost: 0.7, lowStockThreshold: 60 },
  { id: 'sup-cartao', name: 'Cartão de garantia', type: 'cartao', unit: 'unidade', stockQty: 88, unitCost: 0.9, lowStockThreshold: 30 },
  { id: 'sup-fecho', name: 'Fecho mosquetão 8mm', type: 'outro', unit: 'unidade', stockQty: 54, unitCost: 3.4, lowStockThreshold: 15 },
  { id: 'sup-argola', name: 'Argola reforçada', type: 'outro', unit: 'unidade', stockQty: 61, unitCost: 1.6, lowStockThreshold: 20 },
] as const;

export const SUPPLY_PURCHASES = [
  { supplyId: 'sup-massa-polir', supplier: 'Rotelli Insumos', quantity: 500, totalPaid: 92, daysAgo: 28 },
  { supplyId: 'sup-flanela', supplier: 'Embalagens Salto', quantity: 50, totalPaid: 158, daysAgo: 40 },
  { supplyId: 'sup-liquido', supplier: 'Rotelli Insumos', quantity: 1000, totalPaid: 58, daysAgo: 15 },
  { supplyId: 'sup-caixinha', supplier: 'Embalagens Salto', quantity: 200, totalPaid: 560, daysAgo: 22 },
  { supplyId: 'sup-saquinho', supplier: 'Embalagens Salto', quantity: 300, totalPaid: 190, daysAgo: 22 },
  { supplyId: 'sup-fecho', supplier: 'Metal Prata SP', quantity: 100, totalPaid: 320, daysAgo: 35 },
] as const;

export const SUPPLY_CONSUMPTIONS = [
  { supplyId: 'sup-massa-polir', quantity: 8, productName: 'Corrente cubana', daysAgo: 1 },
  { supplyId: 'sup-massa-polir', quantity: 6, productName: 'Pulseira cubana', daysAgo: 2 },
  { supplyId: 'sup-massa-polir', quantity: 9, productName: 'Anel sinete', daysAgo: 3 },
  { supplyId: 'sup-massa-polir', quantity: 7, productName: 'Corrente grumet', daysAgo: 5 },
  { supplyId: 'sup-caixinha', quantity: 4, productName: 'Pedidos da semana', daysAgo: 2 },
  { supplyId: 'sup-saquinho', quantity: 6, productName: 'Pedidos da semana', daysAgo: 2 },
] as const;

export const COMBOS = [
  {
    id: 'combo-casal',
    name: 'Conjunto casal cubano',
    productIds: ['p01', 'p06'],
    priceOverride: 330,
    stockLimit: 12,
  },
  {
    id: 'combo-presente',
    name: 'Kit presente ponto de luz',
    productIds: ['p14', 'p11'],
    priceOverride: 129,
    stockLimit: null,
  },
] as const;

export const OFFERS = [
  { id: 'off-correntes', name: 'Correntes com 10% off', discountType: 'percent', discountValue: 10, categoryId: 'correntes', coupon: null, soldCount: 14, daysActive: 6 },
  { id: 'off-cupom-bemvindo', name: 'Cupom ERK10', discountType: 'percent', discountValue: 10, productId: null, categoryId: null, coupon: 'ERK10', soldCount: 22, daysActive: 20 },
] as const;

export const VITRINE_SECTIONS = [
  { id: 'destaque', order: 0 },
  { id: 'lancamentos', order: 1 },
  { id: 'mais_vendidos', order: 2 },
  { id: 'combos', order: 3 },
  { id: 'promocoes', order: 4 },
] as const;

export const MONTADOR_STEP_OPTIONS: { step: string; name: string; description: string; order: number }[] = [
  { step: 'tipo', name: 'Corrente', description: 'de 45 a 70 cm', order: 0 },
  { step: 'tipo', name: 'Pulseira', description: 'de 18 a 23 cm', order: 1 },
  { step: 'tipo', name: 'Anel', description: 'aro 16 a 22', order: 2 },
  { step: 'tipo', name: 'Pingente', description: 'cruz, placa ou medalha', order: 3 },
  { step: 'elo', name: 'Cubano', description: 'malha fechada, a mais pedida', order: 0 },
  { step: 'elo', name: 'Grumet', description: 'elo torcido, clássico', order: 1 },
  { step: 'elo', name: 'Veneziana', description: 'malha quadrada, discreta', order: 2 },
  { step: 'elo', name: 'Cartier', description: 'elo alongado', order: 3 },
  { step: 'elo', name: 'Baiana', description: 'bola entre os elos', order: 4 },
  { step: 'acabamento', name: 'Polido', description: 'espelhado, brilho cheio', order: 0 },
  { step: 'acabamento', name: 'Escovado', description: 'fosco, marca menos', order: 1 },
  { step: 'acabamento', name: 'Oxidado', description: 'escurecido nos vãos', order: 2 },
  { step: 'pingente', name: 'Cruz', description: 'vazada, 3 cm', order: 0 },
  { step: 'pingente', name: 'Placa', description: 'aceita gravação', order: 1 },
  { step: 'pingente', name: 'Medalha', description: 'redonda, lisa', order: 2 },
];

export const FIXED_EXPENSES = [
  { name: 'Aluguel da oficina', amount: 1400, dayOfMonth: 5 },
  { name: 'Energia elétrica', amount: 220, dayOfMonth: 10 },
  { name: 'Internet', amount: 120, dayOfMonth: 12 },
  { name: 'Hospedagem do site', amount: 60, dayOfMonth: 6 },
  { name: 'Contador', amount: 350, dayOfMonth: 15 },
] as const;

export const SETTINGS_SEED = {
  storeName: 'ERK Pratas',
  hours: [
    { dia: 'Segunda a sexta', horario: '9h às 18h' },
    { dia: 'Sábado', horario: '9h às 13h' },
    { dia: 'Domingo', horario: 'Fechado' },
  ],
  deliveryZones: [
    { nome: 'Salto', valor: 0, prazo: 'no mesmo dia' },
    { nome: 'Itu', valor: 12, prazo: 'no mesmo dia' },
    { nome: 'Indaiatuba', valor: 15, prazo: 'em até 1 dia' },
    { nome: 'Cabreúva', valor: 15, prazo: 'em até 1 dia' },
    { nome: 'Demais cidades (Correios)', valor: 22, prazo: '3 a 7 dias úteis' },
  ],
  paymentMethods: [
    { nome: 'Pix', ativo: true, taxa: 0 },
    { nome: 'Cartão de crédito', ativo: true, taxa: 4.2 },
    { nome: 'Cartão de débito', ativo: true, taxa: 2.1 },
    { nome: 'WhatsApp (combinar)', ativo: true, taxa: 0 },
  ],
};
