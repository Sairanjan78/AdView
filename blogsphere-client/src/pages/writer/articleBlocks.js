export const BLOCKS = {
  paragraph: { label: 'Paragraph', hint: 'A normal block of text.' },
  h2: { label: 'Section heading', hint: 'A big heading. Written as a question works best.' },
  h3: { label: 'Sub heading', hint: 'A smaller heading inside a section.' },
  quote: { label: 'Quote', hint: 'A highlighted line or a quotation.' },
  list: { label: 'List', hint: 'Bulleted points, one per line.' },
  steps: { label: 'Steps', hint: 'Numbered steps, one per line.' },
  image: { label: 'Image', hint: 'A picture with a caption under it.' },
  table: { label: 'Table', hint: 'Rows of data. The first row is the header.' },
  callout: { label: 'Note box', hint: 'A highlighted tip or warning.' },
  faq: { label: 'FAQ', hint: 'A question with its answer.' },
  sources: { label: 'Sources', hint: 'A link that supports what you wrote.' }
};

export const TEMPLATES = {
  guide: {
    label: 'How to guide',
    description: 'Step by step help with a quick answer at the top.',
    blocks: [
      { type: 'callout', text: 'Quick answer: Write the short answer here in one or two sentences, before anything else.' },
      { type: 'paragraph', text: 'Write an opening paragraph that says what the reader will get from this page.' },
      { type: 'h2', text: 'What do you need to know first?' },
      { type: 'paragraph', text: 'Background the reader needs before the steps.' },
      { type: 'h2', text: 'How do you do it, step by step?' },
      { type: 'steps', items: ['First step.', 'Second step.', 'Third step.'] },
      { type: 'h2', text: 'What mistakes should you avoid?' },
      { type: 'list', items: ['First common mistake.', 'Second common mistake.'] },
      { type: 'h2', text: 'Frequently asked questions' },
      { type: 'faq', question: 'A question readers ask?', answer: 'A clear answer.' },
      { type: 'sources', url: 'https://', label: 'Source name' }
    ]
  },
  explainer: {
    label: 'Explainer',
    description: 'Answer a question in plain language, with no steps.',
    blocks: [
      { type: 'callout', text: 'Quick answer: The short answer goes here.' },
      { type: 'paragraph', text: 'An opening paragraph in plain words.' },
      { type: 'h2', text: 'What does it mean?' },
      { type: 'paragraph', text: 'Explain the idea simply.' },
      { type: 'h2', text: 'Why does it matter?' },
      { type: 'paragraph', text: 'Explain why the reader should care.' },
      { type: 'h2', text: 'What is a common misunderstanding?' },
      { type: 'paragraph', text: 'Clear up a confusion.' },
      { type: 'h2', text: 'Frequently asked questions' },
      { type: 'faq', question: 'A question readers ask?', answer: 'A clear answer.' },
      { type: 'sources', url: 'https://', label: 'Source name' }
    ]
  },
  listicle: {
    label: 'Listicle',
    description: 'A ranked or grouped list of items.',
    blocks: [
      { type: 'callout', text: 'Quick answer: Sum up the list in one sentence.' },
      { type: 'paragraph', text: 'An opening paragraph that sets up the list.' },
      { type: 'h2', text: '1. First item' },
      { type: 'paragraph', text: 'Describe the first item.' },
      { type: 'h2', text: '2. Second item' },
      { type: 'paragraph', text: 'Describe the second item.' },
      { type: 'h2', text: '3. Third item' },
      { type: 'paragraph', text: 'Describe the third item.' },
      { type: 'h2', text: 'Frequently asked questions' },
      { type: 'faq', question: 'A question readers ask?', answer: 'A clear answer.' },
      { type: 'sources', url: 'https://', label: 'Source name' }
    ]
  },
  news: {
    label: 'News update',
    description: 'Report something that just happened.',
    blocks: [
      { type: 'callout', text: 'What happened: One sentence on the news, as of today.' },
      { type: 'paragraph', text: 'The key fact in the first paragraph.' },
      { type: 'h2', text: 'What is the detail?' },
      { type: 'paragraph', text: 'The main facts.' },
      { type: 'h2', text: 'Why does it matter?' },
      { type: 'paragraph', text: 'The impact on readers.' },
      { type: 'h2', text: 'What happens next?' },
      { type: 'paragraph', text: 'Dates and next steps.' },
      { type: 'sources', url: 'https://', label: 'Source name' }
    ]
  },
  blank: {
    label: 'Blank page',
    description: 'Start with nothing and add your own blocks.',
    blocks: [{ type: 'paragraph', text: '' }]
  }
};

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const safeUrl = (u) => {
  const s = String(u || '').trim();
  return /^https?:\/\//i.test(s) || /^\/(images|uploads)\//i.test(s) ? s : '';
};

