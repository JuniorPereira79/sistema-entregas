let entregas = [];
let entregadores = [];
let entregasFiltradas = [];

function carregarLista(chave) {
  const dados = localStorage.getItem(chave);

  try {
    const lista = dados ? JSON.parse(dados) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    localStorage.removeItem(chave);
    return [];
  }
}

function salvarEntregas() {
  const entregasParaSalvar = entregas.map(({ _indiceOriginal, ...entrega }) => entrega);
  localStorage.setItem("entregas", JSON.stringify(entregasParaSalvar));
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

function normalizarEntrega(entrega, indiceOriginal) {
  const latitude = Number(String(entrega.latitude ?? "").replace(",", "."));
  const longitude = Number(String(entrega.longitude ?? "").replace(",", "."));
  const ordemRota = Number(entrega.ordemRota);

  return {
    ...entrega,
    _indiceOriginal: indiceOriginal,
    cliente: entrega.cliente || entrega.destino || entrega.endereco || "Entrega sem cliente",
    endereco: entrega.endereco || entrega.destino || entrega.cliente || "-",
    telefone: entrega.telefone || entrega.celular || "-",
    entregadorId: entrega.entregadorId || null,
    entregadorNome: entrega.entregadorNome || entrega.entregador || entrega.motoboy || "Não atribuído",
    status: normalizarStatus(entrega.status),
    ordemRota: Number.isFinite(ordemRota) && ordemRota > 0 ? ordemRota : null,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    historico: Array.isArray(entrega.historico) ? entrega.historico : []
  };
}

function preencherFiltroEntregadores() {
  const select = document.getElementById("filtroEntregador");
  if (!select) return;

  select.innerHTML = `<option value="todos">Todos os entregadores</option>`;

  entregadores
    .filter(entregador => entregador.status === "ativo")
    .forEach(entregador => {
      const option = document.createElement("option");
      option.value = String(entregador.id);
      option.textContent = entregador.nome;
      select.appendChild(option);
    });
}

function obterFiltros() {
  return {
    entregador: document.getElementById("filtroEntregador").value,
    status: document.getElementById("filtroStatus").value
  };
}

function entregaCombinaComEntregador(entrega, filtroEntregador) {
  if (filtroEntregador === "todos") return true;

  const entregadorSelecionado = entregadores.find(entregador => String(entregador.id) === filtroEntregador);

  return (
    String(entrega.entregadorId) === filtroEntregador ||
    entrega.entregadorNome === entregadorSelecionado?.nome
  );
}

function aplicarFiltros() {
  const filtros = obterFiltros();

  entregasFiltradas = entregas
    .filter(entrega => {
      if (filtros.status !== "todos" && entrega.status !== filtros.status) return false;
      return entregaCombinaComEntregador(entrega, filtros.entregador);
    })
    .sort((a, b) => {
      const ordemA = a.ordemRota || Number.MAX_SAFE_INTEGER;
      const ordemB = b.ordemRota || Number.MAX_SAFE_INTEGER;

      if (ordemA !== ordemB) return ordemA - ordemB;
      return String(a.cliente).localeCompare(String(b.cliente), "pt-BR");
    });

  renderizarLista();
}

function coordenadasValidas(entrega) {
  return (
    Number.isFinite(entrega.latitude) &&
    Number.isFinite(entrega.longitude) &&
    entrega.latitude >= -90 &&
    entrega.latitude <= 90 &&
    entrega.longitude >= -180 &&
    entrega.longitude <= 180
  );
}

function criarUrlGoogleMaps(entrega) {
  if (coordenadasValidas(entrega)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${entrega.latitude},${entrega.longitude}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entrega.endereco)}`;
}

function abrirGoogleMaps(indiceOriginal) {
  const entrega = entregas.find(item => item._indiceOriginal === indiceOriginal);
  if (!entrega) return;

  window.open(criarUrlGoogleMaps(entrega), "_blank", "noopener");
}

function atualizarResumo() {
  const resumo = document.getElementById("resumoRotas");
  if (!resumo) return;

  resumo.textContent = entregasFiltradas.length === 1
    ? "1 entrega encontrada para organizar."
    : `${entregasFiltradas.length} entregas encontradas para organizar.`;
}

function renderizarLista() {
  const lista = document.getElementById("listaRotas");
  if (!lista) return;

  atualizarResumo();

  if (entregasFiltradas.length === 0) {
    lista.innerHTML = `<p class="lista-vazia">Nenhuma entrega encontrada para os filtros selecionados.</p>`;
    return;
  }

  lista.innerHTML = entregasFiltradas.map(entrega => `
    <article class="entrega-rota">
      <div class="ordem-box">
        <label for="ordem-${entrega._indiceOriginal}">Ordem da rota</label>
        <input
          class="ordem-input"
          id="ordem-${entrega._indiceOriginal}"
          type="number"
          min="1"
          step="1"
          data-indice="${entrega._indiceOriginal}"
          value="${entrega.ordemRota || ""}"
          placeholder="Ex: 1"
        >
      </div>

      <div class="entrega-dados">
        <h3>${entrega.ordemRota ? `${entrega.ordemRota}. ` : ""}${entrega.cliente}</h3>
        <p><strong>Endereço:</strong> ${entrega.endereco}</p>
        <p><strong>Telefone:</strong> ${entrega.telefone}</p>
        <p><strong>Entregador:</strong> ${entrega.entregadorNome}</p>
        <span class="status ${entrega.status}">${nomeStatus(entrega.status)}</span>
      </div>

      <button class="btn-maps" onclick="abrirGoogleMaps(${entrega._indiceOriginal})">
        Abrir no Google Maps
      </button>
    </article>
  `).join("");
}

function salvarSequencia() {
  const camposOrdem = document.querySelectorAll(".ordem-input");
  let houveAlteracao = false;

  for (const campo of camposOrdem) {
    const indiceOriginal = Number(campo.dataset.indice);
    const entregaOriginal = entregas[indiceOriginal];
    if (!entregaOriginal) continue;

    const valor = campo.value.trim();
    const novaOrdem = valor ? Number(valor) : null;

    if (novaOrdem !== null && (!Number.isInteger(novaOrdem) || novaOrdem < 1)) {
      alert("Informe apenas números inteiros maiores que zero para a ordem da rota.");
      return;
    }

    const ordemAnterior = Number(entregaOriginal.ordemRota) || null;
    if (ordemAnterior === novaOrdem) continue;

    if (!Array.isArray(entregaOriginal.historico)) {
      entregaOriginal.historico = [];
    }

    entregaOriginal.ordemRota = novaOrdem;
    entregaOriginal.historico.push(
      criarRegistroHistorico(`Ordem da rota atualizada para ${novaOrdem || "sem ordem"}`)
    );
    houveAlteracao = true;
  }

  if (!houveAlteracao) {
    alert("Nenhuma alteração de ordem foi identificada.");
    return;
  }

  salvarEntregas();
  entregas = entregas.map(normalizarEntrega);
  aplicarFiltros();
  alert("Sequência da rota salva com sucesso.");
}

function iniciarRotas() {
  entregas = carregarLista("entregas").map(normalizarEntrega);
  entregadores = carregarLista("entregadores");

  preencherFiltroEntregadores();
  aplicarFiltros();

  document.getElementById("filtroEntregador").addEventListener("change", aplicarFiltros);
  document.getElementById("filtroStatus").addEventListener("change", aplicarFiltros);
  document.getElementById("btnSalvarSequencia").addEventListener("click", salvarSequencia);
}

document.addEventListener("DOMContentLoaded", iniciarRotas);
