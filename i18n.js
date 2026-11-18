(() => {
  const selector = document.querySelector('#language');
  let language = 'es';
  try {
    language = localStorage.getItem('ph-language') === 'en' ? 'en' : 'es';
  } catch {}
  let dictionary = {};
  let reverse = {};
  const attributeSources = new WeakMap();

  function translated(value) {
    const clean = value.trim();
    const spanish = reverse[clean] || clean;
    const result = language === 'en' ? dictionary[spanish] || spanish : spanish;
    return value.replace(clean, () => result);
  }

  function render() {
    document.documentElement.lang = language;
    selector.value = language;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement.closest('script,style,select,noscript') || !node.nodeValue.trim()
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const next = translated(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    }
    document.title = translated(document.title);
    document.querySelectorAll('[aria-label],img[alt]').forEach(element => {
      let originals = attributeSources.get(element);
      if (!originals) {
        originals = {};
        for (const name of ['aria-label', 'alt']) {
          if (element.hasAttribute(name)) originals[name] = element.getAttribute(name);
        }
        attributeSources.set(element, originals);
      }
      for (const [name, original] of Object.entries(originals)) {
        element.setAttribute(name, translated(original));
      }
    });
  }

  selector.addEventListener('change', () => {
    language = selector.value;
    try { localStorage.setItem('ph-language', language); } catch {}
    render();
  });

  // Newly inserted JSON content uses the same language as the rest of the page.
  const observer = new MutationObserver(() => render());
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  // Pause observation while applying translations to avoid observing our own changes.
  const apply = render;
  render = function () {
    observer.disconnect();
    apply();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  };

  fetch('translations.json')
    .then(response => {
      if (!response.ok) throw new Error('Translations unavailable');
      return response.json();
    })
    .then(data => {
      dictionary = data;
      reverse = Object.fromEntries(Object.entries(data).map(([es, en]) => [en, es]));
      render();
    })
    .catch(() => {
      selector.value = 'es';
      selector.disabled = true;
    });
  render();
})();
