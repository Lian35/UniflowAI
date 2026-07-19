
'use server';
/**
 * @fileOverview Flow for generating and sending professional auth emails using Resend.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Resend } from 'resend';

// Initialize Resend - Requires RESEND_API_KEY in .env
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const SendOTPEmailInputSchema = z.object({
  email: z.string().email(),
  userName: z.string(),
  otpCode: z.string(),
});
export type SendOTPEmailInput = z.infer<typeof SendOTPEmailInputSchema>;

const SendOTPEmailOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type SendOTPEmailOutput = z.infer<typeof SendOTPEmailOutputSchema>;

export async function sendOTPEmail(input: SendOTPEmailInput): Promise<SendOTPEmailOutput> {
  return sendOTPEmailFlow(input);
}

const sendOTPEmailFlow = ai.defineFlow(
  {
    name: 'sendOTPEmailFlow',
    inputSchema: SendOTPEmailInputSchema,
    outputSchema: SendOTPEmailOutputSchema,
  },
  async (input) => {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F9FAFB;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #F9FAFB;
      padding-bottom: 40px;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #E5E7EB;
    }
    .header {
      padding: 40px 40px 20px;
      text-align: left;
    }
    .logo {
      font-size: 22px;
      font-weight: 800;
      color: #3385FF;
      letter-spacing: -0.5px;
      text-decoration: none;
    }
    .content {
      padding: 0 40px 40px;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 16px;
      letter-spacing: -0.5px;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: #4B5563;
      margin: 0 0 24px;
    }
    .otp-container {
      background-color: #F3F4F6;
      border-radius: 12px;
      padding: 32px;
      text-align: center;
      margin: 32px 0;
    }
    .otp-code {
      font-size: 42px;
      font-weight: 800;
      letter-spacing: 12px;
      color: #3385FF;
      margin: 0;
      font-family: 'Courier New', Courier, monospace;
    }
    .footer {
      padding: 32px 40px;
      background-color: #F9FAFB;
      border-top: 1px solid #F3F4F6;
      text-align: center;
    }
    .footer-text {
      font-size: 12px;
      color: #9CA3AF;
      line-height: 1.5;
    }
    .accent-bar {
      height: 4px;
      background: linear-gradient(90deg, #3385FF 0%, #7F00FF 100%);
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="accent-bar"></div>
      <div class="header">
        <div class="logo">UniFlow AI</div>
      </div>
      <div class="content">
        <h1>Activa tu ecosistema de estudio</h1>
        <p>Hola, ${input.userName}. Estás a un paso de revolucionar tu forma de aprender. Utiliza el siguiente código de seguridad para verificar tu cuenta:</p>
        
        <div class="otp-container">
          <div class="otp-code">${input.otpCode}</div>
        </div>

        <p style="font-size: 14px; color: #6B7280;">Este código es válido por los próximos 10 minutos. Por tu seguridad, no compartas este código con nadie.</p>
      </div>
      <div class="footer">
        <p class="footer-text">
          Has recibido este correo porque se inició un registro en UniFlow AI Pro.<br>
          Si no fuiste tú, puedes ignorar este mensaje con total seguridad.<br><br>
          © 2024 UniFlow AI Ecosystem. Todos los derechos reservados.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    console.log(`[AUTH-PRO] Intentando enviar OTP ${input.otpCode} a ${input.email}`);

    if (!resend) {
      console.warn('RESEND_API_KEY no encontrada. El correo no se envió a la bandeja real.');
      return { 
        success: false, 
        error: 'Servicio de correo no configurado (Falta RESEND_API_KEY)' 
      };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'UniFlow AI <onboarding@resend.dev>',
        to: [input.email],
        subject: 'Verifica tu cuenta — Bienvenido a UniFlow AI',
        html: html,
      });

      if (error) {
        console.error('Error de Resend:', error);
        return { success: false, error: error.message };
      }

      console.log('Correo enviado con éxito:', data?.id);
      return { success: true };
    } catch (err: any) {
      console.error('Excepción al enviar correo:', err);
      return { success: false, error: err.message };
    }
  }
);
