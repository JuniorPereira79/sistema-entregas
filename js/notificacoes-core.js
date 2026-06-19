(function () {
  const CHAVE_NOTIFICACOES = "notificacoes";

  function carregarNotificacoes() {
    const dados = localStorage.getItem(CHAVE_NOTIFICACOES);

    try {
      const notificacoes = dados ? JSON.parse(dados) : [];
      return Array.isArray(notificacoes) ? notificacoes : [];
    } catch {
      localStorage.removeItem(CHAVE_NOTIFICACOES);
      return [];
    }
  }

  function salvarNotificacoes(notificacoes) {
    localStorage.setItem(CHAVE_NOTIFICACOES, JSON.stringify(notificacoes));
  }

  function registrarNotificacao(tipo, mensagem, usuarioDestino = "admin") {
    const notificacoes = carregarNotificacoes();

    notificacoes.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      tipo,
      mensagem,
      usuarioDestino,
      lida: false,
      dataHora: new Date().toISOString()
    });

    salvarNotificacoes(notificacoes);
  }

  function registrarNotificacoesEntrega(tipo, mensagem, entrega) {
    const destinos = new Set(["admin"]);

    if (entrega?.entregadorNome) destinos.add(entrega.entregadorNome);
    if (entrega?.entregadorId) destinos.add(String(entrega.entregadorId));

    destinos.forEach(destino => registrarNotificacao(tipo, mensagem, destino));
  }

  function notificacaoPertenceAoUsuario(notificacao, usuarioLogado) {
    if (!usuarioLogado) return false;

    const destino = String(notificacao.usuarioDestino || "").toLowerCase();
    const usuario = String(usuarioLogado.usuario || "").toLowerCase();
    const nome = String(usuarioLogado.nome || "").toLowerCase();
    const entregadorId = usuarioLogado.entregadorId ? String(usuarioLogado.entregadorId).toLowerCase() : "";
    const administrador = usuarioLogado.perfil === "administrador" || usuario === "admin";

    return (
      destino === "todos" ||
      destino === usuario ||
      destino === nome ||
      destino === entregadorId ||
      (administrador && destino === "admin")
    );
  }

  function obterNotificacoesDoUsuario(usuarioLogado) {
    return carregarNotificacoes().filter(notificacao =>
      notificacaoPertenceAoUsuario(notificacao, usuarioLogado)
    );
  }

  function contarNotificacoesNaoLidas(usuarioLogado) {
    return obterNotificacoesDoUsuario(usuarioLogado).filter(notificacao => !notificacao.lida).length;
  }

  window.notificacoesApp = {
    carregarNotificacoes,
    salvarNotificacoes,
    registrarNotificacao,
    registrarNotificacoesEntrega,
    obterNotificacoesDoUsuario,
    contarNotificacoesNaoLidas
  };

  window.registrarNotificacao = registrarNotificacao;
  window.registrarNotificacoesEntrega = registrarNotificacoesEntrega;
})();
