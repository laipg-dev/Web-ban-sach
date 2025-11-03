const LS_KEYS = {
  USERS: "USERS",
  CURRENT_USER: "currentUser",
  CART: "cart_user",
  CARTS: "carts",
  ADDRESSES: "addresses_",
  ALL_ADDRESSES: "ALL_ADDRESSES",
  ORDERS: "orders",
  ORDER_DETAILS: "order_details",
  ORDERS_USER: "orders_user",
  ORDERS_DETAILS_USER: "order_details_user",
};
async function seedSampleCart() {
  if (!localStorage.getItem(LS_KEYS.CARTS)) {
    try {
      const res = await fetch("json/carts.json");
      const data = await res.json();
      localStorage.setItem(LS_KEYS.CARTS, JSON.stringify(data));
      // console.log("Seed CARTS from carts.json");
    } catch (e) {
      console.error("Không thể load users.json", e);
    }
  }
}

// Load addresses from JSON file into centralized localStorage
async function seedAddressesData() {
  // Only load the central addresses list, don't create user-specific lists yet
  if (!localStorage.getItem("ALL_ADDRESSES")) {
    try {
      const response = await fetch("json/addresses.json");
      const addressesData = await response.json();

      // Store all addresses in one centralized location
      localStorage.setItem("ALL_ADDRESSES", JSON.stringify(addressesData));
      console.log("✅ Loaded all addresses into central storage");
    } catch (error) {
      console.error("❌ Error loading addresses data:", error);
    }
  }
}

// Function to initialize user-specific addresses after login
window.initializeUserAddresses = function initializeUserAddresses(userId) {
  const userAddressKey = `addresses_${userId}`;

  // Check if user already has addresses in localStorage
  if (localStorage.getItem(userAddressKey)) {
    return; // User already has addresses, don't overwrite
  }

  try {
    // Get all addresses from central storage
    const allAddresses = JSON.parse(
      localStorage.getItem("ALL_ADDRESSES") || "[]"
    );

    // Filter addresses for this specific user
    const userAddresses = allAddresses
      .filter((address) => address.user_id === userId)
      .map((address) => ({
        id: address.id,
        name: address.receiver_name,
        phone: address.phone,
        street: address.address_line1,
        ward: address.ward,
        district: address.district.toLowerCase().replace(/\s+/g, "-"),
        city: mapProvinceToCity(address.province),
        isDefault: address.is_default,
        created_at: address.created_at,
        updated_at: address.updated_at,
      }));

    // Store user's addresses in their specific localStorage key
    if (userAddresses.length > 0) {
      localStorage.setItem(userAddressKey, JSON.stringify(userAddresses));
      console.log(
        `✅ Initialized ${userAddresses.length} addresses for user ${userId}`
      );
    }
  } catch (error) {
    console.error(`❌ Error initializing addresses for user ${userId}:`, error);
  }
};

// Helper function to map province names to city codes
function mapProvinceToCity(province) {
  const provinceMap = {
    "Ha Noi": "hanoi",
    "Hà Nội": "hanoi",
    "TP Ho Chi Minh": "hcm",
    "TP. Hồ Chí Minh": "hcm",
    "Ho Chi Minh": "hcm",
    "Da Nang": "danang",
    "Đà Nẵng": "danang",
    "Hai Phong": "haiphong",
    "Hải Phòng": "haiphong",
    "Can Tho": "cantho",
    "Cần Thơ": "cantho",
  };

  return provinceMap[province] || province.toLowerCase().replace(/\s+/g, "-");
}

// Utility function to force reload addresses (can be called from console)
window.reloadAddressesFromJSON = async function () {
  try {
    // Clear central addresses storage
    localStorage.removeItem("ALL_ADDRESSES");

    // Clear existing user-specific addresses
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("addresses_")) {
        localStorage.removeItem(key);
      }
    });

    // Reload from JSON
    await seedAddressesData();
    console.log("✅ Addresses reloaded from JSON successfully!");

    // Re-initialize current user's addresses if logged in
    const currentUser = JSON.parse(
      localStorage.getItem("currentUser") || "null"
    );
    if (currentUser && currentUser.id) {
      initializeUserAddresses(currentUser.id);
      console.log(
        `✅ Re-initialized addresses for current user ${currentUser.id}`
      );
    }

    return true;
  } catch (error) {
    console.error("❌ Error reloading addresses:", error);
    return false;
  }
};

// Utility function to view current addresses in localStorage (debug)
window.viewStoredAddresses = function () {
  console.log("📍 All Addresses Storage:");
  const allAddresses = JSON.parse(
    localStorage.getItem("ALL_ADDRESSES") || "[]"
  );
  console.log("Central storage:", allAddresses);

  console.log("\n📍 User-specific Addresses:");
  const addressKeys = Object.keys(localStorage).filter((key) =>
    key.startsWith("addresses_")
  );
  addressKeys.forEach((key) => {
    const userId = key.replace("addresses_", "");
    const addresses = JSON.parse(localStorage.getItem(key) || "[]");
    console.log(`User ${userId}:`, addresses);
  });
};

