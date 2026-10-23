// Confere os dados do jogo antes de publicar.
// Uso: node scripts/verificar.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const raiz = path.join(__dirname, "..");
const ler = arquivo => fs.readFileSync(path.join(raiz, arquivo), "utf8");

// os arquivos de dados são scripts comuns (const ...), então rodamos juntos e lemos o resultado
const { FONTES, PROPOSTAS, INFORMACOES } = vm.runInNewContext(
  ["dados/fontes.js", "dados/propostas.js", "dados/informacoes.js"].map(ler).join("\n")
  + "\n({ FONTES, PROPOSTAS, INFORMACOES });"
);

const erros = [];
const avisos = [];
const usadas = new Set();
const textos = new Map();

const QUEM = ["lula", "flavio"];
const TIPOS = ["fala", "fato", "rede"];
const RESPOSTAS = ["verdadeiro", "falso"];

function conferir(modo, cartas, obrigatorios) {
  cartas.forEach((c, i) => {
    const id = `${modo} #${i + 1} (${String(c.texto).slice(0, 40)}…)`;
    obrigatorios.forEach(campo => { if (!c[campo]) erros.push(`${id}: falta o campo "${campo}"`); });
    if (!QUEM.includes(c.quem)) erros.push(`${id}: "quem" deve ser lula ou flavio`);
    if (c.fonte) {
      usadas.add(c.fonte);
      const f = FONTES[c.fonte];
      if (!f) erros.push(`${id}: fonte "${c.fonte}" não existe em dados/fontes.js`);
      else if (!/^https?:\/\//.test(f.url)) erros.push(`${id}: fonte "${c.fonte}" sem URL válida`);
    }
    if (modo === "informacoes") {
      if (!TIPOS.includes(c.tipo)) erros.push(`${id}: "tipo" deve ser ${TIPOS.join(", ")}`);
      if (!RESPOSTAS.includes(c.resposta)) erros.push(`${id}: "resposta" deve ser verdadeiro ou falso`);
    }
    if (textos.has(c.texto)) avisos.push(`${id}: texto repetido (${textos.get(c.texto)})`);
    textos.set(c.texto, id);
  });
}

conferir("propostas", PROPOSTAS, ["quem", "tema", "texto", "fonte"]);
conferir("informacoes", INFORMACOES, ["quem", "tipo", "contexto", "texto", "resposta", "nota", "fonte"]);

Object.keys(FONTES).filter(k => !usadas.has(k)).forEach(k => avisos.push(`fonte "${k}" não é usada por nenhuma carta`));

const contar = (cartas, filtro) => cartas.filter(filtro).length;
console.log(`Propostas: ${PROPOSTAS.length} (Lula ${contar(PROPOSTAS, c => c.quem === "lula")}, Flávio ${contar(PROPOSTAS, c => c.quem === "flavio")})`);
console.log(`Informações: ${INFORMACOES.length} (verdadeiras ${contar(INFORMACOES, c => c.resposta === "verdadeiro")}, falsas ${contar(INFORMACOES, c => c.resposta === "falso")})`);
for (const quem of QUEM) {
  const c = INFORMACOES.filter(x => x.quem === quem);
  console.log(`  ${quem}: ${contar(c, x => x.resposta === "verdadeiro")} verdadeiras, ${contar(c, x => x.resposta === "falso")} falsas`);
}

avisos.forEach(a => console.warn("AVISO:", a));
erros.forEach(e => console.error("ERRO:", e));
if (erros.length) { console.error(`\n${erros.length} erro(s). Corrija antes de publicar.`); process.exit(1); }
console.log("\nTudo certo.");
