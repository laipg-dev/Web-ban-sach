// Constants
const LS_KEY = "cart_user1";

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

// Checkout button click
$("#checkout").addEventListener("click", function () {
  const items = loadCart().filter((x) => x.selected !== false);

  if (items.length === 0) {
    alert("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!");
    return;
  }

  // Lưu items được chọn vào localStorage để sử dụng ở trang checkout
  localStorage.setItem("checkout_items", JSON.stringify(items));

  // Chuyển đến trang thanh toán
  window.location.href = "checkout.html";
});

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

render();
updateAccountUI();
