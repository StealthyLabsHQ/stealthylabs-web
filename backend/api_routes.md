# api_routes.md

## Conventions globales
- Base URL: `/api`
- Format: `Content-Type: application/json`
- Auth: `Authorization: Bearer <access_jwt>` (court TTL, ex. 15 min)
- Session longue: refresh token en cookie `HttpOnly + Secure + SameSite=Strict`
- Erreurs standard:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable",
    "details": []
  }
}
