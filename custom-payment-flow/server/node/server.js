const express = require('express');
const cors = require('cors');
const app = express();
const { resolve } = require('path');
// Replace if using a different env file or config
const env = require('dotenv').config({ path: './.env' });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
  appInfo: { // For sample support and debugging, not required for production:
    name: "stripe-samples/accept-a-payment/custom-payment-flow",
    version: "0.0.2",
    url: "https://github.com/stripe-samples"
  }
});

app.use(express.static(process.env.STATIC_DIR));
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function (req, res, buf) {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString();
      }
    },
  })
);
app.use(cors({
  origin: 'http://localhost:3000'
}));

app.get('/', (req, res) => {
  const path = resolve(process.env.STATIC_DIR + '/index.html');
  res.sendFile(path);
});

app.get('/config', (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

app.post('/create-payment-intent', async (req, res) => {
  const { paymentMethodType, currency, paymentMethodOptions, card, type, amount } = req.body;

  const stripeCustomer = await stripe.customers.create({
    email: 'eeeee@gmail.com',
    description: 'ehsan',
  });

  const paymentMethod = await stripe.paymentMethods.create({
    type: type,
    card: card
  });

  const paymentMethodId = paymentMethod.id
  // Each payment method type has support for different currencies. In order to
  // support many payment method types and several currencies, this server
  // endpoint accepts both the payment method type and the currency as
  // parameters.
  //
  // Some example payment method types include `card`, `ideal`, and `alipay`.
  const params = {
    payment_method_types: [type],
    amount: amount,
    currency: 'usd',
    confirmation_method: 'manual',
    payment_method: paymentMethodId,
    customer: stripeCustomer.id,
    confirm: true,         //  CONFIRM PAYMENT AT FIRST ( YOU CAN CONFIRM IT MANUALLY AFTER CREATING PAYMENT INTETNT LIKE THIS :
    //                         const confirmIntent = await stripe.paymentIntents.confirm(paymentIntent.id);    )
  }

  /**
   * If API given this data, we can overwride it
   */
  if (paymentMethodOptions) {
    params.payment_method_options = paymentMethodOptions
  }

  // Create a PaymentIntent with the amount, currency, and a payment method type.
  //
  // See the documentation [0] for the full list of supported parameters.
  //
  // [0] https://stripe.com/docs/api/payment_intents/create
  try {
    const paymentIntent = await stripe.paymentIntents.create(
      params
    );


    // Send publishable key and PaymentIntent details to client
    res.send({
      clientSecret: paymentIntent.client_secret,
      nextAction: paymentIntent.next_action,
      paymentIntent: paymentIntent,

      // confirmIntent: confirmIntent,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

// Expose a endpoint as a webhook handler for asynchronous events.
// Configure your webhook in the stripe developer dashboard
// https://dashboard.stripe.com/test/webhooks
app.post('/webhook', async (req, res) => {
  let data, eventType;

  // Check if webhook signing is configured.
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
    data = event.data;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // we can retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }

  if (eventType === 'payment_intent.succeeded') {
    // Funds have been captured
    // Fulfill any orders, e-mail receipts, etc
    // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
    console.log('💰 Payment captured!');
  } else if (eventType === 'payment_intent.payment_failed') {
    console.log('❌ Payment failed.');
  }
  res.sendStatus(200);
});

const getPaymentDetailsObject = async () => {
  const paymentIntent = await stripe.paymentIntents.retrieve(
    'pi_3KrNv6Bo5fG3bQ1z1syhIIdb',
  );
  console.log(paymentIntent)
}


app.listen(4242, () =>
  console.log(`Node server listening at http://localhost:4242`)
);
