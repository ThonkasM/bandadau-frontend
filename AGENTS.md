# AGENTS.md — bandadau-frontend (F5, app `mobile`)

Repositorio de la app Expo (ADR-0017). Lee primero `../AGENTS.md` (workspace), `bandadau-docs/docs/04-patrones-y-reglas/frontend-guidelines.md` (§1, §5),
`design-tokens-y-temas.md` (§6.4), `i18n.md`, `bandadau-docs/docs/03-arquitectura/ia-local-y-offline.md` (D6) y
`bandadau-docs/docs/03-arquitectura/seguridad-y-sso.md` (D4).

## Identidad

App de estudiantes para **iOS, Android y web PWA** (`app.bandada.localhost`): feed, publicar con
pre-chequeo de imagen on-device, comentarios, grupos, eventos e inscripción (SAGA), tickets QR y
escáner para porteros, billetera, notificaciones push, **asistente de estudio offline** con LLM local
(T6), **cola offline** idempotente (T7, T8) y salto al panel sin re-login (T13).

## Stack

Expo SDK 57 · React Native (New Architecture) · **expo-router** · TypeScript strict ·
**NativeWind v4** con `vars()` sobre `@bandada/ui-tokens` · TanStack Query (+ persister MMKV / IndexedDB) ·
**Zustand** (estado cliente) · `@bandada/i18n` (i18next + ICU + `expo-localization`) · `expo-secure-store` ·
`expo-sqlite` · NetInfo · `react-native-executorch` (nativo) / WebLLM + transformers.js (web) ·
`expo-camera` (QR) · `expo-notifications` · `expo-web-browser` · Workbox (PWA) · Jest (`jest-expo`) + RNTL ·
Maestro · Playwright (PWA). Verifica cada API contra el changelog de SDK 57 (p. ej. `expo/fetch` global,
subpaths de `expo-router` sin `@react-navigation/*`).

### Datos, rendimiento y compilador (ajuste para mejor experiencia nativa)

- **TanStack Query es la única vía a datos de servidor.** Todo fetch pasa por hooks
  (`useQuery`/`useInfiniteQuery`/`useMutation`); prohibido `useEffect + fetch`. Query keys
  centralizadas en `src/lib/query-keys.ts`. Persister offline (MMKV nativo / IndexedDB web) y
  `networkMode: 'offlineFirst'`.
- **React Compiler activado** (`app.config.ts` → `experiments.reactCompiler`). No escribir
  `useMemo`/`useCallback`/`React.memo` "por reflejo": el compilador los aplica. Solo añadirlos para
  costo medido o semántica explícita.
- **Listas**: `@shopify/flash-list` (v2, New Architecture) en nativo y `FlatList` en web, a través de
  `src/components/ui/virtual-list.tsx` (`VirtualList`). Prohibido `ScrollView` + `.map` para
  colecciones largas (feed, comentarios, movimientos, tickets).
- **pnpm**: `react-native-css-interop` se declara como dependencia **directa** porque NativeWind v4
  emite `react-native-css-interop/jsx-runtime` y pnpm no lo hoistea. No quitarla.
- **Tras reconstruir un paquete `@bandada/*`** (`pnpm --filter @bandada/… build` en `bandadau-shared`),
  hay que ejecutar `pnpm install` en este repo: pnpm copia (hard-link) los `file:` al store y el `dist/`
  nuevo no se refleja hasta reinstalar (si no, Metro falla al resolver los chunks con hash).
