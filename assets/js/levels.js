(function () {
  const data = window.PIXEL_FLOW_PLAYLIST || [];

  function rangeLabel(entry) {
    if (!entry.levelStart) return 'Pixel Flow Walkthrough';
    if (entry.levelStart === entry.levelEnd) {
      return `Level ${entry.levelStart}`;
    }
    return `Levels ${entry.levelStart}-${entry.levelEnd}`;
  }

  function difficultyTag(title) {
    if (!title) return '';
    if (/very hard/i.test(title)) return 'Very Hard';
    if (/hard/i.test(title)) return 'Hard';
    return '';
  }

  const detailPageRaw = (document.body && document.body.dataset.detailPage) || 'level';
  const detailPage = detailPageRaw.endsWith('/') ? detailPageRaw.replace(/\/+$/, '') : detailPageRaw;

  function buildHref(entry) {
    if (!entry) return '#';
    const levelNumber = entry.levelStart || entry.levelEnd || 1;
    return `${detailPage}/${levelNumber}/`;
  }

  function buildCard(entry) {
    const levelNumber = entry.levelStart || entry.levelEnd || 1;
    const link = buildHref(entry);
    const card = document.createElement('div');
    card.className = 'level-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.dataset.videoId = entry.videoId || '';
    card.dataset.title = entry.title || 'Pixel Flow Walkthrough';
    card.dataset.subtitle = entry.subtitle || 'Video walkthrough';
    card.dataset.href = link;
    card.dataset.levelLabel = rangeLabel(entry);
    card.dataset.levelNumber = levelNumber;

    const art = document.createElement('div');
    art.className = 'level-thumb';
    const img = document.createElement('img');
    img.src = entry.videoId ? `https://img.youtube.com/vi/${entry.videoId}/hqdefault.jpg` : '';
    img.alt = card.dataset.title;
    img.loading = 'lazy';
    img.decoding = 'async';
    art.appendChild(img);
    const thumbLabel = document.createElement('span');
    thumbLabel.className = 'level-thumb-label';
    thumbLabel.textContent = card.dataset.levelLabel;
    art.appendChild(thumbLabel);

    const title = document.createElement('h3');
    title.textContent = card.dataset.title;

    const meta = document.createElement('div');
    meta.className = 'level-meta';

    const subtitle = document.createElement('span');
    subtitle.textContent = card.dataset.subtitle;

    const tag = difficultyTag(entry.title);
    const badge = document.createElement('span');
    badge.textContent = tag ? tag : 'Walkthrough';

    meta.appendChild(subtitle);
    meta.appendChild(badge);

    const open = document.createElement('a');
    open.className = 'level-open';
    open.href = link;
    open.textContent = 'Open Guide';
    open.setAttribute('aria-label', `Open Guide: ${card.dataset.title}`);

    card.appendChild(art);
    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(open);

    return card;
  }

  function findEntryByLevel(value) {
    const level = Number(value);
    if (!Number.isFinite(level)) return null;
    return data.find((entry) => {
      if (!entry.levelStart || !entry.levelEnd) return false;
      return level >= entry.levelStart && level <= entry.levelEnd;
    });
  }

  function setupNavJump() {
    const buttons = document.querySelectorAll('[data-nav-jump-btn]');
    if (!buttons.length) return;

    buttons.forEach((button) => {
      const scope = button.parentElement || document;
      const input = scope.querySelector('[data-nav-jump-input]') || document.querySelector('[data-nav-jump-input]');
      if (!input) return;

      function jump() {
        const entry = findEntryByLevel(input.value);
        const targetLevel = input.value || (entry && entry.levelStart) || '';
        if (!targetLevel) {
          alert('Level not found in current playlist data.');
          return;
        }
        if (entry) {
          window.location.href = buildHref(entry);
        } else {
          window.location.href = `${detailPage}/${targetLevel}/`;
        }
      }

      button.addEventListener('click', jump);
      input.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') jump();
      });
    });
  }

  function setupHomeFeatured() {
    const container = document.querySelector('[data-featured-levels]');
    if (!container) return;
    container.innerHTML = '';
    data.slice(0, 8).forEach((entry) => container.appendChild(buildCard(entry)));
  }

  function setupLevelsPage() {
    const grid = document.querySelector('[data-level-grid]');
    if (!grid) return;

    const filters = document.querySelector('[data-range-filters]');
    const count = document.querySelector('[data-level-count]');
    const empty = document.querySelector('[data-level-empty]');
    const searchInput = document.querySelector('[data-level-search-input]');
    const searchButton = document.querySelector('[data-level-search-btn]');
    const searchError = document.querySelector('[data-level-search-error]');

    const maxLevel = data.reduce((max, entry) => {
      return entry.levelEnd && entry.levelEnd > max ? entry.levelEnd : max;
    }, 0) || 550;

    const step = 50;
    const ranges = [];
    for (let start = 1; start <= maxLevel; start += step) {
      const end = Math.min(start + step - 1, maxLevel);
      ranges.push({ start, end, label: `${start}-${end}` });
    }

    function render(list) {
      grid.innerHTML = '';
      list.forEach((entry) => grid.appendChild(buildCard(entry)));
      if (count) count.textContent = `${list.length} walkthroughs`;
      if (empty) empty.style.display = list.length ? 'none' : 'block';
    }

    function applyRange(start, end) {
      const filtered = data.filter((entry) => {
        if (!entry.levelStart || !entry.levelEnd) return false;
        return entry.levelStart >= start && entry.levelEnd <= end;
      });
      render(filtered);
    }

    if (filters) {
      filters.innerHTML = '';
      const allButton = document.createElement('button');
      allButton.className = 'chip active';
      allButton.textContent = 'All Levels';
      allButton.addEventListener('click', () => {
        filters.querySelectorAll('.chip').forEach((chip) => chip.classList.remove('active'));
        allButton.classList.add('active');
        render(data);
      });
      filters.appendChild(allButton);

      ranges.forEach((range) => {
        const button = document.createElement('button');
        button.className = 'chip';
        button.textContent = range.label;
        button.addEventListener('click', () => {
          filters.querySelectorAll('.chip').forEach((chip) => chip.classList.remove('active'));
          button.classList.add('active');
          applyRange(range.start, range.end);
        });
        filters.appendChild(button);
      });
    }

    function searchJump() {
      if (!searchInput) return;
      if (searchError) searchError.style.display = 'none';
      const entry = findEntryByLevel(searchInput.value);
      if (entry) {
        if (entry) {
          window.location.href = buildHref(entry);
        } else {
          window.location.href = `${detailPage}/${searchInput.value}/`;
        }
      } else if (searchError) {
        searchError.style.display = 'block';
      }
    }

    if (searchButton) searchButton.addEventListener('click', searchJump);
    if (searchInput) {
      searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') searchJump();
      });
    }

    render(data);
  }

  function setupPreview() {
    const previewFrame = document.querySelector('[data-level-preview]');
    if (!previewFrame) return;

    const previewTitle = document.querySelector('[data-preview-title]');
    const previewMeta = document.querySelector('[data-preview-meta]');
    const previewLink = document.querySelector('[data-preview-link]');
    const previewYt = document.querySelector('[data-preview-yt]');
    const containers = document.querySelectorAll('[data-level-card-container]');

    function renderPlayer(entry) {
      if (!entry || !entry.videoId) return;
      if (typeof window.pixelFlowCreatePlayer === 'function') {
        window.pixelFlowCreatePlayer(previewFrame, entry.videoId, entry.title || entry.levelLabel);
        return;
      }
      const link = document.createElement('a');
      link.className = 'video-fallback visible';
      link.href = `https://www.youtube.com/watch?v=${entry.videoId}`;
      link.target = '_blank';
      link.rel = 'noopener';
      const img = document.createElement('img');
      img.src = `https://img.youtube.com/vi/${entry.videoId}/hqdefault.jpg`;
      img.alt = entry.title || 'Pixel Flow walkthrough';
      const label = document.createElement('span');
      label.textContent = '在 YouTube 播放';
      link.appendChild(img);
      link.appendChild(label);
      previewFrame.innerHTML = '';
      previewFrame.appendChild(link);
    }

    function updatePreview(entry) {
      if (!entry || !entry.videoId) return;
      renderPlayer(entry);

      const guideLink =
        entry.guideLink ||
        entry.href ||
        buildHref(entry);
      if (previewTitle) previewTitle.textContent = entry.title || entry.levelLabel || 'Pixel Flow Walkthrough';
      if (previewMeta) previewMeta.textContent = entry.subtitle || 'Video walkthrough';
      if (previewLink && guideLink) previewLink.href = guideLink;
      if (previewYt) previewYt.href = `https://www.youtube.com/watch?v=${entry.videoId}`;

      containers.forEach((container) => {
        container.querySelectorAll('.level-card').forEach((card) => {
          const isActive = card.dataset.videoId === entry.videoId;
          card.classList.toggle('is-active', isActive);
        });
      });
    }

    const defaultEntry = data.find((entry) => entry.videoId);
    if (defaultEntry) {
      updatePreview({
        videoId: defaultEntry.videoId,
        title: defaultEntry.title,
        subtitle: defaultEntry.subtitle,
        levelLabel: rangeLabel(defaultEntry),
        guideLink: buildHref(defaultEntry),
      });
    }

    containers.forEach((container) => {
      container.addEventListener('click', (event) => {
        const card = event.target.closest('.level-card');
        if (!card) return;
        if (event.target.closest('.level-open')) return;
        event.preventDefault();
        updatePreview({
          videoId: card.dataset.videoId,
          title: card.dataset.title,
          subtitle: card.dataset.subtitle,
          guideLink: card.dataset.href,
          levelLabel: card.dataset.levelLabel,
        });
      });

      container.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const card = event.target.closest('.level-card');
        if (!card) return;
        event.preventDefault();
        updatePreview({
          videoId: card.dataset.videoId,
          title: card.dataset.title,
          subtitle: card.dataset.subtitle,
          guideLink: card.dataset.href,
          levelLabel: card.dataset.levelLabel,
        });
      });
    });
  }

  setupNavJump();
  setupHomeFeatured();
  setupLevelsPage();
  setupPreview();
})();
