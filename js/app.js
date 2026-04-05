// ĐẢM BẢO DÒNG NÀY Ở TRÊN CÙNG FILE app.js
// 1. Phải khai báo biến này ở ngay đầu file app.js
let currentVocab = []; 
let currentIndex = 0;
// let currentVocab = hsk1_vocab_full; // Hoặc hsk1_vocab_full tùy file data.js của bạn đặt tên là gì
// Hàm này để lọc ra những từ chưa thuộc

// Thêm "hsk1_" vào trước id của mỗi từ một cách tự động
const hsk1_vocab = hsk1_vocab_full.map((word) => ({
  ...word,
  id: `hsk1_${word.id}`,
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

// 2. Hàm chuyển từ tiếp theo
function nextCard() {
  console.log("Đã bấm nút Tiếp!"); // Dòng này để kiểm tra trong Console
  const remaining = getRemainingWords();

  if (state.currentIndex < remaining.length - 1) {
    state.currentIndex++;
  } else {
    state.currentIndex = 0;
  }

  updateUI(); // Gọi hàm này để vẽ lại chữ lên màn hình
}

function updateUI() {
  const remaining = getRemainingWords();

  // 1. Kiểm tra nếu đã thuộc hết
  if (remaining.length === 0) {
    const studyView = document.getElementById("view-study");
    if (studyView) {
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
    }
    return;
  }

  // 2. Kiểm soát Index an toàn
  if (state.currentIndex >= remaining.length) {
    state.currentIndex = 0;
  }

  const word = remaining[state.currentIndex];

  // 3. Cập nhật nội dung (Dùng Optional Chaining để tránh lỗi null)
  const elements = {
    "card-hanzi": word.hanzi,
    "card-pinyin": word.pinyin,
    "card-meaning_vi": word.meaning_vi,
    "card-example": word.example || "Chưa có ví dụ",
    "card-id": `#${word.id}`, // Thêm dấu # cho chuyên nghiệp
  };

  for (let id in elements) {
    const el = document.getElementById(id);
    if (el) el.innerText = elements[id];
  }

  // 4. Cập nhật Tiến độ (Dựa trên danh sách từ hiện tại của khóa học)
  // Giả sử 'currentVocab' là biến chứa danh sách từ của HSK đang chọn
  const total = currentVocab.length;
  const learnedCount = state.learned.size;
  const progressPercent = (learnedCount / total) * 100;

  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  if (progressBar) progressBar.style.width = `${progressPercent}%`;
  if (progressText) progressText.innerText = `${learnedCount}/${total}`;

  // 5. Luôn Reset mặt thẻ
  const flashcard = document.getElementById("flashcard");
  if (flashcard) flashcard.classList.remove("flipped");
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

  // 1. Cập nhật local (Máy khách thấy mượt ngay)
  state.learned.add(currentWord.id);
  localStorage.setItem("hsk1_learned", JSON.stringify([...state.learned]));

  // Cập nhật giao diện ngay lập tức
  updateUI();

  // 2. Gửi lên Firebase (Chạy ngầm)
  const user = auth.currentUser;
  if (user) {
    try {
      await db
        .collection("users")
        .doc(user.uid)
        .set(
          {
            // Chỉ gửi thêm ID mới vào mảng, không gửi lại cả danh sách cũ
            learnedWords: firebase.firestore.FieldValue.arrayUnion(
              currentWord.id,
            ),
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp(), // Dùng thời gian của server sẽ chuẩn hơn
          },
          { merge: true },
        );

      console.log("Đã đồng bộ từ vựng lên Cloud!");
    } catch (e) {
      console.error("Lỗi đồng bộ Cloud:", e);
    }
  }
}

// 3. Đừng quên hàm bổ trợ nếu bạn đang dùng nó trong updateUI
function getRemainingWords() {
  // Trả về những từ chưa nằm trong danh sách "đã thuộc"
  return currentVocab.filter((word) => !state.learned.has(word.id));
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
// Lắng nghe trạng thái đăng nhập
firebase.auth().onAuthStateChanged((user) => {
  const authContainer = document.getElementById("auth-container");
  const mainContent = document.getElementById("main-content");

  if (user) {
    // Đã đăng nhập -> Hiện nội dung học, ẩn form login
    authContainer.style.display = "none";
    mainContent.style.display = "block";
    // Sau đó mới gọi hàm lấy dữ liệu
    loadData();
  } else {
    // Chưa đăng nhập -> Hiện form login, ẩn nội dung học
    authContainer.style.display = "block";
    mainContent.style.display = "none";
  }
});