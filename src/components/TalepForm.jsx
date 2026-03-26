import { useState } from "react";

export default function TalepForm() {
  const [isim, setIsim] = useState("");
  const [telefon, setTelefon] = useState("");
  const [brans, setBrans] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [loading, setLoading] = useState(false);
  const [sonuc, setSonuc] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSonuc("");

    try {
      const response = await fetch("/api/send-mail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          isim,
          telefon,
          brans,
          mesaj
        })
      });

      const data = await response.json();

      if (data.success) {
        setSonuc("Talep başarıyla gönderildi! Mail kutunu kontrol et.");
        setIsim("");
        setTelefon("");
        setBrans("");
        setMesaj("");
      } else {
        setSonuc("Bir hata oluştu: " + data.error);
      }
    } catch (error) {
      setSonuc("Sunucuya bağlanılamadı: " + error.message);
    }

    setLoading(false);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-lg space-y-4"
    >
      <h2 className="text-2xl font-bold text-center mb-4">Uzman Talep Formu</h2>

      <input
        type="text"
        placeholder="İsim Soyisim"
        value={isim}
        onChange={(e) => setIsim(e.target.value)}
        className="w-full p-3 border rounded-xl"
        required
      />

      <input
        type="tel"
        placeholder="Telefon Numarası"
        value={telefon}
        onChange={(e) => setTelefon(e.target.value)}
        className="w-full p-3 border rounded-xl"
        required
      />

      <input
        type="text"
        placeholder="Branş (örn: Fizyoterapist)"
        value={brans}
        onChange={(e) => setBrans(e.target.value)}
        className="w-full p-3 border rounded-xl"
        required
      />

      <textarea
        placeholder="Mesajınız..."
        value={mesaj}
        onChange={(e) => setMesaj(e.target.value)}
        className="w-full p-3 border rounded-xl h-32"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold"
      >
        {loading ? "Gönderiliyor..." : "Gönder"}
      </button>

      {sonuc && (
        <p className="text-center mt-4 font-semibold">
          {sonuc}
        </p>
      )}
    </form>
  );
}