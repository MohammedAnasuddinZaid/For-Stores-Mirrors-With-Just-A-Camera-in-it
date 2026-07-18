from fastapi import HTTPException
from typing import Any


class AppError(HTTPException):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Any = None,
    ):
        super().__init__(status_code=status_code, detail={
            "code": code,
            "message": message,
            "details": details,
        })
        self.error_code = code


class NotFoundError(AppError):
    def __init__(self, entity: str, entity_id: str):
        super().__init__(
            status_code=404,
            code="NOT_FOUND",
            message=f"{entity} not found: {entity_id}",
        )


class ValidationError(AppError):
    def __init__(self, message: str, details: Any = None):
        super().__init__(
            status_code=422,
            code="VALIDATION_ERROR",
            message=message,
            details=details,
        )


class ConflictError(AppError):
    def __init__(self, message: str):
        super().__init__(
            status_code=409,
            code="CONFLICT",
            message=message,
        )


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(
            status_code=401,
            code="UNAUTHORIZED",
            message=message,
        )
