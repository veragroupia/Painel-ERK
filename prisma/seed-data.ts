// Catálogo, categorias e garantias — extraídos verbatim de "ERK Pratas.dc.html"
// (const CATS / PRODS / GARANTIAS). Fonte única de verdade para o seed do banco.

export const CATS = [
  { id: 'correntes', nome: 'Correntes', icone: 'correntes', fid: 16109263 },
  { id: 'pulseiras', nome: 'Pulseiras', icone: 'pulseiras', fid: 16304561 },
  { id: 'aneis', nome: 'Anéis', icone: 'aneis', fid: 11351004 },
  { id: 'pingentes', nome: 'Pingentes', icone: 'pingentes', fid: 16056798 },
  { id: 'brincos', nome: 'Brincos', icone: 'brincos', fid: 15799258 },
  { id: 'conjuntos', nome: 'Conjuntos', icone: 'conjuntos', fid: 7093184 },
];

export const PRODS = [
  { id: 'p01', n: 'Corrente cubana', c: 'correntes', s: 'Elo cubano · 60 cm', p: '231,00', a: '289,00', fid: 16124761, tags: ['Mais vendida'], d3: { tipo: 'corrente', elo: 'cubano', esp: 4, medida: 60 } },
  { id: 'p02', n: 'Corrente grumet', c: 'correntes', s: 'Elo grumet · 60 cm', p: '199,00', a: '249,00', fid: 16109263, tags: [], d3: { tipo: 'corrente', elo: 'grumet', esp: 4, medida: 60 } },
  { id: 'p03', n: 'Corrente veneziana', c: 'correntes', s: 'Malha veneziana · 45 cm', p: '143,00', a: '179,00', fid: 16109182, tags: [], d3: { tipo: 'corrente', elo: 'veneziana', esp: 2.5, medida: 45 } },
  { id: 'p04', n: 'Corrente cartier', c: 'correntes', s: 'Elo alongado · 50 cm', p: '199,00', a: null, fid: 10973370, tags: ['Novo'], d3: { tipo: 'corrente', elo: 'cartier', esp: 4, medida: 50 } },
  { id: 'p05', n: 'Corrente baiana', c: 'correntes', s: 'Elo com bola · 70 cm', p: '259,00', a: '319,00', fid: 34178925, tags: [], d3: { tipo: 'corrente', elo: 'baiana', esp: 5, medida: 70 } },
  { id: 'p06', n: 'Pulseira cubana', c: 'pulseiras', s: 'Elo cubano · 21 cm', p: '151,00', a: '189,00', fid: 16304561, tags: ['Mais vendida'], d3: { tipo: 'pulseira', elo: 'cubano', esp: 4, medida: 21 } },
  { id: 'p07', n: 'Pulseira veneziana', c: 'pulseiras', s: 'Malha veneziana · 18 cm', p: '129,00', a: null, fid: 13595530, tags: [], d3: { tipo: 'pulseira', elo: 'veneziana', esp: 2.5, medida: 18 } },
  { id: 'p08', n: 'Bracelete liso', c: 'pulseiras', s: 'Aro liso · sem fecho', p: '175,00', a: '219,00', fid: 13595766, tags: [], d3: { tipo: 'bracelete', esp: 6 } },
  { id: 'p09', n: 'Anel liso polido', c: 'aneis', s: 'Aro 4 mm · polido', p: '89,00', a: null, fid: 35409286, tags: [], d3: { tipo: 'anel', esp: 4, medida: 18 } },
  { id: 'p10', n: 'Anel sinete', c: 'aneis', s: 'Com gravação', p: '149,00', a: null, fid: 6766024, tags: ['Sob encomenda'], d3: { tipo: 'anel', esp: 6, medida: 20, sinete: true, gravacao: 'ERK' } },
  { id: 'p11', n: 'Pingente cruz', c: 'pingentes', s: 'Argola reforçada', p: '79,00', a: null, fid: 16056798, tags: [], d3: { tipo: 'pingente', pingente: 'cruz', esp: 4 } },
  { id: 'p12', n: 'Placa personalizada', c: 'pingentes', s: 'Nome gravado', p: '129,00', a: null, fid: 147637, tags: ['Sob encomenda'], d3: { tipo: 'pingente', pingente: 'placa', esp: 4, gravacao: 'Ana' } },
  { id: 'p13', n: 'Argola média', c: 'brincos', s: 'Par · 23 mm', p: '99,00', a: null, fid: 15799266, tags: [], d3: { tipo: 'brinco', brinco: 'argola', esp: 3 } },
  { id: 'p14', n: 'Brinco ponto de luz', c: 'brincos', s: 'Par · com tarraxa', p: '69,00', a: '89,00', fid: 5370657, tags: ['Presente'], d3: { tipo: 'brinco', brinco: 'ponto', esp: 3 } },
  { id: 'p15', n: 'Conjunto casal', c: 'conjuntos', s: 'Duas correntes cubanas', p: '343,00', a: '429,00', fid: 8345752, tags: ['Mais vendida'], d3: { tipo: 'corrente', elo: 'cubano', esp: 5, medida: 60 } },
  { id: 'p16', n: 'Conjunto corrente e pulseira', c: 'conjuntos', s: 'Corrente 60 + pulseira 21', p: '279,00', a: '349,00', fid: 7093184, tags: [], d3: { tipo: 'corrente', elo: 'cubano', esp: 4, medida: 60 } },
] as const;

export const GARANTIAS = [
  { icone: 'puncao', titulo: 'Prata 925 com punção', texto: 'Toda peça sai gravada. Nada de folheado.' },
  { icone: 'garantia', titulo: 'Garantia vitalícia', texto: 'Defeito de fabricação a gente resolve, sem prazo.' },
  { icone: 'entrega', titulo: 'Motoboy na região', texto: 'Salto, Itu, Indaiatuba e Cabreúva no mesmo dia.' },
  { icone: 'oficina', titulo: 'Oficina própria', texto: 'Polimento, solda e ajuste feitos aqui dentro.' },
];

export const TELEFONE = '5511911124875';
export const PRECO_GRAMA = 6.6;
