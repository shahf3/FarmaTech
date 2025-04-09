const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');

const testEmail = async () => {
  const msg = {
    to: 'abhijitmahal2@gmail.com', // Replace with your email
    from: 'farmatech20@gmail.com', // Your verified sender
    subject: 'SendGrid Test',
    text: 'This is a test email.',
  };

  try {
    console.log('Sending test email...');
    const response = await sgMail.send(msg);
    console.log('Test email sent:', response);
  } catch (error) {
    console.error('Test email error:', error.message, error.response ? error.response.body : 'No response');
  }
};

testEmail();