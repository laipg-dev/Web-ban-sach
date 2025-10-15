// Helper functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
let address_Index = null;
// Constants

const STORAGE_KEYS = {
  CURRENT_USER: "currentUser",
  USERS: "USERS",
  CART: "cart_user1",
  ORDERS: "orders",
  ORDER_DETAILS: "order_details",
  ORDERS_USER: "orders_user",
  ORDERS_DETAILS_USER: "order_details_user",
};

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  // Xóa tất cả thông báo lỗi khi tải trang
  clearFieldErrors();
  clearMessages();

  setupEventListeners();
  updateCartBadge();
  checkAuthAndLoadProfile();
  setupOrderStatusFilter();
  // Mở đúng tab theo hash (#personal | #address | #password)
  const initial = (location.hash || "").replace("#", "") || "personal";
  activateTab(initial);

  // Add debug event listener for testing error display (uncomment for testing)
  // setupDebugErrorHelpers();
});

// Function to help test error displays - uncomment for testing
function setupDebugErrorHelpers() {
  // Add a debug button
  const debugBtn = document.createElement("button");
  debugBtn.textContent = "Test Error Display";
  debugBtn.style.position = "fixed";
  debugBtn.style.bottom = "10px";
  debugBtn.style.right = "10px";
  debugBtn.style.zIndex = "9999";
  debugBtn.style.background = "#4a90e2";
  debugBtn.style.color = "white";
  debugBtn.style.border = "none";
  debugBtn.style.padding = "8px 12px";
  debugBtn.style.borderRadius = "4px";

  debugBtn.addEventListener("click", function () {
    // Test profile form errors
    if ($("#personal-tab").classList.contains("active")) {
      showFieldError("#fullname", "Tên không hợp lệ (debug)");
      showFieldError("#phone", "Số điện thoại không hợp lệ (debug)");
      showError("Đây là lỗi chung (debug)");
    }

    // Test address form errors if modal is open
    if ($("#address-modal").style.display === "block") {
      showAddressFieldError(
        "#address-name",
        "Tên người nhận không hợp lệ (debug)"
      );
      showAddressFieldError(
        "#address-phone",
        "Số điện thoại không hợp lệ (debug)"
      );
      showAddressFieldError("#address-street", "Địa chỉ không hợp lệ (debug)");
    }
  });

  document.body.appendChild(debugBtn);
}

// Check if user is logged in and load profile
function checkAuthAndLoadProfile() {
  clearFieldErrors();
  clearMessages();

  try {
    const currentUser = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || "null"
    );

    if (!currentUser || !currentUser.username) {
      alert("Bạn cần đăng nhập để truy cập trang này!");
      window.location.href = "login.html";
      return;
    }

    // Initialize user addresses from central storage if needed
    loadAddresses();

    loadUserProfile(currentUser);
  } catch (error) {
    console.error("Error loading user profile:", error);
    alert(
      "Có lỗi xảy ra khi tải thông tin người dùng. Vui lòng đăng nhập lại."
    );
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    window.location.href = "login.html";
  }
}
function editAddress(addressId) {
  console.log("Đang sửa địa chỉ có ID:", addressId);

  // Xóa thông báo lỗi trước khi mở modal chỉnh sửa
  clearFieldErrors();
  clearMessages();

  // Lấy danh sách địa chỉ từ localStorage
  const addresses = JSON.parse(localStorage.getItem(`addresses_1`) || "[]");

  // Tìm địa chỉ cần sửa trong danh sách
  const address = addresses.find(
    (addr) => String(addr.id) === String(addressId)
  );

  if (!address) {
    showError("Không tìm thấy địa chỉ để chỉnh sửa!");
    return;
  }

  // Lưu ID địa chỉ đang sửa để sử dụng khi lưu
  editingAddressId = addressId;

  // Hiển thị modal thêm địa chỉ (với form trống)
  showAddAddressModal();

  // Đổi tiêu đề modal thành "Cập nhật địa chỉ"
  const modalTitle = $("#modal-title");
  if (modalTitle) modalTitle.textContent = "Cập nhật địa chỉ";

  // Điền dữ liệu vào form
  $("#address-name").value = address.receiver_name || "";
  $("#address-phone").value = address.phone || "";
  $("#address-city").value = address.province || ""; // Sử dụng tên đầy đủ của tỉnh/thành phố
  $("#address-street").value = address.address_line1 || "";
  $("#address-ward").value = address.ward || "";
  $("#address-district").value = address.district || "";

  // Đặt trạng thái checkbox mặc định
  const defaultCheckbox = $("#address-default");
  if (defaultCheckbox) {
    defaultCheckbox.checked = address.is_default || false;
  }

  // Đặt giá trị quận/huyện trực tiếp
  const districtInput = $("#address-district");
  if (districtInput) {
    districtInput.value = address.district || "";
  }
}
// Load user profile data
function loadUserProfile(user) {
  clearFieldErrors();
  clearMessages();
  console.log(user.username);
  $("#sidebar-username").textContent = user.username || "User";
  $("#username").textContent = user.username || "";
  $("#fullname").value = user.full_name || user.name || "";
  $("#phone").value = user.phone || "";

  // Set gender radio
  if (user.gender) {
    const genderRadio = document.querySelector(
      `input[name="gender"][value="${user.gender}"]`
    );
    if (genderRadio) genderRadio.checked = true;
  }
}

