// Constants
const LS_KEY = "cart_user1";
const STORAGE_KEYS = {
  CURRENT_USER: "currentUser",
  CHECKOUT_ITEMS: "checkout_items",
  CART: "cart_user1",
  BOOKS: "BOOKS",
  ADDRESSES: "addresses_1", // Địa chỉ của user hiện tại
  ALL_ADDRESSES: "ALL_ADDRESSES",
};
// Helpers
const fmt = (n) => (n || 0).toLocaleString("vi-VN") + " đ";
const $ = (s) => document.querySelector(s);

// Storage
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveCart(items) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

// Elements
const listEl = $("#cart-list");
const emptyEl = $("#empty");
const selectAllEl = $("#select-all");

// Giả sử bạn đã có biến BOOKS là mảng danh sách sách
const BOOKS = JSON.parse(localStorage.getItem("BOOKS") || "[]");

function render() {
  const items = loadCart();
  $("#cart-count-text").textContent = `(${items.length} sản phẩm)`;
  $("#select-all-count").textContent = items.length.toString();
  updateCartUI();

  listEl.innerHTML = "";
  if (items.length === 0) {
    emptyEl.style.display = "";
    compute();
    return;
  }
  emptyEl.style.display = "none";

  items.forEach((it) => {
    // Tham chiếu tới books để lấy thông tin sách
    const book = BOOKS.find((b) => String(b.id) === String(it.bookId));
    const title = book ? book.title : "Không tìm thấy sách";
    const image_url = book ? book.image_url : "";
    const price = book ? book.price : 0;

    const row = document.createElement("div");
    row.className = "cart-item";
    row.dataset.id = it.bookId;

    row.innerHTML = `
      <div class="check"><input type="checkbox" class="sel" ${
        it.selected !== false ? "checked" : ""
      }></div>
      <div class="thumb">
        <img src="${image_url}" alt="${title}">
        <div>
          <div class="name">${title}</div>
          <div class="muted">${price} đ</div>
        </div>
      </div>
      <div class="right">
        <div class="qty">
          <button class="dec">−</button>
          <input class="q" type="number" min="1" value="${Math.max(
            1,
            it.quantity || 1
          )}">
          <button class="inc">+</button>
        </div>
      </div>
      <div class="right"><span class="price-red line-total">${fmt(
        price * (it.quantity || 1)
      )}</span></div>
      <div class="remove"><button class="rm" title="Xóa">🗑️</button></div>
    `;
    listEl.appendChild(row);
  });

  // trạng thái "chọn tất cả"
  selectAllEl.checked =
    items.length > 0 && items.every((x) => x.selected !== false);
  updateSubTotal();
  compute();
}

// Delegation (đăng ký một lần)
listEl.addEventListener("click", onListClick);
listEl.addEventListener("input", onListInput);
selectAllEl.addEventListener("change", onSelectAll);

function onListClick(e) {
  const row = e.target.closest(".cart-item");
  if (!row) return;
  const id = row.dataset.id;
  const items = loadCart();
  const i = items.findIndex((x) => String(x.bookId) === String(id));
  if (i < 0) return;

  if (e.target.classList.contains("inc"))
    items[i].quantity = (items[i].quantity || 1) + 1;
  if (e.target.classList.contains("dec"))
    items[i].quantity = Math.max(1, (items[i].quantity || 1) - 1);
  if (e.target.classList.contains("rm")) items.splice(i, 1);
  if (e.target.classList.contains("sel")) items[i].selected = e.target.checked;

  saveCart(items);
  updateCartUI();
  updateSubTotal();
  compute();
  e.target.classList.contains("rm") ? render() : updateRow(row, items[i]);
}

function onListInput(e) {
  if (!e.target.classList.contains("q")) return;
  const row = e.target.closest(".cart-item");
  const id = row.dataset.id;
  const items = loadCart();
  const i = items.findIndex((x) => String(x.bookId) === String(id));

  if (i < 0) return;
  items[i].quantity = Math.max(1, parseInt(e.target.value || "1", 10));
  saveCart(items);
  updateCartUI();
  updateSubTotal();
  compute();
  updateRow(row, items[i]);
}

