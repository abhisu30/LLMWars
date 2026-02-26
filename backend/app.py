import os

from flask import Flask
from flask_cors import CORS

from config import Config
from models import init_db
from utils.errors import register_error_handlers


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    origins = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    CORS(app, origins=[o.strip() for o in origins])

    with app.app_context():
        init_db()

    from routes.admin import admin_bp
    from routes.compare import compare_bp
    from routes.runs import runs_bp

    app.register_blueprint(compare_bp, url_prefix="/api/compare")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(runs_bp, url_prefix="/api/runs")

    register_error_handlers(app)

    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(port=5000)
