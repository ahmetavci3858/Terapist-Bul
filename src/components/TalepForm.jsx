import { useState } from "react";

export default function TalepForm() {
  // STATE
  const [isim, setIsim] = useState("");
  const [telefon, setTelefon] = useState("");
  const [brans, setBrans] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [loading, setLoading] = useState(false);
  const [sonuc, setSonuc] = useState("");

  // ⭐ handleSubmit tam olarak BURAYA konur ⭐
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSonuc("");

    try {
      const response = await fetch("/api/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isim, telefon, brans, mesaj }),
      });

      const data = await response.json();

      if (data.success) {
        setSonuc("Talep başarıyla gönderildi!");
        setIsim("");
        setTelefon("");
        setBrans("");
        setMesaj("");
      } else {
        setSonuc("Hata: " + data.error);
      }
    } catch (error) {
      setSonuc("Sunucu hatası: " + error.message);
    }

    setLoading(false);
  };

  // ⭐ return en altta olur ⭐
  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-xl space-y-4"
    >
      <h2 className="text-2xl font-bold text-center">Uzman Talep Formu</h2>

      <input
        type="text"
        placeholder="Ad Soyad"
        value={isim}
        onChange={(e) => setIsim(e.target.value)}
        className="w-full p-3 border rounded-xl"
        required
      />

      <input
        type="tel"
        placeholder="Telefon"
        value={telefon}
        onChange={(e) => setTelefon(e.target.value)}
        className="w-full p-3 border rounded-xl"
        required
      />

      <select
        value={brans}
        onChange={(e) => setBrans(e.target.value)}
        className="w-full p-3 border rounded-xl"
        required
      >
        <option value="">Hizmet Seçin</option>
        <option value="Fizyoterapist">Fizyoterapist</option>
        <option value="Diyetisyen">Diyetisyen</option>
        <option value="Psikolog">Psikolog</option>
        <option value="Ergoterapist">Ergoterapist</option>
        <option value="Dil ve Konuşma Terapisti">Dil ve Konuşma Terapisti</option>
      </select>

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
        <p className="text-center mt-4 font-semibold text-gray-700">
          {sonuc}
        </p>
      )}
    </form>
  );
}