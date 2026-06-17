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

function atualizarTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor;
}

function dataDaEntrega(entrega) {
  const data = entrega.criadoEm ? new Date(entrega.criadoEm) : new Date(entrega.id || 0);
  return Number.isNaN(data.getTime()) ? new Date(0) : data;
}

function renderizarIndicadores(entregas, entregadores) {
  const entregasNormalizadas = entregas.map(entrega => ({
    ...entrega,
    status: normalizarStatus(entrega.status)
  }));

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

  renderizarRecentes(entregasNormalizadas);
}

document.addEventListener("DOMContentLoaded", carregarDashboard);
