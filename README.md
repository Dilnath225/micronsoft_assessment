# 🏢 Micronsoft Solutions — Technical Assessment

> **Practical Technical Assessment for Software Engineering Internship**  
> Full-stack application built with **Django REST Framework** (Backend) + **React.js** (Frontend) + **MySQL** (Database)



## 🛠 Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React.js 19, React Router, Axios    |
| Backend   | Python, Django 6.0, Django REST Framework |
| Database  | MySQL 8.x                           |
| Styling   | Custom CSS (Dark Theme + Glassmorphism) |
| Testing   | Python `threading` (Load Test)      |

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **MySQL** 8.x
- **pip** (Python package manager)

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install Python dependencies
pip install django djangorestframework django-cors-headers mysqlclient

# Create the MySQL database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS micronsoft_db;"

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Populate the database with 100,000 dummy transactions
python manage.py populate_data

# Start the Django development server
python manage.py runserver
```

The backend API will be available at `http://localhost:8000/api/`

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will open at `http://localhost:3000`

---

## 📊 Running the Data Population Script

The `populate_data` management command generates:
- **11 realistic products** with names, prices, stock levels, and emojis
- **100,000 transaction records** distributed across the last 6 months
- A special **"Flash Sale Item"** with exactly 50 units (for Challenge 1 testing)

```bash
cd backend
python manage.py populate_data
```

**Output:**
```
Creating products...
  ✓ 🖱️ Wireless Mouse — $29.99 (150 in stock)
  ✓ ⌨️ Mechanical Keyboard — $89.99 (80 in stock)
  ...
Generating 100,000 transaction records over 6 months...
  → Inserted 5,000 / 100,000 records...
  → Inserted 10,000 / 100,000 records...
  ...
✅ Successfully populated 100,000 transactions across 11 products!
✅ Flash Sale Item has exactly 50 units for load testing.
```

---

## ⚡ Running the Load Test Script

The load test validates Challenge 01's concurrency handling by firing **100 concurrent requests** against a product with **50 units** in stock.

```bash
cd backend
python load_test.py
```

**Expected Output:**
```

  LOAD TEST: High-Concurrency Flash Sale (Challenge 01)


  Target Product ID : 11
  Concurrent Requests: 100
  Expected Stock     : 50 units


  Launching threads...



  RESULTS

  ✅ Successful purchases : 50
  ❌ Rejected (out of stock): 50
  ⚠️  Errors               : 0
  ⏱️  Total time            : ~1.2s

  📦 Final stock for product #11: 0

  ✅ TEST PASSED: Stock never dropped below 0!

```

---

## 📖 API Documentation

### `POST /api/purchase/` — Challenge 01

**Description:** Handles high-concurrency flash sale purchases.

| Parameter    | Type | Required | Description          |
|-------------|------|----------|----------------------|
| `product_id` | int  | Yes      | ID of the product    |
| `quantity`   | int  | No       | Defaults to 1        |

**Response (200):** `{"message": "Purchase successful!", "remaining_stock": 49}`  
**Response (400):** `{"message": "Out of stock!"}`

---

### `GET /api/analytics/` — Challenge 02

**Description:** Returns daily revenue for the last 30 days and top 5 products.

**Response (200):**
```json
{
  "message": "Analytics generated successfully",
  "total_revenue": 1250000.00,
  "daily_revenue": [
    {"date": "2025-12-01", "revenue": 45230.50},
    {"date": "2025-12-02", "revenue": 38120.00}
  ],
  "top_products": [
    {"product__name": "Wireless Mouse", "total_sold": 12500, "total_earned": 374875.00}
  ]
}
```

---

### `GET /api/products/` — Challenge 03

**Description:** Returns all available products for the POS interface.

---

### `POST /api/checkout/` — Challenge 03

**Description:** Processes a POS checkout with full transactional integrity.

**Request Body:**
```json
{
  "items": [
    {"product_id": 1, "quantity": 2},
    {"product_id": 3, "quantity": 1}
  ],
  "total_amount": 104.98
}
```

