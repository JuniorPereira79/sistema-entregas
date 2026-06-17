function carregarEntregasMapa() {
  const dados = localStorage.getItem("entregas");

  try {
    const entregas = dados ? JSON.parse(dados) : [];
    return Array.isArray(entregas) ? entregas.map(normalizarEntregaMapa) : [];
  } catch {
    return [];
  }
}

function normalizarStatusMapa(status) {
  const valor = String(status || "pendente").toLowerCase();

  if (valor === "entregue") return "Entregue";
  if (valor === "cancelado" || valor === "cancelada") return "Cancelada";
  if (valor === "em rota" || valor === "em-rota") return "Em rota";

  return "Pendente";
}

function normalizarEntregaMapa(entrega) {
  return {
    ...entrega,
    cliente: entrega.cliente || entrega.destino || entrega.endereco || "Entrega sem cliente",
    endereco: entrega.endereco || entrega.destino || entrega.cliente || "-",
    telefone: entrega.telefone || entrega.celular || "-",
    entregadorNome: entrega.entregadorNome || entrega.entregador || entrega.motoboy || "Não atribuído",
    statusTexto: normalizarStatusMapa(entrega.status),
    latitude: Number(String(entrega.latitude ?? "").replace(",", ".")),
    longitude: Number(String(entrega.longitude ?? "").replace(",", "."))
  };
}

function coordenadaValida(entrega) {
  return (
    Number.isFinite(entrega.latitude) &&
    Number.isFinite(entrega.longitude) &&
    entrega.latitude >= -90 &&
    entrega.latitude <= 90 &&
    entrega.longitude >= -180 &&
    entrega.longitude <= 180
  );
}

function escaparHtml(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[caractere]));
}

function criarPopup(entrega) {
  return `
    <div class="popup-mapa">
      <strong>${escaparHtml(entrega.cliente)}</strong>
      <p><b>Endereço:</b> ${escaparHtml(entrega.endereco)}</p>
      <p><b>Telefone:</b> ${escaparHtml(entrega.telefone)}</p>
      <p><b>Entregador:</b> ${escaparHtml(entrega.entregadorNome)}</p>
      <p><b>Status:</b> ${escaparHtml(entrega.statusTexto)}</p>
    </div>
  `;
}

function atualizarResumoMapa(total) {
  const resumo = document.getElementById("resumoMapa");
  const mensagemVazia = document.getElementById("mensagemMapaVazio");

  if (resumo) {
    resumo.textContent = total === 1
      ? "1 entrega com localização encontrada."
      : `${total} entregas com localização encontradas.`;
  }

  if (mensagemVazia) mensagemVazia.classList.toggle("ativo", total === 0);
}

function iniciarMapa() {
  const mapaElemento = document.getElementById("mapa");
  if (!mapaElemento || typeof L === "undefined") return;

  const mapa = L.map("mapa").setView([-14.235, -51.9253], 4);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(mapa);

  const entregasComLocalizacao = carregarEntregasMapa().filter(coordenadaValida);
  atualizarResumoMapa(entregasComLocalizacao.length);

  if (entregasComLocalizacao.length === 0) return;

  const grupoMarcadores = L.featureGroup();

  entregasComLocalizacao.forEach(entrega => {
    const marcador = L.marker([entrega.latitude, entrega.longitude])
      .bindPopup(criarPopup(entrega));

    marcador.addTo(grupoMarcadores);
  });

  grupoMarcadores.addTo(mapa);
  mapa.fitBounds(grupoMarcadores.getBounds(), {
    maxZoom: 16,
    padding: [32, 32]
  });
}

document.addEventListener("DOMContentLoaded", iniciarMapa);
