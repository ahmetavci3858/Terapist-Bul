import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { isim, telefon, brans, mesaj } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'Terapist Bul <onboarding@resend.dev>',
      to: ['ahmetavci3858@gmail.com'], // Senin e-posta adresin
      subject: `[SİTE TALEBİ] - ${brans}`,
      html: `
        <h3>Yeni Talep Bildirimi</h3>
        <p><strong>Danışan:</strong> ${isim}</p>
        <p><strong>Telefon:</strong> ${telefon}</p>
        <p><strong>Hizmet:</strong> ${brans}</p>
        <p><strong>Detaylar:</strong><br/>${mesaj.replace(/\n/g, '<br/>')}</p>
      `,
    });
    return res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
