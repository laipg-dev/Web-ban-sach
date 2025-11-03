# HƯỚNG DẪN CẬP NHẬT DỰ ÁN - GỘP THÀNH 3 FILE HTML

## 📋 Tổng quan

Dự án đã được tối ưu hóa từ nhiều file HTML xuống còn 3 file chính:

### **3 FILE HTML CHÍNH:**

1. **index.html** (index-new.html)
   - Trang chủ & danh sách sản phẩm
   - Chi tiết sách
   - Đăng nhập
   - Đăng ký

2. **cart.html** (cart-new.html)
   - Giỏ hàng
   - Thanh toán
   - Đơn hàng thành công

3. **profile.html** (profile-new.html)
   - Thông tin cá nhân
   - Địa chỉ
   - Đổi mật khẩu
   - Đơn hàng của tôi

---

## 🔧 BƯỚC THỰC HIỆN

### **Bước 1: Sao lưu file cũ**
```cmd
mkdir backup
move index.html backup\
move cart.html backup\
move checkout.html backup\
move login.html backup\
move register.html backup\
move viewBookDetails.html backup\
move order-success.html backup\
```

### **Bước 2: Đổi tên file mới**
```cmd
move index-new.html index.html
move cart-new.html cart.html
move profile-new.html profile.html
```

### **Bước 3: Thêm CSS mới vào style.css**

Thêm dòng này vào đầu file `style.css`:
```css
@import url('page-sections.css');
```

Hoặc copy toàn bộ nội dung file `page-sections.css` vào cuối file `style.css`

---

## 📝 CẬP NHẬT FILE JAVASCRIPT

### **1. Cập nhật index.js**

Thêm vào đầu file:

```javascript
// ===== NAVIGATION SYSTEM =====
function showSection(sectionId) {
  // Ẩn tất cả sections
  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Hiện section được chọn
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
    window.scrollTo(0, 0);
  }
}

// Khi click vào tên sách, hiện chi tiết
function viewBookDetails(bookId) {
  // Load thông tin sách
  loadBookDetails(bookId);
  // Hiện section chi tiết
  showSection('book-detail-section');
}

// Nút quay về trang chủ
document.getElementById('home-link').addEventListener('click', (e) => {
  e.preventDefault();
  showSection('home-section');
});

// Nút tài khoản
document.getElementById('account-btn').addEventListener('click', (e) => {
  e.preventDefault();
  const user = JSON.parse(localStorage.getItem('currentUser'));
  
  if (user) {
    window.location.href = 'profile.html';
  } else {
    showSection('login-section');
  }
});

// ===== LOGIN LOGIC =====
document.getElementById('loginBtn').addEventListener('click', () => {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  
  // Logic đăng nhập của bạn ở đây
  // Nếu thành công:
  showSection('home-section');
});

// Hiện form đăng ký
document.getElementById('show-register').addEventListener('click', (e) => {
  e.preventDefault();
  showSection('register-section');
});

// Hiện form đăng nhập từ trang đăng ký
document.getElementById('show-login').addEventListener('click', (e) => {
  e.preventDefault();
  showSection('login-section');
});

// ===== REGISTER LOGIC =====
document.getElementById('registerBtn').addEventListener('click', () => {
  // Logic đăng ký của bạn ở đây
  // Nếu thành công:
  showSection('login-section');
});

// Toggle password visibility
document.getElementById('login-togglePw').addEventListener('click', function() {
  const input = document.getElementById('login-password');
  input.type = input.type === 'password' ? 'text' : 'password';
});

document.getElementById('register-togglePw').addEventListener('click', function() {
  const input = document.getElementById('register-password');
  input.type = input.type === 'password' ? 'text' : 'password';
});

document.getElementById('register-togglePw2').addEventListener('click', function() {
  const input = document.getElementById('register-confirmPassword');
  input.type = input.type === 'password' ? 'text' : 'password';
});

// Mặc định hiện trang chủ
showSection('home-section');
```

### **2. Cập nhật cart.js**

Thêm vào đầu file:

```javascript
// ===== NAVIGATION SYSTEM =====
function showSection(sectionId) {
  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.remove('active');
  });
  
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
    window.scrollTo(0, 0);
  }
}

// Nút thanh toán
document.getElementById('checkout-btn').addEventListener('click', () => {
  // Load thông tin thanh toán
  loadCheckoutInfo();
  showSection('checkout-section');
});

// Nút đặt hàng
document.getElementById('place-order-btn').addEventListener('click', () => {
  // Xử lý đặt hàng
  const orderId = processOrder();
  
  if (orderId) {
    // Hiện trang thành công
    displayOrderSuccess(orderId);
    showSection('success-section');
  }
});

// Modal thêm địa chỉ
document.getElementById('add-address-btn').addEventListener('click', () => {
  document.getElementById('address-modal').classList.add('active');
});

document.getElementById('close-address-modal').addEventListener('click', () => {
  document.getElementById('address-modal').classList.remove('active');
});

document.getElementById('cancel-address').addEventListener('click', () => {
  document.getElementById('address-modal').classList.remove('active');
});

document.getElementById('save-address').addEventListener('click', () => {
  // Lưu địa chỉ
  saveNewAddress();
  document.getElementById('address-modal').classList.remove('active');
});

// Mặc định hiện giỏ hàng
showSection('cart-section');
```

---

## ✅ CHECKLIST

- [ ] Đã sao lưu các file HTML cũ
- [ ] Đã đổi tên 3 file mới
- [ ] Đã thêm CSS mới (page-sections.css)
- [ ] Đã cập nhật index.js với navigation system
- [ ] Đã cập nhật cart.js với navigation system
- [ ] Đã test chức năng chuyển trang
- [ ] Đã test chức năng đăng nhập/đăng ký
- [ ] Đã test chức năng giỏ hàng/thanh toán

---

## 🎯 LƯU Ý QUAN TRỌNG

1. **Navigation**: Tất cả các section được ẩn/hiện bằng class `active`
2. **JavaScript**: Cần cập nhật logic để sử dụng `showSection()` thay vì chuyển trang
3. **CSS**: File `page-sections.css` chứa style cho modal, form, button
4. **Responsive**: Đã tối ưu cho mobile

---

## 🔄 QUAY LẠI FILE CŨ (Nếu cần)

```cmd
del index.html cart.html profile.html
move backup\*.html .
rmdir backup
```

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, kiểm tra:
1. Console log trong Developer Tools (F12)
2. Đảm bảo tất cả ID elements đúng
3. Kiểm tra đường dẫn file CSS/JS

**Chúc bạn thành công! 🎉**
