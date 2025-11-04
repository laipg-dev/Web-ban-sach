// Helper selectors
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

let address_Index = null;

// Keys
const STORAGE_KEYS = {
  USERS: "USERS",
  CURRENT_USER: "currentUser",
  CART_USER: "cart_user",
  CARTS: "Carts",
  ADDRESSES_USER: "addresses_user",
  ADDRESSES: "ALL_ADDRESSES",
  ORDERS: "orders",
  ORDER_DETAILS: "order_details",
  ORDERS_USER: "orders_user",
  ORDERS_DETAILS_USER: "order_details_user",
  BOOKS: "BOOKS",
  CATEGORIES: "CATEGORIES",
};

// ---------- Storage helpers ----------
function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("saveData failed:", key, e);
  }
}

function loadData(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
    if (typeof data === "object" && data !== null) return data;
    return null;
  } catch (e) {
    console.error("loadData failed:", key, e);
    return null;
  }
}

async function loadAllDataToLocal() {
  const seedFiles = {
    [STORAGE_KEYS.CARTS]: "carts.json",
    [STORAGE_KEYS.ADDRESSES]: "addresses.json",
    [STORAGE_KEYS.CATEGORIES]: "categories.json",
    [STORAGE_KEYS.USERS]: "users.json",
    [STORAGE_KEYS.BOOKS]: "books.json",
    [STORAGE_KEYS.ORDERS]: "orders.json",
    [STORAGE_KEYS.ORDER_DETAILS]: "order_details.json",
  };
  for (const [key, file] of Object.entries(seedFiles)) {
    if (!localStorage.getItem(key)) {
      try {
        const res = await fetch(`./json/${file}`);
        const data = await res.json();
        saveData(key, data);
      } catch (e) {
        console.warn(`Không thể load ${file}:`, e);
      }
    }
  }
}

