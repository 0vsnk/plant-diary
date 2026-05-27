/* ═══════════════════════════════════════
   PLANT DIARY — APP.JS
═══════════════════════════════════════ */

const SUPABASE_URL = 'https://vimboebhkseptetjlznb.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbWJvZWJoa3NlcHRldGpsem5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MDM2NjYsImV4cCI6MjA5NTI3OTY2Nn0.g1KXfAkddsZ44WgrfIrgvk7E0unOo3bMHJ8uov2nzMY'

let sb
let state = {
  user: null,
  plants: [],
  wateringLogs: {},   // plantId → []
  notes: {},          // plantId → []
  currentPlantId: null,
  activeTab: 'plants',
  calendarDate: new Date(),
  journalFilter: 'all',
  formMode: 'add',    // 'add' | 'edit'
  pendingPhotoFile: null,
  pendingNotePhotoFile: null,
  selectedConditions: ['sun'],
  roomFilter: 'all',  // room filter for plants tab
  selectedPotSizes: [],
  lang: localStorage.getItem('lang') || 'uk',
}

/* ═══════════════════════════════════════
   SHARED SVG ICONS
═══════════════════════════════════════ */
const IC_WATERDROP = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6.21375 1.40905C6.18735 1.37822 6.15458 1.35346 6.1177 1.33649C6.08083 1.31952 6.04071 1.31073 6.00012 1.31073C5.95952 1.31073 5.91941 1.31952 5.88253 1.33649C5.84565 1.35346 5.81289 1.37822 5.78648 1.40905C5.04445 2.27694 2.625 5.27741 2.625 7.49999C2.625 9.57116 3.92906 10.875 6 10.875C8.07094 10.875 9.375 9.57116 9.375 7.49999C9.375 5.27741 6.95555 2.27694 6.21375 1.40905Z" fill="currentColor"/></svg>`
const IC_WARN_SVG = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6.64946 1.57401L10.9665 9.051C11.0323 9.16502 11.0669 9.29435 11.0669 9.426C11.0669 9.55765 11.0323 9.68698 10.9665 9.801C10.9006 9.91501 10.806 10.0097 10.692 10.0755C10.5779 10.1413 10.4486 10.176 10.317 10.176H1.68296C1.55131 10.176 1.42198 10.1413 1.30797 10.0755C1.19396 10.0097 1.09928 9.91501 1.03346 9.801C0.967636 9.68698 0.932983 9.55765 0.932983 9.426C0.932984 9.29435 0.967639 9.16502 1.03346 9.051L5.35046 1.57401C5.63896 1.07401 6.36046 1.07401 6.64946 1.57401ZM5.99996 7.50001C5.86736 7.50001 5.74018 7.55268 5.64641 7.64645C5.55264 7.74022 5.49996 7.8674 5.49996 8.00001C5.49996 8.13261 5.55264 8.25979 5.64641 8.35356C5.74018 8.44733 5.86736 8.50001 5.99996 8.50001C6.13257 8.50001 6.25975 8.44733 6.35352 8.35356C6.44729 8.25979 6.49996 8.13261 6.49996 8.00001C6.49996 7.8674 6.44729 7.74022 6.35352 7.64645C6.25975 7.55268 6.13257 7.50001 5.99996 7.50001ZM5.99996 4.00001C5.8775 4.00002 5.7593 4.04498 5.66778 4.12636C5.57626 4.20774 5.51779 4.31988 5.50346 4.44151L5.49996 4.50001V6.50001C5.50011 6.62745 5.5489 6.75002 5.63639 6.84269C5.72387 6.93536 5.84344 6.99112 5.97066 6.99859C6.09788 7.00606 6.22315 6.96467 6.32088 6.88287C6.41861 6.80108 6.48141 6.68505 6.49646 6.55851L6.49996 6.50001V4.50001C6.49996 4.3674 6.44729 4.24022 6.35352 4.14645C6.25975 4.05268 6.13257 4.00001 5.99996 4.00001Z" fill="currentColor"/></svg>`
const IC_POT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7.975 19C7.43056 19 6.95417 18.8347 6.54583 18.5042C6.1375 18.1736 5.86528 17.7458 5.72917 17.2208L4.41667 12H19.5833L18.2708 17.2208C18.1347 17.7458 17.8625 18.1736 17.4542 18.5042C17.0458 18.8347 16.5694 19 16.025 19H7.975Z" fill="currentColor"/><path d="M21.8152 10.1485C22.2717 9.69117 22.5 9.14167 22.5 8.5V5H1.5V8.5C1.50078 9.14244 1.72944 9.69194 2.186 10.1485C2.64256 10.6051 3.19167 10.8333 3.83333 10.8333H20.1667C20.8091 10.8341 21.3586 10.6058 21.8152 10.1485Z" fill="currentColor"/></svg>`
const IC_SOIL = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.29142 2.46054C7.44843 2.46054 6.63998 2.79541 6.0439 3.39149C5.44782 3.98757 5.11295 4.79603 5.11295 5.63901V10.4614L4.55354 11.0208C3.95767 11.6168 3.62292 12.4252 3.62292 13.268C3.62292 14.1108 3.95767 14.9191 4.55354 15.5151L8.58638 19.5467C8.88154 19.842 9.23197 20.0762 9.61765 20.2359C10.0033 20.3957 10.4167 20.478 10.8342 20.478C11.2517 20.478 11.665 20.3957 12.0507 20.2359C12.4364 20.0762 12.7868 19.842 13.082 19.5467L18.385 14.2438C18.6802 13.9486 18.9144 13.5982 19.0742 13.2125C19.234 12.8268 19.3162 12.4134 19.3162 11.9959C19.3162 11.5785 19.234 11.1651 19.0742 10.7794C18.9144 10.3937 18.6802 10.0433 18.385 9.74813L14.3534 5.71656C13.9704 5.33335 13.4958 5.0544 12.9746 4.9062C12.4535 4.758 11.9031 4.74548 11.3758 4.86982C11.2042 4.18169 10.8073 3.57072 10.2484 3.13414C9.6895 2.69756 9.00063 2.46045 8.29142 2.46054ZM10.1985 7.17357V11.3603H11.4699V6.16536C11.8093 6.0456 12.1756 6.0243 12.5266 6.10395C12.8775 6.18359 13.1988 6.36092 13.4533 6.61543L17.4861 10.647C17.6633 10.8241 17.8039 11.0344 17.8998 11.2659C17.9957 11.4973 18.0451 11.7454 18.0451 11.9959C18.0451 12.2465 17.9957 12.4946 17.8998 12.726C17.8039 12.9575 17.6633 13.1678 17.4861 13.3449L16.9267 13.903H5.00488C4.88511 13.5636 4.86382 13.1973 4.94346 12.8463C5.02311 12.4954 5.20043 12.1741 5.45495 11.9197L10.1985 7.17357ZM10.1871 5.42923C10.1337 4.94435 9.89657 4.49834 9.52443 4.18295C9.15229 3.86756 8.67344 3.70677 8.18637 3.73364C7.6993 3.76051 7.24105 3.973 6.90586 4.32741C6.57067 4.68182 6.38403 5.1512 6.38434 5.63901V9.18999L9.85777 5.71529C9.96202 5.61019 10.0718 5.51568 10.1871 5.42923Z" fill="currentColor"/><path d="M18.6469 14.84L20.5972 16.7903C20.983 17.1762 21.2457 17.6678 21.3522 18.2029C21.4586 18.7381 21.4039 19.2928 21.1951 19.7969C20.9863 20.301 20.6327 20.7319 20.179 21.035C19.7253 21.3382 19.1919 21.5 18.6462 21.5C18.1006 21.5 17.5672 21.3382 17.1135 21.035C16.6598 20.7319 16.3062 20.301 16.0974 19.7969C15.8885 19.2928 15.8339 18.7381 15.9403 18.2029C16.0468 17.6678 16.3095 17.1762 16.6953 16.7903L18.6469 14.84Z" fill="currentColor"/></svg>`
const IC_NOTE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
async function init() {
  // Explicitly configure session persistence so it works reliably
  // across OAuth redirects and page reloads
  sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    }
  })

  // DEMO MODE: set to true to preview UI without Supabase
  const DEMO_MODE = false
  if (DEMO_MODE) {
    state.user = { id: 'demo-user', email: 'demo@plantdiary.app' }
    loadDemoData()
    showApp()
    bindEvents()
    return
  }

  // Bind events once (covers both auth screen and app)
  bindEvents()

  let appStarted = false

  async function startApp(user) {
    if (appStarted) return
    appStarted = true
    state.user = user
    await loadAllData()
    showApp()
  }

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'INITIAL_SESSION') {
      // Auth screen is shown by default — only transition if session exists.
      // Do NOT call showAuth() here: PKCE code exchange is async and
      // INITIAL_SESSION can fire with null before SIGNED_IN arrives.
      if (session) await startApp(session.user)

    } else if (event === 'SIGNED_IN') {
      // Fires after OAuth redirect + code exchange, or on explicit sign-in
      if (session) await startApp(session.user)

    } else if (event === 'TOKEN_REFRESHED') {
      // Access token was silently refreshed — keep state in sync
      if (session) state.user = session.user

    } else if (event === 'SIGNED_OUT') {
      appStarted = false
      state.user = null
      state.plants = []
      state.wateringLogs = {}
      state.notes = {}
      showAuth()
    }
  })
}

