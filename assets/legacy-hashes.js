// Compatibilidade com favoritos e links antigos da página inicial.
(() => {
  function restoreLegacyHash() {
    if (!['/', '/index.html'].includes(location.pathname)) return;
    const hash = location.hash;
    if (['#blog', '#intro'].includes(hash)) {
      location.replace('/site-anterior.html' + location.search + hash);
    } else {
      const aliases = {'#projetos':'selected-work', '#hero':'conteudo', '#main-content':'conteudo'};
      if (aliases[hash]) document.getElementById(aliases[hash])?.scrollIntoView();
    }
  }
  restoreLegacyHash();
  addEventListener('hashchange', restoreLegacyHash);
})();
