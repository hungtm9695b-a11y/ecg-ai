async function goiAI() {
  const apiKey = document.getElementById("apiKey").value.trim();
  const ecg = document.getElementById("ecg").value;
  const symptom = document.getElementById("symptom").value;

  if (!apiKey) {
    alert("Bác phải nhập API key trước.");
    return;
  }

  document.getElementById("output").innerText = "⏳ Đang gọi AI…";

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Bạn là bác sĩ tim mạch hỗ trợ phân tích ECG và triệu chứng." },
          { role: "user", content: `ECG: ${ecg}\nTriệu chứng: ${symptom}\nHãy phân tích nguy cơ thiếu máu cơ tim và gợi ý xử trí.` }
        ]
      })
    });

    const data = await res.json();

    document.getElementById("output").innerText =
      JSON.stringify(data, null, 2);

  } catch (err) {
    document.getElementById("output").innerText =
      "❌ Lỗi kết nối: " + err.message;
  }
}
