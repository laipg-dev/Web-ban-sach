// Constants
const fmt = (n) => (n || 0).toLocaleString("vi-VN") + "đ";

document.addEventListener("DOMContentLoaded", function () {
  loadOrderInfo();
  updateCartBadge();
  setupPrintButton();
});

// Load order information
function loadOrderInfo() {
  try {
    const orderSuccess = JSON.parse(
      localStorage.getItem("order_success") || "{}"
    );

    if (!orderSuccess.orderId) {
      // Nếu không có thông tin đơn hàng, chuyển về trang chủ
      alert("Không tìm thấy thông tin đơn hàng!");
      window.location.href = "index.html";
      return;
    }

    // Hiển thị thông tin đơn hàng
    document.getElementById("order-id").textContent = orderSuccess.orderId;
    document.getElementById("order-time").textContent =
      new Date().toLocaleString("vi-VN");
    document.getElementById("total-amount").textContent = fmt(
      orderSuccess.totalAmount
    );

    // Hiển thị thông tin theo phương thức thanh toán
    if (orderSuccess.paymentMethod === "qr") {
      document.getElementById("payment-method").textContent = "Chuyển khoản QR";
      document.getElementById("qr-payment-section").style.display = "block";
      document.getElementById("transfer-amount").textContent = fmt(
        orderSuccess.totalAmount
      );
      document.getElementById(
        "transfer-content"
      ).textContent = `THANHTOAN ${orderSuccess.orderId}`;
    } else if (orderSuccess.paymentMethod === "cod") {
      document.getElementById("payment-method").textContent =
        "Thanh toán khi nhận hàng (COD)";
      document.getElementById("cod-payment-section").style.display = "block";
    }

    // Xóa thông tin đơn hàng khỏi localStorage sau khi hiển thị
    localStorage.removeItem("order_success");
  } catch (error) {
    console.error("Error loading order info:", error);
    alert("Có lỗi xảy ra khi tải thông tin đơn hàng!");
    window.location.href = "index.html";
  }
}

// Update cart badge
function updateCartBadge() {
  try {
    const cart = JSON.parse(localStorage.getItem("cart_user1") || "[]");
    const badge = document.getElementById("cart-count");
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

// Setup print button
function setupPrintButton() {
  document.getElementById("print-order").addEventListener("click", function () {
    window.print();
  });
}

// Print styles
const printStyles = `
  <style>
    @media print {
      body * { visibility: hidden; }
      .success-container, .success-container * { visibility: visible; }
      .success-container { position: absolute; left: 0; top: 0; width: 100%; }
      .action-buttons { display: none !important; }
      header { display: none !important; }
    }
  </style>
`;
document.head.insertAdjacentHTML("beforeend", printStyles);
