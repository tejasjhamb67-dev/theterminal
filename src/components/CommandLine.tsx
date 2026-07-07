import { useEffect, useMemo, useRef, useState } from 'react';
import { searchFns } from '../core/registry';
import { searchSecurities } from '../data/universe';
import type { FunctionDef, Security } from '../core/types';

interface Suggestion {
  key: string;
  name: string;
  tag: string;
  insert: string;
}

function buildSuggestions(text: string): Suggestion[] {
  const t = text.trim();
  if (t.length < 1 || /^\d+$/.test(t)) return [];
  const fns: FunctionDef[] = searchFns(t, 5);
  const secs: Security[] = searchSecurities(t, 5);
  const out: Suggestion[] = [];
  for (const f of fns) {
    out.push({ key: f.mnemonic, name: f.name, tag: f.stub ? `${f.category} · SOON` : f.category, insert: f.mnemonic });
  }
  for (const s of secs) {
    out.push({ key: s.id, name: s.name, tag: s.kind.toUpperCase(), insert: s.id });
  }
  return out.slice(0, 9);
}

export function CommandLine({
  onSubmit,
  onFocus,
  focused,
  panelIdx,
}: {
  onSubmit: (cmd: string) => void;
  onFocus: () => void;
  focused: boolean;
  panelIdx: number;
}) {
  const [text, setText] = useState('');
  const [sel, setSel] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestions = useMemo(() => (open ? buildSuggestions(text) : []), [text, open]);

  useEffect(() => {
    if (focused) inputRef.current?.focus();
  }, [focused]);

  const submit = (cmd: string) => {
    if (!cmd.trim()) return;
    onSubmit(cmd);
    setText('');
    setOpen(false);
    setSel(-1);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (sel >= 0 && suggestions[sel]) submit(suggestions[sel].insert);
      else submit(text);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setSel(-1);
      setText('');
    } else if (e.key === 'Tab' && suggestions.length) {
      e.preventDefault();
      setText(suggestions[Math.max(sel, 0)].insert + ' ');
      setSel(-1);
    }
  };

  return (
    <div className="cmdline" onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        value={text}
        placeholder={`Panel ${panelIdx + 1} — command or ticker, then ⏎`}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setSel(-1);
        }}
        onKeyDown={onKey}
        onFocus={() => {
          onFocus();
          if (text) setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        spellCheck={false}
        autoComplete="off"
      />
      <span className="go-hint">&lt;GO&gt;</span>
      {open && suggestions.length > 0 && (
        <div className="suggest">
          <div className="suggest-hdr">FUNCTIONS &amp; SECURITIES</div>
          {suggestions.map((s, i) => (
            <div
              key={s.key + i}
              className={'suggest-row' + (i === sel ? ' sel' : '')}
              onMouseDown={(e) => {
                e.preventDefault();
                submit(s.insert);
              }}
              onMouseEnter={() => setSel(i)}
            >
              <span className="s-key">{s.key}</span>
              <span className="s-name">{s.name}</span>
              <span className="s-tag">{s.tag}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