// Setup event listeners
function setupEventListeners() {
  // Navigation (ủy quyền cho cả nav-item và nav-subitem)
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

  // Save button click (giữ nguyên)
  $(".btn-save").addEventListener("click", handleSaveClick);

  // Password form event listeners
  setupPasswordEventListeners();

  // ... (các event còn lại giữ nguyên)
  // Password, Delete, Avatar, City profile, Address events ...
  setupAddressEventListeners();
}

// Setup address-specific event listeners(addAd)
function setupAddressEventListeners() {
  // Add address button
  const addAddressBtn = $("#add-address-btn");
  if (addAddressBtn) {
    addAddressBtn.addEventListener("click", showAddAddressModal);
  }

  // Không thêm listener ở đây vì các nút Delete được tạo động

  // Modal close events
  const modalClose = $("#modal-close");
  const modalOverlay = $("#modal-overlay");
  const btnCancel = $("#btn-cancel");

  if (modalClose) modalClose.addEventListener("click", hideAddressModal);
  if (modalOverlay) modalOverlay.addEventListener("click", hideAddressModal);
  if (btnCancel) btnCancel.addEventListener("click", hideAddressModal);

  // Address form submission
  const addressForm = $("#address-form");
  if (addressForm) {
    addressForm.addEventListener("submit", handleAddressFormSubmit);
  }

  // Không cần xử lý sự kiện thay đổi tỉnh/thành phố nữa

  // ESC key to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("#address-modal").style.display === "block") {
      hideAddressModal();
    }
  });
}

// Handle save button click
function handleSaveClick(event) {
  event.preventDefault();
  clearMessages();
  clearFieldErrors(); // Clear any previous field errors

  const saveBtn = $(".btn-save");
  const originalText = saveBtn.textContent;

  // Show loading state
  saveBtn.textContent = "Đang lưu...";
  saveBtn.disabled = true;

  // Get form data from the form
  const profileForm = $("#profile-form");
  let formData;

  if (profileForm) {
    // Try to use FormData API if form has proper name attributes
    const formDataObj = new FormData(profileForm);
    formData = {
      full_name: formDataObj.get("fullname") || $("#fullname").value.trim(),
      name: formDataObj.get("fullname") || $("#fullname").value.trim(), // Alias for backward compatibility
      phone: formDataObj.get("phone") || $("#phone").value.trim(),
    };
  } else {
    // Fallback to direct DOM access
    formData = {
      full_name: $("#fullname").value.trim(),
      name: $("#fullname").value.trim(), // Alias for backward compatibility
      phone: $("#phone").value.trim(),
    };
  }

  // Validate form
  if (!validateForm(formData)) {
    // Reset button state
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
    return;
  }

  // Save profile with delay for better UX
  setTimeout(() => {
    saveProfile(formData);
    // Reset button state
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
  }, 500);
}

// Validate form data
function validateForm(data) {
  clearFieldErrors(); // Clear any existing field errors
  let isValid = true;

  // Validate name
  if (!data.full_name || data.full_name.length < 2) {
    showFieldError("#fullname", "Vui lòng nhập họ và tên (ít nhất 2 ký tự)");
    $("#fullname").focus();
    isValid = false;
  }

  // Validate phone if provided
  if (data.phone && !isValidPhone(data.phone)) {
    showFieldError(
      "#phone",
      "Số điện thoại không hợp lệ (định dạng: 0XXXXXXXXX)"
    );
    if (isValid) $("#phone").focus(); // Only focus if it's the first error
    isValid = false;
  }

  // If we have field errors, also show a summary at the top
  if (!isValid) {
    showError("Vui lòng kiểm tra các trường có lỗi");
  }

  return isValid;
}

// Show error for a specific field
function showFieldError(fieldId, message) {
  const field = $(fieldId);
  if (!field) return;

  // Add error class to the input
  field.classList.add("error");

  // Find the error message container that follows this input
  const errorContainer = field.parentNode.querySelector(".address-field-error");
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = "block";
  }
}

