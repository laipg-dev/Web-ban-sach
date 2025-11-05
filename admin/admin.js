// Mã JavaScript Quản trị viên
// ====== STORAGE KEYS CHUẨN DÙNG CHUNG ======
const STORAGE_KEYS = {
  USERS: "USERS",
  BOOKS: "BOOKS",
  CATEGORIES: "CATEGORIES",
  ORDERS: "orders",
  ORDER_DETAILS: "order_details",
  ADDRESSES: "ALL_ADDRESSES",
  IMPORTS: "imports",
  INVENTORY_TRANSACTIONS: "inventory_transactions",
  PROFIT_MARGINS: "profit_margins",
};

// ====== Hàm chuẩn hóa key ======
function normalizeKey(key) {
  const aliases = {
    books: STORAGE_KEYS.BOOKS,
    BOOKS: STORAGE_KEYS.BOOKS,
    admin_books: STORAGE_KEYS.BOOKS,
    users: STORAGE_KEYS.USERS,
    admin_users: STORAGE_KEYS.USERS,
    categories: STORAGE_KEYS.CATEGORIES,
    admin_categories: STORAGE_KEYS.CATEGORIES,
    orders: STORAGE_KEYS.ORDERS,
    admin_orders: STORAGE_KEYS.ORDERS,
    order_details: STORAGE_KEYS.ORDER_DETAILS,
    admin_order_details: STORAGE_KEYS.ORDER_DETAILS,
    ALL_ADDRESSES: STORAGE_KEYS.ADDRESSES,
    addresses: STORAGE_KEYS.ADDRESSES,
    admin_addresses: STORAGE_KEYS.ADDRESSES,
    imports: STORAGE_KEYS.IMPORTS,
    admin_imports: STORAGE_KEYS.IMPORTS,
    inventory_transactions: STORAGE_KEYS.INVENTORY_TRANSACTIONS,
    admin_inventory_transactions: STORAGE_KEYS.INVENTORY_TRANSACTIONS,
    profit_margins: STORAGE_KEYS.PROFIT_MARGINS,
    admin_profit_margins: STORAGE_KEYS.PROFIT_MARGINS,
  };
  return aliases[key] || key;
}

// Hằng số - Ảnh mặc định cho sản phẩm
const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop";

// Lưu trữ dữ liệu
let users = [];
let books = [];
let categories = [];
let orders = [];
let orderDetails = [];
let addresses = [];
let imports = [];
let profitMargins = [];
let inventoryTransactions = [];

// Người dùng quản trị hiện tại
let currentAdmin = null;

// Khởi tạo
document.addEventListener("DOMContentLoaded", async function () {
  // Kiểm tra xác thực
  const adminUser = localStorage.getItem("adminUser");
  if (adminUser) {
    // Đã đăng nhập, hiển thị dashboard
    currentAdmin = JSON.parse(adminUser);
    showDashboard();
  } else {
    // Hiển thị trang đăng nhập
    showLogin();
  }

  // Thiết lập form đăng nhập
  document
    .getElementById("admin-login-form")
    .addEventListener("submit", handleLogin);
});

// Hiển thị trang đăng nhập
function showLogin() {
  document.getElementById("loginPage").style.display = "flex";
  document.getElementById("adminPage").style.display = "none";
}

// Hiển thị dashboard
async function showDashboard() {
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("adminPage").style.display = "block";

  document.getElementById("admin-name").textContent = currentAdmin.full_name;
  document.getElementById(
    "welcome-text"
  ).textContent = `Xin chào, ${currentAdmin.full_name}`;

  // Tải tất cả dữ liệu
  await loadAllData();

  // Thiết lập các lắng nghe sự kiện
  setupEventListeners();

  // Tải dashboard
  loadDashboard();
}

// Xử lý đăng nhập
async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById("error-message");

  try {
    const response = await fetch("../json/users.json");
    const usersData = await response.json();

    const admin = usersData.find(
      (u) =>
        u.username === username &&
        u.password === password &&
        u.role === "admin" &&
        u.status === true
    );

    if (admin) {
      currentAdmin = admin;
      localStorage.setItem("adminUser", JSON.stringify(admin));
      showDashboard();
    } else {
      errorDiv.textContent =
        "Tên đăng nhập hoặc mật khẩu không đúng, hoặc tài khoản không có quyền quản trị!";
      errorDiv.style.display = "block";
    }
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    errorDiv.textContent = "Có lỗi xảy ra. Vui lòng thử lại!";
    errorDiv.style.display = "block";
  }
}

// Tải tất cả dữ liệu từ các file JSON
async function loadAllData() {
  try {
    // Kiểm tra localStorage trước, nếu có thì ưu tiên dùng localStorage
    const localBooks = localStorage.getItem('admin_books') || localStorage.getItem('BOOKS');
    const localCategories = localStorage.getItem('admin_categories') || localStorage.getItem('CATEGORIES');
    const localUsers = localStorage.getItem('admin_users') || localStorage.getItem('USERS');
    const localOrders = localStorage.getItem('admin_orders') || localStorage.getItem('orders');
    const localOrderDetails = localStorage.getItem('admin_order_details') || localStorage.getItem('order_details');
    const localAddresses = localStorage.getItem('admin_addresses') || localStorage.getItem('ALL_ADDRESSES');
    
    if (localBooks && localCategories && localUsers) {
      // Nếu đã có dữ liệu trong localStorage, dùng nó
      books = JSON.parse(localBooks);
      categories = JSON.parse(localCategories);
      users = JSON.parse(localUsers);
      orders = localOrders ? JSON.parse(localOrders) : [];
      orderDetails = localOrderDetails ? JSON.parse(localOrderDetails) : [];
      addresses = localAddresses ? JSON.parse(localAddresses) : [];
      
      // Đồng bộ sang cả 2 key (admin_ và user key)
      saveData('books', books);
      saveData('categories', categories);
      saveData('users', users);
      saveData('orders', orders);
      saveData('order_details', orderDetails);
      saveData('addresses', addresses);
      
      console.log('✅ Đã tải dữ liệu từ localStorage và đồng bộ');
    } else {
      // Nếu chưa có, load từ JSON file và lưu vào localStorage
      const [usersRes, booksRes, categoriesRes, ordersRes, orderDetailsRes, addressesRes] = await Promise.all([
        fetch('../json/users.json'),
        fetch('../json/books.json'),
        fetch('../json/categories.json'),
        fetch('../json/orders.json'),
        fetch('../json/order_details.json'),
        fetch('../json/addresses.json')
      ]);
      
      users = await usersRes.json();
      books = await booksRes.json();
      categories = await categoriesRes.json();
      orders = await ordersRes.json();
      orderDetails = await orderDetailsRes.json();
      addresses = await addressesRes.json();
      
      // Lưu vào localStorage lần đầu (sẽ tự động đồng bộ sang user)
      saveData('books', books);
      saveData('categories', categories);
      saveData('users', users);
      saveData('orders', orders);
      saveData('order_details', orderDetails);
      saveData('addresses', addresses);
      console.log('✅ Đã tải từ JSON files và lưu vào localStorage');
    }
    
    // Tải hoặc khởi tạo dữ liệu bổ sung
    await loadImports();
    await loadProfitMargins();
    await loadInventoryTransactions();
    
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu:', error);
    alert('Có lỗi khi tải dữ liệu!');
  }
}

