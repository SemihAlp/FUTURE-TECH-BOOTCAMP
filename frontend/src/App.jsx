import { useState, useRef } from 'react';

const PERSON_SLOTS = [
  { label: 'Ön', icon: '🧍' },
  { label: 'Arka', icon: '🔄' },
  { label: 'Sol', icon: '⬅️' },
  { label: 'Sağ', icon: '➡️' },
];

function App() {
  const [personImages, setPersonImages] = useState([null, null, null, null]);
  const [personPreviews, setPersonPreviews] = useState([null, null, null, null]);
  const [garmentImage, setGarmentImage] = useState(null);
  const [garmentPreview, setGarmentPreview] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const personRefs = useRef([null, null, null, null]);
  const garmentRef = useRef(null);

  const handlePersonImage = (index, file) => {
    if (!file) return;
    const newImages = [...personImages];
    newImages[index] = file;
    setPersonImages(newImages);

    const newPreviews = [...personPreviews];
    newPreviews[index] = URL.createObjectURL(file);
    setPersonPreviews(newPreviews);
  };

  const handleGarmentImage = (file) => {
    if (!file) return;
    setGarmentImage(file);
    setGarmentPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!personImages[0] || !garmentImage) {
      setError('Lütfen en az ön açı fotoğrafınızı ve kıyafet fotoğrafını yükleyin.');
      return;
    }

    setLoading(true);
    setError(null);
    setResultImage(null);

    const formData = new FormData();
    formData.append('person_img', personImages[0]);
    formData.append('garment_img', garmentImage);

    try {
      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.status === 'success') {
        setResultImage(data.result_image);
      } else {
        setError(data.message || 'Bir hata oluştu.');
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı. Backend çalışıyor mu? ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center py-10 px-4"
         style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* Header */}
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
          ✨ Sanal Giyinme Odası
        </h1>
        <p className="text-slate-400 mt-3 text-lg">
          Fotoğrafınızı ve kıyafeti yükleyin — yapay zekâ sizin için giydirsin!
        </p>
      </header>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Kişi Fotoğrafları (4 Yön) ─── */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center transition-all hover:border-indigo-500/30">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">👤</span> Kendi Fotoğrafınız
          </h2>
          <div className="w-full grid grid-cols-2 gap-3">
            {PERSON_SLOTS.map((slot, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  onClick={() => personRefs.current[index]?.click()}
                  className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-slate-600 hover:border-indigo-400 cursor-pointer flex items-center justify-center overflow-hidden transition-all bg-slate-800/50 hover:bg-slate-800/80"
                >
                  {personPreviews[index] ? (
                    <img src={personPreviews[index]} alt={slot.label} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="text-center text-slate-500 p-2">
                      <div className="text-2xl mb-1">{slot.icon}</div>
                      <p className="text-xs">{slot.label}</p>
                    </div>
                  )}
                </div>
                <input
                  ref={(el) => (personRefs.current[index] = el)}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePersonImage(index, e.target.files[0])}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-3">* En az Ön açı zorunlu</p>
        </div>

        {/* ─── Kıyafet Fotoğrafı ─── */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center transition-all hover:border-purple-500/30">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">👕</span> Kıyafet Görseli
          </h2>
          <div
            onClick={() => garmentRef.current?.click()}
            className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-slate-600 hover:border-purple-400 cursor-pointer flex items-center justify-center overflow-hidden transition-all bg-slate-800/50 hover:bg-slate-800/80"
          >
            {garmentPreview ? (
              <img src={garmentPreview} alt="Kıyafet" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="text-center text-slate-500 p-4">
                <div className="text-4xl mb-2">👗</div>
                <p className="text-sm">Tıklayarak kıyafet yükleyin</p>
                <p className="text-xs text-slate-600 mt-1">Arka plan temiz olursa daha iyi sonuç verir</p>
              </div>
            )}
          </div>
          <input
            ref={garmentRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleGarmentImage(e.target.files[0])}
          />
        </div>

        {/* ─── Sonuç Alanı ─── */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center transition-all">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🪄</span> Sonuç
          </h2>
          <div className="w-full aspect-[3/4] rounded-xl border border-slate-700 flex items-center justify-center overflow-hidden bg-slate-800/50">
            {loading ? (
              <div className="text-center p-6">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-indigo-300 font-medium">Yapay zekâ çalışıyor...</p>
                <p className="text-slate-500 text-sm mt-1">Bu işlem 10-30 saniye sürebilir</p>
              </div>
            ) : resultImage ? (
              <img src={resultImage} alt="Sonuç" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="text-center text-slate-600 p-4">
                <div className="text-4xl mb-2">✨</div>
                <p className="text-sm">Sonuç burada görünecek</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Hata Mesajı ─── */}
      {error && (
        <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-300 px-6 py-3 rounded-xl max-w-2xl text-center text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ─── Gönder Butonu ─── */}
      <button
        onClick={handleSubmit}
        disabled={loading || !personImages[0] || !garmentImage}
        className="mt-8 px-10 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-indigo-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none hover:scale-105 active:scale-95"
      >
        {loading ? '⏳ İşleniyor...' : '🚀 Kıyafeti Giydir'}
      </button>

      {/* ─── Sonucu İndir ─── */}
      {resultImage && !loading && (
        <a
          href={resultImage}
          download="sanal-giydirme-sonucu.png"
          className="mt-4 text-indigo-400 hover:text-indigo-300 underline text-sm transition-colors"
        >
          📥 Sonucu İndir
        </a>
      )}
    </div>
  );
}

export default App;
