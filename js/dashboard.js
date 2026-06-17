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

let graficoStatusInstancia = null;
let graficoEntregadoresInstancia = null;
let graficoDiasInstancia = null;

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

function atualizarTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor;
}

function parseDataBrasileira(valor) {
  if (typeof valor !== "string") return null;

  const partes = valor.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!partes) return null;

  const [, dia, mes, ano] = partes;
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));

  return Number.isNaN(data.getTime()) ? null : data;
}

function dataDaEntrega(entrega) {
  const datasPossiveis = [
    entrega.criadoEm,
    entrega.dataCriacao,
    entrega.dataHora,
    entrega.data
  ];

  for (const valor of datasPossiveis) {
    const dataBrasileira = parseDataBrasileira(valor);
    if (dataBrasileira) return dataBrasileira;

    const data = valor ? new Date(valor) : null;
    if (data && !Number.isNaN(data.getTime())) return data;
  }

  const dataPeloId = new Date(Number(entrega.id || 0));
  return Number.isNaN(dataPeloId.getTime()) ? new Date(0) : dataPeloId;
}

function formatarDataCurta(data) {
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  });
}

function chaveData(data) {
  return data.toISOString().slice(0, 10);
}

function normalizarEntrega(entrega) {
  return {
    ...entrega,
    cliente: entrega.cliente || entrega.destino || entrega.endereco || "Entrega sem cliente",
    endereco: entrega.endereco || entrega.destino || entrega.cliente || "-",
    entregadorNome: entrega.entregadorNome || entrega.entregador || entrega.motoboy || "",
    status: normalizarStatus(entrega.status),
    dataCriacaoDashboard: dataDaEntrega(entrega)
  };
}

function renderizarIndicadores(entregas, entregadores) {
  const entregasNormalizadas = entregas.map(normalizarEntrega);

  atualizarTexto("totalEntregas", entregasNormalizadas.length);
  atualizarTexto("totalPendentes", entregasNormalizadas.filter(e => e.status === "pendente").length);
  atualizarTexto("totalEmRota", entregasNormalizadas.filter(e => e.status === "em-rota").length);
  atualizarTexto("totalEntregues", entregasNormalizadas.filter(e => e.status === "entregue").length);
  atualizarTexto("totalCanceladas", entregasNormalizadas.filter(e => e.status === "cancelada").length);

  atualizarTexto("totalEntregadores", entregadores.length);
  atualizarTexto("entregadoresAtivos", entregadores.filter(e => e.status === "ativo").length);
  atualizarTexto("entregadoresInativos", entregadores.filter(e => e.status === "inativo").length);

  return entregasNormalizadas;
}

function alternarEstadoGrafico(canvasId, mensagemId, temDados) {
  const canvas = document.getElementById(canvasId);
  const mensagem = document.getElementById(mensagemId);
  const card = canvas?.closest(".grafico-card");

  if (!canvas || !mensagem || !card) return;

  mensagem.classList.toggle("ativo", !temDados);
  card.classList.toggle("sem-dados", !temDados);
}

function destruirGrafico(grafico) {
  if (grafico) grafico.destroy();
}

function criarGrafico(canvasId, config) {
  const canvas = document.getElementById(canvasId);

  if (!canvas || typeof Chart === "undefined") return null;

  return new Chart(canvas, config);
}

function contarPorStatus(entregas) {
  return {
    pendente: entregas.filter(e => e.status === "pendente").length,
    "em-rota": entregas.filter(e => e.status === "em-rota").length,
    entregue: entregas.filter(e => e.status === "entregue").length,
    cancelada: entregas.filter(e => e.status === "cancelada").length
  };
}

function contarPorEntregador(entregas) {
  return entregas.reduce((resultado, entrega) => {
    const nome = entrega.entregadorNome?.trim();
    if (!nome) return resultado;

    resultado[nome] = (resultado[nome] || 0) + 1;
    return resultado;
  }, {});
}

function contarPorDia(entregas) {
  return entregas.reduce((resultado, entrega) => {
    const data = entrega.dataCriacaoDashboard || dataDaEntrega(entrega);
    const chave = chaveData(data);

    if (!resultado[chave]) {
      resultado[chave] = {
        data,
        total: 0
      };
    }

    resultado[chave].total += 1;
    return resultado;
  }, {});
}