/* ═══════════════════════════════════════
   DEMO DATA
═══════════════════════════════════════ */
function loadDemoData() {
  const now = new Date()
  const daysAgo = d => new Date(now - d * 86400000).toISOString()

  state.plants = [
    {
      id: 'p1', user_id: 'demo-user',
      name: 'Монстера', room: 'Вітальня', conditions: 'partial',
      watering_frequency_days: 7, fertilizing_frequency_days: 14,
      next_repotting_date: null, photo_url: null,
      pot_size: 'large',
      created_at: daysAgo(30)
    },
    {
      id: 'p2', user_id: 'demo-user',
      name: 'Фікус', room: 'Спальня', conditions: 'sun',
      watering_frequency_days: 5, fertilizing_frequency_days: 21,
      next_repotting_date: new Date(now.getTime() + 5 * 86400000).toISOString().split('T')[0],
      photo_url: null, pot_size: 'medium', created_at: daysAgo(60)
    },
    {
      id: 'p3', user_id: 'demo-user',
      name: 'Кактус Санта', room: 'Балкон', conditions: 'sun',
      watering_frequency_days: 14, fertilizing_frequency_days: null,
      next_repotting_date: null, photo_url: null,
      pot_size: 'small',
      created_at: daysAgo(90)
    },
    {
      id: 'p4', user_id: 'demo-user',
      name: 'Спатіфіллум', room: 'Кухня', conditions: 'shade',
      watering_frequency_days: 4, fertilizing_frequency_days: 30,
      next_repotting_date: null, photo_url: null,
      pot_size: null,
      created_at: daysAgo(14)
    },
  ]

  state.wateringLogs = {
    p1: [
      { id: 'w1', plant_id: 'p1', user_id: 'demo-user', watered_at: daysAgo(2), with_fertilizer: false },
      { id: 'w2', plant_id: 'p1', user_id: 'demo-user', watered_at: daysAgo(9), with_fertilizer: true },
      { id: 'w3', plant_id: 'p1', user_id: 'demo-user', watered_at: daysAgo(16), with_fertilizer: false },
    ],
    p2: [
      { id: 'w4', plant_id: 'p2', user_id: 'demo-user', watered_at: daysAgo(6), with_fertilizer: false },
      { id: 'w5', plant_id: 'p2', user_id: 'demo-user', watered_at: daysAgo(11), with_fertilizer: true },
    ],
    p3: [
      { id: 'w6', plant_id: 'p3', user_id: 'demo-user', watered_at: daysAgo(10), with_fertilizer: false },
    ],
    p4: [
      { id: 'w7', plant_id: 'p4', user_id: 'demo-user', watered_at: daysAgo(5), with_fertilizer: false },
    ],
  }

  state.notes = {
    p1: [
      { id: 'n1', plant_id: 'p1', user_id: 'demo-user', text: 'З\'явився новий листок! Росте дуже швидко цього місяця 🌿', photo_url: null, created_at: daysAgo(3) },
      { id: 'n2', plant_id: 'p1', user_id: 'demo-user', text: 'Помітила жовтий листок знизу — обрізала.', photo_url: null, created_at: daysAgo(12) },
    ],
    p2: [
      { id: 'n3', plant_id: 'p2', user_id: 'demo-user', text: 'Переставила ближче до вікна — виглядає краще.', photo_url: null, created_at: daysAgo(7) },
    ],
    p3: [], p4: [],
  }

  renderPlantsTab()
  renderCalendar()
  renderJournal()
  setTimeout(applyLang, 0)
}

/* ═══════════════════════════════════════
   AUTH
═══════════════════════════════════════ */
async function signInWithGoogle() {
  await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })
}

async function signInWithApple() {
  await sb.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: window.location.origin }
  })
}

async function signOut() {
  await sb.auth.signOut()
}

/* ═══════════════════════════════════════
   DATA LOADING
═══════════════════════════════════════ */
async function loadAllData() {
  await loadPlants()
  renderPlantsTab()
  renderCalendar()
  await loadJournalData()
}

