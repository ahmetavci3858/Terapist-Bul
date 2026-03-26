import { Resend } from "resend";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { isim, telefon, brans, mesaj, to, subject, html } = req.body;
  console.log("Mail request received:", { to, subject, isim });

  try {
    const { data, error } = await resend.emails.send({
      from: "Terapist Bul <onboarding@resend.dev>",
      to: to || ["ahmetavci3858@gmail.com"],
      subject: subject || `[SİTE TALEBİ] - ${brans}`,
      html: html || `
        <h2>Yeni Talep Geldi</h2>
        <p><strong>Ad Soyad:</strong> ${isim}</p>
        <p><strong>Telefon:</strong> ${telefon}</p>
        <p><strong>Hizmet:</strong> ${brans}</p>
        <p><strong>Mesaj:</strong><br>${mesaj.replace(/\n/g, "<br/>")}</p>
      `
    });

    if (error) {
      console.error("Resend API Error:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("Mail sent successfully:", data.id);
    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error("Internal Mail Error:", err);
    return res.status(500).json({ error: err.message });
  }
}