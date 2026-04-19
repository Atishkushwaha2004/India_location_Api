from fastapi import FastAPI, HTTPException, Query, Depends, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from db import get_connection, release_connection
from auth import verify_api_key
from logger import log_request
import time
import os

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="India Location API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Static folder check karke mount karo
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


# ── Middleware ──────────────────────────────────────
@app.middleware("http")
async def log_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    response_time = (time.time() - start_time) * 1000

    api_key = request.headers.get("x-api-key")
    key_id = None
    if api_key:
        conn = get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id FROM api_keys WHERE api_key = %s", (api_key,)
            )
            row = cursor.fetchone()
            if row:
                key_id = row[0]
            cursor.close()
        except:
            pass
        finally:
            release_connection(conn)

    query_param = str(dict(request.query_params)) if request.query_params else None

    log_request(
        api_key_id=key_id,
        endpoint=request.url.path,
        method=request.method,
        status_code=response.status_code,
        response_time_ms=round(response_time, 2),
        query_param=query_param
    )

    return response


# ── Helper ──────────────────────────────────────────
def fetch_all(query: str, params: tuple = ()):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        cursor.close()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        release_connection(conn)


# ── Routes ──────────────────────────────────────────

@app.get("/")
def home():
    return {"message": "India Location API is running", "version": "1.0.0"}


@app.get("/dashboard")
def dashboard():
    dashboard_path = os.path.join(os.path.dirname(__file__), "static", "dashboard.html")
    if os.path.exists(dashboard_path):
        return FileResponse(dashboard_path)
    return {"message": "Dashboard not available"}


@app.get("/states")
@limiter.limit("30/minute")
def get_states(request: Request, client=Depends(verify_api_key)):
    rows = fetch_all("SELECT id, name FROM states ORDER BY name;")
    return [{"id": r[0], "name": r[1]} for r in rows]


@app.get("/districts/{state}")
@limiter.limit("30/minute")
def get_districts(request: Request, state: str, client=Depends(verify_api_key)):
    rows = fetch_all("""
        SELECT d.id, d.name
        FROM districts d
        JOIN states s ON d.state_id = s.id
        WHERE LOWER(s.name) = LOWER(%s)
        ORDER BY d.name;
    """, (state,))
    if not rows:
        raise HTTPException(status_code=404, detail=f"State '{state}' not found")
    return [{"id": r[0], "name": r[1]} for r in rows]


@app.get("/sub_districts/{district}")
@limiter.limit("30/minute")
def get_sub_districts(request: Request, district: str, client=Depends(verify_api_key)):
    rows = fetch_all("""
        SELECT sd.id, sd.name
        FROM sub_districts sd
        JOIN districts d ON sd.district_id = d.id
        WHERE TRIM(LOWER(d.name)) = TRIM(LOWER(%s))
        ORDER BY sd.name;
    """, (district,))
    if not rows:
        raise HTTPException(status_code=404, detail=f"District '{district}' not found")
    return [{"id": r[0], "name": r[1]} for r in rows]


@app.get("/villages/{sub_district}")
@limiter.limit("30/minute")
def get_villages(
    request: Request,
    sub_district: str,
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    client=Depends(verify_api_key)
):
    rows = fetch_all("""
        SELECT v.id, v.name
        FROM villages v
        JOIN sub_districts sd ON v.sub_district_id = sd.id
        WHERE LOWER(sd.name) = LOWER(%s)
        ORDER BY v.name
        LIMIT %s OFFSET %s;
    """, (sub_district, limit, offset))
    return {
        "data": [{"id": r[0], "name": r[1]} for r in rows],
        "limit": limit,
        "offset": offset
    }


@app.get("/search")
@limiter.limit("20/minute")
def search_village(
    request: Request,
    q: str = Query(..., min_length=2),
    client=Depends(verify_api_key)
):
    rows = fetch_all("""
        SELECT v.name, sd.name, d.name, s.name
        FROM villages v
        JOIN sub_districts sd ON v.sub_district_id = sd.id
        JOIN districts d ON sd.district_id = d.id
        JOIN states s ON d.state_id = s.id
        WHERE v.name ILIKE %s
        LIMIT 50;
    """, (f"%{q}%",))
    if not rows:
        raise HTTPException(status_code=404, detail="No villages found")
    return [
        {"village": r[0], "sub_district": r[1], "district": r[2], "state": r[3]}
        for r in rows
    ]


@app.get("/counts")
@limiter.limit("10/minute")
def get_counts(request: Request):
    states = fetch_all("SELECT COUNT(*) FROM states;")[0][0]
    districts = fetch_all("SELECT COUNT(*) FROM districts;")[0][0]
    sub_districts = fetch_all("SELECT COUNT(*) FROM sub_districts;")[0][0]
    villages = fetch_all("SELECT COUNT(*) FROM villages;")[0][0]
    return {
        "states": states,
        "districts": districts,
        "sub_districts": sub_districts,
        "villages": villages
    }


# ── Admin Routes ────────────────────────────────────

@app.get("/admin/usage")
def get_usage():
    rows = fetch_all("""
        SELECT
            COALESCE(ak.client_name, 'Anonymous') as client,
            ul.endpoint,
            COUNT(*) as total_calls,
            ROUND(AVG(ul.response_time_ms)::numeric, 2) as avg_response_ms,
            MAX(ul.created_at) as last_used
        FROM usage_logs ul
        LEFT JOIN api_keys ak ON ul.api_key_id = ak.id
        GROUP BY ak.client_name, ul.endpoint
        ORDER BY total_calls DESC;
    """)
    return [
        {
            "client": r[0],
            "endpoint": r[1],
            "total_calls": r[2],
            "avg_response_ms": r[3],
            "last_used": str(r[4])
        }
        for r in rows
    ]


@app.get("/admin/logs")
def get_logs():
    rows = fetch_all("""
        SELECT
            ul.endpoint,
            ul.method,
            ul.status_code,
            ul.response_time_ms,
            ul.query_param,
            ul.created_at
        FROM usage_logs ul
        ORDER BY ul.created_at DESC
        LIMIT 50;
    """)
    return [
        {
            "endpoint": r[0],
            "method": r[1],
            "status_code": r[2],
            "response_time_ms": r[3],
            "query_param": r[4],
            "created_at": str(r[5])
        }
        for r in rows
    ]