async function loadPlants() {
  const { data, error } = await sb
    .from('plants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return }
  state.plants = data || []
}

async function loadWateringLogs(plantId) {
  const { data, error } = await sb
    .from('watering_logs')
    .select('*')
    .eq('plant_id', plantId)
    .order('watered_at', { ascending: false })

  if (!error) state.wateringLogs[plantId] = data || []
  return data || []
}

async function loadNotes(plantId) {
  const { data, error } = await sb
    .from('notes')
    .select('*')
    .eq('plant_id', plantId)
    .order('created_at', { ascending: false })

  if (!error) state.notes[plantId] = data || []
  return data || []
}

async function loadJournalData() {
  // Load all logs + notes for all plants
  if (!state.plants.length) {
    renderJournal()
    return
  }
  const plantIds = state.plants.map(p => p.id)

  const [{ data: logs }, { data: notes }] = await Promise.all([
    sb.from('watering_logs').select('*').in('plant_id', plantIds).order('watered_at', { ascending: false }),
    sb.from('notes').select('*').in('plant_id', plantIds).order('created_at', { ascending: false })
  ])

  for (const p of state.plants) {
    state.wateringLogs[p.id] = (logs || []).filter(l => l.plant_id === p.id)
    state.notes[p.id] = (notes || []).filter(n => n.plant_id === p.id)
  }

  renderJournal()
}

/* ═══════════════════════════════════════
   PLANT STATUS CALCULATION
═══════════════════════════════════════ */
function getNextWatering(plant) {
  const logs = state.wateringLogs[plant.id] || []
  const last = logs[0]
  const base = last ? new Date(last.watered_at) : new Date(plant.created_at)
  const next = new Date(base)
  next.setDate(next.getDate() + plant.watering_frequency_days)
  return dayStart(next)
}

function getNextFertilizing(plant) {
  if (!plant.fertilizing_frequency_days) return null
  const logs = state.wateringLogs[plant.id] || []
  const last = logs.find(l => l.with_fertilizer)
  const base = last ? new Date(last.watered_at) : new Date(plant.created_at)
  const next = new Date(base)
  next.setDate(next.getDate() + plant.fertilizing_frequency_days)
  return dayStart(next)
}

function getPlantStatus(plant) {
  const today = dayStart(new Date())
  const nw = getNextWatering(plant)
  const diff = Math.round((nw - today) / 86400000)

  if (diff < 0) return { type: 'overdue', label: t('status_overdue', Math.abs(diff)) }
  if (diff === 0) return { type: 'today', label: t('status_today') }
  if (diff === 1) return { type: 'soon', label: t('status_soon') }
  return { type: 'ok', label: t('status_ok', diff) }
}

function dayStart(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/* ═══════════════════════════════════════
   RENDER — PLANTS TAB
═══════════════════════════════════════ */
function renderPlantsTab() {
  const list = document.getElementById('plants-list')
  const loading = document.getElementById('plants-loading')
  const empty = document.getElementById('plants-empty')

  loading.classList.add('hidden')
  Array.from(list.querySelectorAll('.plant-card')).forEach(c => c.remove())

  // Build room filter chips
  renderRoomFilters()

  // Filter plants by room
  const filtered = state.roomFilter === 'all'
    ? state.plants
    : state.plants.filter(p => p.room === state.roomFilter)

  if (!filtered.length) {
    empty.classList.remove('hidden')
    return
  }

  empty.classList.add('hidden')
  for (const plant of filtered) {
    list.appendChild(buildPlantCard(plant))
  }
}

const ROOM_ORDER = ['Вітальня', 'Спальня', 'Кухня', 'Кабінет', 'Балкон']

function renderRoomFilters() {
  const bar = document.getElementById('room-filter-bar')
  const usedRooms = new Set(state.plants.map(p => p.room))
  const extra = [...usedRooms].filter(r => !ROOM_ORDER.includes(r)).sort()
  const rooms = [...ROOM_ORDER, ...extra]
  bar.innerHTML = ''

  const allBtn = createElement('button', `filter-chip filter-chip-all${state.roomFilter === 'all' ? ' active' : ''}`, t('filter_all'))
  allBtn.dataset.room = 'all'
  allBtn.addEventListener('click', () => { state.roomFilter = 'all'; renderPlantsTab() })
  bar.appendChild(allBtn)

  for (const room of rooms) {
    const btn = createElement('button', `filter-chip${state.roomFilter === room ? ' active' : ''}`, room)
    btn.dataset.room = room
    btn.addEventListener('click', () => { state.roomFilter = room; renderPlantsTab() })
    bar.appendChild(btn)
  }
}

function buildPlantCard(plant) {
  const status = getPlantStatus(plant)
  const statusIcon = status.type === 'overdue' ? IC_WARN_SVG : IC_WATERDROP

  const card = createElement('div', 'plant-card')
  card.dataset.plantId = plant.id
  card.addEventListener('click', () => openPlantDetail(plant.id))

  const photoDiv = createElement('div', 'plant-card-photo')
  if (plant.photo_url) {
    const img = document.createElement('img')
    img.src = plant.photo_url
    img.alt = plant.name
    img.loading = 'lazy'
    photoDiv.appendChild(img)
  } else {
    photoDiv.textContent = '🪴'
  }

  // Text block: name + conditions row
  const textBlock = createElement('div', 'plant-card-text')
  const nameEl = createElement('div', 'plant-card-name', plant.name)
  const roomEl = createElement('div', 'plant-card-room')
  const condText = conditionsLabel(plant.conditions)
  roomEl.innerHTML = `<span>${condText}</span><span>·</span><span>${plant.room}</span>`
  textBlock.append(nameEl, roomEl)

  // Status badge
  const statusBadge = createElement('span', `status-badge ${status.type}`)
  statusBadge.innerHTML = (statusIcon ? statusIcon + ' ' : '') + status.label

  // Info column
  const infoDiv = createElement('div', 'plant-card-info')
  infoDiv.append(textBlock, statusBadge)

  // More button
  const moreBtn = createElement('button', 'plant-card-more')
  moreBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>`
  moreBtn.addEventListener('click', e => {
    e.stopPropagation()
    state.currentPlantId = plant.id
    openSheet('sheet-more-actions')
  })

  // Content row: info + more
  const contentRow = createElement('div', 'plant-card-content')
  contentRow.append(infoDiv, moreBtn)

  card.append(photoDiv, contentRow)
  return card
}

/* ═══════════════════════════════════════
   RENDER — PLANT DETAIL
═══════════════════════════════════════ */
async function openPlantDetail(plantId) {
  state.currentPlantId = plantId
  const plant = state.plants.find(p => p.id === plantId)
  if (!plant) return

  // Load fresh data
  showLoadingInDetail()
  await Promise.all([loadWateringLogs(plantId), loadNotes(plantId)])
  renderPlantDetail(plant)

  openOverlay('overlay-detail')
}

function showLoadingInDetail() {
  // We just open the overlay with existing DOM — data renders async
}

function renderPlantDetail(plant) {
  // Photo
  const photoImg = document.getElementById('detail-photo-img')
  const photoPlaceholder = document.getElementById('detail-photo-placeholder')
  if (plant.photo_url) {
    photoImg.src = plant.photo_url
    photoImg.classList.remove('hidden')
    photoPlaceholder.classList.add('hidden')
  } else {
    photoImg.classList.add('hidden')
    photoPlaceholder.classList.remove('hidden')
  }

  // Name + meta (conditions · room · pot size)
  document.getElementById('detail-name').textContent = plant.name
  const metaParts = [conditionsLabel(plant.conditions), plant.room]
  if (plant.pot_size) metaParts.push(potSizeLabel(plant.pot_size))
  document.getElementById('detail-meta').textContent = metaParts.join(' · ')

  // Description (optional)
  const descEl = document.getElementById('detail-description')
  if (plant.description) {
    descEl.textContent = plant.description
    descEl.classList.remove('hidden')
  } else {
    descEl.textContent = ''
    descEl.classList.add('hidden')
  }

  // Next watering badge
  const nw = getNextWatering(plant)
  const today = dayStart(new Date())
  const diff = Math.round((nw - today) / 86400000)
  const nwEl = document.getElementById('detail-next-watering')
  if (diff < 0) {
    nwEl.innerHTML = IC_WARN_SVG + ` Прострочено ${Math.abs(diff)} дн.`
    nwEl.className = 'detail-watering-badge overdue'
  } else if (diff === 0) {
    nwEl.innerHTML = IC_WATERDROP + ' Сьогодні'
    nwEl.className = 'detail-watering-badge'
  } else if (diff === 1) {
    nwEl.innerHTML = IC_WATERDROP + ' Завтра'
    nwEl.className = 'detail-watering-badge'
  } else {
    nwEl.innerHTML = IC_WATERDROP + ' ' + formatDate(nw)
    nwEl.className = 'detail-watering-badge'
  }

  // Reset fertilizer toggle + button text
  const fertToggle = document.getElementById('toggle-fertilizer')
  if (fertToggle) fertToggle.checked = false
  const waterBtn = document.getElementById('btn-water')
  if (waterBtn) waterBtn.textContent = 'Полити'

  // Watering history
  renderWateringHistory(plant.id)

  // Repotting — always visible, render as log card
  document.getElementById('detail-repotting-section').classList.remove('hidden')
  const repLog = document.getElementById('repotting-log')
  repLog.innerHTML = ''
  if (plant.next_repotting_date) {
    const entry = createElement('div', 'history-item')
    const iconEl = createElement('span', 'history-item-icon')
    iconEl.innerHTML = IC_POT
    const dateEl = createElement('span', 'history-item-date', formatDate(new Date(plant.next_repotting_date)))
    entry.append(iconEl, dateEl)
    repLog.appendChild(entry)
  } else {
    repLog.appendChild(createElement('p', 'repotting-empty', 'Пересадку не заплановано'))
  }
  if (plant.repotting_notes) {
    const notesEl = createElement('p', 'repotting-notes-text', plant.repotting_notes)
    repLog.appendChild(notesEl)
  }

  // Notes
  renderNotes(plant.id)
}

function renderWateringHistory(plantId) {
  const container = document.getElementById('watering-history')
  const logs = state.wateringLogs[plantId] || []
  container.innerHTML = ''

  if (!logs.length) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text3)">Ще не поливали</p>'
    return
  }

  logs.slice(0, 3).forEach(log => {
    container.appendChild(buildHistoryItem(log))
  })
}

function buildHistoryItem(log) {
  const item = createElement('div', 'history-item')
  const iconEl = createElement('span', 'history-item-icon')
  iconEl.innerHTML = log.with_fertilizer ? IC_SOIL : IC_WATERDROP
  item.append(
    iconEl,
    createElement('span', 'history-item-date', formatDateTime(new Date(log.watered_at)))
  )
  if (log.with_fertilizer) {
    item.appendChild(createElement('span', 'history-item-badge', 'З Добривом'))
  }
  return item
}

function renderNotes(plantId) {
  const container = document.getElementById('notes-list')
  const notes = state.notes[plantId] || []
  container.innerHTML = ''

  if (!notes.length) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text3)">Нотаток ще немає</p>'
    return
  }

  notes.slice(0, 3).forEach(note => container.appendChild(buildNoteItem(note, plantId)))
}

function buildNoteItem(note, plantId) {
  const item = createElement('div', 'note-item')

  const content = createElement('div', 'note-item-content')
  if (note.text) content.appendChild(createElement('p', 'note-item-text', note.text))

  if (note.photo_url) {
    const thumbs = createElement('div', 'note-item-thumbs')
    const img = document.createElement('img')
    img.src = note.photo_url
    img.className = 'note-item-thumb'
    img.alt = ''
    img.loading = 'lazy'
    thumbs.appendChild(img)
    content.appendChild(thumbs)
  }

  item.appendChild(content)

  // Footer: date + delete button
  const footer = createElement('div', 'note-item-footer')
  footer.appendChild(createElement('p', 'note-item-date', formatDateTime(new Date(note.created_at))))

  const delBtn = document.createElement('button')
  delBtn.className = 'note-delete-btn'
  delBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M7 3H9C9 2.73478 8.89464 2.48043 8.70711 2.29289C8.51957 2.10536 8.26522 2 8 2C7.73478 2 7.48043 2.10536 7.29289 2.29289C7.10536 2.48043 7 2.73478 7 3ZM6 3C6 2.46957 6.21071 1.96086 6.58579 1.58579C6.96086 1.21071 7.46957 1 8 1C8.53043 1 9.03914 1.21071 9.41421 1.58579C9.78929 1.96086 10 2.46957 10 3H14C14.1326 3 14.2598 3.05268 14.3536 3.14645C14.4473 3.24021 14.5 3.36739 14.5 3.5C14.5 3.63261 14.4473 3.75979 14.3536 3.85355C14.2598 3.94732 14.1326 4 14 4H13.436L12.231 12.838C12.1493 13.4369 11.8533 13.986 11.3979 14.3835C10.9425 14.781 10.3585 15 9.754 15H6.246C5.64152 15 5.05751 14.781 4.6021 14.3835C4.14669 13.986 3.85073 13.4369 3.769 12.838L2.564 4H2C1.86739 4 1.74021 3.94732 1.64645 3.85355C1.55268 3.75979 1.5 3.63261 1.5 3.5C1.5 3.36739 1.55268 3.24021 1.64645 3.14645C1.74021 3.05268 1.86739 3 2 3H6Z" fill="currentColor"/></svg>`
  delBtn.setAttribute('aria-label', 'Видалити нотатку')
  delBtn.addEventListener('click', e => {
    e.stopPropagation()
    showConfirm('Видалити нотатку?', 'Цю дію неможливо скасувати.', () => deleteNote(note.id, plantId))
  })
  footer.appendChild(delBtn)

  item.appendChild(footer)
  return item
}

async function deleteNote(noteId, plantId) {
  // Remove from state
  if (state.notes[plantId]) {
    state.notes[plantId] = state.notes[plantId].filter(n => n.id !== noteId)
  }

  // Delete from Supabase
  if (sb && !noteId.toString().startsWith('demo-')) {
    const { error } = await sb.from('notes').delete().eq('id', noteId)
    if (error) { showToast('Помилка видалення'); return }
  }

  showToast('Нотатку видалено')
  renderNotes(plantId)

  // Refresh full-notes overlay if open
  const overlay = document.getElementById('overlay-notes')
  if (overlay && overlay.classList.contains('open')) {
    openFullNotes(plantId)
  }
}

/* ═══════════════════════════════════════
   ADD / EDIT PLANT FORM
═══════════════════════════════════════ */
function openAddPlantForm() {
  state.formMode = 'add'
  state.pendingPhotoFile = null
  document.getElementById('plant-form-title').textContent = 'Нова Рослина'
  document.getElementById('btn-plant-form-submit').textContent = 'Додати Рослину'

  // Reset form
  document.getElementById('plant-form').reset()
  document.getElementById('form-photo-img').classList.add('hidden')
  document.getElementById('form-photo-preview').querySelector('.form-photo-placeholder').style.display = ''
  document.getElementById('field-watering-freq').value = 7
  document.getElementById('field-fertilizing-freq').value = ''
  const _dateFieldReset = document.getElementById('field-repotting-date')
  _dateFieldReset.type = 'text'
  _dateFieldReset.value = ''
  _dateFieldReset.placeholder = 'дд.мм.рррр'
  document.getElementById('field-repotting-notes').value = ''

  document.getElementById('field-description').value = ''

  // Reset conditions
  state.selectedConditions = ['sun']
  document.querySelectorAll('.condition-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === 'sun')
  })

  // Reset pot size
  state.selectedPotSizes = []
  document.querySelectorAll('.pot-btn').forEach(btn => btn.classList.remove('active'))

  openSheet('sheet-plant-form')
}

function openEditPlantForm() {
  const plant = state.plants.find(p => p.id === state.currentPlantId)
  if (!plant) return

  state.formMode = 'edit'
  state.pendingPhotoFile = null
  document.getElementById('plant-form-title').textContent = 'Редагувати Рослину'
  document.getElementById('btn-plant-form-submit').textContent = 'Зберегти Зміни'

  document.getElementById('field-name').value = plant.name
  document.getElementById('field-description').value = plant.description || ''
  document.getElementById('field-room').value = plant.room
  document.getElementById('field-watering-freq').value = plant.watering_frequency_days
  document.getElementById('field-fertilizing-freq').value = plant.fertilizing_frequency_days || ''
  const _dateFieldEdit = document.getElementById('field-repotting-date')
  if (plant.next_repotting_date) {
    _dateFieldEdit.type = 'date'
    _dateFieldEdit.value = plant.next_repotting_date
  } else {
    _dateFieldEdit.type = 'text'
    _dateFieldEdit.value = ''
    _dateFieldEdit.placeholder = 'дд.мм.рррр'
  }
  document.getElementById('field-repotting-notes').value = plant.repotting_notes || ''

  // Photo preview
  const formImg = document.getElementById('form-photo-img')
  const placeholder = document.getElementById('form-photo-preview').querySelector('.form-photo-placeholder')
  if (plant.photo_url) {
    formImg.src = plant.photo_url
    formImg.classList.remove('hidden')
    placeholder.style.display = 'none'
  } else {
    formImg.classList.add('hidden')
    placeholder.style.display = ''
  }

  // Conditions (comma-separated for multi-select)
  state.selectedConditions = plant.conditions ? plant.conditions.split(',') : ['sun']
  document.querySelectorAll('.condition-btn').forEach(btn => {
    btn.classList.toggle('active', state.selectedConditions.includes(btn.dataset.value))
  })

  // Pot size (comma-separated for multi-select)
  state.selectedPotSizes = plant.pot_size ? plant.pot_size.split(',') : []
  document.querySelectorAll('.pot-btn').forEach(btn => {
    btn.classList.toggle('active', state.selectedPotSizes.includes(btn.dataset.pot))
  })

  openSheet('sheet-plant-form')
}

async function submitPlantForm(e) {
  e.preventDefault()
  const btn = document.getElementById('btn-plant-form-submit')
  btn.textContent = 'Збереження...'
  btn.disabled = true

  try {
    let photoUrl = null

    if (state.formMode === 'edit') {
      const existing = state.plants.find(p => p.id === state.currentPlantId)
      photoUrl = existing?.photo_url || null
    }

    if (state.pendingPhotoFile) {
      photoUrl = await uploadPhoto(state.pendingPhotoFile)
    }

    const payload = {
      user_id: state.user.id,
      name: document.getElementById('field-name').value.trim(),
      description: document.getElementById('field-description').value.trim() || null,
      room: document.getElementById('field-room').value,
      conditions: state.selectedConditions.join(',') || 'sun',
      watering_frequency_days: parseInt(document.getElementById('field-watering-freq').value) || 7,
      fertilizing_frequency_days: parseInt(document.getElementById('field-fertilizing-freq').value) || null,
      next_repotting_date: document.getElementById('field-repotting-date').value || null,
      repotting_notes: document.getElementById('field-repotting-notes').value.trim() || null,
      photo_url: photoUrl,
      pot_size: state.selectedPotSizes.length ? state.selectedPotSizes.join(',') : null,
    }

    if (state.formMode === 'add') {
      const { data, error } = await sb.from('plants').insert(payload).select().single()
      if (error) throw error
      state.plants.unshift(data)
      showToast('Рослину додано ✓')
    } else {
      const { data, error } = await sb
        .from('plants')
        .update(payload)
        .eq('id', state.currentPlantId)
        .select().single()
      if (error) throw error
      const idx = state.plants.findIndex(p => p.id === state.currentPlantId)
      if (idx !== -1) state.plants[idx] = data
      showToast('Збережено ✓')
      renderPlantDetail(data)
    }

    closeSheet('sheet-plant-form')
    renderPlantsTab()
    renderCalendar()
    state.pendingPhotoFile = null

  } catch (err) {
    console.error(err)
    showToast('Помилка: ' + err.message)
  } finally {
    btn.disabled = false
    btn.textContent = state.formMode === 'add' ? 'Додати Рослину' : 'Зберегти Зміни'
  }
}

/* ═══════════════════════════════════════
   WATERING ACTIONS
═══════════════════════════════════════ */
async function waterPlant() {
  const plantId = state.currentPlantId
  if (!plantId) return

  const fertToggle = document.getElementById('toggle-fertilizer')
  const withFertilizer = fertToggle ? fertToggle.checked : false

  const btn = document.getElementById('btn-water')
  btn.disabled = true

  try {
    const logEntry = { id: 'demo-' + Date.now(), plant_id: plantId, user_id: state.user.id, watered_at: new Date().toISOString(), with_fertilizer: withFertilizer }

    if (!sb) {
      // Demo mode: simulate locally
      if (!state.wateringLogs[plantId]) state.wateringLogs[plantId] = []
      state.wateringLogs[plantId].unshift(logEntry)
    } else {
      const { data, error } = await sb
        .from('watering_logs')
        .insert({ plant_id: plantId, user_id: state.user.id, with_fertilizer: withFertilizer })
        .select().single()
      if (error) throw error
      if (!state.wateringLogs[plantId]) state.wateringLogs[plantId] = []
      state.wateringLogs[plantId].unshift(data)
    }

    if (fertToggle) fertToggle.checked = false
    if (btn) btn.textContent = 'Полити'

    const plant = state.plants.find(p => p.id === plantId)
    renderPlantDetail(plant)
    renderPlantsTab()
    renderCalendar()
    if (sb) await loadJournalData()

    showToast(withFertilizer ? 'Полив з добривом зафіксовано!' : 'Полив зафіксовано!')
  } catch (err) {
    console.error(err)
    showToast('Помилка збереження')
  } finally {
    btn.disabled = false
  }
}

/* ═══════════════════════════════════════
   LOG REPOTTING
═══════════════════════════════════════ */
async function logRepotting() {
  const plantId = state.currentPlantId
  if (!plantId) return

  try {
    const today = new Date().toISOString().slice(0, 10)
    const idx = state.plants.findIndex(p => p.id === plantId)

    if (!sb) {
      // Demo mode: simulate locally
      if (idx !== -1) state.plants[idx] = { ...state.plants[idx], next_repotting_date: today }
      renderPlantDetail(state.plants[idx])
    } else {
      const { data, error } = await sb
        .from('plants')
        .update({ next_repotting_date: today })
        .eq('id', plantId)
        .select().single()
      if (error) throw error
      if (idx !== -1) state.plants[idx] = data
      renderPlantDetail(data)
    }

    showToast('Пересадку зафіксовано!')
  } catch (err) {
    console.error(err)
    showToast('Помилка збереження')
  }
}

/* ═══════════════════════════════════════
   CHANGE PLANT PHOTO (from detail)
═══════════════════════════════════════ */
async function changePlantPhoto(file) {
  if (!file || !state.currentPlantId) return

  showLoadingOverlay()
  try {
    if (!sb) {
      // Demo mode: use object URL for in-session preview
      const photoUrl = URL.createObjectURL(file)
      const idx = state.plants.findIndex(p => p.id === state.currentPlantId)
      if (idx !== -1) state.plants[idx] = { ...state.plants[idx], photo_url: photoUrl }
      renderPlantDetail(state.plants[idx])
      renderPlantsTab()
      showToast('Фото оновлено ✓')
      return
    }
    const photoUrl = await uploadPhoto(file)
    const { data, error } = await sb
      .from('plants')
      .update({ photo_url: photoUrl })
      .eq('id', state.currentPlantId)
      .select().single()
    if (error) throw error

    const idx = state.plants.findIndex(p => p.id === state.currentPlantId)
    if (idx !== -1) state.plants[idx] = data

    renderPlantDetail(data)
    renderPlantsTab()
    showToast('Фото оновлено ✓')
  } catch (err) {
    showToast('Помилка завантаження фото')
  } finally {
    hideLoadingOverlay()
  }
}

/* ═══════════════════════════════════════
   NOTES
═══════════════════════════════════════ */
function openAddNoteForm() {
  state.pendingNotePhotoFile = null
  document.getElementById('note-form').reset()
  document.getElementById('note-photo-preview').classList.add('hidden')
  openSheet('sheet-note-form')
}

async function submitNoteForm(e) {
  e.preventDefault()
  const btn = e.target.querySelector('button[type=submit]')
  btn.textContent = 'Збереження...'
  btn.disabled = true

  const plantId = state.currentPlantId
  try {
    let photoUrl = null
    if (state.pendingNotePhotoFile) {
      if (!sb) {
        photoUrl = URL.createObjectURL(state.pendingNotePhotoFile)
      } else {
        photoUrl = await uploadPhoto(state.pendingNotePhotoFile, 'notes')
      }
    }

    const text = document.getElementById('field-note-text').value.trim()
    if (!text && !photoUrl) {
      showToast('Додайте текст або фото')
      return
    }

    const noteData = { id: 'demo-note-' + Date.now(), plant_id: plantId, user_id: state.user.id, text: text || null, photo_url: photoUrl, created_at: new Date().toISOString() }

    if (!sb) {
      if (!state.notes[plantId]) state.notes[plantId] = []
      state.notes[plantId].unshift(noteData)
    } else {
      const { data, error } = await sb
        .from('notes')
        .insert({ plant_id: plantId, user_id: state.user.id, text: text || null, photo_url: photoUrl })
        .select().single()
      if (error) throw error
      if (!state.notes[plantId]) state.notes[plantId] = []
      state.notes[plantId].unshift(data)
    }

    const plant = state.plants.find(p => p.id === plantId)
    renderNotes(plantId)
    closeSheet('sheet-note-form')
    await loadJournalData()
    showToast('Нотатку додано ✓')
  } catch (err) {
    console.error(err)
    showToast('Помилка: ' + err.message)
  } finally {
    btn.disabled = false
    btn.textContent = 'Зберегти нотатку'
    state.pendingNotePhotoFile = null
  }
}

/* ═══════════════════════════════════════
   DELETE PLANT
═══════════════════════════════════════ */
async function deletePlant() {
  const plantId = state.currentPlantId
  if (!plantId) return

  showConfirm(
    'Видалити рослину?',
    'Всі поливи та нотатки також будуть видалені. Це незворотньо.',
    async () => {
      showLoadingOverlay()
      try {
        const { error } = await sb.from('plants').delete().eq('id', plantId)
        if (error) throw error

        state.plants = state.plants.filter(p => p.id !== plantId)
        delete state.wateringLogs[plantId]
        delete state.notes[plantId]

        closeOverlay('overlay-detail')
        renderPlantsTab()
        renderCalendar()
        await loadJournalData()
        showToast('Рослину видалено')
      } catch (err) {
        showToast('Помилка видалення')
      } finally {
        hideLoadingOverlay()
      }
    }
  )
}

/* ═══════════════════════════════════════
   PHOTO UPLOAD
═══════════════════════════════════════ */
async function uploadPhoto(file, folder = 'plants') {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${state.user.id}/${folder}/${Date.now()}.${ext}`

  const { error } = await sb.storage
    .from('plant-photos')
    .upload(path, file, { cacheControl: '3600', upsert: true })

  if (error) throw error

  const { data: { publicUrl } } = sb.storage
    .from('plant-photos')
    .getPublicUrl(path)

  return publicUrl
}

function setPhotoPreview(file, imgEl, placeholderEl) {
  if (!file) return
  const url = URL.createObjectURL(file)
  imgEl.src = url
  imgEl.classList.remove('hidden')
  if (placeholderEl) placeholderEl.style.display = 'none'
}

/* ═══════════════════════════════════════
   RENDER — CALENDAR
═══════════════════════════════════════ */
function renderCalendar() {
  const container = document.getElementById('calendar-container')
  const date = state.calendarDate
  const year = date.getFullYear()
  const month = date.getMonth()

  // Build events map: 'YYYY-MM-DD' → [{type, plantName}]
  const events = buildCalendarEvents(year, month)

  const monthLabel = new Intl.DateTimeFormat('uk-UA', { month: 'long', year: 'numeric' }).format(date)

  container.innerHTML = `
    <div class="calendar-nav">
      <button class="calendar-nav-btn" id="cal-prev">‹</button>
      <span class="calendar-month-label">${monthLabel}</span>
      <button class="calendar-nav-btn" id="cal-next">›</button>
    </div>
    <div class="calendar-weekdays">
      ${['Пн','Вт','Ср','Чт','Пт','Сб','Нд'].map(d => `<div class="calendar-weekday">${d}</div>`).join('')}
    </div>
    <div class="calendar-grid" id="calendar-grid"></div>
  `

  document.getElementById('cal-prev').addEventListener('click', () => {
    state.calendarDate = new Date(year, month - 1, 1)
    renderCalendar()
  })
  document.getElementById('cal-next').addEventListener('click', () => {
    state.calendarDate = new Date(year, month + 1, 1)
    renderCalendar()
  })

  const grid = document.getElementById('calendar-grid')
  const today = dayStart(new Date())

  // First day of month (0=Sun, adjust for Mon-start)
  const firstDay = new Date(year, month, 1)
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7

  for (let i = 0; i < totalCells; i++) {
    let cellDate, otherMonth = false

    if (i < startDow) {
      cellDate = new Date(year, month - 1, daysInPrevMonth - startDow + i + 1)
      otherMonth = true
    } else if (i >= startDow + daysInMonth) {
      cellDate = new Date(year, month + 1, i - startDow - daysInMonth + 1)
      otherMonth = true
    } else {
      cellDate = new Date(year, month, i - startDow + 1)
    }

    const key = dateKey(cellDate)
    const dayEvents = events[key] || []
    const isToday = cellDate.getTime() === today.getTime()

    const dayEl = createElement('div', `calendar-day${otherMonth ? ' other-month' : ''}${isToday ? ' today' : ''}${dayEvents.length ? ' has-events' : ''}`)

    const numEl = createElement('div', 'calendar-day-num', String(cellDate.getDate()))
    dayEl.appendChild(numEl)

    if (dayEvents.length) {
      const dotsEl = createElement('div', 'calendar-day-dots')
      const types = [...new Set(dayEvents.map(e => e.type))].slice(0, 3)
      types.forEach(t => {
        dotsEl.appendChild(createElement('div', `dot dot-${t}`))
      })
      dayEl.appendChild(dotsEl)

      const capturedDate = new Date(cellDate)
      const capturedKey = key
      dayEl.addEventListener('click', () => showDayEvents(capturedDate, dayEvents))
    }

    grid.appendChild(dayEl)
  }
}

function buildCalendarEvents(year, month) {
  const events = {}

  for (const plant of state.plants) {
    const logs = state.wateringLogs[plant.id] || []
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Generate watering events for this month based on frequency
    const lastLog = logs[0]
    const baseDate = lastLog ? new Date(lastLog.watered_at) : new Date(plant.created_at)
    const freq = plant.watering_frequency_days

    // Go backwards/forwards from base to fill month
    let cursor = dayStart(baseDate)

    // Go forward from base
    while (cursor <= lastDay) {
      if (cursor >= firstDay) {
        const key = dateKey(cursor)
        if (!events[key]) events[key] = []
        events[key].push({ type: 'water', plantName: plant.name, plantId: plant.id })
      }
      cursor = new Date(cursor)
      cursor.setDate(cursor.getDate() + freq)
    }

    // Go backward from base
    cursor = dayStart(baseDate)
    cursor.setDate(cursor.getDate() - freq)
    while (cursor >= firstDay) {
      const key = dateKey(cursor)
      if (!events[key]) events[key] = []
      events[key].push({ type: 'water', plantName: plant.name, plantId: plant.id })
      cursor = new Date(cursor)
      cursor.setDate(cursor.getDate() - freq)
    }

    // Fertilizing events
    if (plant.fertilizing_frequency_days) {
      const lastFert = logs.find(l => l.with_fertilizer)
      const baseFert = lastFert ? new Date(lastFert.watered_at) : new Date(plant.created_at)
      const fertFreq = plant.fertilizing_frequency_days
      let fc = dayStart(baseFert)

      while (fc <= lastDay) {
        if (fc >= firstDay) {
          const key = dateKey(fc)
          if (!events[key]) events[key] = []
          events[key].push({ type: 'fertilizer', plantName: plant.name, plantId: plant.id })
        }
        fc = new Date(fc)
        fc.setDate(fc.getDate() + fertFreq)
      }

      fc = dayStart(baseFert)
      fc.setDate(fc.getDate() - fertFreq)
      while (fc >= firstDay) {
        const key = dateKey(fc)
        if (!events[key]) events[key] = []
        events[key].push({ type: 'fertilizer', plantName: plant.name, plantId: plant.id })
        fc = new Date(fc)
        fc.setDate(fc.getDate() - fertFreq)
      }
    }

    // Repotting
    if (plant.next_repotting_date) {
      const rd = dayStart(new Date(plant.next_repotting_date))
      if (rd >= firstDay && rd <= lastDay) {
        const key = dateKey(rd)
        if (!events[key]) events[key] = []
        events[key].push({ type: 'repotting', plantName: plant.name, plantId: plant.id })
      }
    }
  }

  // Also mark actual logged waterings
  for (const plant of state.plants) {
    const logs = state.wateringLogs[plant.id] || []
    for (const log of logs) {
      const d = dayStart(new Date(log.watered_at))
      const first = new Date(year, month, 1)
      const last = new Date(year, month + 1, 0)
      if (d >= first && d <= last) {
        const key = dateKey(d)
        // Mark as done (already shown via water dot)
      }
    }
  }

  return events
}

function isEventLogged(plantId, type, date) {
  const key = dateKey(dayStart(date))
  if (type === 'water') {
    const logs = state.wateringLogs[plantId] || []
    return logs.some(l => !l.with_fertilizer && dateKey(dayStart(new Date(l.watered_at))) === key)
  }
  if (type === 'fertilizer') {
    const logs = state.wateringLogs[plantId] || []
    return logs.some(l => l.with_fertilizer && dateKey(dayStart(new Date(l.watered_at))) === key)
  }
  if (type === 'repotting') {
    const plant = state.plants.find(p => p.id === plantId)
    return !!(plant && plant.next_repotting_date && dateKey(dayStart(new Date(plant.next_repotting_date))) === key)
  }
  return false
}

async function toggleCalendarEvent(plantId, type, date, isDone) {
  const dateStr = dateKey(dayStart(date))

  try {
    if (type === 'water' || type === 'fertilizer') {
      const withFertilizer = type === 'fertilizer'
      if (!isDone) {
        // Mark as done: create a watering log for this date
        const logEntry = {
          id: 'demo-' + Date.now(),
          plant_id: plantId,
          user_id: state.user.id,
          watered_at: new Date(date).toISOString(),
          with_fertilizer: withFertilizer
        }
        if (!sb) {
          if (!state.wateringLogs[plantId]) state.wateringLogs[plantId] = []
          state.wateringLogs[plantId].unshift(logEntry)
        } else {
          const { data, error } = await sb
            .from('watering_logs')
            .insert({ plant_id: plantId, user_id: state.user.id, with_fertilizer: withFertilizer, watered_at: new Date(date).toISOString() })
            .select().single()
          if (error) throw error
          if (!state.wateringLogs[plantId]) state.wateringLogs[plantId] = []
          state.wateringLogs[plantId].unshift(data)
        }
      } else {
        // Mark as undone: remove the log for this date
        const logs = state.wateringLogs[plantId] || []
        const idx = logs.findIndex(l => l.with_fertilizer === withFertilizer && dateKey(dayStart(new Date(l.watered_at))) === dateStr)
        if (idx !== -1) {
          if (!sb) {
            state.wateringLogs[plantId].splice(idx, 1)
          } else {
            const { error } = await sb.from('watering_logs').delete().eq('id', logs[idx].id)
            if (error) throw error
            state.wateringLogs[plantId].splice(idx, 1)
          }
        }
      }
    } else if (type === 'repotting') {
      const idx = state.plants.findIndex(p => p.id === plantId)
      if (!isDone) {
        // Mark repotting as done: set next_repotting_date to this date
        if (!sb) {
          if (idx !== -1) state.plants[idx] = { ...state.plants[idx], next_repotting_date: dateStr }
        } else {
          const { data, error } = await sb.from('plants').update({ next_repotting_date: dateStr }).eq('id', plantId).select().single()
          if (error) throw error
          if (idx !== -1) state.plants[idx] = data
        }
      } else {
        // Unmark: clear the repotting date
        if (!sb) {
          if (idx !== -1) state.plants[idx] = { ...state.plants[idx], next_repotting_date: null }
        } else {
          const { data, error } = await sb.from('plants').update({ next_repotting_date: null }).eq('id', plantId).select().single()
          if (error) throw error
          if (idx !== -1) state.plants[idx] = data
        }
      }
    }

    // Sync back to detail page if it's the current plant
    if (state.currentPlantId === plantId) {
      const plant = state.plants.find(p => p.id === plantId)
      if (plant) renderPlantDetail(plant)
    }
    renderCalendar()
    renderPlantsTab()
  } catch (err) {
    console.error(err)
    showToast('Помилка збереження')
  }
}

const IC_CHECK = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`

function showDayEvents(date, events) {
  const panel = document.getElementById('calendar-day-events')
  const title = document.getElementById('day-events-title')
  const list = document.getElementById('day-events-list')

  title.textContent = formatDate(date)
  list.innerHTML = ''
  panel.classList.remove('hidden')

  if (!events.length) {
    list.innerHTML = '<p style="font-size:14px;color:var(--text2)">Нічого заплановано</p>'
    return
  }

  const typeLabels = { water: 'Полив', fertilizer: 'Добриво', repotting: 'Пересадка' }
  const typeIcons = { water: IC_WATERDROP, fertilizer: IC_SOIL, repotting: IC_POT }

  const renderList = () => {
    list.innerHTML = ''
    for (const ev of events) {
      const done = ev.plantId ? isEventLogged(ev.plantId, ev.type, date) : false

      const item = createElement('div', done ? 'day-event-item done' : 'day-event-item')

      const checkBtn = document.createElement('button')
      checkBtn.className = 'day-event-check' + (done ? (' done' + (ev.type === 'fertilizer' ? ' fertilizer-done' : '')) : '')
      checkBtn.innerHTML = done ? IC_CHECK : ''

      const iconEl = createElement('span', 'day-event-icon')
      iconEl.innerHTML = typeIcons[ev.type] || ''

      const info = createElement('div', 'day-event-info')
      const plantEl = createElement('div', 'day-event-plant', ev.plantName)
      const typeEl = createElement('div', 'day-event-type', typeLabels[ev.type] || ev.type)
      info.append(plantEl, typeEl)

      item.append(checkBtn, iconEl, info)

      if (ev.plantId) {
        checkBtn.addEventListener('click', async () => {
          checkBtn.disabled = true
          await toggleCalendarEvent(ev.plantId, ev.type, date, done)
          renderList()
        })
      }

      list.appendChild(item)
    }
  }

  renderList()
}

/* ═══════════════════════════════════════
   RENDER — JOURNAL
═══════════════════════════════════════ */
function renderJournal() {
  const list = document.getElementById('journal-list')
  // #journal-loading lives inside #journal-list — after the first render
  // list.innerHTML='' removes it from the DOM, so guard against null
  document.getElementById('journal-loading')?.classList.add('hidden')
  list.innerHTML = ''

  // Build unified timeline
  let items = []

  for (const plant of state.plants) {
    const logs = state.wateringLogs[plant.id] || []
    const notes = state.notes[plant.id] || []

    for (const log of logs) {
      if (state.journalFilter !== 'all') {
        if (state.journalFilter === 'water' && log.with_fertilizer) continue
        if (state.journalFilter === 'fertilizer' && !log.with_fertilizer) continue
        if (state.journalFilter === 'note') continue
      }
      items.push({
        type: log.with_fertilizer ? 'fertilizer' : 'water',
        date: new Date(log.watered_at),
        plantName: plant.name,
        plantId: plant.id,
        data: log
      })
    }

    for (const note of notes) {
      if (state.journalFilter !== 'all' && state.journalFilter !== 'note') continue
      items.push({
        type: 'note',
        date: new Date(note.created_at),
        plantName: plant.name,
        plantId: plant.id,
        data: note
      })
    }
  }

  items.sort((a, b) => b.date - a.date)

  if (!items.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 5.33333C22 4.67029 21.7366 4.03441 21.2678 3.56557C20.7989 3.09673 20.163 2.83333 19.5 2.83333H18.8583C18.7845 2.83271 18.7121 2.81324 18.6479 2.77678C18.5838 2.74032 18.53 2.68808 18.4917 2.625C18.3832 2.43551 18.2268 2.27796 18.038 2.16823C17.8493 2.0585 17.635 2.00048 17.4167 2H5.33333C5.00181 2 4.68387 2.1317 4.44945 2.36612C4.21503 2.60054 4.08333 2.91848 4.08333 3.25V3.875C4.08333 3.93025 4.10528 3.98324 4.14435 4.02231C4.18342 4.06138 4.23641 4.08333 4.29167 4.08333H5.33333C5.55435 4.08333 5.76631 4.17113 5.92259 4.32741C6.07887 4.48369 6.16667 4.69565 6.16667 4.91667C6.16667 5.13768 6.07887 5.34964 5.92259 5.50592C5.76631 5.6622 5.55435 5.75 5.33333 5.75H2.83333C2.61232 5.75 2.40036 5.8378 2.24408 5.99408C2.0878 6.15036 2 6.36232 2 6.58333C2 6.80435 2.0878 7.01631 2.24408 7.17259C2.40036 7.32887 2.61232 7.41667 2.83333 7.41667H3.90833C3.96359 7.41667 4.01658 7.43862 4.05565 7.47769C4.09472 7.51676 4.11667 7.56975 4.11667 7.625V10.125C4.11667 10.1803 4.13862 10.2332 4.17769 10.2723C4.21676 10.3114 4.26975 10.3333 4.325 10.3333H5.33333C5.55435 10.3333 5.76631 10.4211 5.92259 10.5774C6.07887 10.7337 6.16667 10.9457 6.16667 11.1667C6.16667 11.3877 6.07887 11.5996 5.92259 11.7559C5.76631 11.9122 5.55435 12 5.33333 12H2.83333C2.61232 12 2.40036 12.0878 2.24408 12.2441C2.0878 12.4004 2 12.6123 2 12.8333C2 13.0543 2.0878 13.2663 2.24408 13.4226C2.40036 13.5789 2.61232 13.6667 2.83333 13.6667H3.90833C3.96359 13.6667 4.01658 13.6886 4.05565 13.7277C4.09472 13.7668 4.11667 13.8197 4.11667 13.875V16.375C4.11667 16.4303 4.13862 16.4832 4.17769 16.5223C4.21676 16.5614 4.26975 16.5833 4.325 16.5833H5.33333C5.55435 16.5833 5.76631 16.6711 5.92259 16.8274C6.07887 16.9837 6.16667 17.1957 6.16667 17.4167C6.16667 17.6377 6.07887 17.8496 5.92259 18.0059C5.76631 18.1622 5.55435 18.25 5.33333 18.25H2.83333C2.61232 18.25 2.40036 18.3378 2.24408 18.4941C2.0878 18.6504 2 18.8623 2 19.0833C2 19.3043 2.0878 19.5163 2.24408 19.6726C2.40036 19.8289 2.61232 19.9167 2.83333 19.9167H3.90833C3.96359 19.9167 4.01658 19.9386 4.05565 19.9777C4.09472 20.0168 4.11667 20.0697 4.11667 20.125V20.75C4.11655 21.0758 4.24366 21.3888 4.47092 21.6223C4.69818 21.8558 5.00762 21.9913 5.33333 22H17.4167C17.635 21.9995 17.8493 21.9415 18.038 21.8318C18.2268 21.722 18.3832 21.5645 18.4917 21.375C18.53 21.3119 18.5838 21.2597 18.6479 21.2232C18.7121 21.1868 18.7845 21.1673 18.8583 21.1667H19.5C20.163 21.1667 20.7989 20.9033 21.2678 20.4344C21.7366 19.9656 22 19.3297 22 18.6667V5.33333ZM14.675 8.66667C14.675 8.99819 14.5433 9.31613 14.3089 9.55055C14.0745 9.78497 13.7565 9.91667 13.425 9.91667H9.91667C9.58515 9.91667 9.2672 9.78497 9.03278 9.55055C8.79836 9.31613 8.66667 8.99819 8.66667 8.66667V6.58333C8.66667 6.25181 8.79836 5.93387 9.03278 5.69945C9.2672 5.46503 9.58515 5.33333 9.91667 5.33333H13.425C13.7565 5.33333 14.0745 5.46503 14.3089 5.69945C14.5433 5.93387 14.675 6.25181 14.675 6.58333V8.66667ZM20.3333 10.9583C20.3333 11.0136 20.3114 11.0666 20.2723 11.1056C20.2332 11.1447 20.1803 11.1667 20.125 11.1667H18.875C18.8197 11.1667 18.7668 11.1447 18.7277 11.1056C18.6886 11.0666 18.6667 11.0136 18.6667 10.9583V8.875C18.6667 8.81975 18.6886 8.76676 18.7277 8.72769C18.7668 8.68862 18.8197 8.66667 18.875 8.66667H20.125C20.1803 8.66667 20.2332 8.68862 20.2723 8.72769C20.3114 8.76676 20.3333 8.81975 20.3333 8.875V10.9583ZM18.6667 13.0417C18.6667 12.9864 18.6886 12.9334 18.7277 12.8944C18.7668 12.8553 18.8197 12.8333 18.875 12.8333H20.125C20.1803 12.8333 20.2332 12.8553 20.2723 12.8944C20.3114 12.9334 20.3333 12.9864 20.3333 13.0417V15.125C20.3333 15.1803 20.3114 15.2332 20.2723 15.2723C20.2332 15.3114 20.1803 15.3333 20.125 15.3333H18.875C18.8197 15.3333 18.7668 15.3114 18.7277 15.2723C18.6886 15.2332 18.6667 15.1803 18.6667 15.125V13.0417ZM20.3333 5.33333V6.79167C20.3333 6.84692 20.3114 6.89991 20.2723 6.93898C20.2332 6.97805 20.1803 7 20.125 7H18.875C18.8197 7 18.7668 6.97805 18.7277 6.93898C18.6886 6.89991 18.6667 6.84692 18.6667 6.79167V4.70833C18.6667 4.65308 18.6886 4.60009 18.7277 4.56102C18.7668 4.52195 18.8197 4.5 18.875 4.5H19.5C19.721 4.5 19.933 4.5878 20.0893 4.74408C20.2455 4.90036 20.3333 5.11232 20.3333 5.33333ZM20.3333 18.6667C20.3333 18.8877 20.2455 19.0996 20.0893 19.2559C19.933 19.4122 19.721 19.5 19.5 19.5H18.875C18.8197 19.5 18.7668 19.4781 18.7277 19.439C18.6886 19.3999 18.6667 19.3469 18.6667 19.2917V17.2083C18.6667 17.1531 18.6886 17.1001 18.7277 17.061C18.7668 17.0219 18.8197 17 18.875 17H20.125C20.1803 17 20.2332 17.0219 20.2723 17.061C20.3114 17.1001 20.3333 17.1531 20.3333 17.2083V18.6667Z" fill="#ADDC58" fill-opacity="0.2"/></svg></div><h3>Журнал Порожній</h3><p>Тут буде відображатись ваш догляд за рослинами</p></div>'
    return
  }

  // Group by date
  const groups = {}
  for (const item of items) {
    const key = dateKey(item.date)
    if (!groups[key]) groups[key] = { date: item.date, items: [] }
    groups[key].items.push(item)
  }

  for (const key of Object.keys(groups).sort().reverse()) {
    const group = groups[key]
    const groupEl = createElement('div', 'journal-date-group')
    groupEl.appendChild(createElement('div', 'journal-date-label', formatDateRelative(group.date)))

    const itemsEl = createElement('div', 'journal-items')
    for (const item of group.items) {
      itemsEl.appendChild(buildJournalItem(item))
    }
    groupEl.appendChild(itemsEl)
    list.appendChild(groupEl)
  }
}

function buildJournalItem(item) {
  const el = createElement('div', 'journal-item')

  const accent = createElement('div', `journal-item-accent ${item.type}`)
  el.appendChild(accent)

  const content = createElement('div', 'journal-item-content')
  const top = createElement('div', 'journal-item-top')

  const typeInfo = {
    water: { icon: IC_WATERDROP, title: 'Полив' },
    fertilizer: { icon: IC_SOIL, title: 'Добриво' },
    note: { icon: IC_NOTE, title: 'Нотатка' },
  }

  const iconEl = createElement('span', 'journal-item-icon')
  iconEl.innerHTML = typeInfo[item.type]?.icon || ''
  top.appendChild(iconEl)
  top.appendChild(createElement('span', 'journal-item-title', typeInfo[item.type]?.title || item.type))
  content.appendChild(top)
  content.appendChild(createElement('div', 'journal-item-plant', item.plantName))

  if (item.type === 'note' && item.data.text) {
    const textEl = createElement('div', 'journal-item-note-text',
      item.data.text.length > 80 ? item.data.text.slice(0, 80) + '…' : item.data.text)
    content.appendChild(textEl)
  }

  content.appendChild(createElement('div', 'journal-item-time', formatTime(item.date)))
  el.appendChild(content)

  if (item.type === 'note' && item.data.photo_url) {
    const photoDiv = createElement('div', 'journal-item-photo')
    const img = document.createElement('img')
    img.src = item.data.photo_url
    img.alt = ''
    img.loading = 'lazy'
    photoDiv.appendChild(img)
    el.appendChild(photoDiv)
  }

  el.addEventListener('click', () => openPlantDetail(item.plantId))
  return el
}

/* ═══════════════════════════════════════
   UI HELPERS
═══════════════════════════════════════ */
function showApp() {
  document.getElementById('view-auth').classList.remove('active')
  document.getElementById('view-app').classList.add('active')
  switchTab('plants')
}

function showAuth() {
  document.getElementById('view-app').classList.remove('active')
  document.getElementById('view-auth').classList.add('active')
}

function switchTab(tabName) {
  state.activeTab = tabName

  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'))
  document.getElementById(`tab-${tabName}`).classList.remove('hidden')

  document.querySelectorAll('.tab-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tabName)
  })

  if (tabName === 'calendar') renderCalendar()
  if (tabName === 'journal') renderJournal()
  if (tabName === 'profile') renderProfile()
}

function openOverlay(id) {
  const el = document.getElementById(id)
  el.style.display = 'flex'
  // tiny delay so display:flex is painted before transform kicks in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('open'))
  })
}

