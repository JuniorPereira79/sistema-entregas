(function () {
  const LINKS_MENU = [
    { texto: "Dashboard", url: "dashboard.html" },
    { texto: "Entregas", url: "entregas.html" },
    { texto: "Nova Entrega", url: "nova-entrega.html" },
    { texto: "Entregadores", url: "entregadores.html" },
    { texto: "Transferências", url: "transferencias.html" },
    { texto: "Relatórios", url: "relatorios.html" },
    { texto: "Produtividade", url: "produtividade.html" },
    { texto: "Mapa", url: "mapa.html" },
    { texto: "Rotas", url: "rotas.html" },
    { texto: "Minhas Entregas", url: "minhas-entregas.html" },
    { texto: "Notificações", url: "notificacoes.html" }
  ];

  function criarLinkMenu(link, usuarioLogado, paginaAtual) {
    if (!usuarioTemAcessoPagina(usuarioLogado, link.url)) return "";

    const ativo = link.url === paginaAtual ? "ativo" : "";
    return `<a class="${ativo}" href="${link.url}">${link.texto}</a>`;
  }

  function renderizarMenu() {
    const usuarioLogado = obterUsuarioLogado();
    if (!usuarioLogado) return;
    if (document.getElementById("menuLateral")) return;

    const paginaAtual = obterPaginaAtual();
    const perfil = obterPerfilUsuario(usuarioLogado);
    const links = LINKS_MENU
      .map(link => criarLinkMenu(link, usuarioLogado, paginaAtual))
      .join("");

    document.body.classList.add("com-menu-lateral");
    document.body.insertAdjacentHTML("afterbegin", `
      <button class="menu-toggle" id="menuToggle" type="button" aria-label="Abrir menu">☰</button>
      <div class="menu-overlay" id="menuOverlay"></div>
      <aside class="menu-lateral" id="menuLateral">
        <div class="menu-topo">
          <strong>Sistema de Entregas</strong>
          <span>${usuarioLogado.nome || usuarioLogado.usuario} • ${perfil}</span>
        </div>
        <nav>${links}</nav>
        <button class="menu-sair" type="button" onclick="logout()">Sair</button>
      </aside>
    `);

    const menu = document.getElementById("menuLateral");
    const overlay = document.getElementById("menuOverlay");
    const toggle = document.getElementById("menuToggle");

    function alternarMenu() {
      menu.classList.toggle("aberto");
      overlay.classList.toggle("ativo");
    }

    toggle.addEventListener("click", alternarMenu);
    overlay.addEventListener("click", alternarMenu);
  }

  window.renderizarMenu = renderizarMenu;
  document.addEventListener("DOMContentLoaded", renderizarMenu);
})();
