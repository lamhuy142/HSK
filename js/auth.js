// js/auth.js

console.log("File auth.js đã được nạp!");

// js/auth.js
auth.onAuthStateChanged(async (user) => {
  const authContainer = document.getElementById("auth-container");
  const courseSelection = document.getElementById("course-selection");
  const mainContent = document.getElementById("main-content");
  const mainHeader = document.getElementById("main-header");
  const navTabs = document.getElementById("nav-tabs");
  const emailDisplay = document.getElementById("user-email-display");

  if (user) {
    if (emailDisplay) emailDisplay.innerText = user.email.split("@")[0];

    // ĐỌC TRẠNG THÁI ĐÃ LƯU
    const savedHSK = localStorage.getItem("currentHSK");
    const savedView = localStorage.getItem("currentView");

    if (savedHSK && savedView === "study") {
      // NẾU ĐANG HỌC DỞ: Vào thẳng Flashcard
      authContainer.style.setProperty("display", "none", "important");
      courseSelection.style.setProperty("display", "none", "important");
      if (mainHeader)
        mainHeader.style.setProperty("display", "flex", "important");
      if (mainContent)
        mainContent.style.setProperty("display", "block", "important");
      if (navTabs) navTabs.style.setProperty("display", "flex", "important");

      // Cập nhật nhãn HSK trên header
      const labelLevel = document.getElementById("label-level");
      if (labelLevel) labelLevel.innerText = `HSK ${savedHSK}`;
    } else {
      // NẾU CHƯA CHỌN: Hiện bảng lộ trình như cũ
      authContainer.style.setProperty("display", "none", "important");
      courseSelection.style.setProperty("display", "block", "important");
      if (mainHeader)
        mainHeader.style.setProperty("display", "none", "important");
      if (mainContent)
        mainContent.style.setProperty("display", "none", "important");
    }

    // 3. Lấy dữ liệu từ Firestore một lần duy nhất
    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        window.currentUserData = userData; // Lưu vào biến global

        // 4. Đồng bộ từ vựng đã học vào App state
        if (userData.learnedWords) {
          state.learned = new Set(userData.learnedWords);
          console.log("Đã đồng bộ thành công:", state.learned.size, "từ");

          // Cập nhật giao diện ngay sau khi có dữ liệu từ Firebase
          updateUI();
          if (state.view === "list") renderList(hsk1_vocab);
        }
      }
    } catch (error) {
      console.error("Lỗi lấy dữ liệu Firestore:", error);
    }

    updateUI();
  } else {
    // TRƯỜNG HỢP CHƯA ĐĂNG NHẬP
    if (emailDisplay) emailDisplay.innerText = "Guest";
    authContainer.style.setProperty("display", "flex", "important");
    courseSelection.style.setProperty("display", "none", "important");
    if (mainHeader)
      mainHeader.style.setProperty("display", "none", "important");
    if (mainContent)
      mainContent.style.setProperty("display", "none", "important");
    if (navTabs) navTabs.style.setProperty("display", "none", "important");
  }
});

// Các hàm xử lý nút bấm (Gán vào window để HTML gọi được)
window.handleLogin = async function () {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;
  if (!email || !password) return alert("Vui lòng nhập đủ email và mật khẩu");

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (e) {
    alert("Lỗi đăng nhập: " + e.message);
  }
};

window.handleLogout = function () {
  if (confirm("Bạn muốn đăng xuất?")) {
    auth.signOut().then(() => {
      localStorage.removeItem("hsk1_learned");
      location.reload();
    });
  }
};
// js/auth.js

// Hàm để chuyển đổi giữa màn hình Đăng nhập và Đăng ký
function toggleAuth(isLogin) {
  const authTitle = document.getElementById("auth-title");
  const loginActions = document.getElementById("login-actions");
  const signupActions = document.getElementById("signup-actions");

  if (isLogin) {
    authTitle.innerText = "Đăng nhập";
    loginActions.classList.remove("hidden");
    signupActions.classList.add("hidden");
  } else {
    authTitle.innerText = "Đăng ký tài khoản";
    loginActions.classList.add("hidden");
    signupActions.classList.remove("hidden");
  }
}
// js/auth.js

// Hàm xử lý Đăng ký tài khoản mới
window.handleSignUp = async function () {
  const email =
    document.getElementById("email")?.value ||
    document.getElementById("email")?.value;
  const password =
    document.getElementById("password")?.value ||
    document.getElementById("password")?.value;

  if (!email || !password) {
    alert("Vui lòng nhập đầy đủ Email và Mật khẩu!");
    return;
  }

  try {
    console.log("Đang tiến hành tạo tài khoản...");
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password,
    );

    // Tạo thêm một bản ghi cho user mới trong Firestore (nếu cần lưu từ vựng đã học)
    const user = userCredential.user;
    await db.collection("users").doc(user.uid).set({
      email: user.email,
      learnedWords: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    alert("Chúc mừng! Bạn đã đăng ký thành công.");
    // Sau khi đăng ký thành công, Firebase sẽ tự động login và onAuthStateChanged sẽ lo phần còn lại
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    alert("Lỗi: " + error.message);
  }
};
