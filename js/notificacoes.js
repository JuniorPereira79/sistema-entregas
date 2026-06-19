let usuarioLogado = null;
let notificacoesUsuario = [];

function formatarDataHora(dataHora) {
  const data = new Date(dataHora);
  if (Number.isNaN(data.getTime())) return "-";

  return data.toLocaleString("pt-BR");
}

function carregarNotificacoesTela() {
  usuarioLogado = obterUsuarioLogado();
  notificacoesUsuario = window.notificacoesApp
    .obterNotificacoesDoUsuario(usuarioLogado)
    .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
}

function atualizarResumo() {
  const resumo = document.getElementById("resumoNotificacoes");
  if (!resumo) return;

  const naoLidas = notificacoesUsuario.filter(notificacao => !notificacao.lida).length;
  resumo.textContent = `${notificacoesUsuario.length} notificações, ${naoLidas} não lidas.`;
}

function renderizarNotificacoes() {
  const lista = document.getElementById("listaNotificacoes");
  if (!lista) return;

  carregarNotificacoesTela();
  atualizarResumo();

  if (notificacoesUsuario.length === 0) {
    lista.innerHTML = `<p class="lista-vazia">Nenhuma notificação encontrada para este usuário.</p>`;
    return;
  }

  lista.innerHTML = notificacoesUsuario.map(notificacao => `
    <article class="notificacao ${notificacao.lida ? "lida" : ""}">
      <div class="notificacao-topo">
        <span class="notificacao-tipo">${notificacao.tipo || "Aviso"}</span>
        <span class="notificacao-data">${formatarDataHora(notificacao.dataHora)}</span>
      </div>
      <p>${notificacao.mensagem || "-"}</p>
      <div class="notificacao-acoes">
        ${notificacao.lida ? "" : `<button class="btn-lida" onclick="marcarComoLida(${notificacao.id})">Marcar como lida</button>`}
        <button class="btn-excluir" onclick="excluirNotificacao(${notificacao.id})">Excluir</button>
      </div>
    </article>
  `).join("");
}

function atualizarTodasNotificacoes(mutacao) {
  const todas = window.notificacoesApp.carregarNotificacoes();
  const atualizadas = mutacao(todas);
  window.notificacoesApp.salvarNotificacoes(atualizadas);
  renderizarNotificacoes();
}

function marcarComoLida(id) {
  atualizarTodasNotificacoes(notificacoes =>
    notificacoes.map(notificacao =>
      notificacao.id === id ? { ...notificacao, lida: true } : notificacao
    )
  );
}

function excluirNotificacao(id) {
  atualizarTodasNotificacoes(notificacoes =>
    notificacoes.filter(notificacao => notificacao.id !== id)
  );
}

function limparNotificacoesLidas() {
  atualizarTodasNotificacoes(notificacoes =>
    notificacoes.filter(notificacao => {
      const pertenceAoUsuario = window.notificacoesApp
        .obterNotificacoesDoUsuario(usuarioLogado)
        .some(item => item.id === notificacao.id);

      return !pertenceAoUsuario || !notificacao.lida;
    })
  );
}

document.addEventListener("DOMContentLoaded", function () {
  renderizarNotificacoes();
  document.getElementById("btnLimparLidas").addEventListener("click", limparNotificacoesLidas);
});
