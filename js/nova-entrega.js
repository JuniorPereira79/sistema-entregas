function voltar() {
  window.location.href = "entregas.html";
}

const form = document.getElementById("formEntrega");

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const loja = document.getElementById("loja").value;
  const vendedor = document.getElementById("vendedor").value;
  const destino = document.getElementById("destino").value;
  const pagamento = document.getElementById("pagamento").value;
  const obs = document.getElementById("obs").value;

  if (!loja || !vendedor || !destino) {
    alert("Preencha os campos obrigatórios!");
    return;
  }



const novaEntrega = {
  id: Date.now(),
  loja,
  vendedor,
  cliente: destino,
  endereco: destino,
  pagamentoStatus: pagamento === "Pago" ? "Pago" : "A Receber",
  pagamentoForma: document.getElementById("formaPagamento").value,
  obs,
  status: "pendente",
  data: new Date().toLocaleString("pt-BR")
};




  salvarEntrega(novaEntrega);

  window.location.href = "entregas.html";
});


function salvarEntrega(entrega) {
  let entregas = JSON.parse(localStorage.getItem("entregas")) || [];

  entregas.push(entrega);

  localStorage.setItem("entregas", JSON.stringify(entregas));
}


function atualizarContador(total) {
  const contador = document.getElementById("contadorEntregas");
  contador.textContent = total;
}

const btnPago = document.getElementById("btnPago");
const btnReceber = document.getElementById("btnReceber");
const pagamentoInput = document.getElementById("pagamento");

btnPago.addEventListener("click", () => {
  btnPago.classList.add("ativo");
  btnReceber.classList.remove("ativo");
  pagamentoInput.value = "Pago";
});

btnReceber.addEventListener("click", () => {
  btnReceber.classList.add("ativo");
  btnPago.classList.remove("ativo");
  pagamentoInput.value = "A Receber";
});
