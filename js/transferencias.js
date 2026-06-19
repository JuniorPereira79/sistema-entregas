let entregas = [];
let entregadores = [];
let transferencias = [];

const formTransferencia = document.getElementById("formTransferencia");
const entregaSelect = document.getElementById("entregaSelect");
const entregadorAtual = document.getElementById("entregadorAtual");
const novoEntregadorSelect = document.getElementById("novoEntregadorSelect");
const motivoInput = document.getElementById("motivo");

function carregarLista(chave) {
  const dados = localStorage.getItem(chave);

  try {
    return dados ? JSON.parse(dados) : [];
  } catch {
    localStorage.removeItem(chave);
    return [];
  }
}

function salvarLista(chave, lista) {
  localStorage.setItem(chave, JSON.stringify(lista));
}

function normalizarStatus(status) {
  const valor = String(status || "pendente").toLowerCase();

  if (valor === "entregue") return "entregue";
  if (valor === "cancelado" || valor === "cancelada") return "cancelada";
  if (valor === "em rota" || valor === "em-rota") return "em-rota";

  return "pendente";
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

function normalizarEntrega(entrega) {
  return {
    ...entrega,
    status: normalizarStatus(entrega.status),
    cliente: entrega.cliente || entrega.destino || entrega.endereco || "-",
    endereco: entrega.endereco || entrega.destino || entrega.cliente || "-",
    entregadorId: entrega.entregadorId || null,
    entregadorNome: entrega.entregadorNome || entrega.entregador || entrega.motoboy || "",
    entregadorTelefone: entrega.entregadorTelefone || "",
    entregadorVeiculo: entrega.entregadorVeiculo || "",
    entregadorPlaca: entrega.entregadorPlaca || "",
    historico: Array.isArray(entrega.historico) ? entrega.historico : []
  };
}

function carregarDados() {
  entregas = carregarLista("entregas").map(normalizarEntrega);
  entregadores = carregarLista("entregadores");
  transferencias = carregarLista("transferencias");
}

function carregarSelectEntregas() {
  const abertas = entregas.filter(entrega =>
    entrega.status !== "entregue" && entrega.status !== "cancelada"
  );

  entregaSelect.innerHTML = `<option value="">Selecione uma entrega</option>`;

  abertas.forEach(entrega => {
    const option = document.createElement("option");
    option.value = entrega.id;
    option.textContent = `${entrega.cliente} - ${entrega.endereco}`;
    entregaSelect.appendChild(option);
  });
}

function carregarSelectEntregadores() {
  const ativos = entregadores.filter(entregador => entregador.status === "ativo");

  novoEntregadorSelect.innerHTML = `<option value="">Selecione um entregador ativo</option>`;

  ativos.forEach(entregador => {
    const option = document.createElement("option");
    option.value = entregador.id;
    option.textContent = `${entregador.nome} - ${entregador.veiculo}`;
    option.dataset.nome = entregador.nome;
    option.dataset.telefone = entregador.telefone;
    option.dataset.veiculo = entregador.veiculo;
    option.dataset.placa = entregador.placa || "";
    novoEntregadorSelect.appendChild(option);
  });
}

function atualizarEntregadorAtual() {
  const entrega = entregas.find(item => String(item.id) === entregaSelect.value);

  if (!entrega) {
    entregadorAtual.value = "Nenhuma entrega selecionada";
    return;
  }

  entregadorAtual.value = entrega.entregadorNome || "Não atribuído";
}

function renderizarTransferencias() {
  const lista = document.getElementById("listaTransferencias");
  if (!lista) return;

  if (transferencias.length === 0) {
    lista.innerHTML = `<p class="lista-vazia">Nenhuma transferência realizada.</p>`;
    return;
  }

  lista.innerHTML = [...transferencias]
    .reverse()
    .map(item => `
      <div class="transferencia-item">
        <strong>${item.entregaCliente}</strong>
        <p>De ${item.entregadorAntigo} para ${item.entregadorNovo}</p>
        <p>Motivo: ${item.motivo}</p>
        <span>${item.data} às ${item.hora} • ${item.usuario}</span>
      </div>
    `)
    .join("");
}

function transferirEntrega(event) {
  event.preventDefault();
  if (!podeTransferirEntrega()) {
    alertarSemPermissao();
    return;
  }

  const entrega = entregas.find(item => String(item.id) === entregaSelect.value);
  const novoOption = novoEntregadorSelect.options[novoEntregadorSelect.selectedIndex];
  const motivo = motivoInput.value.trim();

  if (!entrega || !novoOption?.value || !motivo) {
    alert("Preencha todos os campos da transferência.");
    return;
  }

  const entregadorAntigo = entrega.entregadorNome || "Não atribuído";
  const entregadorNovo = novoOption.dataset.nome;
  const registroHistorico = criarRegistroHistorico(
    `Entrega transferida de ${entregadorAntigo} para ${entregadorNovo}. Motivo: ${motivo}`
  );

  entrega.entregadorId = Number(novoOption.value);
  entrega.entregadorNome = entregadorNovo;
  entrega.entregadorTelefone = novoOption.dataset.telefone || "";
  entrega.entregadorVeiculo = novoOption.dataset.veiculo || "";
  entrega.entregadorPlaca = novoOption.dataset.placa || "";
  entrega.historico.push(registroHistorico);

  const registroTransferencia = {
    id: Date.now(),
    entregaId: entrega.id,
    entregaCliente: entrega.cliente,
    entregadorAntigo,
    entregadorNovo,
    novoEntregadorId: entrega.entregadorId,
    motivo,
    usuario: registroHistorico.usuario,
    data: registroHistorico.data,
    hora: registroHistorico.hora,
    criadoEm: registroHistorico.criadoEm
  };

  transferencias.push(registroTransferencia);
  salvarLista("entregas", entregas);
  salvarLista("transferencias", transferencias);
  window.registrarNotificacoesEntrega?.(
    "transferencia",
    `Entrega de ${entrega.cliente} transferida de ${entregadorAntigo} para ${entregadorNovo}.`,
    entrega
  );

  alert("Transferência realizada com sucesso!");
  formTransferencia.reset();
  entregadorAtual.value = "Nenhuma entrega selecionada";
  carregarDados();
  carregarSelectEntregas();
  carregarSelectEntregadores();
  renderizarTransferencias();
}

document.addEventListener("DOMContentLoaded", function () {
  carregarDados();
  carregarSelectEntregas();
  carregarSelectEntregadores();
  atualizarEntregadorAtual();
  renderizarTransferencias();
});

entregaSelect.addEventListener("change", atualizarEntregadorAtual);
formTransferencia.addEventListener("submit", transferirEntrega);
