from db import get_connection, release_connection
import time

def log_request(api_key_id: int, endpoint: str, method: str, 
                status_code: int, response_time_ms: float, query_param: str = None):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO usage_logs 
            (api_key_id, endpoint, method, status_code, response_time_ms, query_param)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (api_key_id, endpoint, method, status_code, response_time_ms, query_param))
        conn.commit()
        cursor.close()
    except Exception as e:
        print(f"Logging error: {e}")
    finally:
        release_connection(conn)