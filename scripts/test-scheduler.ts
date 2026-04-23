import { nextSendSlot } from '../lib/campaign-builder/scheduler'

function fmt(d: Date) {
  return d.toLocaleString('nl-BE', {
    timeZone: 'Europe/Brussels',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const cases: [string, Date, number, string][] = [
  ['Friday 17:00 CET + 0 days → still Friday in window',  new Date('2025-01-10T16:00:00Z'), 0, 'vr'],
  ['Friday 19:00 CET + 0 days → Monday 08:xx',            new Date('2025-01-10T18:01:00Z'), 0, 'ma'],
  ['Saturday noon + 0 days → Monday 08:xx',               new Date('2025-01-11T11:00:00Z'), 0, 'ma'],
  ['Sunday noon + 0 days → Monday 08:xx',                 new Date('2025-01-12T11:00:00Z'), 0, 'ma'],
  ['Monday 07:00 CET + 0 days → Monday 08:xx',            new Date('2025-01-13T06:00:00Z'), 0, 'ma'],
  ['Thursday + 3 business days → Tuesday',                new Date('2025-01-09T10:00:00Z'), 3, 'di'],
  ['Friday + 1 business day → Monday',                    new Date('2025-01-10T10:00:00Z'), 1, 'ma'],
  ['Wednesday + 2 business days → Friday',                new Date('2025-01-08T10:00:00Z'), 2, 'vr'],
]

let passed = 0
let failed = 0

for (const [label, input, days, expectedWeekday] of cases) {
  const result = nextSendSlot(input, days)
  const resultStr = fmt(result)
  const cetHour = new Date(result.getTime()).toLocaleString('nl-BE', { timeZone: 'Europe/Brussels', hour: '2-digit', hour12: false })
  const hourNum = parseInt(cetHour)
  const inWindow = hourNum >= 8 && hourNum < 18
  const correctDay = resultStr.startsWith(expectedWeekday)
  const ok = inWindow && correctDay
  if (ok) passed++; else failed++
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  console.log(`    Input:  ${fmt(input)}`)
  console.log(`    Output: ${resultStr}  [window: ${inWindow ? 'OK' : 'FAIL'}, day: ${correctDay ? 'OK' : `FAIL (expected ${expectedWeekday})`}]`)
  console.log()
}

// Jitter bounds check: run nextSendSlot 50 times from same base, all must be 08:00–18:00
const base = new Date('2025-01-13T10:00:00Z') // Monday 11:00 CET
let jitterFail = 0
for (let i = 0; i < 50; i++) {
  const r = nextSendSlot(base, 0)
  const h = parseInt(new Date(r.getTime()).toLocaleString('nl-BE', { timeZone: 'Europe/Brussels', hour: '2-digit', hour12: false }))
  if (h < 8 || h >= 18) jitterFail++
}
console.log(`${jitterFail === 0 ? '✓' : '✗'} Jitter bounds (50 runs from Monday 11:00 CET): ${jitterFail === 0 ? 'all within 08:00–18:00' : `${jitterFail} out of window`}`)
if (jitterFail === 0) passed++; else failed++

console.log(`\n${passed}/${passed + failed} tests passed`)
process.exit(failed > 0 ? 1 : 0)
