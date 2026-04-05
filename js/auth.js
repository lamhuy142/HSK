// js/auth.js

console.log("File auth.js đã được nạp!");

auth.onAuthStateChanged(async (user) => {
  console.log(
    "Kiểm tra trạng thái User từ Firebase:",
    user ? "Đã đăng nhập: " + user.email : "Chưa đăng nhập",
  );

  const authContainer = document.getElementById("auth-container");
  const mainContent = document.getElementById("main-content");
  const navTabs = document.getElementById("nav-tabs");

  if (!authContainer || !mainContent) {
    console.error(
      "LỖI: Không tìm thấy ID 'auth-container' hoặc 'main-content' trong HTML. Hãy kiểm tra lại file index.html!",
    );
    return;
  }

  if (user) {
    console.log("Đang mở khóa giao diện chính...");
    // Ẩn form login
    authContainer.style.setProperty("display", "none", "important");
    // Hiện nội dung chính
    mainContent.style.setProperty("display", "block", "important");

    if (navTabs) navTabs.style.setProperty("display", "flex", "important");
    // 1. Lấy dữ liệu từ Firestore
    const userDoc = await db.collection("users").doc(user.uid).get();
    const userData = userDoc.data();

    // 2. Cập nhật vào state của app.js
    if (userData && userData.learnedWords) {
      state.learned = new Set(userData.learnedWords);
      // Lưu tạm vào local để app.js dùng
      localStorage.setItem(
        "hsk1_learned",
        JSON.stringify(userData.learnedWords),
      );
    } else {
      state.learned = new Set();
      localStorage.setItem("hsk1_learned", JSON.stringify([]));
    }
    // THÊM DÒNG NÀY ĐỂ HIỆN CHỮ VÀ SỐ TIẾN ĐỘ
    if (typeof updateUI === "function") {
      console.log("Đang gọi updateUI()...");
      updateUI();
    }
    // ... các dòng code còn lại giữ nguyên
  } else {
    console.log("Đang hiện form Đăng nhập...");
    // Hiện form login
    authContainer.style.setProperty("display", "block", "important");
    // Ẩn nội dung chính
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
};
// js/auth.js

// Hàm xử lý Đăng ký tài khoản mới
window.handleSignUp = async function() {
    const email = document.getElementById("email")?.value || document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value || document.getElementById("password")?.value;

    if (!email || !password) {
        alert("Vui lòng nhập đầy đủ Email và Mật khẩu!");
        return;
    }

    try {
        console.log("Đang tiến hành tạo tài khoản...");
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Tạo thêm một bản ghi cho user mới trong Firestore (nếu cần lưu từ vựng đã học)
        const user = userCredential.user;
        await db.collection("users").doc(user.uid).set({
            email: user.email,
            learnedWords: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Chúc mừng! Bạn đã đăng ký thành công.");
        // Sau khi đăng ký thành công, Firebase sẽ tự động login và onAuthStateChanged sẽ lo phần còn lại
    } catch (error) {
        console.error("Lỗi đăng ký:", error);
        alert("Lỗi: " + error.message);
    }
};