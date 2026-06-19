// ================================
// ESTADO GLOBAL
// ================================
let lojaSelecionada = "Centro";
let entregas = [];

// ================================
// STORAGE
// ================================
function carregarEntregas() {
  const dados = localStorage.getItem("entregas");

  try {
    const entregasSalvas = dados ? JSON.parse(dados) : [];
    return entregasSalvas.map(normalizarEntrega);
  } catch {
    localStorage.removeItem("entregas");
    return [];
  }
}

function salvarEntregas() {
  localStorage.setItem("entregas", JSON.stringify(entregas));
}

function obterNomeUsuarioLogado() {
  const usuarioLogado = obterUsuarioLogado();
  return usuarioLogado?.nome || usuarioLogado?.usuario || "Usuário não identificado";
}

function criarRegistroHistorico(acao) {
  const agora = new Date();

  return {
    acao,
    usuario: obterNomeUsuarioLogado(),
    data: agora.toLocaleDateString("pt-BR"),
    hora: agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    }),
    criadoEm: agora.toISOString()
  };
}

function adicionarHistorico(entrega, acao) {
  if (!Array.isArray(entrega.historico)) {
    entrega.historico = [];
  }

  entrega.historico.push(criarRegistroHistorico(acao));
}

function normalizarEntrega(entrega) {
  const dataHoraLegada = entrega.data || entrega.dataHora || entrega.criadoEm || "";
  const dataCriacao = entrega.dataCriacao || entrega.criadoEm ? new Date(entrega.dataCriacao || entrega.criadoEm) : null;
  const partesDataHora = typeof dataHoraLegada === "string" ? dataHoraLegada.split(",") : [];
  const dataLegada = partesDataHora[0]?.trim() || dataHoraLegada;
  const horaLegada = partesDataHora[1]?.trim()?.slice(0, 5) || "";
  const latitude = Number(String(entrega.latitude ?? "").replace(",", "."));
  const longitude = Number(String(entrega.longitude ?? "").replace(",", "."));

  return {
    ...entrega,
    id: entrega.id || Date.now(),
    cliente: entrega.cliente || entrega.destino || entrega.endereco || "-",
    telefone: entrega.telefone || entrega.celular || "",
    entregadorId: entrega.entregadorId || null,
    entregadorNome: entrega.entregadorNome || entrega.entregador || entrega.motoboy || "",
    entregadorTelefone: entrega.entregadorTelefone || "",
    entregadorVeiculo: entrega.entregadorVeiculo || "",
    entregadorPlaca: entrega.entregadorPlaca || "",
    vendedor: entrega.vendedor || entrega.nomeVendedor || entrega.usuario || "-",
    endereco: entrega.endereco || entrega.destino || entrega.cliente || "-",
    pagamentoStatus: entrega.pagamentoStatus || entrega.pagamento || entrega.statusPagamento || "-",
    pagamentoForma: entrega.pagamentoForma || entrega.formaPagamento || entrega.tipoPagamento || "-",
    criadoPorUsuario: entrega.criadoPorUsuario || entrega.usuarioCriacao || entrega.vendedor || "",
    criadoPorPerfil: entrega.criadoPorPerfil || "",
    dataCriacao: entrega.dataCriacao || entrega.criadoEm || "",
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    data: dataCriacao && !Number.isNaN(dataCriacao.getTime()) ? dataCriacao.toLocaleDateString("pt-BR") : dataLegada,
    hora: entrega.hora || horaLegada || (dataCriacao && !Number.isNaN(dataCriacao.getTime()) ? dataCriacao.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    }) : ""),
    status: normalizarStatus(entrega.status),
    historico: Array.isArray(entrega.historico) ? entrega.historico : [],
    comprovante: entrega.comprovante || null,
    cancelamento: entrega.cancelamento || null
  };
}

function entregaTemLocalizacao(entrega) {
  return Number.isFinite(entrega.latitude) && Number.isFinite(entrega.longitude);
}

function normalizarStatus(status) {
  const valor = String(status || "pendente").toLowerCase();

  if (valor === "entregue") return "entregue";
  if (valor === "cancelado" || valor === "cancelada") return "cancelada";
  if (valor === "em rota" || valor === "em-rota") return "em-rota";

  return "pendente";
}

