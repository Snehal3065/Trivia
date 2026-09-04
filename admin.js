import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCjG8kH7hRaDJVatF7Ai-e5756CFjltrNw",
  authDomain: "trial-and-error-ec3db.firebaseapp.com",
  projectId: "trial-and-error-ec3db",
  storageBucket: "trial-and-error-ec3db.firebasestorage.app",
  messagingSenderId: "982404896399",
  appId: "1:982404896399:web:58400ac56e58d8bd6802fa",
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const SUBMISSIONS_COLLECTION = "submissions";

const DataLayer = {
  async getAllSubmissions() {
    const snap = await getDocs(collection(db, SUBMISSIONS_COLLECTION));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
  async setWinner(winnerId) {
    const all = await this.getAllSubmissions();
    await Promise.all(
      all.map((s) => {
        const isWinnerNow = s.id === winnerId;
        if (s.isWinner === isWinnerNow) return Promise.resolve(); // skip no-op writes
        return updateDoc(doc(db, SUBMISSIONS_COLLECTION, s.id), { isWinner: isWinnerNow });
      })
    );
  },
  async unmarkWinner(id) {
    await updateDoc(doc(db, SUBMISSIONS_COLLECTION, id), { isWinner: false });
  },
};

// NOTE: placeholder-only gate for a class project. Not real security —
// swap for Firebase Auth (email/password or magic link) if that ever matters.
const ADMIN_PASSWORD = "changeme";

const $ = (id) => document.getElementById(id);
const show = (id) => $(id).classList.remove("hidden");
const hide = (id) => $(id).classList.add("hidden");

// Reveal-on-load for the gate screen (no scroll needed here, just fade in)
document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));

$("btn-enter").addEventListener("click", () => {
  if ($("input-pass").value === ADMIN_PASSWORD) {
    hide("step-gate");
    show("step-roster");
    renderRoster();
  } else {
    $("gate-error").textContent = "Wrong password.";
    $("gate-error").classList.remove("hidden");
  }
});

async function renderRoster() {
  const listEl = $("roster-list");
  listEl.innerHTML = `<p class="small">Loading submissions...</p>`;

  let all;
  try {
    all = await DataLayer.getAllSubmissions();
  } catch (err) {
    listEl.innerHTML = `<p class="small">Couldn't load submissions — check your connection and refresh.</p>`;
    return;
  }

  all.sort((a, b) => b.score - a.score);
  $("roster-count").textContent = `${all.length} submission${all.length === 1 ? "" : "s"}`;
  listEl.innerHTML = "";

  if (all.length === 0) {
    listEl.innerHTML = `<p class="small">No submissions yet.</p>`;
    return;
  }

  all.forEach((s) => {
    const row = document.createElement("a");
    row.href = "#";
    row.className = "roster-row";
    row.innerHTML = `
      <span class="roster-name">${s.isWinner ? "🏆 " : ""}${escapeHtml(s.name)}</span>
      <span class="roster-score">${s.score}/${s.totalQuestions}</span>
    `;
    row.addEventListener("click", (e) => {
      e.preventDefault();
      renderDetail(s.id);
    });
    listEl.appendChild(row);
  });
}

async function renderDetail(id) {
  hide("step-roster");
  show("step-detail");

  const all = await DataLayer.getAllSubmissions();
  const s = all.find((x) => x.id === id);
  if (!s) return;

  $("detail-name").textContent = s.name;
  $("detail-email").textContent = s.email;
  $("detail-score").textContent = `${s.score} / ${s.totalQuestions}`;
  $("detail-photo").src = s.photoURL;
  $("detail-note").textContent = `"${s.note}"`;
  $("detail-winner-chip").style.display = s.isWinner ? "inline-block" : "none";

  const markBtn = $("btn-mark-winner");
  markBtn.textContent = s.isWinner ? "Winner ✓ (tap to unmark)" : "Mark as winner 🏆";
  markBtn.disabled = false;
  markBtn.onclick = async () => {
    markBtn.disabled = true;
    markBtn.textContent = "Saving...";
    try {
      if (s.isWinner) {
        await DataLayer.unmarkWinner(s.id);
      } else {
        await DataLayer.setWinner(s.id);
      }
    } catch (err) {
      markBtn.disabled = false;
      markBtn.textContent = "Something went wrong — try again";
      return;
    }
    renderDetail(id);
    renderRoster();
  };

  // Manual email reminder — opens the person's own mail app pre-filled,
  // ready to send. No backend, no service, no waiting on anything.
  const mailLink = $("btn-email-winner");
  const subject = encodeURIComponent(`🏆 You won the trivia!`);
  const bodyText = encodeURIComponent(
    `Hi ${s.name},\n\nYou won! Your trivia score and wish stood out. Congratulations 🎉\n\n— The class`
  );
  mailLink.href = `mailto:${s.email}?subject=${subject}&body=${bodyText}`;
}

$("btn-back").addEventListener("click", () => {
  hide("step-detail");
  show("step-roster");
  renderRoster();
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
