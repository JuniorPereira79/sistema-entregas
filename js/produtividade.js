let entregas = [];
let entregadores = [];
let indicadoresFiltrados = [];
let graficoProdutividade = null;

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

function normalizarStatus(status) {
  const valor = String(status || "pendente").toLowerCase();

  if (valor === "entregue") return "entregue";
  if (valor === "cancelado" || valor === "cancelada") return "cancelada";
  if (valor === "em rota" || valor === "em-rota") return "em-rota";

  return "pendente";
}

function obterDataCriacao(entrega) {
  const possiveis = [entrega.dataCriacao, entrega.criadoEm, entrega.dataHora];

  for (const valor of possiveis) {
    const data = valor ? new Date(valor) : null;
    if (data && !Number.isNaN(data.getTime())) return data;
  }

  if (entrega.data) {
    const partes = String(entrega.data).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (partes) return new Date(Number(partes[3]), Number(partes[2]) - 1, Number(partes[1]));
  }

  const dataPeloId = new Date(Number(entrega.id || 0));
  return Number.isNaN(dataPeloId.getTime()) ? null : dataPeloId;
}

function normalizarEntrega(entrega) {
  return {
    ...entrega,
    status: normalizarStatus(entrega.status),
    entregadorId: entrega.entregadorId || null,
    entregadorNome: entrega.entregadorNome || entrega.entregador || entrega.motoboy || "Não atribuído",
    dataCriacaoProdutividade: obterDataCriacao(entrega)
  };
}

function preencherFiltroEntregadores() {
  const select = document.getElementById("filtroEntregador");
  if (!select) return;

  select.innerHTML = `<option value="todos">Todos</option>`;

  entregadores.forEach(entregador => {
    const option = document.createElement("option");
    option.value = String(entregador.id);
    option.textContent = entregador.nome;
    select.appendChild(option);
  });
}

function obterFiltros() {
  return {
    dataInicial: document.getElementById("dataInicial").value,
    dataFinal: document.getElementById("dataFinal").value,
    entregador: document.getElementById("filtroEntregador").value
  };
}

function dataDentroDoPeriodo(data, dataInicial, dataFinal) {
  if (!data || Number.isNaN(data.getTime())) return true;

  if (dataInicial) {
    const inicio = new Date(`${dataInicial}T00:00:00`);
    if (data < inicio) return false;
  }

  if (dataFinal) {
    const fim = new Date(`${dataFinal}T23:59:59`);
    if (data > fim) return false;
  }

  return true;
}

function entregaCombinaComEntregador(entrega, filtroEntregador) {
  if (filtroEntregador === "todos") return true;

  const entregador = entregadores.find(item => String(item.id) === filtroEntregador);

  return String(entrega.entregadorId) === filtroEntregador || entrega.entregadorNome === entregador?.nome;
}

function calcularIndicadores() {
  const filtros = obterFiltros();
  const entregasFiltradas = entregas.filter(entrega =>
    dataDentroDoPeriodo(entrega.dataCriacaoProdutividade, filtros.dataInicial, filtros.dataFinal) &&
    entregaCombinaComEntregador(entrega, filtros.entregador)
  );

  const nomesEntregadores = new Set();
  entregadores.forEach(entregador => nomesEntregadores.add(entregador.nome));
  entregasFiltradas.forEach(entrega => nomesEntregadores.add(entrega.entregadorNome || "Não atribuído"));

  indicadoresFiltrados = [...nomesEntregadores]
    .map(nome => {
      const entregasDoEntregador = entregasFiltradas.filter(entrega => entrega.entregadorNome === nome);
      const total = entregasDoEntregador.length;
      const pendentes = entregasDoEntregador.filter(entrega => entrega.status === "pendente").length;
      const emRota = entregasDoEntregador.filter(entrega => entrega.status === "em-rota").length;
      const entregues = entregasDoEntregador.filter(entrega => entrega.status === "entregue").length;
      const canceladas = entregasDoEntregador.filter(entrega => entrega.status === "cancelada").length;

      return {
        entregador: nome,
        total,
        pendentes,
        emRota,
        entregues,
        canceladas,
        taxaSucesso: total ? (entregues / total) * 100 : 0,
        taxaCancelamento: total ? (canceladas / total) * 100 : 0
      };
    })
    .filter(item => item.total > 0)
    .sort((a, b) => b.entregues - a.entregues || a.entregador.localeCompare(b.entregador, "pt-BR"));
}

function formatarPercentual(valor) {
  return `${valor.toFixed(1)}%`;
}

