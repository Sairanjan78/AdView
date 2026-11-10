import React, { useEffect, useState } from 'react';
import { LuLanguages, LuX } from 'react-icons/lu';
import { LANGUAGES, setCookie, readLang } from './LanguageSwitcher';
import './LanguageHint.css';

const KEY = 'bsm_lang_hint_done';

// Small, dismissible bar (not a popup) that tells visitors the site can be
// read in Indian languages. Shows once; suggests the visitor's own language
// when their phone or browser is set to one.
export default function LanguageHint() {
  const [show, setShow] = useState(false);
  const [suggest, setSuggest] = useState(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) || readLang() !== 'en') return;
    } catch (e) { return; }
    const prefs = (navigator.languages || [navigator.language || '']).map(l => (l || '').toLowerCase());
    let match = null;
    for (const p of prefs) {
      const base = p.split('-')[0];
      if (base === 'en') break;
      match = LANGUAGES.find(([c]) => c.toLowerCase() === p || c.toLowerCase().split('-')[0] === base);
      if (match) break;
    }
    setSuggest(match && match[0] !== 'en' ? match : null);
    const t = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const done = () => {
    try { localStorage.setItem(KEY, '1'); } catch (e) { /* ignore */ }
    setShow(false);
  };

  const translate = (code) => {
    done();
    setCookie(`/en/${code}`);
    window.location.reload();
  };

  if (!show) return null;

  return (
    <div className="lang-hint notranslate" role="region" aria-label="Language options">
      <LuLanguages className="lang-hint__icon" aria-hidden="true" />
      {suggest ? (
        <>
          <span className="lang-hint__text">Read BlogSphere in {suggest[1].split(' (')[0]}?</span>
          <button type="button" className="lang-hint__btn" onClick={() => translate(suggest[0])}>Yes, translate</button>
        </>
      ) : (
        <>
          <span className="lang-hint__text">Now in ଓଡ଼ିଆ, हिन्दी and 18 more languages</span>
          <select className="lang-hint__select" defaultValue="" onChange={e => e.target.value && translate(e.target.value)} aria-label="Choose language">
            <option value="" disabled>Choose</option>
            {LANGUAGES.filter(([c]) => c !== 'en').map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </>
      )}
      <button type="button" className="lang-hint__close" onClick={done} aria-label="Dismiss"><LuX /></button>
    </div>
  );
}