// Utility function to initialize addresses for a specific user (can be called from console)
window.initUserAddresses = function (userId) {
  try {
    initializeUserAddresses(userId);
    console.log(`✅ Initialized addresses for user ${userId}`);
  } catch (error) {
    console.error(`❌ Error initializing addresses for user ${userId}:`, error);
  }
};
// Thêm hàm loadCategories
async function loadCategories() {
  try {
    const response = await fetch("json/categories.json");
    const categories = await response.json();
    CATEGORIES = categories.filter((cat) => cat.status);
    localStorage.setItem("CATEGORIES", JSON.stringify(CATEGORIES));
    return CATEGORIES;
  } catch (error) {
    console.error("Error loading categories:", error);
    // Fallback từ localStorage
    CATEGORIES = JSON.parse(localStorage.getItem("CATEGORIES") || "[]");
    return CATEGORIES;
  }
}
// Khởi tạo users từ users.json chỉ 1 lần
async function ensureUsersSeeded() {
  if (!localStorage.getItem(LS_KEYS.USERS)) {
    try {
      const res = await fetch("json/users.json");
      const data = await res.json();
      localStorage.setItem(LS_KEYS.USERS, JSON.stringify(data));
      // console.log("Seed USERS from users.json");
    } catch (e) {
      console.error("Không thể load users.json", e);
    }
  }
}
async function initBooksData() {
  const KEY = "BOOKS";
  if (!localStorage.getItem(KEY)) {
    try {
      const res = await fetch("json/books.json");
      const data = await res.json();
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (err) {
      console.error("Không thể load json/books.json:", err);
    }
  }
}

async function initBooksDataAndRender() {
  await initBooksData();
  // Sau khi chắc chắn dữ liệu đã có, cập nhật BOOKS và render
  window.BOOKS = JSON.parse(localStorage.getItem("BOOKS") || "[]");
  renderBooks();
}

// Tải giỏ hàng khi trang được tải
document.addEventListener("DOMContentLoaded", function () {
  updateCartUI();
});

// Lưu giỏ hàng vào localStorage
function saveCart(cart) {
  localStorage.setItem("cart_user1", JSON.stringify(cart));
}

// Lấy giỏ hàng từ localStorage
function loadCart() {
  const savedCart = localStorage.getItem("cart_user1");
  if (savedCart) {
    cart = JSON.parse(savedCart);
  }
}

// Render danh sách sách
function renderBooks(booksToShow = null) {
  const container = document.getElementById("book-list");
  container.innerHTML = "";

  const BOOKS = JSON.parse(localStorage.getItem("BOOKS") || "[]");
  booksToShow = booksToShow || BOOKS;

  // LỌC SÁCH CÓ STATUS = TRUE TRƯỚC KHI TÍNH PAGINATION
  const validBooks = booksToShow.filter((book) => book.status !== false);

  // Tính vị trí bắt đầu và kết thúc dựa trên sách hợp lệ
  const start = (currentPage - 1) * booksPerPage;
  const end = start + booksPerPage;
  const booksSlice = validBooks.slice(start, end);

  booksSlice.forEach((book) => {
    // Xác định trạng thái tồn kho
    let stockStatus = "";
    let stockClass = "";
    if (book.stock === 0) {
      stockStatus = "Hết hàng";
      stockClass = "out-of-stock";
    } else if (book.stock <= 10) {
      stockStatus = "Sắp hết";
      stockClass = "low-stock";
    } else {
      stockStatus = "Còn hàng";
      stockClass = "in-stock";
    }

    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <div class="book-image">
        <img src="${book.image_url}" alt="${book.title}" loading="lazy">
        <div class="stock-status ${stockClass}">${stockStatus}</div>
      </div>
      <div class="book-info">
        <h3>${book.title}</h3>
        <p class="book-authors">Tác giả: ${book.authors.join(", ")}</p>
        <div class="publisher-info">
          <span>${book.publisher}</span>
          <span>${book.publish_year}</span>
        </div>
        <div class="book-categories">
          ${(() => {
            const categories = JSON.parse(
              localStorage.getItem("CATEGORIES") || "[]"
            );
            const categoryNames = book.category_ids.slice(0, 2).map((catId) => {
              const category = categories.find((cat) => cat.id === catId);
              return category ? category.name : catId;
            });
            return categoryNames
              .map((catName) => `<span class="category-tag">${catName}</span>`)
              .join("");
          })()}
          ${
            book.category_ids.length > 2
              ? `<span class="category-tag">+${
                  book.category_ids.length - 2
                }</span>`
              : ""
          }
        </div>
        <div class="book-price">
          <span class="current-price">${book.price.toLocaleString()}đ</span>
        </div>
        <div class="book-actions">
          <button class="view-btn" onclick="viewBookDetails('${book.id}')">
            <span class="view-icon">👁️</span>
            Xem chi tiết
          </button>
          <button class="add-to-cart-btn" onclick="addToCart('${book.id}')" ${
      book.stock === 0 ? "disabled" : ""
    }>
            <span class="cart-icon">🛒</span>
            ${book.stock === 0 ? "Hết hàng" : "Thêm vào giỏ"}
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // TRUYỀN validBooks VÀO renderPagination THAY VÌ booksToShow
  renderPagination(validBooks);
}

function renderPagination(booksList) {
  let pagination = document.getElementById("pagination");
  if (!pagination) {
    pagination = document.createElement("div");
    pagination.id = "pagination";
    pagination.style = "text-align:center; margin: 24px 0;";
    document.getElementById("book-list").after(pagination);
  }
  pagination.innerHTML = "";

  const totalPages = Math.ceil(booksList.length / booksPerPage);
  if (totalPages <= 1) return;

  const createButton = (text, page, active = false) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.dataset.page = page;
    btn.className = active ? "active-page" : "";
    btn.style.margin = "0 4px";
    btn.onclick = function () {
      if (page !== currentPage) {
        currentPage = page;
        renderBooks(booksList);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    return btn;
  };

  // 🔁 Trang đầu & trước (ẩn nếu đang ở trang 1)
  if (currentPage > 1) {
    pagination.appendChild(createButton("«", 1));
    pagination.appendChild(createButton("‹", currentPage - 1));
  }

  // 🔁 Hiển thị khoảng 5 trang xung quanh current
  const windowSize = 2;
  let start = Math.max(1, currentPage - windowSize);
  let end = Math.min(totalPages, currentPage + windowSize);

  if (start > 1) {
    pagination.appendChild(createButton("1", 1, currentPage === 1));
    if (start > 2) {
      const dots = document.createElement("span");
      dots.textContent = "…";
      pagination.appendChild(dots);
    }
  }

  for (let i = start; i <= end; i++) {
    pagination.appendChild(createButton(i, i, currentPage === i));
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      const dots = document.createElement("span");
      dots.textContent = "…";
      pagination.appendChild(dots);
    }
    pagination.appendChild(
      createButton(totalPages, totalPages, currentPage === totalPages)
    );
  }

  // 🔁 Trang sau & cuối (ẩn nếu đang ở trang cuối)
  if (currentPage < totalPages) {
    pagination.appendChild(createButton("›", currentPage + 1));
    pagination.appendChild(createButton("»", totalPages));
  }
}

// Thêm vào giỏ
function addToCart(bookId) {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) {
    alert("Bạn cần đăng nhập để xem giỏ hàng!");
    const modal = document.getElementById("book-details-modal");
    if (modal) modal.classList.remove("show");
    document.body.style.overflow = "";

    const authModal = document.getElementById("auth-modal");
    if (authModal) authModal.classList.add("show");
    return; // Dừng hàm, không thêm vào giỏ hàng
  }
  const cart = JSON.parse(localStorage.getItem("cart_user1") || "[]");
  const item = cart.find((i) => String(i.bookId) === String(bookId));

  if (item) {
    item.quantity++;
  } else {
    cart.push({ bookId, quantity: 1, selected: true });
  }
  saveCart(cart);
  updateCartsWithCurrentUserCart();
  updateCartUI();
  alert("Đã thêm vào giỏ hàng!");
}

// Cập nhật giao diện giỏ hàng
function updateCartUI() {
  const cart = JSON.parse(localStorage.getItem("cart_user1") || "[]");
  const countEl = document.getElementById("cart-count");
  countEl.textContent = cart.reduce((s, i) => s + i.quantity, 0);
}

// Cập nhật hiển thị tài khoản trong header
function updateAccountUI() {
  const currentUser = JSON.parse(
    localStorage.getItem(LS_KEYS.CURRENT_USER) || "null"
  );
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

let currentPage = 1;
const booksPerPage = 8;

// Render categories từ dữ liệu JSON
function renderCategories() {
  const categories = JSON.parse(localStorage.getItem("CATEGORIES") || "[]");
  const container = document.getElementById("category-tags");

  if (!container) return;

  container.innerHTML = "";

  // Render tất cả categories có status = true
  categories
    .filter((cat) => cat.status)
    .forEach((category, index) => {
      const button = document.createElement("button");
      button.className = `category-tag ${
        category.name === "all" ? "active" : ""
      }`;
      button.dataset.category = category.name;

      button.innerHTML = `
        <img
          src="${category.icon}"
          alt="${category.display_name}"
          class="category-icon"
        />
        <span>${category.display_name}</span>
      `;

      // Thêm event listener cho từng button
      button.addEventListener("click", function () {
        // Xóa class active của tất cả tags
        document
          .querySelectorAll(".category-tag")
          .forEach((t) => t.classList.remove("active"));
        // Thêm class active cho tag được click
        this.classList.add("active");
        // Gọi hàm filter
        filterBooks();
      });

      container.appendChild(button);
    });
}

async function seedAllData() {
  await ensureUsersSeeded();
  await seedSampleCart();
  await initBooksData();
  await loadCategories();
  await seedAddressesData();
}

// Gọi hàm này khi mở trang
document.addEventListener("DOMContentLoaded", async function () {
  await seedAllData();

  const BOOKS = JSON.parse(localStorage.getItem("BOOKS") || "[]");

  // Render categories và books
  renderCategories();
  updateCartUI();
  updateAccountUI();
  renderBooks();

  // Event listeners
  const qElement = document.getElementById("q");
  const sortElement = document.getElementById("sort");
  const priceFilterElement = document.getElementById("price-filter");

  if (qElement) {
    qElement.addEventListener("input", filterBooks);
  }

  if (sortElement) {
    sortElement.addEventListener("change", filterBooks);
  }

  if (priceFilterElement) {
    priceFilterElement.addEventListener("change", filterBooks);
  }
});

function updateCartsWithCurrentUserCart() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (!currentUser) return;

  // Lấy danh sách carts từ localStorage
  let carts = JSON.parse(localStorage.getItem(LS_KEYS.CARTS) || "[]");
  // Lấy giỏ hàng hiện tại của user
  const userCartItems = JSON.parse(localStorage.getItem("cart_user1") || "[]");

  // Tìm cart của user trong danh sách carts
  let cartObj = carts.find((c) => c.user_id === currentUser.id);

  if (cartObj) {
    // Nếu đã có, cập nhật items và updated_at
    cartObj.items = userCartItems;
    cartObj.updated_at = new Date().toISOString();
  } else {
    // Nếu chưa có, tạo mới cart cho user này
    cartObj = {
      id: Date.now(),
      user_id: currentUser.id,
      session_id: null,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: userCartItems,
    };
    carts.push(cartObj);
  }

  // Lưu lại danh sách carts vào localStorage
  localStorage.setItem(LS_KEYS.CARTS, JSON.stringify(carts));
}

// Thêm vào index.js
document.getElementById("price-filter").addEventListener("change", function () {
  const priceRange = this.value;
  filterBooks();
});

function filterBooks() {
  const query = document.getElementById("q").value.toLowerCase();
  const sortBy = document.getElementById("sort").value;
  const priceRange = document.getElementById("price-filter").value;
  const activeCategory = document.querySelector(".category-tag.active").dataset
    .category;
  const BOOKS = JSON.parse(localStorage.getItem("BOOKS") || "[]");

  // Lọc sách có status = true
  let filtered = BOOKS.filter((book) => book.status !== false);

  // Lọc theo từ khóa tìm kiếm
  if (query) {
    filtered = filtered.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.authors.some((author) => author.toLowerCase().includes(query))
    );
  }

  // Lọc theo khoảng giá
  if (priceRange !== "all") {
    const [min, max] = priceRange.split("-").map(Number);
    filtered = filtered.filter(
      (book) => book.price >= min && book.price <= max
    );
  }

  // Lọc theo category
  if (activeCategory !== "all") {
    const categories = JSON.parse(localStorage.getItem("CATEGORIES") || "[]");
    filtered = filtered.filter((book) => {
      // book.category_ids chứa các ID, cần tìm category có name tương ứng
      return (
        book.category_ids &&
        book.category_ids.some((catId) => {
          const category = categories.find((cat) => cat.id === catId);
          return category && category.name === activeCategory;
        })
      );
    });
  }

  // Sắp xếp
  switch (sortBy) {
    case "price_asc":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "title_asc":
      filtered.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "title_desc":
      filtered.sort((a, b) => b.title.localeCompare(a.title));
      break;
  }

  // RESET currentPage về 1 khi filter
  currentPage = 1;
  renderBooks(filtered);
}

// Thêm hàm xem chi tiết sách
function viewBookDetails(bookId) {
  console.log("viewBookDetails called with ID:", bookId);

  // Show modal instead of redirecting to page
  if (window.showBookDetailsModal) {
    console.log("Calling showBookDetailsModal");
    window.showBookDetailsModal(bookId);
  } else {
    console.warn(
      "showBookDetailsModal not available, falling back to page redirect"
    );
    // Fallback to page redirect if modal not ready
    window.location.href = `viewBookDetails.html?id=${bookId}`;
  }
}

// ===== Carousel Component =====
function Carousel(rootId, { interval = 4000, autoplay = true } = {}) {
  const root = document.getElementById(rootId || "myCarousel");
  if (!root) return;

  const track = root.querySelector(".carousel-track");
  const slides = Array.from(root.querySelectorAll(".carousel-slide"));
  const prevBtn = root.querySelector(".carousel-btn.prev");
  const nextBtn = root.querySelector(".carousel-btn.next");
  const dotsWrap = root.querySelector(".carousel-dots");

  let index = 0,
    timer = null,
    isDragging = false,
    startX = 0,
    currentX = 0;

  // dots
  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.setAttribute("role", "tab");
    b.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(b);
  });

  function update() {
    track.style.transform = `translateX(${-index * 100}%)`;
    dotsWrap.querySelectorAll("button").forEach((d, i) => {
      d.classList.toggle("is-active", i === index);
      d.setAttribute("aria-selected", i === index);
    });
  }

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    update();
    restart();
  }
  function next() {
    goTo(index + 1);
  }
  function prev() {
    goTo(index - 1);
  }

  // autoplay
  function restart() {
    if (!autoplay) return;
    clearInterval(timer);
    timer = setInterval(next, interval);
  }

  // buttons
  nextBtn.addEventListener("click", next);
  prevBtn.addEventListener("click", prev);

  // keyboard
  root.setAttribute("tabindex", "0");
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  // drag / swipe
  const start = (x) => {
    isDragging = true;
    startX = x;
    currentX = x;
    track.style.transition = "none";
    clearInterval(timer);
  };
  const move = (x) => {
    if (!isDragging) return;
    currentX = x;
    const dx = currentX - startX;
    track.style.transform = `translateX(${
      -index * 100 + (dx * 100) / root.offsetWidth
    }%)`;
  };
  const end = () => {
    if (!isDragging) return;
    isDragging = false;
    track.style.transition = "";
    const dx = currentX - startX;
    if (Math.abs(dx) > root.offsetWidth * 0.15) dx < 0 ? next() : prev();
    else update();
    restart();
  };

  // mouse
  track.addEventListener("mousedown", (e) => start(e.clientX));
  window.addEventListener("mousemove", (e) => move(e.clientX));
  window.addEventListener("mouseup", end);
  // touch
  track.addEventListener("touchstart", (e) => start(e.touches[0].clientX), {
    passive: true,
  });
  track.addEventListener("touchmove", (e) => move(e.touches[0].clientX), {
    passive: true,
  });
  track.addEventListener("touchend", end);

  // pause on hover
  root.addEventListener("mouseenter", () => clearInterval(timer));
  root.addEventListener("mouseleave", restart);

  // init
  update();
  restart();
}

