// js/app.js
// 1. Hàm nạp dữ liệu an toàn
function loadInitialData() {
  // Kiểm tra xem hsk1_vocab_full từ file data.js đã sẵn sàng chưa
  const data = (typeof hsk1_vocab_full !== 'undefined') ? hsk1_vocab_full : [];
  return data.map((word) => ({
    ...word,
    id: word.id ? `hsk1_${word.id}` : `hsk1_auto`
  }));
}

// 2. Gán dữ liệu vào biến hsk1_vocab (GỌI HÀM VỪA TẠO)
const hsk1_vocab = loadInitialData();

const savedLearned = JSON.parse(localStorage.getItem("hsk1_learned")) || [];

// 3. Biến điều khiển chính
let currentVocab = hsk1_vocab;
const state = {
  currentIndex: 0,
  learned: new Set(savedLearned),
  view: "study",
};

// Dòng này cực kỳ quan trọng để kiểm tra
console.log("Dữ liệu đã nạp thành công:", currentVocab.length, "từ");
updateUI();
// 2. CÁC HÀM LOGIC CỐT LÕI
function getRemainingWords() {
  return currentVocab.filter((word) => !state.learned.has(word.id));
}

function updateUI() {
  const remaining = getRemainingWords();

  // Kiểm tra các phần tử HTML quan trọng trước khi chạy
  const studyView = document.getElementById("view-study");
  if (!studyView) return;

  // Trường hợp đã thuộc hết
  if (remaining.length === 0) {
    studyView.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner">
                <i class="fas fa-trophy"></i>
            </div>
            <h2 class="text-3xl font-bold text-slate-800 mb-2">Tuyệt vời!</h2>
            <p class="text-slate-500 mb-6">Bạn đã chinh phục toàn bộ từ vựng mục này.</p>
            <button onclick="resetProgress()" class="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all hover:scale-105">
                Học lại từ đầu
            </button>
        </div>`;
    return;
  }

  // Đảm bảo Index an toàn
  if (state.currentIndex >= remaining.length) state.currentIndex = 0;
  const word = remaining[state.currentIndex];

  // Đổ dữ liệu ra màn hình
  const elements = {
    "card-hanzi": word.hanzi,
    "card-pinyin": word.pinyin,
    "card-meaning_vi": word.meaning_vi,
    "card-example": word.example || "Chưa có ví dụ",
    "card-id": word.id.replace("hsk1_", ""),
  };

  for (let id in elements) {
    const el = document.getElementById(id);
    if (el) el.innerText = elements[id];
  }

  // Cập nhật Progress Bar
  const total = currentVocab.length;
  const learnedCount = state.learned.size;
  const progressPercent = (learnedCount / total) * 100;
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  if (progressBar) progressBar.style.width = `${progressPercent}%`;
  if (progressText) progressText.innerText = `${learnedCount}/${total}`;

  // Reset mặt thẻ
  const flashcard = document.getElementById("flashcard");
  if (flashcard) flashcard.classList.remove("flipped");
}

// 3. CÁC HÀM ĐIỀU KHIỂN (Gán vào window)
window.nextCard = function () {
  const remaining = getRemainingWords();
  if (remaining.length === 0) return;
  state.currentIndex = (state.currentIndex + 1) % remaining.length;
  updateUI();
};

window.prevCard = function () {
  const remaining = getRemainingWords();
  if (remaining.length === 0) return;
  state.currentIndex =
    (state.currentIndex - 1 + remaining.length) % remaining.length;
  updateUI();
};

window.toggleFlip = function () {
  const card = document.getElementById("flashcard");
  if (!card) return;
  card.classList.toggle("flipped");
  if (card.classList.contains("flipped")) {
    setTimeout(() => playExample(), 300);
  }
};

window.markAsLearned = async function () {
  const remaining = getRemainingWords();
  if (remaining.length === 0) return;

  const currentWord = remaining[state.currentIndex];
  state.learned.add(currentWord.id);
  localStorage.setItem("hsk1_learned", JSON.stringify([...state.learned]));
  updateUI();

  // Đồng bộ Firebase
  const user = auth.currentUser;
  if (user) {
    try {
      await db
        .collection("users")
        .doc(user.uid)
        .set(
          {
            learnedWords: firebase.firestore.FieldValue.arrayUnion(
              currentWord.id,
            ),
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
    } catch (e) {
      console.error("Lỗi đồng bộ:", e);
    }
  }
};

window.resetProgress = function () {
  if (confirm("Bạn có muốn xóa hết tiến độ?")) {
    localStorage.removeItem("hsk1_learned");
    state.learned = new Set();
    updateUI();
  }
};
// --- BỔ SUNG CÁC HÀM CÒN THIẾU ---

window.playAudio = function() {
    const remaining = getRemainingWords();
    if (remaining.length > 0) {
        speak(remaining[state.currentIndex].hanzi);
    }
};

window.playExample = function() {
    const remaining = getRemainingWords();
    if (remaining.length > 0) {
        const rawText = remaining[state.currentIndex].example || "";
        const chineseOnly = rawText.match(/[\u4e00-\u9fa5，。！？；：]/g);
        if (chineseOnly) {
            speak(chineseOnly.join(""));
        } else if (rawText) {
            speak(rawText);
        }
    }
};

function speak(text) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
}

window.switchView = function(view) {
    state.view = view;
    const studyView = document.getElementById("view-study");
    const listView = document.getElementById("view-list");
    const btnStudy = document.getElementById("btn-study");
    const btnList = document.getElementById("btn-list");

    if (view === "study") {
        studyView.classList.remove("hidden");
        listView.classList.add("hidden");
        btnStudy.className = "px-4 py-1.5 rounded-md text-sm font-semibold transition-all bg-white shadow-sm text-blue-600";
        btnList.className = "px-4 py-1.5 rounded-md text-sm font-semibold transition-all text-slate-600";
        updateUI();
    } else {
        studyView.classList.add("hidden");
        listView.classList.remove("hidden");
        btnList.className = "px-4 py-1.5 rounded-md text-sm font-semibold transition-all bg-white shadow-sm text-blue-600";
        btnStudy.className = "px-4 py-1.5 rounded-md text-sm font-semibold transition-all text-slate-600";
        renderList(hsk1_vocab);
    }
};

function renderList(data) {
    const container = document.getElementById("list-body");
    if (!container) return;
    container.innerHTML = data.map(w => `
        <tr class="hover:bg-slate-50 ${state.learned.has(w.id) ? "opacity-40" : ""}">
            <td class="px-6 py-4 font-bold chinese-font text-xl text-slate-700">
                ${w.hanzi} ${state.learned.has(w.id) ? '<i class="fas fa-check-circle text-green-500 text-sm"></i>' : ""}
            </td>
            <td class="px-6 py-4 text-blue-500 font-medium">${w.pinyin}</td>
            <td class="px-6 py-4 text-slate-500 text-sm">${w.meaning_vi}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="event.stopPropagation(); speak('${w.hanzi}')" class="text-slate-300 hover:text-blue-500 transition-colors">
                    <i class="fas fa-volume-up"></i>
                </button>
            </td>
        </tr>
    `).join("");
}

window.handleSearch = function() {
    const q = document.getElementById("search").value.toLowerCase();
    const filtered = hsk1_vocab.filter(w => 
        w.hanzi.includes(q) || 
        w.pinyin.toLowerCase().includes(q) || 
        w.meaning_vi.toLowerCase().includes(q)
    );
    renderList(filtered);
};
window.changeCourse = function () {
  const course = document.getElementById("course-selector").value;
  alert(
    "Bạn đang chọn khóa: " +
      course +
      ". Tính năng chuyển dữ liệu đang được cập nhật!",
  );
};
// Cuối cùng, gán speak vào window để dùng trong renderList
window.speak = speak;