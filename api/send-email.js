import { Resend } from "resend";

export const config = {
  runtime: "edge", // Vite projeleri için zorunlu
};

export default async function handler(req) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // JSON BODY'Yİ AL
    const body = await req.json();
    const { isim, telefon, brans, mesaj } = body;

    // MAIL GÖNDER
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
      `,
    });

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}