import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

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
  return new Date(date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
}

async function sendTelegram(chatId, text) {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  })
  return r.ok
}

export default async function handler(req, res) {
  const authHeader = req.headers['authorization']
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!BOT_TOKEN) return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not set' })

  const today = dayStart(new Date())
  const tomorrow = addDays(today, 1)
  const in3Days = addDays(today, 3)

  const { data: plants, error: plantsError } = await supabase.from('plants').select('*')
  if (plantsError) return res.status(500).json({ error: plantsError.message })

  const userIds = [...new Set(plants.map(p => p.user_id))]
  const userTelegramIds = {}

  for (const userId of userIds) {
    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    const chatId = userData?.user?.user_metadata?.telegram_chat_id
    if (chatId) userTelegramIds[userId] = chatId
  }

  const plantIds = plants.map(p => p.id)
  const { data: allLogs } = await supabase
    .from('watering_logs')
    .select('plant_id, watered_at, with_fertilizer')
    .in('plant_id', plantIds)
    .order('watered_at', { ascending: false })

  const logsByPlant = {}
  for (const log of allLogs || []) {
    if (!logsByPlant[log.plant_id]) logsByPlant[log.plant_id] = []
    logsByPlant[log.plant_id].push(log)
  }

  const messages = []

  for (const plant of plants) {
    const chatId = userTelegramIds[plant.user_id]
    if (!chatId) continue

    const logs = logsByPlant[plant.id] || []
    const lastWatering = logs[0]
    const baseWateringDate = lastWatering ? new Date(lastWatering.watered_at) : new Date(plant.created_at)
    const nextWatering = addDays(baseWateringDate, plant.watering_frequency_days)

    if (nextWatering.getTime() === tomorrow.getTime()) {
      messages.push({ chatId, text: `💧 <b>Завтра полив</b>\n${plant.name} (${plant.room}) — ${formatDate(tomorrow)}` })
    } else if (nextWatering < today) {
      const days = Math.round((today - nextWatering) / 86400000)
      messages.push({ chatId, text: `⚠️ <b>Прострочений полив</b>\n${plant.name} (${plant.room}) — ${days} дн. тому` })
    }

    if (plant.fertilizing_frequency_days) {
      const lastFert = logs.find(l => l.with_fertilizer)
      const baseFert = lastFert ? new Date(lastFert.watered_at) : new Date(plant.created_at)
      const nextFert = addDays(baseFert, plant.fertilizing_frequency_days)
      if (nextFert.getTime() === tomorrow.getTime()) {
        messages.push({ chatId, text: `🌿 <b>Завтра підживлення</b>\n${plant.name} (${plant.room}) — ${formatDate(tomorrow)}` })
      }
    }

    if (plant.next_repotting_date) {
      const repotDate = dayStart(new Date(plant.next_repotting_date))
      if (repotDate.getTime() === in3Days.getTime()) {
        messages.push({ chatId, text: `🪴 <b>Пересадка через 3 дні</b>\n${plant.name} (${plant.room}) — ${formatDate(repotDate)}` })
      }
    }
  }

  const results = await Promise.allSettled(messages.map(m => sendTelegram(m.chatId, m.text)))
  const sent = results.filter(r => r.status === 'fulfilled' && r.value).length
  const failed = results.length - sent

  return res.status(200).json({ sent, failed, total: messages.length })
}
