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
  ORDER_DETAILS_USER: "order_details_user",
  BOOKS: "BOOKS",
  CATEGORIES: "CATEGORIES",
  CHECKOUT_ITEMS: "checkout_items",
};
function generateIncrementNumber(list) {
  const maxNum = list.reduce((max, item) => {
    const num = parseInt(item.id, 10); // giả sử id chỉ là số
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return maxNum + 1;
}

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

const fmt = (n) => (n || 0).toLocaleString("vi-VN") + " đ";
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function loadCart() {
  const cart = loadData(STORAGE_KEYS.CART_USER);
  return Array.isArray(cart) ? cart : [];
}

function saveCart(items) {
  saveData(STORAGE_KEYS.CART_USER, Array.isArray(items) ? items : []);
}

let BOOKS = [];
const listEl = $("#cart-list");
const emptyEl = $("#empty");
const selectAllEl = $("#select-all");

function render() {
  let items = loadCart();
  if (!Array.isArray(items)) items = []; // đảm bảo luôn là mảng
  items = [...items].reverse();
  const countTextEl = $("#cart-count-text");
  if (countTextEl) countTextEl.textContent = `(${items.length} sản phẩm)`;
  const selectAllCountEl = $("#select-all-count");
  if (selectAllCountEl) selectAllCountEl.textContent = items.length.toString();
  updateCartUI();
  if (listEl) listEl.innerHTML = "";
  if (items.length === 0) {
    if (emptyEl) emptyEl.style.display = "";
    compute();
    return;
  }
  if (emptyEl) emptyEl.style.display = "none";
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
    if (listEl) listEl.appendChild(row);
  });
  if (selectAllEl) {
    selectAllEl.checked =
      items.length > 0 && items.every((x) => x.selected !== false);
  }
  updateSubTotal();
  compute();
}

if (listEl) {
  listEl.addEventListener("click", onListClick);
  listEl.addEventListener("input", onListInput);
}
if (selectAllEl) selectAllEl.addEventListener("change", onSelectAll);

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
  if (e.target.classList.contains("rm")) render();
  else updateRow(row, items[i]);
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
  const cartCountEl = $("#cart-count");
  if (cartCountEl) {
    cartCountEl.textContent = items.reduce((s, i) => s + (i.quantity || 0), 0);
  }
}

function updateSubTotal() {
  const el = $("#sub-total");
  if (el) el.textContent = fmt(subTotal());
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

function updateAccountUI() {
  const currentUser = loadData(STORAGE_KEYS.CURRENT_USER);
  const accountBtn = $("#account-btn");
  const accountName = $("#account-name");
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

const overlay = $("#panel-overlay");
const closeBtn = $("#close-panel");
const checkoutBtn = $("#checkout");

function openCheckoutModal() {
  if (!BOOKS || BOOKS.length === 0) {
    loadBooksFromFile().then(() => startCheckoutFlow());
  } else {
    startCheckoutFlow();
  }
}

function startCheckoutFlow() {
  const items = loadData(STORAGE_KEYS.CHECKOUT_ITEMS);
  const selected = Array.isArray(items) ? items : [];
  if (!selected || selected.length === 0) {
    alert("Không có sản phẩm nào được chọn!");
    return;
  }
  checkoutItems = selected;
  renderOrderItems();
  loadAddresses();
  updateOrderSummary();
  setupCheckoutEventListeners();
  if (overlay) overlay.classList.add("show");
  document.body.classList.add("no-scroll");
}

function closePanel() {
  if (overlay) overlay.classList.remove("show");
  selectedAddress = null;
  selectedPayment = null;
  const qrSection = $("#qr-section");
  if (qrSection) qrSection.classList.remove("show");
  document.body.classList.remove("no-scroll");
  updatePlaceOrderButton();
  const checkoutPanel = $("#checkout-panel");
  const successPanel = $("#order-success-panel");
  if (checkoutPanel) checkoutPanel.style.display = "";
  if (successPanel) successPanel.style.display = "none";
}

if (closeBtn) closeBtn.addEventListener("click", closePanel);
if (overlay) {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePanel();
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePanel();
});
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", function () {
    const selected = loadCart().filter((x) => x.selected !== false);
    if (selected.length === 0) {
      alert("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!");
      return;
    }
    const currentUser = loadData(STORAGE_KEYS.CURRENT_USER);
    if (!currentUser) {
      alert("Vui lòng đăng nhập để tiếp tục thanh toán!");
      window.location.href = "login.html";
      return;
    }
    const items = selected.map((item) => ({
      bookId: item.bookId,
      quantity: item.quantity || 1,
      selected: true,
    }));
    saveData(STORAGE_KEYS.CHECKOUT_ITEMS, items);
    openCheckoutModal();
  });
}

let checkoutItems = [];
let selectedAddress = null;
let selectedPayment = null;