function closeOverlay(id) {
  const el = document.getElementById(id)
  el.classList.remove('open')
  setTimeout(() => { if (!el.classList.contains('open')) el.style.display = 'none' }, 280)
}

function openSheet(id) {
  document.getElementById(id).classList.add('open')
}

function closeSheet(id) {
  document.getElementById(id).classList.remove('open')
}

function showToast(msg, duration = 2500) {
  const toast = document.getElementById('toast')
  toast.textContent = msg
  toast.classList.remove('hidden')
  toast.classList.add('show')
  clearTimeout(toast._timer)
  toast._timer = setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.classList.add('hidden'), 200)
  }, duration)
}

let _confirmCallback = null
function showConfirm(title, msg, onConfirm) {
  _confirmCallback = onConfirm
  document.getElementById('dialog-title').textContent = title
  document.getElementById('dialog-message').textContent = msg
  document.getElementById('dialog-confirm').classList.remove('hidden')
}

let _loadingEl = null
function showLoadingOverlay() {
  if (_loadingEl) return
  _loadingEl = createElement('div', 'loading-overlay')
  _loadingEl.innerHTML = '<div class="spinner"></div>'
  document.body.appendChild(_loadingEl)
}
function hideLoadingOverlay() {
  if (_loadingEl) { _loadingEl.remove(); _loadingEl = null }
}

