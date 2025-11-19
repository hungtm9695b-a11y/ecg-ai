// =======================
// CẤU HÌNH API BACKEND
// =======================
//
// TODO: Khi anh có backend, chỉ cần thay API_URL = "https://.../api";
// Nếu để chuỗi rỗng "", web sẽ dùng MOCK AI chạy ngay trên trình duyệt.

const API_URL = ""; // VD: "https://ecg-ai.your-backend.com/analyze"

let currentStep = 1;
const totalSteps = 4;
let ecgImageBase64 = null;

// DOM elements
const steps = [];
for (let i = 1; i <= totalSteps; i++) {
  steps[i] = document.getElementById(`step-${i}`);
}

const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const btnSubmit = document.getElementById("btn-submit");
const submitSpinner = document.getElementById("submit-spinner");
const submitText = document.getElementById("submit-text");

const ecgFileInput = document.getElementById("ecg-file");
const ecgPreviewContainer = document.getElementById("ecg-preview-container");
const ecgPreview = document.getElementById("ecg-preview");

// Result elements
const resultLoading = document.getElementById("result-loading");
const resultError = document.getElementById("result-error");
const resultSection = document.getElementById("result-section");
const riskChip = document.getElementById("risk-chip");
const priorityTier = document.getElementById("priority-tier");
const probabilityText = document.getElementById("probability-text");
const explainSafety = document.getElementById("explain-safety");
const explainRhythm = document.getElementById("explain-rhythm");
const explainIschemia = document.getElementById("explain-ischemia");
const recommendationsList = document.getElementById("recommendations");

// =======================
// STEP CONTROL
// =======================

function updateStepIndicator() {
  const stepItems = document.querySelectorAll(".step-item");
  const lines = [null, document.getElementById("line-1"), document.getElementById("line-2"), document.getElementById("line-3")];

  stepItems.forEach((item) => {
    const step = parseInt(item.getAttribute("data-step"), 10);
    item.classList.remove("active", "completed", "inactive");
    if (step < currentStep) {
      item.classList.add("completed");
    } else if (step === currentStep) {
      item.classList.add("active");
    } else {
      item.classList.add("inactive");
    }
  });

  for (let i = 1; i <= 3; i++) {
    if (!lines[i]) continue;
    if (currentStep > i + 1) {
      lines[i].classList.add("active");
    } else {
      lines[i].classList.remove("active");
    }
  }
}

function showStep(step) {
  for (let i = 1; i <= totalSteps; i++) {
    steps[i].classList.remove("active");
  }
  steps[step].classList.add("active");

  // buttons
  btnPrev.disabled = step === 1;
  btnNext.classList.toggle("d-none", step === totalSteps);
  btnSubmit.classList.toggle("d-none", step !== totalSteps);

  updateStepIndicator();
}

function validateStep1() {
  const age = document.getElementById("patient-age").value.trim();
  const sex = document.getElementById("patient-sex").value;
  const bp = document.getElementById("bp").value.trim();
  const hr = document.getElementById("heart-rate").value.trim();
  const rr = document.getElementById("resp-rate").value.trim();
  const spo2 = document.getElementById("spo2").value.trim();
  const consciousness = document.getElementById("consciousness").value;

  if (!age || !sex || !bp || !hr || !rr || !spo2 || !consciousness) {
    alert("Vui lòng nhập đầy đủ thông tin và dấu hiệu sinh tồn ở bước 1.");
    return false;
  }

  if (!bp.includes("/")) {
    alert("Huyết áp cần nhập dạng tâm thu/tâm trương. Ví dụ: 120/70");
    return false;
  }

  return true;
}

function validateStep2() {
  if (!ecgFileInput.files || ecgFileInput.files.length === 0) {
    alert("Vui lòng chọn ít nhất một ảnh ECG ở bước 2.");
    return false;
  }
  if (!ecgImageBase64) {
    alert("Ảnh ECG đang được xử lý, vui lòng chờ 1–2 giây rồi thử lại.");
    return false;
  }
  return true;
}

function validateStep3() {
  // ít nhất một triệu chứng được chọn "Có" hoặc "Không" (mỗi câu đều phải chọn)
  for (let i = 1; i <= 6; i++) {
    const yes = document.querySelector(`input[name="sym${i}"][value="yes"]`);
    const no = document.querySelector(`input[name="sym${i}"][value="no"]`);
    if (!yes.checked && !no.checked) {
      alert(`Vui lòng trả lời câu hỏi số ${i} ở phần triệu chứng.`);
      return false;
    }
  }

  return true;
}

// Step navigation
btnPrev.addEventListener("click", () => {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
  }
});

btnNext.addEventListener("click", () => {
  if (currentStep === 1 && !validateStep1()) return;
  if (currentStep === 2 && !validateStep2()) return;
  if (currentStep === 3 && !validateStep3()) return;

  if (currentStep < totalSteps) {
    currentStep++;
    showStep(currentStep);
  }
});

// =======================
// ECG IMAGE TO BASE64
// =======================

ecgFileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Vui lòng chọn file ảnh (JPG, PNG, ...).");
    ecgFileInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    ecgImageBase64 = e.target.result; // data:image/..;base64,...
    ecgPreview.src = ecgImageBase64;
    ecgPreviewContainer.classList.remove("d-none");
  };
  reader.readAsDataURL(file);
});

// =======================
// THU THẬP DỮ LIỆU TỪ FORM
// =======================

function collectFormData() {
  // patient info
  const name = document.getElementById("patient-name").value.trim();
  const age = parseInt(document.getElementById("patient-age").value.trim(), 10);
  const sex = document.getElementById("patient-sex").value;

  const bp = document.getElementById("bp").value.trim();
  let sbp = null;
  let dbp = null;
  try {
    const [sbpStr, dbpStr] = bp.split("/");
    sbp = parseInt(sbpStr.trim(), 10);
    dbp = parseInt(d
