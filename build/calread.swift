// LIVET Work: lee los eventos del Calendario de la Mac (iCloud, Google, Exchange… todo lo que tenga la Mac)
// para mostrarlos dentro de LIVET. Solo lectura. macOS pide permiso la primera vez.
// Uso: calread <desde_ms> <hasta_ms>   → imprime JSON.
import EventKit
import Foundation

func out(_ obj: Any) {
  if let d = try? JSONSerialization.data(withJSONObject: obj), let s = String(data: d, encoding: .utf8) { print(s) }
  exit(0)
}
let args = CommandLine.arguments
guard args.count >= 3, let a = Double(args[1]), let b = Double(args[2]) else { out(["ok": false, "error": "args"]) ; exit(0) }
let from = Date(timeIntervalSince1970: a / 1000), to = Date(timeIntervalSince1970: b / 1000)
let store = EKEventStore()
let sem = DispatchSemaphore(value: 0)
var granted = false
if #available(macOS 14.0, *) {
  store.requestFullAccessToEvents { g, _ in granted = g; sem.signal() }
} else {
  store.requestAccess(to: .event) { g, _ in granted = g; sem.signal() }
}
_ = sem.wait(timeout: .now() + 120)
if !granted { out(["ok": false, "error": "denied"]) }

// No traer de vuelta el propio calendario de LIVET (para no duplicar).
let cals = store.calendars(for: .event).filter { !($0.type == .subscription && $0.title.uppercased().hasPrefix("LIVET")) }
let iso = ISO8601DateFormatter()
let day = DateFormatter(); day.dateFormat = "yyyy-MM-dd"; day.timeZone = TimeZone.current
func hex(_ c: CGColor?) -> String {
  guard let c = c, let comps = c.converted(to: CGColorSpace(name: CGColorSpace.sRGB)!, intent: .defaultIntent, options: nil)?.components, comps.count >= 3 else { return "#9aa4ad" }
  return String(format: "#%02x%02x%02x", Int(comps[0] * 255), Int(comps[1] * 255), Int(comps[2] * 255))
}
var events: [[String: Any]] = []
var seen = Set<String>()
// EventKit busca de a tramos de hasta 4 años; acá alcanzan unos meses.
let evs = store.events(matching: store.predicateForEvents(withStart: from, end: to, calendars: cals))
for e in evs {
  let id = "\(e.calendarItemIdentifier)-\(Int(e.startDate.timeIntervalSince1970))"
  if seen.contains(id) { continue }; seen.insert(id)
  let start = e.isAllDay ? day.string(from: e.startDate) + "T00:00:00.000Z" : iso.string(from: e.startDate)
  let end = e.isAllDay ? day.string(from: e.endDate) + "T00:00:00.000Z" : iso.string(from: e.endDate)
  events.append(["id": id, "title": e.title ?? "(sin título)", "starts_at": start, "ends_at": end, "all_day": e.isAllDay,
                 "cal": e.calendar.title, "color": hex(e.calendar.cgColor), "place": e.location ?? ""])
}
out(["ok": true, "events": events, "calendars": cals.map { $0.title }])
