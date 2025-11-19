from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, List, Optional

app = FastAPI(title="ECG Ischemia AI Demo Backend")


# ====== ĐỊNH NGHĨA DỮ LIỆU NHẬN TỪ FRONTEND ======

class Patient(BaseModel):
    name: Optional[str] = None
    age: int
    sex: str  # "male" | "female" | "other"


class Vitals(BaseModel):
    sbp: Optional[int] = None
    dbp: Optional[int] = None
    hr: Optional[int] = None
    rr: Optional[int] = None
    spo2: Optional[int] = None
    consciousness: Optional[str] = None  # "alert" | "drowsy" | "coma"


class RiskFactors(BaseModel):
    htn: bool = False
    dm: bool = False
    smoke: bool = False
    lipid: bool = False
    cad: bool = False


class Symptoms(BaseModel):
    sym1: bool = False
    sym2: bool = False
    sym3: bool = False
    sym4: bool = False
    sym5: bool = False
    sym6: bool = False


class AnalyzeRequest(BaseModel):
    patient: Patient
    vitals: Vitals
    ecgImage: Optional[str] = None  # base64 string, demo chưa dùng
    symptoms: Symptoms
    riskFactors: RiskFactors


# ====== HÀM TÍNH HEAR (DEMO, GIỐNG LOGIC TRÊN FRONTEND) ======

def compute_hear_score(req: AnalyzeRequest, probability: int, is_critical: bool):
    age = req.patient.age
    symptoms = req.symptoms
    risk = req.riskFactors

    # H – History: dựa trên số triệu chứng "Có"
    typical_count = sum(
        1 for v in [
            symptoms.sym1, symptoms.sym2, symptoms.sym3,
            symptoms.sym4, symptoms.sym5, symptoms.sym6
        ] if v
    )

    if typical_count <= 2:
        H = 0
    elif typical_count <= 4:
        H = 1
    else:
        H = 2

    # A – Age
    if age >= 65:
        A = 2
    elif age >= 45:
        A = 1
    else:
        A = 0

    # R – Risk factors
    rf_list = [risk.htn, risk.dm, risk.smoke, risk.lipid, risk.cad]
    rf_count = sum(1 for v in rf_list if v)

    if rf_count == 0:
        R = 0
    elif rf_count <= 2:
        R = 1
    else:
        R = 2

    # E – ECG: demo dựa trên probability + tình trạng nguy kịch
    if is_critical or probability > 60:
        E = 2
    elif probability >= 20:
        E = 1
    else:
        E = 0

    total = H + E + A + R

    if total <= 1:
        hear_risk = "Rất thấp (0–1)"
    elif total <= 3:
        hear_risk = "Thấp–trung bình (2–3)"
    elif total <= 6:
        hear_risk = "Trung bình–cao (4–6)"
    else:
        hear_risk = "Rất cao (7–8)"

    return {
        "total": total,
        "H": H,
        "E": E,
        "A": A,
        "R": R,
        "hearRisk": hear_risk
    }


# ====== MOCK AI LOGIC (GIỐNG APP.JS) ======