function renderizarGraficos(entregas) {
  destruirGrafico(graficoStatusInstancia);
  destruirGrafico(graficoEntregadoresInstancia);
  destruirGrafico(graficoDiasInstancia);

  graficoStatusInstancia = null;
  graficoEntregadoresInstancia = null;
  graficoDiasInstancia = null;

  if (typeof Chart === "undefined") {
    alternarEstadoGrafico("graficoStatus", "mensagemStatusVazio", false);
    alternarEstadoGrafico("graficoEntregadores", "mensagemEntregadorVazio", false);
    alternarEstadoGrafico("graficoDias", "mensagemDiasVazio", false);
    return;
  }

  const entregasPorStatus = contarPorStatus(entregas);
  const totaisStatus = Object.values(entregasPorStatus);
  const temStatus = totaisStatus.some(total => total > 0);

  alternarEstadoGrafico("graficoStatus", "mensagemStatusVazio", temStatus);

  if (temStatus) {
    graficoStatusInstancia = criarGrafico("graficoStatus", {
      type: "doughnut",
      data: {
        labels: ["Pendentes", "Em rota", "Entregues", "Canceladas"],
        datasets: [{
          data: [
            entregasPorStatus.pendente,
            entregasPorStatus["em-rota"],
            entregasPorStatus.entregue,
            entregasPorStatus.cancelada
          ],
          backgroundColor: ["#3b82f6", "#f59e0b", "#22c55e", "#ef4444"]
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom"
          }
        }
      }
    });
  }

  const entregasPorEntregador = contarPorEntregador(entregas);
  const nomesEntregadores = Object.keys(entregasPorEntregador);
  const temEntregadores = nomesEntregadores.length > 0;

  alternarEstadoGrafico("graficoEntregadores", "mensagemEntregadorVazio", temEntregadores);

  if (temEntregadores) {
    graficoEntregadoresInstancia = criarGrafico("graficoEntregadores", {
      type: "bar",
      data: {
        labels: nomesEntregadores,
        datasets: [{
          label: "Entregas",
          data: nomesEntregadores.map(nome => entregasPorEntregador[nome]),
          backgroundColor: "#3b82f6",
          borderRadius: 8
        }]
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
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  const entregasPorDia = contarPorDia(entregas);
  const diasOrdenados = Object.values(entregasPorDia).sort((a, b) => a.data - b.data);
  const temDias = diasOrdenados.length > 0;

  alternarEstadoGrafico("graficoDias", "mensagemDiasVazio", temDias);

  if (temDias) {
    graficoDiasInstancia = criarGrafico("graficoDias", {
      type: "line",
      data: {
        labels: diasOrdenados.map(item => formatarDataCurta(item.data)),
        datasets: [{
          label: "Entregas criadas",
          data: diasOrdenados.map(item => item.total),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.12)",
          fill: true,
          tension: 0.3
        }]
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
}

function renderizarRecentes(entregas) {
  const lista = document.getElementById("listaRecentes");
  if (!lista) return;

  const recentes = [...entregas]
    .sort((a, b) => dataDaEntrega(b) - dataDaEntrega(a))
    .slice(0, 5);

  if (recentes.length === 0) {
    lista.innerHTML = `<p class="lista-vazia">Nenhuma entrega cadastrada.</p>`;
    return;
  }

  lista.innerHTML = recentes.map(entrega => `
    <div class="entrega-recente">
      <div>
        <strong>${entrega.cliente || entrega.endereco || "Entrega sem cliente"}</strong>
        <p>${entrega.endereco || "-"}</p>
        <span>${entrega.data || "-"}${entrega.hora ? ` às ${entrega.hora}` : ""}</span>
      </div>
      <span class="status ${entrega.status}">${nomeStatus(entrega.status)}</span>
    </div>
  `).join("");
}

function carregarDashboard() {
  const entregas = carregarLista("entregas");
  const entregadores = carregarLista("entregadores");
  const entregasNormalizadas = renderizarIndicadores(entregas, entregadores);

  renderizarGraficos(entregasNormalizadas);
  renderizarRecentes(entregasNormalizadas);
}

document.addEventListener("DOMContentLoaded", carregarDashboard);
