import React, { useEffect, useState } from 'react';
import { LuLanguages } from 'react-icons/lu';
import './LanguageSwitcher.css';

// Machine translation in the visitor's browser (Google Translate widget).
// Translated text is never indexed or stored, so it doesn't create new pages
// (safe for AdSense and SEO).
export const LANGUAGES = [
  ['en', 'English'],
  ['or', 'ଓଡ଼ିଆ (Odia)'],
  ['hi', 'हिन्दी (Hindi)'],
  ['bn', 'বাংলা (Bengali)'],
  ['te', 'తెలుగు (Telugu)'],
  ['ta', 'தமிழ் (Tamil)'],
  ['mr', 'मराठी (Marathi)'],
  ['gu', 'ગુજરાતી (Gujarati)'],
  ['kn', 'ಕನ್ನಡ (Kannada)'],
  ['ml', 'മലയാളം (Malayalam)'],
  ['pa', 'ਪੰਜਾਬੀ (Punjabi)'],
  ['as', 'অসমীয়া (Assamese)'],
  ['ur', 'اردو (Urdu)'],
  ['ne', 'नेपाली (Nepali)'],
  ['sa', 'संस्कृतम् (Sanskrit)'],
  ['mai', 'मैथिली (Maithili)'],
  ['kok', 'कोंकणी (Konkani)'],
  ['doi', 'डोगरी (Dogri)'],
  ['mni-Mtei', 'ꯃꯩꯇꯩꯂꯣꯟ (Manipuri)'],
  ['sd', 'سنڌي (Sindhi)'],
];

export const readLang = () => {
  const m = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]+\/([^;]+)/);
  return m ? decodeURIComponent(m[1]) : 'en';
};

export const setCookie = (value) => {
  const host = window.location.hostname;
  const domains = ['', host, `.${host.replace(/^www\./, '')}`];
  domains.forEach(d => {
    const dom = d ? `; domain=${d}` : '';
    document.cookie = value
      ? `googtrans=${value}; path=/${dom}`
      : `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${dom}`;
  });
};

let loaded = false;
const loadWidget = () => {
  if (loaded) return;
  loaded = true;
  window.googleTranslateElementInit = () => {
    // eslint-disable-next-line no-new
    new window.google.translate.TranslateElement(
      { pageLanguage: 'en', includedLanguages: LANGUAGES.map(l => l[0]).join(','), autoDisplay: false },
      'google_translate_element'
    );
  };
  const s = document.createElement('script');
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  s.async = true;
  document.body.appendChild(s);
};

export default function LanguageSwitcher({ className = '' }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const current = readLang();
    setLang(current);
    if (current !== 'en') loadWidget();
  }, []);

  const onChange = (e) => {
    const next = e.target.value;
    setLang(next);
    setCookie(next === 'en' ? null : `/en/${next}`);
    window.location.reload();
  };

  return (
    <label className={`lang-switcher notranslate ${className}`} title="Translate this site">
      <LuLanguages aria-hidden="true" />
      <span className="sr-only">Language</span>
      <select value={lang} onChange={onChange} aria-label="Choose language">
        {LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
      </select>
      <span id="google_translate_element" hidden />
    </label>
  );
}
