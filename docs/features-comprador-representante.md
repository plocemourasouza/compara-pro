# Compara Pró — briefing para a landing

Documento para quem vai melhorar a landing pública com ajuda externa. Descreve o que o produto faz hoje para **comprador** e **representante**, e o desenho que a página precisa respeitar.

A landing vende as duas portas no mesmo peso. A prova é o próprio produto: lista real, preço ao lado de preço, pré-pedido. Não há clientes nomeados, logos, percentual de economia nem prazo de teste para citar.

## O que se vende

O Compara Pró é uma plataforma B2B de comparação de preços. O comprador sobe a lista de compras. A plataforma cruza os itens com os catálogos dos fornecedores da carteira dele, marca a melhor oferta de cada linha e deixa sair o pré-pedido. O representante, do outro lado, mantém fornecedores, catálogos e clientes, e responde a esses pré-pedidos.

Não é uma vitrine nem um marketplace aberto. Só entra na comparação o fornecedor que já está na carteira do comprador.

O administrador opera empresas, usuários, produtos e relatórios. Essa função fica fora da landing.

## Voz

Português brasileiro, direto, de operação de compras. Frases curtas. O nome é **Compara Pró**.

As ações da landing são **Criar conta** e **Entrar**. Criar conta abre `/auth/register`. Entrar abre `/auth/login`. O cadastro atual da aplicação ainda diz “Cadastre-se como cliente”: a conta nova nasce do lado do comprador. O representante entra numa organização que já existe.

Evitar: “eleve”, “revolucionário”, “next-gen”, “IA”, “14 dias grátis”, “economize X%”, depoimento, logo de cliente.

## O laço que a landing precisa mostrar

1. O comprador envia a lista (Excel ou CSV, com template).
2. A plataforma casa os itens com o catálogo (SKU, código, nome, ou ajuste manual).
3. A comparação mostra os fornecedores lado a lado e a melhor oferta de cada linha.
4. O comprador gera o pré-pedido.
5. O representante aprova ou rejeita.

Estados do pré-pedido: pendente, aprovado, rejeitado, expirado.

## Comprador

Papel interno: `CLIENT`. Área depois do login: `/client`.

Ele compra para uma empresa. Vê só a própria organização. A saudação do painel é “Suas demandas, comparações e pré-pedidos.” O botão principal do painel é **Enviar lista**.

| Função | Onde | O que ele faz | O que ganha |
| --- | --- | --- | --- |
| Painel | `/client` | Vê demandas enviadas, comparações, pré-pedidos pendentes, aprovados e rejeitados, fornecedores da carteira e a economia calculada nas comparações dele. | Sabe o que está parado antes de abrir cada tela. |
| Upload de lista | `/client/upload` | Sobe a lista de compras. Pode baixar o template para o arquivo sair no formato certo. | A lista real vira a base da comparação. Sem lista, não há oferta. |
| Comparar preços | `/client/compare` | Escolhe uma lista já enviada. Vê os fornecedores da carteira em colunas, filtra por nome, SKU ou código, ajusta um casamento na mão e escolhe a oferta de cada linha. | O menor preço fica verde na célula, com o visto e o nome na coluna Melhor oferta. Dali ele gera um ou mais pré-pedidos. |
| Meus fornecedores | `/client/suppliers` | Vê a carteira. Só esses fornecedores entram na comparação. Pede a entrada de um fornecedor novo; o representante precisa aprovar. | A comparação fica restrita a quem ele realmente compra. |
| Pré-pedidos | `/client/pre-orders` | Acompanha o que enviou. O menu marca quantos estão pendentes. | O pedido não se perde depois da comparação. |
| Histórico | `/client/history` | Revê os uploads já feitos. | Uma lista antiga pode ser comparada de novo. |
| Usuários | `/client/usuarios` | Gente da própria empresa compradora. | Mais de uma pessoa opera a mesma lista. |
| Configurações | `/client/settings` | Dados da conta e da operação. | A empresa compradora permanece identificável. |
| Notificações | `/client/notifications` | Avisos da operação. | Resposta de pré-pedido e de carteira não dependem de ele estar na tela certa. |

No painel, a fila de atenção aponta três coisas: pré-pedidos aguardando resposta, comparações que ainda não viraram pré-pedido, e pedidos de fornecedor pendentes.

A “economia estimada” do painel é um número calculado nas comparações daquela empresa. Não é uma promessa de marketing.

## Representante

Papel interno: `REPRESENTATIVE`. Área depois do login: `/supplier`.

Ele não é o fornecedor em si. Representa uma ou mais empresas fornecedoras e atende uma carteira de compradores. A saudação do painel é “Resumo do seu catálogo, carteira e pré-pedidos.” O botão principal do painel é **Enviar catálogo**.

