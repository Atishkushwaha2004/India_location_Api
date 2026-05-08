import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv
import os

load_dotenv()

# SSL mode: "require" for production (Render/Railway/Supabase), "disable" for local
SSL_MODE = os.getenv("DB_SSLMODE", "disable")

connection_pool = pool.SimpleConnectionPool(
    minconn=int(os.getenv("DB_MIN_CONN", 2)),
    maxconn=int(os.getenv("DB_MAX_CONN", 10)),
    host=os.getenv("DB_HOST", "localhost"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    sslmode=SSL_MODE
)

def get_connection():
    return connection_pool.getconn()

def release_connection(conn):
    connection_pool.putconn(conn)