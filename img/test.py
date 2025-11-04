from PIL import Image
import os

def convert_to_jpg_and_replace(input_path):
    try:
        img = Image.open(input_path)

        # Nếu ảnh có alpha (PNG trong suốt) thì chuyển sang nền trắng
        if img.mode in ("RGBA", "LA"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[-1])
            img = background
        else:
            img = img.convert("RGB")

        # Luôn lưu lại với đuôi .jpg (ghi đè file cũ)
        base, _ = os.path.splitext(input_path)
        output_path = base + ".jpg"

        img.save(output_path, "JPEG", quality=95)

        # Nếu file gốc không phải .jpg thì xóa đi
        if not input_path.lower().endswith(".jpg"):
            os.remove(input_path)

        print(f"✅ Đã thay thế {input_path} → {output_path}")
    except Exception as e:
        print(f"❌ Lỗi với {input_path}: {e}")

def batch_convert(root_dir):
    for folder, _, files in os.walk(root_dir):
        for file in files:
            input_path = os.path.join(folder, file)
            # Bỏ qua nếu đã là .jpg
            if not file.lower().endswith(".jpg"):
                convert_to_jpg_and_replace(input_path)

# Ví dụ: đổi tất cả ảnh trong thư mục img/ và các thư mục con
batch_convert("img")