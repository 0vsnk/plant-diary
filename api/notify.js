import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Requires SUPABASE_SERVICE_ROLE_KEY in Vercel env (not the anon key)
// so the cron can read all users' data bypassing RLS
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.FROM_EMAIL || 'Plant Diary <notifications@plantdiary.app>'

function dayStart(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return dayStart(d)
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long'
  })
}

export default async function handler(req, res) {
  // Vercel cron sends Authorization header with CRON_SECRET
  const authHeader = req.headers['authorization']
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const today = dayStart(new Date())
  const tomorrow = addDays(today, 1)
  const in3Days = addDays(today, 3)

  // Fetch all plants + their latest watering logs + user emails
  const { data: plants, error: plantsError } = await supabase
    .from('plants')
    .select('*')

  if (plantsError) {
    console.error('Error fetching plants:', plantsError)
    return res.status(500).json({ error: plantsError.message })
  }

  // Fetch user emails via auth.users (requires service role)
  const userIds = [...new Set(plants.map(p => p.user_id))]
  const userEmails = {}

  for (const userId of userIds) {
    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    if (userData?.user?.email) {
      userEmails[userId] = userData.user.email
    }
  }

  // Fetch latest watering logs for all plants
  const plantIds = plants.map(p => p.id)
  const { data: allLogs } = await supabase
    .from('watering_logs')
    .select('plant_id, watered_at, with_fertilizer')
    .in('plant_id', plantIds)
    .order('watered_at', { ascending: false })

  // Group logs by plant_id
  const logsByPlant = {}
  for (const log of allLogs || []) {
    if (!logsByPlant[log.plant_id]) logsByPlant[log.plant_id] = []
    logsByPlant[log.plant_id].push(log)
  }

  const notifications = []

  for (const plant of plants) {
    const email = userEmails[plant.user_id]
    if (!email) continue

    const logs = logsByPlant[plant.id] || []

    // --- Watering notifications ---
    const lastWatering = logs[0]
    const baseWateringDate = lastWatering
      ? new Date(lastWatering.watered_at)
      : new Date(plant.created_at)
    const nextWatering = addDays(baseWateringDate, plant.watering_frequency_days)

    if (nextWatering.getTime() === tomorrow.getTime()) {
      notifications.push({
        email,
        subject: `💧 Завтра потрібно полити "${plant.name}"`,
        html: buildEmail(
          `💧 Завтра полив`,
          `Завтра, <strong>${formatDate(tomorrow)}</strong>, настає день поливу для вашої рослини <strong>${plant.name}</strong> (${plant.room}).`,
          plant.photo_url
        )
      })
    } else if (nextWatering < today) {
      const daysOverdue = Math.round((today - nextWatering) / 86400000)
      notifications.push({
        email,
        subject: `⚠️ Прострочено полив "${plant.name}"`,
        html: buildEmail(
          `⚠️ Прострочений полив`,
          `Ви пропустили полив рослини <strong>${plant.name}</strong> (${plant.room}). Планова дата була <strong>${formatDate(nextWatering)}</strong> — ${daysOverdue} дн. тому.`,
          plant.photo_url
        )
      })
    }

    // --- Fertilizing notifications ---
    if (plant.fertilizing_frequency_days) {
      const lastFertilizing = logs.find(l => l.with_fertilizer)
      const baseFertDate = lastFertilizing
        ? new Date(lastFertilizing.watered_at)
        : new Date(plant.created_at)
      const nextFertilizing = addDays(baseFertDate, plant.fertilizing_frequency_days)

      if (nextFertilizing.getTime() === tomorrow.getTime()) {
        notifications.push({
          email,
          subject: `🌿 Завтра підживлення "${plant.name}"`,
          html: buildEmail(
            `🌿 Завтра підживлення`,
            `Завтра, <strong>${formatDate(tomorrow)}</strong>, час підживити рослину <strong>${plant.name}</strong> (${plant.room}).`,
            plant.photo_url
          )
        })
      }
    }

    // --- Repotting notifications ---
    if (plant.next_repotting_date) {
      const repottingDate = dayStart(new Date(plant.next_repotting_date))

      if (repottingDate.getTime() === in3Days.getTime()) {
        notifications.push({
          email,
          subject: `🪴 Через 3 дні пересадка "${plant.name}"`,
          html: buildEmail(
            `🪴 Пересадка через 3 дні`,
            `Через 3 дні, <strong>${formatDate(repottingDate)}</strong>, запланована пересадка рослини <strong>${plant.name}</strong> (${plant.room}). Підготуйте горщик і ґрунт!`,
            plant.photo_url
          )
        })
      }
    }
  }

  // Send all notifications
  const results = await Promise.allSettled(
    notifications.map(n =>
      resend.emails.send({
        from: FROM_EMAIL,
        to: n.email,
        subject: n.subject,
        html: n.html
      })
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  console.log(`Notifications: ${sent} sent, ${failed} failed`)
  return res.status(200).json({ sent, failed, total: notifications.length })
}

function buildEmail(title, body, photoUrl) {
  const photoHtml = photoUrl
    ? `<img src="${photoUrl}" alt="" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;margin-bottom:16px;">`
    : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:24px 16px;">
    <div style="background:#1c1c1c;border-radius:16px;overflow:hidden;padding:24px;">
      <div style="font-size:24px;font-weight:700;color:#5a9e6f;margin-bottom:16px;">🌱 Plant Diary</div>
      ${photoHtml}
      <h2 style="color:#f0f0f0;font-size:18px;margin:0 0 12px;">${title}</h2>
      <p style="color:#c0c0c0;font-size:15px;line-height:1.6;margin:0 0 24px;">${body}</p>
      <a href="${process.env.APP_URL || 'https://plantdiary.vercel.app'}"
         style="display:inline-block;background:#5a9e6f;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
        Відкрити Plant Diary
      </a>
    </div>
    <p style="color:#555;font-size:12px;text-align:center;margin-top:16px;">
      Plant Diary · Ви отримали це повідомлення, бо маєте рослини у щоденнику.
    </p>
  </div>
</body>
</html>`
}
