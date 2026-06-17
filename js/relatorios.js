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
  const entregadorSelecionado = entregadores.find(entregador => String(entregador.id) === filtros.entregador);

  entregasFiltradas = entregas.filter(entrega => {
    if (filtros.status !== "todos" && entrega.status !== filtros.status) return false;
    if (
      filtros.entregador !== "todos" &&
      String(entrega.entregadorId) !== filtros.entregador &&
      entrega.entregadorNome !== entregadorSelecionado?.nome
    ) {
      return false;
    }

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

function obterResumoFiltrado() {
  return {
    total: entregasFiltradas.length,
    pendentes: entregasFiltradas.filter(e => e.status === "pendente").length,
    emRota: entregasFiltradas.filter(e => e.status === "em-rota").length,
    entregues: entregasFiltradas.filter(e => e.status === "entregue").length,
    canceladas: entregasFiltradas.filter(e => e.status === "cancelada").length
  };
}

function obterDescricaoFiltros() {
  const filtros = obterFiltros();
  const entregadorSelecionado = entregadores.find(entregador => String(entregador.id) === filtros.entregador);

  return [
    `Data inicial: ${filtros.dataInicial || "Todas"}`,
    `Data final: ${filtros.dataFinal || "Todas"}`,
    `Status: ${filtros.status === "todos" ? "Todos" : nomeStatus(filtros.status)}`,
    `Entregador: ${entregadorSelecionado?.nome || "Todos"}`
  ];
}

function exportarPdf() {
  if (entregasFiltradas.length === 0) {
    alert("Nenhuma entrega encontrada para exportar em PDF.");
    return;
  }

  const jsPDF = window.jspdf?.jsPDF;

  if (!jsPDF) {
    alert("Não foi possível carregar a biblioteca de PDF. Verifique sua conexão e tente novamente.");
    return;
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const resumo = obterResumoFiltrado();
  const dataGeracao = new Date().toLocaleString("pt-BR");
  const linhasTabela = entregasFiltradas.map(entrega => [
    String(entrega.codigo || "-"),
    entrega.cliente || "-",
    entrega.endereco || "-",
    entrega.telefone || "-",
    entrega.entregadorNome || "Não atribuído",
    nomeStatus(entrega.status),
    entrega.dataCriacaoTexto || "-",
    entrega.dataConclusaoTexto || "-"
  ]);

  doc.setFontSize(18);
  doc.text("Relatório de Entregas", 14, 16);

  doc.setFontSize(10);
  doc.text(`Gerado em: ${dataGeracao}`, 14, 24);

  obterDescricaoFiltros().forEach((linha, index) => {
    doc.text(linha, 14, 32 + index * 6);
  });

  doc.setFontSize(11);
  doc.text(
    `Total: ${resumo.total} | Pendentes: ${resumo.pendentes} | Em rota: ${resumo.emRota} | Entregues: ${resumo.entregues} | Canceladas: ${resumo.canceladas}`,
    14,
    60
  );

  doc.autoTable({
    startY: 68,
    head: [[
      "Código",
      "Cliente",
      "Endereço",
      "Telefone",
      "Entregador",
      "Status",
      "Data de criação",
      "Data de conclusão"
    ]],
    body: linhasTabela,
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 34 },
      2: { cellWidth: 55 },
      3: { cellWidth: 28 },
      4: { cellWidth: 34 },
      5: { cellWidth: 26 },
      6: { cellWidth: 28 },
      7: { cellWidth: 34 }
    }
  });

  doc.save(`relatorio-entregas-${new Date().toISOString().slice(0, 10)}.pdf`);
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
  document.getElementById("btnExportarPdf").addEventListener("click", exportarPdf);
}

document.addEventListener("DOMContentLoaded", iniciarRelatorios);