// Initialize carousel after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Delay carousel initialization to ensure other DOM content is ready
  setTimeout(() => {
    if (document.getElementById("myCarousel")) {
      Carousel("myCarousel", { interval: 4500, autoplay: true });
    }
  }, 100);

  // Initialize auth modal
  initAuthModal();
});

// ====== HELPER FUNCTIONS FROM LOGIN.JS ======
function genId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

function wrteUserAddresses(items) {
  localStorage.setItem(LS_KEYS.ADDRESSES + "1", JSON.stringify(items || []));
}

function writeUserCartItems(userId, items) {
  localStorage.setItem(LS_KEYS.CART + "1", JSON.stringify(items || []));
}

async function loadOrdersToLocalStorage() {
  if (!localStorage.getItem(LS_KEYS.ORDERS)) {
    try {
      const res = await fetch("json/orders.json");
      const data = await res.json();
      localStorage.setItem(LS_KEYS.ORDERS, JSON.stringify(data));
      console.log("✅ Đã load orders.json lên localStorage");
    } catch (err) {
      console.error("❌ Không thể load json/orders.json:", err);
      localStorage.setItem(LS_KEYS.ORDERS, JSON.stringify([]));
    }
  }
  if (!localStorage.getItem(LS_KEYS.ORDER_DETAILS)) {
    try {
      const res = await fetch("json/order_details.json");
      const data = await res.json();
      localStorage.setItem(LS_KEYS.ORDER_DETAILS, JSON.stringify(data));
      console.log("✅ Đã load order_details.json lên localStorage");
    } catch (err) {
      console.error("❌ Không thể load json/order_details.json:", err);
      localStorage.setItem(LS_KEYS.ORDER_DETAILS, JSON.stringify([]));
    }
  }
}

