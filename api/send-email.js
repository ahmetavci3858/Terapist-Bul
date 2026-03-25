import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST isteği kabul edilir' });
  }

  const { isim, telefon, brans, mesaj } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'Terapist Bul <onboarding@resend.dev>',
      to: ['ahmetavci3858@gmail.com'],
      subject: `[YENİ TALEP] - ${brans}`,
      html: `
        <h2>Yeni Bir Hizmet Talebi Geldi!</h2>
        <p><strong>İsim:</strong> ${isim}</p>
        <p><strong>Telefon:</strong> ${telefon}</p>
        <p><strong>Branş:</strong> ${brans}</p>
        <p><strong>Mesaj:</strong> ${mesaj}</p>
      `,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
