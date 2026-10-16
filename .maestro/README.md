# Flujos E2E (Maestro) — Bandada U

Flujos de aceptación para la app nativa (iOS/Android) con `expo-dev-client` y **backend real**
(`make up` + `make seed` en `bandadau-infra`). Requieren un dispositivo/simulador con la app instalada.

## Ejecutar

```bash
# desde bandadau-frontend, con el dev client instalado en el dispositivo
maestro test .maestro/ \
  -e EMAIL=lucia@umsa.edu.bo \
  -e PASSWORD='Bandada#2026' \
  -e ORG_EMAIL=org@umsa.edu.bo
```

| Flujo | UC | Qué verifica |
|---|---|---|
| `uc02-login.yaml` | UC-02 | Bienvenida → login → feed (sesión creada y restaurada) |
| `uc05-publish.yaml` | UC-05 | Publicar texto (createUpload→completeUpload→createPost) y verlo en el feed |
| `uc12-register-event.yaml` | UC-12 | Inscribirse a un evento pagado (SAGA: procesando → confirmada → entrada) |
| `uc14-scan-ticket.yaml` | UC-14 | Abrir el escáner de entradas (portero/organizador) |

## Credenciales de demo

Del seed de `bandadau-infra` (`SEED_DEMO_PASSWORD`, por defecto `Bandada#2026`):

- Estudiantes: `lucia@`, `marco@`, `sofia@`, `diego@`, `camila@` `umsa.edu.bo`
- Organizadores: `org@umsa.edu.bo`, `org2@umsa.edu.bo`
- Panel: `admin@umsa.edu.bo` (ADMIN), `mod@umsa.edu.bo` (MODERATOR)

En dispositivo físico, apunta `EXPO_PUBLIC_API_URL` a la IP LAN (ver `.env.example`).

## Notas

- Los textos de los selectores están en español (idioma por defecto de la UI).
- `uc14` requiere cámara real; en simulador solo se valida la navegación a la pantalla del escáner.
- El flujo de **modo avión** de UC-05 (cola offline, T7/T8) se documenta en la auditoría; para
  probarlo, activa el modo avión tras publicar y verifica "Sin conexión: tu publicación se enviará
  al reconectar." y que el post aparece en el feed al recuperar la red.
