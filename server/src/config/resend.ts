import { Resend } from 'resend';

// Use the API key from your .env file
const resend = new Resend(process.env.RESEND_API_KEY); 

export default resend;