// ---------- ID generator ----------
function generateIncrementNumber(list) {
  const arr = Array.isArray(list) ? list : [];
  const maxNum = arr.reduce((max, item) => {
    const num = parseInt(item?.id, 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return maxNum + 1;
}

// Init
document.addEventListener("DOMContentLoaded", function () {
  clearFieldErrors();
  clearMessages();
  updateAccountUI();
  setupEventListeners();
  updateCartBadge();
  checkAuthAndLoadProfile();
  setupOrderStatusFilter();
  const initial = (location.hash || "").replace("#", "") || "personal";
  activateTab(initial);
});

// Debug helper (optional)
// function setupDebugErrorHelpers() { ... }

// Auth + profile load
function checkAuthAndLoadProfile() {
  clearFieldErrors();
  clearMessages();
  try {
    const currentUser = loadData(STORAGE_KEYS.CURRENT_USER);
    if (!currentUser || !currentUser.username) {
      alert("Bạn cần đăng nhập để truy cập trang này!");
      return;
    }
    loadAddresses();
    loadUserProfile(currentUser);
  } catch (error) {
    console.error("Error loading user profile:", error);
    alert(
      "Có lỗi xảy ra khi tải thông tin người dùng. Vui lòng đăng nhập lại."
    );
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

function editAddress(addressId) {
  clearFieldErrors();
  clearMessages();
  const addresses = loadData(STORAGE_KEYS.ADDRESSES) || [];
  const address = addresses.find(
    (addr) => String(addr.id) === String(addressId)
  );
  if (!address) {
    showError("Không tìm thấy địa chỉ để chỉnh sửa!");
    return;
  }
  editingAddressId = addressId;
  showAddAddressModal();
  const modalTitle = $("#modal-title");
  if (modalTitle) modalTitle.textContent = "Cập nhật địa chỉ";
  $("#address-name").value = address.receiver_name || "";
  $("#address-phone").value = address.phone || "";
  $("#address-city").value = address.province || "";
  $("#address-street").value = address.address_line1 || "";
  $("#address-ward").value = address.ward || "";
  $("#address-district").value = address.district || "";
  const defaultCheckbox = $("#address-default");
  if (defaultCheckbox) defaultCheckbox.checked = address.is_default || false;
  const districtInput = $("#address-district");
  if (districtInput) districtInput.value = address.district || "";
}

function loadUserProfile(user) {
  clearFieldErrors();
  clearMessages();
  $("#sidebar-username").textContent = user.username || "User";
  $("#username").textContent = user.username || "";
  $("#fullname").value = user.full_name || user.name || "";
  $("#phone").value = user.phone || "";
  if (user.gender) {
    const genderRadio = document.querySelector(
      `input[name="gender"][value="${user.gender}"]`
    );
    if (genderRadio) genderRadio.checked = true;
  }
}

function setupEventListeners() {
  const nav = document.querySelector(".profile-nav");
  if (nav) {
    nav.addEventListener("click", (e) => {
      const sub = e.target.closest(".nav-subitem");
      if (sub) {
        e.preventDefault();
        activateTab(sub.dataset.tab);
        return;
      }
      const item = e.target.closest(".nav-item");
      if (item) {
        const section = item.dataset.section;
        if (section === "profile") {
          e.preventDefault();
          activateTab("personal");
        } else if (section === "orders") {
          e.preventDefault();
          activateTab("orders");
          setupOrderStatusFilter();
        } else if (section === "logout") {
          e.preventDefault();
          handleLogout();
        }
      }
    });
  }
  $(".btn-save").addEventListener("click", handleSaveClick);
  setupPasswordEventListeners();
  setupAddressEventListeners();
}

function setupAddressEventListeners() {
  const addAddressBtn = $("#add-address-btn");
  if (addAddressBtn)
    addAddressBtn.addEventListener("click", showAddAddressModal);
  const modalClose = $("#modal-close");
  const modalOverlay = $("#modal-overlay");
  const btnCancel = $("#btn-cancel");
  if (modalClose) modalClose.addEventListener("click", hideAddressModal);
  if (modalOverlay) modalOverlay.addEventListener("click", hideAddressModal);
  if (btnCancel) btnCancel.addEventListener("click", hideAddressModal);
  const addressForm = $("#address-form");
  if (addressForm)
    addressForm.addEventListener("submit", handleAddressFormSubmit);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("#address-modal").style.display === "block")
      hideAddressModal();
  });
}

function handleSaveClick(event) {
  event.preventDefault();
  clearMessages();
  clearFieldErrors();
  const saveBtn = $(".btn-save");
  const originalText = saveBtn.textContent;
  saveBtn.textContent = "Đang lưu...";
  saveBtn.disabled = true;
  const profileForm = $("#profile-form");
  let formData;
  if (profileForm) {
    const formDataObj = new FormData(profileForm);
    formData = {
      full_name: formDataObj.get("fullname") || $("#fullname").value.trim(),
      name: formDataObj.get("fullname") || $("#fullname").value.trim(),
      phone: formDataObj.get("phone") || $("#phone").value.trim(),
    };
  } else {
    formData = {
      full_name: $("#fullname").value.trim(),
      name: $("#fullname").value.trim(),
      phone: $("#phone").value.trim(),
    };
  }
  if (!validateForm(formData)) {
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
    return;
  }
  setTimeout(() => {
    saveProfile(formData);
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
  }, 500);
}

function validateForm(data) {
  clearFieldErrors();
  let isValid = true;
  if (!data.full_name || data.full_name.length < 2) {
    showFieldError("#fullname", "Vui lòng nhập họ và tên (ít nhất 2 ký tự)");
    $("#fullname").focus();
    isValid = false;
  }
  if (data.phone && !isValidPhone(data.phone)) {
    showFieldError(
      "#phone",
      "Số điện thoại không hợp lệ (định dạng: 0XXXXXXXXX)"
    );
    if (isValid) $("#phone").focus();
    isValid = false;
  }
  if (!isValid) showError("Vui lòng kiểm tra các trường có lỗi");
  return isValid;
}

function showFieldError(fieldId, message) {
  const field = $(fieldId);
  if (!field) return;
  field.classList.add("error");
  const errorContainer = field.parentNode.querySelector(".address-field-error");
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = "block";
  }
}

function clearFieldErrors() {
  const errorMessages = document.querySelectorAll(".address-field-error");
  errorMessages.forEach((el) => {
    el.textContent = "";
    el.style.display = "none";
  });
  const inputs = document.querySelectorAll("input, select");
  inputs.forEach((input) => input.classList.remove("error"));
}

// Password events + checks
function setupPasswordEventListeners() {
  const passwordForm = $("#password-form");
  if (passwordForm)
    passwordForm.addEventListener("submit", handlePasswordFormSubmit);
  const passwordSaveBtn = $(".btn-save-password");
  if (passwordSaveBtn)
    passwordSaveBtn.addEventListener("click", handlePasswordSaveClick);
  const passwordToggles = document.querySelectorAll(".password-toggle");
  passwordToggles.forEach((toggle) =>
    toggle.addEventListener("click", handlePasswordToggle)
  );
  const newPasswordInput = $("#new-password");
  if (newPasswordInput) {
    newPasswordInput.addEventListener("input", checkPasswordStrength);
    newPasswordInput.addEventListener("focus", () =>
      $("#password-strength")?.classList.add("show")
    );
  }
  const confirmPasswordInput = $("#confirm-password");
  if (confirmPasswordInput)
    confirmPasswordInput.addEventListener("input", checkPasswordMatch);
}

function handlePasswordToggle(event) {
  event.preventDefault();
  const button = event.target;
  const targetId = button.dataset.target;
  const input = document.getElementById(targetId);
  if (input.type === "password") {
    input.type = "text";
    button.textContent = "🙈";
  } else {
    input.type = "password";
    button.textContent = "👁️";
  }
}

function checkPasswordStrength() {
  const password = $("#new-password").value;
  const strengthFill = $("#strength-fill");
  const strengthText = $("#strength-text");
  if (!password) {
    strengthFill.className = "strength-fill";
    strengthText.textContent = "Độ mạnh mật khẩu";
    strengthText.className = "strength-text";
    return;
  }
  let score = 0;
  let feedback = [];
  if (password.length >= 8) score += 1;
  else feedback.push("ít nhất 8 ký tự");
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("chữ thường");
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("chữ hoa");
  if (/\d/.test(password)) score += 1;
  else feedback.push("số");
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else feedback.push("ký tự đặc biệt");
  if (score < 3) {
    strengthFill.className = "strength-fill weak";
    strengthText.className = "strength-text weak";
    strengthText.textContent = "Yếu - cần " + feedback.slice(0, 2).join(", ");
  } else if (score < 5) {
    strengthFill.className = "strength-fill medium";
    strengthText.className = "strength-text medium";
    strengthText.textContent = "Trung bình - có thể cải thiện";
  } else {
    strengthFill.className = "strength-fill strong";
    strengthText.className = "strength-text strong";
    strengthText.textContent = "Mạnh - tuyệt vời!";
  }
}

function checkPasswordMatch() {
  const newPassword = $("#new-password").value;
  const confirmPassword = $("#confirm-password").value;
  const confirmInput = $("#confirm-password");
  if (confirmPassword && newPassword !== confirmPassword) {
    confirmInput.style.borderColor = "#e74c3c";
    showFieldError("#confirm-password", "Mật khẩu xác nhận không khớp");
  } else if (confirmPassword) {
    confirmInput.style.borderColor = "#4a90e2";
    clearPasswordFieldError("#confirm-password");
  }
}

function handlePasswordFormSubmit(event) {
  event.preventDefault();
  handlePasswordSaveClick(event);
}

function handlePasswordSaveClick(event) {
  event.preventDefault();
  clearMessages();
  clearPasswordErrors();
  const saveBtn = $(".btn-save-password");
  const originalText = saveBtn.textContent;
  saveBtn.textContent = "🔄 Đang cập nhật...";
  saveBtn.disabled = true;
  const current = $("#current-password").value.trim();
  const newPass = $("#new-password").value.trim();
  const confirm = $("#confirm-password").value.trim();
  if (!validatePasswordChange(current, newPass, confirm)) {
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
    return;
  }
  setTimeout(() => {
    savePasswordChange(current, newPass, confirm);
    $("#password-form").reset();
    $("#password-strength").classList.remove("show");
    $("#strength-fill").className = "strength-fill";
    $("#strength-text").textContent = "Độ mạnh mật khẩu";
    $("#strength-text").className = "strength-text";
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
  }, 800);
}

function validatePasswordChange(current, newPass, confirm) {
  const currentUser = loadData(STORAGE_KEYS.CURRENT_USER);
  let isValid = true;
  clearPasswordErrors();
  if (!current) {
    showPasswordFieldError(
      "#current-password",
      "Vui lòng nhập mật khẩu hiện tại"
    );
    $("#current-password").focus();
    isValid = false;
  } else if (!currentUser || current !== currentUser.password) {
    showPasswordFieldError("#current-password", "Mật khẩu hiện tại không đúng");
    $("#current-password").focus();
    isValid = false;
  }
  if (!newPass) {
    showPasswordFieldError("#new-password", "Vui lòng nhập mật khẩu mới");
    if (isValid) $("#new-password").focus();
    isValid = false;
  } else if (newPass.length < 8) {
    showPasswordFieldError(
      "#new-password",
      "Mật khẩu mới phải có ít nhất 8 ký tự"
    );
    if (isValid) $("#new-password").focus();
    isValid = false;
  } else if (newPass === current) {
    showPasswordFieldError(
      "#new-password",
      "Mật khẩu mới phải khác mật khẩu hiện tại"
    );
    if (isValid) $("#new-password").focus();
    isValid = false;
  }
  if (!confirm) {
    showPasswordFieldError(
      "#confirm-password",
      "Vui lòng xác nhận mật khẩu mới"
    );
    if (isValid) $("#confirm-password").focus();
    isValid = false;
  } else if (newPass !== confirm) {
    showPasswordFieldError("#confirm-password", "Mật khẩu xác nhận không khớp");
    if (isValid) $("#confirm-password").focus();
    isValid = false;
  }
  if (!isValid) showError("Vui lòng kiểm tra các trường có lỗi");
  return isValid;
}

function clearPasswordErrors() {
  ["#current-password", "#new-password", "#confirm-password"].forEach(
    clearPasswordFieldError
  );
}

function showPasswordFieldError(fieldId, message) {
  const field = $(fieldId);
  if (!field) return;
  field.classList.add("error");
  field.style.borderColor = "#e74c3c";
  const errorContainer = field.parentNode.querySelector(".address-field-error");
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = "block";
  }
}

