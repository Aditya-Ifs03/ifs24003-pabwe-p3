// 1. UTILITAS & MANAJEMEN TAB (Studi Kasus 3.4)
const $ = (selector) => document.querySelector(selector);
const $all = (selector) => document.querySelectorAll(selector);
const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

// State Tab
const TAB_KEY = "pabwe-p3-tab";
const tabs = $all(".tab-btn");
const panels = $all(".tab-panel");

function switchTab(tabId) {
  // Update tampilan panel
  panels.forEach(p => p.classList.toggle("hidden", p.id !== `panel-${tabId}`));
  // Update styling tombol tab
  tabs.forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.setAttribute("aria-selected", isActive);
    btn.className = `tab-btn flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
      isActive ? "tab-active" : "tab-inactive"
    }`;
  });
  localStorage.setItem(TAB_KEY, tabId);
}

tabs.forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));
switchTab(localStorage.getItem(TAB_KEY) || "expense"); // Muat tab terakhir atau default ke expense

// Sistem Modal Global
let deleteActionCallback = null;

function openModal(id) {
  $(`#${id}`).classList.remove("hidden");
  $(`#${id}`).classList.add("flex");
  document.body.classList.add("overflow-hidden");
}

function closeModal(id) {
  $(`#${id}`).classList.add("hidden");
  $(`#${id}`).classList.remove("flex");
  document.body.classList.remove("overflow-hidden");
}

$all(".modal-bg, .btn-close-modal").forEach(el => {
  el.addEventListener("click", () => closeModal(el.dataset.close));
});

$("#btn-confirm-delete").addEventListener("click", () => {
  if (deleteActionCallback) deleteActionCallback();
  closeModal("modal-delete");
});


// ==========================================
// 2. EXPENSE TRACKER (Studi Kasus 3.1)
// ==========================================
const EXP_KEY = "pabwe-p3-expenses";
let expenses = JSON.parse(localStorage.getItem(EXP_KEY)) || [];

const expForm = $("#expense-form");
const expList = $("#expense-list");

function saveExpenses() { localStorage.setItem(EXP_KEY, JSON.stringify(expenses)); }

function renderExpenses() {
  const keyword = $("#exp-search").value.toLowerCase();
  const filterType = $("#exp-filter-type").value;

  let filtered = expenses.filter(exp => 
    exp.title.toLowerCase().includes(keyword) && 
    (filterType === "Semua" || exp.type === filterType)
  );

  // Sorting descending (terbaru)
  filtered.sort((a, b) => b.date - a.date);

  expList.innerHTML = "";
  let totalIn = 0, totalOut = 0;

  expenses.forEach(exp => {
    if (exp.type === "Pemasukan") totalIn += exp.amount;
    else totalOut += exp.amount;
  });

  $("#exp-total-in").textContent = formatRupiah(totalIn);
  $("#exp-total-out").textContent = formatRupiah(totalOut);
  $("#exp-balance").textContent = formatRupiah(totalIn - totalOut);

  if (filtered.length === 0) {
    expList.innerHTML = `<div class="p-4 text-center text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">Data tidak ditemukan.</div>`;
    return;
  }

  filtered.forEach(exp => {
    const isIncome = exp.type === "Pemasukan";
    const div = document.createElement("div");
    div.className = "flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition gap-3";
    div.innerHTML = `
      <div class="flex-1">
        <p class="font-semibold text-slate-800">${exp.title}</p>
        <div class="flex items-center gap-2 mt-1 text-xs">
          <span class="px-2 py-0.5 rounded-full ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} font-medium">${exp.type}</span>
          <span class="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">${exp.category}</span>
          <span class="text-slate-400">${new Date(exp.date).toLocaleDateString('id-ID')}</span>
        </div>
      </div>
      <div class="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
        <span class="font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}">${isIncome ? '+' : '-'}${formatRupiah(exp.amount)}</span>
        <div class="flex gap-2">
          <button onclick="editExpense('${exp.id}')" class="w-8 h-8 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-sky-600 hover:border-sky-200 flex items-center justify-center transition"><i class="ti ti-pencil"></i></button>
          <button onclick="deleteExpenseConfirm('${exp.id}')" class="w-8 h-8 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition"><i class="ti ti-trash"></i></button>
        </div>
      </div>
    `;
    expList.appendChild(div);
  });
}