function getOrCreateOrders_Order_DetailForCurrentUser() {
  const user = JSON.parse(localStorage.getItem(LS_KEYS.CURRENT_USER) || "null");
  if (!user) return null;

  let allOrders = JSON.parse(localStorage.getItem(LS_KEYS.ORDERS) || "[]");
  let userOrders = allOrders.filter((order) => order.user_id === user.id);
  let allOrderDetails = JSON.parse(
    localStorage.getItem(LS_KEYS.ORDER_DETAILS) || "[]"
  );
  let userOrderDetails = allOrderDetails.filter((detail) =>
    userOrders.some((order) => order.id === detail.order_id)
  );

  if (userOrders.length === 0) {
    userOrders = [];
    userOrderDetails = [];
  }

  localStorage.setItem(LS_KEYS.ORDERS_USER, JSON.stringify(userOrders));
  localStorage.setItem(
    LS_KEYS.ORDERS_DETAILS_USER,
    JSON.stringify(userOrderDetails)
  );

  return { userOrders, userOrderDetails };
}

function saveCarts(carts) {
  localStorage.setItem(LS_KEYS.CARTS, JSON.stringify(carts));
}

function getOrCreateAddressesForCurrentUser() {
  const user = JSON.parse(localStorage.getItem(LS_KEYS.CURRENT_USER) || "null");
  if (!user) return null;

  let allAddresses = JSON.parse(
    localStorage.getItem(LS_KEYS.ALL_ADDRESSES) || "[]"
  );
  let userAddresses = allAddresses.filter(
    (address) => address.user_id === user.id
  );

  if (userAddresses.length > 0) {
    wrteUserAddresses(userAddresses);
    return userAddresses;
  }

  console.log(`📭 Không tìm thấy địa chỉ cho người dùng ${user.id}`);
  wrteUserAddresses([]);
  return [];
}