function onSelectAll() {
  let items = loadCart().map((x) => ({ ...x, selected: selectAllEl.checked }));

  saveCart(items);
  render();
  updateSubTotal();
}
function updateCartUI() {
  const items = loadCart();
  $("#cart-count").textContent = items.reduce(
    (s, i) => s + (i.quantity || 0),
    0
  );
}
function updateSubTotal() {
  $("#sub-total").textContent = fmt(subTotal());
}
function subTotal() {
  // Lấy các sản phẩm đã chọn
  const items = loadCart().filter((x) => x.selected !== false);
  // Tính tổng tiền các sản phẩm đã chọn
  return items.reduce((sum, it) => {
    const book = BOOKS.find((b) => String(b.id) === String(it.bookId));
    const price = book ? book.price : 0;
    return sum + price * (it.quantity || 1);
  }, 0);
}
function updateRow(row, it) {
  if (!row || !it) return;
  // Lấy lại thông tin sách
  const book = BOOKS.find((b) => String(b.id) === String(it.bookId));

  const price = book ? book.price : 0;
  row.querySelector(".q").value = it.quantity;
  row.querySelector(".line-total").textContent = fmt(
    price * (it.quantity || 1)
  );
  const sel = row.querySelector(".sel");
  if (sel) sel.checked = it.selected !== false;
}

// Totals + Promo
function compute() {
  const items = loadCart().filter((x) => x.selected !== false);
  const checkoutBtn = $("#checkout");

  if (items.length === 0) {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "THANH TOÁN";
  } else {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = `THANH TOÁN (${items.length} sản phẩm)`;
  }
}
const checkoutBtn = document.getElementById("checkout");
const overlay = document.getElementById("panel-overlay");
const closeBtn = document.getElementById("close-panel");

// Mở panel

// Checkout button click

// Cập nhật hiển thị tài khoản trong header
function updateAccountUI() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const accountBtn = document.getElementById("account-btn");
  const accountName = document.getElementById("account-name");

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
// =======================
// cart.js (merged checkout)
// =======================

// ---------- Constants ----------

// ---------- Helpers ----------

const $$ = (s) => document.querySelectorAll(s);

// ---------- Cart Storage ----------
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || "[]");
  } catch {
    return [];
  }
}
function saveCart(items) {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items));
}

// ---------- Global (checkout) ----------
let checkoutItems = [];
let selectedAddress = null;
let selectedPayment = null;

// ---------- Elements ----------

// =======================
// Cart rendering & events
// =======================
function render() {
  const items = loadCart();
  $("#cart-count-text").textContent = `(${items.length} sản phẩm)`;
  $("#select-all-count").textContent = items.length.toString();
  updateCartUI();

  listEl.innerHTML = "";
  if (items.length === 0) {
    emptyEl.style.display = "";
    compute();
    return;
  }
  emptyEl.style.display = "none";

  items.forEach((it) => {
    const book = BOOKS.find((b) => String(b.id) === String(it.bookId));
    const title = book ? book.title : "Không tìm thấy sách";
    const image_url = book ? book.image_url : "";
    const price = book ? book.price : 0;

    const row = document.createElement("div");
    row.className = "cart-item";
    row.dataset.id = it.bookId;

    row.innerHTML = `
      <div class="check"><input type="checkbox" class="sel" ${
        it.selected !== false ? "checked" : ""
      }></div>
      <div class="thumb">
        <img src="${image_url}" alt="${title}">
        <div>
          <div class="name">${title}</div>
          <div class="muted">${fmt(price)}</div>
        </div>
      </div>
      <div class="right">
        <div class="qty">
          <button class="dec">−</button>
          <input class="q" type="number" min="1" value="${Math.max(
            1,
            it.quantity || 1
          )}">
          <button class="inc">+</button>
        </div>
      </div>
      <div class="right"><span class="price-red line-total">${fmt(
        price * (it.quantity || 1)
      )}</span></div>
      <div class="remove"><button class="rm" title="Xóa">🗑️</button></div>
    `;
    listEl.appendChild(row);
  });

  // trạng thái "chọn tất cả"
  selectAllEl.checked =
    items.length > 0 && items.every((x) => x.selected !== false);
  updateSubTotal();
  compute();
}