// Tải dữ liệu nhập hàng
async function loadImports() {
  try {
    const response = await fetch("../json/imports.json");
    imports = await response.json();
  } catch (error) {
    imports = [];
    console.log("Không tìm thấy dữ liệu nhập hàng, khởi tạo mảng rỗng");
  }
}

// Tải dữ liệu tỷ lệ lợi nhuận
async function loadProfitMargins() {
  try {
    const response = await fetch("../json/profit_margins.json");
    profitMargins = await response.json();
  } catch (error) {
    // Khởi tạo tỷ lệ mặc định cho mỗi loại sản phẩm
    profitMargins = categories.map((cat) => ({
      category_id: cat.id,
      default_margin: 20,
      product_margins: {},
    }));
    console.log(
      "Không tìm thấy dữ liệu tỷ lệ lợi nhuận, khởi tạo giá trị mặc định"
    );
  }
}

// Tải dữ liệu giao dịch tồn kho
async function loadInventoryTransactions() {
  try {
    const response = await fetch("../json/inventory_transactions.json");
    inventoryTransactions = await response.json();
  } catch (error) {
    inventoryTransactions = [];
    console.log("Không tìm thấy dữ liệu giao dịch tồn kho, khởi tạo mảng rỗng");
  }
}

// Thiết lập các lắng nghe sự kiện
function setupEventListeners() {
  // Điều hướng menu
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", function () {
      const section = this.dataset.section;
      navigateToSection(section);
    });
  });

  // Lắng nghe sự kiện tìm kiếm và lọc
  document
    .getElementById("search-users")
    ?.addEventListener("input", filterUsers);
  document
    .getElementById("filter-user-status")
    ?.addEventListener("change", filterUsers);

  document
    .getElementById("search-products")
    ?.addEventListener("input", filterProducts);
  document
    .getElementById("filter-product-category")
    ?.addEventListener("change", filterProducts);
  document
    .getElementById("filter-product-status")
    ?.addEventListener("change", filterProducts);

  document
    .getElementById("search-imports")
    ?.addEventListener("input", filterImports);
  document
    .getElementById("filter-import-status")
    ?.addEventListener("change", filterImports);

  document
    .getElementById("search-pricing")
    ?.addEventListener("input", filterPricing);
  document
    .getElementById("filter-pricing-category")
    ?.addEventListener("change", filterPricing);

  // Gửi form
  document
    .getElementById("categoryForm")
    ?.addEventListener("submit", saveCategory);
  document
    .getElementById("productForm")
    ?.addEventListener("submit", saveProduct);
  document.getElementById("importForm")?.addEventListener("submit", saveImport);
}

// Điều hướng
function navigateToSection(section) {
  // Cập nhật menu
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.classList.remove("active");
  });
  document.querySelector(`[data-section="${section}"]`).classList.add("active");

  // Cập nhật nội dung
  document.querySelectorAll(".content-section").forEach((sec) => {
    sec.classList.remove("active");
  });
  document.getElementById(section).classList.add("active");

  // Cập nhật tiêu đề
  const titles = {
    dashboard: "Tổng quan",
    users: "Quản lý người dùng",
    categories: "Quản lý loại sản phẩm",
    products: "Quản lý sản phẩm",
    imports: "Quản lý nhập hàng",
    pricing: "Quản lý giá bán",
    orders: "Quản lý đơn hàng",
    inventory: "Quản lý tồn kho",
  };
  document.getElementById("page-title").textContent = titles[section];

  // Tải dữ liệu phần
  switch (section) {
    case "dashboard":
      loadDashboard();
      break;
    case "users":
      loadUsers();
      break;
    case "categories":
      loadCategories();
      break;
    case "products":
      loadProducts();
      break;
    case "imports":
      loadImportsTable();
      break;
    case "pricing":
      loadPricing();
      break;
    case "orders":
      loadOrders();
      break;
    case "inventory":
      loadInventory();
      break;
  }
}

// Dashboard
function loadDashboard() {
  // Thống kê
  const activeUsers = users.filter(
    (u) => u.role === "customer" && u.status
  ).length;
  document.getElementById("total-users").textContent = activeUsers;

  const activeProducts = books.filter((b) => b.status).length;
  document.getElementById("total-products").textContent = activeProducts;

  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  document.getElementById("pending-orders").textContent = pendingOrders;

  const lowStockProducts = books.filter((b) => b.stock < 10 && b.status).length;
  document.getElementById("low-stock").textContent = lowStockProducts;

  // Đơn hàng gần đây
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const tbody = document.querySelector("#recent-orders-table tbody");
  tbody.innerHTML = recentOrders
    .map((order) => {
      const user = users.find((u) => u.id === order.user_id);
      return `
            <tr>
                <td>#${order.id}</td>
                <td>${user?.full_name || "N/A"}</td>
                <td>${formatDate(order.created_at)}</td>
                <td>${formatCurrency(order.total_amount)}</td>
                <td>${getOrderStatusBadge(order.status)}</td>
            </tr>
        `;
    })
    .join("");

  // Cảnh báo sắp hết hàng
  const lowStockBooks = books.filter((b) => b.stock < 10 && b.status);
  const alertsDiv = document.getElementById("low-stock-alerts");
  if (lowStockBooks.length === 0) {
    alertsDiv.innerHTML = "<p>Không có sản phẩm nào sắp hết hàng.</p>";
  } else {
    alertsDiv.innerHTML = lowStockBooks
      .map(
        (book) => `
            <div class="alert alert-warning">
                <strong>${book.title}</strong> - Còn lại: ${book.stock} sản phẩm
            </div>
        `
      )
      .join("");
  }
}

// Quản lý Người dùng
function loadUsers() {
  filterUsers();
}