/* ═══════════════════════════════════════
   MORE MENU
═══════════════════════════════════════ */
function openMoreMenu() {
  openSheet('sheet-more-actions')
}

/* ═══════════════════════════════════════
   FULL HISTORY OVERLAY
═══════════════════════════════════════ */
function openFullHistory(plantId) {
  const logs = state.wateringLogs[plantId] || []
  const container = document.getElementById('full-history-list')
  container.innerHTML = ''

  if (!logs.length) {
    container.innerHTML = '<p style="font-size:14px;color:var(--text3);padding:20px">Ще немає поливів</p>'
  } else {
    logs.forEach(log => container.appendChild(buildHistoryItem(log)))
  }

  openOverlay('overlay-history')
}

/* ═══════════════════════════════════════
   FULL NOTES OVERLAY
═══════════════════════════════════════ */
function openFullNotes(plantId) {
  const notes = state.notes[plantId] || []
  const container = document.getElementById('full-notes-list')
  container.innerHTML = ''

  if (!notes.length) {
    container.innerHTML = '<p style="font-size:14px;color:var(--text3);padding:20px">Нотаток ще немає</p>'
  } else {
    notes.forEach(note => container.appendChild(buildNoteItem(note, plantId)))
  }

  openOverlay('overlay-notes')
}

