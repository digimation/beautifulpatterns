const configRequests = new Map();

function readConfig(path) {
  if (!configRequests.has(path)) configRequests.set(path, fetchConfig(path));
  return configRequests.get(path);
}

async function fetchConfig(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error('No se pudo consultar la configuración');
  return response.json();
}

function externalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

const IDIOMAS = { es: 'Español', en: 'Inglés', bilingue: 'Bilingüe' };

function formatDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return null;
  const date = new Date(Date.UTC(+match[1], match[2] - 1, +match[3]));
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function contactEmail(value) {
  return typeof value === 'string' && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value) ? value : null;
}

function editionDetails(edition) {
  const row = document.createElement('tr');
  row.className = 'edition-details';
  const cell = row.insertCell();
  cell.colSpan = 5;
  const items = ['Gratuito'];
  if (edition.edades) items.push(edition.edades);
  if (edition.idioma) items.push(IDIOMAS[edition.idioma] || edition.idioma);
  const closes = formatDate(edition.cierreInscripcion);
  if (closes) items.push('Inscripciones hasta el ' + closes);
  for (const text of items) {
    const chip = document.createElement('span');
    chip.className = 'detail-chip';
    chip.textContent = text;
    cell.append(chip);
  }
  const email = contactEmail(edition.contactoDudas);
  if (email) {
    const chip = document.createElement('span');
    chip.className = 'detail-chip';
    const link = document.createElement('a');
    link.href = 'mailto:' + email;
    link.textContent = email;
    chip.append('Dudas: ', link);
    cell.append(chip);
  }
  return row;
}

async function showBootcamps() {
  const status = document.querySelector('#bootcamp-status');
  if (!status) return;
  try {
    const editions = await readConfig('bootcamps.json');
    const open = editions.filter(edition =>
      ['abierto', 'proximamente'].includes(edition.estado)
    );
    if (!open.length) {
      status.textContent = 'Por ahora no hay inscripciones abiertas. Aquí aparecerán las próximas fechas y sedes.';
      return;
    }
    const tbody = document.querySelector('.schedule tbody');
    for (const edition of open) {
      const row = tbody.insertRow();
      for (const [value, extra] of [
        [[edition.emoji, edition.pais].filter(Boolean).join(' ')],
        [edition.ciudad],
        [edition.anfitrion, edition.campus && 'Campus ' + edition.campus],
        [edition.fechas, edition.horario]
      ]) {
        const cell = row.insertCell();
        cell.textContent = value || '';
        if (extra) {
          const note = document.createElement('small');
          note.className = 'cell-note';
          note.textContent = extra;
          cell.append(document.createElement('br'), note);
        }
      }
      tbody.append(editionDetails(edition));
      const link = document.createElement('a');
      link.className = 'button';
      const registration = externalUrl(edition.inscripcionUrl);
      if (edition.estado === 'proximamente' || !registration) {
        const notice = document.createElement('span');
        notice.className = 'registration-soon';
        notice.textContent = 'Inscripciones próximamente';
        row.insertCell().append(notice);
        continue;
      }
      link.href = registration;
      link.target = '_blank';
      link.rel = 'noopener';
      const action = 'Inscríbete';
      link.textContent = action + ' ↗';
      link.setAttribute('aria-label', action + ' · Bootcamp de ' + edition.ciudad);
      row.insertCell().append(link);
    }
    document.querySelector('.table-wrap').hidden = false;
    status.hidden = true;
  } catch {
    status.textContent = 'No pudimos cargar las inscripciones. Intenta recargar la página.';
  }
}

async function showContests() {
  const sections = document.querySelectorAll('[data-contest]');
  if (!sections.length) return;
  try {
    const contests = await readConfig('convocatorias.json');
    for (const section of sections) {
      const contest = contests[section.dataset.contest];
      const url = externalUrl(contest?.formularioUrl);
      if (contest?.estado !== 'abierto' || !url) continue;
      section.querySelector('[data-status]').textContent = 'Convocatoria abierta. Consulta las bases y envía tu participación en el formulario.';
      const link = section.querySelector('[data-submit]');
      link.href = url;
      link.hidden = false;
    }
  } catch {
    // The page already includes the default announcement for unopened calls.
  }
}

showBootcamps();
showContests();
showActivityList();


function activityPhase(activity, now = Date.now()) {
  const closes = Date.parse(activity.cierreParticipacion);
  const voteCloses = Date.parse(activity.cierreVotacion);
  const ended = Number.isFinite(closes) && now >= closes;
  const voting = ended && activity.estado !== 'cerrado' &&
    (!Number.isFinite(voteCloses) || now < voteCloses);
  return {
    participate: activity.estado === 'abierto' && !ended && Boolean(externalUrl(activity.formularioUrl)),
    vote: voting && Boolean(externalUrl(activity.votacionUrl))
  };
}

