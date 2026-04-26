# 🇮🇳 India Location API

A production-grade SaaS REST API platform providing comprehensive village-level geographical data for all Indian states, districts, sub-districts, and villages.

## 🌐 Live Demo
- **API Base URL:** https://india-location-api.onrender.com
- **Swagger UI:** https://india-location-api.onrender.com/docs
- **Admin Dashboard:** https://india-location-api.onrender.com/dashboard

---


## 📌 Project Overview

Businesses building Indian e-commerce, logistics, or service platforms face challenges with standardized address data. This API solves that by providing:

- ✅ Normalized, hierarchical address data (Country → State → District → Sub-District → Village)
- ✅ Ready-to-use format for dropdown menus and form autocomplete
- ✅ Tiered access with API key authentication
- ✅ Usage tracking and admin analytics

---

## 📊 Data Coverage

| Level | Count |
|-------|-------|
| States | 28 |
| Districts | 493 |
| Sub-Districts | 5,441 |
| Villages | 5,10,287 |

---

## 🚀 Features

- 🔐 **API Key Authentication** — Secure B2B access
- ⚡ **Rate Limiting** — Tier-based request limits
- 📊 **Usage Tracking** — Per-client analytics
- 📈 **Admin Dashboard** — Visual monitoring
- 🔍 **Village Search** — Search across all India
- 📄 **Pagination** — Efficient data retrieval

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI |
| Database | PostgreSQL (NeonDB / Render) |
| Authentication | API Key (Header-based) |
| Rate Limiting | SlowAPI |
| Deployment | Render |
| Documentation | Swagger UI (Auto-generated) |

---

## 📁 Project Structure

india-location-api/
├── main.py              # FastAPI routes + middleware
├── db.py                # PostgreSQL connection pool
├── auth.py              # API key authentication
├── logger.py            # Usage tracking
├── requirements.txt     # Dependencies
├── Procfile             # Render deployment config
├── .gitignore           # Git ignore rules
└── static/
└── dashboard.html   # Admin dashboard



---

## 🔗 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | API health check | ❌ |
| GET | `/states` | Get all states | ✅ |
| GET | `/districts/{state}` | Get districts by state | ✅ |
| GET | `/sub_districts/{district}` | Get sub-districts | ✅ |
| GET | `/villages/{sub_district}` | Get villages (paginated) | ✅ |
| GET | `/search?q={query}` | Search villages | ✅ |
| GET | `/counts` | Get total counts | ✅ |
| GET | `/admin/usage` | Usage analytics | ❌ |
| GET | `/admin/logs` | Recent API logs | ❌ |
| GET | `/dashboard` | Admin dashboard UI | ❌ |

---

## 🔑 Authentication

All protected endpoints require an API key in the request header:

```bash
curl -H "X-API-Key: your-api-key" \
  https://india-location-api.onrender.com/states
```

---

## 📖 Quick Start

### 1. Get States
```bash
curl -H "X-API-Key: your-api-key" \
  https://india-location-api.onrender.com/states
```

### 2. Get Districts by State
```bash
curl -H "X-API-Key: your-api-key" \
  https://india-location-api.onrender.com/districts/Bihar
```

### 3. Search Village
```bash
curl -H "X-API-Key: your-api-key" \
  "https://india-location-api.onrender.com/search?q=mairwa"
```

### 4. Get Villages with Pagination
```bash
curl -H "X-API-Key: your-api-key" \
  "https://india-location-api.onrender.com/villages/Mairwa?limit=20&offset=0"
```

---

## ⚙️ Local Setup

### Prerequisites
- Python 3.8+
- PostgreSQL

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/india-location-api.git
cd india-location-api

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create .env file
cp .env.example .env
# Edit .env with your DB credentials

# 4. Run the server
uvicorn main:app --reload
```

### Environment Variables (.env)
```env
DB_HOST=localhost
DB_NAME=location_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_PORT=5432
DB_MIN_CONN=2
DB_MAX_CONN=10
```

---

## 💡 Business Use Cases

- 🛒 **E-Commerce** — Address forms with auto-fill
- 🚚 **Logistics** — Delivery area selection
- 🏦 **Banking/KYC** — Address verification
- 🏥 **Healthcare** — Patient location data
- 🏗️ **Real Estate** — Property location filter
- 📱 **Fintech** — Loan/insurance address forms

---

## 📈 Success Criteria

- ✅ Sub-100ms API response time
- ✅ Support 1M+ daily API requests
- ✅ All Indian states, districts, sub-districts, villages covered
- ✅ Secure API key authentication
- ✅ Admin dashboard with analytics

---

## 🔮 Future Improvements

- [ ] Redis Caching for faster responses
- [ ] B2B Self-registration Portal
- [ ] Tiered subscription plans (Free/Premium/Pro)
- [ ] Pincode-level data
- [ ] Payment gateway integration
- [ ] JWT Authentication

---

## 👨‍💻 Author

**Atish Kushwaha**
- GitHub: [@Atishkushwaha2004](https://github.com/Atishkushwaha2004)

---

## 📄 License

This project is licensed under the MIT License.