function filterUsers() {
  const searchTerm =
    document.getElementById("search-users")?.value.toLowerCase() || "";
  const statusFilter =
    document.getElementById("filter-user-status")?.value || "";

  let filteredUsers = users.filter((u) => u.role === "customer");

  if (searchTerm) {
    filteredUsers = filteredUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(searchTerm) ||
        u.full_name.toLowerCase().includes(searchTerm) ||
        u.phone.includes(searchTerm)
    );
  }

  if (statusFilter !== "") {
    filteredUsers = filteredUsers.filter(
      (u) => u.status.toString() === statusFilter
    );
  }

  const tbody = document.querySelector("#users-table tbody");
  tbody.innerHTML = filteredUsers
    .map(
      (user) => `
        <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.full_name}</td>
            <td>${user.phone}</td>
            <td><span class="badge badge-info">${user.role}</span></td>
            <td>${
              user.status
                ? '<span class="badge badge-success">Hoạt động</span>'
                : '<span class="badge badge-danger">Đã khóa</span>'
            }</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="resetPassword(${
                  user.id
                })">Reset MK</button>
                <button class="btn btn-sm ${
                  user.status ? "btn-danger" : "btn-success"
                }" 
                    onclick="toggleUserStatus(${user.id})">
                    ${user.status ? "Khóa" : "Mở khóa"}
                </button>
            </td>
        </tr>
    `
    )
    .join("");
}

function resetPassword(userId) {
  if (confirm('Bạn có chắc muốn reset mật khẩu về "123456"?')) {
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.password = "123456";
      alert("Đã reset mật khẩu thành công! Mật khẩu mới: 123456");
      saveData("users", users);
    }
  }
}

function toggleUserStatus(userId) {
  const user = users.find((u) => u.id === userId);
  if (user) {
    user.status = !user.status;
    loadUsers();
    saveData("users", users);
    alert(`Đã ${user.status ? "mở khóa" : "khóa"} tài khoản thành công!`);
  }
}

// Quản lý Loại sản phẩm
function loadCategories() {
  const tbody = document.querySelector("#categories-table tbody");
  tbody.innerHTML = categories
    .filter((c) => c.id !== 1)
    .map(
      (cat) => `
        <tr>
            <td>${cat.id}</td>
            <td>${cat.name}</td>
            <td>${cat.display_name}</td>
            <td>${cat.description}</td>
            <td>${
              cat.status
                ? '<span class="badge badge-success">Hiển thị</span>'
                : '<span class="badge badge-danger">Ẩn</span>'
            }</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editCategory(${
                  cat.id
                })">Sửa</button>
                <button class="btn btn-sm ${
                  cat.status ? "btn-danger" : "btn-success"
                }" 
                    onclick="toggleCategoryStatus(${cat.id})">
                    ${cat.status ? "Ẩn" : "Hiện"}
                </button>
            </td>
        </tr>
    `
    )
    .join("");
}

function showAddCategoryModal() {
  document.getElementById("categoryModalTitle").textContent =
    "Thêm loại sản phẩm";
  document.getElementById("categoryForm").reset();
  document.getElementById("category-id").value = "";
  document.getElementById("category-status").checked = true;
  openModal("categoryModal");
}

function editCategory(catId) {
  const cat = categories.find((c) => c.id === catId);
  if (cat) {
    document.getElementById("categoryModalTitle").textContent =
      "Sửa loại sản phẩm";
    document.getElementById("category-id").value = cat.id;
    document.getElementById("category-name").value = cat.name;
    document.getElementById("category-display-name").value = cat.display_name;
    document.getElementById("category-description").value = cat.description;
    document.getElementById("category-icon").value = cat.icon || "";
    document.getElementById("category-status").checked = cat.status;
    openModal("categoryModal");
  }
}

function saveCategory(e) {
  e.preventDefault();

  const id = document.getElementById("category-id").value;
  const categoryData = {
    name: document.getElementById("category-name").value,
    display_name: document.getElementById("category-display-name").value,
    description: document.getElementById("category-description").value,
    icon: document.getElementById("category-icon").value,
    status: document.getElementById("category-status").checked,
  };

  if (id) {
    // Cập nhật
    const cat = categories.find((c) => c.id === parseInt(id));
    if (cat) {
      Object.assign(cat, categoryData);
    }
  } else {
    // Thêm mới
    const newId = Math.max(...categories.map((c) => c.id)) + 1;
    categories.push({
      id: newId,
      ...categoryData,
    });
  }

  saveData("categories", categories);
  closeModal("categoryModal");
  loadCategories();
  alert("Đã lưu loại sản phẩm thành công!");
}

function toggleCategoryStatus(catId) {
  const cat = categories.find((c) => c.id === catId);
  if (cat) {
    cat.status = !cat.status;
    saveData("categories", categories);
    loadCategories();
  }
}

// Quản lý Sản phẩm
function loadProducts() {
  // Đổ dữ liệu cho bộ lọc loại sản phẩm
  const categorySelect = document.getElementById("filter-product-category");
  categorySelect.innerHTML =
    '<option value="">Tất cả loại</option>' +
    categories
      .filter((c) => c.id !== 1)
      .map((cat) => `<option value="${cat.id}">${cat.display_name}</option>`)
      .join("");

  filterProducts();
}

function filterProducts() {
  const searchTerm =
    document.getElementById("search-products")?.value.toLowerCase() || "";
  const categoryFilter =
    document.getElementById("filter-product-category")?.value || "";
  const statusFilter =
    document.getElementById("filter-product-status")?.value || "";

  let filteredBooks = [...books];

  if (searchTerm) {
    filteredBooks = filteredBooks.filter(
      (b) =>
        b.title.toLowerCase().includes(searchTerm) ||
        b.authors?.some((a) => a.toLowerCase().includes(searchTerm))
    );
  }

  if (categoryFilter) {
    const catId = parseInt(categoryFilter);
    filteredBooks = filteredBooks.filter((b) =>
      b.category_ids?.includes(catId)
    );
  }

  if (statusFilter !== "") {
    filteredBooks = filteredBooks.filter(
      (b) => b.status.toString() === statusFilter
    );
  }

  const tbody = document.querySelector("#products-table tbody");
  tbody.innerHTML = filteredBooks
    .map((book) => {
      const catNames = book.category_ids
        ?.map((cid) => {
          const cat = categories.find((c) => c.id === cid);
          return cat?.display_name || "";
        })
        .filter((n) => n)
        .join(", ");

      const imgUrl = book.image_url ? `../${book.image_url}` : DEFAULT_PRODUCT_IMAGE;
      return `
            <tr>
                <td>${book.id}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${imgUrl}" alt="${book.title}" 
                             onerror="this.src='${DEFAULT_PRODUCT_IMAGE}'"
                             style="width: 50px; height: 70px; border-radius: 8px; object-fit: cover; border: 2px solid #e0e0e0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <span style="font-weight: 500;">${book.title}</span>
                    </div>
                </td>
                <td>${catNames}</td>
                <td><strong>${formatCurrency(book.price)}</strong></td>
                <td><span class="badge ${
                  book.stock < 10 ? "badge-warning" : "badge-info"
                }">${book.stock}</span></td>
                <td>${
                  book.status
                    ? '<span class="badge badge-success">Đang bán</span>'
                    : '<span class="badge badge-danger">Đã ẩn</span>'
                }</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editProduct(${
                      book.id
                    })">
                        Sửa
                    </button>
                    <button class="btn btn-sm ${
                      book.status ? "btn-danger" : "btn-success"
                    }" 
                        onclick="toggleProductStatus(${book.id})">
                        ${book.status ? "Ẩn" : "Hiện"}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${
                      book.id
                    })" style="background: #dc3545;">
                        Xóa
                    </button>
                </td>
            </tr>
        `;
    })
    .join("");
}

