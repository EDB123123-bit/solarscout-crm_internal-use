const CET_OFFSET_MINUTES_GUESS = 60

function getCetOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const lookup: Record<string, string> = {}
  for (const p of parts) lookup[p.type] = p.value

  const cetMs = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour),
    Number(lookup.minute),
    Number(lookup.second)
  )
  return Math.round((cetMs - date.getTime()) / 60000)
}

function cetDateParts(date: Date) {
  const offset = getCetOffsetMinutes(date)
  const local = new Date(date.getTime() + offset * 60000)
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth(),
    day: local.getUTCDate(),
    weekday: local.getUTCDay(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
    offset,
  }
}

function buildCetDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  const approxUtc = Date.UTC(year, month, day, hour, minute)
  const approxDate = new Date(approxUtc - CET_OFFSET_MINUTES_GUESS * 60000)
  const offset = getCetOffsetMinutes(approxDate)
  return new Date(approxUtc - offset * 60000)
}

function nextWeekdayAtEight(year: number, month: number, day: number): Date {
  let d = buildCetDate(year, month, day, 8, 0)
  for (let i = 0; i < 7; i++) {
    const parts = cetDateParts(d)
    if (parts.weekday >= 1 && parts.weekday <= 5) return d
    d = buildCetDate(parts.year, parts.month, parts.day + 1, 8, 0)
  }
  return d
}

function advanceBusinessDays(from: Date, days: number): Date {
  let current = from
  let remaining = days
  while (remaining > 0) {
    const parts = cetDateParts(current)
    const next = buildCetDate(parts.year, parts.month, parts.day + 1, 8, 0)
    const nextParts = cetDateParts(next)
    if (nextParts.weekday >= 1 && nextParts.weekday <= 5) remaining--
    current = next
  }
  // Return 08:00 CET on the target day
  const p = cetDateParts(current)
  return buildCetDate(p.year, p.month, p.day, 8, 0)
}

export function nextSendSlot(after: Date = new Date(), businessDays: number = 0): Date {
  const anchor = businessDays > 0 ? advanceBusinessDays(after, businessDays) : after
  const parts = cetDateParts(anchor)
  const isWeekday = parts.weekday >= 1 && parts.weekday <= 5
  const minutesOfDay = parts.hour * 60 + parts.minute

  let base: Date
  if (!isWeekday) {
    base = nextWeekdayAtEight(parts.year, parts.month, parts.day)
  } else if (minutesOfDay < 8 * 60) {
    base = buildCetDate(parts.year, parts.month, parts.day, 8, 0)
  } else if (minutesOfDay >= 18 * 60) {
    base = nextWeekdayAtEight(parts.year, parts.month, parts.day + 1)
  } else {
    base = new Date(anchor.getTime())
  }

  const jitterMs = Math.floor((Math.random() * 2 - 1) * 15 * 60 * 1000)
  let final = new Date(base.getTime() + jitterMs)

  // Clamp back into window if jitter pushed us outside 08:00–18:00 CET
  const fp = cetDateParts(final)
  const finalMinutes = fp.hour * 60 + fp.minute
  if (finalMinutes < 8 * 60) {
    final = buildCetDate(fp.year, fp.month, fp.day, 8, 0)
  } else if (finalMinutes >= 18 * 60) {
    final = buildCetDate(fp.year, fp.month, fp.day, 17, 59)
  }
  return final
}
