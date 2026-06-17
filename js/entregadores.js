let entregadores = [];

const formEntregador = document.getElementById("formEntregador");
const inputId = document.getElementById("entregadorId");
const inputNome = document.getElementById("nome");
const inputTelefone = document.getElementById("telefone");
const inputVeiculo = document.getElementById("veiculo");
const inputPlaca = document.getElementById("placa");
const inputStatus = document.getElementById("status");
const btnSalvar = document.getElementById("btnSalvar");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

function carregarEntregadores() {
  const dados = localStorage.getItem("entregadores");

  try {
    return dados ? JSON.parse(dados) : [];
  } catch {
    localStorage.removeItem("entregadores");
    return [];
  }
}

function salvarEntregadores() {
  localStorage.setItem("entregadores", JSON.stringify(entregadores));
}

function limparFormulario() {
  formEntregador.reset();
  inputId.value = "";
  inputStatus.value = "ativo";
  btnSalvar.textContent = "Cadastrar entregador";
  btnCancelarEdicao.style.display = "none";
}

function renderizarEntregadores() {
  const lista = document.getElementById("listaEntregadores");
  entregadores = carregarEntregadores();
  lista.innerHTML = "";

  if (entregadores.length === 0) {
    lista.innerHTML = `<p class="lista-vazia">Nenhum entregador cadastrado.</p>`;
    return;
  }

  entregadores.forEach(entregador => {
    const card = document.createElement("div");
    card.className = `entregador-card ${entregador.status}`;

    card.innerHTML = `
      <div>
        <h2>${entregador.nome}</h2>
        <p>Telefone: ${entregador.telefone}</p>
        <p>Veículo: ${entregador.veiculo}</p>
        <p>Placa: ${entregador.placa || "-"}</p>
        <span class="status">${entregador.status === "ativo" ? "Ativo" : "Inativo"}</span>
      </div>

      <div class="acoes">
        <button class="btn-editar" onclick="editarEntregador(${entregador.id})">Editar</button>
        <button class="btn-excluir" onclick="excluirEntregador(${entregador.id})">Excluir</button>
      </div>
    `;

    lista.appendChild(card);
  });
}

function editarEntregador(id) {
  const entregador = entregadores.find(item => item.id === id);
  if (!entregador) return;

  inputId.value = entregador.id;
  inputNome.value = entregador.nome;
  inputTelefone.value = entregador.telefone;
  inputVeiculo.value = entregador.veiculo;
  inputPlaca.value = entregador.placa || "";
  inputStatus.value = entregador.status;
  btnSalvar.textContent = "Salvar alterações";
  btnCancelarEdicao.style.display = "block";
}

function excluirEntregador(id) {
  if (!confirm("Deseja excluir este entregador?")) return;

  entregadores = carregarEntregadores().filter(entregador => entregador.id !== id);
  salvarEntregadores();
  limparFormulario();
  renderizarEntregadores();
}

formEntregador.addEventListener("submit", function (event) {
  event.preventDefault();

  entregadores = carregarEntregadores();
  const idEditando = inputId.value ? Number(inputId.value) : null;
  const dadosEntregador = {
    id: idEditando || Date.now(),
    nome: inputNome.value.trim(),
    telefone: inputTelefone.value.trim(),
    veiculo: inputVeiculo.value.trim(),
    placa: inputPlaca.value.trim(),
    status: inputStatus.value
  };

  if (idEditando) {
    entregadores = entregadores.map(entregador =>
      entregador.id === idEditando ? dadosEntregador : entregador
    );
  } else {
    entregadores.push(dadosEntregador);
  }

  salvarEntregadores();
  limparFormulario();
  renderizarEntregadores();
});

btnCancelarEdicao.addEventListener("click", limparFormulario);

document.addEventListener("DOMContentLoaded", function () {
  limparFormulario();
  renderizarEntregadores();
});