- **Bottom sheets**: siempre `@gorhom/bottom-sheet` — en **nativo y web móvil** (patrón de Homy); en
  **web desktop** se usa un modal centrado. Requiere `GestureHandlerRootView` + `BottomSheetModalProvider`
  en el root y usar `BottomSheetFlatList`/`BottomSheetTextInput` dentro del sheet (scroll/teclado
  coordinados). Para abrir/cerrar usar **`usePresentableSheet`** (`present()` en `requestAnimationFrame`,
  `onDismiss`/`onChange`): evita el bug de que el sheet no vuelva a abrirse tras cerrarlo. Si se usan
  `snapPoints`, poner **`enableDynamicSizing={false}`** (por defecto `true` los ignora y abre pequeño);
  el composer/acción fija va **fuera** de la lista (`BottomSheetFlatList`), no dentro. Regla general:
  dividir por plataforma con archivos `.native.tsx`/`.web.tsx` y, dentro de web, por ancho con
  `useDeviceType()` (`isWebMobile` vs `isWebDesktop`).
- **Media**: relación de aspecto según Instagram (`src/lib/media-ratio.ts`) — retrato 4:5, paisaje
  1.91:1, cuadrado 1:1; el contenedor toma el ratio de la primera imagen (`expo-image onLoad`).

## Arquitectura y carpetas

```
bandadau-frontend/
├── app/                          rutas expo-router
│   ├── _layout.tsx               QueryClient → I18n → Theme → Session → OfflineQueue; ErrorBoundary
│   ├── (auth)/                   welcome, login, register, verify-email
│   ├── (tabs)/                   feed, events, create, wallet, profile
│   ├── posts/[postId].tsx  events/[eventId].tsx  registrations/[registrationId].tsx
│   ├── tickets/[ticketId].tsx  scan.tsx (UC-14)  groups/…  notifications.tsx
│   ├── assistant/                UC-17
│   ├── settings/                 idioma, tema (SYSTEM|LIGHT|DARK), notificaciones, "Abrir panel"
│   └── sso/callback.tsx          universal link panel → app
├── src/
│   ├── features/<feature>/       api.ts (hooks TanStack), components/, schemas.ts (zod)
│   ├── components/ui/            primitivas solo con clases semánticas
│   ├── lib/                      api-client.ts, query-client.ts, query-keys.ts, idempotency.ts, is-abort-error.ts
│   ├── stores/                   session, preferences, offline-queue (Zustand)
│   ├── offline/                  outbox-queue.ts + .native.ts (expo-sqlite) / .web.ts (IndexedDB), sync.ts
│   ├── ai/                       local-llm.ts + .native.ts / .web.ts, image-precheck.ts (+ .native/.web)
│   ├── i18n/  theme/             init i18next; ThemeProvider (vars), useTokens()
│   └── sso/                      handoff.ts (PKCE, createHandoffCode, apertura del panel)
├── locales/{es,en}/*.json
├── public/manifest.webmanifest   sw/ (Workbox injectManifest)
├── .maestro/                     flujos uc02, uc05, uc12, uc14, uc17
└── app.config.ts                 userInterfaceStyle "automatic", plugins, locales de permisos
```

## Comandos (propuestos, desde la raíz del repo)

```bash
pnpm start                            # Metro :8081
pnpm ios | pnpm android               # expo run:* (CNG; no editar ios/ android/ a mano)
pnpm ios:device                       # expo run:ios --device (iPhone físico; ver "Build iOS en dispositivo")
pnpm web                              # dev web
pnpm build:web                        # expo export -p web + service worker → dist/
pnpm lint && pnpm typecheck && pnpm test
pnpm i18n:check
maestro test .maestro/                # E2E nativo
```

`@bandada/ui-tokens`, `@bandada/i18n` y `@bandada/contracts-ts` se consumen como dependencia local
hermana: `"file:../bandadau-shared/packages/<pkg>"`.

## Build iOS en dispositivo físico

`pnpm ios:device` (= `expo run:ios --device`) compila el dev client con `expo-dev-client` y lo instala
en el iPhone. La firma usa el **Apple Team personal** `7MWYA8BMK6` (override: `EXPO_APPLE_TEAM_ID`).

Dos plugins de config sostienen esto (`app.config.ts` → `plugins`):

- **`./plugins/with-ios-signing`** (patrón de Maminco): fija `CODE_SIGN_STYLE = Automatic` y desactiva
  la firma solo para el SDK del simulador (`[sdk=iphonesimulator*]`), para que simulador y dispositivo
  convivan sin tocar `ios/` a mano.