**Response (201):**
```json
{
  "message": "Checkout successful!",
  "order_number": "a1b2c3d4",
  "total_amount": 104.98,
  "items": [...],
  "created_at": "2025-12-15 14:30:00"
}
```

---

## 🧠 Approach & Technical Decisions

### Challenge 01: High-Concurrency Management

**Problem:** 500+ concurrent requests competing for 50 units of stock.

**Solution:** I used Django's `select_for_update()` combined with `transaction.atomic()` to implement **pessimistic row-level locking** on the database:

```python
with transaction.atomic():
    product = Product.objects.select_for_update().get(id=product_id)
    if product.stock >= quantity:
        product.stock -= quantity
        product.save()
```

**How it works:**
1. `select_for_update()` acquires an **exclusive row-level lock** on the product row in MySQL.
2. Any other concurrent transaction trying to update the same row will **block and wait** until the lock is released.
3. `transaction.atomic()` ensures the lock is held for the minimum duration and provides automatic rollback on failure.
4. This guarantees **stock never drops below zero**, even with identical millisecond requests.

**Why not optimistic locking?** For flash sales with extremely high contention on a single row, pessimistic locking (SELECT FOR UPDATE) is more efficient than optimistic locking (version-based), which would cause excessive retries.

---

### Challenge 02: Big Data Aggregation & Query Optimization

**Problem:** The analytics API must respond in under 500ms with 100,000+ records.

**Solution — Database-Level Aggregation:**

Instead of loading records into Python memory, all calculations are pushed to MySQL using Django ORM's aggregation functions:

```python
# Daily revenue using TruncDate (single SQL query)
daily_revenue = Transaction.objects
    .filter(created_at__gte=thirty_days_ago)
    .annotate(date=TruncDate('created_at'))
    .values('date')
    .annotate(revenue=Sum('total_price'))
    .order_by('date')

# Top 5 products (single SQL query with GROUP BY)
top_products = Transaction.objects
    .values('product__name')
    .annotate(total_sold=Sum('quantity'), total_earned=Sum('total_price'))
    .order_by('-total_sold')[:5]
```

**Performance Optimizations:**
1. **Database Indexes:** Added `db_index=True` on `Transaction.created_at` and `Transaction.product` (FK), plus a composite index on `(created_at, product)` for the daily revenue query.
2. **No Python-side processing:** All aggregation happens in MySQL via `SUM()`, `GROUP BY`, and `DATE()` functions.
3. **Data Population:** Used `bulk_create()` in batches of 5,000 to prevent memory overload during seeding.

---

### Challenge 03: Mini POS System (Transactional Integrity)

**Problem:** A cashier's checkout must be an atomic operation — if any item fails, nothing is committed.

**Solution — Full Atomic Rollback:**

```python
with transaction.atomic():
    order = Order.objects.create(total_amount=total_amount)
    
    for item in items_data:
        product = Product.objects.select_for_update().get(id=product_id)
        
        if product.stock < quantity:
            # This exception triggers a FULL ROLLBACK
            raise ValueError(f"Insufficient stock for {product.name}")
        
        product.stock -= quantity
        product.save()
        OrderItem.objects.create(order=order, product=product, ...)
```

**How it works:**
1. The entire checkout is wrapped in a single `transaction.atomic()` block.
2. If **any** item in the cart fails (insufficient stock, invalid product), a `ValueError` is raised.
3. Django's atomic block catches the exception and **rolls back ALL database changes** — the order, all order items, and all stock deductions are reverted.
4. `select_for_update()` prevents concurrent checkouts from overselling the same product.

**Frontend Design:**
- **Product Grid:** Clickable product cards with emoji icons, prices, and stock counts.
- **Shopping Cart:** Quantity +/- controls with real-time grand total calculation.
- **Receipt Component (Bonus):** Styled for standard 80mm thermal printer width (302px at 96dpi) with a print function that opens a correctly-sized print window.

---
