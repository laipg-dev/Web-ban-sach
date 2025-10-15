const LS_KEYS = {
  USERS: "USERS",
  CURRENT_USER: "currentUser",
  CART: "cart_user",
  CARTS: "carts",
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
    window.location.href = "login.html";
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

  BOOKS = JSON.parse(localStorage.getItem("BOOKS") || "[]");

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
  // Chuyển đến trang chi tiết với id sách
  window.location.href = `viewBookDetails.html?id=${bookId}`;
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
});