- **`./plugins/with-ios-local-entitlements`**: un **Personal Team no soporta** las capabilities
  `aps-environment` (push, `expo-notifications`) ni `com.apple.developer.associated-domains`
  (`ios.associatedDomains`). En builds **locales** el plugin vacía esos entitlements para que el perfil
  se pueda firmar; en **EAS/producción** (`EAS_BUILD`) se conservan. Forzar con `EXPO_LOCAL_DEV=1`/`0`.

La primera vez en una máquina nueva, Xcode debe **crear el provisioning profile** de `com.bandadau.app`.
`expo run:ios` no pasa `-allowProvisioningUpdates` cuando el team ya está fijado en el pbxproj, así que
genera el perfil una vez desde Xcode (o con `xcodebuild … -allowProvisioningUpdates`) y luego
`pnpm ios:device` funciona. El perfil queda en `~/Library/Developer/Xcode/UserData/Provisioning Profiles/`.

## Variables de entorno (`.env.example`)

```
EXPO_PUBLIC_API_URL=http://api.bandada.localhost
EXPO_PUBLIC_APP_URL=http://app.bandada.localhost
EXPO_PUBLIC_ADMIN_URL=http://admin.bandada.localhost
EXPO_PUBLIC_DEFAULT_LOCALE=es
EXPO_PUBLIC_LOCAL_LLM_MODEL_URL=http://s3.bandada.localhost/bandada-public/mobile/llm/…   # descarga bajo demanda
EXPO_PUBLIC_NSFW_MODEL_URL=http://s3.bandada.localhost/bandada-public/mobile/nsfw-mobile/1.0.0/model.onnx
EXPO_PUBLIC_EAS_PROJECT_ID=
```

`EXPO_PUBLIC_*` son públicas y se hornean en el build. En dispositivo físico usar la IP LAN, no `localhost`.

## Puertos y contratos

Metro **8081**. REST público de identity, social, media, events, wallet, ticketing y notification
(`bandadau-docs/contracts/openapi/*`); tipos desde `@bandada/contracts-ts`. Nunca `/internal/**`.

## Reglas específicas y gotchas

- **Prohibido hex/paleta cruda** (`#fff`, `bg-blue-500`, colores en `StyleSheet`): solo clases semánticas
  o `useTokens()`. Claro **y** oscuro obligatorios; status bar, splash, navegación y teclado según tema.
- **Prohibido texto literal** (incluye `accessibilityLabel`, alertas, permisos): `locales/{es,en}`; recursos
  empaquetados (funciona offline). `Accept-Language` en cada petición.
- Errores mapeados por `code` (`@bandada/i18n/errors`); `failureReason` de inscripciones también.
- Cola offline: `clientId` UUIDv7 + `idempotencyKey` generados **al crear** la mutación y reutilizados
  en cada reintento; drenado con NetInfo y backoff; máximo 5 intentos → "requiere atención".
- Inscripción (202): polling de `getRegistration` con `Retry-After` + push; no bloquear la UI.
- Pre-chequeo de imagen on-device solo **avisa**; la decisión final es del servidor.
- Asistente offline: modelo descargado bajo demanda con progreso y espacio libre verificado; nunca en el bundle.
- Tokens en `expo-secure-store` (nativo); en web según `seguridad-y-sso.md`.
- Código específico de plataforma en `.native.ts`/`.web.ts`; módulos nativos jamás importados desde web.
- Cancelaciones: usar `isAbortError()` (con `expo/fetch` el error no es `AbortError`).

## Casos de uso

UC-01, UC-02, UC-03, UC-04 a UC-10, UC-11 (organizador), UC-12, UC-13, UC-14, UC-15, UC-16, UC-17, UC-24.

## Definición de hecho

`definition-of-done.md` §0 y §4 en iOS, Android y PWA + flujos Maestro de UC-05 (modo avión) y UC-12.
