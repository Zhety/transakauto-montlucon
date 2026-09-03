/**
 * Vérifie la configuration SMTP sans passer par le site :
 *   node --env-file=.env.local scripts/test-mail.mjs
 * Teste la connexion, puis envoie un email de test à LEADS_NOTIFY_TO.
 */
import nodemailer from 'nodemailer'

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, LEADS_NOTIFY_TO, LEADS_NOTIFY_FROM } = process.env

const missing = Object.entries({ SMTP_HOST, SMTP_USER, SMTP_PASSWORD, LEADS_NOTIFY_TO })
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missing.length) {
  console.error(`\n❌ Variables manquantes dans .env.local : ${missing.join(', ')}\n`)
  process.exit(1)
}

const port = Number(SMTP_PORT ?? 465)
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
})

console.log(`\n→ Connexion à ${SMTP_HOST}:${port} en tant que ${SMTP_USER}…`)

try {
  await transporter.verify()
  console.log('✅ Connexion et authentification OK')
} catch (error) {
  console.error(`\n❌ Connexion refusée : ${error.message}`)
  console.error("   Gmail : vérifie que tu utilises bien un mot de passe d'application (16 caractères)")
  console.error('   et que la validation en 2 étapes est active sur le compte.\n')
  process.exit(1)
}

const info = await transporter.sendMail({
  from: `"Transakauto Montluçon — test" <${LEADS_NOTIFY_FROM ?? SMTP_USER}>`,
  to: LEADS_NOTIFY_TO,
  subject: 'Test SMTP — site Transakauto Montluçon',
  text: "Si tu lis ce message, l'envoi des demandes du site fonctionne.",
})

console.log(`✅ Email envoyé à ${LEADS_NOTIFY_TO} (id ${info.messageId})`)
console.log('   Vérifie la boîte de réception ET le dossier spam.\n')
