from .errors import ValidationError


def require_fields(data, fields):
    missing = [f for f in fields if f not in data or data[f] is None]
    if missing:
        raise ValidationError(f"Missing required fields: {', '.join(missing)}")


def validate_models_config(models):
    if not isinstance(models, list) or len(models) < 2 or len(models) > 3:
        raise ValidationError("Must select 2 or 3 models")
    for m in models:
        if "provider" not in m or "model" not in m:
            raise ValidationError("Each model must have 'provider' and 'model' fields")


def validate_prompts(prompts):
    if not isinstance(prompts, list) or len(prompts) < 1 or len(prompts) > 10:
        raise ValidationError("Must provide 1 to 10 prompts")
    for p in prompts:
        if not isinstance(p, str) or not p.strip():
            raise ValidationError("Each prompt must be a non-empty string")