async function showActivityList() {
  const list = document.querySelector('#contest-list');
  if (!list) return;
  try {
    const [activities, bootcamps] = await Promise.all([
      readConfig('convocatorias.json'), readConfig('bootcamps.json')
    ]);
    const hasBootcamp = bootcamps.some(bootcamp => ['abierto', 'en_curso'].includes(bootcamp.estado));
    const visible = Object.values(activities).filter(activity =>
      activity.titulo && activity.estado !== 'oculto' &&
      (activity.activacion !== 'bootcamp_abierto' || hasBootcamp)
    );
    list.replaceChildren();
    if (!visible.length) {
      list.textContent = 'Pronto compartiremos nuevas actividades.';
      return;
    }
    list.className = 'contest-layout';
    const rows = document.createElement('div');
    rows.className = 'contest-rows accordion';
    rows.id = 'activities-accordion';
    const figure = document.createElement('figure');
    figure.className = 'contest-preview surface';
    const image = document.createElement('img');
    image.id = 'activity-image';
    const caption = document.createElement('figcaption');
    caption.setAttribute('aria-live', 'polite');
    const download = document.createElement('a');
    figure.append(image, caption, download);
    list.append(rows, figure);
    const selectors = [];
    function select(activity, current) {
      selectors.forEach(button => button.setAttribute('aria-pressed', String(button === current)));
      image.src = activity.imagen || 'assets/crea-tu-historia.webp';
      image.alt = activity.imagenAlt || activity.titulo;
      caption.textContent = activity.titulo;
      download.hidden = !activity.descargaUrl;
      download.href = activity.descargaUrl || '';
      download.download = '';
      download.textContent = activity.descargaTexto || 'Descargar imagen';
    }
    for (const [index, activity] of visible.entries()) {
      const row = document.createElement('article');
      row.className = 'contest-row surface accordion-item';
      const heading = document.createElement('h3');
      heading.className = 'accordion-header';
      const selector = document.createElement('button');
      selector.type = 'button';
      selector.className = 'contest-select accordion-button' + (index === 0 ? '' : ' collapsed');
      selector.textContent = activity.titulo;
      const panel = document.createElement('div');
      panel.id = 'activity-panel-' + index;
      panel.className = 'contest-panel accordion-collapse collapse' + (index === 0 ? ' show' : '');
      panel.setAttribute('data-bs-parent', '#activities-accordion');
      selector.setAttribute('data-bs-toggle', 'collapse');
      selector.setAttribute('data-bs-target', '#' + panel.id);
      selector.id = 'activity-toggle-' + index;
      selector.setAttribute('aria-controls', panel.id);
      selector.setAttribute('aria-expanded', String(index === 0));
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-labelledby', selector.id);
      selector.setAttribute('aria-pressed', 'false');
      selectors.push(selector);
      panel.addEventListener('show.bs.collapse', () => select(activity, selector));
      selector.addEventListener('keydown', event => {
        const current = selectors.indexOf(selector);
        const target = {
          ArrowDown: (current + 1) % selectors.length,
          ArrowUp: (current - 1 + selectors.length) % selectors.length,
          Home: 0,
          End: selectors.length - 1
        }[event.key];
        if (target === undefined) return;
        event.preventDefault();
        selectors[target].focus();
      });
      heading.append(selector);
      const description = document.createElement('p');
      description.textContent = activity.descripcion;
      const actions = document.createElement('div');
      actions.className = 'contest-actions';
      const phase = activityPhase(activity);
      for (const [label, enabled, url] of [
        ['Participar', phase.participate, activity.formularioUrl],
        ['Votar', phase.vote, activity.votacionUrl]
      ]) {
        const control = document.createElement(enabled ? 'a' : 'button');
        control.className = 'button contest-action';
        control.textContent = label;
        control.setAttribute('aria-label', label + ' · ' + activity.titulo);
        if (enabled) {
          control.href = externalUrl(url);
          control.target = '_blank';
          control.rel = 'noopener';
        }
        else {
          control.type = 'button';
          control.disabled = true;
        }
        actions.append(control);
      }
      const notice = document.createElement('small');
      notice.textContent = phase.vote ? 'Votación abierta.' :
        phase.participate ? 'Participación abierta. La votación estará disponible al cerrar el concurso.' :
        activity.estado === 'cerrado' ? 'Convocatoria finalizada.' : 'Próximamente compartiremos las fechas y las bases.';
      panel.append(description, actions, notice);
      row.append(heading, panel);
      rows.append(row);
    }
    select(visible[0], selectors[0]);
  } catch {
    list.textContent = 'No pudimos cargar las actividades. Intenta recargar la página.';
  }
}

async function showCareers() {
  const list = document.querySelector('#career-list');
  if (!list) return;
  try {
    const careers = await readConfig('careers.json');
    const open = careers.filter(role => role.estado === 'abierto');
    list.replaceChildren();
    if (!open.length) {
      list.textContent = 'Por ahora no hay convocatorias abiertas. Las próximas oportunidades aparecerán aquí.';
    }
    for (const role of open) {
      const card = document.createElement('article');
      card.className = 'surface career-card';
      const title = document.createElement('h2');
      title.textContent = role.titulo;
      const location = document.createElement('p');
      location.textContent = [role.ubicacion, role.modalidad].filter(Boolean).join(' · ');
      const description = document.createElement('p');
      description.textContent = role.descripcion;
      card.append(title, location, description);
      const url = externalUrl(role.postulacionUrl);
      if (url) {
        const apply = document.createElement('a');
        apply.className = 'button';
        apply.href = url;
        apply.textContent = 'Postúlate ↗';
        card.append(apply);
      }
      list.append(card);
    }
  } catch {
    list.textContent = 'No pudimos cargar las oportunidades. Intenta recargar la página.';
  }
}

async function showSocialLinks() {
  const containers = document.querySelectorAll('[data-social-links]');
  if (!containers.length) return;
  try {
    const social = await readConfig('redes.json');
    for (const container of containers) {
      [...container.children].forEach((placeholder, index) => {
        const url = externalUrl(social[index === 0 ? 'linkedin' : 'linktree']);
        if (!url) return;
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.append(...placeholder.childNodes);
        placeholder.replaceWith(link);
      });
    }
  } catch {
    // Contact remains available if social configuration cannot be read.
  }
}
showCareers();
showSocialLinks();
