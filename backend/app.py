from flask import Flask
from flask_cors import CORS

from config import Config
from models import init_db
from utils.errors import register_error_handlers


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app)

    with app.app_context():
        init_db()

    from routes.admin import admin_bp
    from routes.compare import compare_bp
    from routes.runs import runs_bp

    app.register_blueprint(compare_bp, url_prefix="/api/compare")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(runs_bp, url_prefix="/api/runs")

    register_error_handlers(app)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
