// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8000";

// ─── DOM ──────────────────────────────────────────────────────────────────────
const dropZone     = document.getElementById('dropZone');
const fileInput    = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const resultArea   = document.getElementById('resultArea');
const revealedMsg  = document.getElementById('revealedMessage');
const loader       = document.getElementById('loader');
const uploadText   = document.getElementById('uploadText');
const resultLabel  = document.getElementById('resultLabel');
const decodeModeBtn = document.getElementById('decodeMode');
const encodeModeBtn = document.getElementById('encodeMode');
const msgInputGroup = document.getElementById('messageInputGroup');
const secretInput   = document.getElementById('secretMessage');
const apiDot        = document.getElementById('apiDot');
const apiStatus     = document.getElementById('apiStatus');

let currentMode = 'decode';

// ─── API Health Check ─────────────────────────────────────────────────────────
async function checkAPI() {
  try {
    const res = await fetch(`${API_BASE}/`);
    if (res.ok) {
      apiDot.className = 'dot online';
      apiStatus.textContent = 'Python backend connected';
    } else throw new Error();
  } catch {
    apiDot.className = 'dot offline';
    apiStatus.textContent = 'Backend offline — run: uvicorn api:app --reload';
  }
}
checkAPI();
setInterval(checkAPI, 10000);

// ─── Mode Switch ──────────────────────────────────────────────────────────────
decodeModeBtn.addEventListener('click', () => setMode('decode'));
encodeModeBtn.addEventListener('click', () => setMode('encode'));

function setMode(mode) {
  currentMode = mode;
  decodeModeBtn.classList.toggle('active', mode === 'decode');
  encodeModeBtn.classList.toggle('active', mode === 'encode');
  msgInputGroup.style.display = mode === 'encode' ? 'block' : 'none';
  uploadText.textContent = mode === 'decode' ? 'Upload Image to Decode' : 'Upload Base Image to Encode';
  resultArea.style.display = 'none';
}

// ─── Drag & Drop ──────────────────────────────────────────────────────────────
['dragenter', 'dragover'].forEach(ev =>
  dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('dragover'); })
);
['dragleave', 'drop'].forEach(ev =>
  dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('dragover'); })
);
dropZone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
fileInput.addEventListener('change', e => handleFiles(e.target.files));

// ─── File Handler ─────────────────────────────────────────────────────────────
function handleFiles(files) {
  const file = files[0];
  if (!file || !file.type.startsWith('image/')) {
    showError('Please upload a PNG or JPG image.');
    return;
  }
  if (currentMode === 'encode' && !secretInput.value.trim()) {
    alert('Please enter a secret message first!');
    return;
  }

  // Show preview
  const reader = new FileReader();
  reader.onload = e => {
    imagePreview.src = e.target.result;
    imagePreview.style.display = 'block';
  };
  reader.readAsDataURL(file);

  if (currentMode === 'decode') {
    callDecode(file);
  } else {
    callEncode(file, secretInput.value.trim());
  }
}

// ─── API: Decode ──────────────────────────────────────────────────────────────
async function callDecode(file) {
  setLoading(true);
  const form = new FormData();
  form.append('image', file);

  try {
    const res = await fetch(`${API_BASE}/decode`, { method: 'POST', body: form });
    const json = await res.json();

    if (json.error) { showError(json.error); return; }

    resultLabel.textContent = 'REVEALED MESSAGE';
    if (json.message) {
      revealedMsg.innerHTML = `
        <div class="result-item">
          <span class="result-tag">RGB-LSB (Python Backend)</span>
          <span class="result-value">${escHtml(json.message)}</span>
        </div>`;
    } else {
      revealedMsg.innerHTML = '<span style="color:var(--dim)">No hidden message found in this image.</span>';
    }
    resultArea.style.display = 'block';
  } catch {
    showError('Cannot reach backend. Make sure it is running:<br><code>uvicorn api:app --reload</code>');
  } finally {
    setLoading(false);
  }
}

// ─── API: Encode ──────────────────────────────────────────────────────────────
async function callEncode(file, message) {
  setLoading(true);
  const form = new FormData();
  form.append('image', file);
  form.append('message', message);

  try {
    const res = await fetch(`${API_BASE}/encode`, { method: 'POST', body: form });

    if (!res.ok) {
      const json = await res.json();
      showError(json.error || 'Encoding failed.');
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    resultLabel.textContent = 'ENCODING SUCCESS';
    revealedMsg.innerHTML = `
      <div class="result-item">
        <span class="result-tag">STATUS</span>
        <span class="result-value">Message hidden via Python backend!</span>
      </div>
      <a class="download-btn" href="${url}" download="hidden_secret.png">💾 Download Secret Image</a>`;
    resultArea.style.display = 'block';
  } catch {
    showError('Cannot reach backend. Make sure it is running:<br><code>uvicorn api:app --reload</code>');
  } finally {
    setLoading(false);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setLoading(state) {
  loader.style.display = state ? 'block' : 'none';
  if (state) resultArea.style.display = 'none';
}

function showError(msg) {
  resultLabel.textContent = 'ERROR';
  revealedMsg.innerHTML = `<span class="error-text">${msg}</span>`;
  resultArea.style.display = 'block';
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
