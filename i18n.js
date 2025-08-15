(function(){
  const I18N_STORE_KEY = 'bdx_lang';
  const DEFAULT_LANG = 'en';
  const SUPPORTED = ['en','zh-TW','es'];
  let current = null;
  let dict = {};
  let readyResolve;
  const ready = new Promise(res=> readyResolve = res);

  function getInitialLang(){
    const saved = localStorage.getItem(I18N_STORE_KEY);
    if(saved && SUPPORTED.includes(saved)) return saved;
    const nav = (navigator.language || 'en').toLowerCase();
    if(nav.startsWith('zh')) return 'zh-TW';
    if(nav.startsWith('es')) return 'es';
    return DEFAULT_LANG;
  }

  async function loadLocale(lang){
    const res = await fetch(`locales/${lang}.json`, {cache:'no-cache'});
    if(!res.ok) throw new Error('locale load failed');
    return await res.json();
  }

  function t(key, fallback){
    return key.split('.').reduce((acc,k)=> (acc && acc[k]!=null)?acc[k]:null, dict) ?? (fallback ?? key);
  }

  function applyText(){
    document.querySelectorAll('[data-i18n]')?.forEach(el=>{
      const key = el.getAttribute('data-i18n');
      if(!key) return;
      const val = t(key);
      if(val==null) return;
      if(el.hasAttribute('data-i18n-attr')){
        const attr = el.getAttribute('data-i18n-attr');
        el.setAttribute(attr, val);
      }else{
        el.textContent = val;
      }
    });

    document.querySelectorAll('[data-i18n-html]')?.forEach(el=>{
      const key = el.getAttribute('data-i18n-html');
      if(!key) return;
      const val = t(key);
      if(val!=null) el.innerHTML = val;
    });

    document.querySelectorAll('[data-i18n-placeholder]')?.forEach(el=>{
      const key = el.getAttribute('data-i18n-placeholder');
      const val = t(key);
      if(val!=null) el.setAttribute('placeholder', val);
    });

    document.querySelectorAll('[data-i18n-value]')?.forEach(el=>{
      const key = el.getAttribute('data-i18n-value');
      const val = t(key);
      if(val!=null) el.setAttribute('value', val);
    });

    document.querySelectorAll('[data-i18n-aria-label]')?.forEach(el=>{
      const key = el.getAttribute('data-i18n-aria-label');
      const val = t(key);
      if(val!=null) el.setAttribute('aria-label', val);
    });

    document.querySelectorAll('[data-i18n-title]')?.forEach(el=>{
      const key = el.getAttribute('data-i18n-title');
      const val = t(key);
      if(val!=null) el.setAttribute('title', val);
    });
  }

  async function setLang(lang){
    if(!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
    if(current === lang) return;
    current = lang;
    dict = await loadLocale(lang);
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem(I18N_STORE_KEY, lang);
    applyText();
    window.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang } }));
  }

  function initSelector(){
    const sel = document.getElementById('langSelect');
    if(!sel) return;
    sel.value = current;
    sel.addEventListener('change', ()=> setLang(sel.value));
  }

  async function init(){
    current = getInitialLang();
    try{ dict = await loadLocale(current); }catch(e){ current = DEFAULT_LANG; dict = await loadLocale(DEFAULT_LANG); }
    document.documentElement.setAttribute('lang', current);
    initSelector();
    applyText();
    window.i18n = { t, setLang, get lang(){ return current; }, ready };
    window.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang: current } }));
    readyResolve(current);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{ init(); }
})(); 