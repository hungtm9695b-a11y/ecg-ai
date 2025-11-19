function goToStep(step) {
  for (let i = 1; i <= 4; i++) {
    document.getElementById("step" + i).classList.add("hidden");
  }
  document.getElementById("step" + step).classList.remove("hidden");
}

// =========================
// GỌI BACKEND AI ECG
// =========================

document.getElementById("ecgFile").addEventListener("change", async function () {
  const file = this.files[0];
  if (!file) return;

  // Hiển thị preview
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById("ecgPreview").innerHTML =
      `<img src="${e.target.result}" style="max-width:100%; border-radius:6px;">`;
  };
  reader.readAsDataURL(file);

  await callBackend(file);
});

async function callBackend(file) {
  const API_URL = "https://your-backend.com/api/ecg-analyze"; // IT sửa URL

  document.getElementById("ecgStatus").innerText = "Đang chạy AI backend...";

  const form = new FormData();
  form.append("file", file);

  try {
    const res = await fetch(API_URL, { method: "POST", body: form });
    const data = await res.json();

    document.getElementById("ecgIschemia").checked = data.ischemia;
    document.getElementById("ecgDangerousRhythm").checked = data.dangerous_arrhythmia;
    document.getElementById("ecgOtherAbnormal").checked = data.other_abnormal.length > 0;

    document.getElementById("ecgStatus").innerText =
      `AI: Ischemia=${data.ischemia}, Danger=${data.dangerous_arrhythmia}`;
  } catch (e) {
    document.getElementById("ecgStatus").innerText =
      "Lỗi gọi API backend";
  }
}

// =========================
// PHÂN TẦNG AI
// =========================

function calculateResult() {
  const age = parseInt(document.getElementById("patientAge").value);
  const sbp = parseInt(document.getElementById("bp").value);
  const hr = parseInt(document.getElementById("hr").value);
  const spo2 = parseInt(document.getElementById("spo2").value);

  const ischemia = document.getElementById("ecgIschemia").checked;
  const arrhythmia = document.getElementById("ecgDangerousRhythm").checked;

  const symptoms = document.querySelectorAll(".symptom:checked").length;
  const risks = document.querySelectorAll(".risk:checked").length;

  let result = "";

  // TẦNG 1: Sinh tồn
  if (sbp < 90 || hr < 40 || hr > 140 || spo2 < 90) {
    result = "TÌNH TRẠNG NGUY KỊCH – Cấp cứu ngay";
  }
  // TẦNG 2: Nhịp nguy hiểm
  else if (arrhythmia) {
    result = "RỐI LOẠN NHỊP NGUY HIỂM – Chuyển tuyến";
  }
  // TẦNG 3: Thiếu máu cơ tim
  else {
    let score = (ischemia ? 4 : 0) + symptoms + risks * 0.5;
    let prob = score / 10;

    if (prob < 0.2) result = "Nguy cơ thấp (≈ " + Math.round(prob * 100) + "%)";
    else if (prob < 0.6) result = "Nguy cơ trung bình (≈ " + Math.round(prob * 100) + "%)";
    else result = "Nguy cơ cao (≈ " + Math.round(prob * 100) + "%)";
  }

  document.getElementById("resultBox").innerText = result;

  // HEAR score
  const H = symptoms <= 2 ? 0 : (symptoms <= 4 ? 1 : 2);
  const E = ischemia ? 2 : 0;
  const A = age < 45 ? 0 : (age < 65 ? 1 : 2);
  const R = risks <= 2 ? 1 : 2;

  const HEAR = H + E + A + R;

  document.getElementById("hearBox").innerText = "HEAR: " + HEAR + "/8";

  goToStep(4);
}

function resetAll() {
  window.location.reload();
}
