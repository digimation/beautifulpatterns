# Patrones Hermosos · beautifulpatterns.org

Sitio estático publicado con GitHub Pages desde la raíz de este repo (dominio en `CNAME`). Para previsualizarlo, ejecuta `python3 -m http.server 8000`.

La versión anterior del sitio se conserva en la branch `previous-site`.

## Publicar una inscripción

Añade un objeto al arreglo de `bootcamps.json` con estos campos. Si un dato todavía no se conoce, usa `null` y no se muestra.

| Campo | Contenido |
| --- | --- |
| `pais` | Nombre del país |
| `emoji` | Bandera |
| `ciudad` | Ciudad sede |
| `anfitrion` | Nombre de la universidad sede |
| `campus` | Campus (opcional); se muestra como «Campus …» bajo la universidad |
| `fechas` | Rango de fechas para mostrar, incluido el año |
| `horario` | Horario (por ejemplo «9:00 a 15:00 h»); se muestra bajo las fechas |
| `idioma` | `Español`, `Inglés` o `Bilingüe` |
| `edades` | Rango de edades (por ejemplo «13 a 17 años») |
| `estado` | `proximamente` muestra la sede sin enlace; `abierto` muestra el botón de inscripción; `cerrado` la oculta |
| `inscripcionUrl` | Enlace HTTPS al formulario oficial de la sede |
| `cierreInscripcion` | Fecha de cierre en formato `AAAA-MM-DD` |
| `contactoDudas` | Correo de contacto para dudas |

## Abrir una convocatoria

En `convocatorias.json`, cambia el estado de `stickers`, `historias` o `sedes` a `abierto` y añade su `formularioUrl` HTTPS. El formulario enlazado gestiona las bases, los datos y los archivos de participación.

Si falta el enlace de una edición, la fila muestra «Inscripciones próximamente».

## Layout y componentes

CSS nativo compartido en styles.css. Tokens de marca en :root, contenedor .wrap, CSS Grid para .split, .trio, .paths y .foot, Flexbox en navegación. Estilos responsive mediante media queries y componentes con nombres descriptivos. Mantén las nuevas páginas dentro de esta estructura.

Las actividades de portada se definen en convocatorias.json con titulo, descripcion, estado, activacion, formularioUrl y recursos opcionales. activacion=bootcamp_abierto muestra la actividad si alguna edición tiene estado abierto o en_curso. Esto controla su visibilidad. El envío se habilita al cambiar el estado de la actividad a abierto y configurar un formularioUrl HTTPS.

## Participación y votación

Cada fila de concursos tiene un selector que actualiza su imagen y dos acciones. El lila fuerte usa el token --violet. Configura cierreParticipacion como fecha ISO con zona horaria, por ejemplo 2027-01-15T18:00:00-06:00. Participar requiere estado abierto y formularioUrl. Votar requiere que haya pasado cierreParticipacion y exista votacionUrl. cierreVotacion es opcional y cierra el botón de voto al cumplirse. estado cerrado deshabilita ambas acciones. La fase se evalúa al cargar la página.

## Careers y redes

careers.json contiene un arreglo de oportunidades con titulo, descripcion, ubicacion, modalidad, estado y postulacionUrl HTTPS. estado=abierto publica la oportunidad. redes.json contiene los enlaces HTTPS de linkedin y linktree. Hasta configurarlos, sus etiquetas e iconos se muestran sin enlace.

## Idiomas y navegación

El menú es sticky y usa el dropdown de Bootstrap para Bootcamp e Inscripciones. El selector ES/EN conserva la preferencia en el navegador. i18n.js traduce el contenido estático y los textos cargados desde JSON mediante translations.json. Al añadir texto nuevo a convocatorias, oportunidades o páginas, añade su par español-inglés a translations.json.
