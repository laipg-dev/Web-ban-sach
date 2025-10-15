// Khóa localStorage
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

// Tạo ID duy nhất
function genId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

// Lấy / lưu users
function getUsers() {
  return JSON.parse(localStorage.getItem(LS_KEYS.USERS) || "[]");
}

function saveCurrentUser(user, remember = false) {
  localStorage.setItem(
    LS_KEYS.CURRENT_USER,
    JSON.stringify({
      password: user.password, // Lưu password để so sánh khi login
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone,
      email: user.email,
    })
  );
  console.log("Current user set:", user.username);
}

// Hiện lỗi
function showError(msg) {
  const err = document.getElementById("errBox");
  err.textContent = msg;
  err.style.display = "block";
}
function hideError() {
  const err = document.getElementById("errBox");
  err.style.display = "none";
  err.textContent = "";
}

// Toggle hiện/ẩn mật khẩu
document.getElementById("togglePw").addEventListener("click", () => {
  const pw = document.getElementById("password");
  pw.type = pw.type === "password" ? "text" : "password";
});

// Xử lý login
document.getElementById("loginBtn").addEventListener("click", async () => {
  hideError();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    showError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
    return;
  }

  const users = getUsers();
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    showError("Sai tên đăng nhập hoặc mật khẩu.");
    return;
  }

  saveCurrentUser(user);
  console.log("Đã đăng nhập với tài khoản:", user.username);
  await loadOrdersToLocalStorage();
  await getOrCreateOrders_Order_DetailForCurrentUser();
  getOrCreateCartForCurrentUser();
  getOrCreateAddressesForCurrentUser();
  window.location.href = "index.html";
});
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

  // Nếu user chưa có đơn hàng nào, tạo đơn hàng mẫu
  if (userOrders.length === 0) {
    userOrders = []; // Khởi tạo mảng đơn hàng
    userOrderDetails = []; // Khởi tạo mảng chi tiết đơn hàng
  }

  // Lưu dữ liệu user
  localStorage.setItem(LS_KEYS.ORDERS_USER, JSON.stringify(userOrders));
  localStorage.setItem(
    LS_KEYS.ORDERS_DETAILS_USER,
    JSON.stringify(userOrderDetails)
  );

  return { userOrders, userOrderDetails };
}

// Các hàm hỗ trợ để lấy dữ liệu orders
function getCurrentUserOrders() {
  return JSON.parse(localStorage.getItem(LS_KEYS.ORDERS_USER) || "[]");
}

function getCurrentUserOrderDetails() {
  return JSON.parse(localStorage.getItem(LS_KEYS.ORDERS_DETAILS_USER) || "[]");
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

function saveCarts(carts) {
  localStorage.setItem(LS_KEYS.CARTS, JSON.stringify(carts));
}
function getOrCreateAddressesForCurrentUser() {
  const user = JSON.parse(localStorage.getItem(LS_KEYS.CURRENT_USER) || "null");
  if (!user) return null;

  // Lấy cấu trúc địa chỉ mới từ localStorage (đã tổ chức theo user_id)

  // Lấy danh sách addresses từ localStorage (giống cách cart hoạt động)
  let allAddresses = JSON.parse(
    localStorage.getItem(LS_KEYS.ALL_ADDRESSES) || "[]"
  );

  // Tìm addresses của user hiện tại (giống cách tìm cart)
  let userAddresses = allAddresses.filter(
    (address) => address.user_id === user.id
  );

  if (userAddresses.length > 0) {
    // Nếu có addresses, đồng bộ vào localStorage theo user
    wrteUserAddresses(userAddresses);

    return userAddresses;
  }

  // Chưa có địa chỉ → không tạo mới (khác cart vì địa chỉ không tự tạo)
  console.log(`📭 Không tìm thấy địa chỉ cho người dùng ${user.id}`);
  wrteUserAddresses([]); // Tạo mảng rỗng
  return [];
}
function getOrCreateCartForCurrentUser() {
  const user = JSON.parse(localStorage.getItem(LS_KEYS.CURRENT_USER) || "null");
  if (!user) return null;

  // Lấy danh sách carts từ localStorage
  let carts = JSON.parse(localStorage.getItem(LS_KEYS.CARTS) || "[]");

  // Tìm cart của user hiện tại
  let cart = carts.find((c) => c.user_id === user.id);
  console.log(cart);
  if (cart) {
    // Nếu cart.items chưa có (dữ liệu cũ), đảm bảo là mảng rỗng
    if (!Array.isArray(cart.items)) cart.items = [];

    // Đồng bộ items vào localStorage theo user
    writeUserCartItems(user.id, cart.items);
    return cart;
  }

  // Chưa có → tạo mới
  cart = {
    id: genId(),
    user_id: user.id,
    status: "ACTIVE",
    items: [], // mảng item {book_id, quantity, price? ...}
  };
  carts.push(cart);
  saveCarts(carts);
  writeUserCartItems(user.id, cart.items);
  return cart;
}