function clearPasswordFieldError(fieldId) {
  const field = $(fieldId);
  if (!field) return;
  field.classList.remove("error");
  field.style.borderColor = "";
  const errorContainer = field.parentNode.querySelector(".address-field-error");
  if (errorContainer) {
    errorContainer.textContent = "";
    errorContainer.style.display = "none";
  }
}

function savePasswordChange(current, newPass, confirm) {
  try {
    const currentUser = loadData(STORAGE_KEYS.CURRENT_USER);
    if (!currentUser) {
      showError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      return;
    }
    const users = loadData(STORAGE_KEYS.USERS) || [];
    const userIndex = users.findIndex((u) => u.id === currentUser.id);
    if (userIndex !== -1) {
      users[userIndex].password = newPass;
      users[userIndex].updated_at = new Date().toISOString();
      saveData(STORAGE_KEYS.USERS, users);
    }
    const updatedUser = {
      ...currentUser,
      password: newPass,
      updated_at: new Date().toISOString(),
    };
    saveData(STORAGE_KEYS.CURRENT_USER, updatedUser);
    showSuccess(
      "🎉 Cập nhật mật khẩu thành công! Tài khoản của bạn đã được bảo mật hơn."
    );
    setTimeout(() => clearMessages(), 4000);
  } catch (error) {
    console.error("Error updating password:", error);
    showError("Có lỗi xảy ra khi cập nhật mật khẩu. Vui lòng thử lại.");
  }
}

