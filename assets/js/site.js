(function () {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function () {
      mobileNav.classList.toggle('active');
    });
  }

  const yearTarget = document.querySelector('[data-current-year]');
  if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear();
  }

  document.querySelectorAll('[data-faq-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const parent = button.closest('.faq-item');
      if (!parent) return;
      const answer = parent.querySelector('.answer');
      const icon = parent.querySelector('[data-faq-icon]');
      const isOpen = answer && answer.style.display === 'block';
      if (answer) {
        answer.style.display = isOpen ? 'none' : 'block';
      }
      if (icon) {
        icon.textContent = isOpen ? '+' : '-';
      }
    });
  });

  const videoFrames = Array.from(document.querySelectorAll('.video-frame iframe'));
  const frameDataById = new Map();
  let apiReady = false;
  let apiLoading = false;

  function extractVideoId(src) {
    const match = src.match(/\/embed\/([^?]+)/);
    return match ? match[1] : '';
  }

  function ensureJsApi(iframe) {
    const src = iframe.getAttribute('src') || '';
    if (!src) return;
    let nextSrc = src;
    try {
      const url = new URL(src);
      if (!url.searchParams.has('enablejsapi')) {
        url.searchParams.set('enablejsapi', '1');
      }
      const origin = window.location.origin || '';
      if (origin.startsWith('http') && !url.searchParams.has('origin')) {
        url.searchParams.set('origin', origin);
      }
      nextSrc = url.toString();
    } catch (err) {
      if (!/enablejsapi=1/.test(src)) {
        nextSrc = src.includes('?') ? `${src}&enablejsapi=1` : `${src}?enablejsapi=1`;
      }
    }
    if (nextSrc !== src) {
      iframe.setAttribute('src', nextSrc);
    }
  }

  function buildFallback(container, videoId, title) {
    let link = container.querySelector('.video-fallback');
    if (!link) {
      link = document.createElement('a');
      link.className = 'video-fallback';
      link.target = '_blank';
      link.rel = 'noopener';
      const img = document.createElement('img');
      img.alt = title || 'Pixel Flow video preview';
      img.loading = 'lazy';
      img.decoding = 'async';
      const label = document.createElement('span');
      label.textContent = '在 YouTube 播放';
      link.appendChild(img);
      link.appendChild(label);
      container.appendChild(link);
    }

    link.href = `https://www.youtube.com/watch?v=${videoId}`;
    link.setAttribute('aria-label', `在 YouTube 播放 ${title || 'Pixel Flow walkthrough'}`);
    const img = link.querySelector('img');
    if (img) {
      img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    link.classList.remove('visible');
    return link;
  }

  function showFallback(entry) {
    if (!entry || !entry.iframe || !entry.fallback) return;
    entry.fallback.classList.add('visible');
    try {
      entry.iframe.src = '';
    } catch (e) {
      /* ignore */
    }
  }

  function registerIframe(iframe) {
    if (!iframe) return null;
    const src = iframe.getAttribute('src') || '';
    const videoId = extractVideoId(src);
    const title = iframe.getAttribute('title') || 'Pixel Flow walkthrough';
    if (!videoId) return null;

    const container = iframe.closest('.video-frame');
    if (!container) return null;

    iframe.setAttribute('loading', iframe.getAttribute('loading') || 'lazy');
    ensureJsApi(iframe);
    const fallback = buildFallback(container, videoId, title);
    const playerId = iframe.id || `yt-player-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    iframe.id = playerId;

    const entry = frameDataById.get(playerId) || { playerId };
    entry.iframe = iframe;
    entry.fallback = fallback;
    entry.playerCreated = entry.playerCreated || false;
    frameDataById.set(playerId, entry);

    fallback.classList.remove('visible');
    iframe.addEventListener('load', () => {
      if (!entry.fallback) return;
      entry.fallback.classList.remove('visible');
    });
    iframe.addEventListener('error', () => showFallback(entry));

    ensureApiLoaded();

    if (apiReady && window.YT && window.YT.Player && !entry.playerCreated) {
      entry.playerCreated = true;
      new window.YT.Player(entry.playerId, {
        events: {
          onError: function () {
            showFallback(entry);
          },
        },
      });
    }

    return entry;
  }

  function ensureApiLoaded() {
    if (window.YT && window.YT.Player) {
      return;
    }
    if (apiLoading) return;
    apiLoading = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  const previousReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function () {
    apiReady = true;
    if (typeof previousReady === 'function') {
      previousReady();
    }
    frameDataById.forEach((entry, playerId) => {
      if (!document.getElementById(playerId)) {
        frameDataById.delete(playerId);
        return;
      }
      if (!window.YT || !window.YT.Player || entry.playerCreated) return;
      entry.playerCreated = true;
      new window.YT.Player(entry.playerId, {
        events: {
          onError: function () {
            showFallback(entry);
          },
        },
      });
    });
  };

  if (videoFrames.length) {
    videoFrames.forEach((iframe) => registerIframe(iframe));
    if (frameDataById.size) {
      ensureApiLoaded();
    }
  }

  window.pixelFlowRegisterIframe = function (iframe) {
    const entry = registerIframe(iframe);
    if (!entry) return;
    ensureApiLoaded();
  };

  window.pixelFlowCreatePlayer = function (container, videoId, title) {
    if (!container || !videoId) return;
    container.innerHTML = '';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'video-lite';
    button.setAttribute('aria-label', `Play ${title || 'Pixel Flow walkthrough'}`);

    const img = document.createElement('img');
    img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    img.alt = title || 'Pixel Flow video preview';
    img.loading = 'lazy';
    img.decoding = 'async';

    const playBadge = document.createElement('div');
    playBadge.className = 'play-badge';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 68 48');
    svg.setAttribute('aria-hidden', 'true');
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    bg.setAttribute('class', 'ytp-large-play-button-bg');
    bg.setAttribute('d', 'M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z');
    bg.setAttribute('fill', '#ff2bd0');
    const tri = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tri.setAttribute('d', 'M 27 14 L 45 24 L 27 34 z');
    tri.setAttribute('fill', '#0d0b12');
    svg.appendChild(bg);
    svg.appendChild(tri);
    playBadge.appendChild(svg);

    button.appendChild(img);
    button.appendChild(playBadge);
    container.appendChild(button);

    button.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
      iframe.title = title || 'Pixel Flow walkthrough';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      container.innerHTML = '';
      container.appendChild(iframe);
      if (typeof window.pixelFlowRegisterIframe === 'function') {
        window.pixelFlowRegisterIframe(iframe);
      }
    });
  };

  function convertStaticLevelFrames() {
    const frames = Array.from(document.querySelectorAll('.video-frame iframe'));
    frames.forEach((iframe) => {
      const src = iframe.getAttribute('src') || '';
      const match = src.match(/embed\/([^?]+)/);
      const vid = match && match[1] ? match[1] : '';
      if (!vid) return;
      const title = iframe.getAttribute('title') || 'Pixel Flow walkthrough';
      const container = iframe.closest('.video-frame') || iframe.parentElement;
      if (!container) return;
      if (typeof window.pixelFlowCreatePlayer === 'function') {
        window.pixelFlowCreatePlayer(container, vid, title);
      }
    });
  }

  convertStaticLevelFrames();
})();