function getOrCreateCartForCurrentUser() {
  const user = JSON.parse(localStorage.getItem(LS_KEYS.CURRENT_USER) || "null");
  if (!user) return null;

  let carts = JSON.parse(localStorage.getItem(LS_KEYS.CARTS) || "[]");
  let cart = carts.find((c) => c.user_id === user.id);

  if (cart) {
    if (!Array.isArray(cart.items)) cart.items = [];
    writeUserCartItems(user.id, cart.items);
    return cart;
  }

  cart = {
    id: genId(),
    user_id: user.id,
    status: "ACTIVE",
    items: [],
  };
  carts.push(cart);
  saveCarts(carts);
  writeUserCartItems(user.id, cart.items);
  return cart;
}

// ====== AUTH MODAL FUNCTIONALITY ======
function initAuthModal() {
  const modal = document.getElementById("auth-modal");
  const accountBtn = document.getElementById("account-btn");
  const closeBtn = document.getElementById("auth-close");
  const showRegister = document.getElementById("show-register");
  const showLogin = document.getElementById("show-login");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const authTitle = document.getElementById("auth-title");

  // Show modal when clicking account button (only if not logged in)
  accountBtn.addEventListener("click", (e) => {
    const currentUser = JSON.parse(
      localStorage.getItem(LS_KEYS.CURRENT_USER) || "null"
    );
    if (!currentUser) {
      e.preventDefault();
      showModal("login");
    }
    // If user is logged in, let the default link behavior happen (go to profile.html)
  });

  // Close modal
  closeBtn.addEventListener("click", hideModal);

  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      hideModal();
    }
  });

  // Switch between login and register
  showRegister.addEventListener("click", (e) => {
    e.preventDefault();
    switchForm("register");
  });

  showLogin.addEventListener("click", (e) => {
    e.preventDefault();
    switchForm("login");
  });

  // Password toggle functionality
  document.querySelectorAll(".toggle-pw").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "🙈";
      } else {
        input.type = "password";
        btn.textContent = "👁️";
      }
    });
  });

  // Form submissions
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document
    .getElementById("registerForm")
    .addEventListener("submit", handleRegister);

  function showModal(type) {
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
    switchForm(type);
  }

  function hideModal() {
    modal.classList.remove("show");
    document.body.style.overflow = "";
    clearErrors();
  }

  function switchForm(type) {
    if (type === "login") {
      authTitle.textContent = "Đăng nhập";
      loginForm.classList.add("active");
      registerForm.classList.remove("active");
    } else {
      authTitle.textContent = "Đăng ký";
      loginForm.classList.remove("active");
      registerForm.classList.add("active");
    }
    clearErrors();
  }

  function clearErrors() {
    document
      .querySelectorAll(".err")
      .forEach((el) => el.classList.remove("show"));
    document
      .querySelectorAll(".success")
      .forEach((el) => el.classList.remove("show"));
  }

  function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
    errorEl.classList.add("show");
  }

  function showSuccess(elementId, message) {
    const successEl = document.getElementById(elementId);
    successEl.textContent = message;
    successEl.classList.add("show");
  }

  async function handleLogin(e) {
    e.preventDefault();
    clearErrors();

    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    const rememberMe = document.getElementById("remember-me").checked;

    if (!username || !password) {
      showError("login-error", "Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    // Get users from localStorage (đồng bộ với login.js)
    const users = JSON.parse(localStorage.getItem(LS_KEYS.USERS) || "[]");

    // Find user by username (không email như login.js)
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      showError("login-error", "Sai tên đăng nhập hoặc mật khẩu!");
      return;
    }

    // Save current user (đồng bộ với login.js)
    localStorage.setItem(
      LS_KEYS.CURRENT_USER,
      JSON.stringify({
        password: user.password,
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
        email: user.email,
      })
    );

    console.log("Đã đăng nhập với tài khoản:", user.username);

    // Load orders và tạo dữ liệu cho user (đồng bộ với login.js)
    try {
      await loadOrdersToLocalStorage();
      await getOrCreateOrders_Order_DetailForCurrentUser();
      getOrCreateCartForCurrentUser();
      getOrCreateAddressesForCurrentUser();
    } catch (error) {
      console.error("Error loading user data:", error);
    }

    // Update UI
    updateAccountDisplay();
    hideModal();

    // Show success message
    alert("Đăng nhập thành công!");
  }

  function handleRegister(e) {
    e.preventDefault();
    clearErrors();

    const fullname = document.getElementById("reg-fullname").value.trim();
    const username = document.getElementById("reg-username").value.trim();
    const phone = document.getElementById("reg-phone").value.trim();
    const password = document.getElementById("reg-password").value;
    const confirmPassword = document.getElementById(
      "reg-confirm-password"
    ).value;

    // Validation
    if (!fullname || !username || !phone || !password || !confirmPassword) {
      showError("register-error", "Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (password !== confirmPassword) {
      showError("register-error", "Mật khẩu xác nhận không khớp!");
      return;
    }

    if (password.length < 6) {
      showError("register-error", "Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    // Check if username or email already exists
    const users = JSON.parse(localStorage.getItem(LS_KEYS.USERS) || "[]");

    if (users.find((u) => u.username === username)) {
      showError("register-error", "Tên đăng nhập đã tồn tại!");
      return;
    }
    if (!isValidPhone(phone)) {
      showError("register-error", "Số điện thoại không hợp lệ!");
      return;
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      fullname,
      username,
      phone,
      password,
      status: true,
      role: "customer",
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(LS_KEYS.USERS, JSON.stringify(users));

    showSuccess(
      "register-success",
      "Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ."
    );

    // Clear form
    document.getElementById("registerForm").reset();

    // Switch to login form after 2 seconds
    setTimeout(() => {
      switchForm("login");
    }, 2000);
  }

  function updateAccountDisplay() {
    const currentUser = JSON.parse(
      localStorage.getItem(LS_KEYS.CURRENT_USER) || "null"
    );

    const accountBtn = document.getElementById("account-btn");
    const accountName = document.getElementById("account-name");

    if (currentUser) {
      // User đã đăng nhập - chuyển thành link đến profile
      accountName.textContent = currentUser.full_name || currentUser.username;
      accountBtn.href = "profile.html";
      accountBtn.onclick = null; // Xóa event click modal
    } else {
      // User chưa đăng nhập - hiển thị modal
      accountName.textContent = "Tài khoản";
      accountBtn.href = "#";
      // Event click được add ở initAuthModal()
    }
  }

  // Update account display on page load
  updateAccountDisplay();
}
function isValidPhone(phone) {
  // Remove spaces and dashes for validation
  const cleanPhone = phone.replace(/[\s-]/g, "");
  // Vietnamese phone number format: 10 digits starting with 0
  const phoneRegex = /^0[3|5|7|8|9][0-9]{8}$/;
  return phoneRegex.test(cleanPhone);
}
// Update cart badge function
function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;

  const cart = JSON.parse(localStorage.getItem("cart_user1") || "[]");
  const totalQuantity = cart.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );
  badge.textContent = totalQuantity;
}

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const authModal = document.getElementById("auth-modal");
    const bookModal = document.getElementById("book-details-modal");

    if (authModal && authModal.classList.contains("show")) {
      authModal.classList.remove("show");
      document.body.style.overflow = "";
    }

    if (bookModal && bookModal.classList.contains("show")) {
      bookModal.classList.remove("show");
      document.body.style.overflow = "";
    }
  }
});