function saveProfile(data) {
  try {
    const currentUser = loadData(STORAGE_KEYS.CURRENT_USER);
    if (!currentUser) {
      showError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      return;
    }
    const users = loadData(STORAGE_KEYS.USERS) || [];
    const updatedUser = {
      ...currentUser,
      ...data,
      updated_at: new Date().toISOString(),
    };
    const userIndex = users.findIndex(
      (u) => u.id === currentUser.id || u.username === currentUser.username
    );
    if (userIndex !== -1) {
      users[userIndex] = updatedUser;
      saveData(STORAGE_KEYS.USERS, users);
    } else {
      users.push(updatedUser);
      saveData(STORAGE_KEYS.USERS, users);
    }
    saveData(STORAGE_KEYS.CURRENT_USER, updatedUser);
    $("#sidebar-username").textContent = updatedUser.username || "User";
    showSuccess("Cập nhật thông tin thành công!");
    setTimeout(() => clearMessages(), 3000);
  } catch (error) {
    console.error("Error saving profile:", error);
    showError("Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.");
  }
}

function updateAccountUI() {
  const currentUser = loadData(STORAGE_KEYS.CURRENT_USER);
  const accountBtn = document.getElementById("account-btn");
  const accountName = document.getElementById("account-name");
  if (currentUser && accountBtn && accountName) {
    accountName.textContent =
      currentUser.full_name || currentUser.username || "Tài khoản";
    accountBtn.href = "profile.html";
    accountBtn.title = "Xem thông tin tài khoản";
  } else if (accountBtn && accountName) {
    accountName.textContent = "Đăng nhập";
    accountBtn.href = "login.html";
    accountBtn.title = "Đăng nhập vào tài khoản";
  }
}

function updateCartBadge() {
  const cart = loadData(STORAGE_KEYS.CART_USER) || [];
  const badge = $("#cart-count");
  if (badge)
    badge.textContent = cart.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
}

function isValidPhone(phone) {
  const cleanPhone = phone.replace(/[\s-]/g, "");
  const phoneRegex = /^0[3|5|7|8|9][0-9]{8}$/;
  return phoneRegex.test(cleanPhone);
}

function formatPhoneDisplay(phone) {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10)
    return `${cleaned.substring(0, 4)} ${cleaned.substring(
      4,
      7
    )} ${cleaned.substring(7)}`;
  return phone;
}

function showError(message) {
  const errorBox = $("#errBox");
  errorBox.textContent = message;
  errorBox.style.display = "block";
  errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
}

function showSuccess(message) {
  const successBox = $("#successBox");
  successBox.textContent = message;
  successBox.style.display = "block";
  successBox.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => {
    successBox.style.display = "none";
  }, 3000);
}

function clearMessages() {
  $("#errBox").style.display = "none";
  $("#successBox").style.display = "none";
}

// Tabs
function activateTab(tab) {
  clearFieldErrors();
  clearMessages();
  document
    .querySelectorAll(".nav-item")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(".nav-subitem")
    .forEach((el) => el.classList.toggle("active", el.dataset.tab === tab));
  if (tab === "orders") {
    const ordersNav = document.querySelector(
      '.nav-item[data-section="orders"]'
    );
    if (ordersNav) ordersNav.classList.add("active");
  } else if (["personal", "address", "password"].includes(tab)) {
    const profileNav = document.querySelector(
      '.nav-item[data-section="profile"]'
    );
    if (profileNav) profileNav.classList.add("active");
  }
  document
    .querySelectorAll(".content-tab")
    .forEach((pane) =>
      pane.classList.toggle("active", pane.id === `${tab}-tab`)
    );
  const modal = document.getElementById("address-modal");
  if (modal) modal.style.display = "none";
  if (tab === "address") {
    loadAddresses();
  } else if (tab === "orders") {
    if (!window.ordersLoaded) {
      loadOrders().then(() => {
        window.ordersLoaded = true;
        window.allOrders = window.allOrders || [];
      });
    }
  }
  history.replaceState(null, "", `#${tab}`);
}

function handleTabSwitch(event) {
  const targetTab = event.target.dataset.tab;
  if (!targetTab) return;
  activateTab(targetTab);
}

// ====== ADDRESS MANAGEMENT ======
let addresses = [];
let editingAddressId = null;