listEl.addEventListener("click", onListClick);
listEl.addEventListener("input", onListInput);
selectAllEl.addEventListener("change", onSelectAll);

function onListClick(e) {
  const row = e.target.closest(".cart-item");
  if (!row) return;
  const id = row.dataset.id;
  const items = loadCart();
  const i = items.findIndex((x) => String(x.bookId) === String(id));
  if (i < 0) return;

  if (e.target.classList.contains("inc"))
    items[i].quantity = (items[i].quantity || 1) + 1;
  if (e.target.classList.contains("dec"))
    items[i].quantity = Math.max(1, (items[i].quantity || 1) - 1);
  if (e.target.classList.contains("rm")) items.splice(i, 1);
  if (e.target.classList.contains("sel")) items[i].selected = e.target.checked;

  saveCart(items);
  updateCartUI();
  updateSubTotal();
  compute();
  e.target.classList.contains("rm") ? render() : updateRow(row, items[i]);
}

function onListInput(e) {
  if (!e.target.classList.contains("q")) return;
  const row = e.target.closest(".cart-item");
  const id = row.dataset.id;
  const items = loadCart();
  const i = items.findIndex((x) => String(x.bookId) === String(id));
  if (i < 0) return;

  items[i].quantity = Math.max(1, parseInt(e.target.value || "1", 10));
  saveCart(items);
  updateCartUI();
  updateSubTotal();
  compute();
  updateRow(row, items[i]);
}

function onSelectAll() {
  let items = loadCart().map((x) => ({ ...x, selected: selectAllEl.checked }));
  saveCart(items);
  render();
  updateSubTotal();
}

function updateCartUI() {
  const items = loadCart();
  $("#cart-count").textContent = items.reduce(
    (s, i) => s + (i.quantity || 0),
    0
  );
}

function updateSubTotal() {
  $("#sub-total").textContent = fmt(subTotal());
}

function subTotal() {
  const items = loadCart().filter((x) => x.selected !== false);
  return items.reduce((sum, it) => {
    const book = BOOKS.find((b) => String(b.id) === String(it.bookId));
    const price = book ? book.price : 0;
    return sum + price * (it.quantity || 1);
  }, 0);
}

function updateRow(row, it) {
  if (!row || !it) return;
  const book = BOOKS.find((b) => String(b.id) === String(it.bookId));
  const price = book ? book.price : 0;
  row.querySelector(".q").value = it.quantity;
  row.querySelector(".line-total").textContent = fmt(
    price * (it.quantity || 1)
  );
}

// ---------- Totals + Checkout entry ----------
function compute() {
  const items = loadCart().filter((x) => x.selected !== false);
  const checkoutBtn = $("#checkout");
  if (!checkoutBtn) return;

  if (items.length === 0) {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "THANH TOÁN";
  } else {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = `THANH TOÁN (${items.length} sản phẩm)`;
  }
}

// =======================
// Inline Checkout (panel)
// =======================

function openCheckoutModal() {
  // ensure books loaded
  if (!BOOKS || BOOKS.length === 0) {
    loadBooksFromFile().then(() => startCheckoutFlow());
  } else {
    startCheckoutFlow();
  }
}

function startCheckoutFlow() {
  // lấy items đã chọn từ localStorage (đã lưu ở click handler)
  checkoutItems = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.CHECKOUT_ITEMS) || "[]"
  );
  if (!checkoutItems || checkoutItems.length === 0) {
    alert("Không có sản phẩm nào được chọn!");
    return;
  }

  renderOrderItems();
  loadAddresses();
  updateOrderSummary();
  setupCheckoutEventListeners();

  // show panel
  overlay.classList.add("show");
}

