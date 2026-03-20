import { getReviewStatus, REVIEW_CADENCES } from './drive'

const NOTIFIED_KEY = 'vega-review-notified'

// Track which SOPs we've already notified about (per session/day)
function getNotifiedIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}')
    const today = new Date().toISOString().split('T')[0]
    // Reset daily
    if (stored.date !== today) return { date: today, ids: [] }
    return stored
  } catch { return { date: new Date().toISOString().split('T')[0], ids: [] } }
}

function markNotified(sopIds) {
  const current = getNotifiedIds()
  current.ids = [...new Set([...current.ids, ...sopIds])]
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(current))
}

// Send review reminder email via Gmail API
async function sendReviewEmail(token, sop) {
  const cadence = REVIEW_CADENCES[sop.reviewCadence]
  const subject = `SOP Review Due: ${sop.id} — ${sop.title}`
  const body = [
    `Hi ${sop.owner || 'there'},`,
    '',
    `The following Standard Operating Procedure is due for its ${cadence?.label || ''} review:`,
    '',
    `  SOP ID: ${sop.id}`,
    `  Title: ${sop.title}`,
    `  Last Reviewed: ${sop.lastReviewed}`,
    `  Review Cadence: ${cadence?.label || 'Unknown'}`,
    '',
    `Please review and update this procedure at your earliest convenience.`,
    '',
    `— Vega Procedures`,
  ].join('\n')

  // Build RFC 2822 email
  const to = sop.creatorEmail
  if (!to) return false

  const raw = btoa(
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n` +
    `Content-Type: text/plain; charset=utf-8\r\n\r\n` +
    body
  ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    })
    return res.ok
  } catch (err) {
    console.error('Failed to send review email:', err)
    return false
  }
}

// Check all SOPs and send notifications for overdue ones
export async function checkAndNotifyReviews(index, token) {
  if (!index?.sops || !token) return

  const notified = getNotifiedIds()
  const overdue = index.sops.filter(sop => {
    if (notified.ids.includes(sop.id)) return false
    if (!sop.creatorEmail) return false
    return getReviewStatus(sop.lastReviewed, sop.reviewCadence) === 'overdue'
  })

  if (overdue.length === 0) return

  const sent = []
  for (const sop of overdue) {
    const ok = await sendReviewEmail(token, sop)
    if (ok) sent.push(sop.id)
  }

  if (sent.length > 0) {
    markNotified(sent)
    console.log(`Sent review reminders for: ${sent.join(', ')}`)
  }
}
