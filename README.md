# bandadau-frontend

App de estudiantes para iOS, Android y web PWA: feed, publicaciones, eventos, tickets, billetera, notificaciones, asistente offline con IA local y cola offline.

| | |
|---|---|
| Stack | Expo SDK 57 · expo-router · NativeWind · TanStack Query · Zustand · i18next |
| Puerto dev | 8081 (Metro) |
| Rutas / dominio | `app.bandada.localhost` |
| Casos de uso | UC-01 a UC-17, UC-24 |

```bash
pnpm start     # desarrollo (requiere `make infra-up` en ../bandadau-infra)
pnpm test      # pruebas
```

Configuración: copia `.env.example` a `.env`. Reglas, arquitectura, contratos, colas y gotchas:
**[`AGENTS.md`](AGENTS.md)** (lectura obligatoria para agentes de IA y personas).
Fuente de verdad del sistema: `bandadau-docs/docs/03-arquitectura/catalogo-servicios.md`.
