# Em Defesa da Democracia — jogo de cartas das eleições 2026

Abra `index.html` no navegador. Não precisa instalar nada.

## Estrutura

```
index.html             estrutura da página
css/estilo.css         cores e layout
js/jogo.js             lógica do jogo
dados/fontes.js        links das fontes citadas
dados/propostas.js     cartas do modo Propostas
dados/informacoes.js   cartas do modo Informações (verdadeiro ou falso)
scripts/verificar.js   confere os dados antes de publicar
```

## Como adicionar uma carta

1. Se a fonte for nova, acrescente em `dados/fontes.js`:
   `chave: { titulo: "Aos Fatos – ...", url: "https://..." },`
2. Acrescente a carta em `dados/informacoes.js` (ou `propostas.js`). Os campos estão explicados no topo de cada arquivo.
3. Rode `node scripts/verificar.js`. Ele avisa se faltar campo, se a fonte não existir ou se houver texto repetido, e mostra a contagem de verdadeiras e falsas.

## Regras de conteúdo

- Toda carta precisa de fonte com link e de uma nota que explique a resposta.
- Citações (`tipo: "fala"`) devem ser literais. Se a fonte não traz a frase exata, use `tipo: "fato"`.
- Acusações ainda em investigação devem dizer que a investigação segue em andamento e que a pessoa nega, quando for o caso.
