# Painel ERK Pratas

Área interna da [ERK Pratas](https://site-production-0686.up.railway.app) — joalheria de prata 925 com oficina própria em Salto, SP.

É um site separado da loja, com deploy próprio e endereço próprio. **A única coisa em comum é o banco de dados**: o painel lê e escreve no mesmo Postgres que a loja usa, então pedido feito no site aparece aqui na hora.

O dono precisa responder duas perguntas em segundos: *o que eu preciso fazer hoje?* e *quanto eu lucrei esse mês?* A tela inicial existe para isso.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Prisma** + **PostgreSQL** — o mesmo banco da loja
- **NextAuth** (credenciais) — só entra quem tem `role = "admin"`; a middleware barra todo o resto antes de renderizar qualquer coisa
- **three.js** no visualizador 3D da aba Ficha 3D

## Quem manda no banco

**Este repositório é o dono do schema.** É aqui que ficam o `schema.prisma`, as migrações e o seed; o `npm run start:prod` roda `prisma db push` e o seed a cada deploy.

A loja **não pode** rodar `prisma db push` — se rodar, o schema dela (que não conhece as tabelas do painel) apaga o que está aqui. No repositório da loja, o `start:prod` precisa ser só `next start`. Isso está aplicado no patch `loja-parar-db-push.patch`, entregue junto.

Quando alguma coisa mudar no schema, muda aqui e sai em deploy daqui. A loja continua funcionando sem saber: colunas novas entram com valor padrão e o Prisma dela simplesmente ignora o que não conhece.

## Rodando local

Precisa de um Postgres acessível. Aponte a `DATABASE_URL` para ele (ou para o banco da Railway, se quiser olhar dado real):

```bash
npm install
npm run dev
```

Na primeira execução o `npm run dev` cria o `.env`, sincroniza o banco e carrega uma massa de demonstração (pedidos, clientes, insumos e combos fictícios) para você ver as telas cheias.

Essa massa **só entra com `SEED_DEMO=1`**, que o script local define sozinho. Em produção o painel nunca inventa dado: mostra o que a loja realmente vendeu.

## Entrando

O seed cria o acesso inicial: `dono@erkpratas.com.br` / `erkpratas@2026`. **Troque essa senha antes de usar de verdade.**

Para dar acesso a mais alguém, a pessoa precisa ter conta na loja; depois é só marcar o cadastro dela como `role = "admin"`.

## As telas

- **Visão geral** (`/`) — faixa do dia (pedidos, a despachar, faturamento, ticket médio, com a variação contra ontem), cartão de lucro do mês com a conta aberta linha a linha, "precisa de você" (pedido parado, 3D esperando aprovação, insumo acabando), gráfico diário de custo/lucro/faturamento, peças mais vendidas e destaque do dia.
- **Pedidos** — pílulas de status com contador, busca por número/cliente/telefone, filtro de período e pagamento. Tabela no computador, cartões no celular. "Parado há" fica vermelho depois de 48 h — é o sinal de que algo travou. Dá para selecionar vários, mudar o status em lote e imprimir etiquetas.
- **Pedido** — linha do tempo com data, hora e quem marcou; itens com a ficha da oficina quando é peça sob encomenda; custo e lucro editáveis, com o "sobrou" grande; cliente com botão do WhatsApp; entrega com o campo *onde está* (é o que o cliente ouve quando pergunta pelo pedido); pagamento; anotações internas. Imprime etiqueta e ficha de produção.
- **Peças** — grade com preço, custo, margem em etiqueta colorida (verde acima de 40%, amarela entre 20 e 40, vermelha abaixo), estoque e situação. Arrastar os cartões muda a ordem da vitrine.
- **Peça** — quatro abas: Dados; Mídia (galeria com capa, giro 360° e comparação com o 3D da IA para aprovar ou descartar); Custo e preço (soma sozinho, com sugestões de 2×, 2,5× e 3× do custo); Ficha 3D com prévia ao vivo.
- **Vitrine** — destaque do dia com a programação da semana, combos (com a economia do cliente e a sobra calculadas, para não montar combo no prejuízo), ofertas e a ordem das seções da home.
- **Montador** — as opções que o cliente vê ao montar a peça, arrastáveis e com chave de ligar/desligar (desligar tira a opção do site na hora), tabela de peso por elo × espessura × medida e os parâmetros de preço.
- **Insumos** — estoque com barra de quanto resta e linha vermelha quando está acabando, registro de compra (recalcula o custo médio), baixa de consumo e resumo do mês.
- **Financeiro** — a conta do mês aberta, gráfico de 12 meses, peças que mais deram lucro, peças com margem apertada, despesas fixas e exportação em CSV para o contador.
- **Clientes** — busca, total gasto, última compra; no detalhe, contato, endereço, medidas salvas e o histórico de pedidos.
- **Ajustes** — dados da loja, áreas de entrega e frete, formas de pagamento com taxa, valor do grama da prata (com histórico, porque muda com o mercado), despesas fixas e quem entra no painel.

## No celular

O painel é feito para ser usado do telefone — é de lá que o dono olha o pedido
enquanto está na bancada. Todas as telas foram medidas em 320, 360 e 390 px de
largura: nenhuma rola para o lado.

- A barra lateral vira gaveta pelo botão de menu, com os mesmos itens e contadores.
- As tabelas viram cartões; o que continua sendo tabela rola só dentro do próprio quadro.
- A linha do tempo do pedido fica em pé, para dar para ver o passo atual sem arrastar.
- Os gráficos medem a largura que têm e desenham nela, então o eixo continua legível.
- Botão, chave e caixa de seleção crescem para o tamanho do dedo em tela de toque.
- **Reordenar tem botões de subir e descer**, porque arrastar e soltar não
  funciona no dedo: os eventos de arrasto do HTML não existem no toque. No
  computador o arrasto continua valendo, que é mais rápido para muita coisa.

## Pedidos que vêm da loja

A loja ainda cria pedido com o vocabulário antigo (`preparo`, sem linha do tempo). O painel entende esses pedidos como "em produção" e mostra a entrada deles como registro da loja. Na primeira ação que você tomar sobre o pedido, o histórico que faltava é gravado e dali em diante ele segue o fluxo normal.

## O que o painel ainda não faz

- **Subir imagem de arquivo.** O container da Railway não guarda arquivo entre deploys, então não há onde salvar. A galeria e o giro 360° aceitam endereço de imagem já hospedada; a prévia do giro roda no seu navegador antes de salvar, com os avisos de brilho, quantidade de quadros e tamanho diferente. Resolver isso é ligar um armazenamento (bucket) — aí o campo de endereço vira upload de verdade.
- **Gerar o modelo 3D pela IA.** O painel administra o estado (pendente → aprovado ou descartado) e guarda o endereço do `.glb`, mas não existe pipeline de geração ligada.
- O preço da peça sob encomenda continua saindo da fórmula do montador no site. A tabela de peso daqui é o registro de referência da oficina.
- Peça sob encomenda feita no site chega sem a ficha detalhada (só o resumo em texto), porque a loja ainda não grava esses campos no pedido. É uma mudança de duas linhas no repositório da loja, quando você quiser.

## Deploy

Serviço próprio na Railway, dentro do mesmo projeto `erk-pratas` — assim ele referencia o banco por `${{Postgres.DATABASE_URL}}`, sem senha escrita em lugar nenhum.

Variáveis necessárias:

```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
NEXTAUTH_SECRET = (gere um valor próprio)
NEXTAUTH_URL = https://<endereço-do-painel>
```

O start é `npm run start:prod`: sincroniza o schema, roda o seed (que completa os campos do painel nas peças existentes e ajusta pedidos antigos) e sobe o servidor.
