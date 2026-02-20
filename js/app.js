let currentStep = 1;
let record = {};
let processSteps = [];
let mapInstance = null;

/* ---------- NAVIGATION ---------- */

function hideAll() {
  document.getElementById("home").classList.add("hidden");
  document.getElementById("form-section").classList.add("hidden");
  document.getElementById("records-section").classList.add("hidden");
  document.getElementById("map-section").classList.add("hidden");
}

function goHome() {
  hideAll();
  document.getElementById("home").classList.remove("hidden");
}

function startNew() {
  hideAll();
  document.getElementById("form-section").classList.remove("hidden");

  record = {
    uuid: generateUUID(),
    created_at: new Date().toISOString(),
    geo: {},
    craft: {},
    practitioner: {},
    ontology: {},
    materials: [],
    process_steps: [],
    consent: {}
  };

  processSteps = [];
  currentStep = 1;
  captureGeo();
  renderStep();
}

function captureGeo() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      record.geo = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
    });
  }
}

/* ---------- ONTOLOGY ---------- */

const ontologyOptions = {
  domain: ["Textile", "Ceramic", "Metal", "Wood", "Natural Fiber"],
  function: ["Ritual", "Domestic", "Commercial", "Export"],
  transmission: ["Familial", "Apprenticeship", "Guild", "Informal"]
};

/* ---------- WIZARD ---------- */

function renderStep() {

  document.getElementById("step-indicator").innerText =
    `Step ${currentStep} of 6`;

  const content = document.getElementById("step-content");

  if (currentStep === 1) {
    content.innerHTML = `
      <h2>Craft Identification</h2>
      <input id="craft_name" placeholder="Craft Name"/>
      <select id="domain">${ontologyOptions.domain.map(d=>`<option>${d}</option>`)}</select>
      <select id="function">${ontologyOptions.function.map(f=>`<option>${f}</option>`)}</select>
    `;
  }

  if (currentStep === 2) {
    content.innerHTML = `
      <h2>Practitioner</h2>
      <input id="practitioner" placeholder="Name"/>
      <input id="community" placeholder="Community"/>
      <select id="transmission">${ontologyOptions.transmission.map(t=>`<option>${t}</option>`)}</select>
    `;
  }

  if (currentStep === 3) {
    content.innerHTML = `
      <h2>Materials</h2>
      <textarea id="materials"></textarea>
    `;
  }

  if (currentStep === 4) {
    content.innerHTML = `
      <h2>Process Steps</h2>
      <textarea id="step_desc"></textarea>
      <input type="file" id="step_img" accept="image/*" capture="environment"/>
      <button onclick="addProcessStep()">Add Step</button>
      <div id="step-list"></div>
    `;
    renderProcessList();
  }

  if (currentStep === 5) {
    content.innerHTML = `
      <h2>Consent</h2>
      <label>
        <input type="checkbox" id="consent_check">
        Verbal consent obtained
      </label>
      <canvas id="signature" width="300" height="100"></canvas>
      <button onclick="clearSignature()">Clear Signature</button>
    `;
    initSignature();
  }

  if (currentStep === 6) {
    content.innerHTML = `
      <h2>Finalize</h2>
      <p>Click Next to save record.</p>
    `;
  }
}

function nextStep() {

  if (currentStep === 1) {
    record.craft = { name: document.getElementById("craft_name").value };
    record.ontology.domain = document.getElementById("domain").value;
    record.ontology.function = document.getElementById("function").value;
  }

  if (currentStep === 2) {
    record.practitioner = {
      name: document.getElementById("practitioner").value,
      community: document.getElementById("community").value,
      transmission: document.getElementById("transmission").value
    };
  }

  if (currentStep === 3) {
    record.materials =
      document.getElementById("materials").value.split(",");
  }

  if (currentStep === 4) {
    record.process_steps = processSteps;
  }

  if (currentStep === 5) {
    record.consent = {
      given: document.getElementById("consent_check").checked,
      signature: document.getElementById("signature").toDataURL()
    };
  }

  if (currentStep === 6) {
    finalizeRecord();
    return;
  }

  currentStep++;
  renderStep();
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    renderStep();
  }
}

/* ---------- PROCESS STEPS ---------- */

function addProcessStep() {
  const desc = document.getElementById("step_desc").value;
  const file = document.getElementById("step_img").files[0];

  if (!desc || !file) return;

  compressImage(file, base64 => {
    processSteps.push({
      step_no: processSteps.length + 1,
      description: desc,
      image: base64
    });
    renderProcessList();
  });
}

function renderProcessList() {
  const list = document.getElementById("step-list");
  if (!list) return;

  list.innerHTML = processSteps.map(s => `
    <div>
      <strong>Step ${s.step_no}</strong>
      <p>${s.description}</p>
      <img src="${s.image}" width="100"/>
      <hr/>
    </div>
  `).join("");
}

/* ---------- SIGNATURE (TOUCH SAFE) ---------- */

function initSignature() {
  const canvas = document.getElementById("signature");
  const ctx = canvas.getContext("2d");
  let drawing = false;

  function start(e) {
    drawing = true;
    draw(e);
  }

  function end() {
    drawing = false;
    ctx.beginPath();
  }

  function draw(e) {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mouseup", end);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("touchstart", start);
  canvas.addEventListener("touchend", end);
  canvas.addEventListener("touchmove", draw);
}

function clearSignature() {
  const canvas = document.getElementById("signature");
  canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height);
}

/* ---------- SAVE ---------- */

async function finalizeRecord() {
  if (!record.craft.name) {
    alert("Craft name required.");
    return;
  }

  record.last_modified = new Date().toISOString();
  record.record_hash = await hashObject(record);

  saveRecord(record);
  alert("Record saved successfully.");
  goHome();
}

/* ---------- RECORD VIEW ---------- */

function viewRecords() {
  hideAll();
  document.getElementById("records-section").classList.remove("hidden");

  getAllRecords(records => {
    const container = document.getElementById("records-list");
    container.innerHTML = "";

    if (!records.length) {
      container.innerHTML = "<p>No saved records.</p>";
      return;
    }

    records.forEach(r => {
      const div = document.createElement("div");
      div.innerHTML = `
        <strong>${r.craft.name}</strong><br/>
        ${r.created_at}<br/>
        <button onclick='exportRecord(${JSON.stringify(r)})'>JSON</button>
        <button onclick='exportPDF(${JSON.stringify(r)})'>PDF</button>
        <button onclick="deleteRecord('${r.uuid}')">Delete</button>
        <hr/>
      `;
      container.appendChild(div);
    });
  });
}

function deleteRecord(uuid) {
  const tx = db.transaction(["records"], "readwrite");
  tx.objectStore("records").delete(uuid);
  tx.oncomplete = viewRecords;
}
