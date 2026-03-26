import { Resend } from "resend";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { isim, telefon, brans, mesaj } = req.body;

  try {
    const data = await resend.emails.send({
      from: "Terapist Bul <onboarding@resend.dev>",
      to: ["ahmetavci3858@gmail.com"],
      subject: `[SİTE TALEBİ] - ${brans}`,
      html: `
        <h2>Yeni Talep Geldi</h2>
        <p><strong>Ad Soyad:</strong> ${isim}</p>
        <p><strong>Telefon:</strong> ${telefon}</p>
        <p><strong>Hizmet:</strong> ${brans}</p>
        <p><strong>Mesaj:</strong><br>${mesaj.replace(/\n/g, "<br/>")}</p>
      `
    });

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}