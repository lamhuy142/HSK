// js/app.js
// Thêm đoạn này vào trong hàm toggleEditExample hoặc phần khởi tạo
document
  .getElementById("user-ex-input")
  .addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.stopPropagation();
      saveCustomExample();
    }
  });
// 1. Hàm nạp dữ liệu an toàn
function loadInitialData() {
  // Kiểm tra xem hsk1_vocab_full từ file data.js đã sẵn sàng chưa
  const data = typeof hsk1_vocab_full !== "undefined" ? hsk1_vocab_full : [];
  return data.map((word) => ({
    ...word,
    id: word.id ? `hsk1_${word.id}` : `hsk1_auto`,
  }));
}

// 2. Gán dữ liệu vào biến hsk1_vocab (GỌI HÀM VỪA TẠO)
const hsk1_vocab = loadInitialData();

const savedLearned = JSON.parse(localStorage.getItem("hsk1_learned")) || [];

// 3. Biến điều khiển chính
let currentVocab = hsk1_vocab;
const state = {
  currentIndex: 0,
  learned: new Set(),
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
  const word = remaining[state.currentIndex];
  const hanziElement = document.getElementById("card-hanzi");

  if (hanziElement) {
    hanziElement.innerText = word.hanzi;

    // Điều chỉnh font chữ linh hoạt hơn
    if (word.hanzi.length >= 4) {
      // Rất dài (4 chữ trở lên): Cho nhỏ hẳn để an toàn
      hanziElement.className = "text-3xl font-bold text-slate-800 chinese-font";
    } else if (word.hanzi.length === 3) {
      // Dài vừa (3 chữ): Kích thước trung bình
      hanziElement.className = "text-4xl font-bold text-slate-800 chinese-font";
    } else {
      // Ngắn (1-2 chữ): Để to cho đẹp
      hanziElement.className = "text-6xl font-bold text-slate-800 chinese-font";
    }
  }
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
  // const word = remaining[state.currentIndex];

  // --- PHẦN XỬ LÝ TÁCH VÍ DỤ ---
  const rawExample = word.example || "";
  // Regex tách định dạng: "Chữ Hán (pinyin) - Nghĩa"
  const match = rawExample.match(/^(.*?)\s*\((.*?)\)\s*-\s*(.*)$/);

  let exHanzi = rawExample;
  let exPinyin = "";
  let exMeaning = "";

  if (match) {
    exHanzi = match[1].trim();
    exPinyin = match[2].trim();
    exMeaning = match[3].trim();
  } else {
    // Nếu không tách được, hiện nguyên văn vào dòng Hán tự, các dòng kia để trống
    exHanzi = rawExample || "Chưa có ví dụ";
    exPinyin = "";
    exMeaning = "";
  }

  // Đổ dữ liệu ra màn hình
  const elements = {
    "card-hanzi": word.hanzi,
    "card-pinyin": word.pinyin,
    "card-meaning_vi-front": word.meaning_vi,
    // Đổ 3 phần ví dụ đã tách vào các ID tương ứng
    "card-ex-hanzi": exHanzi,
    "card-ex-pinyin": exPinyin,
    "card-ex-meaning": exMeaning,
    "card-id": word.id.replace("hsk1_", ""),
  };

  for (let id in elements) {
    const el = document.getElementById(id);
    if (el) el.innerText = elements[id];
  }

  // Cập nhật Progress Bar
  const total = currentVocab.length;
  const learnedCount = state.learned.size;
  const progressPercent = total > 0 ? (learnedCount / total) * 100 : 0;
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  if (progressBar) progressBar.style.width = `${progressPercent}%`;
  if (progressText) progressText.innerText = `${learnedCount}/${total}`;

  // Reset mặt thẻ
  const flashcard = document.getElementById("flashcard");
  if (flashcard) flashcard.classList.remove("flipped");
}

// 3. CÁC HÀM ĐIỀU KHIỂN (Gán vào window)
window.nextWord = function () {
  const remaining = getRemainingWords();
  if (remaining.length === 0) return;
  state.currentIndex = (state.currentIndex + 1) % remaining.length;
  updateUI();
};