function showAddProductModal() {
  document.getElementById("productModalTitle").textContent = "Thêm sản phẩm";
  document.getElementById("productForm").reset();
  document.getElementById("product-id").value = "";
  document.getElementById("product-status").checked = true;

  // Reset input file
  const fileInput = document.getElementById("product-image-file");
  if (fileInput) {
    fileInput.value = "";
  }

  // Điền sẵn URL ảnh mặc định và hiển thị xem trước
  document.getElementById("product-image").value = DEFAULT_PRODUCT_IMAGE;
  document.getElementById(
    "product-image-preview"
  ).innerHTML = `<img src="${DEFAULT_PRODUCT_IMAGE}" style="width: 100%; height: 100%; object-fit: cover;">`;

  // Tạo checkbox list cho loại sản phẩm
  const catContainer = document.getElementById("product-categories");
  catContainer.innerHTML = categories
    .filter((c) => c.id !== 1)
    .map(
      (cat) =>
        `<div style="margin-bottom: 8px;">
            <label style="display: flex; align-items: center; cursor: pointer; padding: 5px; border-radius: 4px; transition: background 0.2s;" 
                   onmouseover="this.style.background='#e3f2fd'" 
                   onmouseout="this.style.background='transparent'">
                <input type="checkbox" name="product-category" value="${cat.id}" style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                <span style="font-size: 14px;">${cat.display_name}</span>
            </label>
        </div>`
    )
    .join("");

  openModal("productModal");
}

function editProduct(bookId) {
  const book = books.find((b) => b.id === bookId);
  if (book) {
    document.getElementById("productModalTitle").textContent = "Sửa sản phẩm";
    document.getElementById("product-id").value = book.id;
    document.getElementById("product-title").value = book.title;
    document.getElementById("product-price").value = book.price;
    document.getElementById("product-stock").value = book.stock;
    document.getElementById("product-publisher").value = book.publisher || "";
    document.getElementById("product-year").value = book.publish_year || "";
    document.getElementById("product-pages").value = book.pages || "";
    document.getElementById("product-size").value = book.size || "";
    document.getElementById("product-authors").value =
      book.authors?.join(", ") || "";
    document.getElementById("product-image").value = book.image_url || "";
    document.getElementById("product-description").value =
      book.description || "";
    document.getElementById("product-status").checked = book.status;

    // Hiển thị xem trước ảnh
    const imageUrl = book.image_url ? `../${book.image_url}` : DEFAULT_PRODUCT_IMAGE;
    document.getElementById(
      "product-image-preview"
    ).innerHTML = `<img src="${imageUrl}" onerror="this.src='${DEFAULT_PRODUCT_IMAGE}'" style="width: 100%; height: 100%; object-fit: cover;">`;

    // Tạo checkbox list và check các loại đã chọn
    const catContainer = document.getElementById("product-categories");
    catContainer.innerHTML = categories
      .filter((c) => c.id !== 1)
      .map(
        (cat) =>
          `<div style="margin-bottom: 8px;">
                <label style="display: flex; align-items: center; cursor: pointer; padding: 5px; border-radius: 4px; transition: background 0.2s;" 
                       onmouseover="this.style.background='#e3f2fd'" 
                       onmouseout="this.style.background='transparent'">
                    <input type="checkbox" name="product-category" value="${
                      cat.id
                    }" 
                           ${
                             book.category_ids?.includes(cat.id)
                               ? "checked"
                               : ""
                           } 
                           style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                    <span style="font-size: 14px;">${cat.display_name}</span>
                </label>
            </div>`
      )
      .join("");

    openModal("productModal");
  }
}

// Xem trước ảnh từ URL
function previewProductImage() {
  const imageUrl = document.getElementById("product-image").value;
  const preview = document.getElementById("product-image-preview");

  if (imageUrl) {
    // Nếu là đường dẫn local (img/...), thêm ../ để load từ thư mục admin
    const finalUrl = imageUrl.startsWith('img/') ? `../${imageUrl}` : imageUrl;
    preview.innerHTML = `<img src="${finalUrl}" onerror="this.src='${DEFAULT_PRODUCT_IMAGE}'; this.parentElement.style.border='2px solid #e74c3c';" style="width: 100%; height: 100%; object-fit: cover;">`;
  } else {
    preview.innerHTML = `<img src="${DEFAULT_PRODUCT_IMAGE}" style="width: 100%; height: 100%; object-fit: cover;">`;
  }
}

// Xử lý tải lên file ảnh
function handleProductImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    // Kiểm tra loại file
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh!");
      return;
    }

    // Kiểm tra kích thước file (tối đa 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước file không được vượt quá 5MB!");
      return;
    }

    // Đọc và chuyển đổi sang base64
    const reader = new FileReader();
    reader.onload = function (e) {
      const base64Image = e.target.result;
      document.getElementById("product-image").value = base64Image;
      document.getElementById(
        "product-image-preview"
      ).innerHTML = `<img src="${base64Image}" style="width: 100%; height: 100%; object-fit: cover;">`;
    };
    reader.readAsDataURL(file);
  }
}

// Hàm sử dụng ảnh mặc định
function useDefaultImage() {
  document.getElementById("product-image").value = DEFAULT_PRODUCT_IMAGE;
  document.getElementById(
    "product-image-preview"
  ).innerHTML = `<img src="${DEFAULT_PRODUCT_IMAGE}" style="width: 100%; height: 100%; object-fit: cover;">`;
  // Reset file input
  const fileInput = document.getElementById("product-image-file");
  if (fileInput) {
    fileInput.value = "";
  }
}

function saveProduct(e) {
  e.preventDefault();

  const id = document.getElementById("product-id").value;
  // Lấy các checkbox đã chọn
  const selectedCategories = Array.from(
    document.querySelectorAll('input[name="product-category"]:checked')
  ).map((cb) => parseInt(cb.value));
  const authors = document
    .getElementById("product-authors")
    .value.split(",")
    .map((a) => a.trim())
    .filter((a) => a);

  const productData = {
    title: document.getElementById("product-title").value,
    price: parseInt(document.getElementById("product-price").value),
    stock: parseInt(document.getElementById("product-stock").value),
    publisher: document.getElementById("product-publisher").value,
    publish_year:
      parseInt(document.getElementById("product-year").value) || null,
    pages: parseInt(document.getElementById("product-pages").value) || null,
    authors: authors,
    category_ids: selectedCategories,
    image_url:
      document.getElementById("product-image").value || DEFAULT_PRODUCT_IMAGE,
    images: [], // Mảng ảnh phụ, mặc định rỗng
    size: document.getElementById("product-size")?.value || "14 x 20.5 cm", // Kích thước mặc định
    description: document.getElementById("product-description").value,
    status: document.getElementById("product-status").checked,
    updated_at: new Date().toISOString(),
  };

  console.log("Product data:", productData);

  if (id) {
    // Cập nhật
    const book = books.find((b) => b.id === parseInt(id));
    if (book) {
      Object.assign(book, productData);
      console.log("Đã cập nhật sản phẩm:", book);
    }
  } else {
    // Thêm mới
    const newId =
      books.length > 0 ? Math.max(...books.map((b) => b.id)) + 1 : 1;
    const newBook = {
      id: newId,
      ...productData,
      created_at: new Date().toISOString(),
    };
    books.push(newBook);
    console.log("Đã thêm sản phẩm mới:", newBook);
    console.log("Tổng số sản phẩm:", books.length);
  }

  saveData("books", books);
  closeModal("productModal");
  loadProducts();
  alert("Đã lưu sản phẩm thành công!");
}

