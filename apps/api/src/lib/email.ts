/**
 * 邮件服务 — 基于 Resend SDK
 * 发送邀请邮件、通知邮件等。无 RESEND_API_KEY 时降级为 console.warn
 */
import { Resend } from 'resend';
import { env } from '../config/index.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export interface InvitationEmailParams {
  to: string;
  inviterName: string;
  orgName: string;
  token: string;
}

/** 发送成员邀请邮件 */
export async function sendInvitationEmail(params: InvitationEmailParams): Promise<void> {
  const inviteUrl = `${env.APP_URL}/register?invitationToken=${params.token}`;

  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not configured — skipping email send');
    console.log(`[Email] Invitation link for ${params.to}: ${inviteUrl}`);
    return;
  }

  try {
    await resend.emails.send({
      from: 'SaaS Platform <onboarding@resend.dev>',
      to: params.to,
      subject: `${params.inviterName} invited you to join ${params.orgName}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">You're invited!</h2>
          <p><strong>${params.inviterName}</strong> has invited you to join <strong>${params.orgName}</strong> on SaaS Platform.</p>
          <p>Click the button below to accept the invitation and create your account:</p>
          <a href="${inviteUrl}"
             style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: #0f1526;
                    font-weight: 600; text-decoration: none; border-radius: 8px; margin-top: 8px;">
            Accept Invitation
          </a>
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            This invitation expires in 7 days. If you were not expecting this, you can safely ignore it.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            Or copy this link: ${inviteUrl}
          </p>
        </div>
      `,
    });
    console.log(`[Email] Invitation sent to ${params.to}`);
  } catch (err) {
    console.error('[Email] Failed to send invitation:', err);
  }
}
