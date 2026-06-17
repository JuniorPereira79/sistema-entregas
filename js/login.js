// Pegando os elementos do HTML
const form = document.getElementById("loginForm");
const inputUsuario = document.getElementById("usuario");
const inputSenha = document.getElementById("senha");

if (localStorage.getItem("usuarioLogado")) {
  window.location.href = "dashboard.html";
}

// Simulação de usuários (por enquanto)
const usuarios = [
  {
    usuario: "admin",
    senha: "123",
    nome: "Administrador",
    perfil: "administrador"
  },
  {
    usuario: "motoboy",
    senha: "123",
    nome: "Motoboy",
    perfil: "entregador"
  }
];

// Evento de submit do formulário
form.addEventListener("submit", function (event) {
  event.preventDefault(); // impede recarregar a página

  const usuarioDigitado = inputUsuario.value.trim();
  const senhaDigitada = inputSenha.value.trim();

  // Validação simples
  if (usuarioDigitado === "" || senhaDigitada === "") {
    alert("Preencha usuário e senha");
    return;
  }

  // Procurar usuário no array
  const usuarioEncontrado = usuarios.find(user =>
    user.usuario === usuarioDigitado && user.senha === senhaDigitada
  );

  if (usuarioEncontrado) {
    alert(`Bem-vindo, ${usuarioEncontrado.nome}!`);

    // Salvando login (simulação de sessão)
    localStorage.setItem("usuarioLogado", JSON.stringify(usuarioEncontrado));

    window.location.href = "dashboard.html";
  } else {
    alert("Usuário ou senha inválidos");
  }
});
