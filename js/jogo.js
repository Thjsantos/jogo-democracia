// Lógica do jogo. As cartas vêm de dados/*.js (PROPOSTAS, INFORMACOES, FONTES).

const CANDIDATOS = {
  lula:   { nome: "Lula",             botao: "Lula",   classe: "a" },
  flavio: { nome: "Flávio Bolsonaro", botao: "Flávio", classe: "b" },
};
const RESPOSTAS = { verdadeiro: "Fato", falso: "Fake" };
const MODOS = { propostas: PROPOSTAS, infos: INFORMACOES };

// texto do rodapé de cada modo (muda quando o jogador escolhe o modo na tela inicial)
const RODAPES = {
  propostas: `Conteúdo baseado em reportagens e nos planos de governo registrados no TSE (out/2026). Os resumos são simplificados;
    para o texto completo dos planos, consulte o <a href="https://divulgacandcontas.tse.jus.br" target="_blank" rel="noopener">DivulgaCand/TSE</a>.
    Projeto independente, sem vínculo com candidatos, partidos ou campanhas.`,
  infos: `Conteúdo baseado em checagens da <a href="https://www.agencialupa.org" target="_blank" rel="noopener">Agência Lupa</a>,
    do <a href="https://www.aosfatos.org" target="_blank" rel="noopener">Aos Fatos</a> e do Fato ou Fake, do g1, e em reportagens.
    Os resumos são simplificados; cada carta traz o link da fonte para você conferir.
    Investigações em andamento não significam condenação. Projeto independente, sem vínculo com candidatos, partidos ou campanhas.`,
};

const $ = id => document.getElementById(id);
let baralho = [], pos = 0, acertos = 0, erros = [], travado = false, modo = "propostas";

const etiqueta = quem => `<span class="tag ${CANDIDATOS[quem].classe}">${CANDIDATOS[quem].nome}</span>`;
const ehChecagem = carta => carta.resposta !== undefined;

function mostrar(tela) {
  ["home", "game", "end"].forEach(s => $(s).classList.toggle("hidden", s !== tela));
  window.scrollTo(0, 0);
}

function embaralhar(lista) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

function comecar() {
  modo = document.querySelector("input[name=mode]:checked").value;
  const quantidade = +document.querySelector("input[name=n]:checked").value;
  const cartas = MODOS[modo];
  const deLula = embaralhar(cartas.filter(c => c.quem === "lula"));
  const deFlavio = embaralhar(cartas.filter(c => c.quem === "flavio"));

  // alterna os candidatos para equilibrar a rodada; se um lado acabar, usa o outro
  const sorteadas = [];
  while (sorteadas.length < quantidade && (deLula.length || deFlavio.length)) {
    if (deLula.length) sorteadas.push(deLula.pop());
    if (sorteadas.length < quantidade && deFlavio.length) sorteadas.push(deFlavio.pop());
  }
  baralho = embaralhar(sorteadas);
  pos = 0; acertos = 0; erros = [];
  mostrar("game");
  desenharCarta();
}

function desenharCarta() {
  travado = false;
  const carta = baralho[pos];
  const checagem = ehChecagem(carta);
  const rede = carta.tipo === "rede";
  const fala = carta.tipo === "fala";

  $("count").textContent = `Carta ${pos + 1} de ${baralho.length}`;
  $("score").textContent = `Acertos: ${acertos}`;
  $("prog").style.width = (pos / baralho.length * 100) + "%";

  // faixa em destaque com quem está falando (ou de quem trata a informação);
  // boato das redes usa faixa neutra, sem cor de candidato
  const faixa = $("who");
  faixa.className = "who " + (rede ? "net" : CANDIDATOS[carta.quem].classe);
  faixa.textContent = !checagem ? "" : rede ? "Circulou nas redes"
    : fala ? `${CANDIDATOS[carta.quem].nome} disse` : `Sobre ${CANDIDATOS[carta.quem].nome}`;
  faixa.classList.toggle("hidden", !checagem);

  $("topic").textContent = checagem ? carta.contexto : carta.tema;
  $("text").textContent = carta.texto;
  $("text").classList.toggle("quote", fala);
  $("ask").textContent = checagem ? "Identifique se a informação é fato ou fake" : "De quem é esta proposta?";

  const opcoes = checagem
    ? [["verdadeiro", RESPOSTAS.verdadeiro, "ok"], ["falso", RESPOSTAS.falso, "no"]]
    : [["lula", CANDIDATOS.lula.botao, "a"], ["flavio", CANDIDATOS.flavio.botao, "b"]];
  const caixa = $("choices");
  caixa.innerHTML = opcoes.map(([valor, rotulo, classe]) =>
    `<button class="choice ${classe}" data-c="${valor}">${rotulo}</button>`).join("");
  caixa.querySelectorAll(".choice").forEach(b => b.onclick = () => responder(b.dataset.c));

  const cartao = $("card");
  cartao.style.animation = "none"; cartao.offsetHeight; cartao.style.animation = "";
  $("carimbo").className = "carimbo hidden";
  $("fb").classList.add("hidden");
  $("next").classList.add("hidden");
}

