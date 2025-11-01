// ===== Hàm trợ giúp & khóa =====
const $ = (s, r = document) => r.querySelector(s);
const fmt = (n) => (n || 0).toLocaleString("vi-VN") + " đ";
const K = {
  BOOKS: "BOOKS",
  CATEGORIES: "CATEGORIES",
  CURRENT_USER: "currentUser",
  CART: "cart_user1",
};

async function ensureSeeds() {
  if (!localStorage.getItem(K.BOOKS)) {
    const r = await fetch("json/books.json");
    const d = await r.json();
    localStorage.setItem(K.BOOKS, JSON.stringify(d));
  }
  if (!localStorage.getItem(K.CATEGORIES)) {
    const r = await fetch("json/categories.json");
    const d = await r.json();
    localStorage.setItem(K.CATEGORIES, JSON.stringify(d));
  }
}

function getBook(id) {
  const list = JSON.parse(localStorage.getItem(K.BOOKS) || "[]");
  return list.find((b) => String(b.id) === String(id));
}

function getCategoryNames(categoryIds) {
  if (!categoryIds || !Array.isArray(categoryIds)) return "—";

  const categories = JSON.parse(localStorage.getItem(K.CATEGORIES) || "[]");
  const categoryNames = categoryIds
    .map((id) => {
      const category = categories.find((cat) => cat.id === id);
      return category ? category.display_name : null;
    })
    .filter(Boolean); // Loại bỏ null values

  return categoryNames.length > 0 ? categoryNames.join(", ") : "—";
}
function updateBadge() {
  const el = $("#cart-count");
  if (!el) return;
  const cart = JSON.parse(localStorage.getItem(K.CART) || "[]");
  el.textContent = cart.reduce((s, i) => s + (i.quantity || 0), 0);
}
function addToCart(bookId, qty) {
  if (!localStorage.getItem(K.CURRENT_USER)) {
    alert("Bạn cần đăng nhập để thêm vào giỏ!");
    location.href = "login.html";
    return;
  }
  const cart = JSON.parse(localStorage.getItem(K.CART) || "[]");
  const f = cart.find((i) => String(i.bookId) === String(bookId));
  if (f) f.quantity = (f.quantity || 0) + qty;
  else cart.push({ bookId, quantity: qty, selected: true });
  localStorage.setItem(K.CART, JSON.stringify(cart));
  updateBadge();
  alert("Đã thêm vào giỏ!");
}

// Hàm mua ngay - chỉ chọn sản phẩm vừa mua
function buyNow(bookId, qty) {
  if (!localStorage.getItem(K.CURRENT_USER)) {
    alert("Bạn cần đăng nhập để mua hàng!");
    location.href = "login.html";
    return;
  }

  const cart = JSON.parse(localStorage.getItem(K.CART) || "[]");

  // Bỏ chọn tất cả sản phẩm hiện có trong giỏ
  cart.forEach((item) => {
    item.selected = false;
  });

  // Thêm hoặc cập nhật sản phẩm muốn mua
  const existingItem = cart.find((i) => String(i.bookId) === String(bookId));
  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 0) + qty;
    existingItem.selected = true; // Chỉ chọn sản phẩm này
  } else {
    cart.push({ bookId, quantity: qty, selected: true });
  }

  localStorage.setItem(K.CART, JSON.stringify(cart));
  updateBadge();

  // Chuyển đến trang giỏ hàng
  location.href = "cart.html";
}

function renderInfoTable(book) {
  const map = [
    ["Mã hàng", book.sku || book.id],
    ["Thể loại", getCategoryNames(book.category_ids)],
    ["Tên Nhà Cung Cấp", book.supplier || book.publisher || "—"],
    ["Tác giả", (book.authors || []).join(", ") || "—"],
    ["NXB", book.publisher || "—"],
    ["Năm XB", book.publish_year || "—"],
    ["Kích Thước Bao Bì", book.size || "—"],
    ["Số trang", book.pages || "—"],
  ];

  const dl = $("#info-list");
  dl.innerHTML = "";

  // Render thông tin thông thường (không có giá bán)
  map.forEach(([k, v]) => {
    const dt = document.createElement("dt");
    dt.textContent = k;
    const dd = document.createElement("dd");
    dd.textContent = v || "—";
    dl.append(dt, dd);
  });
}

// Hàm riêng để render giá bán và tên sách
function renderPrice(book) {
  const priceContainer = $("#book-price");
  if (!priceContainer) return;

  priceContainer.innerHTML = `
    <div class="book-title-price">
      <h2 class="book-title">${book.title}</h2>
      <div class="price-display">
        <span class="current-price">${fmt(book.price)}</span>
      </div>
    </div>
  `;
}

function renderGallery(book) {
  const main = $("#main-img");
  const thumbs = $("#thumbs");
  const imgs = [book.image_url, ...(book.images || [])].filter(Boolean);
  main.src = imgs[0] || "https://via.placeholder.com/600x600?text=Book";

  thumbs.innerHTML = "";
  const maxShow = 5;
  imgs.slice(0, maxShow).forEach((src, idx) => {
    const box = document.createElement("div");
    box.className = "t" + (idx === 0 ? " active" : "");
    box.innerHTML = `<img src="${src}" alt="Ảnh ${idx + 1}">`;
    box.addEventListener("click", () => {
      $("#thumbs .t.active")?.classList.remove("active");
      box.classList.add("active");
      main.src = src;
    });
    thumbs.appendChild(box);
  });
  if (imgs.length > maxShow) {
    const more = document.createElement("div");
    more.className = "more";
    more.textContent = `+${imgs.length - maxShow}`;
    thumbs.appendChild(more);
  }
}

function render() {
  const id = new URL(location.href).searchParams.get("id");
  const book = getBook(id);
  if (!book) {
    $(".detail-grid").innerHTML = "<p>Không tìm thấy sách.</p>";
    return;
  }

  renderGallery(book);
  renderPrice(book);
  renderInfoTable(book);
  $("#book-desc").textContent = book.description || "—";

  $("#btn-add").onclick = () => addToCart(book.id, 1);
  $("#btn-buy").onclick = () => buyNow(book.id, 1);
}

(async function boot() {
  await ensureSeeds();
  updateBadge();
  render();
})();
