# Landing pública integrada

A rota `/` usa a landing aprovada no chat, com as informações de
`features-comprador-representante.md`. A paleta azul anterior foi restaurada
a landing a pedido do usuário, mantendo Geist, imagens, conteúdo e navegação.

## Composição

- `src/app/page.tsx`: entrada da rota e metadata específica da landing.
- `src/components/landing/landing-page.tsx`: conteúdo renderizado no servidor.
- `comparison-desk.tsx`: filtros, busca, seleção e pedido demonstrativo.
- `comparison-data.ts`: preços em centavos e exportação do exemplo em CSV.
- `landing.css`: estilos limitados ao contêiner `.compara-landing`.
- `public/landing`: duas imagens WebP locais, consumidas por `next/image`.

As fontes Geist e Geist Mono são as do layout existente. Não há iframe,
HTML externo, dependência nova, alteração de autenticação ou migração de banco.

## Navegação e limites

Todos os acessos de comprador usam `/auth/register`. Todos os acessos de
representante usam `/auth/login`, via `next/link`. Os avisos de acesso da
prévia HTML foram removidos; não é necessário configurar `APP_ORIGIN`.

A demonstração permanece ilustrativa. Ela não importa listas, não consulta
catálogos reais e não envia pedidos. A seleção afeta o total e o CSV de
exemplo. O total inicial é R$ 1.117,62; sem arroz, R$ 669,62. Os grupos são
Norte R$ 632,32 e Sul R$ 485,30.

## Verificação

- Base anterior: 243 testes e typecheck aprovados.
- Novos testes falharam antes da implementação por ausência do conteúdo,
  dos filtros e dos totais da landing aprovada.
- Resultado final: 248 testes em 27 arquivos aprovados.
- `bun run typecheck` e `bunx next build` aprovados. O build do Next.js foi
  executado diretamente para não acionar migrações no banco local.
- Biome dos arquivos alterados aprovado. `bun run lint` encontra 12 erros
  de formatação nos JSONs preexistentes de `.impeccable`.
- Navegação de cadastro/login e demonstração inspecionadas no navegador.

As alterações locais anteriores em layout, tokens globais e botão compartilhado
foram preservadas. Não foi realizado commit.

## Desenvolvimento local

Use `http://localhost:3150`. Durante a verificação, o Next.js bloqueou recursos
de desenvolvimento quando a página foi aberta por `127.0.0.1`; isso impediu a
hidratação do formulário de login. No endereço canônico `localhost`, o formulário
e a comparação interativa carregaram normalmente, sem alterar a configuração
de origens permitidas.
