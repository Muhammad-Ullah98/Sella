const MAX = { name: 120, whatsapp: 40, shop: 160, category: 80, page: 500 };

function clean(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed.' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const name = clean(body.name, MAX.name);
    const whatsapp = clean(body.whatsapp, MAX.whatsapp);
    const shop = clean(body.shop, MAX.shop);
    const category = clean(body.category, MAX.category);
    const page = clean(body.page, MAX.page);

    if (!name || !whatsapp) {
      return res.status(400).json({ ok: false, error: 'Name and phone/WhatsApp number are required.' });
    }
    if (!/^[+()\-\s\d]{7,40}$/.test(whatsapp)) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid phone number.' });
    }

    const url = process.env.APPS_SCRIPT_URL;
    const secret = process.env.APPS_SCRIPT_SECRET;
    if (!url || !secret) throw new Error('Google Sheet connection is not configured.');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        timestamp: new Date().toISOString(),
        name,
        whatsapp,
        shop,
        category,
        page,
        userAgent: req.headers['user-agent'] || '',
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || 'Google Sheet save failed.');

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('signup error:', error?.message || error);
    return res.status(500).json({ ok: false, error: 'We could not save your details right now. Please try again.' });
  }
}