function toggleProductStatus(bookId) {
  const book = books.find((b) => b.id === bookId);
  if (book) {
    book.status = !book.status;
    book.updated_at = new Date().toISOString();
    saveData("books", books);
    loadProducts();
  }
}

// Xóa sản phẩm
function deleteProduct(bookId) {
  const book = books.find((b) => b.id === bookId);
  if (
    book &&
    confirm(
      `Bạn có chắc muốn xóa sản phẩm "${book.title}"?\n\nLưu ý: Hành động này không thể hoàn tác!`
    )
  ) {
    // Xóa sản phẩm khỏi mảng
    books = books.filter((b) => b.id !== bookId);
    saveData("books", books);
    loadProducts();
    alert("✅ Đã xóa sản phẩm thành công!");
  }
}

// Quản lý Nhập hàng
function loadImportsTable() {
  filterImports();
}

function filterImports() {
  const searchTerm =
    document.getElementById("search-imports")?.value.toLowerCase() || "";
  const statusFilter =
    document.getElementById("filter-import-status")?.value || "";

  let filteredImports = [...imports];

  if (searchTerm) {
    filteredImports = filteredImports.filter(
      (imp) =>
        imp.id.toString().includes(searchTerm) ||
        imp.note?.toLowerCase().includes(searchTerm)
    );
  }

  if (statusFilter) {
    filteredImports = filteredImports.filter(
      (imp) => imp.status === statusFilter
    );
  }

  const tbody = document.querySelector("#imports-table tbody");
  tbody.innerHTML = filteredImports
    .map((imp) => {
      const total =
        imp.items?.reduce(
          (sum, item) => sum + item.quantity * item.import_price,
          0
        ) || 0;
      return `
            <tr>
                <td>#${imp.id}</td>
                <td>${formatDate(imp.import_date)}</td>
                <td>${formatCurrency(total)}</td>
                <td>${
                  imp.status === "completed"
                    ? '<span class="badge badge-success">Đã hoàn thành</span>'
                    : '<span class="badge badge-warning">Nháp</span>'
                }</td>
                <td>
                    ${
                      imp.status === "draft"
                        ? `<button class="btn btn-sm btn-primary" onclick="editImport(${imp.id})">Sửa</button>
                         <button class="btn btn-sm btn-success" onclick="completeImportById(${imp.id})">Hoàn thành</button>`
                        : '<span class="badge badge-info">Đã hoàn thành</span>'
                    }
                </td>
            </tr>
        `;
    })
    .join("");
}

function showAddImportModal() {
  document.getElementById("importModalTitle").textContent =
    "Tạo phiếu nhập hàng";
  document.getElementById("importForm").reset();
  document.getElementById("import-id").value = "";
  document.getElementById("import-date").value = new Date()
    .toISOString()
    .split("T")[0];
  document.getElementById("import-items-container").innerHTML = "";
  addImportItem();
  openModal("importModal");
}

function editImport(importId) {
  const importRecord = imports.find((i) => i.id === importId);
  if (importRecord && importRecord.status === "draft") {
    document.getElementById("importModalTitle").textContent =
      "Sửa phiếu nhập hàng";
    document.getElementById("import-id").value = importRecord.id;
    document.getElementById("import-date").value = importRecord.import_date;
    document.getElementById("import-note").value = importRecord.note || "";

    document.getElementById("import-items-container").innerHTML = "";
    importRecord.items.forEach((item) => {
      addImportItem(item);
    });

    calculateImportTotal();
    openModal("importModal");
  }
}

function addImportItem(itemData = null) {
  const container = document.getElementById("import-items-container");
  const itemId = Date.now() + Math.random();

  const itemDiv = document.createElement("div");
  itemDiv.className = "import-item";
  itemDiv.innerHTML = `
        <div class="import-item-header">
            <h4>Sản phẩm</h4>
            <button type="button" class="btn btn-sm btn-danger" onclick="removeImportItem(this)">Xóa</button>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label>Sản phẩm</label>
                <select class="import-product" required onchange="calculateImportTotal()">
                    <option value="">Chọn sản phẩm</option>
                    ${books
                      .map(
                        (b) =>
                          `<option value="${b.id}" ${
                            itemData && itemData.product_id === b.id
                              ? "selected"
                              : ""
                          }>${b.title}</option>`
                      )
                      .join("")}
                </select>
            </div>
            <div class="form-group">
                <label>Số lượng</label>
                <input type="number" class="import-quantity" value="${
                  itemData?.quantity || 1
                }" min="1" required onchange="calculateImportTotal()">
            </div>
            <div class="form-group">
                <label>Giá nhập (VNĐ)</label>
                <input type="number" class="import-price" value="${
                  itemData?.import_price || 0
                }" min="0" required onchange="calculateImportTotal()">
            </div>
        </div>
    `;

  container.appendChild(itemDiv);
  calculateImportTotal();
}

function removeImportItem(btn) {
  btn.closest(".import-item").remove();
  calculateImportTotal();
}

function calculateImportTotal() {
  const items = document.querySelectorAll(".import-item");
  let total = 0;

  items.forEach((item) => {
    const quantity =
      parseInt(item.querySelector(".import-quantity").value) || 0;
    const price = parseInt(item.querySelector(".import-price").value) || 0;
    total += quantity * price;
  });

  document.getElementById("import-total").textContent = formatCurrency(total);
}