// ====== BOOK DETAILS MODAL FUNCTIONALITY ======
function initBookDetailsModal() {
  const modal = document.getElementById("book-details-modal");
  if (!modal) return;

  const closeBtn = document.getElementById("book-details-close");

  // Close modal
  closeBtn.addEventListener("click", hideBookModal);

  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      hideBookModal();
    }
  });

  function hideBookModal() {
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }

  function hideBookModal() {
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }

  // Modal is now ready - global function is already defined above
  console.log("Book details modal initialized successfully");
}

// Global function to show book details modal (wrapper for compatibility)
window.showBookDetailsModal = async function (bookId) {
  console.log("Global showBookDetailsModal called with ID:", bookId);

  // Make sure data is loaded
  await initBooksData();
  await loadCategories();

  // Find the book
  const books = JSON.parse(localStorage.getItem("BOOKS") || "[]");
  const book = books.find((book) => String(book.id) === String(bookId));

  if (!book) {
    console.error("Book not found for ID:", bookId);
    alert("Không tìm thấy thông tin sách!");
    return;
  }

  // Show modal
  const modal = document.getElementById("book-details-modal");
  if (!modal) {
    console.error("Book details modal not found in DOM");
    return;
  }

  // Render book details
  renderModalBookDetails(book);

  // Show modal
  modal.classList.add("show");
  document.body.style.overflow = "hidden";

  console.log("Modal shown successfully for book:", book.title);
};

