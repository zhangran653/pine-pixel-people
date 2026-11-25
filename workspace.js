// Project navigation and the editor controls shared by the three workspaces.
(() => {
  if (typeof document === 'undefined') return;
  const pages = {
    atelier: ['人物', 'atelier.html'], studio: ['动作', 'studio.html'],
    world: ['世界', 'index.html'], three: ['三维预览', 'three.html']
  };
  const resources = [
    ['松溪步道', 'trail.html'], ['人物切片', 'slice-study.html'], ['人体建模台', 'anatomy-study.html'], ['原画转切片实验', 'turnaround-lab.html'], ['形象规范', 'appearance-standard.html'],
    ['动作规范', 'motion-standard.html'], ['场景规范', 'world-standard.md'], ['动作研究', 'motion-notes.html'],
    ['GitHub', 'https://github.com/zhangran653/pine-pixel-world']
  ];
  const bar = document.querySelector('[data-app-nav]');
  if (!bar) return;
  const current = bar.dataset.appNav;
  const previewIds = { atelier: 'three-link', studio: 'preview-three', world: 'world-three' };
  const link = (text, href) => {
    const a = document.createElement('a');
    a.textContent = text;
    a.href = href;
    return a;
  };
  const main = document.querySelector('main');
  main.id = 'workspace-main';
  main.tabIndex = -1;
  const skip = link('跳到工作区', '#workspace-main');
  skip.className = 'skip-workspace';
  const home = link('松溪像素世界', 'index.html');
  home.className = 'workspace-brand';
  const logo = document.createElement('i');
  logo.setAttribute('aria-hidden', 'true');
  home.prepend(logo);
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', '工作区');
  nav.className = 'workspace-nav';
  for (const [key, [name, href]] of Object.entries(pages)) {
    const a = link(name, href);
    a.dataset.workspace = key;
    if (key === current) a.setAttribute('aria-current', 'page');
    if (key === 'three' && previewIds[current]) {
      a.id = previewIds[current];
      a.href = 'three.html?show=studio&from=' + current;
    }
    nav.append(a);
  }
  const more = document.createElement('details');
  more.className = 'workspace-resources';
  const summary = document.createElement('summary');
  summary.textContent = '资源';
  const list = document.createElement('div');
  for (const [name, href] of resources) {
    const a = link(name, href);
    if (a.pathname === location.pathname) a.setAttribute('aria-current', 'page');
    list.append(a);
  }
  more.append(summary, list);
  const inner = document.createElement('div');
  inner.className = 'workspace-bar-inner';
  inner.append(home, nav, more);
  bar.className = 'workspace-bar';
  bar.append(skip, inner);
  for (const menu of [more, ...document.querySelectorAll('.workspace-files')]) {
    document.addEventListener('click', e => {
      if (!menu.contains(e.target) || e.target.closest('button,a')) {
        if (menu.open && menu.contains(document.activeElement) && menu.contains(e.target)) menu.querySelector('summary').focus();
        menu.open = false;
      }
    });
    menu.addEventListener('keydown', e => {
      if (e.key === 'Escape') { menu.open = false; menu.querySelector('summary').focus(); }
    });
  }
  const narrow = matchMedia('(max-width: 760px)');
  const desk = document.querySelector('[data-desk]');
  const viewKey = 'pinePixel.workspace.view.' + current;
  function lastView() {
    const navigation = performance.getEntriesByType('navigation')[0]?.type;
    if (['reload', 'back_forward'].includes(navigation) && history.state?.pineView) return history.state.pineView;
    if (location.search || location.hash) return;
    try { return JSON.parse(sessionStorage.getItem(viewKey)); } catch {}
  }
  const resumed = lastView();
  let openTool, tool, readView;
  if (desk) {
    const tabs = desk.querySelector('.tool-tabs'), preview = desk.querySelector('.desk-preview');
    const panes = [...desk.querySelectorAll('[data-tool]')];
    let selected = panes[0].id;
    const buttons = new Map();
    for (const pane of [preview, ...panes]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.id = 'tool-' + pane.id;
      b.setAttribute('aria-controls', pane.id);
      b.textContent = pane.dataset.label;
      if (pane.dataset.count !== undefined) {
        const number = document.createElement('span');
        number.id = pane.dataset.count;
        number.className = 'tool-count';
        b.append(number);
      }
      b.onclick = () => openTool(pane.id);
      tabs.append(b);
      buttons.set(pane.id, b);
      if (pane !== preview) {
        pane.setAttribute('role', 'tabpanel');
        pane.setAttribute('aria-labelledby', b.id);
      }
    }
    openTool = (id, focus = false) => {
      if (!buttons.has(id)) return;
      if (id === preview.id && !narrow.matches) id = panes[0].id;
      const returnToStart = id !== selected && desk.getBoundingClientRect().top < -48;
      selected = id;
      tool = id;
      desk.dataset.screen = id === preview.id ? 'preview' : 'tools';
      for (const [p, b] of buttons) {
        b.setAttribute('aria-selected', String(p === id));
        b.tabIndex = p === id ? 0 : -1;
        if (p === preview.id) b.hidden = !narrow.matches;
        else document.getElementById(p).hidden = p !== id;
      }
      if (narrow.matches && id === preview.id) {
        preview.setAttribute('role', 'tabpanel');
        preview.setAttribute('aria-labelledby', buttons.get(id).id);
      } else {
        preview.removeAttribute('role');
        preview.removeAttribute('aria-labelledby');
      }
      if (focus) buttons.get(id).focus({ preventScroll: true });
      if (returnToStart) desk.scrollIntoView({ block: 'start', behavior: 'instant' });
    };
    tabs.addEventListener('keydown', e => {
      const visible = [...buttons.keys()].filter(key => !buttons.get(key).hidden);
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? visible.length - 1 :
        (visible.indexOf(selected) + (e.key === 'ArrowRight' ? 1 : -1) + visible.length) % visible.length;
      openTool(visible[next], true);
    });
    narrow.addEventListener('change', () => openTool(selected));
    const params = new URLSearchParams(location.search);
    const first = resumed?.tool && buttons.has(resumed.tool) ? resumed.tool : selected;
    openTool(narrow.matches && (params.has('play') || params.has('phase')) ? preview.id : first);
  }
  window.addEventListener('pagehide', () => {
    if (!desk) return;
    const pineView = { ...readView?.(), tool };
    try { history.replaceState({ ...history.state, pineView }, ''); } catch {}
    try { sessionStorage.setItem(viewKey, JSON.stringify(pineView)); } catch {}
  });
  function editHistory(read, restore) {
    const back = [], forward = [];
    const undo = document.getElementById('edit-undo'), redo = document.getElementById('edit-redo');
    let group;
    function sync() { undo.disabled = !back.length; redo.disabled = !forward.length; }
    function travel(from, to) {
      if (!from.length) return;
      to.push(read());
      restore(from.pop());
      group = null;
      sync();
    }
    undo.onclick = () => travel(back, forward);
    redo.onclick = () => travel(forward, back);
    document.addEventListener('keydown', e => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.isComposing || e.key.toLowerCase() !== 'z' ||
          e.target.closest('input, textarea, select, [contenteditable="true"], dialog')) return;
      const b = e.shiftKey ? redo : undo;
      if (!b.disabled) { e.preventDefault(); b.click(); }
    });
    for (const event of ['focusout', 'change', 'pointerup']) document.addEventListener(event, () => { group = null; });
    sync();
    return {
      record(value, key) {
        if (!key || key !== group) {
          back.push(value);
          if (back.length > 40) back.shift();
        }
        group = key;
        forward.length = 0;
        sync();
      },
      clear() { back.length = forward.length = 0; group = null; sync(); }
    };
  }
  const from = new URLSearchParams(location.search).get('from');
  const backLink = document.getElementById('preview-back');
  if (backLink && previewIds[from]) {
    backLink.href = pages[from][1];
    backLink.textContent = '返回' + { atelier: '人物创作室', studio: '动作工坊', world: '世界编辑器' }[from];
    const scene = new URLSearchParams(location.search).get('scene');
    if (from === 'world' && scene) backLink.search = new URLSearchParams({ scene });
    backLink.addEventListener('click', e => {
      if (e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || !document.referrer) return;
      const ref = new URL(document.referrer), dest = new URL(backLink.href);
      if (ref.origin === dest.origin && ref.pathname === dest.pathname && history.length > 1) {
        e.preventDefault();
        history.back();
      }
    });
  }
  function readLibrary(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
  }
  globalThis.PineWorkspace = { openTool, editHistory, readLibrary, resumed, rememberView(read) { readView = read; } };
})();
