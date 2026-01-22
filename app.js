function showSection(id) {
  document.querySelectorAll("section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  if (id === "summary") generateSummary();
}

const painSlider = document.getElementById("painLevel");
const painValue = document.getElementById("painValue");
painSlider.oninput = () => painValue.textContent = painSlider.value;

function saveData(key, entry) {
  const data = JSON.parse(localStorage.getItem(key) || "[]");
  data.unshift(entry);
  localStorage.setItem(key, JSON.stringify(data));
}

function getData(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

// SYMPTOMS
document.getElementById("symptomForm").onsubmit = e => {
  e.preventDefault();
  const joints = [...document.querySelectorAll(".joints input:checked")].map(j => j.value);
  saveData("symptoms", {
    date: new Date().toISOString(),
    joints,
    pain: painSlider.value,
    notes: symptomNotes.value
  });
  e.target.reset();
  displaySymptoms();
};

function displaySymptoms() {
  symptomLog.innerHTML = "";
  getData("symptoms").forEach(e => {
    symptomLog.innerHTML += `
      <div class="log-entry">
        <strong>${new Date(e.date).toLocaleString()}</strong><br>
        Joints: ${e.joints.join(", ")}<br>
        Pain: ${e.pain}/10<br>
        ${e.notes || ""}
      </div>`;
  });
}

// JOURNAL
function saveJournal() {
  saveData("journal", {
    date: new Date().toISOString(),
    text: journalEntry.value
  });
  journalEntry.value = "";
  displayJournal();
}

function displayJournal() {
  journalLog.innerHTML = "";
  getData("journal").forEach(e => {
    journalLog.innerHTML += `
      <div class="log-entry">
        <strong>${new Date(e.date).toLocaleString()}</strong><br>
        ${e.text}
      </div>`;
  });
}

// MEDS
function saveMedication() {
  saveData("meds", {
    date: new Date().toISOString(),
    name: medName.value,
    type: medType.value,
    details: medDetails.value
  });
  medName.value = medDetails.value = "";
  displayMeds();
}

function displayMeds() {
  medLog.innerHTML = "";
  getData("meds").forEach(e => {
    medLog.innerHTML += `
      <div class="log-entry">
        <strong>${e.name}</strong> (${e.type})<br>
        ${new Date(e.date).toLocaleString()}<br>
        ${e.details || ""}
      </div>`;
  });
}

// SUMMARY
function generateSummary() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const symptoms = getData("symptoms").filter(e => new Date(e.date) >= cutoff);
  const meds = getData("meds").filter(e => new Date(e.date) >= cutoff);

  const avgPain = symptoms.length
    ? (symptoms.reduce((s, e) => s + Number(e.pain), 0) / symptoms.length).toFixed(1)
    : "N/A";

  const jointCount = {};
  symptoms.forEach(e => e.joints.forEach(j => jointCount[j] = (jointCount[j] || 0) + 1));

  const topJoints = Object.entries(jointCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(j => j[0])
    .join(", ") || "None";

  summaryContent.innerHTML = `
    <div class="log-entry">
      <strong>Average Pain:</strong> ${avgPain}/10<br>
      <strong>Most Affected Joints:</strong> ${topJoints}<br>
      <strong>Symptom Entries:</strong> ${symptoms.length}<br>
      <strong>Medications Logged:</strong> ${meds.length}
    </div>`;
}

// EXPORT HELPERS
function setLast30Days() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  startDate.valueAsDate = start;
  endDate.valueAsDate = end;
}

function withinRange(date, start, end) {
  const d = new Date(date);
  return (!start || d >= start) && (!end || d <= end);
}

// EXPORT PDF
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const start = startDate.value ? new Date(startDate.value) : null;
  const end = endDate.value ? new Date(endDate.value + "T23:59:59") : null;

  let y = 10;
  doc.setFontSize(16);
  doc.text("Arthritis Summary", 10, y);
  y += 10;

  const symptoms = getData("symptoms").filter(e => withinRange(e.date, start, end));
  const meds = getData("meds").filter(e => withinRange(e.date, start, end));

  const avgPain = symptoms.length
    ? (symptoms.reduce((s, e) => s + Number(e.pain), 0) / symptoms.length).toFixed(1)
    : "N/A";

  doc.setFontSize(12);
  doc.text(`Average Pain: ${avgPain}/10`, 10, y);
  y += 8;
  doc.text(`Symptom Entries: ${symptoms.length}`, 10, y);
  y += 8;
  doc.text(`Medications Logged: ${meds.length}`, 10, y);

  doc.save("arthritis-log.pdf");
}

// INIT
displaySymptoms();
displayJournal();
displayMeds();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
