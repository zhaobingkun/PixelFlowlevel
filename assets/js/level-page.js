(function () {
  const data = window.PIXEL_FLOW_PLAYLIST || [];

  function findEntryByLevel(level) {
    if (!Number.isFinite(level)) return null;
    return data.find((entry) => {
      if (!entry.levelStart || !entry.levelEnd) return false;
      return level >= entry.levelStart && level <= entry.levelEnd;
    });
  }

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function showError(msg) {
    const err = document.querySelector('[data-detail-error]');
    if (err) {
      err.textContent = msg || 'Level not found. Try another number.';
      err.style.display = 'block';
    }
  }

  function render(entry, levelNumber) {
    if (!entry) {
      showError('Level not found. Try another number.');
      return;
    }

    const titleText = entry.title || 'Pixel Flow Walkthrough';
    const subtitleText = entry.subtitle || 'Video walkthrough';
    const label = entry.levelStart === entry.levelEnd || !entry.levelEnd
      ? `Level ${entry.levelStart}`
      : `Levels ${entry.levelStart}-${entry.levelEnd}`;

    setText('[data-detail-title]', titleText);
    setText('[data-detail-title-secondary]', titleText);
    setText('[data-detail-subtitle]', subtitleText);
    setText('[data-detail-meta]', subtitleText);
    setText('[data-detail-label]', label);
    setText('[data-detail-description]', 'This Pixel Flow guide focuses on clean pathing and strategic gameplay.');

    if (entry.videoId) {
      const container = document.querySelector('[data-detail-video]');
      if (container) {
        const iframe = document.createElement('iframe');
        iframe.setAttribute('data-preview-iframe', 'true');
        iframe.src = `https://www.youtube.com/embed/${entry.videoId}`;
        iframe.title = titleText;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        container.innerHTML = '';
        container.appendChild(iframe);
        if (typeof window.pixelFlowRegisterIframe === 'function') {
          window.pixelFlowRegisterIframe(iframe);
        }
      }
    }

    const ytLink = `https://www.youtube.com/watch?v=${entry.videoId || ''}`;
    const y1 = document.querySelector('[data-detail-youtube]');
    const y2 = document.querySelector('[data-detail-youtube-secondary]');
    if (y1 && entry.videoId) y1.href = ytLink;
    if (y2 && entry.videoId) y2.href = ytLink;

    if (entry.videoId) {
      document.title = `${titleText} | Pixel Flow Guide`;
    }
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    const lvlParam = params.get('level');
    const levelNum = Number(lvlParam);
    const entry = Number.isFinite(levelNum) ? findEntryByLevel(levelNum) : null;
    const fallback = !entry && data.length ? data[0] : null;
    render(entry || fallback, levelNum);
    if (!entry) {
      showError('Level not found. Showing a featured level instead.');
    }
  }

  if (data.length) {
    init();
  } else {
    showError('Playlist data not loaded.');
  }
})();
