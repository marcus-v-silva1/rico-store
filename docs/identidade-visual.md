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

Cores das peças (`COLORS` em `src/content/catalog.ts`): preto, branco, cinza, oliva, vinho e azul.

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

- **Transição horizontal entre páginas** (View Transitions do React 19.3): ir para frente empurra a página para a esquerda; voltar, para a direita. O cabeçalho fica parado.
- **Hero**: as linhas do título sobem de uma máscara e os dois quadros andam em sentidos opostos ao rolar (parallax).
- **Lookbook fixado**: no computador, a seção prende na tela e a rolagem vertical vira deslocamento horizontal, com barra de progresso. No celular vira trilho de arrastar.
- **Novidades**: carrossel de arrastar com setas e barra de progresso.
- **Faixa de marcas**: corre na horizontal, acelera com a rolagem e inverte ao rolar para cima.
- **Cabeçalho**: some ao rolar para baixo e volta ao rolar para cima.
- **Sacola**: gaveta que entra pela direita; abre ao adicionar uma peça.
- **Entrada das seções**: sobem e aparecem ao entrar na tela (`Reveal`).
- Cards fazem um zoom leve ao passar o mouse.

## Fotografia (a fazer)

O layout usa fotos de rua em tom escuro e dessaturado: corpo inteiro ou de costas, muito concreto, pouca cor. Hoje os espaços mostram um quadro provisório (`Photo`). Para trocar, coloque a imagem em `public/images/` e passe `src` ao `<Photo>`.
