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
    dbp = parseInt(dbpStr.trim(), 10);
  } catch (e) {
    // đã kiểm tra ở bước validateStep1
  }

  const hr = parseInt(document.getElementById("heart-rate").value.trim(), 10);
  const rr = parseInt(document.getElementById("resp-rate").value.trim(), 10);
  const spo2 = parseInt(document.getElementById("spo2").value.trim(), 10);
  const consciousness = document.getElementById("consciousness").value;

  // symptoms
  const symptoms = {};
  for (let i = 1; i <= 6; i++) {
    const val = document.querySelector(`input[name="sym${i}"]:checked`)?.value;
    symptoms[`sym${i}`] = val === "yes";
  }

  // risk factors
  const riskFactors = {
    htn: document.getElementById("rf-htn").checked,
    dm: document.getElementById("rf-dm").checked,
    smoke: document.getElementById("rf-smoke").checked,
    lipid: document.getElementById("rf-lipid").checked,
    cad: document.getElementById("rf-cad").checked,
  };

  return {
    patient: { name, age, sex },
    vitals: { sbp, dbp, hr, rr, spo2, consciousness },
    ecgImage: ecgImageBase64,
    symptoms,
    riskFactors,
  };
}

// =======================
// MOCK AI – CHẠY TRÊN TRÌNH DUYỆT
// =======================

function mockAnalyze(data) {
  // Tầng 0: Safety
  let isCritical = false;
  let safetyExplanation = "Không ghi nhận dấu hiệu sinh tồn nguy kịch rõ rệt.";

  const { sbp, hr, rr, spo2, consciousness } = data.vitals;

  if (
    (sbp && sbp < 90) ||
    (hr && (hr < 40 || hr > 140)) ||
    (rr && rr > 30) ||
    (spo2 && spo2 < 90) ||
    (consciousness && consciousness !== "alert")
  ) {
    isCritical = true;
    safetyExplanation =
      "Có ít nhất một dấu hiệu sinh tồn nguy kịch (HA thấp, nhịp tim bất thường, SpO₂ thấp hoặc tri giác thay đổi).";
  }

  // Tầng 1: Rhythm – mock đơn giản
  let rhythmDangerous = false;
  let rhythmExplanation =
    "Chưa phát hiện rối loạn nhịp nguy hiểm trong mô hình thử nghiệm (demo chưa đọc ECG thật).";

  // Tầng 2: Ischemia – dựa trên triệu chứng + yếu tố nguy cơ
  let ischemiaScore = 0;
  Object.values(data.symptoms).forEach((v) => {
    if (v) ischemiaScore += 1.5; // mỗi triệu chứng 'có' +1.5
  });
  Object.values(data.riskFactors).forEach((v) => {
    if (v) ischemiaScore += 1.0; // mỗi yếu tố nguy cơ +1
  });

  // Chuẩn hóa ra xác suất 0-100 (demo)
  let probability = Math.round(Math.min(100, ischemiaScore * 10));

  let riskLevel = "Thấp";
  let riskColorKey = "low";
  let recs = [];

  if (isCritical) {
    riskLevel = "Nguy kịch";
    riskColorKey = "critical";
    probability = Math.max(probability, 80);
    recs.push(
      "Ưu tiên đảm bảo ABC, đặt đường truyền, thở oxy, chuyển tuyến cấp cứu có can thiệp."
    );
    recs.push(
      "Gọi hỗ trợ cấp cứu nội viện (Code Blue) nếu tại khoa cấp cứu."
    );
  } else if (probability > 60) {
    riskLevel = "Cao";
    riskColorKey = "high";
    recs.push(
      "Chuyển tuyến hoặc hội chẩn tim mạch càng sớm càng tốt, cân nhắc nhập viện theo dõi."
    );
    recs.push(
      "Làm thêm xét nghiệm men tim (troponin) nếu có điều kiện, theo dõi ECG lặp lại."
    );
  } else if (probability >= 20) {
    riskLevel = "Trung bình";
    riskColorKey = "medium";
    recs.push(
      "Theo dõi sát triệu chứng, cân nhắc làm thêm xét nghiệm và ECG lặp lại."
    );
    recs.push(
      "Tư vấn thay đổi lối sống và kiểm soát tốt các yếu tố nguy cơ tim mạch."
    );
  } else {
    riskLevel = "Thấp";
    riskColorKey = "low";
    recs.push(
      "Có thể theo dõi ngoại trú, dặn bệnh nhân quay lại ngay nếu đau ngực tái phát hoặc nặng lên."
    );
    recs.push(
      "Tiếp tục kiểm soát huyết áp, đường máu, lipid máu và bỏ thuốc lá nếu có."
    );
  }

  let ischemiaExplanation = `Dựa trên tổng số triệu chứng và yếu tố nguy cơ, điểm thiếu máu cơ tim ước tính tương ứng với xác suất khoảng ${probability}%.`;
  if (probability < 20) {
    ischemiaExplanation += " Nguy cơ thấp.";
  } else if (probability <= 60) {
    ischemiaExplanation += " Nguy cơ trung bình.";
  } else {
    ischemiaExplanation += " Nguy cơ cao.";
  }

  const priority =
    isCritical || rhythmDangerous
      ? "Ưu tiên sinh tồn / rối loạn nhịp"
      : "Tập trung đánh giá thiếu máu cơ tim";

  return {
    riskLevel,
    riskColorKey,
    probability,
    messages: {
      safety: safetyExplanation,
      rhythm: rhythmExplanation,
      ischemia: ischemiaExplanation,
    },
    priorityTier: priority,
    recommendations: recs,
  };
}

