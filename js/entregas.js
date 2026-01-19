// ================================
// ESTADO GLOBAL
// ================================
let abaAtiva = "pendentes";
let lojaSelecionada = "Centro";
let entregas = [];

// ================================
// STORAGE
// ================================
function carregarEntregas() {
  const dados = localStorage.getItem("entregas");
  return dados ? JSON.parse(dados) : [];
}

function salvarEntregas() {
  localStorage.setItem("entregas", JSON.stringify(entregas));
}

// ================================
// FILTRO DE LOJA
// ================================
function selecionarLoja(loja, botao) {
  lojaSelecionada = loja;

  document
    .querySelectorAll(".filtros-loja button")
    .forEach(btn => btn.classList.remove("ativo"));

  botao.classList.add("ativo");

  renderizarEntregas();
}

// ================================
// TOGGLE
// ================================
function mostrarPendentes() {
  abaAtiva = "pendentes";
  atualizarToggle();
  renderizarEntregas();
}

function mostrarEntregues() {
  abaAtiva = "entregues";
  atualizarToggle();
  renderizarEntregas();
}

function mostrarCanceladas() {
  abaAtiva = "canceladas";
  atualizarToggle();
  renderizarEntregas();
}


function atualizarToggle() {
  const botoes = document.querySelectorAll(".toggle-btn");

  botoes.forEach(btn => btn.classList.remove("ativo"));

  if (abaAtiva === "pendentes") {
    botoes[0].classList.add("ativo");
  }

  if (abaAtiva === "entregues") {
    botoes[1].classList.add("ativo");
  }

  if (abaAtiva === "canceladas") {
    botoes[2].classList.add("ativo");
  }
}


// ================================
// CONTADORES
// ================================
function atualizarContadores() {
  const pendentes = entregas.filter(e => e.status === "pendente");
  const entregues = entregas.filter(e => e.status === "entregue");
  const cancelados = entregas.filter(e => e.status === "cancelado");

  const cPendentes = document.getElementById("contadorEntregas");
  const cEntregues = document.getElementById("contadorEntregues");
  const cCancelados = document.getElementById("contadorCanceladas");

  if (cPendentes) cPendentes.textContent = pendentes.length;
  if (cEntregues) cEntregues.textContent = entregues.length;
  if (cCancelados) cCancelados.textContent = cancelados.length;
}

// ================================
// RENDERIZAÇÃO
// ================================
function renderizarEntregas() {
  const lista = document.getElementById("lista-entregas");
  if (!lista) return;

  entregas = carregarEntregas();
  lista.innerHTML = "";

  const filtradas = entregas.filter(e => {
    if (e.loja !== lojaSelecionada) return false;

    if (abaAtiva === "pendentes") return e.status === "pendente";
    if (abaAtiva === "entregues") return e.status === "entregue";
    if (abaAtiva === "canceladas") return e.status === "cancelado";

    return false;
  });

  filtradas.forEach(entrega => {
    const card = document.createElement("div");
    card.className = "card";

    if (entrega.status === "entregue") card.classList.add("entregue");
    if (entrega.status === "cancelado") card.classList.add("cancelado");

    card.innerHTML = `
      <div class="status-bar"></div>
      <div class="card-content">
        <p class="destino">📍 ${entrega.endereco}</p>
        <p class="info">👤 Vendedor: ${entrega.vendedor || "-"}</p>
        <p class="info">
  💰 ${entrega.pagamentoStatus} • ${entrega.pagamentoForma}
</p>


       <div class="footer">
  <div>
    <span class="data">🕒 ${entrega.data}</span>
    ${entrega.obs ? `<p class="obs">📝 ${entrega.obs}</p>` : ""}
  </div>

  <div class="acoes">
    <button class="btn-entregue" onclick="marcarEntregue(${entrega.id})">✔ Entregue</button>
    <button class="btn-cancelar" onclick="cancelarEntrega(${entrega.id})">✖ Cancelar</button>
  </div>
</div>
      </div>
    `;

    lista.appendChild(card);
  });

  atualizarContadores();
}

// ================================
// AÇÕES
// ================================
function marcarEntregue(id) {
  if (!confirm("Confirmar entrega como ENTREGUE?")) return;

  const entrega = entregas.find(e => e.id === id);
  if (!entrega) return;

  entrega.status = "entregue";
  salvarEntregas();
  renderizarEntregas();
}

function cancelarEntrega(id) {
  if (!confirm("Deseja CANCELAR esta entrega?")) return;

  const entrega = entregas.find(e => e.id === id);
  if (!entrega) return;

  entrega.status = "cancelado";
  salvarEntregas();
  renderizarEntregas();
}

function irParaNovaEntrega() {
  window.location.href = "nova-entrega.html";
}

// ================================
// INICIAL
// ================================
document.addEventListener("DOMContentLoaded", renderizarEntregas);
