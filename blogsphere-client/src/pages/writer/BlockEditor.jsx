import React, { useState } from 'react';
import {
  LuPlus, LuTrash2, LuArrowUp, LuArrowDown, LuChevronDown, LuChevronUp,
  LuHeading, LuHeading2, LuText, LuList, LuListOrdered, LuQuote, LuImage,
  LuTable, LuInfo, LuCircleHelp, LuLink, LuCopy
} from 'react-icons/lu';
import { BLOCKS, blockToHtml, blocksToHtml, wordCount } from './articleBlocks';

const ICONS = {
  paragraph: LuText,
  h2: LuHeading,
  h3: LuHeading2,
  quote: LuQuote,
  list: LuList,
  steps: LuListOrdered,
  image: LuImage,
  table: LuTable,
  callout: LuInfo,
  faq: LuCircleHelp,
  sources: LuLink
};

const isLines = (type) => type === 'list' || type === 'steps';

const newBlock = (type) => {
  switch (type) {
    case 'list':
    case 'steps':
      return { type, items: [''] };
    case 'table':
      return { type, rows: [['Column 1', 'Column 2'], ['', '']] };
    case 'image':
      return { type, src: '', alt: '', caption: '' };
    case 'faq':
      return { type, question: '', answer: '' };
    case 'sources':
      return { type, url: '', label: '' };
    default:
      return { type, text: '' };
  }
};