// =======================
// GỌI API (THẬT HOẶC MOCK)
// =======================

async function analyzeWithAI(payload) {
  if (!API_URL) {
    // Không có backend ⇒ dùng mock
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockAnalyze(payload));
      }, 800); // giả lập thời gian chờ
    });
  }

  // Có backend ⇒ gọi fetch
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("API trả về lỗi HTTP " + response.status);
  }

  // NOTE: Cần thống nhất format JSON trả về từ backend cho giống mockAnalyze
  const result = await response.json();
  return result;
}

// =======================
// HIỂN THỊ KẾT QUẢ
// =======================

function renderResult(result) {
  resultSection.classList.remove("d-none");
  resultError.classList.add("d-none");

  // risk chip
  riskChip.textContent = `Nguy cơ: ${result.riskLevel}`;
  riskChip.className = "risk-chip";
  if (result.riskColorKey === "low") riskChip.classList.add("risk-low");
  else if (result.riskColorKey === "medium")
    riskChip.classList.add("risk-medium");
  else if (result.riskColorKey === "high")
    riskChip.classList.add("risk-high");
  else if (result.riskColorKey === "critical")
    riskChip.classList.add("risk-critical");

  probabilityText.textContent = `${result.probability}%`;
  priorityTier.textContent = result.priorityTier || "";

  explainSafety.textContent = result.messages?.safety || "";
  explainRhythm.textContent = result.messages?.rhythm || "";
  explainIschemia.textContent = result.messages?.ischemia || "";

  // recommendations
  recommendationsList.innerHTML = "";
  (result.recommendations || []).forEach((rec) => {
    const li = document.createElement("li");
    li.textContent = rec;
    recommendationsList.appendChild(li);
  });
}

// =======================
// SUBMIT
// =======================

btnSubmit.addEventListener("click", async () => {
  // đảm bảo dữ liệu hợp lệ lần cuối
  if (!validateStep1() || !validateStep2() || !validateStep3()) {
    currentStep = 1;
    showStep(1);
    return;
  }

  const payload = collectFormData();

  // UI loading
  resultSection.classList.add("d-none");
  resultError.classList.add("d-none");
  resultLoading.classList.remove("d-none");
  submitSpinner.classList.remove("d-none");
  submitText.textContent = "Đang phân tích...";

  try {
    const result = await analyzeWithAI(payload);
    renderResult(result);
  } catch (err) {
    console.error(err);
    resultError.textContent =
      "Không gọi được API AI. Vui lòng kiểm tra lại đường dẫn backend hoặc thử lại sau.";
    resultError.classList.remove("d-none");
  } finally {
    resultLoading.classList.add("d-none");
    submitSpinner.classList.add("d-none");
    submitText.textContent = "Gửi AI phân tích";
  }
});

// init
showStep(currentStep);