// Clear all field-specific errors
function clearFieldErrors() {
  // Hide all error messages
  const errorMessages = document.querySelectorAll(".address-field-error");
  errorMessages.forEach((el) => {
    el.textContent = "";
    el.style.display = "none";
  });

  // Remove error class from all inputs
  const inputs = document.querySelectorAll("input, select");
  inputs.forEach((input) => {
    input.classList.remove("error");
  });
}

// Setup password form event listeners
function setupPasswordEventListeners() {
  // Password form submission
  const passwordForm = $("#password-form");
  if (passwordForm) {
    passwordForm.addEventListener("submit", handlePasswordFormSubmit);
  }

  // Password save button
  const passwordSaveBtn = $(".btn-save-password");
  if (passwordSaveBtn) {
    passwordSaveBtn.addEventListener("click", handlePasswordSaveClick);
  }

  // Password toggle buttons
  const passwordToggles = document.querySelectorAll(".password-toggle");
  passwordToggles.forEach((toggle) => {
    toggle.addEventListener("click", handlePasswordToggle);
  });

  // Password strength checker
  const newPasswordInput = $("#new-password");
  if (newPasswordInput) {
    newPasswordInput.addEventListener("input", checkPasswordStrength);
    newPasswordInput.addEventListener("focus", () => {
      const strengthIndicator = $("#password-strength");
      if (strengthIndicator) {
        strengthIndicator.classList.add("show");
      }
    });
  }

  // Confirm password matching
  const confirmPasswordInput = $("#confirm-password");
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", checkPasswordMatch);
  }
}

// Handle password toggle (show/hide)
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

// Check password strength
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

  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push("ít nhất 8 ký tự");

  // Lowercase check
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("chữ thường");

  // Uppercase check
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("chữ hoa");

  // Number check
  if (/\d/.test(password)) score += 1;
  else feedback.push("số");

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else feedback.push("ký tự đặc biệt");

  // Update UI based on score
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

// Check password match
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

// Handle password form submission
function handlePasswordFormSubmit(event) {
  event.preventDefault();
  handlePasswordSaveClick(event);
}

// Handle password save button click
function handlePasswordSaveClick(event) {
  event.preventDefault();
  clearMessages();
  clearPasswordErrors();

  const saveBtn = $(".btn-save-password");
  const originalText = saveBtn.textContent;

  // Show loading state
  saveBtn.textContent = "🔄 Đang cập nhật...";
  saveBtn.disabled = true;

  const current = $("#current-password").value.trim();
  const newPass = $("#new-password").value.trim();
  const confirm = $("#confirm-password").value.trim();

  // Validate with enhanced checks
  if (!validatePasswordChange(current, newPass, confirm)) {
    // Reset button state
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
    return;
  }

  // Save with delay for better UX
  setTimeout(() => {
    savePasswordChange(current, newPass, confirm);

    // Reset form and button state
    $("#password-form").reset();
    $("#password-strength").classList.remove("show");
    $("#strength-fill").className = "strength-fill";
    $("#strength-text").textContent = "Độ mạnh mật khẩu";
    $("#strength-text").className = "strength-text";

    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
  }, 800);
}

// Enhanced password validation
function validatePasswordChange(current, newPass, confirm) {
  const currentUser = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
  );
  let isValid = true;

  // Clear previous errors
  clearPasswordErrors();

  if (!current) {
    showPasswordFieldError(
      "#current-password",
      "Vui lòng nhập mật khẩu hiện tại"
    );
    $("#current-password").focus();
    isValid = false;
  } else if (current !== currentUser.password) {
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

  if (!isValid) {
    showError("Vui lòng kiểm tra các trường có lỗi");
  }

  return isValid;
}

// Clear password-specific errors
function clearPasswordErrors() {
  const passwordInputs = [
    "#current-password",
    "#new-password",
    "#confirm-password",
  ];
  passwordInputs.forEach((inputId) => {
    clearPasswordFieldError(inputId);
  });
}

// Show password field error
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

