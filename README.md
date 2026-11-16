# Sherxan Taxi

Sherxan Taxi — mijoz buyurtmasi, haydovchi ish oqimi va boshqaruv ko‘rinishlari bo‘lgan o‘zbekcha taksi xizmatining MVP prototipi. Interfeys boshqa xizmatlarning dizaynini nusxalamaydi.

## Ishga tushirish

Node.js 20 yoki yangiroq versiyasi kerak.

```bash
npm install
npm run dev
```

Web: http://localhost:5173  
API health: http://localhost:3001/api/health

Build tekshiruvi:

```bash
npm run build
```

## MVP imkoniyatlari

- Mijoz buyurtma yaratishi, yo‘nalish va taxminiy narxni ko‘rishi.
- Haydovchi onlayn/offlayn bo‘lishi, buyurtmani qabul qilishi va safar holatlarini ketma-ket yangilashi.
- Admin ko‘rinishida safarlar, haydovchilar va yakunlangan safar tushumini ko‘rish.
- Kiritilgan koordinatalarni va manzil matnlarini serverda tekshirish.
- UI yangilanishi uchun API ma’lumotlarini 5 soniyada qayta yuklash.

## Muhim хязгаарлалт

Bu **lokal demo/MVP** бөгөөд үйлдвэрлэлийн үйлчилгээнд бэлэн биш. Backend нь одоогоор санах ойд өгөгдөл хадгалдаг тул сервер дахин асахад захиалгууд арилна. Нэвтрэлт, утас баталгаажуулалт, бодит role authorization, PostgreSQL/Supabase, бодит газрын зураг/маршрут, push мэдэгдэл, төлбөр, rate limiting болон аудитын бүртгэл хараахан холбогдоогүй.

Вебийн “Mijoz / Haydovchi / Boshqaruv” товчлуурууд нь зөвхөн demo горимын дэлгэц солигч; **эрхийн хамгаалалт биш**. Энэ серверийг нийтийн сүлжээнд гаргах эсвэл бодит хэрэглэгчийн мэдээлэл, төлбөрт ашиглаж болохгүй. Тариф нь шулуун шугамын зайд суурилсан тойм тооцоо бөгөөд бодит зам, түгжрэлийг тооцохгүй.

## API

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/drivers`, `POST /api/drivers/:id/status`
- `GET /api/rides`, `GET /api/rides/:id`
- `POST /api/rides/request`
- `POST /api/rides/:id/accept`
- `POST /api/rides/:id/status` (`accepted → arrived → in_progress → completed`; зөвшөөрөгдсөн цуцлалт)

CORS-ийн зөвшөөрөгдсөн web origin-уудыг `ALLOWED_ORIGINS`-оор таслалаар тусгаарлаж тохируулна. Энэ нь нэвтрэлт, API зөвшөөрлийн оронд ашиглагдахгүй.
