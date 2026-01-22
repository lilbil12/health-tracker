// NAVIGATION
function showSection(id) {
  document.querySelectorAll("section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// LOCAL STORAGE HELPERS
function getData(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function saveData(key, data) {
  const arr = getData(key);
  arr.push(data);
  localStorage.setItem(key, JSON.stringify(arr));
}

// PAIN SLIDER DISPLAY
const painSlider = document.getElementById("painSlider");
const painValue = document.getElementById("painValue");
painSlider.addEventListener("input", () => { painValue.textContent = painSlider.value; });

// SYMPTOMS PAGE
document.querySelectorAll(".joints input").forEach(chk => {
  chk.addEventListener("change", () => {
    if (chk.checked) {
      const note = prompt(`Notes for ${chk.value} (optional):`);
      chk.dataset.note = note || "";
    } else {
      chk.dataset.note = "";
    }
  });
});

function noSymptoms() {
  document.querySelectorAll(".joints input").forEach(chk => {
    chk.checked = false;
    chk.dataset.note = "";
  });
  alert("No symptoms recorded for today.");
}

function saveSymptoms() {
  const joints = [...document.querySelectorAll(".joints input:checked")].map(j => ({
    name: j.value,
    note: j.dataset.note || ""
  }));
  saveData("symptoms", { date: new Date().toISOString(), joints, pain: painSlider.value });
  alert("Symptoms saved!");
}

// JOURNAL
function saveJournal() {
  const text = document.getElementById("journalText").value;
  if (!text) return alert("Enter something first.");
  saveData("journal", { date: new Date().toISOString(), text });
  alert("Journal saved!");
  document.getElementById("journalText").value = "";
}

// MEDICATIONS
const bodymap = document.getElementById("bodymap-img");
bodymap.addEventListener("click", e => {
  const x = e.offsetX, y = e.offsetY;
  document.getElementById("medDetails").value = getBodyPartFromXY(x, y);
});
function getBodyPartFromXY(x, y) {
  if (y < 100) return "Shoulder";
  if (y < 200) return "Upper arm";
  if (y < 300) return "Forearm";
  if (y < 400) return "Thigh";
  return "Lower leg";
}

function saveMed() {
  const name = document.getElementById("medName").value;
  const type = document.getElementById("medType").value;
  const details = document.getElementById("medDetails").value;
  if (!name) return alert("Enter medication name.");
  saveData("meds", { date: new Date().toISOString(), name, type, details });
  alert("Medication saved!");
  document.getElementById("medName").value = "";
  document.getElementById("medDetails").value = "";
}

// HISTORY PAGE
function showHistory() {
  const date = new Date(document.getElementById("historyDate").value);
  const dayStart = new Date(date); dayStart.setHours(0,0,0,0);
  const dayEnd = new Date(date); dayEnd.setHours(23,59,59,999);

  const symptoms = getData("symptoms").filter(e => {
    const d = new Date(e.date); return d >= dayStart && d <= dayEnd;
  });
  const journal = getData("journal").filter(e => {
    const d = new Date(e.date); return d >= dayStart && d <= dayEnd;
  });
  const meds = getData("meds").filter(e => {
    const d = new Date(e.date); return d >= dayStart && d <= dayEnd;
  });

  let html = "<h3>Symptoms</h3>";
  symptoms.forEach(e => {
    e.joints.forEach(j => { html += `${j.name} - Pain ${e.pain}/10 - Note: ${j.note || "None"}<br>`; });
    html += "<hr>";
  });
  html += "<h3>Journal</h3>";
  journal.forEach(e => { html += `${new Date(e.date).toLocaleString()}: ${e.text}<br><hr>`; });
  html += "<h3>Medications</h3>";
  meds.forEach(e => { html += `${new Date(e.date).toLocaleString()}: ${e.name} (${e.type}) - ${e.details}<br><hr>`; });

  document.getElementById("historyLog").innerHTML = html || "No logs for this date.";
}

// SUMMARY PAGE
function generateSummary() {
  const range = Number(document.getElementById("summaryRange").value);
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - range);

  const symptoms = getData("symptoms").filter(e => new Date(e.date) >= cutoff);
  const meds = getData("meds").filter(e => new Date(e.date) >= cutoff);

  let html = "<h3>Symptoms Summary</h3>";
  symptoms.forEach(e => {
    e.joints.forEach(j => { html += `${j.name} - Pain ${e.pain}/10 - Note: ${j.note || "None"}<br>`; });
    html += "<hr>";
  });

  html += "<h3>Medications Summary</h3>";
  meds.forEach(e => { html += `${new Date(e.date).toLocaleString()}: ${e.name} (${e.type}) - ${e.details}<br>`; });

  document.getElementById("summaryLog").innerHTML = html || "No data for selected range.";
}

// EXPORT PDF
function exportPDF() {
  const doc = new jsPDF();
  let y = 10;
  const symptoms = getData("symptoms");
  const journal = getData("journal");
  const meds = getData("meds");

  doc.setFontSize(14);
  doc.text("Arthritis Tracker Export", 10, y); y += 10;

  doc.setFontSize(12);
  doc.text("Symptoms:", 10, y); y += 10;
  symptoms.forEach(e => {
    e.joints.forEach(j => {
      doc.text(`${j.name} - Pain ${e.pain}/10 - Note: ${j.note || "None"}`, 10, y); y += 8;
    });
    y += 4;
  });

  doc.text("Journal:", 10, y); y += 10;
  journal.forEach(e => { doc.text(`${new Date(e.date).toLocaleString()}: ${e.text}`, 10, y); y += 8; });

  doc.text("Medications:", 10, y); y += 10;
  meds.forEach(e => { doc.text(`${new Date(e.date).toLocaleString()}: ${e.name} (${e.type}) - ${e.details}`, 10, y); y += 8; });

  doc.save("arthritis_export.pdf");
}

// REGISTER SERVICE WORKER
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
