import os

def create_numbered_folders(count, parent_dir="."):
    """
    Tạo nhiều thư mục chỉ có số thứ tự.
    count: số lượng thư mục cần tạo
    parent_dir: thư mục cha (mặc định là thư mục hiện tại ".")
    """
    for i in range(21, count + 1):
        folder_name = str(i)   # tên thư mục chỉ là số
        path = os.path.join(parent_dir, folder_name)
        os.makedirs(path, exist_ok=True)
        print(f"✅ Đã tạo: {path}")

# Ví dụ: tạo 10 thư mục 1, 2, 3, ..., 10 trong D:\1
create_numbered_folders(35, r"D:\web bán sách\img")