function loadAddresses() {
  clearFieldErrors();
  clearMessages();
  const currentUser = loadData(STORAGE_KEYS.CURRENT_USER);
  if (!currentUser) return;

  const list = loadData(STORAGE_KEYS.ADDRESSES_USER) || [];
  const container = document.getElementById("address-list");
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = `<p class="muted">Chưa có địa chỉ nào. Hãy thêm địa chỉ mới.</p>`;
    return;
  }
  list.sort((a, b) => b.is_default - a.is_default);
  list.forEach((addr) => {
    const div = document.createElement("div");
    div.className = "address-item";
    div.innerHTML = `
      <div class="meta">
        <div><span class="name">${
          addr.receiver_name
        }</span> <span class="phone">${addr.phone}</span></div>
        <div class="line">${addr.address_line1}, ${addr.ward}, ${
      addr.district
    }, ${addr.province}</div>
        ${addr.is_default ? '<div class="badge-default">Mặc định</div>' : ""}
      </div>
      <div class="actions">
        <button class="btn outline" data-id="${
          addr.id
        }" data-action="set-default" ${
      addr.is_default ? "disabled" : ""
    }>Đặt mặc định</button>
        <button class="btn outline" data-id="${
          addr.id
        }" data-action="edit">Sửa</button>
        <button class="btn danger" data-id="${addr.id}" data-action="delete" ${
      addr.is_default ? "style='visibility: hidden'" : ""
    }>Xóa</button>
      </div>
    `;
    container.appendChild(div);

    const deleteBtn = div.querySelector('button[data-action="delete"]');
    if (deleteBtn)
      deleteBtn.addEventListener("click", () => deleteAddress(addr.id));

    const editBtn = div.querySelector('button[data-action="edit"]');
    if (editBtn) {
      editBtn.addEventListener("click", function () {
        loadData(STORAGE_KEYS.ADDRESSES_USER) || [];
        address_Index = addr.id;
        editAddress(addr.id);
      });
    }

    const setDefaultBtn = div.querySelector(
      'button[data-action="set-default"]'
    );
    if (setDefaultBtn)
      setDefaultBtn.addEventListener("click", () => setDefaultAddress(addr.id));
  });
}

function saveAddresses() {
  const currentUser = loadData(STORAGE_KEYS.CURRENT_USER);
  if (!currentUser) return;
  saveData(STORAGE_KEYS.ADDRESSES_USER, addresses);
}

function showAddAddressModal() {
  editingAddressId = null;
  clearAddressFormErrors();
  clearMessages();
  const modalTitle = $("#modal-title");
  const addressForm = $("#address-form");
  const addressModal = $("#address-modal");
  if (modalTitle) modalTitle.textContent = "Thêm địa chỉ mới";
  if (addressForm) addressForm.reset();
  if (addressModal) {
    addressModal.style.display = "block";
    document.body.style.overflow = "hidden";
    const firstInput = $("#address-name");
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  }
}

function hideAddressModal() {
  $("#address-modal").style.display = "none";
  document.body.style.overflow = "auto";
  editingAddressId = null;
  const modalTitle = $("#modal-title");
  if (modalTitle)
    modalTitle.innerHTML = editingAddressId
      ? "Cập nhật địa chỉ"
      : "Thêm địa chỉ mới";
}

function setDefaultAddress(addressId) {
  const list = loadData(STORAGE_KEYS.ADDRESSES_USER) || [];
  if (!addressId) {
    showError("Không tìm thấy địa chỉ để thiết lập mặc định!");
    return;
  }
  list.forEach((addr) => (addr.is_default = false));
  const address = list.find((a) => a.id === addressId);
  if (address) {
    address.is_default = true;
    saveData(STORAGE_KEYS.ADDRESSES_USER, list);
    upLoadAllAddresses();
    loadAddresses();
    showSuccess("Đã thiết lập địa chỉ mặc định!");
  }
}

function deleteAddress(addressId) {
  const all = loadData(STORAGE_KEYS.ADDRESSES) || [];
  if (!addressId) {
    showError("Không tìm thấy địa chỉ để xóa!");
    return;
  }
  if (all.length === 1) {
    if (
      !confirm("Đây là địa chỉ cuối cùng của bạn. Bạn có chắc chắn muốn xóa?")
    )
      return;
  } else {
    if (!confirm(`Bạn có chắc chắn muốn xóa địa chỉ không?`)) return;
  }
  try {
    const new_addresses = all.filter(
      (address) => String(address.id) != String(addressId)
    );
    saveData(STORAGE_KEYS.ADDRESSES, new_addresses);
    upLoadAllAddresses();
    loadAddresses();
    showSuccess("Xóa địa chỉ thành công! 🗑️");
  } catch (error) {
    console.error("Error deleting address:", error);
    showError("Có lỗi xảy ra khi xóa địa chỉ!");
  }
}

function upLoadAllAddresses() {
  const currentUser = loadData(STORAGE_KEYS.CURRENT_USER);
  if (!currentUser) return;
  const allAddresses = loadData(STORAGE_KEYS.ADDRESSES) || [];
  const filteredAllAddresses = allAddresses.filter(
    (address) => String(address.user_id) !== String(currentUser.id)
  );
  const userAddrs = loadData(STORAGE_KEYS.ADDRESSES) || [];
  filteredAllAddresses.push(...userAddrs);
  saveData(STORAGE_KEYS.ADDRESSES, filteredAllAddresses);
}

function clearAddressFormErrors() {
  $$("#address-modal .address-field-error").forEach((el) => {
    el.textContent = "";
    el.style.display = "none";
  });
  $$("#address-modal input, #address-modal select").forEach((el) =>
    el.classList.remove("error")
  );
}

function showAddressFieldError(fieldId, message) {
  const field = $(fieldId);
  if (!field) return;
  field.classList.add("error");
  let errorDiv = field.parentNode.querySelector(".address-field-error");
  if (!errorDiv) {
    errorDiv = document.createElement("div");
    errorDiv.className = "address-field-error";
    field.parentNode.appendChild(errorDiv);
  }
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
}

