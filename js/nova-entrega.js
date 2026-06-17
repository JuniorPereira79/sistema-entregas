function voltar() {
  window.location.href = "entregas.html";
}

const form = document.getElementById("formEntrega");

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

function carregarEntregadoresAtivos() {
  const selectEntregador = document.getElementById("entregador");
  if (!selectEntregador) return;

  let entregadores = [];

  try {
    entregadores = JSON.parse(localStorage.getItem("entregadores")) || [];
  } catch {
    entregadores = [];
  }

  const ativos = entregadores.filter(entregador => entregador.status === "ativo");
  selectEntregador.innerHTML = `<option value="">Selecione um entregador ativo</option>`;

  ativos.forEach(entregador => {
    const option = document.createElement("option");
    option.value = entregador.id;
    option.textContent = `${entregador.nome} - ${entregador.veiculo}`;
    option.dataset.nome = entregador.nome;
    option.dataset.telefone = entregador.telefone;
    option.dataset.veiculo = entregador.veiculo;
    option.dataset.placa = entregador.placa || "";
    selectEntregador.appendChild(option);
  });
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const loja = document.getElementById("loja").value;
  const vendedor = document.getElementById("vendedor").value.trim();
  const destino = document.getElementById("destino").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const selectEntregador = document.getElementById("entregador");
  const entregadorSelecionado = selectEntregador.options[selectEntregador.selectedIndex];
  const pagamento = document.getElementById("pagamento").value;
  const formaPagamento = document.getElementById("formaPagamento").value;
  const obs = document.getElementById("obs").value.trim();

  if (!loja || !vendedor || !destino || !formaPagamento) {
    alert("Preencha os campos obrigatórios!");
    return;
  }
  const agora = new Date();
  const novaEntrega = {
    id: Date.now(),
    loja,
    vendedor,
    cliente: destino,
    endereco: destino,
    telefone,
    entregadorId: selectEntregador.value ? Number(selectEntregador.value) : null,
    entregadorNome: entregadorSelecionado?.dataset.nome || "",
    entregadorTelefone: entregadorSelecionado?.dataset.telefone || "",
    entregadorVeiculo: entregadorSelecionado?.dataset.veiculo || "",
    entregadorPlaca: entregadorSelecionado?.dataset.placa || "",
    pagamentoStatus: pagamento === "Pago" ? "Pago" : "A Receber",
    pagamentoForma: formaPagamento,
    formaPagamento,
    obs,
    status: "pendente",
    data: agora.toLocaleDateString("pt-BR"),
    hora: agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    }),
    criadoEm: agora.toISOString(),
    historico: [
      criarRegistroHistorico("Entrega criada")
    ]
  };




  salvarEntrega(novaEntrega);

  window.location.href = "entregas.html";
});


function salvarEntrega(entrega) {
  let entregas = JSON.parse(localStorage.getItem("entregas")) || [];

  entregas.push(entrega);

  localStorage.setItem("entregas", JSON.stringify(entregas));
}


function atualizarContador(total) {
  const contador = document.getElementById("contadorEntregas");
  contador.textContent = total;
}

const btnPago = document.getElementById("btnPago");
const btnReceber = document.getElementById("btnReceber");
const pagamentoInput = document.getElementById("pagamento");

btnPago.addEventListener("click", () => {
  btnPago.classList.add("ativo");
  btnReceber.classList.remove("ativo");
  pagamentoInput.value = "Pago";
});

btnReceber.addEventListener("click", () => {
  btnReceber.classList.add("ativo");
  btnPago.classList.remove("ativo");
  pagamentoInput.value = "A Receber";
});

document.addEventListener("DOMContentLoaded", carregarEntregadoresAtivos);
