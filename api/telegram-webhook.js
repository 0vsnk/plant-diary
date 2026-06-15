import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message } = req.body || {}
  if (!message) return res.status(200).end()

  const chatId = message.chat?.id
  const text = (message.text || '').trim()

  if (!chatId) return res.status(200).end()

  // /start <supabase_user_id>
  if (text.startsWith('/start')) {
    const userId = text.split(' ')[1]?.trim()

    if (userId) {
      // Link telegram chat_id to this user
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { telegram_chat_id: String(chatId) }
      })

      const reply = error
        ? '❌ Не вдалось підключити. Спробуй ще раз з додатку.'
        : '✅ Telegram підключено! Тепер ти отримуватимеш сповіщення про полив та пересадки.'

      await sendMessage(chatId, reply)
    } else {
      await sendMessage(chatId, '👋 Відкрий Plant Diary → Профіль → Сповіщення, щоб підключити Telegram.')
    }
  }

  return res.status(200).json({ ok: true })
}

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  })
}
