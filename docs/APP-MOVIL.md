# App móvil de ALIA (Android e iPhone)

La app es el mismo sitio (`https://aliaforrent.vercel.app`), instalado en el teléfono. Entra por `/es/app`: quien tiene panel cae en «¿Qué está libre?» (modo vendedor) y ve el switch **Usuario | Vendedor**; los demás, en la portada. Los permisos siguen en el servidor.

| | Cómo se instala | Notas |
|---|---|---|
| **Android (APK)** | Descargar el `.apk` de GitHub (Actions o Releases) e instalarlo | Android 7.0+. Con Chrome: abre sin barra cuando `assetlinks.json` está bien configurado. Sin Chrome (LineageOS sin Google, Huawei…): abre en un WebView propio, también sin barra, con sesión aparte del navegador |
| **Android (sin APK)** | Chrome → menú ⋮ → «Instalar app» | Misma app, instalada como PWA |
| **iPhone** | Safari → Compartir → «Agregar a inicio» | No hay APK para iPhone. Sin avisos push |

Sin conexión, la app muestra «Sin conexión»: nunca precios ni disponibilidad guardados (T-5213).

---

## 1. Primera vez: crear la llave de firma (una sola vez, en tu computadora)

La llave identifica a la app para siempre: **si se pierde, los teléfonos no podrán actualizar la app** (habrá que desinstalar e instalar otra). Guárdala junto con sus contraseñas en un lugar seguro (gestor de contraseñas). **Nunca** la subas al repo (`.gitignore` ya ignora `*.keystore`).

Requiere Java (`keytool`). En una terminal, **fuera del repo**:

```bash
keytool -genkeypair -v -keystore alia.keystore -alias alia -keyalg RSA -keysize 2048 -validity 10000
```

Pide una contraseña (si después pide otra para la llave, Enter = la misma) y unos datos (nombre, organización…). Si Windows no reconoce `keytool` tras instalar Java (`winget install EclipseAdoptium.Temurin.17.JDK`), agrega su carpeta `bin` al PATH de esa ventana: `$env:Path += ";C:\Program Files\Eclipse Adoptium\<jdk>\bin"`.

Subirla a GitHub **directo desde el archivo** (copiar y pegar un texto tan largo suele cortarse). Con `gh` iniciado sesión, en Git Bash o con `!` en Claude Code:

```bash
base64 -w0 ~/Documents/alia-llave/alia.keystore | gh secret set ANDROID_KEYSTORE_BASE64 --repo Sup3rone/portal-casas
```

## 2. Secretos en GitHub

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secreto | Valor |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Ya lo subió el comando del paso 1 |
| `ANDROID_KEYSTORE_PASSWORD` | La contraseña de la llave (sin espacios ni Enter al final) |

Comprobar la contraseña antes: `keytool -list -keystore alia.keystore -alias alia` debe mostrar la entrada `alia`.

## 3. Compilar el APK

Repo → **Actions → «APK Android» → Run workflow**. Tarda unos minutos. Al terminar:

- El APK está en la corrida, sección **Artifacts → `alia-apk`** (un `.zip` con el `.apk`).
- En el **resumen** de la corrida aparece la línea `ANDROID_CERT_SHA256=…`: es la huella para el paso 4.

Para una versión «oficial» con descarga fija, crea un tag `app-v1.0.0` (luego `app-v1.0.1`, …): además publica un **Release** con el APK.

## 4. Vincular el APK con el sitio (una sola vez)

En Vercel → `portal-casas-web` → **Settings → Environment Variables**, en **Production**:

```
ANDROID_CERT_SHA256 = <la huella del paso 3, formato AB:CD:…>
```

y **Redeploy**. Comprobar: `https://aliaforrent.vercel.app/.well-known/assetlinks.json` debe devolver un JSON con `com.aliaforrent.app` y esa huella (sin la variable responde 404, a propósito).

Si algún día se sube a Google Play con «firma de apps de Google Play», Play da **otra** huella: se agregan las dos separadas por coma.

## 5. Instalar en Android

1. En el teléfono, abrir el enlace del APK (Release o Artifact descargado y descomprimido).
2. Android pedirá permitir «instalar apps desconocidas» para el navegador o el gestor de archivos: aceptar solo para esta instalación.
3. Abrir **ALIA**. Si se ve **sin barra de dirección**, el vínculo del paso 4 funciona. Si se ve una barra arriba con la URL, revisa la huella y espera unos minutos (Android guarda la verificación un rato; reinstalar la fuerza).

Actualizar: instalar el APK nuevo encima; conserva la sesión.

## Dónde se ha probado

| Fecha | Teléfono | Sistema | Navegador | Resultado |
|---|---|---|---|---|
| 24-11-2026 | Samsung Galaxy J7 Prime | Android 11 · LineageOS (sin servicios de Google) | Sin Chrome | Con `customtabs`: abría con barra. Con `webview` (APK de la corrida 45469470887): **sin barra**, se ve bien |

Pendiente: un Android con Chrome (debe abrir sin barra por el vínculo `assetlinks`) y un iPhone (Safari → Agregar a inicio).

## Detalles técnicos

- `android/twa-manifest.json`: configuración de Bubblewrap (paquete `com.aliaforrent.app`, dominio, colores, íconos). El proyecto Android completo se genera en cada corrida y no se versiona.
- `.github/workflows/build-android.yml`: compila con Java 17 + Android SDK del runner; `versionCode` = número de corrida.
- `apps/web/src/app/.well-known/assetlinks.json/route.ts`: la ruta del paso 4. Test: `scripts/test-assetlinks.cjs`.
- **No cambiar el `packageId`** después de instalar: para Android sería otra app.
