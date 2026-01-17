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

  const maxLevelGlobal = data.reduce((max, entry) => {
    if (!entry.levelEnd) return max;
    return entry.levelEnd > max ? entry.levelEnd : max;
  }, 0) || 550;
  const minLevelGlobal = data.reduce((min, entry) => {
    if (!entry.levelStart) return min;
    return entry.levelStart < min ? entry.levelStart : min;
  }, Infinity);
  const availableLevels = (() => {
    const set = new Set();
    data.forEach((entry) => {
      if (!entry.levelStart || !entry.levelEnd) return;
      const start = Math.min(entry.levelStart, entry.levelEnd);
      const end = Math.max(entry.levelStart, entry.levelEnd);
      for (let lvl = start; lvl <= end; lvl++) {
        set.add(lvl);
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  })();

  const detailPageRaw = (document.body && document.body.dataset.detailPage) || 'level';
  const detailPage = detailPageRaw.endsWith('/') ? detailPageRaw.replace(/\/+$/, '') : detailPageRaw;

  function buildHref(entry, levelOverride) {
    if (!entry) return '#';
    const levelNumber = levelOverride || entry.levelStart || entry.levelEnd || 1;
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
        const targetNum = Number(targetLevel);
        if (!entry || !Number.isFinite(targetNum) || targetNum > maxLevelGlobal) {
          const fallbackPath = `${detailPage}/${targetLevel}/`;
          window.location.href = `/404.html?from=${encodeURIComponent(fallbackPath)}`;
          return;
        }
        window.location.href = buildHref(entry, targetNum);
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

    const step = 50;
    const ranges = buildRangesFromData(step);
    const rangeButtons = new Map();

    function render(list) {
      grid.innerHTML = '';
      list
        .slice()
        .sort((a, b) => {
          const aStart = a.levelStart || 0;
          const bStart = b.levelStart || 0;
          if (aStart !== bStart) return aStart - bStart;
          const aEnd = a.levelEnd || aStart;
          const bEnd = b.levelEnd || bStart;
          return aEnd - bEnd;
        })
        .forEach((entry) => grid.appendChild(buildCard(entry)));
      if (count) count.textContent = `${list.length} walkthroughs`;
      if (empty) empty.style.display = list.length ? 'none' : 'block';
    }

    function applyRange(start, end) {
      const filtered = data.filter((entry) => {
        if (!entry.levelStart || !entry.levelEnd) return false;
        return entry.levelStart <= end && entry.levelEnd >= start;
      });
      render(filtered);
    }

    if (filters) {
      filters.innerHTML = '';
      const allButton = document.createElement('button');
      allButton.className = 'chip active';
      allButton.textContent = 'All Levels';
      const activate = (button) => {
        filters.querySelectorAll('.chip').forEach((chip) => chip.classList.remove('active'));
        button.classList.add('active');
      };
      allButton.addEventListener('click', () => {
        activate(allButton);
        render(data);
      });
      filters.appendChild(allButton);

      ranges.forEach((range) => {
        const button = document.createElement('button');
        button.className = 'chip';
        button.textContent = range.label;
        button.addEventListener('click', () => {
          activate(button);
          applyRange(range.start, range.end);
        });
        filters.appendChild(button);
        rangeButtons.set(`${range.start}-${range.end}`, button);
      });

      const initialRange = getRangeFromQuery(ranges);
      if (initialRange) {
        const key = `${initialRange.start}-${initialRange.end}`;
        const btn = rangeButtons.get(key);
        if (btn) {
          activate(btn);
          applyRange(initialRange.start, initialRange.end);
        } else {
          render(data);
        }
      } else {
        render(data);
      }
    } else {
      render(data);
    }

    function searchJump() {
      if (!searchInput) return;
      if (searchError) searchError.style.display = 'none';
      const entry = findEntryByLevel(searchInput.value);
      const targetNum = Number(searchInput.value);
      if (entry && Number.isFinite(targetNum) && targetNum <= maxLevelGlobal) {
        window.location.href = buildHref(entry, targetNum);
        return;
      }
      if (Number.isFinite(targetNum) && targetNum > maxLevelGlobal) {
        const fallbackPath = `${detailPage}/${searchInput.value}/`;
        window.location.href = `/404.html?from=${encodeURIComponent(fallbackPath)}`;
        return;
      }
      if (searchError) {
        searchError.style.display = 'block';
      }
    }

    if (searchButton) searchButton.addEventListener('click', searchJump);
    if (searchInput) {
      searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') searchJump();
      });
    }
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

  function getCurrentLevelFromUrl() {
    const match = (window.location.pathname || '').match(/\/level\/(\d+)/);
    if (match && match[1]) {
      const num = Number(match[1]);
      if (Number.isFinite(num)) return num;
    }
    return null;
  }

  function pickNearbyLevels(current, count) {
    const list = availableLevels;
    if (!list.length) return [];
    let anchor = list.indexOf(current);
    if (anchor === -1) {
      const nextIdx = list.findIndex((lvl) => lvl > current);
      anchor = nextIdx === -1 ? list.length - 1 : nextIdx;
    }
    const chosen = [];
    let offset = 0;
    while (chosen.length < count && (anchor - offset >= 0 || anchor + offset < list.length)) {
      if (offset === 0 && anchor >= 0) {
        chosen.push(list[anchor]);
      } else {
        if (anchor + offset < list.length) chosen.push(list[anchor + offset]);
        if (chosen.length >= count) break;
        if (anchor - offset >= 0) chosen.push(list[anchor - offset]);
      }
      offset += 1;
    }
    return Array.from(new Set(chosen))
      .slice(0, count)
      .sort((a, b) => a - b);
  }

  function setupDetailQuickLinks() {
    const grid = document.querySelector('.related-grid');
    if (!grid) return;
    const currentLevel = getCurrentLevelFromUrl();
    if (!Number.isFinite(currentLevel)) return;
    const nearby = pickNearbyLevels(currentLevel, 30);
    if (!nearby.length) return;

    const fragment = document.createDocumentFragment();
    nearby.forEach((lvl) => {
      const link = document.createElement('a');
      link.className = 'related-chip';
      link.href = `/level/${lvl}/`;
      link.textContent = lvl;
      fragment.appendChild(link);
    });
    grid.innerHTML = '';
    grid.appendChild(fragment);
  }

  function buildRangesFromData(step) {
    const ranges = [];
    if (!Number.isFinite(minLevelGlobal) || !Number.isFinite(maxLevelGlobal)) return ranges;
    const hasEntriesInRange = (start, end) =>
      data.some((entry) => {
        if (!entry.levelStart || !entry.levelEnd) return false;
        return entry.levelStart <= end && entry.levelEnd >= start;
      });
    const firstRangeStart = Math.floor((minLevelGlobal - 1) / step) * step + 1;
    for (let start = firstRangeStart; start <= maxLevelGlobal; start += step) {
      const end = Math.min(start + step - 1, maxLevelGlobal);
      if (hasEntriesInRange(start, end)) {
        ranges.push({ start, end, label: `${start}-${end}` });
      }
    }
    return ranges;
  }

  function getRangeFromQuery(ranges) {
    if (!Array.isArray(ranges) || !ranges.length) return null;
    const params = new URLSearchParams(window.location.search || '');
    const value = params.get('range');
    if (!value) return null;
    const match = value.match(/(\d+)\s*-\s*(\d+)/);
    if (!match) return null;
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    const found = ranges.find((range) => range.start === start && range.end === end);
    return found || null;
  }

  function setupDetailRangeFilters() {
    const related = document.querySelector('.related-levels');
    if (!related) return;
    if (document.querySelector('[data-detail-range-filters]')) return;
    const ranges = buildRangesFromData(50);
    if (!ranges.length) return;

    const section = document.createElement('section');
    section.className = 'section';
    section.style.paddingTop = '2rem';
    const container = document.createElement('div');
    container.className = 'container';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'section-title';
    const h2 = document.createElement('h2');
    h2.textContent = 'Filter by level range';
    const p = document.createElement('p');
    p.textContent = 'Browse the pixel flow guide in batches or view every level at once.';
    titleWrap.appendChild(h2);
    titleWrap.appendChild(p);

    const chips = document.createElement('div');
    chips.className = 'chips';
    chips.setAttribute('data-detail-range-filters', '');

    const all = document.createElement('a');
    all.className = 'chip';
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

    container.appendChild(titleWrap);
    container.appendChild(chips);
    section.appendChild(container);

    const heroSection = document.querySelector('.hero');
    if (heroSection && heroSection.parentNode) {
      heroSection.insertAdjacentElement('afterend', section);
    } else {
      document.querySelector('main')?.insertBefore(section, document.querySelector('main').firstChild || null);
    }
  }

  setupNavJump();
  setupHomeFeatured();
  setupLevelsPage();
  setupDetailRangeFilters();
  setupDetailQuickLinks();
  setupPreview();
})();