// Close panel
function closePanel() {
  overlay.classList.remove("show");
  // reset state
  selectedAddress = null;
  selectedPayment = null;
  const qrSection = $("#qr-section");
  if (qrSection) qrSection.classList.remove("show");
  document.body.classList.remove("no-scroll"); // mở lại cuộn

  updatePlaceOrderButton();
}

closeBtn.addEventListener("click", closePanel);

// Click ra ngoài panel thì tắt
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closePanel();
});

// ESC để tắt
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePanel();
});

// Checkout button click (mở panel & nạp dữ liệu)
checkoutBtn.addEventListener("click", function () {
  document.body.classList.add("no-scroll"); // khóa cuộn

  const selected = loadCart().filter((x) => x.selected !== false);
  if (selected.length === 0) {
    alert("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!");
    return;
  }

  // Check login
  const currentUser = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || "null"
  );
  if (!currentUser) {
    alert("Vui lòng đăng nhập để tiếp tục thanh toán!");
    window.location.href = "login.html";
    return;
  }

  // Chuẩn hóa dữ liệu checkout_items
  const items = selected.map((item) => ({
    bookId: item.bookId,
    quantity: item.quantity || 1,
    selected: true,
  }));

  localStorage.setItem(STORAGE_KEYS.CHECKOUT_ITEMS, JSON.stringify(items));
  openCheckoutModal();
});

// =======================
// Functions ported from checkout.js (adapted)
// =======================
async function loadBooksFromFile() {
  try {
    const response = await fetch("./json/books.json");
    const books = await response.json();
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    BOOKS = books;
  } catch (error) {
    console.error("Error loading books:", error);
  }
}

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

