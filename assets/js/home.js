(function () {
  const homeData = window.PIXEL_FLOW_HOME || {};
  const featured = Array.isArray(homeData.featured) ? homeData.featured : [];
  const maxLevel = Number(homeData.maxLevel) || 0;
  const ranges = Array.isArray(homeData.ranges) ? homeData.ranges : [];

  function syncMaxInputs() {
    document.querySelectorAll('[data-nav-jump-input]').forEach((input) => {
      if (!maxLevel) return;
      input.max = String(maxLevel);
      if (input.placeholder) {
        input.placeholder = input.placeholder.replace(/1-\d+/, `1-${maxLevel}`);
      }
    });
  }

  function buildGuideHref(level) {
    return `level/${level}/`;
  }

  function rangeLabel(entry) {
    if (!entry || !entry.levelStart) return 'Pixel Flow Walkthrough';
    if (entry.levelStart === entry.levelEnd) return `Level ${entry.levelStart}`;
    return `Levels ${entry.levelStart}-${entry.levelEnd}`;
  }

  function difficultyTag(title) {
    if (!title) return '';
    if (/very hard/i.test(title)) return 'Very Hard';
    if (/hard/i.test(title)) return 'Hard';
    return '';
  }

  function buildCard(entry) {
    const levelNumber = entry.levelStart || entry.levelEnd || 1;
    const card = document.createElement('div');
    card.className = 'level-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.dataset.videoId = entry.videoId || '';
    card.dataset.title = entry.title || 'Pixel Flow Walkthrough';
    card.dataset.subtitle = entry.subtitle || 'Video walkthrough';
    card.dataset.href = buildGuideHref(levelNumber);
    card.dataset.level = String(levelNumber);

    const art = document.createElement('div');
    art.className = 'level-thumb';

    const img = document.createElement('img');
    img.src = entry.videoId ? `https://img.youtube.com/vi/${entry.videoId}/hqdefault.jpg` : '';
    img.alt = card.dataset.title;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 480;
    img.height = 360;
    art.appendChild(img);

    const thumbLabel = document.createElement('span');
    thumbLabel.className = 'level-thumb-label';
    thumbLabel.textContent = rangeLabel(entry);
    art.appendChild(thumbLabel);

    const title = document.createElement('h3');
    title.textContent = card.dataset.title;

    const meta = document.createElement('div');
    meta.className = 'level-meta';
    const subtitle = document.createElement('span');
    subtitle.textContent = card.dataset.subtitle;
    const badge = document.createElement('span');
    badge.textContent = difficultyTag(entry.title) || 'Walkthrough';
    meta.appendChild(subtitle);
    meta.appendChild(badge);

    const open = document.createElement('a');
    open.className = 'level-open';
    open.href = card.dataset.href;
    open.textContent = 'Open Guide';

    card.appendChild(art);
    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(open);
    return card;
  }

  function setupNavJump() {
    document.querySelectorAll('[data-nav-jump-btn]').forEach((button) => {
      const scope = button.parentElement || document;
      const input = scope.querySelector('[data-nav-jump-input]') || document.querySelector('[data-nav-jump-input]');
      if (!input) return;

      function jump() {
        const targetNum = Number(input.value);
        if (!Number.isFinite(targetNum) || targetNum < 1) return;
        if (maxLevel && targetNum > maxLevel) {
          window.location.href = `/404.html?from=${encodeURIComponent(`level/${targetNum}/`)}`;
          return;
        }
        window.location.href = buildGuideHref(targetNum);
      }

      button.addEventListener('click', jump);
      input.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') jump();
      });
    });
  }

  function updatePreview(entry) {
    if (!entry || !entry.videoId) return;
    const previewFrame = document.querySelector('[data-level-preview]');
    const previewTitle = document.querySelector('[data-preview-title]');
    const previewMeta = document.querySelector('[data-preview-meta]');
    const previewLink = document.querySelector('[data-preview-link]');
    const previewYt = document.querySelector('[data-preview-yt]');
    if (!previewFrame) return;

    const fallback = previewFrame.querySelector('.video-fallback');
    if (fallback) {
      fallback.href = `https://www.youtube.com/watch?v=${entry.videoId}`;
      const img = fallback.querySelector('img');
      if (img) {
        img.src = `https://img.youtube.com/vi/${entry.videoId}/hqdefault.jpg`;
        img.alt = entry.title || 'Pixel Flow walkthrough preview';
        img.width = 480;
        img.height = 360;
      }
    }

    if (previewTitle) previewTitle.textContent = entry.title || 'Pixel Flow Walkthrough';
    if (previewMeta) previewMeta.textContent = entry.subtitle || 'Video walkthrough';
    if (previewLink) previewLink.href = buildGuideHref(entry.levelStart || entry.levelEnd || 1);
    if (previewYt) previewYt.href = `https://www.youtube.com/watch?v=${entry.videoId}`;

    document.querySelectorAll('[data-featured-levels] .level-card').forEach((card) => {
      card.classList.toggle('is-active', card.dataset.videoId === entry.videoId);
    });
  }

  function setupFeatured() {
    const container = document.querySelector('[data-featured-levels]');
    if (!container || !featured.length) return;
    container.innerHTML = '';
    featured.forEach((entry) => container.appendChild(buildCard(entry)));
    updatePreview(featured[0]);

    function handleCard(card) {
      if (!card) return;
      updatePreview({
        videoId: card.dataset.videoId,
        title: card.dataset.title,
        subtitle: card.dataset.subtitle,
        levelStart: Number(card.dataset.level) || 1,
        levelEnd: Number(card.dataset.level) || 1,
      });
    }

    container.addEventListener('click', (event) => {
      const card = event.target.closest('.level-card');
      if (!card || event.target.closest('.level-open')) return;
      event.preventDefault();
      handleCard(card);
    });

    container.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = event.target.closest('.level-card');
      if (!card) return;
      event.preventDefault();
      handleCard(card);
    });
  }

  function setupHomeRangeFilters() {
    const chips = document.querySelector('[data-home-range-filters]');
    if (!chips || !ranges.length) return;
    chips.innerHTML = '';

    const all = document.createElement('a');
    all.className = 'chip active';
    all.href = '/levels.html';
    all.textContent = 'ALL LEVELS';
    chips.appendChild(all);

    ranges.forEach((range) => {
      const link = document.createElement('a');
      link.className = 'chip';
      link.textContent = range.label;
      link.href = `/levels.html?range=${range.label}`;
      chips.appendChild(link);
    });
  }

  syncMaxInputs();
  setupNavJump();
  setupFeatured();
  setupHomeRangeFilters();
})();
