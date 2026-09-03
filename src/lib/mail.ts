import nodemailer from 'nodemailer'
import { INTENT_LABELS, leadRows, type LeadInput } from './lead'
import { SITE } from './site'

const host = process.env.SMTP_HOST
const port = Number(process.env.SMTP_PORT ?? 465)
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASSWORD
const notifyTo = process.env.LEADS_NOTIFY_TO
const notifyFrom = process.env.LEADS_NOTIFY_FROM ?? user
const sendConfirmation = process.env.LEADS_SEND_CONFIRMATION !== 'false'

export const isMailConfigured = Boolean(host && user && pass && notifyTo)

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function rowsToHtml(rows: Array<[string, string]>): string {
  return rows
    .map(
      ([key, value]) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e7f1;color:#8e949d;font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(key)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e7f1;color:#000000;font-size:14px;font-weight:500">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join('')
}

function rowsToText(rows: Array<[string, string]>): string {
  return rows.map(([key, value]) => `${key.padEnd(26)}: ${value}`).join('\n')
}

function transporter() {
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: user!, pass: pass! },
  })
}

/**
 * Envoie la demande à l'agence, puis (si activé) un accusé de réception au
 * client. Ne lève jamais : un email en échec ne doit pas faire perdre le lead,
 * la route le journalise déjà.
 */
export async function sendLeadEmails(lead: LeadInput): Promise<{ sent: boolean; error?: string }> {
  if (!isMailConfigured) {
    console.info('[lead] SMTP non configuré — email non envoyé', { intent: lead.intent, email: lead.email })
    return { sent: false, error: 'smtp-not-configured' }
  }

  const rows = leadRows(lead)
  const vehicle = [lead.make, lead.model, lead.year].filter(Boolean).join(' ')
  const subject = `[${INTENT_LABELS[lead.intent]}] ${vehicle} — ${lead.firstName} ${lead.lastName} (${lead.postalCode})`

  const html = `
  <div style="background:#f5f9ff;padding:24px;font-family:Segoe UI,Helvetica,Arial,sans-serif">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e7f1;border-radius:14px;overflow:hidden">
      <div style="background:#000000;color:#ffffff;padding:22px 24px">
        <div style="font-size:21px;font-weight:700;letter-spacing:.16em;color:#ffffff;line-height:1">TRANSAK<span style="color:#ec008c;font-weight:300">AUTO</span></div><div style="font-size:9px;font-weight:600;letter-spacing:.3em;color:#8e949d;margin-top:7px">MONTLU&Ccedil;ON &middot; CONSEIL-ACHAT-VENTE</div>
        <div style="font-size:19px;font-weight:600;margin-top:12px">${escapeHtml(INTENT_LABELS[lead.intent])}</div>
      </div>
      <div style="height:4px;background:#ec008c;font-size:0;line-height:0">&nbsp;</div>
      <table style="width:100%;border-collapse:collapse">${rowsToHtml(rows)}</table>
      <div style="padding:18px 24px;background:#f5f9ff">
        <a href="tel:${escapeHtml(lead.phone.replace(/\s/g, ''))}" style="display:inline-block;background:#ec008c;color:#ffffff;padding:11px 20px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600">Appeler ${escapeHtml(lead.firstName)}</a>
        <a href="mailto:${escapeHtml(lead.email)}" style="display:inline-block;margin-left:8px;color:#000000;padding:10px 18px;font-size:14px;text-decoration:underline">Répondre par email</a>
      </div>
    </div>
  </div>`

  const text = `${INTENT_LABELS[lead.intent]}\n\n${rowsToText(rows)}\n`

  try {
    const mailer = transporter()

    await mailer.sendMail({
      from: `"${SITE.name} — site" <${notifyFrom}>`,
      to: notifyTo!.split(',').map((address) => address.trim()),
      replyTo: `"${lead.firstName} ${lead.lastName}" <${lead.email}>`,
      subject,
      text,
      html,
    })

    if (sendConfirmation) {
      await mailer.sendMail({
        from: `"${SITE.name}" <${notifyFrom}>`,
        to: lead.email,
        replyTo: SITE.email,
        subject: `Votre ${INTENT_LABELS[lead.intent].toLowerCase()} — ${SITE.name}`,
        text:
          `Bonjour ${lead.firstName},\n\n` +
          `Nous avons bien reçu votre demande concernant votre ${vehicle}.\n` +
          `Un conseiller ${SITE.name} vous recontacte sous 24h ouvrées au ${lead.phone}.\n\n` +
          `Récapitulatif :\n${rowsToText(rows.slice(0, 9))}\n\n` +
          `Une question d'ici là ? ${SITE.phoneDisplay} — ${SITE.email}\n\n` +
          `À très vite,\nL'équipe ${SITE.name}`,
        html: `
        <div style="background:#f5f9ff;padding:24px;font-family:Segoe UI,Helvetica,Arial,sans-serif">
          <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e7f1;border-radius:14px;padding:28px">
            <div style="background:#000000;border-radius:10px 10px 0 0;padding:16px 18px">
              <div style="font-size:21px;font-weight:700;letter-spacing:.16em;color:#ffffff;line-height:1">TRANSAK<span style="color:#ec008c;font-weight:300">AUTO</span></div><div style="font-size:9px;font-weight:600;letter-spacing:.3em;color:#8e949d;margin-top:7px">MONTLU&Ccedil;ON &middot; CONSEIL-ACHAT-VENTE</div>
            </div>
            <div style="height:4px;background:#ec008c;border-radius:0 0 3px 3px;font-size:0;line-height:0;margin-bottom:18px">&nbsp;</div>
            <h1 style="font-size:21px;margin:0 0 14px;color:#000000">Votre demande est bien enregistrée</h1>
            <p style="color:#3c4049;font-size:15px;line-height:1.6;margin:0 0 14px">
              Bonjour ${escapeHtml(lead.firstName)}, merci pour votre confiance. Nous étudions les informations de votre
              <strong style="color:#ec008c">${escapeHtml(vehicle)}</strong> et un conseiller vous rappelle au <strong>${escapeHtml(lead.phone)}</strong>
              sous 24h ouvrées.
            </p>
            <table style="width:100%;border-collapse:collapse;margin:18px 0">${rowsToHtml(rows.slice(0, 9))}</table>
            <p style="color:#8e949d;font-size:13px;line-height:1.6;margin:0">
              Une question d'ici là ? ${escapeHtml(SITE.phoneDisplay)} — ${escapeHtml(SITE.email)}
            </p>
          </div>
        </div>`,
      })
    }

    return { sent: true }
  } catch (error) {
    console.error('[lead] envoi email échoué', error)
    return { sent: false, error: error instanceof Error ? error.message : 'unknown' }
  }
}
