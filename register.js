function getUsers() {
  return JSON.parse(localStorage.getItem("USERS") || "[]");
}
function saveUsers(users) {
  localStorage.setItem("USERS", JSON.stringify(users));
}

function showError(msg) {
  const err = document.getElementById("errBox");
  err.textContent = msg;
  err.style.display = "block";
}
function hideError() {
  const err = document.getElementById("errBox");
  err.textContent = "";
  err.style.display = "none";
}

// Toggle hiện/ẩn mật khẩu
document.getElementById("togglePw").addEventListener("click", () => {
  const pw = document.getElementById("password");
  pw.type = pw.type === "password" ? "text" : "password";
});

document.getElementById("registerBtn").addEventListener("click", async () => {
  hideError();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const fullName = document.getElementById("fullName").value.trim();
  const phone = document.getElementById("phone").value.trim();

  const phoneRegex = /^0\d{9}$/;
  if (!username || !password || !fullName || !phone) {
    showError("Vui lòng nhập đầy đủ thông tin.");
    return;
  }
  if (!phoneRegex.test(phone)) {
    showError("Số điện thoại không hợp lệ.");
    return;
  }
  if (password.length < 6) {
    showError("Mật khẩu phải có ít nhất 6 ký tự.");
    return;
  }
  if (password !== document.getElementById("confirmPassword").value.trim()) {
    showError("Mật khẩu xác nhận không khớp.");
    return;
  }
  const users = getUsers();
  if (users.find((u) => u.username === username)) {
    showError("Tên đăng nhập đã tồn tại.");
    return;
  }

  // Tạo user mới
  const newUser = {
    id: Date.now(),
    username,
    password,
    full_name: fullName,
    phone,
    role: "customer",
  };
  users.push(newUser);
  cartObj = {
    id: Date.now(),
    user_id: newUser.id,
    items: [],
  };
  const carts = JSON.parse(localStorage.getItem("carts") || "[]");
  carts.push(cartObj);
  localStorage.setItem("carts", JSON.stringify(carts));
  saveUsers(users);

  alert("Đăng ký thành công! Bạn có thể đăng nhập ngay.");

  window.location.href = "login.html";
});
