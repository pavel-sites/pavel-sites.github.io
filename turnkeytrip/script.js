// Заявки приходят на почту через сервис FormSubmit (formsubmit.co).
// После первой заявки FormSubmit пришлёт на этот адрес письмо с кнопкой Activate —
// до подтверждения письма с заявками не доставляются.
const FORM_ENDPOINT = "https://formsubmit.co/ajax/spaspb@gmail.com";

const form = document.getElementById("brief-form");
const formatSelect = document.getElementById("format");
const statusEl = document.getElementById("form-status");
const submitBtn = document.getElementById("submit-btn");

document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Календарь поездки ----------
// Первый клик — дата вылета, второй — дата возвращения. Выбранные даты
// подставляются в поле «Когда» анкеты, а табло приглушает направления,
// которые в показанном месяце не в сезоне.

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const MONTHS_IN = ["январе", "феврале", "марте", "апреле", "мае", "июне", "июле", "августе", "сентябре", "октябре", "ноябре", "декабре"];

const calGrid = document.getElementById("cal-grid");
const calTitle = document.getElementById("cal-title");
const calPrev = document.getElementById("cal-prev");
const calNext = document.getElementById("cal-next");
const calSummary = document.getElementById("cal-summary");
const calGo = document.getElementById("cal-go");
const datesInput = document.getElementById("dates");
const seasonNote = document.getElementById("board-season-note");

const today = new Date();
today.setHours(0, 0, 0, 0);
const firstMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const lastMonth = new Date(today.getFullYear(), today.getMonth() + 12, 1); // листаем на год вперёд

let view = new Date(firstMonth);
let tripStart = null;
let tripEnd = null;

const dayMonth = (date) => date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
const fullDate = (date) => date.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