function saveImport(e) {
  e.preventDefault();

  const id = document.getElementById("import-id").value;
  const items = [];

  document.querySelectorAll(".import-item").forEach((item) => {
    const productId = parseInt(item.querySelector(".import-product").value);
    const quantity = parseInt(item.querySelector(".import-quantity").value);
    const price = parseInt(item.querySelector(".import-price").value);

    if (productId && quantity && price) {
      items.push({
        product_id: productId,
        quantity: quantity,
        import_price: price,
      });
    }
  });

  if (items.length === 0) {
    alert("Vui lòng thêm ít nhất một sản phẩm!");
    return;
  }

  const importData = {
    import_date: document.getElementById("import-date").value,
    note: document.getElementById("import-note").value,
    items: items,
    status: "draft",
    created_by: currentAdmin.id,
    created_at: new Date().toISOString(),
  };

  if (id) {
    // Cập nhật
    const importRecord = imports.find((i) => i.id === parseInt(id));
    if (importRecord) {
      Object.assign(importRecord, importData);
    }
  } else {
    // Thêm mới
    const newId =
      imports.length > 0 ? Math.max(...imports.map((i) => i.id)) + 1 : 1;
    imports.push({
      id: newId,
      ...importData,
    });
  }

  saveData("imports", imports);
  closeModal("importModal");
  loadImportsTable();
  alert("Đã lưu phiếu nhập thành công!");
}

function completeImport() {
  const id = document.getElementById("import-id").value;

  if (!id) {
    // Lưu trước
    saveImport(event);
    return;
  }

  const importRecord = imports.find((i) => i.id === parseInt(id));
  if (importRecord && importRecord.status === "draft") {
    // Cập nhật tồn kho
    importRecord.items.forEach((item) => {
      const book = books.find((b) => b.id === item.product_id);
      if (book) {
        book.stock += item.quantity;

        // Ghi lại giao dịch
        inventoryTransactions.push({
          id: inventoryTransactions.length + 1,
          product_id: item.product_id,
          type: "import",
          quantity: item.quantity,
          reference_id: importRecord.id,
          reference_type: "import",
          created_at: new Date().toISOString(),
        });
      }
    });

    importRecord.status = "completed";
    importRecord.completed_at = new Date().toISOString();

    saveData("imports", imports);
    saveData("books", books);
    saveData("inventory_transactions", inventoryTransactions);

    closeModal("importModal");
    loadImportsTable();
    alert("Đã hoàn thành phiếu nhập và cập nhật tồn kho!");
  }
}

function completeImportById(importId) {
  if (confirm("Bạn có chắc muốn hoàn thành phiếu nhập này?")) {
    const importRecord = imports.find((i) => i.id === importId);
    if (importRecord && importRecord.status === "draft") {
      // Cập nhật tồn kho
      importRecord.items.forEach((item) => {
        const book = books.find((b) => b.id === item.product_id);
        if (book) {
          book.stock += item.quantity;

          // Ghi lại giao dịch
          inventoryTransactions.push({
            id: inventoryTransactions.length + 1,
            product_id: item.product_id,
            type: "import",
            quantity: item.quantity,
            reference_id: importRecord.id,
            reference_type: "import",
            created_at: new Date().toISOString(),
          });
        }
      });

      importRecord.status = "completed";
      importRecord.completed_at = new Date().toISOString();

      saveData("imports", imports);
      saveData("books", books);
      saveData("inventory_transactions", inventoryTransactions);

      loadImportsTable();
      alert("Đã hoàn thành phiếu nhập và cập nhật tồn kho!");
    }
  }
}

// Quản lý Giá bán
function loadPricing() {
  // Tải tỷ lệ lợi nhuận theo loại
  const tbody = document.querySelector("#category-margins-table tbody");
  tbody.innerHTML = categories
    .filter((c) => c.id !== 1)
    .map((cat) => {
      const margin = profitMargins.find((m) => m.category_id === cat.id);
      const marginValue = margin?.default_margin || 20;

      return `
            <tr>
                <td>${cat.display_name}</td>
                <td>
                    <input type="number" value="${marginValue}" min="0" max="100" 
                        onchange="updateCategoryMargin(${cat.id}, this.value)" style="width: 80px;"> %
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="updateCategoryMargin(${cat.id}, document.querySelector('input[onchange*=\\'${cat.id}\\']').value)">Lưu</button>
                </td>
            </tr>
        `;
    })
    .join("");

  // Đổ dữ liệu cho bộ lọc loại giá
  const categorySelect = document.getElementById("filter-pricing-category");
  categorySelect.innerHTML =
    '<option value="">Tất cả loại</option>' +
    categories
      .filter((c) => c.id !== 1)
      .map((cat) => `<option value="${cat.id}">${cat.display_name}</option>`)
      .join("");

  filterPricing();
}

function updateCategoryMargin(categoryId, marginValue) {
  const margin = profitMargins.find((m) => m.category_id === categoryId);
  if (margin) {
    margin.default_margin = parseFloat(marginValue);
  } else {
    profitMargins.push({
      category_id: categoryId,
      default_margin: parseFloat(marginValue),
      product_margins: {},
    });
  }

  saveData("profit_margins", profitMargins);
  alert("Đã cập nhật tỉ lệ lợi nhuận!");
  filterPricing();
}

function filterPricing() {
  const searchTerm =
    document.getElementById("search-pricing")?.value.toLowerCase() || "";
  const categoryFilter =
    document.getElementById("filter-pricing-category")?.value || "";

  let filteredBooks = [...books].filter((b) => b.status);

  if (searchTerm) {
    filteredBooks = filteredBooks.filter((b) =>
      b.title.toLowerCase().includes(searchTerm)
    );
  }

  if (categoryFilter) {
    const catId = parseInt(categoryFilter);
    filteredBooks = filteredBooks.filter((b) =>
      b.category_ids?.includes(catId)
    );
  }

  const tbody = document.querySelector("#pricing-table tbody");
  tbody.innerHTML = filteredBooks
    .map((book) => {
      // Lấy giá nhập từ phiếu nhập mới nhất
      const bookImports = imports.filter(
        (imp) =>
          imp.status === "completed" &&
          imp.items.some((item) => item.product_id === book.id)
      );

      let costPrice = 0;
      if (bookImports.length > 0) {
        const latestImport = bookImports.sort(
          (a, b) => new Date(b.import_date) - new Date(a.import_date)
        )[0];
        const importItem = latestImport.items.find(
          (item) => item.product_id === book.id
        );
        costPrice = importItem?.import_price || 0;
      }

      // Lấy tỷ lệ lợi nhuận
      const categoryId = book.category_ids?.[0];
      const margin = profitMargins.find((m) => m.category_id === categoryId);
      let marginPercent =
        margin?.product_margins?.[book.id] || margin?.default_margin || 20;

      const calculatedPrice = costPrice * (1 + marginPercent / 100);

      return `
            <tr>
                <td>${book.title}</td>
                <td>${formatCurrency(costPrice)}</td>
                <td>
                    <input type="number" value="${marginPercent}" min="0" max="100" 
                        style="width: 70px;" id="margin-${book.id}"> %
                </td>
                <td>${formatCurrency(book.price)} 
                    ${
                      Math.abs(book.price - calculatedPrice) > 1000
                        ? '<span class="badge badge-warning">⚠️</span>'
                        : ""
                    }
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="updateProductMargin(${
                      book.id
                    })">Cập nhật %</button>
                    <button class="btn btn-sm btn-success" onclick="applyCalculatedPrice(${
                      book.id
                    }, ${calculatedPrice})">Áp giá tính</button>
                </td>
            </tr>
        `;
    })
    .join("");
}

