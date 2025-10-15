// Constants
const STORAGE_KEYS = {
  CURRENT_USER: "currentUser",
  CHECKOUT_ITEMS: "checkout_items",
  CART: "cart_user1",
  BOOKS: "BOOKS",
  ADDRESSES: "addresses_1", // Địa chỉ của user hiện tại
  ALL_ADDRESSES: "ALL_ADDRESSES",
};

// Helper functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const fmt = (n) => (n || 0).toLocaleString("vi-VN") + "đ";

// Global variables
let checkoutItems = [];
let selectedAddress = null;
let selectedPayment = null;

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  loadCheckoutData();
  setupEventListeners();
  updateCartBadge();
  updateAccountUI();
});

// Load checkout data
function loadCheckoutData() {
  try {
    // Lấy current user
    const currentUser = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || "null"
    );
    if (!currentUser) {
      alert("Vui lòng đăng nhập để tiếp tục!");
      window.location.href = "login.html";
      return;
    }

    // Lấy checkout items
    checkoutItems = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CHECKOUT_ITEMS) || "[]"
    );
    if (checkoutItems.length === 0) {
      alert("Không có sản phẩm nào được chọn!");
      window.location.href = "cart.html";
      return;
    }

    // Lấy books data
    const books = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKS) || "[]");
    if (books.length === 0) {
      loadBooksFromFile();
    }

    renderOrderItems();
    loadAddresses();
    updateOrderSummary();

    console.log("✅ Checkout data loaded successfully");
  } catch (error) {
    console.error("❌ Error loading checkout data:", error);
    alert("Có lỗi xảy ra khi tải dữ liệu!");
    window.location.href = "cart.html";
  }
}

// Load books from JSON file if not in localStorage
async function loadBooksFromFile() {
  try {
    const response = await fetch("./json/books.json");
    const books = await response.json();
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    renderOrderItems(); // Re-render sau khi load books
  } catch (error) {
    console.error("Error loading books:", error);
  }
}

// Render order items
function renderOrderItems() {
  const container = $("#order-items");
  const books = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKS) || "[]");

  container.innerHTML = checkoutItems
    .map((item) => {
      const book = books.find((b) => String(b.id) === String(item.bookId));
      if (!book) return "";

      const subtotal = book.price * (item.quantity || 1);

      return `
      <div class="order-item">
        <div class="item-image">
          <img src="${book.image_url}" alt="${book.title}" loading="lazy">
        </div>
        <div class="item-info">
          <div class="item-title">${book.title}</div>
          <div class="item-price">${fmt(book.price)}</div>
          <span class="item-quantity">x${item.quantity || 1}</span>
        </div>
        <div class="item-subtotal">${fmt(subtotal)}</div>
      </div>
    `;
    })
    .join("");
}

