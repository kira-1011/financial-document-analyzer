import { resend } from './resend';
import { reactInvitationEmail } from '@/components/email/invitation';

const FROM_EMAIL = process.env.EMAIL_FROM || 'DocuFinance <onboarding@resend.dev>';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  react?: React.ReactElement;
}

export async function sendEmail({ to, subject, html, react }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      react,
    });

    if (error) {
      console.error('❌ Email send error:', error);
      throw error;
    }

    console.log('✅ Email sent:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return { success: false, error };
  }
}

// Convenience function for invitation emails
export async function sendInvitationEmail({
  email,
  inviterName,
  inviterEmail,
  organizationName,
  organizationLogo,
  inviteLink,
}: {
  email: string;
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  organizationLogo?: string;
  inviteLink: string;
}) {
  return sendEmail({
    to: email,
    subject: `You've been invited to join ${organizationName}`,
    react: reactInvitationEmail({
      username: email,
      invitedByUsername: inviterName,
      invitedByEmail: inviterEmail,
      organizationName,
      organizationLogo,
      inviteLink,
    }),
  });
}
