const sanitizeHtml = require('sanitize-html');

/**
 * Cleans stored article HTML: keeps normal blog markup (headings, lists, tables, images, links,
 * quotes, code, figures, YouTube/Vimeo embeds) and drops scripts, styles, inline event handlers
 * and javascript: URLs. Runs on save so readers and the bot renderer get the same safe HTML.
 */
const OPTIONS = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'div', 'span',
    'a', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark', 'small', 'sub', 'sup', 'abbr', 'cite', 'q',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'blockquote', 'pre', 'code', 'kbd',
    'figure', 'figcaption', 'img', 'picture', 'source',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    'details', 'summary', 'iframe'
  ],
  allowedAttributes: {
    '*': ['id', 'class', 'title', 'lang', 'dir'],
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'decoding'],
    source: ['srcset', 'sizes', 'type', 'media'],
    th: ['colspan', 'rowspan', 'scope'],
    td: ['colspan', 'rowspan'],
    col: ['span'],
    ol: ['start', 'reversed', 'type'],
    iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'loading']
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'], source: ['http', 'https'] },
  allowProtocolRelative: false,
  allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
  transformTags: {
    // Links that open a new tab must not get window.opener
    a: (tagName, attribs) => {
      if (attribs.target === '_blank') {
        const rel = new Set(String(attribs.rel || '').split(/\s+/).filter(Boolean));
        rel.add('noopener');
        rel.add('noreferrer');
        return { tagName, attribs: { ...attribs, rel: [...rel].join(' ') } };
      }
      return { tagName, attribs };
    }
  }
};

const sanitizeArticleHtml = (html = '') => sanitizeHtml(String(html), OPTIONS);

module.exports = sanitizeArticleHtml;