function renderizarCards() {
  const container = document.getElementById("cardsProdutividade");
  const mensagem = document.getElementById("mensagemVazia");
  if (!container || !mensagem) return;

  if (indicadoresFiltrados.length === 0) {
    container.innerHTML = "";
    mensagem.textContent = "Nenhum dado de produtividade encontrado para os filtros selecionados.";
    return;
  }

  mensagem.textContent = `${indicadoresFiltrados.length} entregadores com entregas no período selecionado.`;
  container.innerHTML = indicadoresFiltrados.map(item => `
    <article class="prod-card">
      <h3>${item.entregador}</h3>
      <div class="prod-grid">
        <div class="prod-item"><strong>${item.total}</strong><span>Total</span></div>
        <div class="prod-item"><strong>${item.entregues}</strong><span>Entregues</span></div>
        <div class="prod-item"><strong>${item.canceladas}</strong><span>Canceladas</span></div>
        <div class="prod-item"><strong>${formatarPercentual(item.taxaSucesso)}</strong><span>Sucesso</span></div>
      </div>
    </article>
  `).join("");
}

function renderizarTabela() {
  const corpo = document.getElementById("corpoTabelaProdutividade");
  if (!corpo) return;

  if (indicadoresFiltrados.length === 0) {
    corpo.innerHTML = `<tr><td colspan="8" class="vazio">Nenhum dado encontrado.</td></tr>`;
    return;
  }

  corpo.innerHTML = indicadoresFiltrados.map(item => `
    <tr>
      <td>${item.entregador}</td>
      <td>${item.total}</td>
      <td>${item.pendentes}</td>
      <td>${item.emRota}</td>
      <td>${item.entregues}</td>
      <td>${item.canceladas}</td>
      <td>${formatarPercentual(item.taxaSucesso)}</td>
      <td>${formatarPercentual(item.taxaCancelamento)}</td>
    </tr>
  `).join("");
}

function renderizarGrafico() {
  const canvas = document.getElementById("graficoProdutividade");
  if (!canvas || typeof Chart === "undefined") return;

  if (graficoProdutividade) graficoProdutividade.destroy();

  graficoProdutividade = new Chart(canvas, {
    type: "bar",
    data: {
      labels: indicadoresFiltrados.map(item => item.entregador),
      datasets: [
        {
          label: "Entregues",
          data: indicadoresFiltrados.map(item => item.entregues),
          backgroundColor: "#22c55e",
          borderRadius: 8
        },
        {
          label: "Canceladas",
          data: indicadoresFiltrados.map(item => item.canceladas),
          backgroundColor: "#ef4444",
          borderRadius: 8
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

function atualizarTela() {
  calcularIndicadores();
  renderizarCards();
  renderizarTabela();
  renderizarGrafico();
}

function limparFiltros() {
  document.getElementById("dataInicial").value = "";
  document.getElementById("dataFinal").value = "";
  document.getElementById("filtroEntregador").value = "todos";
  atualizarTela();
}

function escaparCsv(valor) {
  const texto = String(valor ?? "");
  return `"${texto.replace(/"/g, '""')}"`;
}

function exportarCsv() {
  if (indicadoresFiltrados.length === 0) {
    alert("Nenhum dado para exportar.");
    return;
  }

  const cabecalho = [
    "Entregador",
    "Total",
    "Pendentes",
    "Em rota",
    "Entregues",
    "Canceladas",
    "Taxa de sucesso",
    "Taxa de cancelamento"
  ];

  const linhas = indicadoresFiltrados.map(item => [
    item.entregador,
    item.total,
    item.pendentes,
    item.emRota,
    item.entregues,
    item.canceladas,
    formatarPercentual(item.taxaSucesso),
    formatarPercentual(item.taxaCancelamento)
  ]);

  const csv = [cabecalho, ...linhas]
    .map(linha => linha.map(escaparCsv).join(";"))
    .join("\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `produtividade-entregadores-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function iniciarProdutividade() {
  if (!usuarioEhAdministrador()) {
    alertarSemPermissao();
    window.location.href = obterPaginaInicialUsuario();
    return;
  }

  entregas = carregarLista("entregas").map(normalizarEntrega);
  entregadores = carregarLista("entregadores");

  preencherFiltroEntregadores();
  atualizarTela();

  ["dataInicial", "dataFinal", "filtroEntregador"].forEach(id => {
    document.getElementById(id).addEventListener("change", atualizarTela);
  });

  document.getElementById("btnLimparFiltros").addEventListener("click", limparFiltros);
  document.getElementById("btnExportarCsv").addEventListener("click", exportarCsv);
}

document.addEventListener("DOMContentLoaded", iniciarProdutividade);
