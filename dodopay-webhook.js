// Sample Vercel serverless function to receive DodoPayments webhooks
// NOTE: This is a template. You MUST adapt verification logic to DodoPayments' webhook signature.

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // Example: DodoPayments may send JSON event with {type: 'payment.succeeded', data: {id, amount, metadata}}
  const event = req.body;

  // TODO: verify signature using DodoPayments headers and your webhook secret
  // const sig = req.headers['x-dodopay-signature'];
  // verifySignature(req.rawBody, sig, process.env.DODOPAY_WEBHOOK_SECRET);

  console.log('Received DodoPayments event:', event && event.type);

  if (event && event.type === 'payment.succeeded'){
    const payment = event.data;
    // Store payment record in your DB or key-value store (e.g., Supabase, Fauna, or Vercel KV)
    // Example: write to a simple file (not recommended for production)
    // In production, use a proper DB and verify idempotency

    // You might create a short-lived token linked to the payer email to unlock paid features
    // e.g., store {email, paymentId, createdAt}

    return res.status(200).json({received: true});
  }

  return res.status(200).json({ok: true});
};