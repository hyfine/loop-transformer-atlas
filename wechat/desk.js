(() => {
  const $ = id => document.getElementById(id);
  const article = $('article'), manual = $('manual'), scope = $('scope'), mode = $('motion');
  const units = [...article.querySelectorAll(':scope > [data-unit]')];
  const allKeys = new Set(units.map(x => x.dataset.unit));
  const atlas = 'https://hyfine.github.io/loop-transformer-atlas/?lang=zh#survey/';
  const headings = new Map();
  for (const a of article.querySelectorAll('a[href^="#"]')) {
    const target = $(decodeURIComponent(a.hash.slice(1)));
    if (!target) throw new Error('目录缺少正文锚点：' + a.hash);
    const key = target.closest('[data-unit]').dataset.unit;
    headings.set(a, {href:a.getAttribute('href'), key, publicURL:atlas + key});
  }
  function includes(unit) {
    const key = unit.dataset.unit, value = scope.value;
    return value === 'all' || value === 'v-' + unit.dataset.volume || value === 'u-' + key ||
      (value === 'u-families' && /^F\d\d$/.test(key));
  }
  function notice(text) { $('status').textContent = text; }
  function selectScope() {
    article.hidden = false; manual.hidden = true; manual.replaceChildren();
    const visible = units.filter(includes);
    for (const u of units) u.hidden = !includes(u);
    for (const im of article.querySelectorAll('[data-gif]')) {
      const motion = im.closest('[data-motion]');
      motion.hidden = mode.value === 'off';
      if (!motion.hidden) im.setAttribute('src', mode.value === 'poster' ? im.dataset.poster : im.dataset.gif);
    }
    for (const [a, h] of headings) a.setAttribute('href', visible.some(u => u.dataset.unit === h.key) ? h.href : h.publicURL);
    for (const o of $('jump').options) o.disabled = !visible.some(u => u.dataset.unit === o.value);
    $('jump').value = visible[0].dataset.unit;
    $('scope-title').hidden = scope.value === 'all';
    $('scope-title').textContent = 'Loop Transformer 技术全景　／　' + scope.selectedOptions[0].text;
    const figures = visible.reduce((n, u) => n + u.querySelectorAll('[data-source] img').length, 0);
    $('counts').textContent = '当前范围：' + figures + ' 个原文图位' + (mode.value === 'off' ? ' · 不加动态导读' : ' · 原图始终保留');
  }
  function scopeChange() {
    selectScope();
    notice('已切换预览。复制仅包含当前范围；分卷或单章末尾同样附 Atlas 入口。');
    document.querySelector('.spread').scrollIntoView();
  }
  scope.addEventListener('change',scopeChange); mode.addEventListener('change',scopeChange);
  $('jump').addEventListener('change',e => {
    const key = e.target.value;
    if (narrow.matches) $('studio').open=false;
    if (allKeys.has(key)) units.find(u => u.dataset.unit === key).scrollIntoView();
  });
  function payload() {
    const block = article.cloneNode(true); block.removeAttribute('hidden'); block.removeAttribute('id');
    block.querySelectorAll('[hidden]').forEach(x => x.remove());
    // WeChat supplies its own article margins; do not export the desktop preview's second gutter.
    block.style.maxWidth='none';
    block.style.setProperty('text-spacing-trim','space-all');
    for (const unit of block.querySelectorAll('[data-unit]')) unit.style.padding='0';
    for (const plate of block.querySelectorAll('[data-plate]')) {
      Object.assign(plate.style,{marginLeft:'0',marginRight:'0',padding:'0',border:'0'});
    }
    for (const motion of block.querySelectorAll('[data-motion]')) {
      Object.assign(motion.style,{paddingLeft:'0',paddingRight:'0',borderLeftWidth:'0',borderRightWidth:'0'});
    }
    if (!block.querySelector('[data-cta]')) block.lastElementChild.append(article.querySelector('[data-cta]').cloneNode(true));
    if (scope.value !== 'all') {
      const edition = document.createElement('p');
      edition.setAttribute('style','margin:0 0 12px;padding:9px 12px;background:#eaf4f1;color:#155f57;font-size:14px');
      edition.textContent = $('scope-title').textContent; block.prepend(edition);
    }
    const n = block.querySelectorAll('img').length;
    for (const im of block.querySelectorAll('img')) {
      const placeholder = document.createElement('span');
      placeholder.style.cssText='display:block;padding:8px;border:1px dashed #b78550;color:#844a22;font-size:14px';
      placeholder.textContent='【插图位：' + im.getAttribute('src').split('/').pop() + '】';
      (im.closest('a[data-art]') || im).replaceWith(placeholder);
    }
    const dest = new Map([...headings.values()].map(h => [h.href, h.publicURL]));
    for (const a of block.querySelectorAll('a[href^="#"]')) a.href = dest.get(a.getAttribute('href'));
    // Some editors reset display on table elements. Use actual block records rather than
    // depending on media queries or table-layout overrides in the pasted mobile article.
    for (const table of block.querySelectorAll('[data-record-table]')) {
      for (const old of [...table.querySelectorAll('th,td,tr,thead,tbody')].reverse().concat(table)) {
        const el = document.createElement(old.matches('th') ? 'span' : 'section');
        el.style.cssText=old.style.cssText; el.append(...old.childNodes); old.replaceWith(el);
      }
    }
    for (const t of [block, ...block.querySelectorAll('*')]) {
      for (const k of t.getAttributeNames()) if (k.startsWith('data-') || k === 'id') t.removeAttribute(k);
    }
    return {block,n};
  }
  function selectManual(block) {
    article.hidden=true; manual.hidden=false; manual.replaceChildren(block);
    const range=document.createRange(); range.selectNodeContents(block);
    const selection=getSelection(); selection.removeAllRanges(); selection.addRange(range);
    $('manual-copy').textContent='返回图文预览';
  }
  $('manual-copy').addEventListener('click',() => {
    if (!manual.hidden) { selectScope(); $('manual-copy').textContent='手动选择复制'; notice('已返回原图预览。'); return; }
    selectManual(payload().block); notice('已选中带图位的所选正文。按 ⌘C / Ctrl+C，回到公众号普通粘贴。');
  });
  $('copy').addEventListener('click',async () => {
    const {block,n}=payload();
    const html=block.outerHTML;
    const textBlock=block.cloneNode(true);
    for (const node of textBlock.querySelectorAll('p,li,h1,h2,h3,th,td,tr,br')) node.after('\n');
    const plain=textBlock.textContent;
    let wrote=false;
    const handler=e => {
      if (!e.clipboardData) return;
      e.clipboardData.setData('text/html',html); e.clipboardData.setData('text/plain',plain);
      e.preventDefault(); wrote=true;
    };
    document.addEventListener('copy',handler);
    try { document.execCommand('copy'); }
    catch (e) { console.warn('系统复制接口不可用，尝试 Clipboard API', e); }
    finally { document.removeEventListener('copy',handler); }
    if (!wrote) {
      try {
        if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw Error('浏览器未开放富文本写入');
        await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([plain],{type:'text/plain'})})]);
      } catch (e) {
        console.warn('自动复制不可用，已转入手动复制',e); selectManual(block);
        notice('浏览器未允许自动复制，已选中正文。请按 ⌘C / Ctrl+C 后普通粘贴。'); return;
      }
    }
    notice('已复制当前范围，含 ' + n + ' 个图片占位。普通粘贴后按文件名补图。');
  });
  for (const el of [scope,mode]) el.addEventListener('change',() => { $('manual-copy').textContent='手动选择复制'; });
  const narrow=matchMedia('(max-width:850px),(pointer:coarse) and (orientation:landscape) and (max-height:540px)');
  $('studio').open=!narrow.matches;
  narrow.addEventListener('change',e => { $('studio').open=!e.matches; });
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) mode.value='off';
  selectScope();
})();