/* ═══════════════════════════════════════
   RENDER — PROFILE
═══════════════════════════════════════ */
function renderProfile() {
  const user = state.user

  // Avatar: use Google photo if available
  const avatarEl = document.getElementById('profile-avatar')
  const photoUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture
  if (photoUrl) {
    avatarEl.innerHTML = `<img src="${photoUrl}" alt="">`
  } else {
    avatarEl.textContent = '🌿'
  }

  // Name + email
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Користувач'
  document.getElementById('profile-display-name').textContent = name
  document.getElementById('profile-email-text').textContent = user?.email || 'demo@plantdiary.app'

  // Pre-fill notification email
  const notifEmail = document.getElementById('field-notif-email')
  if (!notifEmail.value) notifEmail.value = user?.email || ''

  // Stats
  const totalWaterings = Object.values(state.wateringLogs).reduce((s, logs) => s + logs.length, 0)
  const totalNotes = Object.values(state.notes).reduce((s, notes) => s + notes.length, 0)
  document.getElementById('profile-plant-count').textContent = state.plants.length
  document.getElementById('profile-watering-count').textContent = totalWaterings
  document.getElementById('profile-notes-count').textContent = totalNotes
}

async function saveNotifEmail() {
  const email = document.getElementById('field-notif-email').value.trim()
  if (!email || !email.includes('@')) { showToast('Введіть коректну пошту'); return }
  // In real app: save to user metadata via Supabase
  // await sb.auth.updateUser({ data: { notification_email: email } })
  showToast('Пошту збережено ✓')
}

