// Detaler demo: saved car (localStorage), open/closed status, poster swap, mobile menu. Content works without JS.
import cars from "../data/cars.json";

type Car = { brand: string; model: string };
const KEY = "detaler-car";
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const phone = window.matchMedia("(max-width: 899px)").matches;
const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s);
const brandSel = $<HTMLSelectElement>("#car-brand");
const modelSel = $<HTMLSelectElement>("#car-model");
const poster = $<HTMLElement>("[data-poster]");
const posterBrand = $<HTMLElement>("[data-poster-brand]");
const posterModel = $<HTMLElement>("[data-poster-model]");

function fit() {
  if (!poster || !posterBrand || !posterModel) return;
  poster.style.removeProperty("--fit");
  const box = poster.clientWidth;
  const need = Math.max(posterBrand.scrollWidth, posterModel.scrollWidth);
  if (need > box) poster.style.setProperty("--fit", String(Math.max(0.3, (box / need) * 0.98)));
}

function read(): Car | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || "null");
    return c && cars.some((b) => b.id === c.brand && b.models.includes(c.model)) ? c : null;
  } catch { return null; }
}
function write(c: Car | null) {
  try { c ? localStorage.setItem(KEY, JSON.stringify(c)) : localStorage.removeItem(KEY); } catch { /* private mode */ }
}
const brandName = (id: string) => cars.find((b) => b.id === id)?.name ?? id;

function fillModels(brandId: string) {
  if (!modelSel) return;
  const b = cars.find((x) => x.id === brandId);
  modelSel.innerHTML = '<option value="">Оберіть модель</option>' + (b ? b.models.map((m) => `<option>${m}</option>`).join("") : "");
  modelSel.disabled = !b;
}

function render(car: Car | null, animate: boolean) {
  const name = car ? `${brandName(car.brand)} ${car.model}` : "";
  const full = car ? name : "вашого авто";
  document.querySelectorAll<HTMLElement>("[data-car-for]").forEach((el) => { el.textContent = full; });
  document.querySelectorAll<HTMLElement>("[data-car-name]").forEach((el) => { el.textContent = car ? name : "ваше авто"; });
  document.querySelectorAll<HTMLElement>("[data-car-saved]").forEach((el) => {
    el.textContent = car ? `Ваша ${name} вже збережена на цьому пристрої` : "Оберіть авто на початку сторінки — ми запам'ятаємо його на цьому пристрої";
  });
  document.querySelectorAll<HTMLElement>("[data-car-bar]").forEach((el) => { el.textContent = car ? car.model : "Моє авто"; });
  if (posterBrand && posterModel) {
    posterBrand.textContent = car ? brandName(car.brand) : "Ваше";
    posterModel.textContent = car ? car.model : "авто";
    fit();
    if (animate && !reduce && poster?.animate) {
      poster.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: phone ? 300 : 420, easing: "cubic-bezier(.2,.7,.2,1)" });
    }
  }
  const forget = $<HTMLElement>("[data-car-forget]");
  if (forget) forget.hidden = !car;
}

if (brandSel && modelSel) {
  brandSel.innerHTML = '<option value="">Оберіть марку</option>' + cars.map((b) => `<option value="${b.id}">${b.name}</option>`).join("");
  const saved = read();
  if (saved) { brandSel.value = saved.brand; fillModels(saved.brand); modelSel.value = saved.model; }
  render(saved, false);
  brandSel.addEventListener("change", () => {
    fillModels(brandSel.value);
    write(null);
    render(null, false);
  });
  modelSel.addEventListener("change", () => {
    const car = modelSel.value ? { brand: brandSel.value, model: modelSel.value } : null;
    write(car);
    render(car, true);
  });
  $("[data-car-forget]")?.addEventListener("click", () => {
    write(null); brandSel.value = ""; fillModels(""); render(null, true); brandSel.focus();
  });
  document.fonts?.ready.then(fit);
  window.addEventListener("resize", fit);
}

// Open / closed status in Kyiv time (hours from client.json: Mon–Fri 8:30–19:00, Sat–Sun 10:00–16:00).
function status() {
  const el = $<HTMLElement>("[data-status]");
  if (!el) return;
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Kyiv", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const d = days.indexOf(get("weekday"));
  const mins = Number(get("hour")) * 60 + Number(get("minute"));
  const hours = (day: number) => (day < 5 ? [510, 1140] : [600, 960]);
  const fmt = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
  const [o, c] = hours(d);
  if (mins >= o && mins < c) { el.textContent = `Відкрито до ${fmt(c)}`; el.dataset.state = "open"; return; }
  const next = mins < o ? o : hours((d + 1) % 7)[0];
  el.textContent = `Зачинено, відкриємо о ${fmt(next)}`;
  el.dataset.state = "closed";
}
status();

// Mobile menu: close after choosing an anchor.
const menu = $<HTMLDetailsElement>("[data-menu]");
menu?.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => { menu.open = false; }));