function nomeStatus(status) {
  const nomes = {
    "pendente": "Pendente",
    "em-rota": "Em rota",
    "entregue": "Entregue",
    "cancelada": "Cancelada"
  };

  return nomes[status] || "Pendente";
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
// CONTADORES
// ================================
function atualizarContadores() {
  const entregasDaLoja = entregas.filter(e => e.loja === lojaSelecionada);
  const pendentes = entregasDaLoja.filter(e => e.status === "pendente");
  const emRota = entregasDaLoja.filter(e => e.status === "em-rota");
  const entregues = entregasDaLoja.filter(e => e.status === "entregue");
  const canceladas = entregasDaLoja.filter(e => e.status === "cancelada");

  const cPendentes = document.getElementById("contadorPendentes");
  const cEmRota = document.getElementById("contadorEmRota");
  const cEntregues = document.getElementById("contadorEntregues");
  const cCanceladas = document.getElementById("contadorCanceladas");

  if (cPendentes) cPendentes.textContent = pendentes.length;
  if (cEmRota) cEmRota.textContent = emRota.length;
  if (cEntregues) cEntregues.textContent = entregues.length;
  if (cCanceladas) cCanceladas.textContent = canceladas.length;
}

function obterFiltros() {
  const campoPesquisa = document.getElementById("campoPesquisa");
  const filtroStatus = document.getElementById("filtroStatus");

  return {
    pesquisa: (campoPesquisa?.value || "").trim().toLowerCase(),
    status: filtroStatus?.value || "todos"
  };
}

function entregaCombinaComPesquisa(entrega, pesquisa) {
  if (!pesquisa) return true;

  const texto = [
    entrega.cliente,
    entrega.endereco,
    entrega.telefone
  ].join(" ").toLowerCase();

  return texto.includes(pesquisa);
}

function usuarioPodeVerEntrega(entrega) {
  const usuarioLogado = obterUsuarioLogado();
  const perfil = obterPerfilUsuario(usuarioLogado);

  if (perfil === "administrador") return true;

  if (perfil === "vendedor") {
    return entregaFoiCriadaPeloUsuario(entrega, usuarioLogado);
  }

  return false;
}

// ================================
// RENDERIZAÇÃO
// ================================
function renderizarEntregas() {
  const lista = document.getElementById("lista-entregas");
  if (!lista) return;

  entregas = carregarEntregas();
  lista.innerHTML = "";
  atualizarContadores();
  const filtros = obterFiltros();

  const filtradas = entregas.filter(e => {
    if (!usuarioPodeVerEntrega(e)) return false;
    if (e.loja !== lojaSelecionada) return false;
    if (filtros.status !== "todos" && e.status !== filtros.status) return false;

    return entregaCombinaComPesquisa(e, filtros.pesquisa);
  });

  if (filtradas.length === 0) {
    lista.innerHTML = `<p class="lista-vazia">Nenhuma entrega encontrada.</p>`;
    return;
  }

  filtradas.forEach(entrega => {
    const podeAlterarStatus = podeAlterarStatusEntrega(entrega);
    const podeEditar = podeEditarEntrega(entrega);
    const podeExcluir = podeExcluirEntrega();
    const card = document.createElement("div");
    card.className = "card";

    card.classList.add(entrega.status);

    card.innerHTML = `
      <div class="status-bar"></div>
      <div class="card-content">
        <div class="card-header">
          <p class="destino">📍 ${entrega.cliente}</p>
          <span class="status-text">${nomeStatus(entrega.status)}</span>
        </div>
        <p class="info">Endereço: ${entrega.endereco}</p>
        ${entrega.telefone ? `<p class="info">Telefone: ${entrega.telefone}</p>` : ""}
        <p class="info">🏍 Entregador: ${entrega.entregadorNome || "Não atribuído"}</p>
        ${entrega.entregadorVeiculo ? `<p class="info">Veículo: ${entrega.entregadorVeiculo}${entrega.entregadorPlaca ? ` • ${entrega.entregadorPlaca}` : ""}</p>` : ""}
        ${entregaTemLocalizacao(entrega) ? `<p class="info">📌 Lat: ${entrega.latitude.toFixed(6)} | Long: ${entrega.longitude.toFixed(6)}</p>` : ""}
        <p class="info">👤 Vendedor: ${entrega.vendedor}</p>
        <p class="info">💰 ${entrega.pagamentoStatus} • ${entrega.pagamentoForma}</p>

        <div class="footer">
          <div>
            <span class="data">🕒 ${entrega.data}${entrega.hora ? ` às ${entrega.hora}` : ""}</span>
            ${entrega.obs ? `<p class="obs">📝 ${entrega.obs}</p>` : ""}
          </div>

          <div class="acoes">
            ${podeAlterarStatus && entrega.status === "pendente" ? `<button class="btn-rota" onclick="marcarEmRota(${entrega.id})">Em rota</button>` : ""}
            ${podeAlterarStatus && entrega.status !== "entregue" && entrega.status !== "cancelada" ? `<button class="btn-entregue" onclick="marcarEntregue(${entrega.id})">Entregue</button>` : ""}
            ${podeAlterarStatus && entrega.status !== "cancelada" && entrega.status !== "entregue" ? `<button class="btn-cancelar" onclick="cancelarEntrega(${entrega.id})">Cancelar</button>` : ""}
            ${podeEditar ? `<button class="btn-editar" onclick="editarEntrega(${entrega.id})">Editar</button>` : ""}
            <button class="btn-historico" onclick="verHistorico(${entrega.id})">Ver histórico</button>
            ${entrega.status === "entregue" && entrega.comprovante ? `<button class="btn-comprovante" onclick="verComprovante(${entrega.id})">Ver comprovante</button>` : ""}
            ${podeExcluir ? `<button class="btn-excluir" onclick="excluirEntrega(${entrega.id})">Excluir</button>` : ""}
          </div>
        </div>
      </div>
    `;

    lista.appendChild(card);
  });

}

// ================================
// AÇÕES
// ================================
function atualizarStatusEntrega(id, status) {
  entregas = carregarEntregas();
  const entrega = entregas.find(e => e.id === id);
  if (!entrega) return;
  if (!podeAlterarStatusEntrega(entrega)) {
    alertarSemPermissao();
    return;
  }

  entrega.status = status;
  adicionarHistorico(entrega, `Status alterado para ${nomeStatus(status)}`);
  salvarEntregas();
  window.registrarNotificacoesEntrega?.(
    "status",
    `Status da entrega de ${entrega.cliente} alterado para ${nomeStatus(status)}.`,
    entrega
  );
  renderizarEntregas();
}

function marcarEmRota(id) {
  atualizarStatusEntrega(id, "em-rota");
}

function marcarEntregue(id) {
  if (!confirm("Confirmar entrega como ENTREGUE?")) return;
  atualizarStatusEntrega(id, "entregue");
}

function cancelarEntrega(id) {
  const entrega = carregarEntregas().find(e => e.id === id);
  if (!entrega) return;
  if (!podeAlterarStatusEntrega(entrega)) {
    alertarSemPermissao();
    return;
  }

  const modal = document.getElementById("modalCancelamento");
  const inputId = document.getElementById("entregaCancelamentoId");
  const form = document.getElementById("formCancelamento");
  if (!modal || !inputId || !form) return;

  form.reset();
  inputId.value = id;
  modal.classList.add("ativo");
}

function excluirEntrega(id) {
  if (!podeExcluirEntrega()) {
    alertarSemPermissao();
    return;
  }

  if (!confirm("Deseja excluir esta entrega? Essa ação não pode ser desfeita.")) return;

  entregas = carregarEntregas().filter(e => e.id !== id);
  salvarEntregas();
  renderizarEntregas();
}

function editarEntrega(id) {
  entregas = carregarEntregas();
  const entrega = entregas.find(e => e.id === id);
  if (!entrega) return;
  if (!podeEditarEntrega(entrega)) {
    alertarSemPermissao();
    return;
  }

  const cliente = prompt("Cliente ou destino:", entrega.cliente);
  if (cliente === null) return;

  const endereco = prompt("Endereço:", entrega.endereco);
  if (endereco === null) return;

  const telefone = prompt("Telefone:", entrega.telefone || "");
  if (telefone === null) return;

  const vendedor = prompt("Vendedor:", entrega.vendedor);
  if (vendedor === null) return;

  const entregadorNome = prompt("Entregador responsável:", entrega.entregadorNome || "");
  if (entregadorNome === null) return;

  const pagamentoForma = prompt("Forma de pagamento:", entrega.pagamentoForma);
  if (pagamentoForma === null) return;

  const pagamentoStatus = prompt("Status do pagamento:", entrega.pagamentoStatus);
  if (pagamentoStatus === null) return;

  entrega.cliente = cliente.trim() || entrega.cliente;
  entrega.endereco = endereco.trim() || entrega.endereco;
  entrega.telefone = telefone.trim();
  entrega.vendedor = vendedor.trim() || entrega.vendedor;
  entrega.entregadorNome = entregadorNome.trim();
  entrega.pagamentoForma = pagamentoForma.trim() || entrega.pagamentoForma;
  entrega.formaPagamento = entrega.pagamentoForma;
  entrega.pagamentoStatus = pagamentoStatus.trim() || entrega.pagamentoStatus;
  adicionarHistorico(entrega, "Entrega editada");

  salvarEntregas();
  renderizarEntregas();
}

function verHistorico(id) {
  const modal = document.getElementById("modalHistorico");
  const conteudo = document.getElementById("conteudoHistorico");
  const entrega = carregarEntregas().find(e => e.id === id);
  if (!modal || !conteudo || !entrega) return;

  const historico = Array.isArray(entrega.historico) ? entrega.historico : [];

  if (historico.length === 0) {
    conteudo.innerHTML = `<p class="lista-vazia">Esta entrega ainda não possui histórico registrado.</p>`;
  } else {
    conteudo.innerHTML = historico.map(item => `
      <div class="historico-item">
        <strong>${item.data || "-"} ${item.hora ? `às ${item.hora}` : ""}</strong>
        <p>${item.acao || "-"}</p>
        <span>Usuário: ${item.usuario || "Usuário não identificado"}</span>
      </div>
    `).join("");
  }

  modal.classList.add("ativo");
}

function fecharHistorico() {
  const modal = document.getElementById("modalHistorico");
  if (modal) modal.classList.remove("ativo");
}

function verComprovante(id) {
  const modal = document.getElementById("modalComprovante");
  const conteudo = document.getElementById("conteudoComprovante");
  const entrega = carregarEntregas().find(e => e.id === id);
  if (!modal || !conteudo || !entrega?.comprovante) return;

  conteudo.innerHTML = `
    <div class="comprovante-view">
      ${entrega.comprovante.imagem ? `<img src="${entrega.comprovante.imagem}" alt="Comprovante da entrega">` : `<p><strong>Foto:</strong> Não enviada.</p>`}
      <p><strong>Observação:</strong> ${entrega.comprovante.observacao || "-"}</p>
      <p><strong>Recebedor:</strong> ${entrega.comprovante.nomeRecebedor || "-"}</p>
      ${entrega.comprovante.assinatura ? `<p><strong>Assinatura digital:</strong></p><img class="assinatura-img" src="${entrega.comprovante.assinatura}" alt="Assinatura digital">` : `<p><strong>Assinatura digital:</strong> Não registrada.</p>`}
      <p><strong>Data/hora:</strong> ${entrega.comprovante.dataHora || "-"}</p>
      <p><strong>Usuário:</strong> ${entrega.comprovante.usuario || "Usuário não identificado"}</p>
    </div>
  `;

  modal.classList.add("ativo");
}

function fecharComprovante() {
  const modal = document.getElementById("modalComprovante");
  if (modal) modal.classList.remove("ativo");
}

function fecharModalCancelamento() {
  const modal = document.getElementById("modalCancelamento");
  const form = document.getElementById("formCancelamento");

  if (form) form.reset();
  if (modal) modal.classList.remove("ativo");
}

function confirmarCancelamento(event) {
  event.preventDefault();

  const id = Number(document.getElementById("entregaCancelamentoId").value);
  const motivo = document.getElementById("motivoCancelamento").value.trim();

  if (!motivo) {
    alert("Informe uma justificativa para cancelar a entrega.");
    return;
  }

  entregas = carregarEntregas();
  const entrega = entregas.find(e => e.id === id);
  if (!entrega) return;
  if (!podeAlterarStatusEntrega(entrega)) {
    alertarSemPermissao();
    return;
  }

  entrega.status = "cancelada";
  entrega.cancelamento = {
    motivo,
    dataHora: new Date().toLocaleString("pt-BR"),
    usuario: obterNomeUsuarioLogado()
  };
  adicionarHistorico(entrega, `Entrega cancelada. Motivo: ${motivo}`);
  salvarEntregas();
  window.registrarNotificacoesEntrega?.(
    "status",
    `Entrega de ${entrega.cliente} cancelada. Motivo: ${motivo}.`,
    entrega
  );
  fecharModalCancelamento();
  renderizarEntregas();
}

function irParaNovaEntrega() {
  window.location.href = "nova-entrega.html";
}

// ================================
// INICIAL
// ================================
document.addEventListener("DOMContentLoaded", renderizarEntregas);
document.addEventListener("DOMContentLoaded", function () {
  const campoPesquisa = document.getElementById("campoPesquisa");
  const filtroStatus = document.getElementById("filtroStatus");
  const formCancelamento = document.getElementById("formCancelamento");

  if (campoPesquisa) campoPesquisa.addEventListener("input", renderizarEntregas);
  if (filtroStatus) filtroStatus.addEventListener("change", renderizarEntregas);
  if (formCancelamento) formCancelamento.addEventListener("submit", confirmarCancelamento);
});
