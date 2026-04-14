const STORAGE_KEY = "sinac_sm_demo_registros";

const form = document.getElementById("registroForm");
const timeline = document.getElementById("timeline");
const totalRegistros = document.getElementById("totalRegistros");
const ultimoEstado = document.getElementById("ultimoEstado");
const tendenciaResumen = document.getElementById("tendenciaResumen");

const senalPredominante = document.getElementById("senalPredominante");
const energiaPredominante = document.getElementById("energiaPredominante");
const apoyoPredominante = document.getElementById("apoyoPredominante");
const institutionSummary = document.getElementById("institutionSummary");
const institutionTableBody = document.getElementById("institutionTableBody");
const trendBars = document.getElementById("trendBars");

const viewTitle = document.getElementById("viewTitle");
const navButtons = document.querySelectorAll(".nav-btn");
const usuarioView = document.getElementById("usuarioView");
const institucionalView = document.getElementById("institucionalView");
const clearDataBtn = document.getElementById("clearDataBtn");
const seedDemoBtn = document.getElementById("seedDemoBtn");

function getRecords() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function countBy(records, key) {
  return records.reduce((acc, item) => {
    const value = item[key] || "Sin dato";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function getTopValue(counts) {
  const entries = Object.entries(counts);
  if (!entries.length) return "Sin datos";
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function getTrendText(records) {
  if (records.length < 2) return "Aún no hay tendencia visible";

  const recent = records.slice(-3).map(r => r.estado);
  const overloaded = recent.filter(v => v === "Sobrecargado/a").length;
  const stable = recent.filter(v => v === "Estable").length;

  if (stable >= 2) return "Mayor estabilidad reciente";
  if (overloaded >= 2) return "Mayor necesidad de seguimiento";
  return "Tendencia mixta";
}

function buildSummary(records) {
  if (!records.length) {
    return "No hay información suficiente para mostrar un resumen.";
  }

  const estados = countBy(records, "estado");
  const energias = countBy(records, "energia");
  const apoyos = countBy(records, "apoyo");

  const topEstado = getTopValue(estados);
  const topEnergia = getTopValue(energias);
  const topApoyo = getTopValue(apoyos);
  const last = records[records.length - 1];

  return `
    Se observan <strong>${records.length}</strong> registros acumulados de continuidad.
    La señal predominante en este periodo es <strong>${topEstado}</strong>,
    con una energía predominante <strong>${topEnergia}</strong>.
    El apoyo más frecuentemente referido corresponde a <strong>${topApoyo}</strong>.
    El registro más reciente fue ingresado el <strong>${formatDate(last.fecha)}</strong>,
    lo que permite una lectura más ordenada del seguimiento entre atenciones.
  `;
}

function renderTimeline(records) {
  if (!records.length) {
    timeline.innerHTML = `<div class="empty-state">Aún no hay registros. Puedes crear uno o cargar un ejemplo.</div>`;
    return;
  }

  const ordered = [...records].reverse();

  timeline.innerHTML = ordered.map(record => `
    <article class="timeline-item">
      <div class="timeline-top">
        <div class="timeline-title">${record.estado}</div>
        <div class="timeline-date">${formatDate(record.fecha)}</div>
      </div>

      <div class="timeline-meta">
        <span class="timeline-chip">Energía: ${record.energia}</span>
        <span class="timeline-chip">Apoyo: ${record.apoyo}</span>
      </div>

      <div class="timeline-note">${record.nota ? record.nota : "Sin comentario adicional."}</div>
    </article>
  `).join("");
}

function renderTopMetrics(records) {
  totalRegistros.textContent = String(records.length);

  if (!records.length) {
    ultimoEstado.textContent = "Sin registros";
    tendenciaResumen.textContent = "Sin información";
    return;
  }

  const last = records[records.length - 1];
  ultimoEstado.textContent = last.estado;
  tendenciaResumen.textContent = getTrendText(records);
}

function renderInstitutionalMetrics(records) {
  if (!records.length) {
    senalPredominante.textContent = "Sin datos";
    energiaPredominante.textContent = "Sin datos";
    apoyoPredominante.textContent = "Sin datos";
    institutionSummary.textContent = "No hay información suficiente para mostrar un resumen.";
    return;
  }

  senalPredominante.textContent = getTopValue(countBy(records, "estado"));
  energiaPredominante.textContent = getTopValue(countBy(records, "energia"));
  apoyoPredominante.textContent = getTopValue(countBy(records, "apoyo"));
  institutionSummary.innerHTML = buildSummary(records);
}

function renderTable(records) {
  if (!records.length) {
    institutionTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="table-empty">No hay registros aún.</td>
      </tr>
    `;
    return;
  }

  const ordered = [...records].reverse();

  institutionTableBody.innerHTML = ordered.map(record => `
    <tr>
      <td>${formatDate(record.fecha)}</td>
      <td>${record.estado}</td>
      <td>${record.energia}</td>
      <td>${record.apoyo}</td>
      <td>${record.nota ? record.nota : "Sin comentario."}</td>
    </tr>
  `).join("");
}

function renderBars(records) {
  if (!records.length) {
    trendBars.innerHTML = `<div class="empty-state">Aún no hay datos para visualizar.</div>`;
    return;
  }

  const counts = countBy(records, "estado");
  const maxValue = Math.max(...Object.values(counts));

  trendBars.innerHTML = Object.entries(counts).map(([label, value]) => {
    const percent = Math.round((value / maxValue) * 100);

    return `
      <div class="bar-row">
        <div class="bar-label">
          <span>${label}</span>
          <span>${value}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${percent}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderAll() {
  const records = getRecords();
  renderTimeline(records);
  renderTopMetrics(records);
  renderInstitutionalMetrics(records);
  renderTable(records);
  renderBars(records);
}

function handleSubmit(event) {
  event.preventDefault();

  const estado = document.getElementById("estado").value;
  const energia = document.getElementById("energia").value;
  const nota = document.getElementById("nota").value.trim();
  const apoyo = document.getElementById("apoyo").value;

  if (!estado || !energia || !apoyo) {
    alert("Completa los campos requeridos.");
    return;
  }

  const newRecord = {
    estado,
    energia,
    nota,
    apoyo,
    fecha: new Date().toISOString()
  };

  const records = getRecords();
  records.push(newRecord);
  saveRecords(records);

  form.reset();
  renderAll();
}

function clearAllData() {
  const confirmed = confirm("¿Deseas eliminar todos los registros de la demo?");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  renderAll();
}

function seedDemoData() {
  const demo = [
    {
      estado: "Con altibajos",
      energia: "Media",
      nota: "Semana con exigencia académica alta y necesidad de mayor organización.",
      apoyo: "Mayor organización",
      fecha: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString()
    },
    {
      estado: "Sobrecargado/a",
      energia: "Baja",
      nota: "Se observa cansancio acumulado y dificultad para sostener rutina.",
      apoyo: "Orientación para continuidad",
      fecha: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString()
    },
    {
      estado: "Con altibajos",
      energia: "Media",
      nota: "Se mantiene participación en seguimiento, aunque con variabilidad.",
      apoyo: "Mantener seguimiento",
      fecha: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
    },
    {
      estado: "Estable",
      energia: "Media",
      nota: "Mayor sensación de orden durante los últimos días.",
      apoyo: "Mantener seguimiento",
      fecha: new Date().toISOString()
    }
  ];

  saveRecords(demo);
  renderAll();
}

function switchView(view) {
  navButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  if (view === "usuario") {
    usuarioView.classList.add("active");
    institucionalView.classList.remove("active");
    viewTitle.textContent = "Vista de usuario";
  } else {
    usuarioView.classList.remove("active");
    institucionalView.classList.add("active");
    viewTitle.textContent = "Vista institucional";
  }
}

form.addEventListener("submit", handleSubmit);
clearDataBtn.addEventListener("click", clearAllData);
seedDemoBtn.addEventListener("click", seedDemoData);

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    switchView(button.dataset.view);
  });
});

renderAll();