// Inline marks: **bold**, *italic*, [text](https://url). Links are kept so imported/edited posts keep clickable sources.
const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const inline = (s) => {
  const links = [];
  const withTokens = String(s == null ? '' : s).replace(LINK_RE, (m, text, url) => {
    links.push({ text, url });
    return `\u0000L${links.length - 1}\u0000`;
  });
  return esc(withTokens)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\u0000L(\d+)\u0000/g, (m, i) => {
      const { text, url } = links[Number(i)];
      const safe = safeUrl(url);
      const label = esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
      return safe ? `<a href="${esc(safe).replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
    });
};

export const blockToHtml = (b) => {
  if (!b) return '';
  switch (b.type) {
    case 'h2':
      return b.text ? `<h2>${inline(b.text)}</h2>` : '';
    case 'h3':
      return b.text ? `<h3>${inline(b.text)}</h3>` : '';
    case 'quote':
      return b.text ? `<blockquote><p>${inline(b.text)}</p></blockquote>` : '';
    case 'list': {
      const items = (b.items || []).filter((i) => i.trim());
      return items.length ? `<ul>${items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>` : '';
    }
    case 'steps': {
      const items = (b.items || []).filter((i) => i.trim());
      return items.length ? `<ol>${items.map((i) => `<li>${inline(i)}</li>`).join('')}</ol>` : '';
    }
    case 'image': {
      const src = safeUrl(b.src);
      if (!src) return '';
      const cap = b.caption ? `<figcaption>${inline(b.caption)}</figcaption>` : '';
      return `<figure><img src="${src}" alt="${esc(b.alt || '')}" loading="lazy" />${cap}</figure>`;
    }
    case 'table': {
      const rows = (b.rows || []).filter((r) => r.some((c) => c.trim()));
      if (!rows.length) return '';
      const head = `<thead><tr>${rows[0].map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>`;
      const body = rows.slice(1).map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('');
      return `<table>${head}<tbody>${body}</tbody></table>`;
    }
    case 'callout':
      return b.text ? `<p><strong>${inline(b.text)}</strong></p>` : '';
    case 'faq':
      return b.question || b.answer
        ? `<h3>${inline(b.question || '')}</h3><p>${inline(b.answer || '')}</p>`
        : '';
    case 'sources': {
      const url = safeUrl(b.url);
      if (!url) return '';
      return `<li>${inline(b.label || url)} <a href="${url}">${esc(url.replace(/^https?:\/\//, '').split('/')[0])}</a></li>`;
    }
    case 'paragraph':
    default:
      return b.text ? `<p>${inline(b.text)}</p>` : '';
  }
};

export const blocksToHtml = (blocks) => {
  const out = [];
  let sources = [];
  const flushSources = () => {
    if (sources.length) {
      out.push(`<h2>Sources</h2>`, `<ul>${sources.join('')}</ul>`);
      sources = [];
    }
  };
  for (const b of blocks || []) {
    if (b.type === 'sources') {
      const h = blockToHtml(b);
      if (h) sources.push(h);
      continue;
    }
    flushSources();
    out.push(blockToHtml(b));
  }
  flushSources();
  return out.filter(Boolean).join('\n');
};

const stripTags = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export const wordCount = (blocks) => {
  const txt = stripTags(blocksToHtml(blocks));
  return txt ? txt.split(' ').filter(Boolean).length : 0;
};

export const blocksFromHtml = (html) => {
  const src = String(html || '').trim();
  if (!src) return [{ type: 'paragraph', text: '' }];
  if (typeof DOMParser === 'undefined') return [{ type: 'paragraph', text: stripTags(src) }];

  const blocks = [];
  const doc = new DOMParser().parseFromString(src, 'text/html');
  let pendingSources = false;

  const push = (b) => { if (b) blocks.push(b); };

  for (const el of Array.from(doc.body.children)) {
    const tag = el.tagName.toLowerCase();
    const text = el.textContent.replace(/\s+/g, ' ').trim();

    if (tag === 'h2' && /^sources$/i.test(text)) { pendingSources = true; continue; }

    if (tag === 'h2' || tag === 'h3') {
      if (text) push({ type: tag, text });
    } else if (tag === 'blockquote') {
      if (text) push({ type: 'quote', text: inlineToText(nodeToMd(el)) });
    } else if (tag === 'p') {
      if (!text) continue;
      const onlyBold = el.children.length === 1 && /^(strong|b)$/i.test(el.children[0].tagName) && el.children[0].textContent.trim() === text;
      push({ type: onlyBold ? 'callout' : 'paragraph', text: onlyBold ? inlineToText(nodeToMd(el.children[0])) : inlineToText(nodeToMd(el)) });
    } else if (tag === 'ul' || tag === 'ol') {
      const lis = Array.from(el.querySelectorAll(':scope > li'));
      if (pendingSources) {
        for (const li of lis) {
          const a = li.querySelector('a[href]');
          if (a) push({ type: 'sources', url: a.getAttribute('href'), label: li.textContent.replace(a.textContent, '').trim() });
        }
        pendingSources = false;
      } else if (lis.length) {
        push({ type: tag === 'ol' ? 'steps' : 'list', items: lis.map((li) => inlineToText(nodeToMd(li))) });
      }
    } else if (tag === 'figure' || tag === 'img') {
      const img = tag === 'img' ? el : el.querySelector('img');
      if (!img) continue;
      const cap = tag === 'figure' ? el.querySelector('figcaption') : null;
      push({ type: 'image', src: img.getAttribute('src') || '', alt: img.getAttribute('alt') || '', caption: cap ? inlineToText(nodeToMd(cap)) : '' });
    } else if (tag === 'table') {
      const rows = Array.from(el.querySelectorAll('tr')).map((tr) =>
        Array.from(tr.querySelectorAll('th, td')).map((c) => inlineToText(nodeToMd(c)))
      );
      if (rows.length) push({ type: 'table', rows });
    } else if (text) {
      push({ type: 'paragraph', text: inlineToText(nodeToMd(el)) });
    }
  }
  return blocks.length ? blocks : [{ type: 'paragraph', text: stripTags(src) }];
};

const inlineToText = (s) => String(s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

// Turn an element's inline HTML into the editor's inline marks, so links and bold/italic survive a load and save.
function nodeToMd(node) {
  let out = '';
  for (const n of Array.from(node.childNodes || [])) {
    if (n.nodeType === 3) { out += n.textContent; continue; }
    if (n.nodeType !== 1) continue;
    const t = n.tagName.toLowerCase();
    const inner = nodeToMd(n);
    if (t === 'a') {
      const href = safeUrl(n.getAttribute('href'));
      out += href && inner.trim() ? `[${inner.trim()}](${href.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\s/g, '%20')})` : inner;
    } else if ((t === 'strong' || t === 'b') && inner.trim()) {
      out += `**${inner.trim()}**`;
    } else if ((t === 'em' || t === 'i') && inner.trim()) {
      out += `*${inner.trim()}*`;
    } else if (t === 'br') {
      out += ' ';
    } else {
      out += inner;
    }
  }
  return out;
}