async function deleteAccount() {
  showLoadingOverlay()
  try {
    // In real app: call Supabase admin to delete user
    // await sb.rpc('delete_user')
    await signOut()
    showToast('Акаунт видалено')
  } catch (err) {
    showToast('Помилка видалення акаунту')
  } finally {
    hideLoadingOverlay()
  }
}

/* ═══════════════════════════════════════
   DATE HELPERS
═══════════════════════════════════════ */
function dateKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function formatDate(date) {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(date)
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(date)
}

function formatTime(date) {
  return new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function formatDateRelative(date) {
  const today = dayStart(new Date())
  const d = dayStart(date)
  const diff = Math.round((today - d) / 86400000)
  if (diff === 0) return 'Сьогодні'
  if (diff === 1) return 'Вчора'
  if (diff === 2) return 'Позавчора'
  return formatDate(date)
}

/* ═══════════════════════════════════════
   TRANSLATIONS
═══════════════════════════════════════ */
const LANG = {
  uk: {
    tab_plants: 'Рослини', tab_calendar: 'Календар', tab_journal: 'Журнал', tab_profile: 'Профіль',
    title_plants: 'Мої Рослини', title_calendar: 'Календар', title_journal: 'Журнал Догляду', title_profile: 'Профіль',
    filter_all: 'Всі', filter_water: 'Полив', filter_fertilizer: 'Добриво', filter_note: 'Нотатки',
    stat_plants: 'Рослин', stat_waterings: 'Поливів', stat_notes: 'Нотаток',
    section_notifications: 'Сповіщення', toggle_notifications: 'Увімкнути сповіщення', notif_email: 'Пошта для сповіщень',
    section_account: 'Акаунт', signout: 'Вийти з акаунту', delete_account: 'Видалити акаунт',
    section_settings: 'Налаштування', language: 'Мова', save: 'Зберегти',
    status_ok: n => `Через ${n} дн.`, status_today: 'Полити сьогодні', status_soon: 'Завтра полив', status_overdue: n => `Прострочено ${n} дн.`,
    cond_sun: 'Сонце', cond_partial: 'Напівтінь', cond_shade: 'Тінь',
    empty_plants: 'Ще немає рослин', empty_plants_sub: 'Додайте першу рослину, натиснувши +',
    empty_room: r => `Немає рослин у кімнаті "${r}"`, empty_room_sub: 'Оберіть іншу кімнату або додайте рослину',
    empty_journal: 'Журнал порожній', empty_journal_sub: 'Почніть поливати рослини!',
    notif_on: 'Сповіщення увімкнено', notif_off: 'Сповіщення вимкнено',
  },
  en: {
    tab_plants: 'Plants', tab_calendar: 'Calendar', tab_journal: 'Journal', tab_profile: 'Profile',
    title_plants: 'My Plants', title_calendar: 'Calendar', title_journal: 'Care Journal', title_profile: 'Profile',
    filter_all: 'All', filter_water: 'Watering', filter_fertilizer: 'Fertilizer', filter_note: 'Notes',
    stat_plants: 'Plants', stat_waterings: 'Waterings', stat_notes: 'Notes',
    section_notifications: 'Notifications', toggle_notifications: 'Enable notifications', notif_email: 'Notification email',
    section_account: 'Account', signout: 'Sign out', delete_account: 'Delete account',
    section_settings: 'Settings', language: 'Language', save: 'Save',
    status_ok: n => `In ${n} d.`, status_today: 'Water today', status_soon: 'Tomorrow', status_overdue: n => `Overdue ${n} d.`,
    cond_sun: 'Sun', cond_partial: 'Part shade', cond_shade: 'Shade',
    empty_plants: 'No plants yet', empty_plants_sub: 'Add your first plant by tapping +',
    empty_room: r => `No plants in "${r}"`, empty_room_sub: 'Select another room or add a plant',
    empty_journal: 'Journal is empty', empty_journal_sub: 'Start watering your plants!',
    notif_on: 'Notifications enabled', notif_off: 'Notifications disabled',
  }
}
function t(key, arg) {
  const val = (LANG[state.lang] || LANG.uk)[key]
  return typeof val === 'function' ? val(arg) : (val ?? key)
}
function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = (LANG[state.lang] || LANG.uk)[el.dataset.i18n]
    if (v && typeof v === 'string') el.textContent = v
  })
  document.getElementById('btn-lang-uk').classList.toggle('active', state.lang !== 'en')
  document.getElementById('btn-lang-en').classList.toggle('active', state.lang === 'en')
  renderPlantsTab()
  renderJournal()
}

