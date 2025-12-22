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
        container.innerHTML = '';
        if (typeof window.pixelFlowCreatePlayer === 'function') {
          window.pixelFlowCreatePlayer(container, entry.videoId, titleText);
        } else {
          const link = document.createElement('a');
          link.className = 'video-fallback visible';
          link.href = `https://www.youtube.com/watch?v=${entry.videoId}`;
          link.target = '_blank';
          link.rel = 'noopener';
          const img = document.createElement('img');
          img.src = `https://img.youtube.com/vi/${entry.videoId}/hqdefault.jpg`;
          img.alt = titleText;
          const label = document.createElement('span');
          label.textContent = '在 YouTube 播放';
          link.appendChild(img);
          link.appendChild(label);
          container.appendChild(link);
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
