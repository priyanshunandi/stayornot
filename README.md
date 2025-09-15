# Stay or Move — Career Decision Helper

This is a simple client-side web app to help analyze whether you should stay in your current job or explore other opportunities. It gathers key datapoints (salary, skills, growth, well-being) and produces a scored recommendation plus concrete next steps.

How to use

1. Open `index.html` in a browser (no server required).
2. Fill the form using the provided sliders, dropdowns, and text fields.
3. Click "Analyze" — you'll get a recommendation, score breakdown, and actionable steps.

Design notes & algorithm

- The tool normalizes multiple dimensions (financial, skills, growth, well-being) into a composite score (0–100).
- Higher scores favor staying; lower scores favor searching and exiting.
- The scoring weights are intentionally simple and tunable. Use this repo as a prototype to adapt weights and add more questions.

Next steps (suggested improvements)

- Add persistent storage or user accounts to track changes over time.
- Add a guided decision plan generator with timelines and checklist items.
- Wire to market salary APIs or company review APIs for better benchmarking.
- Add unit tests and E2E tests for algorithm validation.

Monetization and paid callback (DodoPayments)

Quick paid flow: the app includes a placeholder "Pay to request expert callback" button. To use DodoPayments hosted checkout, create a hosted payment link and set its success/return URL to this page with `?dodopay=1` appended so the app can unlock the callback form after redirect. Replace the placeholder `href` in `index.html` with your real link.

Mail recipient: the callback form currently opens a mailto to `therapist@example.com`. Replace that email in `script.js` (`sendCallbackRequest`) with your service email before deployment.

Security & privacy: do not store users' health data without explicit consent and proper data handling policies. Consider adding a consent checkbox and a privacy policy link if you collect PII.

Vercel deployment and serverless webhook (optional, recommended for secure gating)

If you host on Vercel and want secure verification of DodoPayments webhooks:

1. Create a project on Vercel and point it to this repo or upload the files.
2. Add the `api/dodopay-webhook.js` and `api/verify-payment.js` files (included in this repo) — these are templates.
3. Configure environment variables in Vercel:
	- `DODOPAY_WEBHOOK_SECRET` (the webhook signing secret from DodoPayments)
	- Any DB connection string you prefer (Supabase, Fauna, Vercel KV, etc.)
4. In DodoPayments, set the webhook URL to `https://<your-vercel-domain>/api/dodopay-webhook` and enable the events you need (payment.succeeded, payment.failed).
5. Implement signature verification in `api/dodopay-webhook.js` per DodoPayments docs and persist payment records securely.
6. Optionally implement `api/verify-payment.js` to let the client call the server to confirm a payment or issue a short-lived token that unlocks the paid callback form.

Note: The included serverless functions are templates and must be adapted to DodoPayments' actual event format and signing method. Do not deploy them as-is without adding proper verification and storage.

License

This is a lightweight prototype provided as-is for personal use.

