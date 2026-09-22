# Капля — Backend

Серверная часть PWA «Капля» — сервиса для доноров крови: карта центров крови, живая лента потребностей, запись на донацию и адресные уведомления.

Этот репозиторий развивает проект «Капля»: на фронтенд-части (React + TypeScript PWA) формализован контракт API, теперь добавляется реальный бэкенд — управляемая база данных PostgreSQL, REST API, аутентификация и защита данных.

## Статус

- [x] Контракт API и модели данных (`src/api`, `src/types`)
- [x] Схема базы данных PostgreSQL ([docs/database_schema.md](docs/database_schema.md))
- [x] Выбор инфраструктуры — Supabase ([docs/infrastructure_decision.md](docs/infrastructure_decision.md))
- [x] Развёртывание базы данных (миграции, RLS) — проект Supabase, применены миграции 0001-0003
- [ ] REST API endpoints
- [ ] Аутентификация и Row Level Security
- [ ] Интеграция фронтенда с бэкендом

## Технологии

| Слой | Технология |
|---|---|
| База данных | PostgreSQL (Supabase) |
| API | Supabase REST (PostgREST) + Edge Functions по необходимости |
| Аутентификация | Supabase Auth (телефон + OTP) |
| Миграции | SQL-миграции в `supabase/migrations` |
| Фронтенд | React 18 + TypeScript + Vite (PWA) |

Инфраструктурное решение (Supabase / BaaS против self-hosted PostgreSQL) зафиксировано и обосновано в [docs/infrastructure_decision.md](docs/infrastructure_decision.md).

## Структура репозитория

```
├── README.md                     # Описание проекта
├── technical_specification.md    # Техническое задание (модель данных, контракт API)
├── rules.md                      # Правила работы с кодовой базой
├── src/
│   ├── types/                    # Модели данных (Донор, Центр, Заявка, ...)
│   └── api/                      # Контракт ApiClient и хуки
├── docs/
│   ├── database_schema.md          # Схема БД: сущности, связи, индексы
│   └── infrastructure_decision.md  # Выбор инфраструктуры (Supabase) и обоснование
└── supabase/
    └── migrations/               # SQL-миграции схемы БД
```

## Документация

- `technical_specification.md` — требования, модель данных (раздел 7), контракт API (раздел 8)
- [docs/database_schema.md](docs/database_schema.md) — схема базы данных
- [docs/infrastructure_decision.md](docs/infrastructure_decision.md) — выбор инфраструктурного решения (Supabase) и обоснование
