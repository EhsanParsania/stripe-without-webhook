import React, { useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import StatusMessages, { useMessages } from './StatusMessages';

const CardForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [messages, addMessage] = useMessages();
  const [number, setNumber] = React.useState(4242424242424242);
  const [cvc, setCvc] = React.useState(424);
  const [expMonth, setExpMonth] = React.useState(4);
  const [expYear, setExpYear] = React.useState(2023);

  const handleSubmit = async (e) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      addMessage('Stripe.js has not yet loaded.');
      return;
    }
    const { error: backendError, clientSecret, paymentIntent, confirmIntent } = await fetch(
      '/create-payment-intent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'card',
          card: {
            number: number,
            exp_month: expMonth,
            exp_year: expYear,
            cvc: cvc,
          },
          amount: 1099,
        }),
      }
    ).then((r) => r.json());

    if (backendError) {
      addMessage(backendError.message);
      return;
    }

    addMessage('Client secret returned');
    addMessage('status : ' + paymentIntent.status)

    // const {error: stripeError, paymentIntent} = await stripe.confirmCardPayment(
    //   clientSecret,
    //   {
    //     payment_method: {
    //       card: elements.getElement(CardElement),
    //       billing_details: {
    //         name: 'Jenny Rosen',
    //       },
    //     },
    //     return_url:'http://localhost:3000/success',
    //   }
    // );
    // console.log(856565688888888,paymentIntent)
    // if (stripeError) {
    //   // Show error to your customer (e.g., insufficient funds)
    //   addMessage(stripeError.message);
    //   return;
    // }

    // Show a success message to your customer
    // There's a risk of the customer closing the window before callback
    // execution. Set up a webhook or plugin to listen for the
    // payment_intent.succeeded event that handles any business critical
    // post-payment actions.
    // addMessage(`Payment ${paymentIntent.status}: ${paymentIntent.id}`);
  };



  return (
    <>
      <h1>Card</h1>

      <p>
        <h4>Try a <a href="https://stripe.com/docs/testing#cards" target="_blank" rel="noopener noreferrer">test card</a>:</h4>
        <div>
          <code>4242424242424242</code> (Visa)
        </div>
        <div>
          <code>5555555555554444</code> (Mastercard)
        </div>
        <div>
          <code>4000002500003155</code> (Requires <a href="https://www.youtube.com/watch?v=2kc-FjU2-mY" target="_blank" rel="noopener noreferrer">3DSecure</a>)
        </div>
      </p>

      <form id="payment-form" onSubmit={handleSubmit}>
      <p style={{fontWeight:'bold',fontSize:'24px'}} >Amount : <span style={{color:'green'}}>1099</span></p>
      <br/>
        {/* <label htmlFor="card">Card</label> */}
        {/* <CardElement id="card" /> */}

        <label htmlFor="number">Card number</label>
        <input defaultValue={number} type='text' id='number' onChange={(e) => setNumber(e.target.value)} />
        <label htmlFor="expMonth">expMonth</label>
        <input defaultValue={expMonth} type='text' id='expMonth' onChange={(e) => setExpMonth(e.target.value)} />
        <label htmlFor="expYear">expYear</label>
        <input defaultValue={expYear} type='text' id='expYear' onChange={(e) => setExpYear(e.target.value)} />
        <label htmlFor="cvc">cvc</label>
        <input defaultValue={cvc} type='text' id='cvc' onChange={(e) => setCvc(e.target.value)} />

        <button type="submit">Pay</button>

      </form>
      <StatusMessages messages={messages} />

      {/* <p> <a href="https://youtu.be/IhvtIbfDZJI" target="_blank">Watch a demo walkthrough</a> </p> */}
    </>
  );
};

export default CardForm;
