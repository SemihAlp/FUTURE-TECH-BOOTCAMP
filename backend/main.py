from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from gradio_client import Client, handle_file
import shutil
import os
import uuid

app = FastAPI()

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Statik dosyalar (üretilen sonuçları serve etmek için) ───────────────────
RESULTS_DIR = "results"
os.makedirs(RESULTS_DIR, exist_ok=True)
app.mount("/results", StaticFiles(directory=RESULTS_DIR), name="results")

# ─── Temp klasörü ────────────────────────────────────────────────────────────
TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

# ─── Hugging Face Model Bağlantısı ──────────────────────────────────────────
print("[*] Yapay Zeka Modeli Yukleniyor... Lutfen bekleyin.")
try:
    client = Client("yisol/IDM-VTON")
    print("[OK] Model Hazir! Istekler bekleniyor...")
except Exception as e:
    print(f"[HATA] Model baglantisi kurulamadi: {e}")
    client = None


@app.post("/generate")
async def generate_tryon(
    person_img: UploadFile = File(...),
    garment_img: UploadFile = File(...)
):
    if client is None:
        return {"status": "error", "message": "AI modeli şu an kullanılamıyor."}

    print(f"[INFO] Fotograflar geldi: {person_img.filename} ve {garment_img.filename}")

    # Benzersiz isimlerle geçici dosyalara kaydet
    uid = uuid.uuid4().hex[:8]
    person_path = os.path.join(TEMP_DIR, f"{uid}_person_{person_img.filename}")
    garment_path = os.path.join(TEMP_DIR, f"{uid}_garment_{garment_img.filename}")

    with open(person_path, "wb") as buffer:
        shutil.copyfileobj(person_img.file, buffer)
    with open(garment_path, "wb") as buffer:
        shutil.copyfileobj(garment_img.file, buffer)

    try:
        print("[AI] Yapay zekaya gonderiliyor, bu islem 10-30 saniye surebilir...")

        person_img_input = {
            "background": handle_file(person_path),
            "layers": [],
            "composite": None
        }
        
        result = client.predict(
            dict=person_img_input,
            garm_img=handle_file(garment_path),
            garment_des="a t-shirt",
            is_checked=True,
            is_checked_crop=False,
            denoise_steps=30,
            seed=42,
            api_name="/tryon"
        )

        # result[0] → üretilen resmin geçici yolu (Gradio tmp dizininde)
        result_image_path = result[0]
        print(f"[OK] AI sonucu geldi: {result_image_path}")

        # Sonucu results/ klasörüne kopyala (serve edebilmek için)
        result_filename = f"{uid}_result.png"
        final_path = os.path.join(RESULTS_DIR, result_filename)
        shutil.copy(result_image_path, final_path)

        # Geçici dosyaları temizle
        os.remove(person_path)
        os.remove(garment_path)

        # Frontend'e erişilebilir URL döndür
        result_url = f"http://localhost:8000/results/{result_filename}"
        print(f"[OK] Islem Basarili! Sonuc: {result_url}")

        return {"status": "success", "result_image": result_url}

    except Exception as e:
        print(f"[HATA] HATA OLUSTU: {e}")
        # Hata durumunda da geçici dosyaları temizle
        for p in [person_path, garment_path]:
            if os.path.exists(p):
                os.remove(p)
        return {"status": "error", "message": str(e)}