function handleAddressFormSubmit(event) {
  event.preventDefault();
  clearAddressFormErrors();
  clearMessages();
  const formData = new FormData(event.target);
  const addressData = {
    name: (formData.get("name") || "").trim(),
    phone: (formData.get("phone") || "").trim(),
    city: (formData.get("city") || "").trim(),
    district: (formData.get("district") || "").trim(),
    street: (formData.get("street") || "").trim(),
    ward: (formData.get("ward") || "").trim(),
    isDefault: formData.get("isDefault") === "on",
  };
  let hasErrors = false;
  let firstErrorField = null;
  if (!addressData.name || addressData.name.length < 2) {
    showAddressFieldError(
      "#address-name",
      "Tên người nhận phải có ít nhất 2 ký tự"
    );
    firstErrorField = firstErrorField || "#address-name";
    hasErrors = true;
  }
  if (!addressData.phone) {
    showAddressFieldError("#address-phone", "Vui lòng nhập số điện thoại");
    firstErrorField = firstErrorField || "#address-phone";
    hasErrors = true;
  } else if (!isValidPhone(addressData.phone)) {
    showAddressFieldError(
      "#address-phone",
      "Số điện thoại không hợp lệ (ví dụ: 0901234567)"
    );
    firstErrorField = firstErrorField || "#address-phone";
    hasErrors = true;
  }
  if (!addressData.city) {
    showAddressFieldError("#address-city", "Vui lòng nhập tỉnh/thành phố");
    firstErrorField = firstErrorField || "#address-city";
    hasErrors = true;
  }
  if (!addressData.district) {
    showAddressFieldError("#address-district", "Vui lòng nhập quận/huyện");
    firstErrorField = firstErrorField || "#address-district";
    hasErrors = true;
  }
  if (!addressData.street || addressData.street.length < 5) {
    showAddressFieldError(
      "#address-street",
      "Địa chỉ cụ thể phải có ít nhất 5 ký tự"
    );
    firstErrorField = firstErrorField || "#address-street";
    hasErrors = true;
  }
  if (hasErrors) {
    if (firstErrorField) $(firstErrorField).focus();
    return;
  }

  try {
    const currentUser = loadData(STORAGE_KEYS.CURRENT_USER);
    const allAddresses = loadData(STORAGE_KEYS.ADDRESSES) || [];

    if (addressData.isDefault == null) {
      addressData.isDefault = false;
    }

    if (addressData.isDefault === true) {
      allAddresses.forEach((add) => (add.is_default = false));
    } else if (allAddresses.length === 0) {
      addressData.isDefault = true;
    }

    const baseAddress = {
      user_id: currentUser?.id,
      receiver_name: addressData.name,
      phone: addressData.phone,
      province: addressData.city,
      district: addressData.district,
      address_line1: addressData.street,
      ward: addressData.ward,
      is_default: !!addressData.isDefault,
    };

    const ModalTitle = $("#modal-title");
    if (ModalTitle && ModalTitle.textContent === "Thêm địa chỉ mới") {
      const newId = generateIncrementNumber(allAddresses);
      allAddresses.push({ id: newId, ...baseAddress });
    } else if (ModalTitle && ModalTitle.textContent === "Cập nhật địa chỉ") {
      const idx = allAddresses.findIndex(
        (addr) => String(addr.id) === String(address_Index)
      );
      if (idx >= 0) {
        allAddresses[idx] = { id: allAddresses[idx].id, ...baseAddress };
      }
    }

    saveData(STORAGE_KEYS.ADDRESSES, allAddresses);
    upLoadAllAddresses();
    loadAddresses();

    const modalTitle = $("#modal-title");
    if (modalTitle)
      modalTitle.innerHTML = editingAddressId
        ? "Cập nhật địa chỉ"
        : "Thêm địa chỉ mới";
    hideAddressModal();
    showSuccess(
      editingAddressId
        ? "Cập nhật địa chỉ thành công! ✅"
        : "Thêm địa chỉ mới thành công! ✅"
    );
  } catch (error) {
    console.error("Error saving address:", error);
    showError("Có lỗi xảy ra khi lưu địa chỉ. Vui lòng thử lại!");
  }
}

// ====== ORDERS MANAGEMENT ======
async function loadOrders(statusFilter = "all") {
  try {
    const userOrders = loadData(STORAGE_KEYS.ORDERS_USER) || [];
    const userOrderDetails = loadData(STORAGE_KEYS.ORDERS_DETAILS_USER) || [];
    if (userOrders.length === 0) {
      window.allOrders = [];
      renderOrders([], statusFilter);
      return [];
    }
    const booksResponse = await fetch("./json/books.json");
    const books = await booksResponse.json();
    const ordersWithDetails = userOrders.map((order) => {
      const orderDetails = userOrderDetails.filter(
        (detail) => detail.order_id === order.id
      );
      const groupedItems = {};
      orderDetails.forEach((detail) => {
        const bookId = detail.book_id;
        if (groupedItems[bookId]) {
          groupedItems[bookId].quantity += detail.quantity;
          if (
            detail.note &&
            !groupedItems[bookId].note?.includes(detail.note)
          ) {
            groupedItems[bookId].note = groupedItems[bookId].note
              ? `${groupedItems[bookId].note}; ${detail.note}`
              : detail.note;
          }
        } else {
          const book = books.find((b) => b.id === bookId);
          groupedItems[bookId] = {
            book_id: bookId,
            book: book || {
              id: bookId,
              title: "Sách không tìm thấy",
              image_url: "icon/default-book.jpg",
            },
            quantity: detail.quantity,
            price: detail.price,
            note: detail.note,
          };
        }
      });
      return { ...order, items: Object.values(groupedItems) };
    });
    ordersWithDetails.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    window.allOrders = ordersWithDetails;
    renderOrders(ordersWithDetails, statusFilter);
    return ordersWithDetails;
  } catch (error) {
    console.error("❌ Error loading orders:", error);
    showError("Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.");
    window.allOrders = [];
    renderOrders([], statusFilter);
    return [];
  }
}

