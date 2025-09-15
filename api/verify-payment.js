// Sample Vercel serverless function for client-side verification of a payment
// This endpoint checks your DB for a payment record and returns a token or status.
// For a real deployment, implement secure lookup and token issuance.

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

  const { email } = req.query;
  if(!email) return res.status(400).json({error: 'email required'});

  // TODO: lookup payment by email in your database and verify success
  // For now, return a mocked "paid" status if query param paid=1 is present.
  if(req.query.mockpaid === '1'){
    return res.status(200).json({paid: true, message: 'mock success'});
  }

  return res.status(200).json({paid: false});
};
