// js/auth.js

// 1. Đăng ký tài khoản mới
async function handleSignUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("auth-error");

  try {
    await auth.createUserWithEmailAndPassword(email, password);
    alert("Đăng ký thành công! Chào mừng bạn.");
  } catch (error) {
    errorEl.innerText = "Lỗi đăng ký: " + error.message;
    errorEl.classList.remove("hidden");
  }
}

// 2. Đăng nhập
async function handleLogin() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("auth-error");

  try {
    await auth.signInWithEmailAndPassword(email, password);
    errorEl.classList.add("hidden");
  } catch (error) {
    errorEl.innerText = "Lỗi: " + error.message;
    errorEl.classList.remove("hidden");
  }
}

// 3. Đăng xuất
function handleLogout() {
  if (confirm("Bạn muốn đăng xuất?")) {
    auth.signOut();
  }
}

// 4. Theo dõi trạng thái người dùng (Quan trọng nhất)
// Trong js/auth.js
auth.onAuthStateChanged(async (user) => {
    const authContainer = document.getElementById("auth-container");
    const mainContent = document.getElementById("main-content");
    const emailDisplay = document.getElementById("user-email-display");

    if (user) {
        // ĐÃ ĐĂNG NHẬP
        authContainer.classList.add("hidden");
        mainContent.classList.remove("hidden");
        if (emailDisplay) emailDisplay.innerText = `Đang học: ${user.email}`;
        
        // Tải dữ liệu từ Firebase
        const doc = await db.collection("users").doc(user.uid).get();
        if (doc.exists && doc.data().learnedWords) {
            state.learned = new Set(doc.data().learnedWords);
        }
        updateUI();
    } else {
        // CHƯA ĐĂNG NHẬP
        authContainer.classList.remove("hidden");
        mainContent.classList.add("hidden");
        state.learned = new Set();
    }
});
function toggleAuth(isLogin) {
  const title = document.getElementById("auth-title");
  const loginActions = document.getElementById("login-actions");
  const signupActions = document.getElementById("signup-actions");
  const errorEl = document.getElementById("auth-error");

  errorEl.classList.add("hidden"); // Xóa thông báo lỗi cũ

  if (isLogin) {
    title.innerText = "Đăng nhập";
    loginActions.classList.remove("hidden");
    signupActions.classList.add("hidden");
  } else {
    title.innerText = "Đăng ký tài khoản";
    loginActions.classList.add("hidden");
    signupActions.classList.remove("hidden");
  }
}
