export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { full_name, email, phone, service, notes } = req.body;

  // Log new submission to server logs
  console.log('New Lead Submission Notification:', {
    full_name,
    email,
    phone,
    service,
    notes,
    timestamp: new Date().toISOString(),
  });

  return res.status(200).json({ success: true, message: 'Notification processed' });
}