| Função | Onde | O que ele faz | O que ganha |
| --- | --- | --- | --- |
| Painel | `/supplier` | Vê produtos ativos, pré-pedidos pendentes, fornecedores que representa, clientes na carteira, valor aprovado e a economia registrada em pré-pedidos aprovados. | Enxerga catálogo, carteira e fila no mesmo lugar. |
| Fornecedores | `/supplier/fornecedores` | Cadastra e edita as empresas que representa. Cada lista de preços sai em nome de uma delas. | O preço do comprador chega com o fornecedor certo. |
| Listas de preço | `/supplier/history` | Histórico das listas de preço enviadas. | Sabe qual catálogo está valendo. |
| Produtos | `/supplier/products` | Mantém o catálogo de produtos. | Sem produto publicado, o comprador não tem com o que comparar. |
| Upload de catálogo | `/supplier/upload` | Envia a lista de preços do fornecedor. | O catálogo entra na comparação das carteiras ligadas a ele. |
| Pré-pedidos | `/supplier/pre-orders` | Recebe os pré-pedidos dos compradores e aprova ou rejeita. O menu marca os pendentes. | A venda para quando ele responde, não quando o comprador compara. |
| Clientes | `/supplier/clients` | Carteira de compradores. Adiciona cliente, edita ficha, filtra por estado e cidade. Aprova quem pediu para entrar. | Só compara com quem está ligado a ele. |
| Indicações | `/supplier/clients/[id]/indicacoes/[uploadId]` | Cruza o catálogo dele com uma lista de demanda daquele cliente. | Vê, na lista do comprador, onde o catálogo dele cabe. |
| Usuários | `/supplier/usuarios` | Gente da operação do representante. | A carteira não depende de uma pessoa só. |
| Configurações | `/supplier/settings` | Dados da conta. | A representação permanece identificável. |
| Notificações | `/supplier/notifications` | Avisos da operação. | Pré-pedido novo e pedido de carteira aparecem sem ele reabrir a lista. |

No painel, a fila de atenção aponta catálogos ativos, pré-pedidos aguardando resposta e solicitações de carteira. Pedido parado há mais de sete dias ganha destaque.

## O que cada um ganha, em uma frase

- **Comprador:** manda a lista, vê quem ganha em cada item e fecha o pré-pedido sem montar a planilha na mão.
- **Representante:** publica o catálogo dos fornecedores que representa, enxerga a demanda do cliente e responde o pré-pedido.

## Desenho

Isto descreve o produto logado e a landing que está no ar. Quem for desenhar a página nova usa estes tokens como o material da marca. A composição da landing pode ser mais larga que a do painel, desde que o nome, a voz e estas cores continuem reconhecíveis.

### Cor

Uma cor de destaque: o azul. Ele marca a ação principal, links e os detalhes de marca. O menor preço e o sucesso ficam verdes. O erro fica vermelho. Aviso e pendência usam um índigo separado, nunca laranja.

| Papel | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| Fundo | `#f7f8fc` | `#172a49` | Tela. |
| Texto | `#192b49` | `#f7f8fc` | Tinta. |
| Cartão | `#ffffff` | `#1e365c` | Superfície de trabalho. |
| Primária | `#245bcf` | `#245bcf` | Botão principal e marca. Texto em cima é branco. |
| Primária, hover | `#1747ab` | `#1747ab` | Hover sólido. |
| Fundo azul suave | `#eaf0ff` | `#243e6e` | Faixas e estados quietos. |
| Texto mudo | `#657187` | `#c5d0e0` | Apoio. |
| Borda | `#dce2ec` | `#314866` | Fio de cabelo. |
| Foco | `#245bcf` | `#245bcf` | Anel de 2px, com respiro do fundo. |
| Sucesso | `#1f8a65` | `#3fae86` | Aprovado e menor preço. |
| Aviso | `#3b4f86` | `#c9d4f2` | Pendente e bloqueado. |
| Erro | `#cf2d56` | `#e84a6f` | Rejeitado. |

Contraste mínimo do texto corrido: WCAG AA, 4.5:1. Branco sobre `#245bcf` permanece acima de 4.5:1.

### Tipo

- Interface: **Geist**.
- Números, preços, unidades e a fórmula da comparação: **Geist Mono**.
- Preço em `tabular-nums`, formato `R$ 44,20`.
- Título de página logada: 24px, negrito, tracking apertado.
- Nada de Inter, Roboto, Arial ou serifa de display no painel.
- `lang` da página: `pt`.

### Forma

- Raio base: `0.5rem` (8px). Cantos técnicos, não pílula.
- Sombra: deslocada e curta. Sem brilho neon, sem glow.
- Ação principal: botão azul, texto branco, altura de toque de pelo menos 44px na landing.
- Ação secundária: contorno ou ghost, mesma altura.
- Menu logado à esquerda, fundo da tela, item ativo com o azul.
- Cartões de número no painel: rótulo mudo, valor em 24px, um ícone de traço fino.
- Estado vazio, erro e carregamento existem nas telas de dados. A landing pública não precisa dos quatro, mas um botão sem destino e uma comparação sem preço são falha.

### Movimento

Entrada curta no hero e nas linhas da comparação. Quem pede menos movimento no sistema não vê a animação. Não animar posição nem tamanho. Não usar desfoque de fundo em área que rola.

### Landing que está no ar

A página pública em `/` usa a paleta azul desta seção. O menor preço do exemplo fica verde, para não depender só da cor da marca. Sublinhado, número de etapa e marcador usam o azul `#245bcf`.

Há uma direção nova já escolhida e ainda não construída: o padrão de categoria (título, frase, botão e três cartões), no capricho de produtos de referência que ainda não foram nomeados. Até essa construção, a barra visual continua sendo a mesa acima e os tokens desta página.

### O que a página nova precisa carregar

- As duas frases da seção “O que cada um ganha”.
- O laço lista → comparação lado a lado → pré-pedido, com **Criar conta** no comprador e **Entrar** no representante.
- Um exemplo de lista com preços reais de demonstração, marcado como exemplo. O menor valor se destaca em verde.
- O material desta seção: fundo `#f7f8fc`, tinta `#192b49`, azul `#245bcf`, Geist e Geist Mono.

### O que fica de fora

- Administrador como protagonista.
- Trial, preço de assinatura, percentual de economia, logo e depoimento.
- Jargão de interface: “matching”, “SKU” como título, “dashboard”.
- Três cartões idênticos só com ícone, se a direção escolhida for outra que não o padrão de categoria. No padrão de categoria, os três cartões são o próprio formato, e o conteúdo deles são os passos do laço: enviar a lista, cruzar fornecedores, fechar o pré-pedido.
