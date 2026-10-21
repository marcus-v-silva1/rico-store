# Identidade visual — Rico Store

Extraída do layout "Rico Store / Site" (PDF). Todos os valores são tokens em `src/app/globals.css`.

## Conceito

Rua, concreto e contraste. Preto profundo nas vitrines, cinza-concreto claro onde se vende, tipografia larga em itálico que parece em movimento. Tudo de canto reto: sem cantos arredondados, sombras ou gradientes decorativos.

## Cores

| Token      | Hex       | Uso                                                          |
| ---------- | --------- | ------------------------------------------------------------ |
| `ink`      | `#0f0f0f` | Cabeçalho, hero, lookbook, marcas, rodapé; texto sobre claro |
| `graphite` | `#1a1a1a` | Cartões e fotos provisórias sobre o preto                    |
| `smoke`    | `#2a2a2a` | Linhas e bordas sobre o preto                                |
| `paper`    | `#e5e4e0` | Fundo das seções de venda                                    |
| `concrete` | `#d8d7d2` | Base das peças e dos cartões de categoria                    |
| `bone`     | `#f6f5f1` | Texto sobre o preto; o "branco" da marca                     |
| `stone`    | `#75746f` | Texto secundário sobre claro                                 |
| `olive`    | `#5b6240` | Apoio (calça cargo); confirmações                            |
| `signal`   | `#d6262c` | Erro e promoção. Use pouco                                   |

Cores das peças: tabela `colors` no banco, cadastradas em `/admin/cores`. As iniciais são preto, branco, cinza, oliva, vinho e azul.

## Tipografia

- **Archivo** (Google Fonts, eixo de largura) — texto e títulos. Texto em largura 100; títulos em largura 125.
  - `.display`: largura 125, peso 800, itálico, caixa alta. Logo, "STREET" e títulos de página.
  - `.outline-text`: mesmo estilo, só contorno. Palavras secundárias do hero.
  - `.heading`: largura 125, peso 800, reto. Títulos de seção.
- **JetBrains Mono** — rótulos técnicos em caixa alta e espaçados (`.label`): "STREETWEAR / ORIGINAL VIBE".
- **Reenie Beanie** — manuscrito (`.script`), só em frases de efeito: "Same clothes, different stories." e "Seu look aqui."

## Logotipo

`RICO` em `.display`, com `STORE` miúdo, em mono e muito espaçado, logo abaixo. Componente `Logo` (`src/components/brand.tsx`). Sempre bone sobre ink, ou ink sobre paper.

## Componentes

- **Botões**: retos, borda de 1px, texto semibold. `light` e `ghost` sobre preto; `dark` e `outline` sobre claro.
- **Cartão de produto**: peça sobre `concrete` em proporção 4:5, etiqueta "Novo" preta, nome e preço na mesma linha, bolinhas de cor e botão "Adicionar".
- **Campos**: borda preta de 1px, sem arredondar, rótulo em `.label`.

## Movimento

Bibliotecas: **motion** (animações), **Lenis** (rolagem suave) e **Embla** (carrossel). Tudo respeita `prefers-reduced-motion`: sem movimento, a página cai na rolagem nativa e nos trilhos de arrastar.

**O gesto da marca é o corte inclinado**, no ângulo do itálico da Archivo (~12°), sempre na horizontal. Ele aparece em três lugares e só neles, para continuar forte: a troca de páginas, os títulos de seção da home e as fotos do hero. O resto da página fica quieto.

- **Troca de páginas** (View Transitions do React 19.3): a página nova entra por um corte inclinado. Indo para frente, o corte corre da direita para a esquerda; voltando, ao contrário. A página antiga recua um pouco e escurece por baixo. O cabeçalho fica parado e o rodapé desliza até o lugar novo. CSS em `globals.css`.
- **Hero**: as linhas do título entram da esquerda deitadas e se endireitam no itálico; uma faixa clara inclinada atravessa cada foto e a revela (`Wipe`). Ao rolar, os dois quadros andam em sentidos opostos (parallax).
- **Lookbook fixado**: no computador, a seção prende na tela e a rolagem vertical vira deslocamento horizontal, com barra de progresso. No celular vira trilho de arrastar.
- **Novidades**: carrossel de arrastar com setas e barra de progresso.
- **Marcas na loja**: carrossel infinito com duas fileiras em sentidos opostos (a de baixo só contorno); acelera com a rolagem, inverte ao rolar para cima e pausa com o mouse em cima.
- **Cabeçalho**: some ao rolar para baixo e volta ao rolar para cima.
- **Sacola**: gaveta que entra pela direita; abre ao adicionar uma peça.
- **Títulos de seção**: uma faixa preta inclinada cobre o título e sai pela direita, deixando-o à mostra (`Wipe`). Cards e textos não animam ao entrar. A frase "Same clothes, different stories." é escrita letra por letra ao aparecer (`Typewriter`).
- Cards fazem um zoom leve ao passar o mouse.

## Fotografia

O layout usa fotos de rua em tom escuro e dessaturado: corpo inteiro ou de costas, muito concreto, pouca cor. Espaço sem foto mostra um quadro provisório (`Photo`).

**Fotos de produto** são enviadas pelo painel: abra o produto em `/admin/produtos/<id>` (salve antes, se for novo) e use "Enviar fotos" no bloco Fotos. Aceita JPEG, PNG ou WebP até 5 MB; prefira fotos em pé, na proporção 4:5, que é o formato do card. A primeira foto da lista é a capa na vitrine: arraste ou use as setas para mudar a ordem. Marque a cor quando a foto mostrar uma cor específica (o card troca a foto quando o cliente escolhe a cor) e escreva o texto alternativo descrevendo a peça na foto. Sem foto, o produto não pode ser publicado como "Ativo".

**Fotos do hero e de outros espaços fixos do layout** continuam em `public/images/`: coloque a imagem lá e passe `src` ao `<Photo>`.
