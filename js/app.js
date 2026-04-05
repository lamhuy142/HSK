// Thêm "hsk1_" vào trước id của mỗi từ một cách tự động
const hsk1_vocab = hsk1_vocab_full.map(word => ({
    ...word,
    id: `hsk1_${word.id}` 
}));

// 1. Lấy dữ liệu đã thuộc từ localStorage
const savedLearned = JSON.parse(localStorage.getItem("hsk1_learned")) || [];

const state = {
  currentIndex: 0,
  learned: new Set(savedLearned),
  view: "study",
};

// 2. Hàm quan trọng: Lọc ra danh sách các từ CHƯA THUỘC
function getRemainingWords() {
  const remaining = hsk1_vocab.filter((word) => !state.learned.has(word.id));
  return remaining;
}

function updateUI() {
  const remaining = getRemainingWords();

  // Kiểm tra nếu đã thuộc hết sạch từ
  if (remaining.length === 0) {
    document.getElementById("view-study").innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 text-center">
                    <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-4">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <h2 class="text-3xl font-bold text-slate-800 mb-2">Tuyệt vời!</h2>
                    <p class="text-slate-500 mb-6">Bạn đã hoàn thành toàn bộ 500 từ HSK 1.</p>
                    <button onclick="resetProgress()" class="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                        Học lại từ đầu
                    </button>
                </div>`;
    return;
  }

  // Đảm bảo index không bị vượt quá độ dài danh sách mới
  if (state.currentIndex >= remaining.length) {
    state.currentIndex = 0;
  }

  const word = remaining[state.currentIndex];

  // Hiển thị nội dung lên Flashcard
  document.getElementById("card-hanzi").innerText = word.hanzi;
  document.getElementById("card-pinyin").innerText = word.pinyin;
  document.getElementById("card-meaning_vi").innerText = word.meaning_vi;
  document.getElementById("card-example").innerText = word.example;
  document.getElementById("card-id").innerText = word.id;

  // Cập nhật Progress Bar (tính trên tổng 500 từ ban đầu)
  const total = hsk1_vocab.length;
  const progress = (state.learned.size / total) * 100;
  document.getElementById("progress-bar").style.width = `${progress}%`;
  document.getElementById("progress-text").innerText =
    `${state.learned.size}/${total}`;

  document.getElementById("flashcard").classList.remove("flipped");
}

// Hàm hợp nhất: Vừa lật thẻ, vừa tự động phát âm ví dụ ở mặt sau
function toggleFlip() {
    const card = document.getElementById("flashcard");
    card.classList.toggle("flipped");

    // Kiểm tra: Nếu thẻ đang ở mặt sau (có class flipped)
    if (card.classList.contains("flipped")) {
        // Nghỉ 300ms để hiệu ứng lật thẻ chạy xong rồi mới đọc ví dụ
        setTimeout(() => {
            playExample();
        }, 300);
    }
}

function prevCard() {
  const remaining = getRemainingWords();
  if (remaining.length > 0) {
    state.currentIndex =
      (state.currentIndex - 1 + remaining.length) % remaining.length;
    updateUI();
  }
}

async function markLearned() {
  const remaining = getRemainingWords();
  if (remaining.length === 0) return;

  const currentWord = remaining[state.currentIndex];

  // 1. Cập nhật local ngay lập tức (để web mượt)
  state.learned.add(currentWord.id);
  localStorage.setItem("hsk1_learned", JSON.stringify([...state.learned]));
  updateUI();

  // 2. Gửi lên Firebase sau (chạy ngầm)
  const user = auth.currentUser;
  if (user) {
    try {
      await db
        .collection("users")
        .doc(user.uid)
        .set(
          {
            learnedWords: Array.from(state.learned),
            lastUpdate: new Date(), // Thêm cái này để biết lần cuối học là khi nào
          },
          { merge: true },
        );
    } catch (e) {
      console.error("Không thể lưu lên Cloud:", e);
    }
  }
}

function resetProgress() {
  if (confirm("Bạn có chắc chắn muốn xóa hết tiến độ và học lại từ đầu?")) {
    localStorage.removeItem("hsk1_learned");
    location.reload();
  }
}

function switchView(view) {
  state.view = view;
  document
    .getElementById("view-study")
    .classList.toggle("hidden", view !== "study");
  document
    .getElementById("view-list")
    .classList.toggle("hidden", view !== "list");

  const btnStudy = document.getElementById("btn-study");
  const btnList = document.getElementById("btn-list");

  if (view === "study") {
    btnStudy.className =
      "px-4 py-1.5 rounded-md text-sm font-semibold transition-all bg-white shadow-sm text-blue-600";
    btnList.className =
      "px-4 py-1.5 rounded-md text-sm font-semibold transition-all text-slate-600";
    updateUI(); // Cập nhật lại giao diện học khi quay lại
  } else {
    btnList.className =
      "px-4 py-1.5 rounded-md text-sm font-semibold transition-all bg-white shadow-sm text-blue-600";
    btnStudy.className =
      "px-4 py-1.5 rounded-md text-sm font-semibold transition-all text-slate-600";
    renderList(hsk1_vocab);
  }
}

function renderList(data) {
  const container = document.getElementById("list-body");
  container.innerHTML = data
    .map(
      (w) => `
            <tr class="hover:bg-slate-50 ${state.learned.has(w.id) ? "opacity-40" : ""}">
                <td class="px-6 py-4 font-bold chinese-font text-xl text-slate-700">
                    ${w.hanzi} ${state.learned.has(w.id) ? '<i class="fas fa-check-circle text-green-500 text-sm"></i>' : ""}
                </td>
                <td class="px-6 py-4 text-blue-500 font-medium">${w.pinyin}</td>
                <td class="px-6 py-4 text-slate-500 text-sm">${w.meaning_vi}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="speak('${w.hanzi}')" class="text-slate-300 hover:text-blue-500 transition-colors">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </td>
            </tr>
        `,
    )
    .join("");
}

function handleSearch() {
  const q = document.getElementById("search").value.toLowerCase();
  const filtered = hsk1_vocab.filter(
    (w) =>
      w.hanzi.includes(q) ||
      w.pinyin.toLowerCase().includes(q) ||
      w.meaning_vi.toLowerCase().includes(q),
  );
  renderList(filtered);
}

function speak(text) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 0.8;
  window.speechSynthesis.speak(u);
}

// Hàm đọc từ vựng (đã có)
function playAudio() {
  const remaining = getRemainingWords();
  if (remaining.length > 0) {
    speak(remaining[state.currentIndex].hanzi);
  }
}

function playExample() {
  const remaining = getRemainingWords();
  if (remaining.length > 0) {
    const rawText = remaining[state.currentIndex].example;

    // Dùng Regex để chỉ giữ lại chữ Hán (Chinese Characters)
    // Khoảng chữ Hán phổ biến: \u4e00-\u9fa5
    const chineseOnly = rawText.match(/[\u4e00-\u9fa5，。！？；：]/g);

    if (chineseOnly) {
      const textToSpeak = chineseOnly.join("");
      speak(textToSpeak);
    } else {
      // Nếu không lọc được chữ Hán thì đọc chuỗi gốc (phòng hờ)
      speak(rawText);
    }
  }
}

window.onload = updateUI;
// Hàm tải tiến độ từ Cloud về máy
async function loadProgressFromCloud(uid) {
    try {
        const doc = await db.collection("users").doc(uid).get();
        if (doc.exists && doc.data().learnedWords) {
            // Cập nhật vào state và đồng bộ luôn localStorage cho chắc
            state.learned = new Set(doc.data().learnedWords);
            localStorage.setItem("hsk1_learned", JSON.stringify([...state.learned]));
            updateUI();
            console.log("Đã đồng bộ tiến độ từ Cloud!");
        }
    } catch (error) {
        console.error("Lỗi khi tải tiến độ:", error);
    }
}