def mock_analyze(req: AnalyzeRequest) -> Dict:
    v = req.vitals

    # Tầng 0: AI Safety
    is_critical = False
    safety_explanation = "Không ghi nhận dấu hiệu sinh tồn nguy kịch rõ rệt."

    if (
        (v.sbp is not None and v.sbp < 90) or
        (v.hr is not None and (v.hr < 40 or v.hr > 140)) or
        (v.rr is not None and v.rr > 30) or
        (v.spo2 is not None and v.spo2 < 90) or
        (v.consciousness is not None and v.consciousness != "alert")
    ):
        is_critical = True
        safety_explanation = (
            "Có ít nhất một dấu hiệu sinh tồn nguy kịch (HA thấp, nhịp tim bất thường, "
            "SpO₂ thấp hoặc tri giác thay đổi)."
        )

    # Tầng 1: Rhythm – demo
    rhythm_dangerous = False
    rhythm_explanation = (
        "Chưa phát hiện rối loạn nhịp nguy hiểm trong mô hình thử nghiệm "
        "(demo chưa đọc ECG thật)."
    )

    # Tầng 2: Ischemia – dựa trên triệu chứng + yếu tố nguy cơ
    ischemia_score = 0.0

    for v_sym in [
        req.symptoms.sym1, req.symptoms.sym2, req.symptoms.sym3,
        req.symptoms.sym4, req.symptoms.sym5, req.symptoms.sym6
    ]:
        if v_sym:
            ischemia_score += 1.5

    for v_rf in [
        req.riskFactors.htn, req.riskFactors.dm, req.riskFactors.smoke,
        req.riskFactors.lipid, req.riskFactors.cad
    ]:
        if v_rf:
            ischemia_score += 1.0

    probability = int(min(100, round(ischemia_score * 10)))

    risk_level = "Thấp"
    risk_color_key = "low"
    recs: List[str] = []

    if is_critical:
        risk_level = "Nguy kịch"
        risk_color_key = "critical"
        probability = max(probability, 80)
        recs.append(
            "Ưu tiên đảm bảo ABC, đặt đường truyền, thở oxy, chuyển tuyến cấp cứu có can thiệp."
        )
        recs.append(
            "Gọi hỗ trợ cấp cứu nội viện nếu tại khoa cấp cứu."
        )
    elif probability > 60:
        risk_level = "Cao"
        risk_color_key = "high"
        recs.append(
            "Chuyển tuyến hoặc hội chẩn tim mạch càng sớm càng tốt, cân nhắc nhập viện theo dõi."
        )
        recs.append(
            "Làm thêm xét nghiệm men tim (troponin) nếu có điều kiện, theo dõi ECG lặp lại."
        )
    elif 20 <= probability <= 60:
        risk_level = "Trung bình"
        risk_color_key = "medium"
        recs.append(
            "Theo dõi sát triệu chứng, cân nhắc làm thêm xét nghiệm và ECG lặp lại."
        )
        recs.append(
            "Tư vấn thay đổi lối sống và kiểm soát tốt các yếu tố nguy cơ tim mạch."
        )
    else:
        risk_level = "Thấp"
        risk_color_key = "low"
        recs.append(
            "Có thể theo dõi ngoại trú, dặn bệnh nhân quay lại ngay nếu đau ngực tái phát hoặc nặng lên."
        )
        recs.append(
            "Tiếp tục kiểm soát huyết áp, đường máu, lipid máu và bỏ thuốc lá nếu có."
        )

    ischemia_explanation = (
        f"Dựa trên tổng số triệu chứng và yếu tố nguy cơ, điểm thiếu máu cơ tim ước tính "
        f"tương ứng với xác suất khoảng {probability}%. "
    )
    if probability < 20:
        ischemia_explanation += "Nguy cơ thấp."
    elif probability <= 60:
        ischemia_explanation += "Nguy cơ trung bình."
    else:
        ischemia_explanation += "Nguy cơ cao."

    priority = (
        "Ưu tiên sinh tồn / rối loạn nhịp"
        if (is_critical or rhythm_dangerous)
        else "Tập trung đánh giá thiếu máu cơ tim"
    )

    # HEAR score (demo)
    hear = compute_hear_score(req, probability, is_critical)

    # ECG details (demo)
    if is_critical or probability > 60:
        ecg_category = (
            "ECG nghi ngờ thiếu máu cơ tim cấp hoặc biến đổi đáng kể, "
            "cần đối chiếu lâm sàng và xét nghiệm (demo)."
        )
        ecg_summary = (
            "Demo: ECG có bất thường gợi ý thiếu máu cơ tim (ví dụ ST chênh hoặc T thay đổi), "
            "cần kết hợp triệu chứng và men tim. Đây chỉ là mô phỏng giao diện, "
            "không phải kết quả đọc ECG thật."
        )
    elif probability >= 20:
        ecg_category = (
            "ECG có thể có thay đổi không đặc hiệu, cần theo dõi và so sánh thêm (demo)."
        )
        ecg_summary = (
            "Demo: ECG có thể có thay đổi nhẹ, chưa đủ để khẳng định thiếu máu cơ tim. "
            "Mô tả chi tiết sẽ do backend AI trả về trong bản triển khai thật."
        )
    else:
        ecg_category = "ECG không gợi ý rõ thiếu máu cơ tim cấp (demo)."
        ecg_summary = (
            "Demo: mô tả chi tiết ECG (nhịp, trục, ST-T, block, rối loạn dẫn truyền...) "
            "sẽ hiển thị ở đây khi mô hình AI đọc ECG hoàn chỉnh."
        )

    return {
        "riskLevel": risk_level,
        "riskColorKey": risk_color_key,
        "probability": probability,
        "messages": {
            "safety": safety_explanation,
            "rhythm": rhythm_explanation,
            "ischemia": ischemia_explanation,
        },
        "priorityTier": priority,
        "recommendations": recs,
        "hear": hear,
        "ecgDetails": {
            "summary": ecg_summary,
            "category": ecg_category,
        },
    }


# ====== ROUTE API CHÍNH ======

@app.post("/analyze")
def analyze_endpoint(req: AnalyzeRequest):
    """
    API chính nhận dữ liệu từ web frontend và trả kết quả phân tích demo.
    Sau này có AI thật thì thay phần mock_analyze bằng gọi model.
    """
    result = mock_analyze(req)
    return result


@app.get("/")
def root():
    return {"message": "ECG AI backend is running. Use POST /analyze"}
