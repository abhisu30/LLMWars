import json
import os
from urllib.parse import urlparse, unquote

import psycopg2
import psycopg2.extras


def get_db():
    # If individual DB_* vars are set, use them directly (avoids URL special-char encoding issues)
    db_host = os.environ.get("DB_HOST")
    if db_host:
        conn = psycopg2.connect(
            host=db_host,
            port=int(os.environ.get("DB_PORT", "5432")),
            dbname=os.environ.get("DB_NAME", "postgres"),
            user=os.environ.get("DB_USER", "postgres"),
            password=os.environ.get("DB_PASSWORD", ""),
            sslmode="require",
        )
    else:
        url = os.environ.get("DATABASE_URL", "")
        parsed = urlparse(url)
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            dbname=parsed.path.lstrip("/"),
            user=parsed.username,
            password=unquote(parsed.password or ""),
            sslmode="require",
        )
    conn.autocommit = False
    return conn


def init_db():
    conn = get_db()
    try:
        cur = conn.cursor()
        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
        with open(schema_path) as f:
            cur.execute(f.read())
        conn.commit()
    finally:
        conn.close()


# --- Providers ---

def get_providers():
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT id, name, display_name, api_key, endpoint, is_active, created_at, updated_at FROM providers ORDER BY id")
        return list(cur.fetchall())
    finally:
        conn.close()


def get_provider(name):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM providers WHERE name = %s", (name,))
        return cur.fetchone()
    finally:
        conn.close()


def upsert_provider(name, api_key=None, endpoint=None, is_active=None):
    conn = get_db()
    try:
        cur = conn.cursor()
        updates = []
        values = []
        if api_key is not None:
            updates.append("api_key = %s")
            values.append(api_key)
        if endpoint is not None:
            updates.append("endpoint = %s")
            values.append(endpoint)
        if is_active is not None:
            updates.append("is_active = %s")
            values.append(is_active)
        if updates:
            updates.append("updated_at = NOW()")
            values.append(name)
            cur.execute(
                f"UPDATE providers SET {', '.join(updates)} WHERE name = %s",
                values,
            )
            conn.commit()
    finally:
        conn.close()


# --- Settings ---

def get_settings():
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT key, value FROM settings")
        return {row["key"]: row["value"] for row in cur.fetchall()}
    finally:
        conn.close()


def get_setting(key):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT value FROM settings WHERE key = %s", (key,))
        row = cur.fetchone()
        return row[0] if row else None
    finally:
        conn.close()


def set_setting(key, value):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO settings (key, value) VALUES (%s, %s) ON CONFLICT (key) DO UPDATE SET value = %s",
            (key, value, value),
        )
        conn.commit()
    finally:
        conn.close()


# --- Runs ---

def create_run(mode, models_config, judge_enabled=False):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO runs (mode, models_config, judge_enabled, status) VALUES (%s, %s, %s, 'running') RETURNING id",
            (mode, json.dumps(models_config), judge_enabled),
        )
        run_id = cur.fetchone()[0]
        conn.commit()
        return run_id
    finally:
        conn.close()


def update_run_status(run_id, status):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE runs SET status = %s WHERE id = %s", (status, run_id))
        conn.commit()
    finally:
        conn.close()


def add_run_prompt(run_id, prompt_text, sequence_num=1):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO run_prompts (run_id, prompt_text, sequence_num) VALUES (%s, %s, %s) RETURNING id",
            (run_id, prompt_text, sequence_num),
        )
        prompt_id = cur.fetchone()[0]
        conn.commit()
        return prompt_id
    finally:
        conn.close()


def add_run_output(run_prompt_id, provider, model, output_text, usage_data, latency_ms, error=None):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO run_outputs (run_prompt_id, provider, model, output_text, usage_data, latency_ms, error) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (run_prompt_id, provider, model, output_text, json.dumps(usage_data) if usage_data else None, latency_ms, error),
        )
        output_id = cur.fetchone()[0]
        conn.commit()
        return output_id
    finally:
        conn.close()


def save_score(run_prompt_id, model_label, score, comment):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO scores (run_prompt_id, model_label, score, comment) VALUES (%s, %s, %s, %s) RETURNING id",
            (run_prompt_id, model_label, score, comment),
        )
        score_id = cur.fetchone()[0]
        conn.commit()
        return score_id
    finally:
        conn.close()


def save_judge_result(run_prompt_id, judge_provider, judge_model, judge_prompt_id, result_json, latency_ms):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO judge_results (run_prompt_id, judge_provider, judge_model, judge_prompt_id, result_json, latency_ms) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (run_prompt_id, judge_provider, judge_model, judge_prompt_id, json.dumps(result_json), latency_ms),
        )
        result_id = cur.fetchone()[0]
        conn.commit()
        return result_id
    finally:
        conn.close()


# --- Query runs ---

def list_runs(limit=50, offset=0):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, mode, judge_enabled, models_config, status, created_at FROM runs ORDER BY created_at DESC LIMIT %s OFFSET %s",
            (limit, offset),
        )
        return list(cur.fetchall())
    finally:
        conn.close()


def get_run(run_id):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM runs WHERE id = %s", (run_id,))
        run = cur.fetchone()
        if not run:
            return None

        cur.execute("SELECT * FROM run_prompts WHERE run_id = %s ORDER BY sequence_num", (run_id,))
        prompts = list(cur.fetchall())

        for prompt in prompts:
            cur.execute("SELECT * FROM run_outputs WHERE run_prompt_id = %s ORDER BY id", (prompt["id"],))
            prompt["outputs"] = list(cur.fetchall())

            cur.execute("SELECT * FROM scores WHERE run_prompt_id = %s ORDER BY id", (prompt["id"],))
            prompt["scores"] = list(cur.fetchall())

            cur.execute("SELECT * FROM judge_results WHERE run_prompt_id = %s ORDER BY id", (prompt["id"],))
            prompt["judge_results"] = list(cur.fetchall())

        run["prompts"] = prompts
        return run
    finally:
        conn.close()


def delete_run(run_id):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM runs WHERE id = %s", (run_id,))
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def get_run_prompts_count(run_id):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM run_prompts WHERE run_id = %s", (run_id,))
        return cur.fetchone()[0]
    finally:
        conn.close()


def get_completed_prompts_count(run_id):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            """SELECT COUNT(DISTINCT rp.id) FROM run_prompts rp
               JOIN run_outputs ro ON ro.run_prompt_id = rp.id
               WHERE rp.run_id = %s""",
            (run_id,),
        )
        return cur.fetchone()[0]
    finally:
        conn.close()
