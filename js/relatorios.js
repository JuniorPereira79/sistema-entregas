let entregas = [];
let entregadores = [];
let entregasFiltradas = [];

function carregarLista(chave) {
  const dados = localStorage.getItem(chave);

  try {
    return dados ? JSON.parse(dados) : [];
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

function nomeStatus(status) {
  const nomes = {
    "pendente": "Pendente",
    "em-rota": "Em rota",
    "entregue": "Entregue",
    "cancelada": "Cancelada"
  };

  return nomes[status] || "Pendente";
}

function formatarData(data) {
  if (!data || Number.isNaN(data.getTime())) return "-";
  return data.toLocaleDateString("pt-BR");
}

function formatarDataHora(data) {
  if (!data || Number.isNaN(data.getTime())) return "-";
  return data.toLocaleString("pt-BR");
}

function obterDataCriacao(entrega) {
  if (entrega.criadoEm) {
    const data = new Date(entrega.criadoEm);
    if (!Number.isNaN(data.getTime())) return data;
  }

  if (entrega.id) {
    const data = new Date(Number(entrega.id));
    if (!Number.isNaN(data.getTime())) return data;
  }

  if (entrega.data) {
    const partes = String(entrega.data).split("/");
    if (partes.length === 3) {
      return new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
    }
  }

  return null;
}

function obterDataConclusao(entrega) {
  if (entrega.comprovante?.dataHora) return entrega.comprovante.dataHora;

  const historico = Array.isArray(entrega.historico) ? entrega.historico : [];
  const conclusao = [...historico].reverse().find(item => {
    const acao = String(item.acao || "").toLowerCase();
    return acao.includes("entregue") || acao.includes("concluída");
  });

  if (conclusao) {
    return `${conclusao.data || "-"}${conclusao.hora ? ` às ${conclusao.hora}` : ""}`;
  }

  return "";
}

function normalizarEntrega(entrega) {
  const dataCriacao = obterDataCriacao(entrega);

  return {
    ...entrega,
    id: entrega.id || Date.now(),
    codigo: entrega.codigo || entrega.id || "-",
    cliente: entrega.cliente || entrega.destino || entrega.endereco || "-",
    endereco: entrega.endereco || entrega.destino || entrega.cliente || "-",
    telefone: entrega.telefone || entrega.celular || "",
    entregadorId: entrega.entregadorId || null,
    entregadorNome: entrega.entregadorNome || entrega.entregador || entrega.motoboy || "Não atribuído",
    status: normalizarStatus(entrega.status),
    dataCriacao,
    dataCriacaoTexto: formatarData(dataCriacao),
    dataConclusaoTexto: obterDataConclusao(entrega)
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
    status: document.getElementById("filtroStatus").value,
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

function aplicarFiltros() {
  const filtros = obterFiltros();

  entregasFiltradas = entregas.filter(entrega => {
    if (filtros.status !== "todos" && entrega.status !== filtros.status) return false;
    if (filtros.entregador !== "todos" && String(entrega.entregadorId) !== filtros.entregador) return false;

    return dataDentroDoPeriodo(entrega.dataCriacao, filtros.dataInicial, filtros.dataFinal);
  });

  atualizarIndicadores();
  renderizarTabela();
}

function atualizarTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor;
}

function atualizarIndicadores() {
  atualizarTexto("totalFiltrado", entregasFiltradas.length);
  atualizarTexto("totalPendentes", entregasFiltradas.filter(e => e.status === "pendente").length);
  atualizarTexto("totalEmRota", entregasFiltradas.filter(e => e.status === "em-rota").length);
  atualizarTexto("totalEntregues", entregasFiltradas.filter(e => e.status === "entregue").length);
  atualizarTexto("totalCanceladas", entregasFiltradas.filter(e => e.status === "cancelada").length);
}

function renderizarTabela() {
  const corpo = document.getElementById("corpoTabelaRelatorios");
  if (!corpo) return;

  if (entregasFiltradas.length === 0) {
    corpo.innerHTML = `<tr><td colspan="8" class="vazio">Nenhuma entrega encontrada.</td></tr>`;
    return;
  }

  corpo.innerHTML = entregasFiltradas.map(entrega => `
    <tr>
      <td>${entrega.codigo}</td>
      <td>${entrega.cliente}</td>
      <td>${entrega.endereco}</td>
      <td>${entrega.telefone || "-"}</td>
      <td>${entrega.entregadorNome}</td>
      <td>${nomeStatus(entrega.status)}</td>
      <td>${entrega.dataCriacaoTexto}</td>
      <td>${entrega.dataConclusaoTexto || "-"}</td>
    </tr>
  `).join("");
}

function limparFiltros() {
  document.getElementById("dataInicial").value = "";
  document.getElementById("dataFinal").value = "";
  document.getElementById("filtroStatus").value = "todos";
  document.getElementById("filtroEntregador").value = "todos";
  aplicarFiltros();
}

function escaparCsv(valor) {
  const texto = String(valor ?? "");
  return `"${texto.replace(/"/g, '""')}"`;
}

function exportarCsv() {
  const cabecalho = [
    "Código da entrega",
    "Cliente",
    "Endereço",
    "Telefone",
    "Entregador",
    "Status",
    "Data de criação",
    "Data de conclusão"
  ];

  const linhas = entregasFiltradas.map(entrega => [
    entrega.codigo,
    entrega.cliente,
    entrega.endereco,
    entrega.telefone || "-",
    entrega.entregadorNome,
    nomeStatus(entrega.status),
    entrega.dataCriacaoTexto,
    entrega.dataConclusaoTexto || "-"
  ]);

  const csv = [cabecalho, ...linhas]
    .map(linha => linha.map(escaparCsv).join(";"))
    .join("\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `relatorio-entregas-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function iniciarRelatorios() {
  entregas = carregarLista("entregas").map(normalizarEntrega);
  entregadores = carregarLista("entregadores");

  preencherFiltroEntregadores();
  aplicarFiltros();

  ["dataInicial", "dataFinal", "filtroStatus", "filtroEntregador"].forEach(id => {
    document.getElementById(id).addEventListener("change", aplicarFiltros);
  });

  document.getElementById("btnLimparFiltros").addEventListener("click", limparFiltros);
  document.getElementById("btnExportarCsv").addEventListener("click", exportarCsv);
}

document.addEventListener("DOMContentLoaded", iniciarRelatorios);