// Load and render addresses
function loadAddresses() {
  console.log("🏠 Loading addresses from localStorage...");
  const container = $("#address-list");

  // Debug: Check current user
  const currentUser = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || "null"
  );
  console.log("👤 Current user:", currentUser);

  // Try both possible keys for addresses
  let addresses = JSON.parse(localStorage.getItem("addresses_1") || "[]");
  if (addresses.length === 0) {
    // Fallback to user-specific key
    addresses = JSON.parse(
      localStorage.getItem(`addresses_${currentUser?.id}`) || "[]"
    );
  }

  console.log("📍 Found addresses:", addresses);

  if (addresses.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #666;">
        <p>Chưa có địa chỉ giao hàng nào.</p>
        <p>Vui lòng thêm địa chỉ mới để tiếp tục.</p>
      </div>
    `;
    return;
  }

  // Sắp xếp địa chỉ mặc định lên đầu
  addresses.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));

  container.innerHTML = addresses
    .map(
      (address) => `
    <div class="address-option" data-address-id="${address.id}">
      <input type="radio" name="address" value="${address.id}" ${
        address.is_default ? "checked" : ""
      }>
      <div class="address-info">
        <div class="address-name">
          ${address.receiver_name}
          ${
            address.is_default
              ? '<span class="address-default">Mặc định</span>'
              : ""
          }
        </div>
        <div class="address-phone">${address.phone}</div>
        <div class="address-text">
          ${address.address_line1}, ${address.ward}, ${address.district}, ${
        address.province
      }
        </div>
      </div>
    </div>
  `
    )
    .join("");

  // Tự động chọn địa chỉ mặc định
  const defaultAddress = addresses.find((addr) => addr.is_default);
  if (defaultAddress) {
    selectedAddress = defaultAddress.id;
    updatePlaceOrderButton();
  }
}

// Setup event listeners
function setupEventListeners() {
  // Address selection
  $("#address-list").addEventListener("click", function (e) {
    const addressOption = e.target.closest(".address-option");
    if (addressOption) {
      // Update radio button
      const radio = addressOption.querySelector("input[type='radio']");
      radio.checked = true;

      // Update selected address
      selectedAddress = parseInt(addressOption.dataset.addressId);

      // Update visual selection
      $$(".address-option").forEach((option) =>
        option.classList.remove("selected")
      );
      addressOption.classList.add("selected");

      updatePlaceOrderButton();
    }
  });

  // Payment method selection
  $$(".payment-method").forEach((method) => {
    method.addEventListener("click", function () {
      const radio = this.querySelector("input[type='radio']");
      radio.checked = true;

      selectedPayment = radio.value;

      // Update visual selection
      $$(".payment-method").forEach((m) => m.classList.remove("selected"));
      this.classList.add("selected");

      // Show/hide QR section
      const qrSection = $("#qr-section");
      if (selectedPayment === "qr") {
        qrSection.classList.add("show");
        updateQRInfo();
      } else {
        qrSection.classList.remove("show");
      }

      updatePlaceOrderButton();
    });
  });

  // Add address button
  $("#add-address-btn").addEventListener("click", showAddressModal);

  // Address modal
  setupAddressModal();

  // Place order button
  $("#place-order-btn").addEventListener("click", placeOrder);
}

// Update QR payment info
function updateQRInfo() {
  const totalAmount = calculateTotal();
  const orderId = generateOrderId();

  $("#transfer-amount").textContent = fmt(totalAmount);
  $("#transfer-content").textContent = `THANHTOAN ${orderId}`;
}

// Setup address modal
function setupAddressModal() {
  const modal = $("#address-modal");
  const closeButtons = $$(".modal-close");
  const form = $("#address-form");

  // Close modal
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", hideAddressModal);
  });

  // Close on overlay click
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      hideAddressModal();
    }
  });

  // Form submission
  form.addEventListener("submit", handleAddressSubmit);
}

// Show address modal
function showAddressModal() {
  const modal = $("#address-modal");

  // Clear any previous data and errors
  $("#address-form").reset();
  clearFormErrors();

  // Show modal with animation
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";

  // Trigger animation by adding opacity after display
  requestAnimationFrame(() => {
    modal.style.opacity = "1";
  });

  // Focus first input after animation
  setTimeout(() => {
    const firstInput = $("#receiver-name");
    if (firstInput) {
      firstInput.focus();
    }
  }, 150);
}

// Hide address modal
function hideAddressModal() {
  const modal = $("#address-modal");

  // Start fade out animation
  modal.style.opacity = "0";

  // Hide modal after animation completes
  setTimeout(() => {
    modal.style.display = "none";
    document.body.style.overflow = "auto";

    // Reset form after hiding
    $("#address-form").reset();
    clearFormErrors();
  }, 300);
}

// Handle address form submission
function handleAddressSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const addressData = {
    receiver_name: formData.get("receiver-name").trim(),
    phone: formData.get("receiver-phone").trim(),
    province: formData.get("province").trim(),
    district: formData.get("district").trim(),
    ward: formData.get("ward").trim(),
    address_line1: formData.get("address-detail").trim(),
    is_default: formData.get("set-default") === "on",
  };

  // Validate form
  if (!validateAddressForm(addressData)) {
    return;
  }

  // Save address
  try {
    const currentUser = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    );

    console.log("💾 Saving address for user:", currentUser);

    // Load existing addresses using the correct key
    let addresses = JSON.parse(localStorage.getItem("addresses_1") || "[]");
    if (addresses.length === 0) {
      // Fallback to user-specific key
      addresses = JSON.parse(localStorage.getItem(`addresses_1`) || "[]");
    }

    console.log("📍 Existing addresses:", addresses);

    // If setting as default, remove default from others
    if (addressData.is_default) {
      addresses.forEach((addr) => (addr.is_default = false));
    } else if (addresses.length === 0) {
      // First address is automatically default
      addressData.is_default = true;
    }

    // Add new address
    const newAddress = {
      id: Date.now(),
      user_id: currentUser.id,
      ...addressData,
    };

    addresses.push(newAddress);
    console.log("💾 Saving addresses to localStorage:", addresses);

    // Save to both possible keys for compatibility
    localStorage.setItem("addresses_1", JSON.stringify(addresses));

    // Sync with all addresses
    syncWithAllAddresses(addresses, currentUser.id);

    // Reload addresses and close modal
    loadAddresses();
    hideAddressModal();

    // Auto select the new address
    /*selectedAddress = newAddress.id;
    setTimeout(() => {
      const newAddressOption = $(
        `.address-option[data-address-id="${newAddress.id}"]`
      );
      if (newAddressOption) {
        newAddressOption.click();
      }
    }, 100);*/

    console.log("✅ Address saved successfully");
  } catch (error) {
    console.error("❌ Error saving address:", error);
    alert("Có lỗi xảy ra khi lưu địa chỉ!");
  }
}

// Validate address form
function validateAddressForm(data) {
  clearFormErrors();
  let isValid = true;

  if (!data.receiver_name || data.receiver_name.length < 2) {
    showFieldError("receiver-name", "Tên người nhận phải có ít nhất 2 ký tự");
    isValid = false;
  }

  if (!data.phone || !isValidPhone(data.phone)) {
    showFieldError("receiver-phone", "Số điện thoại không hợp lệ");
    isValid = false;
  }

  if (!data.province) {
    showFieldError("province", "Vui lòng nhập tỉnh/thành phố");
    isValid = false;
  }

  if (!data.district) {
    showFieldError("district", "Vui lòng nhập quận/huyện");
    isValid = false;
  }

  if (!data.ward) {
    showFieldError("ward", "Vui lòng nhập phường/xã");
    isValid = false;
  }

  if (!data.address_line1 || data.address_line1.length < 5) {
    showFieldError("address-detail", "Địa chỉ cụ thể phải có ít nhất 5 ký tự");
    isValid = false;
  }

  return isValid;
}

// Show field error
function showFieldError(fieldId, message) {
  const field = $("#" + fieldId);
  const errorMsg = field.parentNode.querySelector(".error-message");

  if (field && errorMsg) {
    field.classList.add("error");
    errorMsg.textContent = message;
    // Smooth error display using CSS transition
  }
}

// Clear form errors
function clearFormErrors() {
  $$(".error").forEach((field) => field.classList.remove("error"));
  $$(".error-message").forEach((msg) => {
    msg.textContent = "";
    // CSS transition will handle the fade out
  });
}

// Validate phone number
function isValidPhone(phone) {
  const cleanPhone = phone.replace(/[\s-]/g, "");
  const phoneRegex = /^0[3|5|7|8|9][0-9]{8}$/;
  return phoneRegex.test(cleanPhone);
}

// Sync with all addresses storage
function syncWithAllAddresses(userAddresses, userId) {
  try {
    const allAddresses = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ALL_ADDRESSES) || "[]"
    );

    // Remove old addresses for this user
    const filteredAddresses = allAddresses.filter(
      (addr) => addr.user_id !== userId
    );

    // Add current user addresses
    filteredAddresses.push(...userAddresses);

    localStorage.setItem(
      STORAGE_KEYS.ALL_ADDRESSES,
      JSON.stringify(filteredAddresses)
    );
  } catch (error) {
    console.error("Error syncing addresses:", error);
  }
}

// Calculate total
function calculateTotal() {
  const books = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKS) || "[]");
  const subtotal = checkoutItems.reduce((sum, item) => {
    const book = books.find((b) => String(b.id) === String(item.bookId));
    if (book) {
      return sum + book.price * (item.quantity || 1);
    }
    return sum;
  }, 0);

  return subtotal;
}

// Update order summary
function updateOrderSummary() {
  const books = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKS) || "[]");
  const subtotal = checkoutItems.reduce((sum, item) => {
    const book = books.find((b) => String(b.id) === String(item.bookId));
    if (book) {
      return sum + book.price * (item.quantity || 1);
    }
    return sum;
  }, 0);

  const total = subtotal;

  $("#subtotal").textContent = fmt(subtotal);
  $("#total-amount").textContent = fmt(total);
}

// Update place order button
function updatePlaceOrderButton() {
  const btn = $("#place-order-btn");
  const hasAddress = selectedAddress !== null;
  const hasPayment = selectedPayment !== null;

  if (hasAddress && hasPayment) {
    btn.disabled = false;
    btn.textContent = "Đặt hàng";
  } else {
    btn.disabled = true;
    if (!hasAddress) {
      btn.textContent = "Vui lòng chọn địa chỉ giao hàng";
    } else if (!hasPayment) {
      btn.textContent = "Vui lòng chọn phương thức thanh toán";
    }
  }
}

// Generate order ID
function generateOrderId() {
  return Date.now().toString().slice(-8);
}

// Place order
async function placeOrder() {
  if (!selectedAddress || !selectedPayment) {
    alert("Vui lòng chọn địa chỉ giao hàng và phương thức thanh toán!");
    return;
  }

  const btn = $("#place-order-btn");
  btn.disabled = true;
  btn.textContent = "Đang xử lý...";

  try {
    // Tạo đơn hàng
    const orderId = generateOrderId();
    const currentUser = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    );
    const totalAmount = calculateTotal();

    const order = {
      id: parseInt(orderId) || orderId,
      user_id: currentUser.id,
      address_id: selectedAddress,
      payment_method: selectedPayment,
      total_amount: totalAmount,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Tạo order details
    const books = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKS) || "[]");
    const orderDetails = checkoutItems.map((item) => {
      const book = books.find((b) => String(b.id) === String(item.bookId));
      return {
        id: Date.now().toString().slice(-8),
        order_id: parseInt(orderId) || orderId,
        // order_id: orderId,
        book_id: parseInt(item.bookId) || item.bookId, // Đảm bảo book_id không có dấu ngoặc kép thừa
        quantity: item.quantity || 1,
        price: book ? book.price : 0,
        note: item.note || null,
      };
    });

    // Lưu vào localStorage
    await saveOrderToStorage(order, orderDetails);

    // Xóa items đã checkout khỏi giỏ hàng
    removeCheckoutItemsFromCart();

    // Chuyển đến trang xác nhận
    localStorage.setItem(
      "order_success",
      JSON.stringify({
        orderId: orderId,
        paymentMethod: selectedPayment,
        totalAmount: totalAmount,
      })
    );

    window.location.href = "order-success.html";
  } catch (error) {
    console.error("❌ Error placing order:", error);
    alert("Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!");

    btn.disabled = false;
    btn.textContent = "Đặt hàng";
  }
}

// Save order to storage
async function saveOrderToStorage(order, orderDetails) {
  try {
    // Load existing orders
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    const allOrderDetails = JSON.parse(
      localStorage.getItem("order_details") || "[]"
    );

    // Add new order
    orders.push(order);
    allOrderDetails.push(...orderDetails);

    // Save back to localStorage
    localStorage.setItem("orders", JSON.stringify(orders));
    localStorage.setItem("order_details", JSON.stringify(allOrderDetails));

    // Update user-specific orders in localStorage
    updateUserOrders(order, orderDetails);

    console.log("✅ Order saved successfully:", order.id);
  } catch (error) {
    console.error("❌ Error saving order:", error);
    throw error;
  }
}

// Update user-specific orders
function updateUserOrders(order, orderDetails) {
  try {
    const currentUser = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    );

    // Update user orders
    const userOrders = JSON.parse(localStorage.getItem("orders_user") || "[]");
    userOrders.push(order);
    localStorage.setItem("orders_user", JSON.stringify(userOrders));

    // Update user order details
    const userOrderDetails = JSON.parse(
      localStorage.getItem("order_details_user") || "[]"
    );
    userOrderDetails.push(...orderDetails);
    localStorage.setItem(
      "order_details_user",
      JSON.stringify(userOrderDetails)
    );
  } catch (error) {
    console.error("Error updating user orders:", error);
  }
}

// Remove checkout items from cart
function removeCheckoutItemsFromCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || "[]");
    // Đảm bảo so sánh đúng bookId không có dấu ngoặc kép thừa
    const checkoutBookIds = checkoutItems.map(
      (item) => parseInt(item.bookId) || item.bookId
    );

    // Remove checkout items from cart
    const updatedCart = cart.filter(
      (item) => !checkoutBookIds.includes(parseInt(item.bookId) || item.bookId)
    );

    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(updatedCart));

    // Clear checkout items
    localStorage.removeItem(STORAGE_KEYS.CHECKOUT_ITEMS);

    console.log("✅ Checkout items removed from cart");
  } catch (error) {
    console.error("Error removing items from cart:", error);
  }
}

// Update cart badge
function updateCartBadge() {
  try {
    const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || "[]");
    const badge = $("#cart-count");
    if (badge) {
      badge.textContent = cart.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
    }
  } catch (error) {
    console.error("Error updating cart badge:", error);
  }
}

// Update account UI in header
function updateAccountUI() {
  const currentUser = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || "null"
  );
  const accountBtn = $("#account-btn");
  const accountName = $("#account-name");

  if (currentUser && accountBtn && accountName) {
    // Nếu đã đăng nhập, hiển thị tên user
    accountName.textContent =
      currentUser.full_name || currentUser.username || "Tài khoản";
    accountBtn.href = "profile.html";
    accountBtn.title = "Xem thông tin tài khoản";
  } else if (accountBtn && accountName) {
    // Nếu chưa đăng nhập, chuyển đến trang login
    accountName.textContent = "Đăng nhập";
    accountBtn.href = "login.html";
    accountBtn.title = "Đăng nhập vào tài khoản";
  }
}
