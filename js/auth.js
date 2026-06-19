function obterUsuarioLogado() {
  const usuario = localStorage.getItem("usuarioLogado");

  try {
    return usuario ? JSON.parse(usuario) : null;
  } catch {
    localStorage.removeItem("usuarioLogado");
    return null;
  }
}

const ACESSOS_POR_PERFIL = {
  administrador: [
    "dashboard.html",
    "entregas.html",
    "nova-entrega.html",
    "entregadores.html",
    "transferencias.html",
    "relatorios.html",
    "mapa.html",
    "rotas.html",
    "notificacoes.html",
    "minhas-entregas.html"
  ],
  vendedor: [
    "nova-entrega.html",
    "entregas.html",
    "notificacoes.html"
  ],
  entregador: [
    "minhas-entregas.html",
    "notificacoes.html"
  ]
};

const PAGINA_INICIAL_POR_PERFIL = {
  administrador: "dashboard.html",
  vendedor: "nova-entrega.html",
  entregador: "minhas-entregas.html"
};

function obterPerfilUsuario(usuarioLogado = obterUsuarioLogado()) {
  if (!usuarioLogado) return "";
  if (usuarioLogado.perfil) return usuarioLogado.perfil;
  if (usuarioLogado.usuario === "admin") return "administrador";
  if (usuarioLogado.usuario === "motoboy") return "entregador";

  return "vendedor";
}

function obterPaginaAtual() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function usuarioTemAcessoPagina(usuarioLogado, pagina = obterPaginaAtual()) {
  const perfil = obterPerfilUsuario(usuarioLogado);

  return podeAcessarPagina(pagina, perfil);
}

function podeAcessarPagina(paginaAtual, perfil) {
  const paginasPermitidas = ACESSOS_POR_PERFIL[perfil] || [];
  return paginasPermitidas.includes(paginaAtual);
}

function obterPaginaInicialUsuario(usuarioLogado = obterUsuarioLogado()) {
  const perfil = obterPerfilUsuario(usuarioLogado);
  return PAGINA_INICIAL_POR_PERFIL[perfil] || "login.html";
}

function aplicarVisibilidadePorPerfil(usuarioLogado = obterUsuarioLogado()) {
  const perfil = obterPerfilUsuario(usuarioLogado);

  document.querySelectorAll("[data-perfis]").forEach(elemento => {
    const perfisPermitidos = elemento.dataset.perfis
      .split(",")
      .map(item => item.trim());

    elemento.hidden = !perfisPermitidos.includes(perfil);
  });
}

function protegerPagina() {
  const usuarioLogado = obterUsuarioLogado();

  if (!usuarioLogado) {
    window.location.href = "login.html";
    return;
  }

  if (!usuarioTemAcessoPagina(usuarioLogado)) {
    window.location.href = obterPaginaInicialUsuario(usuarioLogado);
    return;
  }

  aplicarVisibilidadePorPerfil(usuarioLogado);
}

function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", protegerPagina);