const BlockCard = ({ block, index, total, onChange, onMove, onRemove, onDuplicate }) => {
  const [open, setOpen] = useState(true);
  const meta = BLOCKS[block.type] || BLOCKS.paragraph;
  const Icon = ICONS[block.type] || LuText;

  const updateLines = (raw) => onChange({ ...block, items: raw.split('\n') });

  return (
    <div className={`block-card${open ? ' block-card--open' : ''}`}>
      <div className="block-card__bar">
        <span className="block-card__type"><Icon size={15} aria-hidden="true" /> {meta.label}</span>
        <span className="block-card__tools">
          <button type="button" className="block-tool" title="Move up" disabled={index === 0} onClick={() => onMove(-1)}><LuArrowUp size={14} /></button>
          <button type="button" className="block-tool" title="Move down" disabled={index === total - 1} onClick={() => onMove(1)}><LuArrowDown size={14} /></button>
          <button type="button" className="block-tool" title="Duplicate" onClick={onDuplicate}><LuCopy size={14} /></button>
          <button type="button" className="block-tool block-tool--danger" title="Delete" onClick={onRemove}><LuTrash2 size={14} /></button>
          <button type="button" className="block-tool" title={open ? 'Collapse' : 'Expand'} onClick={() => setOpen((v) => !v)}>
            {open ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />}
          </button>
        </span>
      </div>

      {open && (
        <div className="block-card__body">
          {(block.type === 'h2' || block.type === 'h3') && (
            <input
              className="write-input"
              placeholder={block.type === 'h2' ? 'Section heading, e.g. How long does it take?' : 'Sub heading'}
              value={block.text || ''}
              onChange={(e) => onChange({ ...block, text: e.target.value })}
            />
          )}

          {(block.type === 'paragraph' || block.type === 'quote' || block.type === 'callout') && (
            <textarea
              className="write-textarea"
              rows={block.type === 'paragraph' ? 4 : 2}
              placeholder={meta.hint}
              value={block.text || ''}
              onChange={(e) => onChange({ ...block, text: e.target.value })}
            />
          )}

          {isLines(block.type) && (
            <>
              <textarea
                className="write-textarea"
                rows={4}
                placeholder={'One ' + (block.type === 'steps' ? 'step' : 'point') + ' per line'}
                value={(block.items || []).join('\n')}
                onChange={(e) => updateLines(e.target.value)}
              />
              <p className="write-hint">Write one item per line. Bold with **two stars**.</p>
            </>
          )}

          {block.type === 'image' && (
            <div className="block-grid">
              <input className="write-input" placeholder="Image URL, e.g. /images/photo.jpg" value={block.src || ''} onChange={(e) => onChange({ ...block, src: e.target.value })} />
              <input className="write-input" placeholder="What the picture shows, for screen readers" value={block.alt || ''} onChange={(e) => onChange({ ...block, alt: e.target.value })} />
              <input className="write-input" placeholder="Caption and photo credit" value={block.caption || ''} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
            </div>
          )}

          {block.type === 'table' && (
            <div className="block-table">
              {(block.rows || []).map((row, r) => (
                <div className="block-table__row" key={r}>
                  {row.map((cell, c) => (
                    <input
                      key={c}
                      className="write-input"
                      placeholder={r === 0 ? 'Header ' + (c + 1) : 'Cell'}
                      value={cell}
                      onChange={(e) => {
                        const rows = (block.rows || []).map((x) => x.slice());
                        rows[r][c] = e.target.value;
                        onChange({ ...block, rows });
                      }}
                    />
                  ))}
                  <button type="button" className="block-tool block-tool--danger" title="Remove row"
                    onClick={() => onChange({ ...block, rows: (block.rows || []).filter((_, i) => i !== r) })}>
                    <LuTrash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="block-table__actions">
                <button type="button" className="write-mini" onClick={() => {
                  const width = (block.rows?.[0] || []).length || 2;
                  onChange({ ...block, rows: [...(block.rows || []), Array(width).fill('')] });
                }}>+ Row</button>
                <button type="button" className="write-mini" onClick={() => {
                  onChange({ ...block, rows: (block.rows || []).map((r) => [...r, '']) });
                }}>+ Column</button>
              </div>
            </div>
          )}

          {block.type === 'faq' && (
            <div className="block-grid">
              <input className="write-input" placeholder="The question readers ask" value={block.question || ''} onChange={(e) => onChange({ ...block, question: e.target.value })} />
              <textarea className="write-textarea" rows={3} placeholder="A clear answer in two or three sentences" value={block.answer || ''} onChange={(e) => onChange({ ...block, answer: e.target.value })} />
            </div>
          )}

          {block.type === 'sources' && (
            <div className="block-grid">
              <input className="write-input" placeholder="Link, e.g. https://www.gov.uk/..." value={block.url || ''} onChange={(e) => onChange({ ...block, url: e.target.value })} />
              <input className="write-input" placeholder="Name of the source, e.g. UK Food Standards Agency" value={block.label || ''} onChange={(e) => onChange({ ...block, label: e.target.value })} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const BlockEditor = ({ blocks, setBlocks, preview, onTogglePreview }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const patch = (i, b) => setBlocks(blocks.map((x, k) => (k === i ? b : x)));
  const remove = (i) => setBlocks(blocks.filter((_, k) => k !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = blocks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
  };
  const duplicate = (i) => setBlocks([...blocks.slice(0, i + 1), JSON.parse(JSON.stringify(blocks[i])), ...blocks.slice(i + 1)]);
  const add = (type) => {
    setBlocks([...blocks, newBlock(type)]);
    setMenuOpen(false);
  };

  const words = wordCount(blocks);

  return (
    <div className="block-editor">
      <div className="block-editor__top">
        <span className="write-label">Story</span>
        <span className="block-editor__count">{words} {words === 1 ? 'word' : 'words'}</span>
        <button type="button" className="write-mini" onClick={onTogglePreview}>
          {preview ? 'Back to editing' : 'Preview'}
        </button>
      </div>

      {preview ? (
        <div className="article-preview" dangerouslySetInnerHTML={{ __html: blocksToHtml(blocks) }} />
      ) : (
        <div className="block-list">
          {blocks.map((b, i) => (
            <BlockCard
              key={i}
              block={b}
              index={i}
              total={blocks.length}
              onChange={(nb) => patch(i, nb)}
              onMove={(dir) => move(i, dir)}
              onRemove={() => remove(i)}
              onDuplicate={() => duplicate(i)}
            />
          ))}

          <div className="block-add">
            <button type="button" className="block-add__button" onClick={() => setMenuOpen((v) => !v)}>
              <LuPlus size={16} aria-hidden="true" /> Add a block
            </button>
            {menuOpen && (
              <div className="block-add__menu">
                {Object.entries(BLOCKS).map(([type, m]) => {
                  const Icon = ICONS[type];
                  return (
                    <button type="button" key={type} className="block-add__item" onClick={() => add(type)}>
                      <Icon size={15} aria-hidden="true" />
                      <span className="block-add__label">{m.label}</span>
                      <span className="block-add__hint">{m.hint}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <details className="block-advanced">
        <summary>Show the HTML that will be saved</summary>
        <pre className="block-advanced__code">{blocksToHtml(blocks)}</pre>
      </details>
    </div>
  );
};

export { blockToHtml };
export default BlockEditor;
