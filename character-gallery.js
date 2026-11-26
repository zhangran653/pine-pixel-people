// Browser for standard, editable character recipes. Filtering always precedes pagination.
const pineCharacterGallery = (() => {
  const $ = id => document.getElementById(id);
  const ages = {adult:'成人',child:'儿童',toddler:'幼儿',baby:'婴儿'};
  const profiles = {female:'女性体型',male:'男性体型',unspecified:'中性／未指定'};
  const sources = {new:'本次新增',preset:'内置预设',saved:'我的形象'};
  const realms = PineWorld.realms, catalogue = PineLooks.library;
  const dimensions = {
    era:['时代',realms], field:['职业领域',catalogue.fields], setting:['活动场景',catalogue.settings], series:['人物系列',catalogue.series],
    age:['年龄',ages], garment:['服装款式',catalogue.garments], gear:['随身配件',catalogue.gear],
    profile:['体型',profiles], source:['形象来源',sources]
  };
  const featured = ['kiln_potter','moth_keeper','lunar_geologist','rain_pupil','reed_ferryman','star_moss_baby',
    'stage_rigger','orbit_tailor','woodblock_printer','porthole_toddler','cloud_boater','harbour_pilot'];
  const featureOrder = new Map(featured.map((key,i)=>['look_'+key,i]));
  const collator = new Intl.Collator('zh-Hans-CN',{numeric:true});
  function button(label) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    return b;
  }
  function addOptions(select, options) {
    for (const [key, label] of Object.entries(options)) select.add(new Option(label,key));
  }
  const normalize = value => value.normalize('NFKC').trim().toLowerCase();
  function entry(key, doc) {
    const id = doc.identity || {}, actual = catalogue.facets(doc);
    const saved = key.startsWith('saved:'), fresh = !saved && catalogue.newIds.has(doc.id);
    const facets = {
      era:[id.era || 'modern'], field:[id.field], series:id.series ? [id.series] : [], setting:id.settings || [], age:[doc.base],
      garment:[actual.garment], gear:actual.gear, profile:[doc.gender || 'unspecified'],
      source:saved ? ['saved'] : fresh ? ['preset','new'] : ['preset']
    };
    const [pack,hat] = doc.parts.hat.split('/');
    const hatName = hat && PineLooks.catalog.get(pack+'@'+doc.packs[pack])?.parts.find(p=>p.id===hat)?.label;
    const text = [doc.label, doc.id, id.role, hatName];
    for (const [facet,values] of Object.entries(facets))
      for (const code of values) text.push(dimensions[facet][1][code]);
    for (const [slot,value] of Object.entries(doc.parts))
      text.push(PineLooks.slots[slot]?.[value] || PineLooks.wearables[slot]?.[value] || value);
    const priority = saved ? -1 : featureOrder.get(doc.id) ?? (fresh ? featured.length : featured.length+1);
    return {key,doc,facets,text:normalize(text.filter(Boolean).join(' ')),priority};
  }
  function create({getEntries, observe, resetImages, select}) {
    const pane = $('person-library'), grid = $('look-shelf'), pager = $('shelf-pages');
    const selectIds = Object.keys(dimensions).filter(k=>k!=='era');
    const controls = Object.fromEntries(selectIds.map(id=>[id,$('shelf-'+id)]));
    for (const [id,ctrl] of Object.entries(controls)) addOptions(ctrl,dimensions[id][1]);
    const cached = new WeakMap();
    let currentKey = '', era = '', page = 1, framing = 'body';
    const initial = new URL(location.href);
    const linked = initial.searchParams.get('tool') === 'person-library';
    const params = linked ? initial.searchParams : new URLSearchParams(history.state?.pineCatalogue || '');
    let priorResults = history.state?.pineFamilyReturn ?? null;
    let editorAddress = history.state?.pineGalleryEditor ?? null;
    function restore(params) {
      const param = (key,options,fallback) => Object.hasOwn(options,params.get(key)) ? params.get(key) : fallback;
      era = param('era',realms,'');
      for (const [id,ctrl] of Object.entries(controls)) ctrl.value = param(id,dimensions[id][1],'');
      $('look-query').value = params.get('q') || '';
      $('shelf-size').value = param('per',{12:1,24:1,48:1},'12');
      $('shelf-order').value = param('order',{featured:1,name:1},'featured');
      framing = param('framing',{face:1,body:1},'body');
      const n=Number(params.get('page'));
      page = Number.isSafeInteger(n) && n>0 ? n : 1;
    }
    restore(params);
    const tabs = new Map();
    for (const [id,label] of [['','全部时代'],...Object.entries(realms)]) {
      const b = button(label), count = document.createElement('span');
      b.dataset.realm = id; b.append(count);
      b.onclick = () => { era=id; firstPage(); };
      $('shelf-realms').append(b); tabs.set(id,{b,count});
    }
    const filters = () => ({era,...Object.fromEntries(selectIds.map(id=>[id,controls[id].value]))});
    function stateParams() {
      const state = new URLSearchParams();
      for (const [key,value] of Object.entries(filters())) if (value) state.set(key,value);
      if ($('look-query').value.trim()) state.set('q',$('look-query').value.trim());
      if (framing !== 'body') state.set('framing',framing);
      if ($('shelf-order').value !== 'featured') state.set('order',$('shelf-order').value);
      if ($('shelf-size').value !== '12') state.set('per',$('shelf-size').value);
      if (page>1) state.set('page',page);
      return state;
    }
    const urlFields = [...Object.keys(dimensions),'q','page','per','order','framing'];
    function remember() {
      if (pane.hidden) return;
      const url = new URL(location.href), state = stateParams();
      if (url.searchParams.get('tool') !== 'person-library') {
        editorAddress = url.href;
        url.search=''; url.hash='';
      }
      for (const key of urlFields) url.searchParams.delete(key);
      url.searchParams.set('tool','person-library');
      for (const [key,value] of state) url.searchParams.set(key,value);
      try { history.replaceState({...history.state,pineCatalogue:state.toString(),pineFamilyReturn:priorResults,pineGalleryEditor:editorAddress},'',url); } catch {}
    }
    pane.closest('[data-desk]').addEventListener('pine-tool',e=>{
      if (e.detail === pane.id) { remember(); return; }
      const url = new URL(location.href);
      if (url.searchParams.get('tool') !== 'person-library') return;
      for (const key of ['tool',...urlFields]) url.searchParams.delete(key);
      try { history.replaceState({...history.state,pineGalleryEditor:null},'',editorAddress || url); } catch {}
      editorAddress=null;
    });
    function drawChips(chosen,query) {
      const root = $('shelf-applied'); root.replaceChildren();
      function chip(label,remove) {
        const b = button(label+' ×');
        b.setAttribute('aria-label','取消筛选 · '+label);
        b.onclick = ()=>{ remove(); firstPage(); $('look-query').focus({preventScroll:true}); };
        root.append(b);
      }
      for (const [id,value] of chosen)
        chip(dimensions[id][1][value],()=>{ if(id==='era') era=''; else controls[id].value=''; });
      if (query) chip(query,()=>{ $('look-query').value=''; });
      $('clear-looks').hidden = !root.childElementCount;
    }
    function showSeries(id) {
      if (priorResults===null) priorResults=stateParams().toString();
      era=''; $('look-query').value='';
      for (const c of Object.values(controls)) c.value='';
      controls.series.value=id;
      changePage(1);
    }
    $('shelf-family-back').onclick=()=>{
      const previous=new URLSearchParams(priorResults || '');
      priorResults=null;
      restore(previous); changePage(page);
    };
    function card(item,seriesCounts,browsingSeries) {
      const {key,doc,facets} = item;
      const b=button(''), c=document.createElement('canvas'), title=document.createElement('strong'),
        meta=document.createElement('small'), copy=document.createElement('span');
      const tile=document.createElement('article');
      tile.className='gallery-card'; b.className='gallery-person'; copy.className='gallery-caption';
      title.textContent=doc.label;
      meta.textContent=[realms[facets.era[0]],ages[doc.base],catalogue.fields[facets.field[0]]].filter(Boolean).join(' · ');
      copy.append(title,meta); b.append(c,copy);
      b.dataset.key=key; b.dataset.era=facets.era[0];
      b.setAttribute('aria-pressed',String(currentKey===key));
      b.title='编辑'+doc.label; c.setAttribute('aria-hidden','true');
      b.onclick=()=>select(doc,key);
      observe(c,doc,framing);
      tile.append(b);
      const group=facets.series[0], count=seriesCounts.get(group);
      if (count>1 && browsingSeries!==group) {
        const related=button('同类 · '+catalogue.series[group]+'（'+count+'）');
        related.className='gallery-related'; related.dataset.related=group;
        related.setAttribute('aria-label','查看'+catalogue.series[group]+'系列的 '+count+' 位人物');
        related.onclick=()=>showSeries(group); tile.append(related);
      }
      return tile;
    }
    function changePage(n) {
      page=n; draw();
      const results=$('shelf-results');
      if (results.getBoundingClientRect().top < 0) results.scrollIntoView({block:'start'});
      results.focus({preventScroll:true});
    }
    function drawPager(pages) {
      pager.replaceChildren(); pager.hidden=pages<2;
      $('shelf-quick').hidden=pages<2;
      $('shelf-position').textContent=page+' / '+pages;
      $('shelf-prev').disabled=page===1; $('shelf-next').disabled=page>=pages;
      if (pages<2) return;
      function control(label,n,disabled=false,current=false) {
        const b=button(label);
        b.disabled=disabled; b.dataset.page=n;
        if(current) b.setAttribute('aria-current','page');
        b.setAttribute('aria-label',/^\d+$/.test(label) ? '第 '+n+' 页' : label);
        b.onclick=()=>changePage(n); pager.append(b);
      }
      control('上一页',page-1,page===1);
      const visible=[...new Set([1,page-1,page,page+1,pages].filter(n=>n>=1 && n<=pages))].sort((a,b)=>a-b);
      let previous=0;
      for(const n of visible) {
        if(n-previous>1) { const dots=document.createElement('span'); dots.textContent='…'; pager.append(dots); }
        control(String(n),n,false,page===n); previous=n;
      }
      control('下一页',page+1,page===pages);
    }
    function draw() {
      const rows=getEntries().map(([key,doc])=>{
        let item=cached.get(doc);
        if(!item || key!==item.key) { item=entry(key,doc); cached.set(doc,item); }
        return item;
      }).sort((a,b)=>a.priority-b.priority);
      const query=$('look-query').value.trim(), words=normalize(query).split(/\s+/).filter(Boolean);
      const chosen=Object.entries(filters()).filter(([,v])=>v);
      const counts=Object.fromEntries(Object.keys(dimensions).map(k=>[k,new Map()]));
      // Leave a facet out of its own counts so neighboring choices remain discoverable.
      const matches=[], seriesCounts=new Map(); let eraTotal=0;
      for(const item of rows) {
        const group=item.facets.series[0];
        if (group) seriesCounts.set(group,(seriesCounts.get(group)||0)+1);
        if(!words.every(word=>item.text.includes(word))) continue;
        const misses=chosen.filter(([k,v])=>!item.facets[k].includes(v));
        if(!misses.length) matches.push(item);
        if(misses.length>1) continue;
        for(const [id,values] of Object.entries(item.facets)) {
          if(misses.length && misses[0][0]!==id) continue;
          if(id==='era') eraTotal++;
          for(const v of values) counts[id].set(v,(counts[id].get(v)||0)+1);
        }
      }
      for(const [id,{b,count}] of tabs) {
        b.setAttribute('aria-pressed',String(era===id));
        count.textContent=id ? counts.era.get(id)||0 : eraTotal;
      }
      for(const [id,ctrl] of Object.entries(controls))
        for(const opt of [...ctrl.options].slice(1)) opt.textContent=dimensions[id][1][opt.value]+'（'+(counts[id].get(opt.value)||0)+'）';
      drawChips(chosen,query);
      $('shelf-family-back').hidden=priorResults===null;
      $('shelf-filter-count').textContent=chosen.length ? ' · '+chosen.length : '';
      if($('shelf-order').value==='name') matches.sort((a,b)=>collator.compare(a.doc.label,b.doc.label));
      const size=Number($('shelf-size').value), pages=Math.ceil(matches.length/size);
      page=Math.max(1,Math.min(page,pages || 1));
      const start=(page-1)*size, end=Math.min(start+size,matches.length);
      $('shelf-count').textContent='共 '+matches.length+' 位';
      $('shelf-range').textContent=matches.length ? '显示 '+(start+1)+'–'+end+' 位' : '';
      grid.dataset.framing=framing; resetImages();
      const browsingSeries = chosen.length===1 && !query ? controls.series.value : '';
      grid.replaceChildren(...matches.slice(start,end).map(item=>card(item,seriesCounts,browsingSeries)));
      $('shelf-empty').hidden=matches.length>0;
      $('shelf-empty').querySelector('strong').textContent=controls.source.value==='saved' && !rows.some(r=>r.facets.source[0]==='saved')
        ? '还没有保存的形象' : '没有找到匹配的人物';
      for(const b of pane.querySelectorAll('[data-shelf-view]')) b.setAttribute('aria-pressed',String(framing===b.dataset.shelfView));
      drawPager(pages); remember();
    }
    function firstPage(){ page=1; draw(); }
    function clear() {
      priorResults=null; era=''; for(const c of Object.values(controls)) c.value='';
      $('look-query').value=''; firstPage(); $('look-query').focus({preventScroll:true});
    }
    $('shelf-prev').onclick=()=>changePage(page-1); $('shelf-next').onclick=()=>changePage(page+1);
    $('clear-looks').onclick=clear; $('empty-clear').onclick=clear;
    $('look-query').oninput=firstPage;
    for(const c of [...Object.values(controls),$('shelf-order'),$('shelf-size')]) c.onchange=firstPage;
    for(const b of pane.querySelectorAll('[data-shelf-view]')) b.onclick=()=>{framing=b.dataset.shelfView;draw();};
    const filterPanel=$('shelf-filter-panel'), small=matchMedia('(max-width: 720px)');
    filterPanel.open=!small.matches;
    small.addEventListener('change',()=>{filterPanel.open=!small.matches;});
    return {refresh(selected) {
      currentKey=selected; draw();
    }};
  }
  return {create};
})();
