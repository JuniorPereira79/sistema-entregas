function obterUsuarioLogado() {
  const usuario = localStorage.getItem("usuarioLogado");

  try {
    return usuario ? JSON.parse(usuario) : null;
  } catch {
    localStorage.removeItem("usuarioLogado");
    return null;
  }
}

function protegerPagina() {
  const usuarioLogado = obterUsuarioLogado();

  if (!usuarioLogado) {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", protegerPagina);
