// Deprecado: a lista de pré-pedidos do cliente agora vive em
// src/app/client/pre-orders/ (rota App Router real, com DataTable + modal de
// detalhe, seguindo o padrão de listas). Este arquivo solto não é uma rota
// (App Router só serve `page.tsx`) e era código morto usando o Pages Router
// (`next/router`) + endpoint inexistente. Mantido apenas como re-export para
// remover o código quebrado; pode ser removido com `git rm`.
export { default } from "./pre-orders/pre-orders-client";
