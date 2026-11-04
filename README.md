# La Llegada del Mesías · Etapa 9 (0 – 33 d.C.)

Web 3D de un solo recorrido para contemplar la Encarnación, la promesa cumplida y el Misterio Pascual.
Inspirada en la experiencia narrativa de [georgedo.com](https://georgedo.com/) (Awwwards): umbral con elección de sonido,
capítulos numerados `01 / 04`, porcentaje de avance, páginas que se pasan arrastrando y un hilo de luz dorada entre velos oscuros.

Parroquia de Santa Casilda · Carabanchel, Madrid.

## Capítulos

| # | Capítulo | Contenido |
|---|----------|-----------|
| 00 | Inicio | En la plenitud de los tiempos |
| 01 | Encarnación | El «Fiat» de María · La Sagrada Familia · El Dios con nosotros |
| 02 | Promesa | 6 páginas profecía → cumplimiento (se arrastran) |
| 03 | Pascua | Cruz · Resurrección · Nueva Alianza · Ascensión |
| 04 | Corazón | Reflexión final y pausa |

**Momento firma:** el hilo de luz. Guía la cámara por todo el recorrido y, en «Promesa», se dibuja uniendo cada profecía con su cumplimiento.

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
js/scene.js       escena Three.js (hilo de luz, polvo, velos)
img/              medallones y miniaturas recortados de la infografía (WebP), og.jpg
```

## Notas técnicas

- Three.js 0.160 incluido en `js/vendor/` (import map, sin CDN). Sin WebGL → respaldo estático con resplandor dorado.
- DPR ≤ 1,5 y baja a 0,75 si mide menos de 35 fps (pensado para PCs sin tarjeta gráfica). Se pausa con la pestaña oculta.
- Sonido: acorde suave generado con Web Audio (no hay archivos de audio); papel al pasar página.
- Botón «Reducir movimiento» + respeto a `prefers-reduced-motion`.
- Teclado: flechas ← → en el mazo de páginas; `Esc` entra en silencio.
- Para cambiar textos de las profecías: array `DATA` en `js/main.js`.
- Imágenes: recortes de la lámina «Etapa 9» (Gemini Notebook). Sustitúyelas en `img/` con el mismo nombre si generas otras.
