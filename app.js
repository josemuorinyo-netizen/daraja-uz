// Daraja Uz — mini app logic
const tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) { tg.ready(); tg.expand(); }

// ---- Storage helpers (Telegram CloudStorage bilan ishlaydi, brauzerda localStorage'ga tushadi) ----
function storageSet(key, value) {
  const str = JSON.stringify(value);
  if (tg && tg.CloudStorage) {
    tg.CloudStorage.setItem(key, str, () => {});
  } else {
    localStorage.setItem(key, str);
  }
}
function storageGet(key, cb) {
  if (tg && tg.CloudStorage) {
    tg.CloudStorage.getItem(key, (err, value) => cb(value ? JSON.parse(value) : null));
  } else {
    const v = localStorage.getItem(key);
    cb(v ? JSON.parse(v) : null);
  }
}

// ---- Navigation ----
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'screen-subjects') renderSubjects();
  if (id === 'screen-results') renderHistory();
}

// ---- Subjects ----
let SUBJECTS = [];
fetch('data/subjects.json').then(r => r.json()).then(data => { SUBJECTS = data; });

function renderSubjects() {
  const list = document.getElementById('subject-list');
  list.innerHTML = '';
  SUBJECTS.forEach(s => {
    storageGet('progress-' + s.id, (progress) => {
      const row = document.createElement('div');
      row.className = 'subject-row';
      const statusText = progress ? `Davom etmoqda: ${progress.current + 1}/10` : 'Boshlanmagan';
      row.innerHTML = `<span class="ic">${s.icon}</span><span class="name">${s.name}</span><span class="status ${progress ? 'progress' : ''}">${statusText}</span>`;
      row.onclick = () => startTest(s.id);
      list.appendChild(row);
    });
  });
}

// ---- Test flow ----
let currentTest = { subjectId: null, questions: [], current: 0, answers: [], score: 0 };

function startTest(subjectId) {
  storageGet('progress-' + subjectId, (progress) => {
    fetch(`data/questions/${subjectId}.json`)
      .then(r => {
        if (!r.ok) throw new Error('missing');
        return r.json();
      })
      .then(data => {
        currentTest = {
          subjectId,
          questions: data.questions,
          current: progress ? progress.current : 0,
          answers: progress ? progress.answers : [],
          score: progress ? progress.score : 0
        };
        showScreen('screen-test');
        renderQuestion();
      })
      .catch(() => {
        alert("Bu fan uchun savollar bazasi hali qo'shilmagan. Tez orada qo'shiladi.");
      });
  });
}

function renderQuestion() {
  const q = currentTest.questions[currentTest.current];
  document.getElementById('q-count').textContent = `${currentTest.current + 1} / ${currentTest.questions.length}`;
  document.getElementById('progress-fill').style.width = `${(currentTest.current / currentTest.questions.length) * 100}%`;
  document.getElementById('q-text').textContent = q.text;
  const optList = document.getElementById('opt-list');
  optList.innerHTML = '';
  document.getElementById('next-btn').disabled = true;

  q.options.forEach((opt, idx) => {
    const div = document.createElement('div');
    div.className = 'opt';
    div.textContent = opt;
    div.onclick = () => selectOption(idx, q.correct, div);
    optList.appendChild(div);
  });
}

function selectOption(idx, correctIdx, el) {
  if (el.dataset.locked) return;
  document.querySelectorAll('.opt').forEach(o => o.dataset.locked = 'true');
  document.querySelectorAll('.opt').forEach((o, i) => {
    if (i === correctIdx) o.classList.add('correct');
    if (i === idx && idx !== correctIdx) o.classList.add('wrong');
  });
  const isCorrect = idx === correctIdx;
  if (isCorrect) currentTest.score++;
  currentTest.answers[currentTest.current] = idx;
  document.getElementById('next-btn').disabled = false;

  // avtomatik saqlash — appdan chiqib qayta kirganda davom etadi
  storageSet('progress-' + currentTest.subjectId, {
    current: currentTest.current,
    answers: currentTest.answers,
    score: currentTest.score
  });
}

function nextQuestion() {
  if (currentTest.current + 1 >= currentTest.questions.length) {
    finishTest();
  } else {
    currentTest.current++;
    storageSet('progress-' + currentTest.subjectId, {
      current: currentTest.current,
      answers: currentTest.answers,
      score: currentTest.score
    });
    renderQuestion();
  }
}

function exitTest() {
  // progress allaqachon saqlangan, shunchaki chiqamiz
  showScreen('screen-subjects');
}

function finishTest() {
  const total = currentTest.questions.length;
  const pct = Math.round((currentTest.score / total) * 100);
  const level = pctToLevel(pct);

  // natijani tarixga yozamiz, progressni tozalaymiz
  storageGet('history', (hist) => {
    const history = hist || [];
    history.unshift({ subjectId: currentTest.subjectId, pct, level, date: new Date().toISOString() });
    storageSet('history', history);
  });
  storageSet('progress-' + currentTest.subjectId, null);

  document.getElementById('result-pct').textContent = pct + '%';
  document.getElementById('result-lvl').textContent = level;
  document.getElementById('result-ring').style.background =
    `conic-gradient(var(--red) ${pct * 3.6}deg, var(--line) ${pct * 3.6}deg)`;
  document.getElementById('result-label').textContent =
    pct >= 80 ? "Ajoyib natija!" : pct >= 50 ? "Yaxshi, davom eting!" : "Mashq qilishda davom eting";

  showScreen('screen-result');
}

function pctToLevel(pct) {
  if (pct >= 90) return 'C1';
  if (pct >= 75) return 'B2';
  if (pct >= 55) return 'B1';
  if (pct >= 35) return 'A2';
  return 'A1';
}

function retryTest() {
  storageSet('progress-' + currentTest.subjectId, null);
  startTest(currentTest.subjectId);
}

// ---- History ----
function renderHistory() {
  storageGet('history', (hist) => {
    const container = document.getElementById('history-list');
    if (!hist || hist.length === 0) {
      container.innerHTML = '<div class="hero-sub">Hali hech qanday test topshirilmagan.</div>';
      return;
    }
    container.innerHTML = '';
    hist.forEach(h => {
      const row = document.createElement('div');
      row.className = 'subject-row';
      const d = new Date(h.date);
      row.innerHTML = `<span class="ic">📄</span><span class="name">${h.subjectId}</span><span class="status">${h.pct}% · ${h.level}</span>`;
      container.appendChild(row);
    });
  });
}

// ---- Speaking (IELTS) — ovoz yozib olish + AI baholash uchun joy ----
let mediaRecorder, audioChunks = [], isRecording = false;

function toggleRecording() {
  const btn = document.getElementById('record-btn');
  const status = document.getElementById('record-status');
  if (!isRecording) {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        status.textContent = "Yozib olindi. Baholash uchun serverga yuborilmoqda... (backend ulanishi kerak)";
        // TODO: blob'ni backendga (AI baholash uchun) yuborish
      };
      mediaRecorder.start();
      isRecording = true;
      btn.textContent = '⏹ Yozishni tugatish';
      status.textContent = 'Yozilmoqda...';
    }).catch(() => {
      status.textContent = "Mikrofonga ruxsat berilmadi.";
    });
  } else {
    mediaRecorder.stop();
    isRecording = false;
    btn.textContent = '🎙️ Yozishni boshlash';
  }
}

function startSpeaking() {
  showScreen('screen-speaking');
}
