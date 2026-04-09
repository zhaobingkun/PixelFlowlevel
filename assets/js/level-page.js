(function () {
  const data = window.PIXEL_FLOW_PLAYLIST || [];
  const availableLevels = (() => {
    const set = new Set();
    data.forEach((entry) => {
      if (!entry.levelStart || !entry.levelEnd) return;
      const start = Math.min(entry.levelStart, entry.levelEnd);
      const end = Math.max(entry.levelStart, entry.levelEnd);
      for (let lvl = start; lvl <= end; lvl++) set.add(lvl);
    });
    return Array.from(set).sort((a, b) => a - b);
  })();

  function findEntryByLevel(level) {
    if (!Number.isFinite(level)) return null;
    return data.find((entry) => {
      if (!entry.levelStart || !entry.levelEnd) return false;
      return level >= entry.levelStart && level <= entry.levelEnd;
    });
  }

  function getLevelFromUrl() {
    const path = window.location && window.location.pathname ? window.location.pathname : '';
    const matchPath = path.match(/\/level\/(\d+)/);
    if (matchPath && matchPath[1]) {
      const num = Number(matchPath[1]);
      if (Number.isFinite(num)) return num;
    }
    const params = new URLSearchParams(window.location.search);
    const lvlParam = params.get('level');
    const num = Number(lvlParam);
    return Number.isFinite(num) ? num : null;
  }

  function updateUrl(levelNum) {
    if (!Number.isFinite(levelNum) || levelNum <= 0) return;
    const target = `/level/${levelNum}/`;
    if (window.location.pathname !== target) {
      window.history.replaceState({}, '', target);
    }
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

  function buildGuideCopy(level) {
    const openingPatterns = [
      'Start Pixel Flow level %LEVEL% by locking one short lane near the edge before you stretch any long route through the center. That opening keeps the board readable and leaves room for the final cleanup path.',
      'On Pixel Flow level %LEVEL%, the safest first move is usually the smallest confirmed connection you can make without crossing the middle. Building one stable side route first reduces the chance of boxing in later colors.',
      'Treat Pixel Flow level %LEVEL% like a route-order puzzle instead of a speed puzzle. Open with the cleanest corner path, then use that anchor to decide which line should claim the center corridor.',
      'The fastest way through Pixel Flow level %LEVEL% is to settle a compact section first and delay the longest path. That keeps your working area flexible while you confirm where each color pair can safely pass.'
    ];
    const blockerPatterns = [
      'Most failed attempts happen when two colors compete for the same strip of cells. If that happens, reset only that lane, reopen the edge route, and reconnect the middle after the side pockets are secure.',
      'If the board keeps collapsing, the problem is usually route order rather than the final shape. Pull back one chain, clear the shared junction, and rebuild the longest line only after the smaller pair is fixed.',
      'When this stage feels stuck, look for the place where one route closes a doorway too early. Reopening that doorway and solving the nearby pocket first is often enough to free the rest of the board.',
      'A common stall point on this board is overcommitting to the center too early. Keep one escape channel open until the corners are settled, then finish the middle with fewer crossing decisions.'
    ];
    const videoPatterns = [
      'Use the walkthrough video as a checkpoint, not just a copy guide. Compare your opening route, the first center turn, and the last two cleanup moves to see exactly where your board order changed.',
      'The video is most useful when your layout looks close but the final cells refuse to close. Pause at the halfway point, compare the center lanes, and then replay the finish instead of restarting everything.',
      'If your board diverges from the guide, check the first third of the video and the transition into the final route. Those two moments usually reveal which line claimed too much space.',
      'Watch the clip once for route order and a second time for cleanup timing. Matching those two phases is usually more effective than tracing every drag in real time.'
    ];
    const focusPatterns = [
      'Check the shortest edge pair first, then decide which route deserves the center lane.',
      'Read the corners before the middle so you know which path can stay flexible the longest.',
      'Secure one compact cluster first and use it to control the remaining open corridor.',
      'Start with the lane that closes the fewest exits and keep one backup channel available.'
    ];
    const mistakePatterns = [
      'Do not let the longest line cross the middle before the side cells are stable.',
      'Avoid sealing a corner pocket too early or you will force a later crossover.',
      'Do not mirror the video blindly if your board already diverged in the opening.',
      'Avoid solving two competing colors at once when one narrow lane controls both.'
    ];
    const idx = Number.isFinite(level) ? Math.abs(level) % openingPatterns.length : 0;
    const fill = (text) => text.replaceAll('%LEVEL%', String(level));
    return {
      heading: `How to clear Pixel Flow level ${level}`,
      overview: fill(openingPatterns[idx]),
      approach: fill(blockerPatterns[idx]),
      videoTip: fill(videoPatterns[idx]),
      focus: fill(focusPatterns[idx]),
      mistake: fill(mistakePatterns[idx])
    };
  }

  function buildSeoCopy(level) {
    const titlePatterns = [
      ['Pixel Flow Level %LEVEL% Walkthrough Guide', 'Pixel Flow Level %LEVEL% Walkthrough Guide'],
      ['How to Beat Pixel Flow Level %LEVEL% | Video Walkthrough', 'How to Beat Pixel Flow Level %LEVEL%'],
      ['Pixel Flow Level %LEVEL% Solution Guide and Walkthrough', 'Pixel Flow Level %LEVEL% Solution Guide'],
      ['Pixel Flow Level %LEVEL% Route Tips and Video Guide', 'Pixel Flow Level %LEVEL% Route Tips'],
      ['Pixel Flow %LEVEL% Puzzle Help | Walkthrough Guide', 'Pixel Flow Level %LEVEL% Puzzle Help'],
      ['Pixel Flow Level %LEVEL% Strategy and Walkthrough', 'Pixel Flow Level %LEVEL% Strategy Guide']
    ];
    const introPatterns = [
      'Use this Pixel Flow level %LEVEL% guide when you need a quick route order check, a clean video reference, and a safer way to open the board without closing the center too early.',
      'This Pixel Flow level %LEVEL% walkthrough is built for players who want the fastest opening route, a reliable checkpoint against the video, and fewer late-board resets.',
      'Open Pixel Flow level %LEVEL% here if you want a direct solution path, a short explanation of the risky lane, and a walkthrough video you can compare against move by move.',
      'Pixel Flow level %LEVEL% can look simple until one route steals too much space. This guide helps you read the opening, protect the middle, and finish with fewer corrections.',
      'If Pixel Flow level %LEVEL% keeps breaking near the end, use this page to compare your first moves, recheck the shared corridor, and copy the cleanup order from the video.',
      'Come back to this Pixel Flow level %LEVEL% page when you need route tips, a fast puzzle reset point, and a walkthrough that shows where the board usually goes wrong.'
    ];
    const metaPatterns = [
      'Pixel Flow level %LEVEL% walkthrough guide with video, opening route tips, and common mistake checks for a cleaner clear.',
      'How to beat Pixel Flow level %LEVEL% with a video walkthrough, route order notes, and quick puzzle help.',
      'Pixel Flow level %LEVEL% solution guide with walkthrough video, center-lane tips, and safer cleanup advice.',
      'Watch the Pixel Flow level %LEVEL% video guide, compare the opening route, and avoid the most common board mistakes.',
      'Pixel Flow %LEVEL% puzzle help with a full walkthrough video, route tips, and a quick way to fix stalled runs.',
      'Pixel Flow level %LEVEL% strategy guide covering first moves, route order, and walkthrough video checkpoints.'
    ];
    const detailMetaPatterns = [
      'Level %LEVEL% walkthrough video and route order notes.',
      'Video solution for level %LEVEL% with a quick opening plan.',
      'Level %LEVEL% guide with video timing and cleanup help.',
      'Route tips and video checkpoints for level %LEVEL%.',
      'Puzzle help for level %LEVEL% with a direct video walkthrough.',
      'Level %LEVEL% strategy notes paired with the walkthrough video.'
    ];
    const detailDescPatterns = [
      'Use the video to confirm the opening route, then compare the center lane before you lock the final path.',
      'This guide is best used as a route-order check so you can fix the blocking move instead of replaying the whole board.',
      'Watch for the point where one color claims the shared corridor, because that usually decides whether the finish stays open.',
      'If your run collapses near the end, compare the first stable edge route and the final cleanup sequence against the video.',
      'The walkthrough is most helpful when your board looks close but one lane keeps sealing too early.',
      'Use these notes to identify the risky turn, then replay only that section with the video as a checkpoint.'
    ];
    const idx = Number.isFinite(level) ? Math.abs(level) % titlePatterns.length : 0;
    const fill = (text) => text.replaceAll('%LEVEL%', String(level));
    return {
      seoTitle: fill(titlePatterns[idx][0]),
      heading: fill(titlePatterns[idx][1]),
      intro: fill(introPatterns[idx]),
      metaDescription: fill(metaPatterns[idx]),
      detailMeta: fill(detailMetaPatterns[idx]),
      detailDescription: fill(detailDescPatterns[idx])
    };
  }

  function render(entry, levelNumber) {
    if (!entry) {
      showError('Level not found. Try another number.');
      return;
    }

    const titleText = entry.title || 'Pixel Flow Walkthrough';
    const subtitleText = entry.subtitle || 'Video walkthrough';
    const resolvedLevel = levelNumber || entry.levelStart || entry.levelEnd;
    const seoCopy = buildSeoCopy(resolvedLevel);
    const label = entry.levelStart === entry.levelEnd || !entry.levelEnd
      ? `Level ${entry.levelStart}`
      : `Levels ${entry.levelStart}-${entry.levelEnd}`;

    setText('[data-detail-title]', seoCopy.heading);
    setText('[data-detail-title-secondary]', 'Walkthrough details');
    setText('[data-detail-keyword]', `pixel flow ${resolvedLevel}`);
    setText('[data-detail-subtitle]', seoCopy.intro);
    setText('[data-detail-meta]', seoCopy.detailMeta);
    setText('[data-detail-label]', label);
    setText('[data-detail-description]', seoCopy.detailDescription);
    const guideCopy = buildGuideCopy(levelNumber || entry.levelStart || entry.levelEnd);
    setText('[data-detail-copy-heading]', guideCopy.heading);
    setText('[data-detail-copy-overview]', guideCopy.overview);
    setText('[data-detail-copy-approach]', guideCopy.approach);
    setText('[data-detail-copy-video]', guideCopy.videoTip);
    setText('[data-detail-copy-focus]', guideCopy.focus);
    setText('[data-detail-copy-mistake]', guideCopy.mistake);

    if (entry.videoId) {
      const container = document.querySelector('[data-detail-video]');
      if (container) {
        container.innerHTML = '';
        if (typeof window.pixelFlowCreatePlayer === 'function') {
          window.pixelFlowCreatePlayer(container, entry.videoId, seoCopy.heading);
        } else {
          const link = document.createElement('a');
          link.className = 'video-fallback visible';
          link.href = `https://www.youtube.com/watch?v=${entry.videoId}`;
          link.target = '_blank';
          link.rel = 'noopener';
          const img = document.createElement('img');
          img.src = `https://img.youtube.com/vi/${entry.videoId}/hqdefault.jpg`;
          img.alt = seoCopy.heading;
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

    document.title = `${seoCopy.seoTitle} | Pixel Flow Guide`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', seoCopy.metaDescription);

    updateUrl(resolvedLevel);

    renderNearby(resolvedLevel);
  }

  function renderNearby(current) {
    const grid = document.querySelector('[data-related-grid]');
    if (!grid) return;
    const center = Number(current);
    if (!Number.isFinite(center)) return;
    const nearby = pickNearbyLevels(center, 30);
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

  function init() {
    moveRelatedNextToVideo();
    const levelNum = getLevelFromUrl();
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

  function moveRelatedNextToVideo() {
    const split = document.querySelector('.split');
    if (!split) return;
    const columns = split.querySelectorAll(':scope > div');
    if (columns.length < 2) return;
    const left = columns[0];
    const right = columns[1];
    const related = right.querySelector('.related-levels');
    if (!related || !left || !left.parentNode) return;
    // Wrap video and related list side by side
    const row = document.createElement('div');
    row.className = 'video-related-row';
    left.parentNode.insertBefore(row, left);
    row.appendChild(left);
    row.appendChild(related);
  }
})();
