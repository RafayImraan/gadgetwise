# Payment Go-Live Checklist

Use this checklist before switching real traffic to online payments.

## 1) Environment Setup
- Set `STRIPE_SECRET_KEY`
- Set `STRIPE_WEBHOOK_SECRET`
- Set `PAYPAL_CLIENT_ID`
- Set `PAYPAL_CLIENT_SECRET`
- Set `PAYPAL_WEBHOOK_ID`
- Set `PAYPAL_ENV=live` for production

## 2) Endpoint Mapping
- Stripe intent: `/api/payments/stripe/intent`
- PayPal order: `/api/payments/paypal/order`
- PayPal capture: `/api/payments/paypal/capture`
- Stripe webhook: `/api/webhooks/stripe`
- PayPal webhook: `/api/webhooks/paypal`

## 3) Webhook Replay Tests
### Stripe
1. Use Stripe CLI to forward events to local/staging:
   - `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe`
2. Trigger test events:
   - `stripe trigger payment_intent.succeeded`
   - `stripe trigger payment_intent.payment_failed`
3. Verify order `paymentStatus` updates in `/admin/orders`.

### PayPal
1. Configure webhook URL in PayPal dashboard:
   - `https://your-domain.com/api/webhooks/paypal`
2. Use PayPal sandbox webhook simulator for:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
3. Verify order `paymentStatus` updates in `/admin/orders`.

## 4) Functional Scenarios
- COD checkout succeeds (`paymentStatus=pending_cod`)
- Stripe checkout succeeds (`paymentStatus=paid` after webhook)
- Stripe failed payment updates to `failed`
- PayPal checkout + capture succeeds (`paid`)
- Out-of-stock checkout returns clear error
- Duplicate rapid submits do not oversell inventory

## 5) Monitoring
- Log webhook errors (4xx/5xx)
- Alert if webhook signature validation fails repeatedly
- Alert if pending_online orders remain unpaid > 30 minutes

## 6) Rollback Strategy
- Keep COD enabled always
- If online gateway fails, disable online methods at UI level
- Continue accepting COD orders while investigating gateway issues
