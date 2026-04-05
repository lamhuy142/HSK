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
auth.onAuthStateChanged(async (user) => {
  const loggedOutUI = document.getElementById("user-logged-out");
  const loggedInUI = document.getElementById("user-logged-in");
  const emailDisplay = document.getElementById("user-email-display");

  if (user) {
    // Khi đã đăng nhập
    loggedOutUI.classList.add("hidden");
    loggedInUI.classList.remove("hidden");
    emailDisplay.innerText = user.email;

    // Tải tiến độ từ Firebase (Hàm này sẽ viết ở app.js)
    if (typeof loadProgressFromCloud === "function") {
      await loadProgressFromCloud(user.uid);
    }
  } else {
    // Khi đã đăng xuất
    loggedOutUI.classList.remove("hidden");
    loggedInUI.classList.add("hidden");

    // Reset tiến độ về local hoặc trống
    state.learned = new Set(
      JSON.parse(localStorage.getItem("hsk1_learned")) || [],
    );
    if (typeof updateUI === "function") updateUI();
  }
});