// Helper functions for modal rendering
function renderModalBookDetails(book) {
  console.log("Rendering modal for book:", book);

  // Render gallery
  renderModalGallery(book);

  // Render price and title
  renderModalPrice(book);

  // Render info table
  renderModalInfoTable(book);

  // Render description
  const descElement = document.getElementById("modal-book-desc");
  if (descElement) {
    descElement.textContent = book.description || "Chưa có mô tả chi tiết.";
  }

  // Setup action buttons
  const addBtn = document.getElementById("modal-btn-add");
  const buyBtn = document.getElementById("modal-btn-buy");

  if (addBtn) {
    addBtn.onclick = (e) => {
      e.preventDefault();
      console.log("Add to cart clicked for book:", book.id);
      addToCartFromModal(book.id, 1);
    };
  }

  if (buyBtn) {
    buyBtn.onclick = (e) => {
      e.preventDefault();
      console.log("Buy now clicked for book:", book.id);
      buyNowFromModal(book.id, 1);
    };
  }
}

function renderModalGallery(book) {
  const mainImg = document.getElementById("modal-main-img");
  const thumbs = document.getElementById("modal-thumbs");

  if (!mainImg || !thumbs) {
    console.error("Gallery elements not found");
    return;
  }

  const imgs = [book.image_url, ...(book.images || [])].filter(Boolean);

  mainImg.src = imgs[0] || "https://via.placeholder.com/400x600?text=Book";
  mainImg.alt = book.title || "Book cover";

  thumbs.innerHTML = "";
  const maxShow = 5;

  imgs.slice(0, maxShow).forEach((src, idx) => {
    const thumbDiv = document.createElement("div");
    thumbDiv.className = "thumb-item" + (idx === 0 ? " active" : "");
    thumbDiv.innerHTML = `<img src="${src}" alt="Ảnh ${
      idx + 1
    }" loading="lazy">`;

    thumbDiv.addEventListener("click", () => {
      document
        .querySelector("#modal-thumbs .thumb-item.active")
        ?.classList.remove("active");
      thumbDiv.classList.add("active");
      mainImg.src = src;
    });

    thumbs.appendChild(thumbDiv);
  });

  console.log("Gallery rendered with", imgs.length, "images");
}

