# database_schema.md

## Stack et principes
- SGBD: PostgreSQL 15+
- Extensions: `pgcrypto` (UUID), `citext` (email case-insensitive)
- Auth: mot de passe haché (Argon2id recommandé), refresh token stocké sous forme hashée
- RGPD: minimisation des données, suppression logique + purge, aucune donnée sensible inutile

## Table `users`
| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` |
| `email` | `CITEXT` | `NOT NULL UNIQUE` |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` |
| `display_name` | `VARCHAR(50)` | `NULL` |
| `is_email_verified` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` |
| `gdpr_consent_at` | `TIMESTAMPTZ` | `NOT NULL` |
| `gdpr_consent_version` | `VARCHAR(20)` | `NOT NULL` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` |

## Table `items`
| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` |
| `slug` | `VARCHAR(140)` | `NOT NULL UNIQUE` |
| `name` | `VARCHAR(120)` | `NOT NULL` |
| `item_type` | `VARCHAR(20)` | `NOT NULL CHECK (item_type IN ('game','weapon','blueprint','other'))` |
| `game_title` | `VARCHAR(80)` | `NOT NULL` |
| `description` | `TEXT` | `NULL` |
| `metadata` | `JSONB` | `NOT NULL DEFAULT '{}'::jsonb` |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` |

## Table `user_favorites`
| Colonne | Type | Contraintes |
|---|---|---|
| `user_id` | `UUID` | `NOT NULL REFERENCES users(id) ON DELETE CASCADE` |
| `item_id` | `UUID` | `NOT NULL REFERENCES items(id) ON DELETE CASCADE` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` |

Contraintes:
- `PRIMARY KEY (user_id, item_id)` (évite les doublons de favoris)

## Table `auth_sessions`
| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` |
| `user_id` | `UUID` | `NOT NULL REFERENCES users(id) ON DELETE CASCADE` |
| `refresh_token_hash` | `CHAR(64)` | `NOT NULL UNIQUE` |
| `user_agent` | `VARCHAR(255)` | `NULL` |
| `ip_address` | `INET` | `NULL` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` |
| `last_used_at` | `TIMESTAMPTZ` | `NULL` |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` |
| `revoked_at` | `TIMESTAMPTZ` | `NULL` |

## Table `email_verification_tokens`
| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` |
| `user_id` | `UUID` | `NOT NULL REFERENCES users(id) ON DELETE CASCADE` |
| `token_hash` | `CHAR(64)` | `NOT NULL UNIQUE` |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` |
| `used_at` | `TIMESTAMPTZ` | `NULL` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` |

## Indexes recommandés
- `CREATE INDEX idx_items_type_game ON items(item_type, game_title);`
- `CREATE INDEX idx_favorites_user_created ON user_favorites(user_id, created_at DESC);`
- `CREATE INDEX idx_favorites_item ON user_favorites(item_id);`
- `CREATE INDEX idx_sessions_user ON auth_sessions(user_id);`
- `CREATE INDEX idx_sessions_expires ON auth_sessions(expires_at);`

## Notes RGPD
- Données user minimales: email + pseudo optionnel.
- Refresh tokens uniquement hashés.
- `deleted_at` pour suppression logique, puis purge physique planifiée.
- Purge automatique des sessions/tokens expirés.
