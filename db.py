import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv
import os

load_dotenv()

connection_pool = pool.SimpleConnectionPool(
    minconn=int(os.getenv("DB_MIN_CONN", 2)),
    maxconn=int(os.getenv("DB_MAX_CONN", 10)),
    host=os.getenv("DB_HOST", "localhost"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    sslmode="require"               # ← add this line
)

def get_connection():
    return connection_pool.getconn()

def release_connection(conn):
    connection_pool.putconn(conn)