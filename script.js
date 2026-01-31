/* ================== CONFIG ================== */
const LIMITES = {
  cuarto: 3,
  medio: 3,
  kilo: 4
};

let pedido = [];
let envaseActivo = null;
let envasesPendientes = [];

/* ================== SABORES AGOTADOS ================== */
let saboresAgotados = JSON.parse(localStorage.getItem("saboresAgotados")) || [];

/* ================== DOM READY ================== */
document.addEventListener("DOMContentLoaded", () => {
  aplicarSaboresAgotados();
  crearPanelAdmin();
});

/* ================== APLICAR AGOTADOS ================== */
function aplicarSaboresAgotados() {
  document.querySelectorAll(".sabor").forEach(cb => {
    const label = cb.closest("label");
    if (saboresAgotados.includes(cb.value)) {
      cb.disabled = true;
      cb.checked = false;
      label.classList.add("agotado");
    } else {
      cb.disabled = false;
      label.classList.remove("agotado");
    }
  });
}

/* ================== PANEL ADMIN ================== */
function crearPanelAdmin() {
  const contenedor = document.getElementById("admin-sabores");
  contenedor.innerHTML = "";

  const saboresUnicos = [...new Set(
    Array.from(document.querySelectorAll(".sabor")).map(s => s.value)
  )];

  saboresUnicos.forEach(sabor => {
    const div = document.createElement("div");
    div.className = "admin-sabor";

    const btn = document.createElement("button");
    const agotado = saboresAgotados.includes(sabor);

    btn.textContent = agotado ? "Activar" : "Agotar";
    btn.classList.toggle("activo", agotado);

    btn.onclick = () => toggleSabor(sabor);

    div.innerHTML = `<span>${sabor}</span>`;
    div.appendChild(btn);

    contenedor.appendChild(div);
  });
}

function toggleSabor(sabor) {
  if (saboresAgotados.includes(sabor)) {
    saboresAgotados = saboresAgotados.filter(s => s !== sabor);
  } else {
    saboresAgotados.push(sabor);
  }

  localStorage.setItem("saboresAgotados", JSON.stringify(saboresAgotados));
  aplicarSaboresAgotados();
  crearPanelAdmin();
}

/* ================== MOSTRAR / OCULTAR PANEL ================== */
document.addEventListener("dblclick", e => {
  if (e.target.tagName === "H3" && e.target.textContent.includes("Panel")) {
    const panel = document.getElementById("admin-panel");
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  }
});

/* ================== SELECCIÓN DE TAMAÑO + CANTIDAD ================== */
document.querySelectorAll('input[name="tamano"]').forEach(radio => {
  radio.addEventListener("change", () => {

    // Quitar activo a todas las imágenes
    document.querySelectorAll(".btn-tamano-img").forEach(label=>{
      label.classList.remove("activo");
    });

    // Activar el label del tamaño elegido
    const label = document.querySelector(`label[for="${radio.id}"]`);
    if(label) label.classList.add("activo");

    // Leer la cantidad del input correspondiente
    const cantidadInput = document.getElementById(`q-${radio.value === 'cuarto' ? '1/4' : radio.value === 'medio' ? '1/2' : 'kilo'}`);
    let cantidad = parseInt(cantidadInput.value) || 1;
    if(cantidad < 1) cantidad = 1;

    // Crear envases pendientes según la cantidad
    envasesPendientes = [];
    for(let i=0; i<cantidad; i++){
      envasesPendientes.push({ tamano: radio.value, sabores: [] });
    }

    // Comenzar con el primer envase
    armarSiguienteEnvase();
    actualizarResumen();
  });
});

// Función que activa el siguiente envase pendiente
function armarSiguienteEnvase() {
  if(envasesPendientes.length === 0){
    envaseActivo = null;
    resetSabores();
    return;
  }
  envaseActivo = envasesPendientes.shift();
  pedido.push(envaseActivo);
  resetSabores();
}