function loadAddresses() {
  const container = $("#address-list");
  const currentUser = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || "null"
  );

  // Thử 2 key lưu địa chỉ
  let addresses = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.ADDRESSES) || "[]"
  );
  if (addresses.length === 0) {
    addresses = JSON.parse(
      localStorage.getItem(`addresses_${currentUser?.id}`) || "[]"
    );
  }

  if (addresses.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #666;">
        <p>Chưa có địa chỉ giao hàng nào.</p>
        <p>Vui lòng thêm địa chỉ mới để tiếp tục.</p>
      </div>
    `;
    return;
  }

  // Sắp xếp mặc định lên đầu
  addresses.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));

  container.innerHTML = addresses
    .map(
      (addr) => `
      <div class="address-option" data-address-id="${addr.id}">
        <input type="radio" name="address" value="${addr.id}" ${
        addr.is_default ? "checked" : ""
      }>
        <div class="address-info">
          <div class="address-name">
            ${addr.receiver_name}
            ${
              addr.is_default
                ? '<span class="address-default">Mặc định</span>'
                : ""
            }
          </div>
          <div class="address-phone">${addr.phone}</div>
          <div class="address-text">
            ${addr.address_line1}, ${addr.ward}, ${addr.district}, ${
        addr.province
      }
          </div>
        </div>
      </div>
    `
    )
    .join("");

  const def = addresses.find((a) => a.is_default);
  if (def) {
    selectedAddress = def.id;
    updatePlaceOrderButton();
  }
}

function setupCheckoutEventListeners() {
  // Address selection
  const addressList = $("#address-list");
  if (addressList) {
    addressList.addEventListener("click", function (e) {
      const addressOption = e.target.closest(".address-option");
      if (addressOption) {
        const radio = addressOption.querySelector("input[type='radio']");
        radio.checked = true;
        selectedAddress = parseInt(addressOption.dataset.addressId);

        $$(".address-option").forEach((o) => o.classList.remove("selected"));
        addressOption.classList.add("selected");
        updatePlaceOrderButton();
      }
    });
  }

  // Payment method selection
  $$(".payment-method").forEach((method) => {
    method.addEventListener("click", function () {
      const radio = this.querySelector("input[type='radio']");
      radio.checked = true;
      selectedPayment = radio.value;

      $$(".payment-method").forEach((m) => m.classList.remove("selected"));
      this.classList.add("selected");

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

  // Add address button + modal
  const addAddressBtn = $("#add-address-btn");
  if (addAddressBtn) addAddressBtn.addEventListener("click", showAddressModal);
  setupAddressModal();

  // Place order
  const placeBtn = $("#place-order-btn");
  if (placeBtn) placeBtn.addEventListener("click", placeOrder);
}

function updateQRInfo() {
  const totalAmount = calculateTotal();
  const orderId = generateOrderId();
  const tAmt = $("#transfer-amount");
  const tContent = $("#transfer-content");

  if (tAmt) tAmt.textContent = (totalAmount || 0).toLocaleString("vi-VN") + "đ";
  if (tContent) tContent.textContent = `THANHTOAN ${orderId}`;
}

// ----- Address modal -----
function setupAddressModal() {
  const modal = $("#address-modal");
  const closeButtons = $$(".modal-close");
  const form = $("#address-form");

  if (!modal) return;

  closeButtons.forEach((btn) =>
    btn.addEventListener("click", hideAddressModal)
  );

  modal.addEventListener("click", function (e) {
    if (e.target === modal) hideAddressModal();
  });

  if (form) form.addEventListener("submit", handleAddressSubmit);
}

function showAddressModal() {
  const modal = $("#address-modal");
  if (!modal) return;

  $("#address-form")?.reset();
  clearFormErrors();

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => (modal.style.opacity = "1"));

  setTimeout(() => $("#receiver-name")?.focus(), 150);
}

function hideAddressModal() {
  const modal = $("#address-modal");
  if (!modal) return;

  modal.style.opacity = "0";
  setTimeout(() => {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
    $("#address-form")?.reset();
    clearFormErrors();
  }, 300);
}

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

  if (!validateAddressForm(addressData)) return;

  try {
    const currentUser = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    );

    let addresses = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ADDRESSES) || "[]"
    );

    // Nếu set mặc định, bỏ mặc định ở địa chỉ khác
    if (addressData.is_default) {
      addresses.forEach((a) => (a.is_default = false));
    } else if (addresses.length === 0) {
      addressData.is_default = true;
    }

    const newAddress = {
      id: Date.now(),
      user_id: currentUser.id,
      ...addressData,
    };
    addresses.push(newAddress);

    localStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(addresses));
    syncWithAllAddresses(addresses, currentUser.id);

    loadAddresses();
    hideAddressModal();
  } catch (error) {
    console.error("❌ Error saving address:", error);
    alert("Có lỗi xảy ra khi lưu địa chỉ!");
  }
}

function validateAddressForm(data) {
  clearFormErrors();
  let ok = true;

  if (!data.receiver_name || data.receiver_name.length < 2) {
    showFieldError("receiver-name", "Tên người nhận phải có ít nhất 2 ký tự");
    ok = false;
  }
  if (!data.phone || !isValidPhone(data.phone)) {
    showFieldError("receiver-phone", "Số điện thoại không hợp lệ");
    ok = false;
  }
  if (!data.province) {
    showFieldError("province", "Vui lòng nhập tỉnh/thành phố");
    ok = false;
  }
  if (!data.district) {
    showFieldError("district", "Vui lòng nhập quận/huyện");
    ok = false;
  }
  if (!data.ward) {
    showFieldError("ward", "Vui lòng nhập phường/xã");
    ok = false;
  }
  if (!data.address_line1 || data.address_line1.length < 5) {
    showFieldError("address-detail", "Địa chỉ cụ thể phải có ít nhất 5 ký tự");
    ok = false;
  }
  return ok;
}

function showFieldError(fieldId, message) {
  const field = $("#" + fieldId);
  const errorMsg = field?.parentNode?.querySelector(".error-message");
  if (field && errorMsg) {
    field.classList.add("error");
    errorMsg.textContent = message;
  }
}

function clearFormErrors() {
  $$(".error").forEach((f) => f.classList.remove("error"));
  $$(".error-message").forEach((m) => (m.textContent = ""));
}

function isValidPhone(phone) {
  const clean = phone.replace(/[\s-]/g, "");
  const re = /^0[3|5|7|8|9][0-9]{8}$/;
  return re.test(clean);
}

function syncWithAllAddresses(userAddresses, userId) {
  try {
    const all = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ALL_ADDRESSES) || "[]"
    );
    const filtered = all.filter((a) => a.user_id !== userId);
    filtered.push(...userAddresses);
    localStorage.setItem(STORAGE_KEYS.ALL_ADDRESSES, JSON.stringify(filtered));
  } catch (e) {
    console.error("Error syncing addresses:", e);
  }
}

// ----- Summary / totals in panel -----
function calculateTotal() {
  const books = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKS) || "[]");
  const subtotal = checkoutItems.reduce((sum, item) => {
    const book = books.find((b) => String(b.id) === String(item.bookId));
    return book ? sum + book.price * (item.quantity || 1) : sum;
  }, 0);
  return subtotal;
}

function updateOrderSummary() {
  const books = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKS) || "[]");
  const subtotal = checkoutItems.reduce((sum, item) => {
    const book = books.find((b) => String(b.id) === String(item.bookId));
    return book ? sum + book.price * (item.quantity || 1) : sum;
  }, 0);

  const total = subtotal;
  const subEl = $("#subtotal");
  const totalEl = $("#total-amount");
  if (subEl) subEl.textContent = (subtotal || 0).toLocaleString("vi-VN") + "đ";
  if (totalEl) totalEl.textContent = (total || 0).toLocaleString("vi-VN") + "đ";
}

function updatePlaceOrderButton() {
  const btn = $("#place-order-btn");
  if (!btn) return;
  const hasAddress = selectedAddress !== null;
  const hasPayment = selectedPayment !== null;

  if (hasAddress && hasPayment) {
    btn.disabled = false;
    btn.textContent = "Đặt hàng";
  } else {
    btn.disabled = true;
    if (!hasAddress) btn.textContent = "Vui lòng chọn địa chỉ giao hàng";
    else if (!hasPayment)
      btn.textContent = "Vui lòng chọn phương thức thanh toán";
  }
}

function generateOrderId() {
  return Date.now().toString().slice(-8);
}

// ----- Place order -----
async function placeOrder() {
  if (!selectedAddress || !selectedPayment) {
    alert("Vui lòng chọn địa chỉ giao hàng và phương thức thanh toán!");
    return;
  }
  const btn = $("#place-order-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Đang xử lý...";
  }

  try {
    const orderId = generateOrderId();
    const currentUser = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    );
    const totalAmount = calculateTotal();

    const order = {
      id: parseInt(orderId) || orderId,
      user_id: currentUser?.id,
      address_id: selectedAddress,
      payment_method: selectedPayment,
      total_amount: totalAmount,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const books = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKS) || "[]");
    const orderDetails = checkoutItems.map((item) => {
      const book = books.find((b) => String(b.id) === String(item.bookId));
      return {
        id: Date.now().toString().slice(-8),
        order_id: parseInt(orderId) || orderId,
        book_id: parseInt(item.bookId) || item.bookId,
        quantity: item.quantity || 1,
        price: book ? book.price : 0,
        note: item.note || null,
      };
    });

    await saveOrderToStorage(order, orderDetails);
    removeCheckoutItemsFromCart();

    localStorage.setItem(
      "order_success",
      JSON.stringify({
        orderId: orderId,
        paymentMethod: selectedPayment,
        totalAmount: totalAmount,
      })
    );

    // Show inline order success panel instead of redirect
    showOrderSuccessPanel({
      orderId,
      paymentMethod: selectedPayment,
      totalAmount,
    });
    // Optional: also keep the data for separate page if user opens it
    localStorage.setItem(
      "order_success",
      JSON.stringify({ orderId, paymentMethod: selectedPayment, totalAmount })
    );

    return;
  } catch (error) {
    console.error("❌ Error placing order:", error);
    alert("Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Đặt hàng";
    }
  }
}
async function saveOrderToStorage(order, orderDetails) {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  const allOrderDetails = JSON.parse(
    localStorage.getItem("order_details") || "[]"
  );

  orders.push(order);
  allOrderDetails.push(...orderDetails);

  localStorage.setItem("orders", JSON.stringify(orders));
  localStorage.setItem("order_details", JSON.stringify(allOrderDetails));

  updateUserOrders(order, orderDetails);
}

function updateUserOrders(order, orderDetails) {
  const currentUser = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
  );

  const userOrders = JSON.parse(localStorage.getItem("orders_user") || "[]");
  userOrders.push(order);
  localStorage.setItem("orders_user", JSON.stringify(userOrders));

  const userOrderDetails = JSON.parse(
    localStorage.getItem("order_details_user") || "[]"
  );
  userOrderDetails.push(...orderDetails);
  localStorage.setItem("order_details_user", JSON.stringify(userOrderDetails));
}

function removeCheckoutItemsFromCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || "[]");
    const checkoutBookIds = checkoutItems.map(
      (item) => parseInt(item.bookId) || item.bookId
    );
    const updatedCart = cart.filter(
      (item) => !checkoutBookIds.includes(parseInt(item.bookId) || item.bookId)
    );
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(updatedCart));
    localStorage.removeItem(STORAGE_KEYS.CHECKOUT_ITEMS);
  } catch (error) {
    console.error("Error removing items from cart:", error);
  }
}

// ---------- Header account ----------
function updateAccountUI() {
  const currentUser = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || "null"
  );
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

// ---------- Bootstrap ----------
(async function init() {
  // đảm bảo BOOKS
  if (!BOOKS || BOOKS.length === 0) await loadBooksFromFile();
  render();
  updateAccountUI();
})();
// =======================
// Order Success Inline Panel
// =======================

// Thay thế toàn bộ hàm showOrderSuccessPanel hiện tại bằng:
function showOrderSuccessPanel({ orderId, paymentMethod, totalAmount }) {
  if (!overlay) return;

  // Ẩn panel checkout, hiện panel success
  const checkoutPanel = document.getElementById("checkout-panel");
  const successPanel = document.getElementById("order-success-panel");
  if (checkoutPanel) checkoutPanel.style.display = "none";
  if (successPanel) successPanel.style.display = "block";

  // Fill data
  const nowStr = new Date().toLocaleString("vi-VN");
  const fmt2 = (n) => (n || 0).toLocaleString("vi-VN") + "đ";

  const setText = (sel, txt) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = txt;
  };
  setText("#os-order-id", orderId);
  setText("#os-order-time", nowStr);
  setText("#os-total-amount", fmt2(totalAmount));

  const pmEl = document.querySelector("#os-payment-method");
  const qrSec = document.querySelector("#os-qr-payment-section");
  const codSec = document.querySelector("#os-cod-payment-section");

  if (paymentMethod === "qr") {
    if (pmEl) pmEl.textContent = "Chuyển khoản QR";
    if (qrSec) qrSec.style.display = "block";
    if (codSec) codSec.style.display = "none";
    setText("#os-transfer-amount", fmt2(totalAmount));
    setText("#os-transfer-content", `THANHTOAN ${orderId}`);
  } else if (paymentMethod === "cod") {
    if (pmEl) pmEl.textContent = "Thanh toán khi nhận hàng (COD)";
    if (qrSec) qrSec.style.display = "none";
    if (codSec) codSec.style.display = "block";
  } else {
    if (pmEl) pmEl.textContent = paymentMethod || "--";
    if (qrSec) qrSec.style.display = "none";
    if (codSec) codSec.style.display = "none";
  }

  // đảm bảo overlay hiển thị
  overlay.classList.add("show");

  // Nút đóng panel success
  const closeSp = document.getElementById("close-success-panel");
  if (closeSp && !closeSp.dataset.bound) {
    closeSp.addEventListener("click", () => {
      successPanel.style.display = "none";
      closePanel(); // đóng overlay
    });
    closeSp.dataset.bound = "1";
  }

  // Nút in
  const printBtn = document.getElementById("os-print-order");
  if (printBtn && !printBtn.dataset.bound) {
    printBtn.addEventListener("click", () => window.print());
    printBtn.dataset.bound = "1";
  }
}

renderOrderItems();
render();
updateAccountUI();
