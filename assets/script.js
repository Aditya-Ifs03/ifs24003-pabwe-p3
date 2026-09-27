/**
 * assets/script.js
 * PABWE Praktikum 3 - 100/100 Lighthouse & Axe Accessibility Optimization
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. UTILITAS DOM & MODAL
  // ==========================================
  const $ = (selector) => document.querySelector(selector);
  const $all = (selector) => document.querySelectorAll(selector);
  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  
  const generateID = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  let deleteActionCallback = null;

  function openModal(id) {
    const modal = $(`#${id}`);
    if(!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
  }

  function closeModal(id) {
    const modal = $(`#${id}`);
    if(!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
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
  // 2. MANAJEMEN TAB (via Query URL)
  // ==========================================
  const tabs = $all(".tab-btn");
  const panels = $all(".tab-panel");
  const validTabs = ["expense", "bookmark", "quiz"];

  function switchTab(tabId) {
    if (!validTabs.includes(tabId)) tabId = "expense";
    
    // Toggle Panels
    panels.forEach(p => p.classList.toggle("hidden", p.id !== `panel-${tabId}`));
    
    // Toggle Buttons
    tabs.forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.setAttribute("aria-selected", isActive);
      if(isActive) {
        btn.classList.add("bg-sky-700", "text-white", "shadow");
        btn.classList.remove("text-slate-700", "hover:bg-slate-100");
      } else {
        btn.classList.remove("bg-sky-700", "text-white", "shadow");
        btn.classList.add("text-slate-700", "hover:bg-slate-100");
      }
    });

    const url = new URL(window.location);
    url.searchParams.set("tab", tabId);
    window.history.replaceState(null, "", url);
  }

  const urlParams = new URLSearchParams(window.location.search);
  switchTab(urlParams.get("tab") || "expense");

  tabs.forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));


  // ==========================================
  // 3. EXPENSE TRACKER
  // ==========================================
  const EXP_KEY = "pabwe-p3-expenses";
  let expenses = [];
  try { expenses = JSON.parse(localStorage.getItem(EXP_KEY)) || []; } catch(e){}

  const expForm = $("#expense-form");
  const expList = $("#expense-list");
  $("#exp-date").valueAsDate = new Date();

  function saveExpenses() { localStorage.setItem(EXP_KEY, JSON.stringify(expenses)); }

  function renderExpenses() {
    const keyword = $("#exp-search").value.toLowerCase();
    const filterType = $("#exp-filter-type").value;

    let filtered = expenses.filter(exp => 
      exp.title.toLowerCase().includes(keyword) && 
      (filterType === "Semua" || exp.type === filterType)
    );

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
      expList.innerHTML = `<div role="listitem" class="p-4 text-center text-sm text-slate-700 bg-slate-50 rounded-lg border border-dashed border-slate-300">Data tidak ditemukan.</div>`;
      return;
    }

    filtered.forEach(exp => {
      const isIncome = exp.type === "Pemasukan";
      const div = document.createElement("div");
      div.setAttribute("role", "listitem");
      div.className = "flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition gap-3";
      div.innerHTML = `
        <div class="flex-1">
          <p class="font-semibold text-slate-800">${exp.title}</p>
          <div class="flex items-center gap-2 mt-1 text-xs">
            <span class="px-2 py-0.5 rounded-full ${isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'} font-medium">${exp.type}</span>
            <span class="text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">${exp.category}</span>
            <span class="text-slate-600">${new Date(exp.date).toLocaleDateString('id-ID')}</span>
          </div>
        </div>
        <div class="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
          <span class="font-bold ${isIncome ? 'text-emerald-800' : 'text-rose-800'}">${isIncome ? '+' : '-'}${formatRupiah(exp.amount)}</span>
          <div class="flex gap-2">
            <button data-action="edit-exp" data-id="${exp.id}" aria-label="Ubah transaksi" class="w-8 h-8 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-sky-700 hover:border-sky-300 flex items-center justify-center transition"><i class="ti ti-pencil pointer-events-none" aria-hidden="true"></i></button>
            <button data-action="delete-exp" data-id="${exp.id}" aria-label="Hapus transaksi" class="w-8 h-8 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-rose-700 hover:border-rose-300 flex items-center justify-center transition"><i class="ti ti-trash pointer-events-none" aria-hidden="true"></i></button>
          </div>
        </div>
      `;
      expList.appendChild(div);
    });
  }

  expForm.addEventListener("submit", e => {
    e.preventDefault();
    const amount = Number($("#exp-amount").value);
    if (isNaN(amount) || amount <= 0) return alert("Nominal harus lebih dari 0!");
    
    const dateStr = $("#exp-date").value;
    const timestamp = dateStr ? new Date(dateStr).getTime() : Date.now();

    expenses.push({
      id: generateID(),
      title: $("#exp-title").value.trim(),
      category: $("#exp-category").value.trim(),
      amount: amount,
      type: $("#exp-type").value,
      date: timestamp
    });
    saveExpenses(); renderExpenses(); expForm.reset();
    $("#exp-date").valueAsDate = new Date();
  });

  expList.addEventListener("click", e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === "edit-exp") {
      const exp = expenses.find(x => x.id === id);
      if (!exp) return;
      $("#edit-exp-id").value = exp.id;
      $("#edit-exp-title").value = exp.title;
      $("#edit-exp-category").value = exp.category;
      $("#edit-exp-amount").value = exp.amount;
      $("#edit-exp-type").value = exp.type;
      $("#edit-exp-date").value = new Date(exp.date).toISOString().split('T')[0];
      openModal("modal-edit-expense");
    } else if (action === "delete-exp") {
      deleteActionCallback = () => {
        expenses = expenses.filter(x => x.id !== id);
        saveExpenses(); renderExpenses();
      };
      openModal("modal-delete");
    }
  });

  $("#edit-expense-form").addEventListener("submit", e => {
    e.preventDefault();
    const amount = Number($("#edit-exp-amount").value);
    if (isNaN(amount) || amount <= 0) return alert("Nominal harus lebih dari 0!");

    const id = $("#edit-exp-id").value;
    const index = expenses.findIndex(x => x.id === id);
    if (index !== -1) {
      expenses[index] = {
        ...expenses[index],
        title: $("#edit-exp-title").value.trim(),
        category: $("#edit-exp-category").value.trim(),
        amount: amount,
        type: $("#edit-exp-type").value,
        date: new Date($("#edit-exp-date").value).getTime()
      };
      saveExpenses(); renderExpenses(); closeModal("modal-edit-expense");
    }
  });

  $("#exp-search").addEventListener("input", renderExpenses);
  $("#exp-filter-type").addEventListener("change", renderExpenses);
  renderExpenses();


  // ==========================================
  // 4. BOOKMARK MANAGER
  // ==========================================
  const BM_KEY = "pabwe-p3-bookmarks";
  let bookmarks = [];
  try { bookmarks = JSON.parse(localStorage.getItem(BM_KEY)) || []; } catch(e){}

  const bmForm = $("#bookmark-form");
  const bmList = $("#bookmark-list");

  function saveBookmarks() { localStorage.setItem(BM_KEY, JSON.stringify(bookmarks)); }

  function isValidURL(string) {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;  
    }
  }

  function renderBookmarks() {
    const keyword = $("#bm-search").value.toLowerCase();
    const sortOption = $("#bm-sort").value;

    let filtered = bookmarks.filter(bm => 
      bm.title.toLowerCase().includes(keyword) || bm.category.toLowerCase().includes(keyword)
    );

    filtered.sort((a, b) => {
      if (sortOption === "az") return a.title.localeCompare(b.title);
      if (sortOption === "za") return b.title.localeCompare(a.title);
      return b.date - a.date; 
    });

    bmList.innerHTML = "";

    if (filtered.length === 0) {
      bmList.innerHTML = `<div role="listitem" class="col-span-full p-6 text-center text-sm text-slate-700 bg-slate-50 rounded-xl border border-dashed border-slate-300">Tidak ada tautan yang disimpan.</div>`;
      return;
    }

    filtered.forEach(bm => {
      const card = document.createElement("div");
      card.setAttribute("role", "listitem");
      card.className = "flex flex-col p-4 border border-slate-200 rounded-xl hover:shadow-md transition bg-white relative group";
      card.innerHTML = `
        <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-slate-100">
          <button data-action="edit-bm" data-id="${bm.id}" aria-label="Ubah bookmark" class="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-sky-700 rounded"><i class="ti ti-pencil pointer-events-none" aria-hidden="true"></i></button>
          <button data-action="delete-bm" data-id="${bm.id}" aria-label="Hapus bookmark" class="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-rose-700 rounded"><i class="ti ti-trash pointer-events-none" aria-hidden="true"></i></button>
        </div>
        <span class="inline-block px-2 py-1 bg-sky-100 text-sky-800 text-xs font-semibold rounded-md w-fit mb-3">${bm.category}</span>
        <h3 class="font-bold text-slate-900 truncate pr-14">${bm.title}</h3>
        <p class="text-xs text-slate-700 mt-1 line-clamp-2 min-h-[2rem]">${bm.notes || 'Tidak ada catatan'}</p>
        <a href="${bm.url}" target="_blank" rel="noopener noreferrer" class="mt-4 flex items-center gap-1 text-sm font-semibold text-sky-700 hover:text-sky-900 w-fit">
          Kunjungi Link <i class="ti ti-external-link" aria-hidden="true"></i>
        </a>
      `;
      bmList.appendChild(card);
    });
  }

  bmForm.addEventListener("submit", e => {
    e.preventDefault();
    const urlVal = $("#bm-url").value.trim();
    if (!isValidURL(urlVal)) return alert("URL tidak valid! Wajib diawali dengan skema http:// atau https://");

    bookmarks.push({
      id: generateID(),
      title: $("#bm-title").value.trim(),
      url: urlVal,
      category: $("#bm-category").value.trim(),
      notes: $("#bm-notes").value.trim(),
      date: Date.now()
    });
    saveBookmarks(); renderBookmarks(); bmForm.reset();
  });

  bmList.addEventListener("click", e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === "edit-bm") {
      const bm = bookmarks.find(b => b.id === id);
      if (!bm) return;
      $("#edit-bm-id").value = bm.id;
      $("#edit-bm-title").value = bm.title;
      $("#edit-bm-url").value = bm.url;
      $("#edit-bm-category").value = bm.category;
      $("#edit-bm-notes").value = bm.notes;
      openModal("modal-edit-bookmark");
    } else if (action === "delete-bm") {
      deleteActionCallback = () => {
        bookmarks = bookmarks.filter(b => b.id !== id);
        saveBookmarks(); renderBookmarks();
      };
      openModal("modal-delete");
    }
  });

  $("#edit-bookmark-form").addEventListener("submit", e => {
    e.preventDefault();
    const urlVal = $("#edit-bm-url").value.trim();
    if (!isValidURL(urlVal)) return alert("URL tidak valid! Wajib diawali dengan skema http:// atau https://");

    const id = $("#edit-bm-id").value;
    const index = bookmarks.findIndex(b => b.id === id);
    if (index !== -1) {
      bookmarks[index] = {
        ...bookmarks[index],
        title: $("#edit-bm-title").value.trim(),
        url: urlVal,
        category: $("#edit-bm-category").value.trim(),
        notes: $("#edit-bm-notes").value.trim()
      };
      saveBookmarks(); renderBookmarks(); closeModal("modal-edit-bookmark");
    }
  });

  $("#bm-search").addEventListener("input", renderBookmarks);
  $("#bm-sort").addEventListener("change", renderBookmarks);
  renderBookmarks();


  // ==========================================
  // 5. KUIS INTERAKTIF
  // ==========================================
  const QUIZ_SCORE_KEY = "pabwe-p3-quiz-high";
  let quizHighScore = localStorage.getItem(QUIZ_SCORE_KEY) || 0;
  $("#quiz-highscore").textContent = quizHighScore;

  const questions = [
    { q: "Struktur data mana yang menganut prinsip LIFO (Last In, First Out)?", opts: ["Queue", "Linked List", "Stack", "Binary Tree"], ans: 2 },
    { q: "Untuk menerapkan gaya CSS utility-first, framework mana yang lazim digunakan?", opts: ["Bootstrap", "Tailwind CSS", "Foundation", "Materialize"], ans: 1 },
    { q: "Fungsi Array pada JavaScript untuk membuat array baru berisi hasil operasi setiap elemen adalah?", opts: [".map()", ".filter()", ".reduce()", ".forEach()"], ans: 0 },
    { q: "Format pertukaran data yang sering digunakan dalam RESTful API modern adalah?", opts: ["XML", "JSON", "YAML", "CSV"], ans: 1 },
    { q: "Pada Object-Oriented Programming (OOP), pilar untuk menyembunyikan detail implementasi adalah?", opts: ["Polymorphism", "Inheritance", "Abstraction", "Encapsulation"], ans: 3 }
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
      btn.className = "w-full text-left px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-100 transition font-medium text-slate-800 quiz-opt-btn";
      btn.textContent = opt;
      btn.addEventListener("click", () => handleAnswer(index, btn, qData.ans));
      optionsContainer.appendChild(btn);
    });
  }

  function handleAnswer(selectedIndex, btnNode, correctIndex) {
    if (hasAnswered) return;
    hasAnswered = true;

    const allBtns = $all(".quiz-opt-btn");
    allBtns.forEach(b => { b.disabled = true; b.classList.remove("hover:bg-slate-100"); });

    const feedback = $("#quiz-feedback");
    feedback.classList.remove("hidden");

    if (selectedIndex === correctIndex) {
      currScore++;
      btnNode.classList.add("bg-emerald-100", "border-emerald-300", "text-emerald-900");
      feedback.textContent = "Jawaban Benar!";
      feedback.className = "p-3 rounded-lg text-sm font-bold text-center bg-emerald-100 text-emerald-900";
    } else {
      btnNode.classList.add("bg-rose-100", "border-rose-300", "text-rose-900");
      allBtns[correctIndex].classList.add("bg-emerald-100", "border-emerald-300", "text-emerald-900"); 
      feedback.textContent = "Jawaban Salah.";
      feedback.className = "p-3 rounded-lg text-sm font-bold text-center bg-rose-100 text-rose-900";
    }

    $("#quiz-score-live").textContent = `Skor Sementara: ${currScore}`;
    $("#btn-next-question").classList.remove("hidden");
    $("#btn-next-question").textContent = (currQIndex === questions.length - 1) ? "Lihat Hasil" : "Selanjutnya";
  }

  $("#btn-next-question").addEventListener("click", () => {
    currQIndex++;
    if (currQIndex < questions.length) renderQuestion();
    else endQuiz();
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
});