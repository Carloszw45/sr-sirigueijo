# Sr Sirigueijo

Catálogo estático responsivo com carrinho local, categorias, busca, observações por item, retirada/entrega desejada e resumo de pedido. Site demonstrativo publicado no GitHub Pages; o WhatsApp e o cardápio oficial ainda precisam ser confirmados.

## Dados confirmados

- Nome público: Sr Sirigueijo.
- Instagram: https://www.instagram.com/srsirigueijo1/
- Endereço da bio: R. VP-2, 525 — Nova Contagem.
- Logo: imagem pública do perfil, fornecida pelo próprio Instagram em `og:image`.

O HTML público do perfil foi consultado em 14/10/2026. As publicações, o cardápio e o telefone não estavam disponíveis. Não foram usados contatos de empresas homônimas.

## Antes de disponibilizar para clientes

1. Substituir os seis exemplos em `data.js` pelo cardápio oficial, com ingredientes, imagens e preços confirmados. Preços são inteiros em centavos; `null` exibe **Sob consulta**, sem apresentar total falso.
2. Definir `whatsapp` com o número brasileiro verificado, no formato internacional (55 + DDD + número), e `menuVerified: true` somente após a confirmação do catálogo.
3. Atualizar as fotos ilustrativas e os avisos que dependem do cardápio confirmado. Ajustar textos sobre serviço e entrega às operações reais da loja.
4. Retirar `noindex,nofollow` e revisar descrição/metadados quando a loja aprovar a versão final e seu acesso for público.

O envio fica desabilitado quando faltam telefone válido ou catálogo confirmado. Copiar o resumo permanece disponível. A finalização abre o WhatsApp com texto preenchido; o cliente confirma o envio dentro do WhatsApp. O site não recebe pagamentos nem confirma pedidos ou entregas automaticamente.

## Fotografias ilustrativas

Arquivos WebP locais derivados destas imagens Unsplash; não são fotos dos produtos da loja:

- `hero.webp`: https://images.unsplash.com/photo-1550547660-d9450f859349
- `classic.webp`: https://images.unsplash.com/photo-1568901346375-23c9450c58cd
- `double.webp`: https://images.unsplash.com/photo-1561758033-d89a9ad46330
- `fries.webp`: https://images.unsplash.com/photo-1573080496219-bb080dd4f877
- `drink.webp`: https://images.unsplash.com/photo-1622483767028-3f66f32aef97

Fonte de títulos: Barlow Condensed, distribuída pelo Google Fonts. Interfaces e conteúdo usam fontes do sistema. O layout respeita `prefers-reduced-motion`.

## Verificação

Executar `node checks.cjs` para validar regras do carrinho, preços desconhecidos, sanitização de dados, mensagem do pedido e destino do WhatsApp. Não há dependências de build.

Neste ambiente não há plugin de controle de navegador disponível; portanto não foi feita inspeção visual de desktop/mobile em navegador. As imagens foram inspecionadas e o código e os caminhos dos assets foram verificados.
