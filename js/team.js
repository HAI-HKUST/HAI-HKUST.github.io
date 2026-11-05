const rail = document.querySelector('.team-rail');

if (rail) {
  const members = [...rail.children];
  members.forEach((card, index) => {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'member-expand';
    trigger.dataset.memberIndex = index;
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-label', card.querySelector('h3').textContent);
    card.append(trigger);
  });
  rail.replaceChildren();
  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index--) {
      const target = Math.floor(Math.random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }
  const displayMembers = shuffle(members);
  for (let row = 0; row < 3; row++) {
    const lane = document.createElement('div');
    lane.className = 'team-lane';
    const track = document.createElement('div');
    track.className = 'team-track';
    const group = document.createElement('div');
    group.className = 'team-group';
    displayMembers.forEach((card, index) => {
      if (index % 3 !== row) return;
      group.append(card);
    });
    track.append(group);
    lane.append(track);
    rail.append(lane);
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const strips = [...document.querySelectorAll('.team-lane')].map((viewport, index) => ({
    viewport, group: viewport.querySelector('.team-group'), phase: index * 45, direction: index === 1 ? -1 : 1
  }));
  document.querySelectorAll('.milestone-roster').forEach((group) => {
    group.replaceChildren(...shuffle(group.children));
    const viewport = document.createElement('div');
    viewport.className = 'milestone-marquee';
    group.replaceWith(viewport);
    viewport.append(group);
    strips.push({ viewport, group, phase: 0, direction: 1 });
  });

  function measure() {
    strips.forEach((strip) => {
      strip.items = [...strip.group.children];
      strip.widths = strip.items.map(item => item.getBoundingClientRect().width);
      strip.offsets = [];
      let offset = 0;
      strip.items.forEach((item, index) => {
        strip.offsets.push(offset);
        offset += strip.widths[index] + 20;
      });
      strip.content = offset - 20;
      strip.width = strip.viewport.clientWidth;
      strip.period = Math.max(offset, strip.width + Math.max(...strip.widths) + 40);
    });
  }
  const observer = new ResizeObserver(measure);
  strips.forEach(strip => observer.observe(strip.viewport));
  measure();
  let lastTime;
  function frame(time) {
    const elapsed = lastTime === undefined ? 0 : Math.min((time - lastTime) / 1000, .05);
    lastTime = time;
    strips.forEach((strip) => {
      const paused = strip.viewport.matches(':hover, :focus-within') || document.body.classList.contains('member-detail-open');
      if (!paused && !document.hidden && !reduced.matches) strip.phase += elapsed * 20 * strip.direction;
      const fits = strip.content <= strip.width;
      strip.items.forEach((item, index) => {
        if (reduced.matches) {
          item.style.transform = '';
          item.style.opacity = '';
          return;
        }
        let x, opacity;
        if (fits) {
          const travel = Math.min(24, Math.max(0, (strip.width - strip.content) / 2 - 4));
          x = (strip.width - strip.content) / 2 + strip.offsets[index] + travel * Math.sin(strip.phase / 100);
          opacity = 1;
        } else {
          x = ((strip.offsets[index] - strip.phase + strip.period) % strip.period + strip.period) % strip.period;
          const right = strip.width - x - strip.widths[index];
          opacity = Math.max(0, Math.min(1, x / 22, right / 22));
        }
        item.style.transform = `translateX(${x}px)`;
        item.style.opacity = opacity;
        item.style.pointerEvents = opacity > .2 ? '' : 'none';
      });
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  const dialog = document.createElement('dialog');
  dialog.className = 'member-dialog';
  dialog.setAttribute('aria-labelledby', 'member-detail-name');
  dialog.innerHTML = '<button type="button" class="member-close">×</button><div class="member-detail"></div>';
  document.body.append(dialog);
  const close = dialog.querySelector('.member-close');
  const detail = dialog.querySelector('.member-detail');
  let opener;

  function updateCloseLabel() {
    close.setAttribute('aria-label', document.documentElement.lang === 'zh-CN' ? '关闭' : 'Close');
  }

  document.querySelector('main').addEventListener('click', (event) => {
    const trigger = event.target.closest('.member-expand, .milestone-member');
    if (!trigger) return;
    opener = trigger;
    const card = members[Number(trigger.dataset.memberIndex)];
    const header = document.createElement('div');
    header.className = 'member-detail-header';
    const identity = document.createElement('div');
    identity.append(card.querySelector('h3').cloneNode(true), card.querySelector('.member-degree').cloneNode(true));
    header.append(card.querySelector('.member-portrait').cloneNode(true), identity);
    const research = document.createElement('section');
    research.className = 'member-detail-research';
    const label = document.createElement('h4');
    label.textContent = document.documentElement.lang === 'zh-CN' ? '研究方向' : 'Research interests';
    research.append(label, card.querySelector('.member-interests').cloneNode(true));
    detail.replaceChildren(header, research);
    const website = card.querySelector('.member-link');
    if (website) detail.append(website.cloneNode(true));
    detail.querySelector('h3').id = 'member-detail-name';
    updateCloseLabel();
    document.body.classList.add('member-detail-open');
    dialog.showModal();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('member-detail-open');
    opener?.focus({ preventScroll: true });
  });
}