/* ================== SELECCIÓN DE SABORES ================== */
document.querySelectorAll(".sabor").forEach(cb => {
  cb.addEventListener("change", () => {
    if (!envaseActivo) {
      cb.checked = false;
      alert("Primero elegí un tamaño");
      return;
    }

    const limite = LIMITES[envaseActivo.tamano];
    const sabor = cb.value;

    if (cb.checked) {
      if (envaseActivo.sabores.length >= limite) {
        cb.checked = false;
        alert(`Este envase ya tiene ${limite} sabores`);
        return;
      }
      envaseActivo.sabores.push(sabor);
    } else {
      envaseActivo.sabores = envaseActivo.sabores.filter(s => s !== sabor);
    }

    // Si el envase se llenó
    if (envaseActivo.sabores.length === limite) {
      actualizarResumen();
      if(envasesPendientes.length > 0){
        alert(`Envase completo. Ahora armá el siguiente ${formatearTamano(envaseActivo.tamano)} pendiente.`);
        armarSiguienteEnvase();
      } else {
        alert("Envase completo. Elegí otro tamaño para continuar.");
        envaseActivo = null;
        resetSabores();
      }
    }

    actualizarResumen();
  });
});

/* ================== RESUMEN ================== */
function actualizarResumen() {
  const resumen = document.getElementById("resumen");
  resumen.innerHTML = "<h3>🧾 Pedido</h3>";

  pedido.forEach((e, i) => {
    resumen.innerHTML += `
      <p>
        <strong>${i + 1}) ${formatearTamano(e.tamano)}</strong><br>
        Sabores: ${e.sabores.join(", ")}
        <button onclick="eliminarEnvase(${i})">❌</button>
      </p>
      <hr>
    `;
  });
}

function eliminarEnvase(i) {
  pedido.splice(i, 1);
  envaseActivo = null;
  resetSabores();
  actualizarResumen();
}

/* ================== UTILS ================== */
function resetSabores() {
  document.querySelectorAll(".sabor").forEach(cb => cb.checked = false);
}

function formatearTamano(t) {
  return t === "cuarto" ? "1/4 kg" : t === "medio" ? "1/2 kg" : "1 kg";
}

/* ================== WHATSAPP ================== */
const btnWhatsapp = document.getElementById("btnWhatsapp");
btnWhatsapp.addEventListener("click", enviarWhatsApp);

function enviarWhatsApp() {
  if (pedido.length === 0) {
    alert("No hay ningún pedido cargado");
    return;
  }

  // Fecha y hora
  const ahora = new Date();
  const fechaStr = ahora.toLocaleDateString("es-AR");
  const horaStr = ahora.toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' });

  let mensaje = `Nuevo Pedido - ${fechaStr} ${horaStr}\n\n`;

  // Datos del cliente
  const nombre = document.querySelector(".datos-pedido input[placeholder*='Nombre']")?.value || "";
  const direccion = document.querySelector(".datos-pedido input[placeholder*='Dirección']")?.value || "";
  const observaciones = document.querySelector(".datos-pedido textarea")?.value || "";
  const formaPago = document.querySelector(".datos-pedido select")?.value || "Efectivo";

  if (nombre) mensaje += `Nombre: ${nombre}\n`;
  if (direccion) mensaje += `Dirección: ${direccion}\n`;
  mensaje += `Forma de Pago: ${formaPago}\n`;
  if (observaciones) mensaje += `Aclaraciones: ${observaciones}\n\n`;

  let total = 0;

  pedido.forEach((envase, i) => {
    const tamanoTexto = formatearTamano(envase.tamano);

    // Definir precio según tamaño y forma de pago
    let precioUnitario = 0;
    if(envase.tamano === "cuarto") precioUnitario = formaPago === "Efectivo" ? 6000 : 7500;
    else if(envase.tamano === "medio") precioUnitario = formaPago === "Efectivo" ? 12000 : 15000;
    else if(envase.tamano === "kilo") precioUnitario = formaPago === "Efectivo" ? 22000 : 25000;

    total += precioUnitario;

    mensaje += `${tamanoTexto}\n`;
    mensaje += `Sabores: ${envase.sabores.join(", ")}\n`;
    mensaje += `Cantidad: 1 - $${precioUnitario}\n\n`;
  });

  mensaje += `Total (con envío sin cargo): $${total}\n`;

  const telefono = "+5492257611464"; // ← CAMBIÁ ESTE NÚMERO
  const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

  window.open(url, "_blank");
}