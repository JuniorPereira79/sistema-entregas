let entregas = [];

function carregarEntregas() {
  const dados = localStorage.getItem("entregas");

  try {
    const salvas = dados ? JSON.parse(dados) : [];
    return salvas.map(normalizarEntrega);
  } catch {
    localStorage.removeItem("entregas");
    return [];
  }
}

function salvarEntregas() {
  localStorage.setItem("entregas", JSON.stringify(entregas));
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

function normalizarEntrega(entrega) {
  return {
    ...entrega,
    cliente: entrega.cliente || entrega.destino || entrega.endereco || "-",
    endereco: entrega.endereco || entrega.destino || entrega.cliente || "-",
    telefone: entrega.telefone || entrega.celular || "",
    entregadorId: entrega.entregadorId || null,
    entregadorNome: entrega.entregadorNome || entrega.entregador || entrega.motoboy || "",
    data: entrega.data || "-",
    hora: entrega.hora || "",
    status: normalizarStatus(entrega.status),
    historico: Array.isArray(entrega.historico) ? entrega.historico : [],
    comprovante: entrega.comprovante || null
  };
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

function usuarioPodeVerEntrega(entrega, usuarioLogado) {
  if (usuarioLogado?.perfil === "administrador" || usuarioLogado?.usuario === "admin") return true;

  const idUsuario = usuarioLogado?.entregadorId ? Number(usuarioLogado.entregadorId) : null;
  const nomeUsuario = String(usuarioLogado?.nome || "").toLowerCase();
  const loginUsuario = String(usuarioLogado?.usuario || "").toLowerCase();
  const entregadorNome = String(entrega.entregadorNome || "").toLowerCase();

  return entrega.entregadorId === idUsuario || entregadorNome === nomeUsuario || entregadorNome === loginUsuario;
}

function obterEntregasVisiveis() {
  const usuarioLogado = obterUsuarioLogado();
  return entregas.filter(entrega => usuarioPodeVerEntrega(entrega, usuarioLogado));
}

function atualizarInfoUsuario() {
  const usuarioLogado = obterUsuarioLogado();
  const info = document.getElementById("infoUsuario");
  if (!info) return;

  const perfil = usuarioLogado?.perfil === "administrador" || usuarioLogado?.usuario === "admin" ? "Administrador" : "Entregador";
  info.textContent = `${usuarioLogado?.nome || usuarioLogado?.usuario} • Perfil: ${perfil}`;
}

function renderizarMinhasEntregas() {
  const lista = document.getElementById("listaMinhasEntregas");
  if (!lista) return;

  entregas = carregarEntregas();
  const visiveis = obterEntregasVisiveis();
  lista.innerHTML = "";

  if (visiveis.length === 0) {
    lista.innerHTML = `<p class="lista-vazia">Nenhuma entrega encontrada para este usuário.</p>`;
    return;
  }

  visiveis.forEach(entrega => {
    const card = document.createElement("div");
    card.className = `card ${entrega.status}`;

    card.innerHTML = `
      <div class="status-bar"></div>
      <div class="card-content">
        <div class="card-header">
          <h2>${entrega.cliente}</h2>
          <span class="status-text">${nomeStatus(entrega.status)}</span>
        </div>
        <p>Endereço: ${entrega.endereco}</p>
        ${entrega.telefone ? `<p>Telefone: ${entrega.telefone}</p>` : ""}
        <p>Data: ${entrega.data}${entrega.hora ? ` às ${entrega.hora}` : ""}</p>
        <p>Entregador: ${entrega.entregadorNome || "Não atribuído"}</p>

        <div class="acoes">
          ${entrega.status === "pendente" ? `<button class="btn-rota" onclick="alterarStatus(${entrega.id}, 'em-rota')">Iniciar rota</button>` : ""}
          ${entrega.status !== "entregue" && entrega.status !== "cancelada" ? `<button class="btn-entregue" onclick="abrirModalComprovante(${entrega.id})">Marcar entregue</button>` : ""}
          ${entrega.status !== "entregue" && entrega.status !== "cancelada" ? `<button class="btn-cancelar" onclick="alterarStatus(${entrega.id}, 'cancelada')">Cancelar</button>` : ""}
        </div>
      </div>
    `;

    lista.appendChild(card);
  });
}

function alterarStatus(id, status) {
  if (status === "cancelada" && !confirm("Deseja CANCELAR esta entrega?")) return;

  entregas = carregarEntregas();
  const entrega = entregas.find(item => item.id === id);
  if (!entrega) return;

  entrega.status = status;
  const acoes = {
    "em-rota": "Iniciar rota",
    "entregue": "Marcar entregue",
    "cancelada": "Cancelar entrega"
  };
  adicionarHistorico(entrega, acoes[status] || `Status alterado para ${nomeStatus(status)}`);
  salvarEntregas();
  window.registrarNotificacoesEntrega?.(
    "status",
    `Status da entrega de ${entrega.cliente} alterado para ${nomeStatus(status)}.`,
    entrega
  );
  renderizarMinhasEntregas();
}

function abrirModalComprovante(id) {
  const modal = document.getElementById("modalComprovante");
  const inputId = document.getElementById("entregaComprovanteId");
  const form = document.getElementById("formComprovante");
  if (!modal || !inputId || !form) return;

  form.reset();
  inputId.value = id;
  modal.classList.add("ativo");
}

function fecharModalComprovante() {
  const modal = document.getElementById("modalComprovante");
  const form = document.getElementById("formComprovante");

  if (form) form.reset();
  if (modal) modal.classList.remove("ativo");
}

function lerArquivoComoBase64(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();

    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    leitor.readAsDataURL(arquivo);
  });
}

async function confirmarEntregaComComprovante(event) {
  event.preventDefault();

  const entregaId = Number(document.getElementById("entregaComprovanteId").value);
  const fotoInput = document.getElementById("fotoComprovante");
  const observacaoInput = document.getElementById("observacaoComprovante");
  const arquivo = fotoInput.files[0];

  if (!arquivo) {
    alert("Selecione a foto do comprovante.");
    return;
  }

  try {
    const imagemBase64 = await lerArquivoComoBase64(arquivo);
    const agora = new Date();

    entregas = carregarEntregas();
    const entrega = entregas.find(item => item.id === entregaId);
    if (!entrega) return;

    entrega.status = "entregue";
    entrega.comprovante = {
      imagem: imagemBase64,
      observacao: observacaoInput.value.trim(),
      dataHora: agora.toLocaleString("pt-BR"),
      usuario: obterNomeUsuarioLogado()
    };
    adicionarHistorico(entrega, "Entrega concluída com comprovante");

    salvarEntregas();
    window.registrarNotificacoesEntrega?.(
      "status",
      `Status da entrega de ${entrega.cliente} alterado para ${nomeStatus(entrega.status)}.`,
      entrega
    );
    window.registrarNotificacoesEntrega?.(
      "comprovante",
      `Comprovante enviado para a entrega de ${entrega.cliente}.`,
      entrega
    );
    fecharModalComprovante();
    renderizarMinhasEntregas();
  } catch {
    alert("Não foi possível salvar o comprovante. Tente novamente.");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  atualizarInfoUsuario();
  renderizarMinhasEntregas();

  const formComprovante = document.getElementById("formComprovante");
  if (formComprovante) {
    formComprovante.addEventListener("submit", confirmarEntregaComComprovante);
  }
});