function renderModalPrice(book) {
  const priceContainer = document.getElementById("modal-book-price");

  if (!priceContainer) {
    console.error("Price container not found");
    return;
  }

  const fmt = (n) => (n || 0).toLocaleString("vi-VN") + "đ";

  priceContainer.innerHTML = `
    <h1>${book.title || "Không có tên"}</h1>
    <div class="book-price-display">
      <span class="book-current-price">${fmt(book.price)}</span>
      ${
        book.original_price && book.original_price > book.price
          ? `<span class="book-original-price">${fmt(
              book.original_price
            )}</span>`
          : ""
      }
    </div>
  `;

  console.log("Price rendered for:", book.title, "- Price:", fmt(book.price));
}

function renderModalInfoTable(book) {
  const getCategoryNames = (categoryIds) => {
    if (!categoryIds || !Array.isArray(categoryIds)) return "—";

    try {
      const categories = JSON.parse(localStorage.getItem("CATEGORIES") || "[]");
      const categoryNames = categoryIds
        .map((id) => {
          const category = categories.find((cat) => cat.id === id);
          return category ? category.display_name : null;
        })
        .filter(Boolean);

      return categoryNames.length > 0 ? categoryNames.join(", ") : "—";
    } catch (error) {
      console.error("Error getting category names:", error);
      return "—";
    }
  };

  const infoMap = [
    ["Mã hàng", book.sku || book.id],
    ["Thể loại", getCategoryNames(book.category_ids)],
    ["Tác giả", (book.authors || []).join(", ") || "—"],
    ["NXB", book.publisher || "—"],
    ["Năm XB", book.publish_year || "—"],
    ["Kích thước", book.size || "—"],
    ["Số trang", book.pages || "—"],
    ["Trọng lượng", book.weight || "—"],
  ];

  const infoList = document.getElementById("modal-info-list");
  if (!infoList) {
    console.error("Info list element not found");
    return;
  }

  infoList.innerHTML = "";

  infoMap.forEach(([key, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = key;
    const dd = document.createElement("dd");
    dd.textContent = value || "—";
    infoList.append(dt, dd);
  });
}

function addToCartFromModal(bookId, qty) {
  if (!localStorage.getItem(LS_KEYS.CURRENT_USER)) {
    alert("Bạn cần đăng nhập để thêm vào giỏ!");
    const modal = document.getElementById("book-details-modal");
    if (modal) modal.classList.remove("show");
    document.body.style.overflow = "";

    const authModal = document.getElementById("auth-modal");
    if (authModal) authModal.classList.add("show");
    return;
  }

  const cart = JSON.parse(localStorage.getItem("cart_user1") || "[]");
  const existingItem = cart.find(
    (item) => String(item.bookId) === String(bookId)
  );

  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 0) + qty;
  } else {
    cart.push({ bookId, quantity: qty, selected: true });
  }

  localStorage.setItem("cart_user1", JSON.stringify(cart));
  updateCartBadge();

  const modal = document.getElementById("book-details-modal");
  if (modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }

  alert("Đã thêm vào giỏ hàng!");
}

function buyNowFromModal(bookId, qty) {
  if (!localStorage.getItem(LS_KEYS.CURRENT_USER)) {
    alert("Bạn cần đăng nhập để mua hàng!");
    const modal = document.getElementById("book-details-modal");
    if (modal) modal.classList.remove("show");
    document.body.style.overflow = "";

    const authModal = document.getElementById("auth-modal");
    if (authModal) authModal.classList.add("show");
    return;
  }

  const cart = JSON.parse(localStorage.getItem("cart_user1") || "[]");

  // Bỏ chọn tất cả sản phẩm hiện có
  cart.forEach((item) => {
    item.selected = false;
  });

  // Thêm hoặc cập nhật sản phẩm muốn mua
  const existingItem = cart.find(
    (item) => String(item.bookId) === String(bookId)
  );
  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 0) + qty;
    existingItem.selected = true;
  } else {
    cart.push({ bookId, quantity: qty, selected: true });
  }

  localStorage.setItem("cart_user1", JSON.stringify(cart));
  updateCartBadge();

  const modal = document.getElementById("book-details-modal");
  if (modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }

  // Redirect to cart
  window.location.href = "cart.html";
}

// Initialize book details modal after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    console.log("Initializing book details modal...");

    // Check if book data is available
    const books = JSON.parse(localStorage.getItem("BOOKS") || "[]");
    const categories = JSON.parse(localStorage.getItem("CATEGORIES") || "[]");
    console.log("Books available:", books.length);
    console.log("Categories available:", categories.length);

    initBookDetailsModal();

    // Also update cart badge on page load
    updateCartBadge();
  }, 200);
});
