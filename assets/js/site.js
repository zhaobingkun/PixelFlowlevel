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
    const match = src.match(/\\/embed\\/([^?]+)/);
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
    entry.iframe.style.display = 'none';
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
    iframe.style.display = '';

    const entry = frameDataById.get(playerId) || { playerId };
    entry.iframe = iframe;
    entry.fallback = fallback;
    entry.playerCreated = entry.playerCreated || false;
    frameDataById.set(playerId, entry);

    fallback.classList.add('visible');
    iframe.style.display = 'none';
    iframe.addEventListener('load', () => {
      if (!entry.fallback) return;
      entry.fallback.classList.remove('visible');
      iframe.style.display = '';
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
      setTimeout(() => {
        if (!apiReady) {
          frameDataById.forEach(showFallback);
        }
      }, 4000);
    }
  }

  window.pixelFlowRegisterIframe = function (iframe) {
    const entry = registerIframe(iframe);
    if (!entry) return;
    ensureApiLoaded();
    setTimeout(() => {
      if (!apiReady) {
        showFallback(entry);
      }
    }, 4000);
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

    const label = document.createElement('span');
    label.textContent = '播放';

    button.appendChild(img);
    button.appendChild(label);
    container.appendChild(button);

    button.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
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
})();
