# Lições

## Integração da landing pública

- **Pattern:** renderizar conteúdo de apresentação no servidor e manter apenas
  a comparação demonstrativa em um componente cliente.
- **Pattern:** limitar o CSS ao contêiner da landing. O diálogo em portal
  também recebe esse contêiner para herdar os tokens sem alterar outras telas.
- **Context:** rotas reais são `/auth/register` e `/auth/login`. Não carregar
  para o projeto os avisos de acesso pendente da prévia HTML.
- **Pattern:** usar `next/image` com WebP local e as fontes do layout, sem
  incorporar novamente as fontes e imagens em base64.
- **Gotcha:** testes de conteúdo isolam o CSS importado; o carregamento de
  PostCSS da aplicação não é necessário nesse contrato de teste.
- **Accessibility:** manter acesso por teclado à tabela com rolagem horizontal
  e usar o diálogo compartilhado para foco, Escape e fechamento.
- **Verification:** 248 testes aprovados, typecheck e build Next.js concluídos.
  Lint dos arquivos alterados limpo; lint global aponta JSONs de `.impeccable`.
- **Gotcha:** abrir o Next.js de desenvolvimento por `127.0.0.1` bloqueou HMR
  e fontes pela validação de origem. Usar `http://localhost:3150`, o endereço
  canônico do servidor, restaurou a hidratação sem mudar `allowedDevOrigins`.

- **Context:** a landing usa a paleta azul aprovada no chat, com Geist e Geist
  Mono. Seus tokens são locais; a identidade global da aplicação não é alterada.

## Telas de acesso

- **Pattern:** o layout de `/auth` compartilha fotografia, marca e composição;
  os formulários mantêm seus próprios estados, validações e Server Actions.
- **Context:** login, cadastro e ativação usam o modelo fotográfico azul aprovado.
  O cadastro apresenta a próxima lista de compras, sem promessas de economia.
- **Accessibility:** associar o código de ativação ao `id` do InputOTP; manter
  seis posições visíveis, foco azul e campos de 16px no celular.
- **Performance:** a imagem aprovada foi convertida para WebP de aproximadamente
  70 KB e é servida localmente com `next/image`.