function formatTrip(start, end) {
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}–${dayMonth(end)}`;
  }
  return `${dayMonth(start)} – ${dayMonth(end)}`;
}

function nightsWord(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "ночь";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "ночи";
  return "ночей";
}

function inSeason(range, month) {
  const [from, to] = range.split("-").map(Number);
  return from <= to ? month >= from && month <= to : month >= from || month <= to;
}

function updateSeason() {
  const month = view.getMonth() + 1;
  let off = 0;
  document.querySelectorAll(".board__table tbody tr[data-months]").forEach((row) => {
    const isOff = !inSeason(row.dataset.months, month);
    row.classList.toggle("is-off", isOff);
    if (isOff) off++;
  });
  seasonNote.textContent = off
    ? `Приглушены направления не в сезоне в ${MONTHS_IN[view.getMonth()]}. `
    : `В ${MONTHS_IN[view.getMonth()]} в сезоне все направления. `;
}

function updateSummary() {
  if (tripStart && tripEnd) {
    const nights = Math.round((tripEnd - tripStart) / 86400000);
    const text = formatTrip(tripStart, tripEnd);
    calSummary.textContent = `${text}, ${nights} ${nightsWord(nights)}. Даты уже в заявке`;
    datesInput.value = text;
    calGo.hidden = false;
  } else if (tripStart) {
    calSummary.textContent = `Вылет ${dayMonth(tripStart)}. Теперь выберите дату возвращения`;
    calGo.hidden = true;
  } else {
    calSummary.textContent = "Нажмите дату вылета, потом дату возвращения";
    calGo.hidden = true;
  }
}

function renderCalendar() {
  calTitle.textContent = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
  calPrev.disabled = view <= firstMonth;
  calNext.disabled = view >= lastMonth;
  calGrid.textContent = "";

  const year = view.getFullYear();
  const month = view.getMonth();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7; // неделя с понедельника
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < offset; i++) {
    calGrid.append(document.createElement("span"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cal__day";
    btn.textContent = day;
    btn.setAttribute("aria-label", fullDate(date));

    const weekday = date.getDay();
    if (weekday === 0 || weekday === 6) btn.classList.add("cal__day--weekend");
    if (+date === +today) btn.classList.add("cal__day--today");
    if (date < today) btn.disabled = true;

    const isStart = tripStart && +date === +tripStart;
    const isEnd = tripEnd && +date === +tripEnd;
    if (isStart) btn.classList.add("cal__day--start");
    if (isEnd) btn.classList.add("cal__day--end");
    if (tripStart && tripEnd && date > tripStart && date < tripEnd) btn.classList.add("cal__day--range");
    btn.setAttribute("aria-pressed", String(Boolean(isStart || isEnd)));

    btn.addEventListener("click", () => {
      if (!tripStart || tripEnd || date <= tripStart) {
        tripStart = date;
        tripEnd = null;
      } else {
        tripEnd = date;
      }
      renderCalendar();
      updateSummary();
    });

    calGrid.append(btn);
  }

  updateSeason();
}

calPrev.addEventListener("click", () => {
  view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
  renderCalendar();
});

calNext.addEventListener("click", () => {
  view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
  renderCalendar();
});

renderCalendar();

// После отправки анкета очищается — сбрасываем и выбранные даты
form.addEventListener("reset", () => {
  tripStart = null;
  tripEnd = null;
  renderCalendar();
  updateSummary();
});

// ---------- Табло на первом экране ----------

// Каждое название разбивается на «шторки» и один раз коротко прокручивается при загрузке,
// как на настоящем табло вылетов (меньше секунды). Если пользователь просит меньше анимации — без неё.
const FLAP_ALPHABET = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const flapCells = document.querySelectorAll(".flap");
const flapWidth = Math.max(...[...flapCells].map((cell) => cell.dataset.text.length));

flapCells.forEach((cell, row) => {
  const target = cell.dataset.text.padEnd(flapWidth, " ");
  cell.textContent = "";
  cell.setAttribute("aria-label", cell.dataset.text);

  [...target].forEach((char, i) => {
    const tile = document.createElement("span");
    tile.className = "flap__char";
    tile.setAttribute("aria-hidden", "true");
    const final = char === " " ? " " : char;
    cell.append(tile);

    if (reduceMotion) {
      tile.textContent = final;
      return;
    }

    // Чем дальше строка и буква, тем дольше крутится шторка
    let flips = 3 + row + i;
    const timer = setInterval(() => {
      if (flips-- <= 0) {
        tile.textContent = final;
        clearInterval(timer);
        return;
      }
      tile.textContent = FLAP_ALPHABET[Math.floor(Math.random() * FLAP_ALPHABET.length)];
    }, 55);
  });
});

// ---------- Анкета: путешественник или гид ----------
// Для гидов остаются только имя, контакт и способ связи. Скрытые поля
// отключаются, чтобы браузер не требовал их заполнить и не отправлял.

let formMode = "traveler";

function setMode(mode) {
  formMode = mode;
  form.querySelector(`input[name="mode"][value="${mode}"]`).checked = true;
  document.querySelectorAll("#brief .trip-only").forEach((el) => {
    el.hidden = mode === "guide";
    el.querySelectorAll("input, select, textarea").forEach((f) => (f.disabled = mode === "guide"));
    if (el.matches("input, select, textarea")) el.disabled = mode === "guide";
  });
  document.querySelectorAll("#brief [data-traveler]").forEach((el) => {
    el.textContent = el.dataset[mode];
  });
  showStatus("");
}

form.querySelectorAll('input[name="mode"]').forEach((radio) => {
  radio.addEventListener("change", () => setMode(radio.value));
});

// «Оставить контакты» в блоке для гидов сразу включает режим гида
document.querySelectorAll("[data-mode-link]").forEach((link) => {
  link.addEventListener("click", () => setMode(link.dataset.modeLink));
});

// Кнопки «Выбрать» в ценах сразу подставляют формат в анкету
document.querySelectorAll("[data-format]").forEach((link) => {
  link.addEventListener("click", () => {
    setMode("traveler");
    formatSelect.value = link.dataset.format;
  });
});

calGo.addEventListener("click", () => setMode("traveler"));

// После сброса формы браузер возвращает переключатель на «путешественников»
form.addEventListener("reset", () => setTimeout(() => setMode("traveler")));

function showStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("form__status--error", isError);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));

  // Бот заполнил скрытое поле — делаем вид, что всё ок, но ничего не отправляем
  if (data._honey) {
    form.reset();
    showStatus("Спасибо! Заявка отправлена.");
    return;
  }
  delete data._honey;

  const payload = formMode === "guide" ? {
    _subject: `Гид хочет сотрудничать: ${data.name}`,
    _template: "table",
    "Кто": "Гид",
    "Имя": data.name,
    "Контакт": data.contact,
    "Как ответить": data.reply,
  } : {
    _subject: `Новая заявка: ${data.destination} (${data.name})`,
    _template: "table",
    "Имя": data.name,
    "Контакт": data.contact,
    "Как ответить": data.reply,
    "Формат": data.format,
    "Куда": data.destination,
    "Когда": data.dates,
    "Кто едет": data.people || "–",
    "Бюджет": data.budget || "–",
    "Город вылета": data.from || "–",
    "Пожелания": data.wishes || "–",
  };

  submitBtn.disabled = true;
  const sentText = formMode === "guide"
    ? "Спасибо! Контакты отправлены, я свяжусь с вами в ближайшие дни."
    : "Спасибо! Заявка отправлена, я свяжусь с вами в течение дня.";
  showStatus(formMode === "guide" ? "Отправляю контакты…" : "Отправляю заявку…");

  try {
    const response = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok || String(result.success) !== "true") {
      throw new Error(result.message || "Ошибка отправки");
    }
    form.reset();
    setTimeout(() => showStatus(sentText));
  } catch {
    showStatus("Не удалось отправить заявку. Напишите мне в Telegram: @spaspb755", true);
  } finally {
    submitBtn.disabled = false;
  }
});

// ---------- Подарок: колода рассыпанных карточек ----------
// Карточки раскладываются по неровной сетке с наклоном (раскладка одна и та же
// при каждой загрузке). Когда колода впервые появляется на экране, карточки
// один раз «раздаются» из стопки в центре. По клику страница открывается крупно.

const deck = document.getElementById("deck");
const cards = [...deck.querySelectorAll(".card")];

// Простой генератор псевдослучайных чисел: одинаковая раскладка у всех посетителей
function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function layoutDeck() {
  const w = deck.clientWidth;
  const h = deck.clientHeight;
  const rand = seeded(42);
  const cols = w < 560 ? 3 : 6;
  const rows = Math.ceil(cards.length / cols);
  const cellW = w / cols;
  const cellH = h / rows;

  cards.forEach((card, i) => {
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    // обложки (последние в разметке, лежат сверху) – ближе к центру
    const isCover = i >= cards.length - 2;
    let cx, cy;
    if (isCover) {
      cx = w / 2 + (i === cards.length - 1 ? 0.12 : -0.1) * w;
      cy = h / 2 + (i === cards.length - 1 ? 0.04 : -0.06) * h;
    } else {
      const col = i % cols;
      const row = Math.floor(i / cols);
      cx = (col + 0.5) * cellW + (rand() - 0.5) * cellW * 0.5;
      cy = (row + 0.5) * cellH + (rand() - 0.5) * cellH * 0.4;
    }
    const x = Math.min(Math.max(cx - cw / 2, -cw * 0.08), w - cw * 0.92);
    const y = Math.min(Math.max(cy - ch / 2, 0), h - ch);
    const r = isCover ? (i === cards.length - 1 ? 4 : -6) : (rand() - 0.5) * 28;
    card.style.setProperty("--x", `${Math.round(x)}px`);
    card.style.setProperty("--y", `${Math.round(y)}px`);
    card.style.setProperty("--r", `${r.toFixed(1)}deg`);
    // для «раздачи»: откуда карточка вылетает (центр колоды)
    card.style.setProperty("--x0", `${Math.round(w / 2 - cw / 2)}px`);
    card.style.setProperty("--y0", `${Math.round(h / 2 - ch / 2)}px`);
    card.style.setProperty("--d", `${(cards.length - 1 - i) * 35}ms`);
  });
}

layoutDeck();
new ResizeObserver(layoutDeck).observe(deck);

function deal(instant) {
  deck.classList.add("is-dealt");
  // когда последняя карточка долетела – наведение без задержек
  setTimeout(() => deck.classList.add("is-settled"), instant ? 0 : 600 + cards.length * 35 + 100);
}

if (reduceMotion || !("IntersectionObserver" in window)) {
  deal(true);
} else {
  const dealObserver = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      deal(false);
      dealObserver.disconnect();
    }
  }, { threshold: 0.35 });
  dealObserver.observe(deck);
}

// Просмотр: верхняя карточка колоды – первая
const viewer = document.getElementById("viewer");
const viewerImg = document.getElementById("viewer-img");
const viewerTitle = document.getElementById("viewer-title");
const viewerCount = document.getElementById("viewer-count");
const sequence = [...cards].reverse();
let current = 0;

function show(index) {
  current = (index + sequence.length) % sequence.length;
  const card = sequence[current];
  viewerImg.src = card.dataset.full;
  viewerImg.alt = card.dataset.title;
  viewerTitle.textContent = card.dataset.title;
  viewerCount.textContent = `${current + 1} из ${sequence.length}`;
}

cards.forEach((card) => {
  card.addEventListener("click", () => {
    show(sequence.indexOf(card));
    viewer.showModal();
  });
});

document.getElementById("viewer-prev").addEventListener("click", () => show(current - 1));
document.getElementById("viewer-next").addEventListener("click", () => show(current + 1));
document.getElementById("viewer-close").addEventListener("click", () => viewer.close());
viewer.addEventListener("click", (e) => { if (e.target === viewer) viewer.close(); }); // клик по затемнению
viewer.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") show(current - 1);
  if (e.key === "ArrowRight") show(current + 1);
});