function updateProductMargin(productId) {
  const marginInput = document.getElementById(`margin-${productId}`);
  const marginValue = parseFloat(marginInput.value);

  const book = books.find((b) => b.id === productId);
  const categoryId = book?.category_ids?.[0];

  const margin = profitMargins.find((m) => m.category_id === categoryId);
  if (margin) {
    if (!margin.product_margins) {
      margin.product_margins = {};
    }
    margin.product_margins[productId] = marginValue;
  }

  saveData("profit_margins", profitMargins);
  alert("Đã cập nhật tỉ lệ lợi nhuận cho sản phẩm!");
  filterPricing();
}

function applyCalculatedPrice(productId, calculatedPrice) {
  if (confirm("Áp dụng giá tính toán vào giá bán?")) {
    const book = books.find((b) => b.id === productId);
    if (book) {
      book.price = Math.round(calculatedPrice / 1000) * 1000; // Làm tròn đến 1000 gần nhất
      book.updated_at = new Date().toISOString();
      saveData("books", books);
      alert("Đã cập nhật giá bán!");
      filterPricing();
    }
  }
}

// Quản lý Đơn hàng
function loadOrders() {
  filterOrders();
}

function filterOrders() {
  const fromDate = document.getElementById("filter-order-from")?.value || "";
  const toDate = document.getElementById("filter-order-to")?.value || "";
  const statusFilter =
    document.getElementById("filter-order-status")?.value || "";

  let filteredOrders = [...orders];

  if (fromDate) {
    filteredOrders = filteredOrders.filter(
      (o) => new Date(o.created_at) >= new Date(fromDate)
    );
  }

  if (toDate) {
    const toDateTime = new Date(toDate);
    toDateTime.setHours(23, 59, 59);
    filteredOrders = filteredOrders.filter(
      (o) => new Date(o.created_at) <= toDateTime
    );
  }

  if (statusFilter) {
    filteredOrders = filteredOrders.filter((o) => o.status === statusFilter);
  }

  const tbody = document.querySelector("#orders-table tbody");
  tbody.innerHTML = filteredOrders
    .map((order) => {
      const user = users.find((u) => u.id === order.user_id);
      return `
            <tr>
                <td>#${order.id}</td>
                <td>${user?.full_name || "N/A"}</td>
                <td>${formatDate(order.created_at)}</td>
                <td>${formatCurrency(order.total_amount)}</td>
                <td>${getPaymentMethodText(order.payment_method)}</td>
                <td>${getOrderStatusBadge(order.status)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewOrderDetail(${
                      order.id
                    })">Chi tiết</button>
                </td>
            </tr>
        `;
    })
    .join("");
}

function viewOrderDetail(orderId) {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  const user = users.find((u) => u.id === order.user_id);
  const address = addresses.find((a) => a.id === order.address_id);
  const details = orderDetails.filter((d) => d.order_id === orderId);

  let content = `
        <div class="card">
            <h3>Thông tin đơn hàng</h3>
            <p><strong>Mã đơn:</strong> #${order.id}</p>
            <p><strong>Khách hàng:</strong> ${user?.full_name || "N/A"}</p>
            <p><strong>SĐT:</strong> ${user?.phone || "N/A"}</p>
            <p><strong>Ngày đặt:</strong> ${formatDate(order.created_at)}</p>
            <p><strong>Địa chỉ giao hàng:</strong> ${
              address?.address_line1 || "N/A"
            }, ${address?.ward || ""}, ${address?.district || ""}, ${
    address?.city || ""
  }</p>
            <p><strong>PT thanh toán:</strong> ${getPaymentMethodText(
              order.payment_method
            )}</p>
            <p><strong>Tổng tiền:</strong> ${formatCurrency(
              order.total_amount
            )}</p>
        </div>
        
        <div class="card">
            <h3>Chi tiết sản phẩm</h3>
            <table>
                <thead>
                    <tr>
                        <th>Sản phẩm</th>
                        <th>Số lượng</th>
                        <th>Đơn giá</th>
                        <th>Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    ${details
                      .map((detail) => {
                        const book = books.find((b) => b.id === detail.book_id);
                        return `
                            <tr>
                                <td>${book?.title || "N/A"}</td>
                                <td>${detail.quantity}</td>
                                <td>${formatCurrency(detail.price)}</td>
                                <td>${formatCurrency(
                                  detail.quantity * detail.price
                                )}</td>
                            </tr>
                        `;
                      })
                      .join("")}
                </tbody>
            </table>
        </div>
        
        <div class="card">
            <h3>Cập nhật trạng thái</h3>
            <select id="order-status-update" class="form-control">
                <option value="pending" ${
                  order.status === "pending" ? "selected" : ""
                }>Mới đặt</option>
                <option value="processing" ${
                  order.status === "processing" ? "selected" : ""
                }>Đã xử lý</option>
                <option value="shipping" ${
                  order.status === "shipping" ? "selected" : ""
                }>Đang giao</option>
                <option value="delivered" ${
                  order.status === "delivered" ? "selected" : ""
                }>Đã giao</option>
                <option value="cancelled" ${
                  order.status === "cancelled" ? "selected" : ""
                }>Đã hủy</option>
            </select>
            <button class="btn btn-primary" onclick="updateOrderStatus(${orderId})" style="margin-top: 10px;">Cập nhật</button>
        </div>
    `;

  document.getElementById("order-detail-id").textContent = orderId;
  document.getElementById("order-detail-content").innerHTML = content;
  openModal("orderDetailModal");
}

function updateOrderStatus(orderId) {
  const newStatus = document.getElementById("order-status-update").value;
  const order = orders.find((o) => o.id === orderId);

  if (order) {
    const oldStatus = order.status;
    order.status = newStatus;

    // Nếu trạng thái thay đổi từ pending/processing sang delivered, ghi lại giao dịch tồn kho
    if (
      (oldStatus === "pending" || oldStatus === "processing") &&
      newStatus === "delivered"
    ) {
      const details = orderDetails.filter((d) => d.order_id === orderId);
      details.forEach((detail) => {
        inventoryTransactions.push({
          id: inventoryTransactions.length + 1,
          product_id: detail.book_id,
          type: "sale",
          quantity: detail.quantity,
          reference_id: orderId,
          reference_type: "order",
          created_at: new Date().toISOString(),
        });
      });
      saveData("inventory_transactions", inventoryTransactions);
    }

    saveData("orders", orders);
    closeModal("orderDetailModal");
    loadOrders();
    alert("Đã cập nhật trạng thái đơn hàng!");
  }
}

