from fastapi import Header, HTTPException
from db import get_connection, release_connection

def verify_api_key(x_api_key: str = Header(...)):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, plan, is_active
            FROM api_keys
            WHERE api_key = %s
        """, (x_api_key,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=401, detail="Invalid API key")

        if not row[2]:
            raise HTTPException(status_code=403, detail="API key is disabled")

        # Last used update karo
        cursor.execute("""
            UPDATE api_keys SET last_used = NOW()
            WHERE api_key = %s
        """, (x_api_key,))
        conn.commit()
        cursor.close()

        return {"key_id": row[0], "plan": row[1]}

    finally:
        release_connection(conn)