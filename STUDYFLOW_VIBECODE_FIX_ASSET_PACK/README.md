# STUDYFLOW VIBECODE FIX ASSET PACK

## Cấu trúc

```text
STUDYFLOW_VIBECODE_FIX_ASSET_PACK/
├── VIBECODE/
│   └── STUDYFLOW_CI_VERCEL_STATIC_MASCOT_FIX.md
├── assets/
│   ├── mascots/
│   ├── leaves/
│   └── decorations/
├── source/
│   └── studyflow_asset_sheet_source.png
└── reference/
    └── vibecode_fix_reference.png
```

## Mascots

Các mascot đã được chuẩn hóa về canvas 512×512, nền trong suốt, dùng làm ảnh tĩnh.

Không dùng frame animation nữa.

## Leaves

Các lá được tách riêng để dùng:
- header decoration
- sidebar decoration
- empty state
- subtle CSS drift

## Cách dùng

1. Copy `assets/` vào `frontend/public/assets/nature/`.
2. Đọc file VIBECODE.
3. Làm batch CI/Vercel trước.
4. Sau khi CI xanh mới migrate animation.
5. Không import `source/studyflow_asset_sheet_source.png` vào production.
