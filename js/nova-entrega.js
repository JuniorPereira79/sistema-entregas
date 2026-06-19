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

function obterCoordenada(id) {
  const valor = document.getElementById(id).value.trim().replace(",", ".");
  if (!valor) return null;

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : NaN;
}

function coordenadasPreenchidas(latitude, longitude) {
  return latitude !== null || longitude !== null;
}

function coordenadasValidas(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function atualizarMensagemLocalizacao(mensagem) {
  const elemento = document.getElementById("mensagemLocalizacao");
  if (elemento) elemento.textContent = mensagem;
}

function usarLocalizacaoAtual() {
  if (!navigator.geolocation) {
    atualizarMensagemLocalizacao("Seu navegador não oferece suporte à localização.");
    return;
  }

  atualizarMensagemLocalizacao("Buscando sua localização atual...");

  navigator.geolocation.getCurrentPosition(
    posicao => {
      document.getElementById("latitude").value = posicao.coords.latitude.toFixed(6);
      document.getElementById("longitude").value = posicao.coords.longitude.toFixed(6);
      atualizarMensagemLocalizacao("Localização preenchida com sucesso.");
    },
    () => {
      atualizarMensagemLocalizacao("Não foi possível obter sua localização.");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
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
  const latitude = obterCoordenada("latitude");
  const longitude = obterCoordenada("longitude");

  if (!loja || !vendedor || !destino || !formaPagamento) {
    alert("Preencha os campos obrigatórios!");
    return;
  }

  if (coordenadasPreenchidas(latitude, longitude) && !coordenadasValidas(latitude, longitude)) {
    alert("Informe uma latitude e longitude válidas ou deixe os dois campos em branco.");
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
    latitude: coordenadasValidas(latitude, longitude) ? latitude : null,
    longitude: coordenadasValidas(latitude, longitude) ? longitude : null,
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
  window.registrarNotificacoesEntrega?.(
    "nova-entrega",
    `Nova entrega criada para ${novaEntrega.cliente}.`,
    novaEntrega
  );

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
document.addEventListener("DOMContentLoaded", function () {
  const btnLocalizacaoAtual = document.getElementById("btnLocalizacaoAtual");
  if (btnLocalizacaoAtual) btnLocalizacaoAtual.addEventListener("click", usarLocalizacaoAtual);
});