window.prevWord = function () {
  const remaining = getRemainingWords();
  if (remaining.length === 0) return;
  state.currentIndex =
    (state.currentIndex - 1 + remaining.length) % remaining.length;
  updateUI();
};
window.toggleFlip = function () {
  const card = document.getElementById("flashcard");
  if (!card) return;

  // Sử dụng đúng class "flipped" như trong file HTML/CSS
  card.classList.toggle("flipped");

  // Kiểm tra nếu thẻ đang ở mặt sau thì tự động đọc ví dụ
  if (card.classList.contains("flipped")) {
    setTimeout(() => {
      if (typeof playExample === "function") {
        playExample();
      }
    }, 300); // Đợi 0.3 giây để hiệu ứng lật thẻ bắt đầu rồi mới đọc
  } else {
    // ĐÃ LẬT VỀ MẶT TRƯỚC: Ngắt giọng nói ngay lập tức
    window.speechSynthesis.cancel();
    console.log("Đã dừng đọc vì thẻ đã lật về mặt trước.");
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

window.playAudio = function () {
  const remaining = getRemainingWords();
  if (remaining.length > 0) {
    speak(remaining[state.currentIndex].hanzi);
  }
};

window.playExample = function () {
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

window.switchView = function (view) {
  state.view = view;
  const studyView = document.getElementById("view-study");
  const listView = document.getElementById("view-list");
  const btnStudy = document.getElementById("btn-study");
  const btnList = document.getElementById("btn-list");

  if (view === "study") {
    studyView.classList.remove("hidden");
    listView.classList.add("hidden");
    btnStudy.className =
      "px-4 py-1.5 rounded-md text-sm font-semibold transition-all bg-white shadow-sm text-blue-600";
    btnList.className =
      "px-4 py-1.5 rounded-md text-sm font-semibold transition-all text-slate-600";
    updateUI();
  } else {
    studyView.classList.add("hidden");
    listView.classList.remove("hidden");
    btnList.className =
      "px-4 py-1.5 rounded-md text-sm font-semibold transition-all bg-white shadow-sm text-blue-600";
    btnStudy.className =
      "px-4 py-1.5 rounded-md text-sm font-semibold transition-all text-slate-600";
    renderList(hsk1_vocab);
  }
};

function renderList(data) {
  const container = document.getElementById("list-body");
  if (!container) return;
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
                <button onclick="event.stopPropagation(); speak('${w.hanzi}')" class="text-slate-300 hover:text-blue-500 transition-colors">
                    <i class="fas fa-volume-up"></i>
                </button>
            </td>
        </tr>
    `,
    )
    .join("");
}

window.handleSearch = function () {
  const q = document.getElementById("search").value.toLowerCase();
  const filtered = hsk1_vocab.filter(
    (w) =>
      w.hanzi.includes(q) ||
      w.pinyin.toLowerCase().includes(q) ||
      w.meaning_vi.toLowerCase().includes(q),
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

lucide.createIcons();
// Cập nhật trạng thái Active của Nav khi switchView
const originalSwitchView = window.switchView;
window.switchView = function (view) {
  if (originalSwitchView) originalSwitchView(view);

  const btnStudy = document.getElementById("btn-study");
  const btnList = document.getElementById("btn-list");

  if (view === "study") {
    btnStudy.classList.add("nav-active");
    btnStudy.classList.remove("text-slate-300");
    btnList.classList.remove("nav-active");
    btnList.classList.add("text-slate-300");
  } else {
    btnList.classList.add("nav-active");
    btnList.classList.remove("text-slate-300");
    btnStudy.classList.remove("nav-active");
    btnStudy.classList.add("text-slate-300");
  }
};
window.selectCourse = function (level) {
  console.log("Đang chọn HSK mức độ:", level);

  // 1. LƯU TRẠNG THÁI
  localStorage.setItem("currentHSK", level);
  localStorage.setItem("currentView", "study");

  // 2. GÁN DỮ LIỆU (Đảm bảo hsk1_vocab, hsk2_vocab đã có trong data.js)
  if (level === 1) {
    currentVocab = hsk1_vocab;
  } else if (level === 2) {
    // Kiểm tra xem hsk2_vocab đã được định nghĩa chưa
    if (typeof hsk2_vocab !== "undefined") {
      currentVocab = hsk2_vocab;
    } else {
      alert("Dữ liệu HSK 2 chưa sẵn sàng!");
      return;
    }
  } else {
    alert("Cấp độ này đang được cập nhật!");
    return;
  }

  // 3. CẬP NHẬT GIAO DIỆN (Giữ nguyên phần ẩn hiện của Huy)
  const courseSelection = document.getElementById("course-selection");
  const mainContent = document.getElementById("main-content");
  const mainHeader = document.getElementById("main-header");
  const navTabs = document.getElementById("nav-tabs");
  const labelLevel = document.getElementById("label-level");

  if (labelLevel) labelLevel.innerText = `HSK ${level}`;
  if (courseSelection) courseSelection.style.display = "none";
  if (mainHeader) mainHeader.style.display = "flex";
  if (mainContent) mainContent.style.display = "block";
  if (navTabs) navTabs.style.display = "flex";

  // 4. RESET TRẠNG THÁI HỌC
  state.currentIndex = 0;

  // Quan trọng: Nếu Huy muốn HSK 2 bắt đầu từ 0/1272, hãy xóa state.learned cũ
  // hoặc tạo hệ thống lưu learnedWords theo từng Level.
  // Tạm thời để hiện đúng danh sách từ mới:
  updateUI();
  window.scrollTo(0, 0);
};
window.showCourseSelection = function () {
  // Xóa trạng thái đang học
  localStorage.removeItem("currentView");
  localStorage.removeItem("currentHSK");

  // Hiện lại màn hình chọn
  document
    .getElementById("course-selection")
    .style.setProperty("display", "block", "important");
  document
    .getElementById("main-content")
    .style.setProperty("display", "none", "important");
  document
    .getElementById("main-header")
    .style.setProperty("display", "none", "important");
  document
    .getElementById("nav-tabs")
    .style.setProperty("display", "none", "important");
};
// 1. Đóng/Mở form nhập
window.toggleEditExample = function () {
  const display = document.getElementById("example-display-area");
  const edit = document.getElementById("example-edit-area");
  display.classList.toggle("hidden");
  edit.classList.toggle("hidden");
};

// 2. Hàm dịch và lưu
window.saveCustomExample = async function () {
  const input = document.getElementById("user-ex-input");
  const viText = input.value.trim();
  if (!viText) return alert("Vui lòng nhập câu tiếng Việt!");

  const remaining = getRemainingWords();
  const word = remaining[state.currentIndex];

  try {
    const saveBtn = event.target;
    saveBtn.innerText = "Đang dịch...";
    saveBtn.disabled = true;

    const translated = await fetchTranslation(viText);
    const newExample = `${translated.hanzi} (${translated.pinyin}) - ${viText}`;

    // Cập nhật local để hiển thị ngay
    word.example = newExample;

    // LƯU LÊN FIRESTORE
    const user = auth.currentUser;
    if (user) {
      // Lưu vào collection 'custom_examples' bên trong mỗi user
      await db
        .collection("users")
        .doc(user.uid)
        .collection("custom_examples")
        .doc(word.id)
        .set({
          example: newExample,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    }

    updateUI();
    toggleEditExample();
    saveBtn.innerText = "Lưu & Dịch";
    saveBtn.disabled = false;
    input.value = "";
  } catch (error) {
    alert("Lỗi lưu dữ liệu!");
    console.error(error);
  }
};

// 1. Hàm dịch câu sử dụng MyMemory (Ổn định hơn Google Translate cho localhost)
async function fetchTranslation(text) {
    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=vi|zh`);
        const data = await response.json();
        
        if (data.responseStatus !== 200) throw new Error("API Limit");

        const hanzi = data.responseData.translatedText;
        
        // Sử dụng thư viện pinyin-pro để tạo pinyin từ chữ Hán vừa dịch được
        let exPinyin = "";
        if (typeof pinyinPro !== "undefined") {
            exPinyin = pinyinPro.pinyin(hanzi);
        } else {
            exPinyin = "Cần nạp thư viện pinyin-pro";
        }

        return { hanzi, pinyin: exPinyin };
    } catch (error) {
        console.error("Lỗi dịch:", error);
        throw error;
    }
}

// 2. Hàm lưu ví dụ tùy chỉnh
// 2. Hàm dịch và lưu - Đã sửa lỗi wwindow và event
window.saveCustomExample = async function (e) {
  // Ngăn chặn lật thẻ nếu có lan truyền sự kiện
  if (e) e.stopPropagation();

  const input = document.getElementById("user-ex-input");
  const viText = input.value ? input.value.trim() : "";
  
  if (!viText) return alert("Vui lòng nhập câu tiếng Việt!");

  // Lấy từ hiện tại
  const remaining = getRemainingWords();
  if (!remaining || remaining.length === 0) return;
  const word = remaining[state.currentIndex];

  // Xác định nút bấm để đổi text (Dùng e.target hoặc selector nếu e không tồn tại)
  const saveBtn = e ? e.target : document.querySelector('button[onclick*="saveCustomExample"]');

  try {
    if (saveBtn) {
      saveBtn.innerText = "Đang dịch...";
      saveBtn.disabled = true;
    }

    const translated = await fetchTranslation(viText);
    const newExample = `${translated.hanzi} (${translated.pinyin}) - ${viText}`;

    // Cập nhật local để hiển thị ngay
    word.example = newExample;

    // LƯU LÊN FIRESTORE
    const user = auth.currentUser;
    if (user) {
      await db
        .collection("users")
        .doc(user.uid)
        .collection("custom_examples")
        .doc(word.id)
        .set({
          example: newExample,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      console.log("Đã lưu Firestore thành công!");
    }

    updateUI();
    toggleEditExample();

    if (saveBtn) {
      saveBtn.innerText = "Lưu & Dịch";
      saveBtn.disabled = false;
    }
    input.value = "";
  } catch (error) {
    alert("Lỗi lưu dữ liệu hoặc dịch thuật!");
    console.error(error);
    if (saveBtn) {
      saveBtn.innerText = "Lưu & Dịch";
      saveBtn.disabled = false;
    }
  }
};