function getCurrentUserOrders() {
  return loadData(STORAGE_KEYS.ORDERS_USER) || [];
}

function getCurrentUserOrderDetails() {
  return loadData(STORAGE_KEYS.ORDERS_DETAILS_USER) || [];
}

function getOrderDetailsByOrderId(orderId) {
  const orderDetails = getCurrentUserOrderDetails();
  return orderDetails.filter((detail) => detail.order_id === orderId);
}

function getCurrentUserOrdersWithDetails() {
  const userOrders = getCurrentUserOrders();
  const userOrderDetails = getCurrentUserOrderDetails();
  return userOrders.map((order) => ({
    ...order,
    details: userOrderDetails.filter((detail) => detail.order_id === order.id),
  }));
}

function renderOrders(orders, statusFilter = "all") {
  const ordersList = $("#orders-list");
  const ordersEmpty = $("#orders-empty");
  if (!Array.isArray(orders)) orders = [];
  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);
  if (filteredOrders.length === 0) {
    ordersList.style.display = "none";
    ordersEmpty.style.display = "block";
    return;
  }
  ordersList.style.display = "block";
  ordersEmpty.style.display = "none";
  ordersList.innerHTML = filteredOrders
    .map(
      (order) => `
    <div class="order-card" data-order-id="${order.id}">
      <div class="order-header">
        <div class="order-info">
          <div class="order-id">Đơn hàng #${order.id}</div>
          <div class="order-date">${formatDate(order.created_at)}</div>
        </div>
        <div class="order-status ${order.status}">${getStatusText(
        order.status
      )}</div>
      </div>
      <div class="order-items">
        ${order.items
          .map(
            (item) => `
          <div class="order-item">
            <div class="order-item-image">
              <img src="${item.book.image_url}" alt="${
              item.book.title
            }" loading="lazy">
            </div>
            <div class="order-item-details">
              <div class="order-item-title">${item.book.title}</div>
              <div class="order-item-meta">
                <div class="order-item-quantity">Số lượng: ${
                  item.quantity
                }</div>
                <div class="order-item-price">${formatPrice(item.price)}đ</div>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
      <div class="order-summary">
        <div class="order-actions">
          ${getOrderActions(order)}
        </div>
        <div class="order-total">
          <div class="order-total-label">Tổng tiền:</div>
          <div class="order-total-amount">${formatPrice(
            order.total_amount
          )}đ</div>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

function getStatusText(status) {
  const statusMap = {
    pending: "Chờ xử lý",
    processing: "Chờ lấy hàng",
    shipping: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
}

function getOrderActions(order) {
  const actions = [];
  switch (order.status) {
    case "pending":
      actions.push(
        `<button class="order-btn" onclick="cancelOrder(${order.id})">Hủy đơn</button>`
      );
      break;
    case "delivered":
    case "cancelled":
      actions.push(
        `<button class="order-btn primary" onclick="reorderItems(${order.id})">Mua lại</button>`
      );
      break;
  }
  actions.push(
    `<button class="order-btn" onclick="viewOrderDetails(${order.id})">Xem chi tiết</button>`
  );
  return actions.join("");
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price) {
  return Number(price).toLocaleString("vi-VN");
}

function setupOrderStatusFilter() {
  const statusBtns = document.querySelectorAll(".status-btn");
  if (!window.ordersLoaded) {
    loadOrders().then((orders) => {
      window.allOrders = orders;
      window.ordersLoaded = true;
      renderOrders(window.allOrders, "all");
    });
  }
  statusBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      statusBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      const status = this.dataset.status;
      renderOrders(window.allOrders, status);
    });
  });
}

function updateOrderStatus(key, orderId, status) {
  const orders = loadData(key) || [];
  orders.forEach((order) => {
    if (order.id === orderId) order.status = status;
  });
  saveData(key, orders);
}

function cancelOrder(orderId) {
  if (confirm("Bạn có chắc muốn hủy đơn hàng này?")) {
    updateOrderStatus(STORAGE_KEYS.ORDERS_USER, orderId, "cancelled");
    updateOrderStatus(STORAGE_KEYS.ORDERS_DETAILS_USER, orderId, "cancelled");
    showSuccess("Đã hủy đơn hàng thành công");
    const activeBtn = document.querySelector(".status-btn.active");
    const currentStatus = activeBtn ? activeBtn.dataset.status : "all";
    loadOrders(currentStatus);
  }
}

