# LIVET para escritorio

La app de escritorio abre **https://app.livet.work** en su propia ventana, con su ícono, su menú y una pantalla propia cuando no hay internet.
Es la misma LIVET de la web. Cuando cambiás la página en GitHub, la app de escritorio muestra el cambio sola y no hay que reinstalarla.

| Sistema | Archivo que se genera |
|---|---|
| Windows | `LIVET-Setup-1.0.0.exe` (instalador con acceso directo en el escritorio) |
| Mac (Apple M1/M2/M3/M4) | `LIVET-1.0.0-arm64.dmg` |
| Mac (Intel) | `LIVET-1.0.0-x64.dmg` |
| Linux | `LIVET-1.0.0.AppImage` |

## Cómo generar los instaladores (una sola vez, todo desde la web de GitHub)

1. En GitHub, creá un repositorio nuevo, por ejemplo `livet-desktop`. Puede ser privado.
2. Entrá a **Add file → Upload files** y arrastrá todo el contenido de esta carpeta: `package.json`, `main.js`, `offline.html`, la carpeta `build` y la carpeta `.github`. Tocá **Commit changes**.
   - Si la carpeta `.github` no se sube (algunas computadoras la ocultan), creala a mano: **Add file → Create new file**, escribí `.github/workflows/build.yml` como nombre y pegá el contenido de ese archivo.
3. Entrá a la pestaña **Actions**, elegí **Instaladores LIVET** y tocá **Run workflow**. Tarda unos 5 a 10 minutos.
4. Cuando termine, abrí esa ejecución. Abajo, en **Artifacts**, están los instaladores para descargar: `LIVET-Windows`, `LIVET-macOS` y `LIVET-Linux`.

## Publicarla con un enlace de descarga fijo

Para que tus usuarios la descarguen desde tu página:

1. En el repositorio, andá a **Releases → Draft a new release**.
2. En **Choose a tag**, escribí `v1.0.0` y elegí **Create new tag**. Tocá **Publish release**.
3. GitHub arma los instaladores y los adjunta a esa versión. Tarda unos minutos.
4. El enlace para descargar siempre la última versión es:
   `https://github.com/TU-USUARIO/livet-desktop/releases/latest`

Para sacar una versión nueva, por ejemplo con otro ícono, cambiá `"version"` en `package.json` (a `1.0.1`, por ejemplo) y publicá un release con el tag `v1.0.1`.

## Aviso la primera vez que se abre

Los instaladores no están firmados con un certificado de desarrollador, que es pago. Por eso, la primera vez:

- **Windows:** aparece "Windows protegió tu PC". Tocá **Más información → Ejecutar de todas formas**.
- **Mac:** hacé clic derecho en LIVET → **Abrir** → **Abrir**. Si dice que "está dañada", abrí Terminal y escribí:
  `xattr -cr /Applications/LIVET.app`

Para que no aparezcan estos avisos hace falta un certificado de Apple (US$ 99 por año) y uno de Windows. Se pueden agregar más adelante sin cambiar nada más.

## Probarla en tu computadora (opcional, para desarrolladores)

Con Node.js instalado: `npm install` y después `npm start`.