expForm.addEventListener("submit", e => {
  e.preventDefault();
  const exp = {
    id: Date.now().toString(),
    title: $("#exp-title").value.trim(),
    category: $("#exp-category").value.trim(),
    amount: Number($("#exp-amount").value),
    type: $("#exp-type").value,
    date: Date.now()
  };
  expenses.push(exp);
  saveExpenses(); renderExpenses(); expForm.reset();
});

// Aksi Edit & Hapus Expense
window.editExpense = (id) => {
  const exp = expenses.find(e => e.id === id);
  if(!exp) return;
  $("#edit-exp-id").value = exp.id;
  $("#edit-exp-title").value = exp.title;
  $("#edit-exp-category").value = exp.category;
  $("#edit-exp-amount").value = exp.amount;
  $("#edit-exp-type").value = exp.type;
  openModal("modal-edit-expense");
};

$("#edit-expense-form").addEventListener("submit", e => {
  e.preventDefault();
  const id = $("#edit-exp-id").value;
  const index = expenses.findIndex(e => e.id === id);
  if(index !== -1) {
    expenses[index] = {
      ...expenses[index],
      title: $("#edit-exp-title").value.trim(),
      category: $("#edit-exp-category").value.trim(),
      amount: Number($("#edit-exp-amount").value),
      type: $("#edit-exp-type").value
    };
    saveExpenses(); renderExpenses(); closeModal("modal-edit-expense");
  }
});

window.deleteExpenseConfirm = (id) => {
  deleteActionCallback = () => {
    expenses = expenses.filter(e => e.id !== id);
    saveExpenses(); renderExpenses();
  };
  openModal("modal-delete");
};

$("#exp-search").addEventListener("input", renderExpenses);
$("#exp-filter-type").addEventListener("change", renderExpenses);
renderExpenses();


// ==========================================
// 3. BOOKMARK MANAGER (Studi Kasus 3.2)
// ==========================================
const BM_KEY = "pabwe-p3-bookmarks";
let bookmarks = JSON.parse(localStorage.getItem(BM_KEY)) || [];

const bmForm = $("#bookmark-form");
const bmList = $("#bookmark-list");

function saveBookmarks() { localStorage.setItem(BM_KEY, JSON.stringify(bookmarks)); }

function renderBookmarks() {
  const keyword = $("#bm-search").value.toLowerCase();
  const sortOption = $("#bm-sort").value;

  let filtered = bookmarks.filter(bm => 
    bm.title.toLowerCase().includes(keyword) || bm.category.toLowerCase().includes(keyword)
  );

  filtered.sort((a, b) => {
    if (sortOption === "az") return a.title.localeCompare(b.title);
    if (sortOption === "za") return b.title.localeCompare(a.title);
    return b.date - a.date; // newest
  });

  bmList.innerHTML = "";

  if (filtered.length === 0) {
    bmList.innerHTML = `<div class="col-span-full p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">Tidak ada tautan yang disimpan.</div>`;
    return;
  }

  filtered.forEach(bm => {
    const card = document.createElement("div");
    card.className = "flex flex-col p-4 border border-slate-200 rounded-xl hover:shadow-md transition bg-white relative group";
    card.innerHTML = `
      <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-slate-100">
        <button onclick="editBookmark('${bm.id}')" class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-sky-600 rounded"><i class="ti ti-pencil"></i></button>
        <button onclick="deleteBookmarkConfirm('${bm.id}')" class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded"><i class="ti ti-trash"></i></button>
      </div>
      <span class="inline-block px-2 py-1 bg-sky-100 text-sky-700 text-xs font-semibold rounded-md w-fit mb-3">${bm.category}</span>
      <h3 class="font-bold text-slate-800 truncate pr-14">${bm.title}</h3>
      <p class="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">${bm.notes || 'Tidak ada catatan'}</p>
      <a href="${bm.url}" target="_blank" rel="noopener noreferrer" class="mt-4 flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-800 w-fit">
        Kunjungi Link <i class="ti ti-external-link"></i>
      </a>
    `;
    bmList.appendChild(card);
  });
}