// Clear password field error
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
    const currentUser = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    );

    if (!currentUser) {
      showError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    // Update password in users array
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
    const userIndex = users.findIndex((u) => u.id === currentUser.id);
    if (userIndex !== -1) {
      users[userIndex].password = newPass;
      users[userIndex].updated_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    // Update current user in localStorage
    const updatedUser = {
      ...currentUser,
      password: newPass,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(
      STORAGE_KEYS.CURRENT_USER,
      JSON.stringify(updatedUser)
    );

    showSuccess(
      "🎉 Cập nhật mật khẩu thành công! Tài khoản của bạn đã được bảo mật hơn."
    );

    // Auto hide success message after 4 seconds
    setTimeout(() => {
      clearMessages();
    }, 4000);

    console.log("✅ Password updated successfully");
  } catch (error) {
    console.error("Error updating password:", error);
    showError("Có lỗi xảy ra khi cập nhật mật khẩu. Vui lòng thử lại.");
  }
}

// Save profile to localStorage
function saveProfile(data) {
  try {
    const currentUser = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    );

    if (!currentUser) {
      showError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");

    // Update current user object with new data
    const updatedUser = {
      ...currentUser,
      ...data,
      updated_at: new Date().toISOString(),
    };

    // Update in users array
    const userIndex = users.findIndex(
      (u) => u.id === currentUser.id || u.username === currentUser.username
    );
    if (userIndex !== -1) {
      users[userIndex] = updatedUser;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } else {
      // If user not found in array, add them
      users.push(updatedUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    // Update current user in localStorage
    localStorage.setItem(
      STORAGE_KEYS.CURRENT_USER,
      JSON.stringify(updatedUser)
    );

    // Update sidebar display with full name if available, otherwise username
    $("#sidebar-username").textContent = updatedUser.username || "User";

    showSuccess("Cập nhật thông tin thành công!");

    // Auto hide success message after 3 seconds
    setTimeout(() => {
      clearMessages();
    }, 3000);
  } catch (error) {
    console.error("Error saving profile:", error);
    showError("Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.");
  }
}

// Update districts based on selected city

// Update cart badge
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || "[]");
  const badge = $("#cart-count");
  if (badge) {
    badge.textContent = cart.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
  }
}

// Utility functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  // Remove spaces and dashes for validation
  const cleanPhone = phone.replace(/[\s-]/g, "");
  // Vietnamese phone number format: 10 digits starting with 0
  const phoneRegex = /^0[3|5|7|8|9][0-9]{8}$/;
  return phoneRegex.test(cleanPhone);
}

// Format phone number for display
function formatPhoneDisplay(phone) {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(
      4,
      7
    )} ${cleaned.substring(7)}`;
  }
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
// ---- Tab switching (centralized) ----
function activateTab(tab) {
  // Xóa thông báo lỗi và thông báo khác khi chuyển tab để tránh nhầm lẫn
  clearFieldErrors();
  clearMessages();

  // 1) Xử lý nav-item (main menu)
  document.querySelectorAll(".nav-item").forEach((el) => {
    el.classList.remove("active");
  });

  // 2) Xử lý nav-subitem (sub menu)
  document.querySelectorAll(".nav-subitem").forEach((el) => {
    el.classList.toggle("active", el.dataset.tab === tab);
  });

  // 3) Đặt active cho nav-item tương ứng
  if (tab === "orders") {
    // Tab "orders" - active cho nav-item orders
    const ordersNav = document.querySelector(
      '.nav-item[data-section="orders"]'
    );
    if (ordersNav) ordersNav.classList.add("active");
  } else if (["personal", "address", "password"].includes(tab)) {
    // Các tab con của "profile" - active cho nav-item profile
    const profileNav = document.querySelector(
      '.nav-item[data-section="profile"]'
    );
    if (profileNav) profileNav.classList.add("active");
  }

  // 4) Ẩn/hiện các pane nội dung
  document.querySelectorAll(".content-tab").forEach((pane) => {
    pane.classList.toggle("active", pane.id === `${tab}-tab`);
  });

  // 5) Đóng modal Địa chỉ (nếu đang mở) khi chuyển tab
  const modal = document.getElementById("address-modal");
  if (modal) modal.style.display = "none";

  // 4) Load dữ liệu theo từng tab
  if (tab === "address") {
    loadAddresses();
  } else if (tab === "orders") {
    if (!window.ordersLoaded) {
      loadOrders().then(() => {
        window.ordersLoaded = true;
        // Store orders globally for filtering
        window.allOrders = window.allOrders || [];
      });
    }
  }

  // 5) Ghi hash để F5 vẫn đúng tab
  history.replaceState(null, "", `#${tab}`);
}

// Handle tab switching
function handleTabSwitch(event) {
  const targetTab = event.target.dataset.tab;
  if (!targetTab) return;
  activateTab(targetTab);
}

// ====== ADDRESS MANAGEMENT ======

// Address data structure and functions
let addresses = [];
let editingAddressId = null;

// Initialize user addresses from central storage if needed

