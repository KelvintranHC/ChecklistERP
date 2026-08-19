# Checklist triển khai HoaAn ERP

Trang checklist dùng chung cho các phòng ban. Ai mở link Vercel cũng thấy cùng trạng thái tick; người lưu sau ghi đè người trước.

## Chạy local

```bash
python3 -m http.server 4173
```

Mở [http://localhost:4173](http://localhost:4173).

## Deploy Vercel

1. Import repo `KelvintranHC/ChecklistERP` trên [Vercel](https://vercel.com/new).
2. Framework Preset: **Other**.
3. Root Directory: để trống (thư mục gốc).
4. Deploy. Vercel sẽ phục vụ `index.html` tại domain mặc định.