function ensureProtocol(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

bmForm.addEventListener("submit", e => {
  e.preventDefault();
  const bm = {
    id: Date.now().toString(),
    title: $("#bm-title").value.trim(),
    url: ensureProtocol($("#bm-url").value.trim()),
    category: $("#bm-category").value.trim(),
    notes: $("#bm-notes").value.trim(),
    date: Date.now()
  };
  bookmarks.push(bm);
  saveBookmarks(); renderBookmarks(); bmForm.reset();
});

// Aksi Edit & Hapus Bookmark
window.editBookmark = (id) => {
  const bm = bookmarks.find(b => b.id === id);
  if(!bm) return;
  $("#edit-bm-id").value = bm.id;
  $("#edit-bm-title").value = bm.title;
  $("#edit-bm-url").value = bm.url;
  $("#edit-bm-category").value = bm.category;
  $("#edit-bm-notes").value = bm.notes;
  openModal("modal-edit-bookmark");
};

$("#edit-bookmark-form").addEventListener("submit", e => {
  e.preventDefault();
  const id = $("#edit-bm-id").value;
  const index = bookmarks.findIndex(b => b.id === id);
  if(index !== -1) {
    bookmarks[index] = {
      ...bookmarks[index],
      title: $("#edit-bm-title").value.trim(),
      url: ensureProtocol($("#edit-bm-url").value.trim()),
      category: $("#edit-bm-category").value.trim(),
      notes: $("#edit-bm-notes").value.trim()
    };
    saveBookmarks(); renderBookmarks(); closeModal("modal-edit-bookmark");
  }
});

window.deleteBookmarkConfirm = (id) => {
  deleteActionCallback = () => {
    bookmarks = bookmarks.filter(b => b.id !== id);
    saveBookmarks(); renderBookmarks();
  };
  openModal("modal-delete");
};

$("#bm-search").addEventListener("input", renderBookmarks);
$("#bm-sort").addEventListener("change", renderBookmarks);
renderBookmarks();


// ==========================================
// 4. KUIS INTERAKTIF (Studi Kasus 3.3)
// ==========================================
const QUIZ_SCORE_KEY = "pabwe-p3-quiz-high";
let quizHighScore = localStorage.getItem(QUIZ_SCORE_KEY) || 0;
$("#quiz-highscore").textContent = quizHighScore;

const questions = [
  { q: "Struktur data mana yang menganut prinsip LIFO (Last In, First Out)?", opts: ["Queue", "Linked List", "Stack", "Binary Tree"], ans: 2 },
  { q: "Untuk menerapkan gaya CSS utility-first, framework mana yang lazim digunakan?", opts: ["Bootstrap", "Tailwind CSS", "Foundation", "Materialize"], ans: 1 },
  { q: "Fungsi Array pada JavaScript untuk membuat array baru berisi hasil operasi setiap elemen adalah?", opts: [".map()", ".filter()", ".reduce()", ".forEach()"], ans: 0 },
  { q: "Format pertukaran data yang sering digunakan dalam RESTful API modern adalah?", opts: ["XML", "JSON", "YAML", "CSV"], ans: 1 },
  { q: "Pada Object-Oriented Programming (OOP) di Java, pilar untuk menyembunyikan detail implementasi internal adalah?", opts: ["Polymorphism", "Inheritance", "Abstraction", "Encapsulation"], ans: 3 }
];

let currQIndex = 0;
let currScore = 0;
let hasAnswered = false;

const screenStart = $("#quiz-start");
const screenPlay = $("#quiz-play");
const screenResult = $("#quiz-result");

$("#btn-start-quiz").addEventListener("click", () => {
  currQIndex = 0; currScore = 0;
  screenStart.classList.add("hidden");
  screenResult.classList.add("hidden");
  screenPlay.classList.remove("hidden");
  renderQuestion();
});

function renderQuestion() {
  hasAnswered = false;
  const qData = questions[currQIndex];
  $("#quiz-progress").textContent = `Soal ${currQIndex + 1} / ${questions.length}`;
  $("#quiz-score-live").textContent = `Skor Sementara: ${currScore}`;
  $("#quiz-question").textContent = qData.q;
  
  const optionsContainer = $("#quiz-options");
  optionsContainer.innerHTML = "";
  $("#quiz-feedback").classList.add("hidden");
  $("#btn-next-question").classList.add("hidden");

  qData.opts.forEach((opt, index) => {
    const btn = document.createElement("button");
    btn.className = "w-full text-left px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition font-medium text-slate-700 quiz-opt-btn";
    btn.textContent = opt;
    btn.onclick = () => handleAnswer(index, btn, qData.ans);
    optionsContainer.appendChild(btn);
  });
}

function handleAnswer(selectedIndex, btnNode, correctIndex) {
  if (hasAnswered) return;
  hasAnswered = true;

  const allBtns = $all(".quiz-opt-btn");
  allBtns.forEach(b => { b.disabled = true; b.classList.remove("hover:bg-slate-50"); });

  const feedback = $("#quiz-feedback");
  feedback.classList.remove("hidden");

  if (selectedIndex === correctIndex) {
    currScore++;
    btnNode.classList.add("bg-emerald-100", "border-emerald-300", "text-emerald-800");
    feedback.textContent = "Jawaban Benar!";
    feedback.className = "p-3 rounded-lg text-sm font-bold text-center bg-emerald-100 text-emerald-800";
  } else {
    btnNode.classList.add("bg-rose-100", "border-rose-300", "text-rose-800");
    allBtns[correctIndex].classList.add("bg-emerald-100", "border-emerald-300", "text-emerald-800"); // Tunjukkan jawaban benar
    feedback.textContent = "Jawaban Salah.";
    feedback.className = "p-3 rounded-lg text-sm font-bold text-center bg-rose-100 text-rose-800";
  }

  $("#quiz-score-live").textContent = `Skor Sementara: ${currScore}`;
  $("#btn-next-question").classList.remove("hidden");
  
  if (currQIndex === questions.length - 1) {
    $("#btn-next-question").textContent = "Lihat Hasil";
  } else {
    $("#btn-next-question").textContent = "Selanjutnya";
  }
}

$("#btn-next-question").addEventListener("click", () => {
  currQIndex++;
  if (currQIndex < questions.length) {
    renderQuestion();
  } else {
    endQuiz();
  }
});

function endQuiz() {
  screenPlay.classList.add("hidden");
  screenResult.classList.remove("hidden");
  $("#quiz-final-score").textContent = `${currScore} / ${questions.length}`;
  
  const msgNewHighscore = $("#quiz-highscore-msg");
  if (currScore > quizHighScore) {
    quizHighScore = currScore;
    localStorage.setItem(QUIZ_SCORE_KEY, quizHighScore);
    $("#quiz-highscore").textContent = quizHighScore;
    msgNewHighscore.classList.remove("hidden");
  } else {
    msgNewHighscore.classList.add("hidden");
  }
}

$("#btn-restart-quiz").addEventListener("click", () => {
  screenResult.classList.add("hidden");
  screenStart.classList.remove("hidden");
});