async function loadBooksFromFile() {
  try {
    const response = await fetch("./json/books.json");
    const books = await response.json();
    BOOKS = Array.isArray(books) ? books : [];
    saveData(STORAGE_KEYS.BOOKS, BOOKS);
  } catch (error) {
    console.error("Error loading books:", error);
  }
}

function renderOrderItems() {
  const container = $("#order-items");
  const books = loadData(STORAGE_KEYS.BOOKS) || [];
  if (!container) return;
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
  const currentUser = loadData(STORAGE_KEYS.CURRENT_USER);
  let addresses = loadData(STORAGE_KEYS.ADDRESSES_USER);
  if (!Array.isArray(addresses)) addresses = [];
  if (addresses.length === 0 && currentUser?.id) {
    const perUser = loadData(`addresses_${currentUser.id}`);
    if (Array.isArray(perUser)) addresses = perUser;
  }
  if (!container) return;
  if (addresses.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #666;">
        <p>Chưa có địa chỉ giao hàng nào.</p>
        <p>Vui lòng thêm địa chỉ mới để tiếp tục.</p>
      </div>
    `;
    return;
  }
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
  const addressList = $("#address-list");
  if (addressList) {
    addressList.addEventListener("click", function (e) {
      const addressOption = e.target.closest(".address-option");
      if (addressOption) {
        const radio = addressOption.querySelector("input[type='radio']");
        if (radio) radio.checked = true;
        selectedAddress = parseInt(addressOption.dataset.addressId);
        $$(".address-option").forEach((o) => o.classList.remove("selected"));
        addressOption.classList.add("selected");
        updatePlaceOrderButton();
      }
    });
  }
  $$(".payment-method").forEach((method) => {
    method.addEventListener("click", function () {
      const radio = this.querySelector("input[type='radio']");
      if (!radio) return;
      radio.checked = true;
      selectedPayment = radio.value;
      $$(".payment-method").forEach((m) => m.classList.remove("selected"));
      this.classList.add("selected");
      const qrSection = $("#qr-section");
      if (qrSection) {
        if (selectedPayment === "qr") {
          qrSection.classList.add("show");
          updateQRInfo();
        } else {
          qrSection.classList.remove("show");
        }
      }
      updatePlaceOrderButton();
    });
  });
  const addAddressBtn = $("#add-address-btn");
  if (addAddressBtn) addAddressBtn.addEventListener("click", showAddressModal);
  setupAddressModal();
  const placeBtn = $("#place-order-btn");
  if (placeBtn) placeBtn.addEventListener("click", placeOrder);
}

function updateQRInfo() {
  const listOrder = loadData(STORAGE_KEYS.ORDERS);
  const totalAmount = calculateTotal(listOrder);
  const orderId = generateIncrementNumber;
  const tAmt = $("#transfer-amount");
  const tContent = $("#transfer-content");
  if (tAmt) tAmt.textContent = (totalAmount || 0).toLocaleString("vi-VN") + "đ";
  if (tContent) tContent.textContent = `THANHTOAN ${orderId}`;
}

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
  const form = $("#address-form");
  if (form) form.reset();
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
    receiver_name: (formData.get("receiver-name") || "").toString().trim(),
    phone: (formData.get("receiver-phone") || "").toString().trim(),
    province: (formData.get("province") || "").toString().trim(),
    district: (formData.get("district") || "").toString().trim(),
    ward: (formData.get("ward") || "").toString().trim(),
    address_line1: (formData.get("address-detail") || "").toString().trim(),
    is_default: formData.get("set-default") === "on",
  };
  if (!validateAddressForm(addressData)) return;
  try {
    const currentUser = loadData(STORAGE_KEYS.CURRENT_USER);
    let addresses = loadData(STORAGE_KEYS.ADDRESSES_USER);
    if (!Array.isArray(addresses)) addresses = [];
    if (addressData.is_default) {
      addresses.forEach((a) => (a.is_default = false));
    } else if (addresses.length === 0) {
      addressData.is_default = true;
    }
    const newId = generateIncrementNumber(addresses);
    const newAddress = {
      id: newId,
      user_id: currentUser?.id,
      ...addressData,
    };
    addresses.push(newAddress);
    saveData(STORAGE_KEYS.ADDRESSES_USER, addresses);
    syncWithAllAddresses(addresses, currentUser?.id);
    loadAddresses();
    hideAddressModal();
  } catch (error) {
    console.error("Error saving address:", error);
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
  const cleanedPhone = (data.phone || "").replace(/[\s-]/g, "");
  if (!cleanedPhone || !/^0[3|5|7|8|9][0-9]{8}$/.test(cleanedPhone)) {
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

function syncWithAllAddresses(userAddresses, userId) {
  try {
    const all = loadData(STORAGE_KEYS.ADDRESSES);
    const base = Array.isArray(all) ? all : [];
    const filtered = base.filter((a) => a.user_id !== userId);
    filtered.push(...userAddresses);
    saveData(STORAGE_KEYS.ADDRESSES, filtered);
  } catch (e) {
    console.error("Error syncing addresses:", e);
  }
}

function calculateTotal() {
  const books = loadData(STORAGE_KEYS.BOOKS) || [];
  const subtotal = checkoutItems.reduce((sum, item) => {
    const book = books.find((b) => String(b.id) === String(item.bookId));
    return book ? sum + book.price * (item.quantity || 1) : sum;
  }, 0);
  return subtotal;
}

function updateOrderSummary() {
  const books = loadData(STORAGE_KEYS.BOOKS) || [];
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
    const existOrders = loadData(STORAGE_KEYS.ORDERS) || [];
    const orderId = generateIncrementNumber(existOrders);

    const currentUser = loadData(STORAGE_KEYS.CURRENT_USER);
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
    const books = loadData(STORAGE_KEYS.BOOKS) || [];
    const existDetails = loadData(STORAGE_KEYS.ORDER_DETAILS) || [];
    let nextDetailId = generateIncrementNumber(existDetails);
    const orderDetails = checkoutItems.map((item) => {
      const book = books.find((b) => String(b.id) === String(item.bookId));
      const detail = {
        id: nextDetailId++,
        order_id: parseInt(orderId) || orderId,
        book_id: parseInt(item.bookId) || item.bookId,
        quantity: item.quantity || 1,
        price: book ? book.price : 0,
        note: item.note || null,
      };
      return detail;
    });
    await saveOrderToStorage(order, orderDetails);
    removeCheckoutItemsFromCart();
    saveData("order_success", {
      orderId,
      paymentMethod: selectedPayment,
      totalAmount,
    });
    showOrderSuccessPanel({
      orderId,
      paymentMethod: selectedPayment,
      totalAmount,
    });
    return;
  } catch (error) {
    console.error("Error placing order:", error);
    alert("Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Đặt hàng";
    }
  }
}

async function saveOrderToStorage(order, orderDetails) {
  const orders = loadData(STORAGE_KEYS.ORDERS);
  const details = loadData(STORAGE_KEYS.ORDER_DETAILS);
  const nextOrders = Array.isArray(orders) ? orders.slice() : [];
  const nextDetails = Array.isArray(details) ? details.slice() : [];
  nextOrders.push(order);
  nextDetails.push(...orderDetails);
  saveData(STORAGE_KEYS.ORDERS, nextOrders);
  saveData(STORAGE_KEYS.ORDER_DETAILS, nextDetails);
  updateUserOrders(order, orderDetails);
}

function updateUserOrders(order, orderDetails) {
  const userOrders = loadData(STORAGE_KEYS.ORDERS_USER);
  const userOrderDetails = loadData(STORAGE_KEYS.ORDER_DETAILS_USER);
  const nextUserOrders = Array.isArray(userOrders) ? userOrders.slice() : [];
  const nextUserDetails = Array.isArray(userOrderDetails)
    ? userOrderDetails.slice()
    : [];
  nextUserOrders.push(order);
  nextUserDetails.push(...orderDetails);
  saveData(STORAGE_KEYS.ORDERS_USER, nextUserOrders);
  saveData(STORAGE_KEYS.ORDER_DETAILS_USER, nextUserDetails);
}

function removeCheckoutItemsFromCart() {
  try {
    const cart = loadCart();
    const checkoutBookIds = checkoutItems.map(
      (item) => parseInt(item.bookId) || item.bookId
    );
    const updatedCart = cart.filter(
      (item) => !checkoutBookIds.includes(parseInt(item.bookId) || item.bookId)
    );
    saveCart(updatedCart);
    saveData(STORAGE_KEYS.CHECKOUT_ITEMS, []);
  } catch (error) {
    console.error("Error removing items from cart:", error);
  }
}

function showOrderSuccessPanel({ orderId, paymentMethod, totalAmount }) {
  if (!overlay) return;
  const checkoutPanel = $("#checkout-panel");
  const successPanel = $("#order-success-panel");
  if (checkoutPanel) checkoutPanel.style.display = "none";
  if (successPanel) successPanel.style.display = "block";
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
  overlay.classList.add("show");
  const closeSp = $("#close-success-panel");
  if (closeSp && !closeSp.dataset.bound) {
    closeSp.addEventListener("click", () => {
      if (successPanel) successPanel.style.display = "none";
      closePanel();
      render();
    });
    closeSp.dataset.bound = "1";
  }
  const printBtn = $("#os-print-order");
  if (printBtn && !printBtn.dataset.bound) {
    printBtn.addEventListener("click", () => window.print());
    printBtn.dataset.bound = "1";
  }
}

(async function init() {
  await loadAllDataToLocal();
  const books = loadData(STORAGE_KEYS.BOOKS);
  BOOKS = Array.isArray(books) ? books : [];
  render();
  updateAccountUI();
})();