// Quản lý Tồn kho
function loadInventory() {
  // Đổ dữ liệu cho bộ lọc loại sản phẩm
  const categorySelect = document.getElementById("filter-inventory-category");
  categorySelect.innerHTML =
    '<option value="">Tất cả loại</option>' +
    categories
      .filter((c) => c.id !== 1)
      .map((cat) => `<option value="${cat.id}">${cat.display_name}</option>`)
      .join("");

  // Đổ dữ liệu cho chọn sản phẩm để báo cáo
  const productSelect = document.getElementById("inventory-report-product");
  productSelect.innerHTML =
    '<option value="">Tất cả sản phẩm</option>' +
    books.map((b) => `<option value="${b.id}">${b.title}</option>`).join("");

  const searchTerm =
    document.getElementById("search-inventory")?.value.toLowerCase() || "";
  const categoryFilter =
    document.getElementById("filter-inventory-category")?.value || "";

  let filteredBooks = [...books];

  if (searchTerm) {
    filteredBooks = filteredBooks.filter((b) =>
      b.title.toLowerCase().includes(searchTerm)
    );
  }

  if (categoryFilter) {
    const catId = parseInt(categoryFilter);
    filteredBooks = filteredBooks.filter((b) =>
      b.category_ids?.includes(catId)
    );
  }

  const tbody = document.querySelector("#inventory-table tbody");
  tbody.innerHTML = filteredBooks
    .map((book) => {
      const catNames = book.category_ids
        ?.map((cid) => {
          const cat = categories.find((c) => c.id === cid);
          return cat?.display_name || "";
        })
        .filter((n) => n)
        .join(", ");

      // Tính nhập và bán
      const bookTransactions = inventoryTransactions.filter(
        (t) => t.product_id === book.id
      );
      const totalImport = bookTransactions
        .filter((t) => t.type === "import")
        .reduce((sum, t) => sum + t.quantity, 0);
      const totalSale = bookTransactions
        .filter((t) => t.type === "sale")
        .reduce((sum, t) => sum + t.quantity, 0);

      const initialStock = book.stock - totalImport + totalSale;

      let stockStatus = "";
      if (book.stock < 10) {
        stockStatus = '<span class="badge badge-danger">Sắp hết</span>';
      } else if (book.stock < 20) {
        stockStatus = '<span class="badge badge-warning">Cần nhập</span>';
      } else {
        stockStatus = '<span class="badge badge-success">Đủ hàng</span>';
      }

      return `
            <tr>
                <td>${book.title}</td>
                <td>${catNames}</td>
                <td>${initialStock}</td>
                <td>${totalImport}</td>
                <td>${totalSale}</td>
                <td>${book.stock}</td>
                <td>${stockStatus}</td>
            </tr>
        `;
    })
    .join("");
}

function generateInventoryReport() {
  const fromDate = document.getElementById("inventory-report-from").value;
  const toDate = document.getElementById("inventory-report-to").value;
  const productId = document.getElementById("inventory-report-product").value;

  if (!fromDate || !toDate) {
    alert("Vui lòng chọn khoảng thời gian!");
    return;
  }

  let filteredBooks = productId
    ? [books.find((b) => b.id === parseInt(productId))]
    : [...books];
  filteredBooks = filteredBooks.filter((b) => b);

  const fromDateTime = new Date(fromDate);
  const toDateTime = new Date(toDate);
  toDateTime.setHours(23, 59, 59);

  let reportHTML = `
        <div class="card">
            <h3>Báo cáo từ ${formatDate(fromDate)} đến ${formatDate(
    toDate
  )}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Sản phẩm</th>
                        <th>Tồn đầu kỳ</th>
                        <th>Nhập</th>
                        <th>Xuất</th>
                        <th>Tồn cuối kỳ</th>
                    </tr>
                </thead>
                <tbody>
    `;

  filteredBooks.forEach((book) => {
    const transactions = inventoryTransactions.filter(
      (t) =>
        t.product_id === book.id &&
        new Date(t.created_at) >= fromDateTime &&
        new Date(t.created_at) <= toDateTime
    );

    const imports = transactions
      .filter((t) => t.type === "import")
      .reduce((sum, t) => sum + t.quantity, 0);
    const sales = transactions
      .filter((t) => t.type === "sale")
      .reduce((sum, t) => sum + t.quantity, 0);

    const endStock = book.stock;
    const beginStock = endStock - imports + sales;

    reportHTML += `
            <tr>
                <td>${book.title}</td>
                <td>${beginStock}</td>
                <td>${imports}</td>
                <td>${sales}</td>
                <td>${endStock}</td>
            </tr>
        `;
  });

  reportHTML += `
                </tbody>
            </table>
        </div>
    `;

  document.getElementById("inventory-report-result").innerHTML = reportHTML;
}

// Hàm tiện ích
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("vi-VN");
}

function getOrderStatusBadge(status) {
  const badges = {
    pending: '<span class="badge badge-warning">Mới đặt</span>',
    processing: '<span class="badge badge-info">Đã xử lý</span>',
    shipping: '<span class="badge badge-info">Đang giao</span>',
    delivered: '<span class="badge badge-success">Đã giao</span>',
    cancelled: '<span class="badge badge-danger">Đã hủy</span>',
  };
  return badges[status] || status;
}

function getPaymentMethodText(method) {
  const methods = {
    cod: "COD",
    vnpay: "VNPay",
    bank_transfer: "Chuyển khoản",
  };
  return methods[method] || method;
}

// Hàm Modal
function openModal(modalId) {
  document.getElementById(modalId).classList.add("active");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active");
}

// Đăng xuất
function logout() {
  if (confirm("Bạn có chắc muốn đăng xuất?")) {
    localStorage.removeItem("adminUser");
    currentAdmin = null;
    showLogin();
    // Reset form
    document.getElementById("admin-login-form").reset();
    document.getElementById("error-message").style.display = "none";
  }
}

// Lưu dữ liệu (mô phỏng - trong ứng dụng thực sẽ sử dụng API)
function saveData(type, data) {
  // Trong ứng dụng thực, sẽ gọi API để lưu dữ liệu
  // Hiện tại chỉ log nó ra
  console.log(`Đang lưu ${type}:`, data);
  
  // Lưu vào localStorage với key cho admin
  localStorage.setItem(`admin_${type}`, JSON.stringify(data));
  
  // Đồng bộ dữ liệu sang trang user
  // Map key admin sang key user
  const userKeyMap = {
    'books': 'BOOKS',
    'categories': 'CATEGORIES',
    'users': 'USERS',
    'orders': 'orders',
    'order_details': 'order_details',
    'addresses': 'ALL_ADDRESSES'
  };
  
  if (userKeyMap[type]) {
    localStorage.setItem(userKeyMap[type], JSON.stringify(data));
    console.log(`✅ Đã đồng bộ ${type} sang trang user với key ${userKeyMap[type]}`);
  }
}
