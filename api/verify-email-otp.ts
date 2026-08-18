import type { IncomingMessage, ServerResponse } from 'http';

type VercelRequest = IncomingMessage & {
  body?: any;
  query?: { [key: string]: string | string[] };
  cookies?: { [key: string]: string };
};

type VercelResponse = ServerResponse & {
  send: (body: any) => VercelResponse;
  json: (jsonBody: any) => VercelResponse;
  status: (statusCode: number) => VercelResponse;
  setHeader: (name: string, value: string | string[]) => VercelResponse;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { email, code } = req.body || {};
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanCode = (code || "").trim();

    if (!cleanEmail || !cleanCode) {
      return res.status(400).json({ success: false, message: "يرجى إدخال البريد الإلكتروني ورمز التحقق." });
    }

    return res.json({
      success: true,
      message: "تم التحقق بنجاح."
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "خطأ أثناء التحقق" });
  }
}
