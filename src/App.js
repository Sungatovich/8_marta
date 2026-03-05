import { useEffect, useMemo, useState } from "react";
import "./styles.css";

/* ===================== localStorage helpers ===================== */
function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatRemaining(ms) {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function downloadTextFile(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCSV(rows) {
  // rows: [{name, status, createdAt}]
  const header = ["name", "status", "createdAt"];
  const escape = (v) => {
    const s = String(v ?? "");
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
      return `"${s.replaceAll('"', '""')}"`;
    }
    return s;
  };
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([escape(r.name), escape(r.status), escape(r.createdAt)].join(","));
  }
  return lines.join("\n");
}

export default function App() {
  const [showDetails, setShowDetails] = useState(true);

  // RSVP
  const [guestName, setGuestName] = useState("");
  const [status, setStatus] = useState("Приду ✅"); // or "Не приду ❌"
  const [guests, setGuests] = useState(() => readLS("march8_guests", [])); // stored list

  useEffect(() => {
    writeLS("march8_guests", guests);
  }, [guests]);

  // Таймер до 6 марта 18:00 (локальное время компьютера)
  const targetDate = useMemo(() => {
    const now = new Date();
    // Март = 2 (0=январь)
    const d = new Date(now.getFullYear(), 2, 6, 18, 0, 0);
    // если уже прошло — ставим на следующий год
    if (d.getTime() < now.getTime()) {
      return new Date(now.getFullYear() + 1, 2, 6, 18, 0, 0);
    }
    return d;
  }, []);

  const [remaining, setRemaining] = useState(() =>
    formatRemaining(targetDate.getTime() - Date.now())
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(formatRemaining(targetDate.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  // Падающие сердечки/цветы
  useEffect(() => {
    const container = document.querySelector(".floatLayer");
    if (!container) return;

    const interval = setInterval(() => {
      const el = document.createElement("div");
      el.className = "floatItem";
      el.style.left = Math.random() * 100 + "vw";
      el.style.animationDuration = 6 + Math.random() * 6 + "s";
      el.style.opacity = String(0.35 + Math.random() * 0.5);
      el.style.transform = `scale(${0.6 + Math.random() * 1.1}) rotate(${
        Math.random() * 360
      }deg)`;
      el.innerText = Math.random() > 0.5 ? "💗" : "🌸";

      container.appendChild(el);
      setTimeout(() => el.remove(), 13000);
    }, 450);

    return () => clearInterval(interval);
  }, []);

  const address = "Навои 310";
  const timeText = "6 марта • 18:00";
  const dressCode = "По желанию: что-то красивое и праздничное ✨";

  const going = guests.filter((g) => g.status === "Приду ✅");
  const notGoing = guests.filter((g) => g.status === "Не приду ❌");

  function addGuest() {
    const name = guestName.trim();
    if (!name) return;

    // если человек уже есть — обновим его статус
    setGuests((prev) => {
      const idx = prev.findIndex((x) => x.name.toLowerCase() === name.toLowerCase());
      const item = { name, status, createdAt: new Date().toISOString() };
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [item, ...prev];
    });

    setGuestName("");
  }

  function removeGuest(name) {
    setGuests((prev) => prev.filter((x) => x.name !== name));
  }

  function clearAll() {
    setGuests([]);
  }

  function exportJSON() {
    const data = {
      event: { timeText, address },
      guests,
      exportedAt: new Date().toISOString(),
    };
    downloadTextFile("guest-list.json", JSON.stringify(data, null, 2), "application/json");
  }

  function exportCSV() {
    const csv = toCSV(guests);
    downloadTextFile("guest-list.csv", csv, "text/csv;charset=utf-8");
  }

  return (
    <div className="app">
      <div className="floatLayer" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <span className="brandDot" />
          <span className="brandText">MARCH • INVITE</span>
        </div>

        <button className="ghostBtn" onClick={() => setShowDetails((v) => !v)}>
          {showDetails ? "Скрыть детали" : "Показать детали"}
        </button>
      </header>

      <main className="hero">
        {/* LEFT */}
        <section className="card">
          <div className="badge">8 МАРТА</div>

          <h1 className="title">
            С праздником, <span className="accent">девочки</span>! 💐
          </h1>

          <p className="subtitle">
            Пусть этот день принесёт вам радость, заботу и много тёплых слов ✨
          </p>

          <div className="row">
            <div className="pill">
              <span className="pillLabel">До встречи осталось</span>
              <span className="pillValue">{remaining}</span>
            </div>
            <div className="pill">
              <span className="pillLabel">Когда</span>
              <span className="pillValue">{timeText}</span>
            </div>
          </div>

          {showDetails && (
            <div className="details">
              <div className="detailLine">
                <span className="k">📍 Адрес:</span>
                <span className="v">{address}</span>
              </div>
              <div className="detailLine">
                <span className="k">🎁 Что будет:</span>
                <span className="v">уютный вечер, музыка, сладости и сюрприз</span>
              </div>
              <div className="detailLine">
                <span className="k">👗 Дресс-код:</span>
                <span className="v">{dressCode}</span>
              </div>
            </div>
          )}

          {/* RSVP FORM */}
          <div className="rsvpBox">
            <div className="rsvpTitle">Подтверждение</div>

            <div className="formRow">
              <input
                className="input"
                placeholder="Имя"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addGuest();
                }}
              />

              <select
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Приду ✅</option>
                <option>Не приду ❌</option>
              </select>

              <button className="primaryBtn" onClick={addGuest}>
                Сохранить
              </button>
            </div>

            <div className="statsRow">
              <div className="stat">
                <div className="statLabel">Придут</div>
                <div className="statValue">{going.length}</div>
              </div>
              <div className="stat">
                <div className="statLabel">Не придут</div>
                <div className="statValue">{notGoing.length}</div>
              </div>
              <div className="stat">
                <div className="statLabel">Всего</div>
                <div className="statValue">{guests.length}</div>
              </div>
            </div>

            {/* LISTS */}
            <div className="listsGrid">
              <div className="listCard">
                <div className="listHeader">Придут ✅</div>
                {going.length === 0 ? (
                  <div className="empty">Пока никого нет</div>
                ) : (
                  <ul className="list">
                    {going.map((g) => (
                      <li key={g.name} className="listItem">
                        <span className="listName">{g.name}</span>
                        <button className="miniBtn" onClick={() => removeGuest(g.name)}>
                          Удалить
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="listCard">
                <div className="listHeader">Не придут ❌</div>
                {notGoing.length === 0 ? (
                  <div className="empty">Пока пусто</div>
                ) : (
                  <ul className="list">
                    {notGoing.map((g) => (
                      <li key={g.name} className="listItem">
                        <span className="listName">{g.name}</span>
                        <button className="miniBtn" onClick={() => removeGuest(g.name)}>
                          Удалить
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* EXPORT */}
            <div className="btnRow">
              <a
                className="secondaryBtn"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  address
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Открыть карту
              </a>

              <button className="secondaryBtn" onClick={exportJSON}>
                Скачать JSON
              </button>

              <button className="secondaryBtn" onClick={exportCSV}>
                Скачать CSV
              </button>

              <button className="secondaryBtn danger" onClick={clearAll}>
                Очистить
              </button>
            </div>

            <div className="hint">
              Список сохраняется в браузере (localStorage). На другом телефоне/ПК список будет свой.
            </div>
          </div>
        </section>

        {/* RIGHT */}
        <aside className="sideCard">
          <div className="sideTitle">Небольшое пожелание</div>
          <p className="sideText">
            Пусть рядом будут люди, которые ценят вас. Пусть мечты сбываются,
            а настроение будет весенним 🌷
          </p>

          <div className="quote">“Вы заслуживаете самого красивого.”</div>

          <div className="mini">
            <div className="miniLabel">Адрес</div>
            <div className="miniValue">{address}</div>
          </div>

          <div className="mini">
            <div className="miniLabel">Время</div>
            <div className="miniValue">{timeText}</div>
          </div>
        </aside>
      </main>

      <footer className="footer">Сделано с ❤️ • {new Date().getFullYear()}</footer>
    </div>
  );
}