function reorderItems(orderId) {
  try {
    getCurrentUserOrders();
    const orderDetails = getOrderDetailsByOrderId(orderId);
    if (orderDetails.length === 0) {
      showError("Không tìm thấy chi tiết đơn hàng");
      return;
    }
    const cart = loadData(STORAGE_KEYS.CART_USER) || [];
    orderDetails.forEach((detail) => {
      const existingItem = cart.find(
        (c) => String(c.bookId) === String(detail.book_id)
      );
      if (existingItem) existingItem.quantity += detail.quantity;
      else
        cart.push({
          bookId: detail.book_id,
          quantity: detail.quantity,
          selected: true,
        });
    });
    saveData(STORAGE_KEYS.CART_USER, cart);
    updateCartBadge();
    showSuccess("Đã thêm lại các sản phẩm vào giỏ hàng");
  } catch (error) {
    console.error("Error reordering items:", error);
    showError("Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng");
  }
}

function viewOrderDetails(orderId) {
  try {
    const userOrders = getCurrentUserOrders();
    const orderDetails = getOrderDetailsByOrderId(orderId);
    const order = userOrders.find((o) => o.id === orderId);
    if (!order) {
      showError("Không tìm thấy thông tin đơn hàng");
      return;
    }
    if (orderDetails.length === 0) {
      showError("Không tìm thấy chi tiết đơn hàng");
      return;
    }
    showOrderDetailsModal(order, orderDetails);
  } catch (error) {
    console.error("Error viewing order details:", error);
    showError("Có lỗi xảy ra khi xem chi tiết đơn hàng");
  }
}

async function showOrderDetailsModal(order, orderDetails) {
  try {
    const booksResponse = await fetch("./json/books.json");
    const books = await booksResponse.json();
    const modalHTML = `
      <div id="order-details-modal" class="modal-overlay" style="display: block;">
        <div class="modal-content order-details-modal">
          <div class="modal-header">
            <h2>Chi tiết đơn hàng #${order.id}</h2>
            <button id="close-order-details" class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="order-info-section">
              <div class="info-row"><span class="label">Trạng thái:</span><span class="value order-status ${
                order.status
              }">${getStatusText(order.status)}</span></div>
              <div class="info-row"><span class="label">Ngày đặt:</span><span class="value">${formatDate(
                order.created_at
              )}</span></div>
              <div class="info-row"><span class="label">Phương thức thanh toán:</span><span class="value">${order.payment_method.toUpperCase()}</span></div>
              <div class="info-row"><span class="label">Tổng tiền:</span><span class="value total-amount">${formatPrice(
                order.total_amount
              )}đ</span></div>
            </div>
            <div class="order-items-section">
              <h3>Sản phẩm đã đặt</h3>
              <div class="items-list">
                ${orderDetails
                  .map((detail) => {
                    const book = books.find((b) => b.id === detail.book_id);
                    return `
                    <div class="detail-item">
                      <div class="item-image">
                        <img src="${
                          book?.image_url || "icon/default-book.jpg"
                        }" alt="${
                      book?.title || "Sách không tìm thấy"
                    }" loading="lazy">
                      </div>
                      <div class="item-info">
                        <div class="item-title">${
                          book?.title || "Sách không tìm thấy"
                        }</div>
                        <div class="item-meta">
                          <span class="item-price">${formatPrice(
                            detail.price
                          )}đ</span>
                          <span class="item-quantity">x${detail.quantity}</span>
                          <span class="item-subtotal">${formatPrice(
                            detail.price * detail.quantity
                          )}đ</span>
                        </div>
                        ${
                          detail.note
                            ? `<div class="item-note">Ghi chú: ${detail.note}</div>`
                            : ""
                        }
                      </div>
                    </div>`;
                  })
                  .join("")}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            ${getOrderActions(order)}
            <button class="order-btn" onclick="closeOrderDetailsModal()">Đóng</button>
          </div>
        </div>
      </div>`;
    const existingModal = document.getElementById("order-details-modal");
    if (existingModal) existingModal.remove();
    document.body.insertAdjacentHTML("beforeend", modalHTML);
    document.body.style.overflow = "hidden";
    document
      .getElementById("close-order-details")
      .addEventListener("click", closeOrderDetailsModal);
    document
      .getElementById("order-details-modal")
      .addEventListener("click", (e) => {
        if (e.target.id === "order-details-modal") closeOrderDetailsModal();
      });
  } catch (error) {
    console.error("Error showing order details modal:", error);
    showError("Không thể tải chi tiết đơn hàng");
  }
}

function closeOrderDetailsModal() {
  const modal = document.getElementById("order-details-modal");
  if (modal) {
    modal.remove();
    document.body.style.overflow = "auto";
  }
}

function setupOrdersNavigation() {
  const orderNavItem = $('.nav-item[data-section="orders"]');
  if (orderNavItem) {
    orderNavItem.addEventListener("click", function () {
      activateTab("orders");
      setupOrderStatusFilter();
    });
  }
}

function handleLogout() {
  const confirmLogout = confirm("Bạn có chắc chắn muốn đăng xuất không?");
  if (confirmLogout) {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.ORDERS_DETAILS_USER);
      localStorage.removeItem(STORAGE_KEYS.CART_USER);
      localStorage.removeItem(STORAGE_KEYS.ORDERS_USER);
      localStorage.removeItem(STORAGE_KEYS.ADDRESSES_USER);
      window.location.href = "index.html";
    } catch (error) {
      console.error("❌ Error during logout:", error);
      alert("Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại!");
    }
  }
}