const CONDITIONS = {
  sun:     { key: 'cond_sun' },
  partial: { key: 'cond_partial' },
  shade:   { key: 'cond_shade' },
}
function conditionsLabel(val) {
  if (!val) return ''
  return val.split(',').map(v => {
    const c = CONDITIONS[v.trim()]
    return c ? t(c.key) : v.trim()
  }).join(', ')
}

const POT_SIZES = {
  large:  { label_uk: 'Великий', label_en: 'Large' },
  medium: { label_uk: 'Середній', label_en: 'Medium' },
  small:  { label_uk: 'Малий', label_en: 'Small' },
}
function potSizeLabel(val) {
  if (!val) return ''
  return val.split(',').map(v => {
    const p = POT_SIZES[v.trim()]
    return p ? (state.lang === 'en' ? p.label_en : p.label_uk) : v.trim()
  }).join(', ')
}

/* ═══════════════════════════════════════
   DOM HELPERS
═══════════════════════════════════════ */
function createElement(tag, className, text) {
  const el = document.createElement(tag)
  if (className) el.className = className
  if (text !== undefined) el.textContent = text
  return el
}

/* ═══════════════════════════════════════
   GLOBAL HELPER (used inline in HTML)
═══════════════════════════════════════ */
function adjustNum(fieldId, delta) {
  const input = document.getElementById(fieldId)
  const val = parseInt(input.value) || 0
  const min = parseInt(input.min) || 1
  const max = parseInt(input.max) || 999
  input.value = Math.max(min, Math.min(max, val + delta))
}

/* ═══════════════════════════════════════
   EVENT BINDINGS
═══════════════════════════════════════ */
function bindEvents() {
  // Auth
  document.getElementById('btn-google').addEventListener('click', signInWithGoogle)
  document.getElementById('btn-apple').addEventListener('click', signInWithApple)
  document.getElementById('btn-auth-back').addEventListener('click', () => {
    document.getElementById('btn-auth-back').classList.add('hidden')
    showApp()
  })

  // Tab bar
  document.querySelectorAll('.tab-item').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab))
  })

  // Add plant
  document.getElementById('btn-add-plant').addEventListener('click', openAddPlantForm)

  // Plant detail
  document.getElementById('btn-detail-back').addEventListener('click', () => closeOverlay('overlay-detail'))
  document.getElementById('btn-detail-more').addEventListener('click', openMoreMenu)
  document.getElementById('btn-water').addEventListener('click', () => waterPlant())
  document.getElementById('toggle-fertilizer').addEventListener('change', e => {
    document.getElementById('btn-water').textContent = e.target.checked ? 'Полити з добривом' : 'Полити'
  })
  document.getElementById('btn-add-note').addEventListener('click', openAddNoteForm)
  document.getElementById('btn-view-all-history').addEventListener('click', () => openFullHistory(state.currentPlantId))
  document.getElementById('btn-view-all-notes').addEventListener('click', () => openFullNotes(state.currentPlantId))
  document.getElementById('btn-log-repotting').addEventListener('click', () => logRepotting())

  // More actions sheet
  document.getElementById('more-btn-edit').addEventListener('click', () => {
    closeSheet('sheet-more-actions')
    setTimeout(openEditPlantForm, 100)
  })
  document.getElementById('more-btn-delete').addEventListener('click', () => {
    closeSheet('sheet-more-actions')
    setTimeout(deletePlant, 100)
  })
  document.getElementById('more-btn-cancel').addEventListener('click', () => closeSheet('sheet-more-actions'))

  // Sub-page overlays
  document.getElementById('btn-history-back').addEventListener('click', () => closeOverlay('overlay-history'))
  document.getElementById('btn-notes-back').addEventListener('click', () => closeOverlay('overlay-notes'))

  // Change photo from detail
  document.getElementById('input-change-photo').addEventListener('change', e => {
    if (e.target.files[0]) changePlantPhoto(e.target.files[0])
  })

  // Plant form
  document.getElementById('btn-close-plant-form').addEventListener('click', () => closeSheet('sheet-plant-form'))
  document.getElementById('plant-form').addEventListener('submit', submitPlantForm)

  // Plant form photo
  document.getElementById('input-plant-photo-gallery').addEventListener('change', e => {
    const file = e.target.files[0]
    if (!file) return
    state.pendingPhotoFile = file
    setPhotoPreview(file,
      document.getElementById('form-photo-img'),
      document.getElementById('form-photo-preview').querySelector('.form-photo-placeholder')
    )
  })
  document.getElementById('input-plant-photo-camera').addEventListener('change', e => {
    const file = e.target.files[0]
    if (!file) return
    state.pendingPhotoFile = file
    setPhotoPreview(file,
      document.getElementById('form-photo-img'),
      document.getElementById('form-photo-preview').querySelector('.form-photo-placeholder')
    )
  })

  // Conditions picker — multi-select toggle, must keep at least one
  document.querySelectorAll('.condition-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.value
      const idx = state.selectedConditions.indexOf(val)
      if (idx !== -1) {
        if (state.selectedConditions.length > 1) {
          state.selectedConditions.splice(idx, 1)
          btn.classList.remove('active')
        }
        // if last one — do nothing (keep at least one selected)
      } else {
        state.selectedConditions.push(val)
        btn.classList.add('active')
      }
    })
  })

  // Pot picker — multi-select toggle
  document.querySelectorAll('.pot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const newVal = btn.dataset.pot
      const idx = state.selectedPotSizes.indexOf(newVal)
      if (idx !== -1) {
        state.selectedPotSizes.splice(idx, 1)
        btn.classList.remove('active')
      } else {
        state.selectedPotSizes.push(newVal)
        btn.classList.add('active')
      }
    })
  })

  // Sheet backdrop tap to close
  document.querySelectorAll('.sheet').forEach(sheet => {
    sheet.addEventListener('click', e => {
      if (e.target === sheet) closeSheet(sheet.id)
    })
  })

  // Note form
  document.getElementById('btn-close-note-form').addEventListener('click', () => closeSheet('sheet-note-form'))
  document.getElementById('note-form').addEventListener('submit', submitNoteForm)

  document.getElementById('input-note-photo-gallery').addEventListener('change', e => {
    const file = e.target.files[0]
    if (!file) return
    state.pendingNotePhotoFile = file
    const preview = document.getElementById('note-photo-preview')
    preview.src = URL.createObjectURL(file)
    preview.classList.remove('hidden')
  })
  document.getElementById('input-note-photo-camera').addEventListener('change', e => {
    const file = e.target.files[0]
    if (!file) return
    state.pendingNotePhotoFile = file
    const preview = document.getElementById('note-photo-preview')
    preview.src = URL.createObjectURL(file)
    preview.classList.remove('hidden')
  })

  // Calendar day events close
  document.getElementById('btn-close-day-events').addEventListener('click', () => {
    document.getElementById('calendar-day-events').classList.add('hidden')
  })

  // Journal filters
  document.getElementById('journal-filters').addEventListener('click', e => {
    const btn = e.target.closest('[data-filter]')
    if (!btn) return
    state.journalFilter = btn.dataset.filter
    document.querySelectorAll('#journal-filters [data-filter]').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    renderJournal()
  })

  // Language toggle
  document.getElementById('btn-lang-uk').addEventListener('click', () => {
    state.lang = 'uk'; localStorage.setItem('lang', 'uk'); applyLang()
  })
  document.getElementById('btn-lang-en').addEventListener('click', () => {
    state.lang = 'en'; localStorage.setItem('lang', 'en'); applyLang()
  })

  // Profile tab
  document.getElementById('btn-profile-signout').addEventListener('click', () => {
    showConfirm('Вийти?', 'Ви впевнені що хочете вийти?', signOut)
  })
  document.getElementById('btn-delete-account').addEventListener('click', () => {
    showConfirm(
      'Видалити акаунт?',
      'Всі ваші рослини, поливи та нотатки будуть видалені назавжди. Це незворотньо.',
      deleteAccount
    )
  })
  document.getElementById('btn-save-notif-email').addEventListener('click', saveNotifEmail)
  document.getElementById('toggle-notifications').addEventListener('change', e => {
    const row = document.getElementById('notif-email-row')
    row.style.opacity = e.target.checked ? '1' : '0.4'
    row.style.pointerEvents = e.target.checked ? '' : 'none'
    showToast(t(e.target.checked ? 'notif_on' : 'notif_off'))
  })

  // Remove old signout button (replaced by profile tab)
  const oldSignout = document.getElementById('btn-signout')
  if (oldSignout) oldSignout.style.display = 'none'

  // Confirm dialog
  document.getElementById('dialog-cancel').addEventListener('click', () => {
    document.getElementById('dialog-confirm').classList.add('hidden')
    _confirmCallback = null
  })
  document.getElementById('dialog-confirm-btn').addEventListener('click', () => {
    document.getElementById('dialog-confirm').classList.add('hidden')
    if (_confirmCallback) { _confirmCallback(); _confirmCallback = null }
  })
  document.getElementById('dialog-confirm').addEventListener('click', e => {
    if (e.target === document.getElementById('dialog-confirm')) {
      document.getElementById('dialog-confirm').classList.add('hidden')
      _confirmCallback = null
    }
  })

  // Swipe back gesture on detail overlay
  setupSwipeBack()
}

/* ═══════════════════════════════════════
   SWIPE BACK GESTURE
═══════════════════════════════════════ */
function setupSwipeBack() {
  const overlay = document.getElementById('overlay-detail')
  let startX = 0, startY = 0, tracking = false

  overlay.addEventListener('touchstart', e => {
    if (e.touches[0].clientX < 30) {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      tracking = true
    }
  }, { passive: true })

  overlay.addEventListener('touchmove', e => {
    if (!tracking) return
    const dx = e.touches[0].clientX - startX
    const dy = Math.abs(e.touches[0].clientY - startY)
    if (dy > 30) { tracking = false; return }
    if (dx > 0) {
      overlay.style.transform = `translateX(${dx}px)`
    }
  }, { passive: true })

  overlay.addEventListener('touchend', e => {
    if (!tracking) return
    tracking = false
    const dx = e.changedTouches[0].clientX - startX
    overlay.style.transform = ''
    overlay.style.transition = ''
    if (dx > 80) closeOverlay('overlay-detail')
  }, { passive: true })
}

/* ═══════════════════════════════════════
   START
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', init)