function responder(escolha) {
  if (travado) return;
  travado = true;
  const carta = baralho[pos];
  const certa = ehChecagem(carta) ? carta.resposta : carta.quem;
  const acertou = escolha === certa;
  if (acertou) acertos++; else erros.push(carta);

  document.querySelectorAll(".choice").forEach(b => {
    b.disabled = true;
    if (b.dataset.c === escolha) b.classList.add("picked");
  });

  const fb = $("fb");
  fb.className = "feedback " + (acertou ? "ok" : "bad");

  // carimbo no cartão; recriar a classe reinicia a animação
  const carimbo = $("carimbo");
  carimbo.className = "carimbo hidden";
  carimbo.offsetHeight;
  carimbo.textContent = acertou ? "Acertou" : "Errou";
  carimbo.className = "carimbo " + (acertou ? "ok" : "no");

  if (ehChecagem(carta)) {
    const complemento = carta.tipo === "rede" ? ""
      : ` ${carta.tipo === "fala" ? "Fala de" : "Sobre"} ${etiqueta(carta.quem)}.`;
    $("fbp").innerHTML = `Classificação: <strong>${RESPOSTAS[carta.resposta]}</strong>.${complemento}`;
  } else {
    $("fbp").innerHTML = `Esta proposta é do plano de ${etiqueta(carta.quem)}.`;
  }
  $("fbn").textContent = carta.nota || "";
  $("fbn").classList.toggle("hidden", !carta.nota);

  const fonte = FONTES[carta.fonte];
  $("src").textContent = fonte.titulo;
  $("src").href = fonte.url;

  $("score").textContent = `Acertos: ${acertos}`;
  $("prog").style.width = ((pos + 1) / baralho.length * 100) + "%";
  $("next").textContent = pos === baralho.length - 1 ? "Ver resultado" : "Próxima carta";
  $("next").classList.remove("hidden");
  $("next").focus();
}

function proxima() {
  if (++pos < baralho.length) desenharCarta(); else terminar();
}

// Mensagem final por faixa de acerto: 100%; de 70% a menos de 100%; de 40% a menos de 70%; abaixo de 40%.
// Cada faixa vale a partir do "minimo" e a lista é lida do maior para o menor.
const MENSAGENS = [
  { minimo: 1,   titulo: "Você está pronto para votar!",
    texto: "Acertou tudo. Sabe separar o que é fato do que é fake." },
  { minimo: .7,  titulo: "Você está quase pronto para votar.",
    texto: "Falta pouco. Confira nas fontes o que errou." },
  { minimo: .4,  titulo: "Você ainda não está pronto para votar.",
    texto: "Vale rever as cartas que errou e ler as fontes antes de decidir." },
  { minimo: 0,   titulo: "Definitivamente, você não está pronto para votar.",
    texto: "Ou não se importa com os fatos." },
];
const mensagemDaPontuacao = proporcao => MENSAGENS.find(m => proporcao >= m.minimo);

function terminar() {
  mostrar("end");
  $("final").textContent = `${acertos}/${baralho.length}`;
  const mensagem = mensagemDaPontuacao(acertos / baralho.length);
  $("verdict").innerHTML = `<strong>${mensagem.titulo}</strong><br>${mensagem.texto}`;
  $("misses").innerHTML = erros.length
    ? "<p><strong>Para revisar:</strong></p>" + erros.map(c =>
        `<div class="miss">${etiqueta(c.quem)} ${c.texto}</div>`).join("")
    : "";
}

document.querySelectorAll("input[name=mode]").forEach(r =>
  r.onchange = () => { $("rodape").innerHTML = RODAPES[r.value]; });

$("start").onclick = comecar;
$("next").onclick = proxima;
$("again").onclick = () => mostrar("home");
addEventListener("keydown", e => {
  if ($("game").classList.contains("hidden") || travado) return;
  const tecla = +e.key; // 1 e 2 escolhem os botões na ordem
  if (tecla >= 1 && tecla <= 2) document.querySelectorAll("#choices .choice")[tecla - 1]?.click();
});
