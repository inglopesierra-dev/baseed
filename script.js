// Configuración de envío del formulario.
// FORM_ENDPOINT: URL que recibe un POST JSON (p. ej. Formspree, un webhook o tu backend).
// WHATSAPP_NUMBER: número en formato internacional sin "+" ni espacios; se usa si no hay endpoint.
const CONFIG = {
  FORM_ENDPOINT: "",
  WHATSAPP_NUMBER: "520000000000",
};

const form = document.getElementById("booking-form");
const success = document.getElementById("booking-success");
const formError = form.querySelector(".form-error");
const submitBtn = form.querySelector('button[type="submit"]');
const dateInput = document.getElementById("date");

document.getElementById("year").textContent = new Date().getFullYear();

// No permitir fechas pasadas.
const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
dateInput.min = today.toISOString().split("T")[0];

const messages = {
  name: "Escribe tu nombre.",
  phone: "Escribe un teléfono válido.",
  email: "Revisa el formato del correo.",
  service: "Selecciona el motivo de la visita.",
  date: "Elige una fecha a partir de hoy.",
  time: "Elige un horario.",
};

function setError(field, show) {
  const wrapper = field.closest(".field");
  let msg = wrapper.querySelector(".field-msg");
  wrapper.classList.toggle("has-error", show);
  field.setAttribute("aria-invalid", show ? "true" : "false");
  if (show && !msg) {
    msg = document.createElement("p");
    msg.className = "field-msg";
    msg.id = `${field.id}-msg`;
    msg.textContent = messages[field.name];
    wrapper.appendChild(msg);
    field.setAttribute("aria-describedby", msg.id);
  } else if (!show && msg) {
    msg.remove();
    field.removeAttribute("aria-describedby");
  }
}

function isValid(field) {
  const value = field.value.trim();
  if (field.name === "phone") return value.replace(/\D/g, "").length >= 7;
  if (field.name === "date") return value !== "" && value >= dateInput.min;
  if (field.name === "name") return value.length >= 2;
  return field.checkValidity();
}

function validate() {
  let firstInvalid = null;
  form.querySelectorAll("input, select").forEach((field) => {
    const ok = isValid(field);
    setError(field, !ok);
    if (!ok && !firstInvalid) firstInvalid = field;
  });
  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

form.querySelectorAll("input, select").forEach((field) => {
  const evt = field.tagName === "SELECT" || field.type === "date" ? "change" : "input";
  field.addEventListener(evt, () => {
    if (field.closest(".field").classList.contains("has-error")) setError(field, !isValid(field));
  });
});

function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function showSuccess(name) {
  document.getElementById("success-name").textContent = name.split(" ")[0];
  form.hidden = true;
  success.hidden = false;
  success.focus();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.hidden = true;
  if (!validate()) return;

  const data = Object.fromEntries(new FormData(form));
  data.name = data.name.trim();

  if (CONFIG.FORM_ENDPOINT) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando…";
    try {
      const res = await fetch(CONFIG.FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(res.statusText);
      showSuccess(data.name);
    } catch {
      formError.textContent = "No pudimos enviar tu solicitud. Inténtalo de nuevo o llámanos.";
      formError.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Solicitar cita";
    }
    return;
  }

  // Sin endpoint: se abre WhatsApp con la solicitud ya redactada.
  const text = [
    "Hola, quiero agendar una cita en Sonrisa Imperial.",
    `Nombre: ${data.name}`,
    `Teléfono: ${data.phone}`,
    data.email ? `Correo: ${data.email}` : null,
    `Motivo: ${data.service}`,
    `Fecha preferida: ${formatDate(data.date)}`,
    `Horario: ${data.time}`,
  ].filter(Boolean).join("\n");

  window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  showSuccess(data.name);
});

document.getElementById("booking-reset").addEventListener("click", () => {
  form.reset();
  form.querySelectorAll(".field").forEach((w) => {
    const f = w.querySelector("input, select");
    setError(f, false);
  });
  success.hidden = true;
  form.hidden = false;
  document.getElementById("name").focus();
});
