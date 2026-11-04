# La Llegada del Mesías · Etapa 9 (0 – 33 d.C.)

Web 3D **para móvil** (columna única, pensada para el pulgar) que convierte la lámina «Etapa 9» en **un camino hacia Dios**:
al deslizar caminas por un sendero de piedra que sube entre colinas nocturnas hacia una gran Luz. Las lámparas se encienden a tu paso
y la Luz crece y cambia de tono en cada capítulo (oro, ámbar, rojo en la Pascua, blanco al final).

Inspirada en la experiencia narrativa de [georgedo.com](https://georgedo.com/) (Awwwards): umbral con elección de sonido,
capítulos numerados, porcentaje de avance y un recorrido guiado por la luz.

Parroquia de Santa Casilda · Carabanchel, Madrid.

## Capítulos

| # | Capítulo | Contenido |
|---|----------|-----------|
| 00 | Inicio | En la plenitud de los tiempos |
| 01 | Encarnación | El «Fiat» de María · La Sagrada Familia · El Dios con nosotros |
| 02 | Promesa | 6 tarjetas-mojón: pergamino del AT delante; al tocar, se giran y muestran el cumplimiento en el NT |
| 03 | Pascua | Cruz · Resurrección · Nueva Alianza · Ascensión |
| 04 | Corazón | Reflexión final y pausa |

**Momento firma:** el camino hacia la Luz. En «Promesa», cada promesa cumplida enciende su mojón y dibuja en oro
el tramo de sendero hasta la siguiente; un contador fijo abajo («3 de 6 promesas cumplidas») invita a completarlas.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub, por ejemplo `llegada-del-mesias`.
2. Sube **todo el contenido** de esta carpeta (no la carpeta en sí) a la rama `main`.
3. En **Settings → Pages**, elige *Deploy from a branch* → `main` → `/ (root)` y guarda.
4. En un par de minutos estará en `https://TU-USUARIO.github.io/llegada-del-mesias/`.

## Estructura

```
index.html        recorrido completo
404.html          página de error con el mismo sistema
css/style.css     tokens (variante pastoral) y estilos
js/main.js        umbral, sonido sintetizado, progreso, revelados, mazo de páginas
js/scene.js       escena Three.js (sendero, colinas, lámparas, cielo, la Luz)
img/              medallones y miniaturas recortados de la infografía (WebP), og.jpg
```

## Notas técnicas

- Three.js 0.160 incluido en `js/vendor/` (import map, sin CDN). Sin WebGL → respaldo estático con resplandor dorado.
- DPR ≤ 1,5 y baja a 0,75 si mide menos de 35 fps (pensado para PCs sin tarjeta gráfica). Se pausa con la pestaña oculta.
- Sonido: acorde suave generado con Web Audio (no hay archivos de audio); papel al pasar página.
- Botón «Reducir movimiento» + respeto a `prefers-reduced-motion`.
- Las tarjetas son botones (`aria-pressed`): funcionan con toque, teclado y lector de pantalla. Vibración breve al cumplirse una promesa (Android).
- `Esc` entra en silencio o cierra el índice.
- Para cambiar textos de las promesas: array `DATA` en `js/main.js`.
- Sin WebGL se muestra el mismo camino dibujado en SVG.
- Imágenes: recortes de la lámina «Etapa 9» (Gemini Notebook). Sustitúyelas en `img/` con el mismo nombre si generas otras.
