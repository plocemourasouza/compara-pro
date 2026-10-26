# Modelo visual das telas de acesso

Implementado após aprovação da prévia fotográfica no chat, em 26/10/2026.

- `/auth/login`, `/auth/register` e `/auth/primeiro-acesso` compartilham
  `src/app/auth/layout.tsx` e `src/components/auth/auth-screen.module.css`.
- `AuthPanel` apresenta título, descrição e formulário. Não contém regras
  de autenticação. As Server Actions, validações, estados e redirecionamentos
  anteriores foram preservados nos três formulários.
- `public/auth/fundo-acesso.webp` contém a fotografia aprovada: compradora e
  representante conferindo um pedido. Tem 1672 × 941 pixels e 70.416 bytes.
  É decorativa e usa `next/image`.
- A composição usa azul, Geist e cartão branco. Em telas pequenas, o formulário
  aparece antes do texto de apresentação, com rolagem vertical normal.
- As abas e os avisos de demonstração pertencem apenas à prévia. Não foram
  transportados para a aplicação.
- O cadastro não exibe mais a antiga promessa de economia média de 30% nem
  a afirmação de fornecedores verificados, ausentes do modelo aprovado.

## Verificação

- Base antes da alteração: 262 testes em 30 arquivos aprovados.
- Suíte completa, typecheck e build Next.js aprovados após a implementação.
  Foi usado `bunx next build`, sem acionar o script que executa migrações.
- Biome dos arquivos de autenticação aprovado. O lint global já apresentava
  12 erros de formatação em `.impeccable` e no teste da landing.
- As três telas foram inspecionadas no navegador; navegação, obrigatoriedade
  de campos e preenchimento das seis posições do código foram conferidos.
- Em 390px, as três páginas não apresentaram rolagem horizontal; o cadastro
  também foi conferido em 320px. Campos móveis têm fonte de 16px e a ação
  principal mede 47px de altura.
- Não foram criadas contas nem enviados códigos de ativação para testar o visual.
- As alterações locais fora das telas de acesso foram preservadas. Sem commit.
