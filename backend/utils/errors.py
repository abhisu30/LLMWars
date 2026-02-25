from flask import jsonify


class LLMWarsError(Exception):
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code


class ProviderError(LLMWarsError):
    pass


class ValidationError(LLMWarsError):
    pass


def register_error_handlers(app):
    @app.errorhandler(LLMWarsError)
    def handle_app_error(e):
        return jsonify({"error": e.message}), e.status_code

    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(Exception)
    def handle_unexpected(e):
        app.logger.exception("Unhandled error")
        return jsonify({"error": "Internal server error"}), 500