// Load addresses from localStorage
function loadAddresses() {
  clearFieldErrors();
  clearMessages();
  const currentUser = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
  );
  if (!currentUser) return;

  const list = JSON.parse(localStorage.getItem(`addresses_1`) || "[]");
  const container = document.getElementById("address-list");
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = `<p class="muted">Chưa có địa chỉ nào. Hãy thêm địa chỉ mới.</p>`;
    return;
  }
  list.sort((a, b) => {
    return b.is_default - a.is_default;
  });
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
      ${`<button 
     class="btn outline" 
     data-id="${addr.id}" 
     data-action="set-default" 
     ${addr.is_default ? "disabled" : ""}
   >
     Đặt mặc định
   </button>`}

      <button class="btn outline" data-id="${
        addr.id
      }" data-action="edit">Sửa</button>
      <button class="btn danger" data-id="${addr.id}" data-action="delete"
      ${addr.is_default ? "style='visibility: hidden'" : ""}
      >Xóa</button>
    </div>
  `;
    container.appendChild(div);
    // Thêm event listeners cho các nút trong item này
    const deleteBtn = div.querySelector('button[data-action="delete"]');
    if (deleteBtn) {
      deleteBtn.addEventListener("click", function () {
        console.log(addr.id);
        deleteAddress(addr.id);
      });
    }

    const editBtn = div.querySelector('button[data-action="edit"]');
    if (editBtn) {
      editBtn.addEventListener("click", function () {
        const addresses = JSON.parse(
          localStorage.getItem(`addresses_1`) || "[]"
        );
        address_Index = addr.id;
        /*address_Index = addresses.find(
          (add) => String(addr.id) === String(addr.id)
        );*/
        editAddress(addr.id);
      });
    }

    const setDefaultBtn = div.querySelector(
      'button[data-action="set-default"]'
    );
    if (setDefaultBtn) {
      setDefaultBtn.addEventListener("click", function () {
        setDefaultAddress(addr.id);
      });
    }
  });
}

// Save addresses to localStorage
function saveAddresses() {
  try {
    const currentUser = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    );
    if (!currentUser) return;

    localStorage.setItem(
      `addresses_${currentUser.id}`,
      JSON.stringify(addresses)
    );
  } catch (error) {
    console.error("Error saving addresses:", error);
  }
}

// Show add address modal
function showAddAddressModal() {
  editingAddressId = null;

  // Clear any existing error messages
  clearAddressFormErrors();
  clearMessages(); // Xóa thông báo chung

  // Set modal title and reset form
  const modalTitle = $("#modal-title");
  const addressForm = $("#address-form");
  const addressModal = $("#address-modal");

  if (modalTitle) modalTitle.textContent = "Thêm địa chỉ mới";
  if (addressForm) addressForm.reset();

  // Show modal
  if (addressModal) {
    addressModal.style.display = "block";
    document.body.style.overflow = "hidden";

    // Focus first input
    const firstInput = $("#address-name");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  console.log("🏠 Opening add address modal");
}

// Show edit address modal

// Hide modal
function hideAddressModal() {
  $("#address-modal").style.display = "none";
  document.body.style.overflow = "auto";
  editingAddressId = null;

  // Reset modal title to normal without error message
  const modalTitle = $("#modal-title");
  if (modalTitle) {
    modalTitle.innerHTML = editingAddressId
      ? "Cập nhật địa chỉ"
      : "Thêm địa chỉ mới";
  }
}

// Set default address
function setDefaultAddress(addressId) {
  const addresses = JSON.parse(localStorage.getItem(`addresses_1`) || "[]");
  if (!addressId) {
    showError("Không tìm thấy địa chỉ để thiết lập mặc định!");
    return;
  }
  addresses.forEach((addr) => (addr.is_default = false));
  const address = addresses.find((a) => a.id === addressId);
  if (address) {
    address.is_default = true;
    localStorage.setItem(`addresses_1`, JSON.stringify(addresses));
    upLoadAllAddresses();
    // Tải lại danh sách địa chỉ
    loadAddresses();

    showSuccess("Đã thiết lập địa chỉ mặc định!");
  }
}

// Delete address
function deleteAddress(addressId) {
  const addresses = JSON.parse(localStorage.getItem(`addresses_1`) || "[]");

  if (!addressId) {
    showError("Không tìm thấy địa chỉ để xóa!");
    return;
  }

  // Prevent deleting if it's the only address
  if (addresses.length === 1) {
    if (
      !confirm("Đây là địa chỉ cuối cùng của bạn. Bạn có chắc chắn muốn xóa?")
    ) {
      return;
    }
  } else {
    if (!confirm(`Bạn có chắc chắn muốn xóa địa chỉ không?`)) {
      return;
    }
  }

  try {
    // Remove address
    const new_addresses = addresses.filter(
      (address) => String(address.id) != String(addressId)
    );
    console.log("mettt");
    // If deleted address was default and there are other addresses, set first one as default

    // Lưu danh sách địa chỉ cập nhật
    localStorage.setItem(`addresses_1`, JSON.stringify(new_addresses));
    upLoadAllAddresses();
    // Tải lại danh sách địa chỉ
    loadAddresses();

    showSuccess("Xóa địa chỉ thành công! 🗑️");

    console.log(
      `🗑️ Deleted address ${addressId}, remaining: ${addresses.length}`
    );
  } catch (error) {
    console.error("Error deleting address:", error);
    showError("Có lỗi xảy ra khi xóa địa chỉ!");
  }
}
function upLoadAllAddresses() {
  const currentUser = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
  );
  if (!currentUser) return;

  const allAddresses = JSON.parse(
    localStorage.getItem(`ALL_ADDRESSES`) || "[]"
  );
  if (!allAddresses) return;

  const filteredAllAddresses = allAddresses.filter(
    (address) => String(address.user_id) !== String(currentUser.id)
  );

  const addresses = JSON.parse(localStorage.getItem(`addresses_1`) || "[]");
  if (!addresses) return;

  filteredAllAddresses.push(...addresses);
  localStorage.setItem(`ALL_ADDRESSES`, JSON.stringify(filteredAllAddresses));
}

// Clear address form errors
function clearAddressFormErrors() {
  const errorElements = document.querySelectorAll(
    "#address-modal .address-field-error"
  );
  errorElements.forEach((el) => {
    el.textContent = "";
    el.style.display = "none";
  });

  const inputElements = document.querySelectorAll(
    "#address-modal input, #address-modal select"
  );
  inputElements.forEach((el) => el.classList.remove("error"));
}

// Show address field error
function showAddressFieldError(fieldId, message) {
  const field = $(fieldId);
  if (!field) return;

  // Add error class to input
  field.classList.add("error");

  // Look for an existing error element
  let errorDiv = field.parentNode.querySelector(".address-field-error");

  // If no error element exists yet, create one
  if (!errorDiv) {
    errorDiv = document.createElement("div");
    errorDiv.className = "address-field-error";
    field.parentNode.appendChild(errorDiv);
  }

  // Set error message and show it
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
}

// Handle address form submission
function handleAddressFormSubmit(event) {
  event.preventDefault();
  clearAddressFormErrors();
  clearMessages();

  const formData = new FormData(event.target);
  const addressData = {
    name: formData.get("name") ? formData.get("name").trim() : "",
    phone: formData.get("phone") ? formData.get("phone").trim() : "",
    city: formData.get("city") ? formData.get("city").trim() : "",
    district: formData.get("district") ? formData.get("district").trim() : "",
    street: formData.get("street") ? formData.get("street").trim() : "",
    ward: formData.get("ward") ? formData.get("ward").trim() : "",
    isDefault: formData.get("isDefault") === "on",
  };

  // Detailed validation
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
    // Focus the first field with an error
    if (firstErrorField) {
      $(firstErrorField).focus();
    }

    // Show a summary error at the top of the modal

    return;
  }

  // If setting as default, remove default from others

  try {
    const user_current = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    );
    const addresses = JSON.parse(localStorage.getItem(`addresses_1`) || "[]");
    if (addressData.isDefault == null) {
      addressData.isDefault = false;
    } else if (addressData.isDefault == true) {
      addresses.forEach(
        (add) => ((add.is_default = false), console.log(add.is_default))
      );
      addressData.is_default = true;
    }
    console.log(addressData.is_default);
    const address = {
      user_id: user_current.id, // Sử dụng user_id từ thông tin người dùng hiện tại
      receiver_name: addressData.name,
      phone: addressData.phone,
      province: addressData.city, // Sử dụng trực tiếp giá trị người dùng nhập vào
      district: addressData.district,
      address_line1: addressData.street,
      ward: addressData.ward,
      is_default: addressData.isDefault,
    };

    const ModalTitle = document.querySelector("#modal-title");
    if (ModalTitle) {
      console.log(ModalTitle.textContent);
      if (ModalTitle.textContent == "Thêm địa chỉ mới") {
        // Lấy danh sách địa chỉ hiện tại

        if (addresses) {
          console.log("okeeee");
          console.log(addresses);
          addresses.push({
            id: Date.now(),
            ...address,
          });
        }
      } else if (ModalTitle.textContent == "Cập nhật địa chỉ") {
        // Tìm và cập nhật địa chỉ trong danh sách
        console.log(address_Index);
        const index = addresses.findIndex(
          (addr) => String(addr.id) === String(address_Index)
        );
        addresses[index].receiver_name = address.receiver_name;
        addresses[index].phone = address.phone;
        addresses[index].province = address.province;
        addresses[index].district = address.district;
        addresses[index].address_line1 = address.address_line1;
        addresses[index].ward = address.ward;
        addresses[index].is_default = address.is_default;
      }
    }
    localStorage.setItem(`addresses_1`, JSON.stringify(addresses));

    // Đồng bộ với danh sách tất cả địa chỉ
    upLoadAllAddresses();

    // Tải lại danh sách địa chỉ
    loadAddresses();
    // Reset modal title to normal
    const modalTitle = $("#modal-title");
    if (modalTitle) {
      modalTitle.innerHTML = editingAddressId
        ? "Cập nhật địa chỉ"
        : "Thêm địa chỉ mới";
    }

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

// Update districts when city changes

// ============= ORDERS MANAGEMENT =============

// Load and display orders
async function loadOrders() {
  try {
    console.log("🔄 Loading orders from localStorage...");

    // Lấy orders và order_details của user hiện tại từ localStorage (đã được load từ login.js)
    const userOrders = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ORDERS_USER) || "[]"
    );
    const userOrderDetails = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ORDERS_DETAILS_USER) || "[]"
    );

    console.log(
      `📦 Found ${userOrders.length} orders, ${userOrderDetails.length} order details`
    );

    if (userOrders.length === 0) {
      console.log("📭 No orders found for current user");
      window.allOrders = [];
      renderOrders([]);
      return;
    }

    // Load books data để lấy thông tin sách
    const booksResponse = await fetch("./json/books.json");
    const books = await booksResponse.json();

    // Gom nhóm items theo order_id và book_id (giống logic cart)
    const ordersWithDetails = userOrders.map((order) => {
      const orderDetails = userOrderDetails.filter(
        (detail) => detail.order_id === order.id
      );

      // Group items by book_id và tổng hợp quantity
      const groupedItems = {};
      orderDetails.forEach((detail) => {
        const bookId = detail.book_id;
        if (groupedItems[bookId]) {
          groupedItems[bookId].quantity += detail.quantity;
          // Combine notes nếu có
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

      return {
        ...order,
        items: Object.values(groupedItems),
      };
    });

    console.log("✅ Orders loaded successfully:", ordersWithDetails);

    // Store globally for filtering
    window.allOrders = ordersWithDetails;

    // Render orders
    renderOrders(ordersWithDetails);
  } catch (error) {
    console.error("❌ Error loading orders:", error);
    showError("Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.");
    window.allOrders = [];
    renderOrders([]);
  }
}

// Các hàm hỗ trợ lấy dữ liệu orders từ localStorage (tương tự login.js)
function getCurrentUserOrders() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS_USER) || "[]");
}

function getCurrentUserOrderDetails() {
  return JSON.parse(
    localStorage.getItem(STORAGE_KEYS.ORDERS_DETAILS_USER) || "[]"
  );
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

// Render orders list
function renderOrders(orders, statusFilter = "all") {
  const ordersList = $("#orders-list");
  const ordersEmpty = $("#orders-empty");

  // Filter orders by status
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

// Get status text in Vietnamese
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

// Get order actions based on status
function getOrderActions(order) {
  const actions = [];

  switch (order.status) {
    case "pending":
      actions.push(
        `<button class="order-btn" onclick="cancelOrder(${order.id})">Hủy đơn</button>`
      );
      break;
    case "delivered":
      actions.push(
        `<button class="order-btn primary" onclick="reorderItems(${order.id})">Mua lại</button>`
      );
      break;
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

// Format date
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

// Format price
function formatPrice(price) {
  return Number(price).toLocaleString("vi-VN");
}

// Setup order status filter
function setupOrderStatusFilter() {
  const statusBtns = $$(".status-btn");
  let currentOrders = [];

  // Load orders when orders tab is first activated
  if (!window.ordersLoaded) {
    loadOrders().then(() => {
      window.ordersLoaded = true;
    });
  }

  statusBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Remove active class from all buttons
      statusBtns.forEach((b) => b.classList.remove("active"));
      // Add active class to clicked button
      this.classList.add("active");

      // Get status filter
      const status = this.getAttribute("data-status");

      // Re-render orders with filter
      if (window.allOrders) {
        renderOrders(window.allOrders, status);
      }
    });
  });
}

// Order action functions
function cancelOrder(orderId) {
  if (confirm("Bạn có chắc muốn hủy đơn hàng này?")) {
    // Here you would typically make an API call to cancel the order
    showSuccess("Đã hủy đơn hàng thành công");
    loadOrders(); // Reload orders
  }
}

function reorderItems(orderId) {
  // Add all items from this order to cart using localStorage data
  try {
    const userOrders = getCurrentUserOrders();
    const orderDetails = getOrderDetailsByOrderId(orderId);

    if (orderDetails.length === 0) {
      showError("Không tìm thấy chi tiết đơn hàng");
      return;
    }

    const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || "[]");

    orderDetails.forEach((detail) => {
      const existingItem = cart.find(
        (c) => String(c.bookId) === String(detail.book_id)
      );
      if (existingItem) {
        existingItem.quantity += detail.quantity;
      } else {
        cart.push({
          bookId: detail.book_id,
          quantity: detail.quantity,
          selected: true,
        });
      }
    });

    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    updateCartBadge();
    showSuccess("Đã thêm lại các sản phẩm vào giỏ hàng");
  } catch (error) {
    console.error("Error reordering items:", error);
    showError("Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng");
  }
}

function viewOrderDetails(orderId) {
  try {
    // Lấy thông tin đơn hàng và chi tiết từ localStorage
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

    // Tạo modal hiển thị chi tiết đơn hàng
    showOrderDetailsModal(order, orderDetails);
  } catch (error) {
    console.error("Error viewing order details:", error);
    showError("Có lỗi xảy ra khi xem chi tiết đơn hàng");
  }
}

// Hiển thị modal chi tiết đơn hàng
async function showOrderDetailsModal(order, orderDetails) {
  try {
    // Load books data để lấy thông tin sách
    const booksResponse = await fetch("./json/books.json");
    const books = await booksResponse.json();

    // Tạo HTML cho modal
    const modalHTML = `
      <div id="order-details-modal" class="modal-overlay" style="display: block;">
        <div class="modal-content order-details-modal">
          <div class="modal-header">
            <h2>Chi tiết đơn hàng #${order.id}</h2>
            <button id="close-order-details" class="modal-close">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="order-info-section">
              <div class="info-row">
                <span class="label">Trạng thái:</span>
                <span class="value order-status ${
                  order.status
                }">${getStatusText(order.status)}</span>
              </div>
              <div class="info-row">
                <span class="label">Ngày đặt:</span>
                <span class="value">${formatDate(order.created_at)}</span>
              </div>
              <div class="info-row">
                <span class="label">Phương thức thanh toán:</span>
                <span class="value">${order.payment_method.toUpperCase()}</span>
              </div>
              <div class="info-row">
                <span class="label">Tổng tiền:</span>
                <span class="value total-amount">${formatPrice(
                  order.total_amount
                )}đ</span>
              </div>
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
                        }" 
                             alt="${book?.title || "Sách không tìm thấy"}" 
                             loading="lazy">
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
                    </div>
                  `;
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
      </div>
    `;

    // Thêm modal vào DOM
    const existingModal = document.getElementById("order-details-modal");
    if (existingModal) {
      existingModal.remove();
    }

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    document.body.style.overflow = "hidden";

    // Thêm event listener cho nút đóng
    document
      .getElementById("close-order-details")
      .addEventListener("click", closeOrderDetailsModal);

    // Đóng modal khi click outside
    document
      .getElementById("order-details-modal")
      .addEventListener("click", (e) => {
        if (e.target.id === "order-details-modal") {
          closeOrderDetailsModal();
        }
      });

    console.log(
      `📋 Hiển thị chi tiết đơn hàng #${order.id} với ${orderDetails.length} sản phẩm`
    );
  } catch (error) {
    console.error("Error showing order details modal:", error);
    showError("Không thể tải chi tiết đơn hàng");
  }
}

// Đóng modal chi tiết đơn hàng
function closeOrderDetailsModal() {
  const modal = document.getElementById("order-details-modal");
  if (modal) {
    modal.remove();
    document.body.style.overflow = "auto";
  }
}

// Add orders tab to navigation
function setupOrdersNavigation() {
  // Update the setupEventListeners function to include orders tab
  const orderNavItem = $('.nav-item[data-section="orders"]');
  if (orderNavItem) {
    orderNavItem.addEventListener("click", function () {
      activateTab("orders");
      setupOrderStatusFilter();
    });
  }
}

// Handle logout functionality
function handleLogout() {
  // Hiển thị confirmation dialog
  const confirmLogout = confirm("Bạn có chắc chắn muốn đăng xuất không?");

  if (confirmLogout) {
    try {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("order_details_user");
      localStorage.removeItem("cart_user1");
      localStorage.removeItem("orders_user");
      localStorage.removeItem("addresses_1");

      console.log("✅ User logged out successfully");

      // Chuyển hướng về trang chủ
      window.location.href = "index.html";
    } catch (error) {
      console.error("❌ Error during logout:", error);
      alert("Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại!");
    }
  }
}
