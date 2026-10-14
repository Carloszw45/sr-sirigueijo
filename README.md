# Sr Sirigueijo

Catálogo estático responsivo com carrinho local, categorias, busca, favoritos, observações por item, retirada/entrega desejada e resumo de pedido. Site demonstrativo publicado no GitHub Pages; o WhatsApp e o cardápio oficial ainda precisam ser confirmados.

Site: https://carloszw45.github.io/sr-sirigueijo/

O layout foi adaptado à referência visual enviada: fundo creme, banners em vermelho escuro, títulos condensados, cards claros em **três colunas no celular**, botões circulares vermelhos e navegação inferior com pedido central. A página inicial apresenta três destaques; “Ver todos”, busca e categorias abrem o catálogo completo. Os favoritos e o carrinho são salvos no próprio navegador. Os quatro banners podem ser alternados pelos pontos ou por gesto horizontal.

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

## Fotografias e fontes

As imagens em uso são ilustrativas, geradas com ImageGen; não são fotos dos produtos reais. Foram exportadas com transparência e otimizadas em WebP, preservando o canal alfa. Produtos têm no máximo 600 px; o combo tem no máximo 1000 × 800 px. Prompts base:

- `cutout-burger-v2.webp`: fotografia publicitária de um hambúrguer artesanal único, pão de gergelim, carne, queijo e salada; vista frontal em três quartos, objeto completo, luz de estúdio, sem texto ou marcas, fundo transparente.
- `cutout-double-v2.webp`: a mesma direção fotográfica, com exatamente duas carnes e duas camadas de queijo, sem elementos adicionais, fundo transparente.
- `cutout-fries-v2.webp`: batatas douradas em embalagem vermelha lisa, vista frontal em três quartos, objeto completo, sem marcas, fundo transparente.
- `cutout-drink-v2.webp`: copo transparente de refrigerante escuro com gelo e tampa, sem marcas, objeto isolado em fundo transparente.
- `cutout-combo-v2.webp`: composição publicitária com hambúrguer à frente, embalagem vermelha de batatas e copo de refrigerante atrás, vista em três quartos, objetos completos, sem marcas ou texto, fundo transparente. A transparência foi refinada com edição do próprio ImageGen.

Fonte dos títulos e marca tipográfica: Barlow Condensed. Interface: Inter, com arquivos locais regular e negrito. As licenças ficam em `assets/OFL-Barlow-Condensed.txt` e `assets/OFL-Inter.txt`. O layout respeita `prefers-reduced-motion`.

Os arquivos antigos abaixo permanecem no histórico do projeto, mas não são usados no novo catálogo:

Arquivos WebP derivados de imagens Unsplash:

- `hero.webp`: https://images.unsplash.com/photo-1550547660-d9450f859349
- `classic.webp`: https://images.unsplash.com/photo-1568901346375-23c9450c58cd
- `double.webp`: https://images.unsplash.com/photo-1561758033-d89a9ad46330
- `fries.webp`: https://images.unsplash.com/photo-1573080496219-bb080dd4f877
- `drink.webp`: https://images.unsplash.com/photo-1622483767028-3f66f32aef97

## Verificação

Executar `node checks.cjs` para validar regras do carrinho, preços desconhecidos, sanitização de dados, mensagem do pedido e destino do WhatsApp. Não há dependências de build.

`preview.html` permite revisar a página publicada em larguras de 320, 360, 390 e 430 px e em desktop. Essa página de revisão não faz parte da navegação dos clientes. A validação também cobre busca, categorias, favoritos, quantidades, observações, resumo do pedido e persistência do carrinho.
