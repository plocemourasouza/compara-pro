# Regras do projeto

Convenções do **Compara Pró** que valem para toda alteração de código, humana ou de agente. Este arquivo é referenciado em `AGENTS.md`.

O visual está em `DESIGN.md`. A autorização é no servidor (`src/proxy.ts`, `src/lib/auth-server.ts`). Na tela, o registro comercial se chama **Pedido** / **Pedidos**. Rotas, modelos e APIs permanecem `pre-order` / `PreOrder`.

## 1. Escopo das alterações

- Faça somente o que foi solicitado.
- Não altere outras partes do projeto por iniciativa própria.
- Não faça melhorias, refatorações, otimizações ou mudanças visuais que não foram solicitadas.
- Não altere outras páginas, componentes ou estilos sem relação direta com a tarefa.
- Preserve tudo que já funciona.
- Se identificar um problema fora do escopo, informe o problema e não corrija sem autorização.
- Uma solicitação pequena deve resultar em uma alteração pequena.
- Antes de uma alteração que alcance várias partes do sistema, explique o impacto e aguarde confirmação.

## 2. Interface e padrões visuais

- Não invente elemento ou padrão visual quando o projeto já tiver uma referência.
- A base de componente é shadcn, com os tokens de `DESIGN.md` (canvas `#f7f8fc`, tinta `#192b49`, primária `#245bcf`, Geist).
- Preço vencedor permanece verde. Erro permanece vermelho. Laranja não faz parte da identidade.
- Reutilize o shell dos painéis: sidebar fixa a partir de `lg` e menu recolhido abaixo disso.

## 3. Responsividade

A interface funciona em desktop, notebook, tablet e mobile, e também com escala de exibição de 100% e 125% e com zoom do navegador.

- Não deixar o layout quebrar nem gerar overflow horizontal fora de uma área de rolagem prevista.
- Textos se adaptam ao espaço: quebra, truncamento ou mais de uma linha. Não reduzir a fonte para caber.
- Imagens e mídias são responsivas.
- Grids usam colunas que se adaptam. Não fixar a quantidade de colunas de um jeito que quebre notebook, tablet ou mobile.
- Botões, inputs, selects e menus continuam legíveis e utilizáveis no mobile e a 125%.
- Evitar altura e largura fixas em texto, card, painel, formulário e container, salvo o shell da aplicação, que ocupa a altura da viewport (`h-dvh`) e rola por dentro.
- Preferir `rem`, `%`, `min-*`, `max-*`, `w-full`, `flex-1`, `min-w-0` e `max-w-*`.
- Não usar `w-screen` nem `100vw` dentro de um layout que já tem sidebar.
- O shell e o canvas ocupam a largura útil. `max-width` fica em formulário e texto, não na área principal.
- Não criar correção exclusiva para Full HD nem breakpoint novo. Os breakpoints do projeto são os do Tailwind já em uso (`sm`, `md`, `lg`).
- Em container `flex`, usar `flex-wrap`, `min-w-0`, `shrink` e `grow` quando o conteúdo puder estourar.
- Filtros e grupos de controles quebram linha ou empilham em tela menor.
- Tabela e lista largas rolam na própria área (`overflow-auto`), sem empurrar o restante da página.
- A sidebar dos painéis admin, comprador e representante fica visível a partir de `lg` (1024px). Abaixo disso, o menu abre por cima do conteúdo e a área principal usa a largura inteira.
- Antes de concluir uma tela alterada, conferir desktop ou notebook e uma largura mobile. Mudança estrutural de layout também passa por Full HD a 100%, largura útil perto de 1536px (Full HD a 125%) e largura perto de 1366px.

## 4. Consistência

- Componentes com o mesmo papel usam o mesmo padrão.
- Não criar solução para uma única resolução quando uma solução fluida resolve.
- Um ajuste de mobile não pode quebrar o desktop, e o inverso também vale.

## 5. Componentes

- Reutilize o que já existe. Antes de criar um componente, procure um equivalente.
- Ao alterar um componente compartilhado, veja onde ele é usado.
- Não altere um componente global para resolver uma página só sem avaliar o impacto.
- Não duplique um componente para o mesmo problema sem justificativa.

## 6. Segurança e credenciais

Não grave segredo no código nem no repositório: senha de produção, token, API key, chave privada, credencial de banco, cookie de sessão ou qualquer outro segredo.

Não coloque isso em `.js`, `.ts`, `.json`, configuração versionada, documentação, commit ou código enviado ao GitHub.

Segredo fica em variável de ambiente. `.env*` já está no `.gitignore`. Não exponha credencial em log, erro ou resposta.

A senha `demo1234` das contas de demonstração é exceção publicada de propósito no seed, no README e no `AGENTS.md`. Não é credencial de produção.

## 7. Dependências

- Não instale biblioteca sem necessidade.
- Antes de instalar, verifique se o projeto já resolve o caso.
- Não substitua uma biblioteca existente sem justificativa.

## 8. Antes e depois de alterar

Antes:

1. Entenda o que foi solicitado.
2. Identifique os arquivos necessários.
3. Verifique se esses arquivos são usados em outras partes.
4. Faça a menor alteração que atende o pedido.
5. Preserve o comportamento que está fora da tarefa.

Depois:

1. Verifique se o projeto continua funcionando.
2. Verifique erros.
3. Verifique a responsividade da parte alterada.
4. Verifique as outras telas que usam o mesmo componente.
5. Informe quais arquivos mudaram e o que foi feito.

## 9. Não fazer por conta própria

Não reorganize o projeto, não mude design, cor, fonte ou espaçamento, não altere componente global nem outras páginas, não remova funcionalidade ou arquivo, não instale dependência e não refatore código fora da tarefa.

Se algo funciona e não faz parte do pedido, preserve.

## 10. Regra principal

Faça somente o que foi solicitado, preserve o que já funciona e altere o mínimo necessário.

Se o escopo estiver em dúvida, ou se a alteração puder afetar outras partes, explique o impacto e peça confirmação.

## 11. Cada solicitação

Trate cada solicitação como tarefa isolada. Antes de executar, diga o que muda, onde muda e o que fica intacto. A tarefa termina quando o pedido está funcionando. Não continue melhorando por conta própria.

## Referências

- [README.md](./README.md) — visão geral e contas de demonstração
- [AGENTS.md](./AGENTS.md) — preferências e fatos do projeto
- [DESIGN.md](./DESIGN.md) — tokens visuais
- [PRODUCT.md](./PRODUCT.md) — contexto do produto
- [docs/features-comprador-representante.md](./docs/features-comprador-representante.md) — comprador e representante
