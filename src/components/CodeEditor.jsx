import { useState, useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import { Sun, Moon } from 'lucide-react';

/**
 * CodeEditor — A beautifully themed code editor built on CodeMirror 6.
 * Supports Python and Bash with full syntax highlighting,
 * line numbers, active line gutter, bracket matching,
 * and a light/dark mode toggle.
 *
 * Props:
 *   value       — the current code string
 *   onChange    — callback when code changes
 *   language    — 'python' | 'bash'
 *   placeholder — placeholder text
 *   readOnly    — whether the editor is read-only
 *   minHeight   — minimum height in px (default 200)
 *   maxHeight   — maximum height in px (default 500)
 */
export default function CodeEditor({
  value = '',
  onChange,
  language = 'python',
  placeholder = '',
  readOnly = false,
  minHeight = 200,
  maxHeight = 500,
}) {
  const [editorLight, setEditorLight] = useState(false);

  const handleChange = useCallback((val) => {
    if (onChange) onChange(val);
  }, [onChange]);

  // Dark theme colors
  const darkColors = {
    bg: 'var(--surface-0)',
    gutterBg: 'var(--surface-0)',
    gutterBorder: 'var(--border)',
    gutterText: 'var(--txt-dim)',
    activeLineBg: 'rgba(from var(--accent) r g b / 0.04)',
    activeGutterBg: 'rgba(from var(--accent) r g b / 0.1)',
    activeGutterColor: 'var(--accent)',
    text: 'var(--txt)',
    caret: 'var(--accent)',
    selectionBg: 'rgba(from var(--accent) r g b / 0.15)',
    placeholderColor: 'var(--txt-dim)',
    matchBracketBg: 'rgba(from var(--accent) r g b / 0.2)',
    matchBracketColor: 'var(--accent)',
    border: 'var(--border)',
    focusBorder: 'var(--accent)',
    focusGlow: 'var(--accent-glow)',
  };

  // Light theme colors
  const lightColors = {
    bg: '#fafbfc',
    gutterBg: '#f3f4f6',
    gutterBorder: '#e5e7eb',
    gutterText: '#9ca3af',
    activeLineBg: 'rgba(59, 130, 246, 0.04)',
    activeGutterBg: 'rgba(59, 130, 246, 0.08)',
    activeGutterColor: '#3b82f6',
    text: '#1f2937',
    caret: '#3b82f6',
    selectionBg: 'rgba(59, 130, 246, 0.15)',
    placeholderColor: '#9ca3af',
    matchBracketBg: 'rgba(59, 130, 246, 0.15)',
    matchBracketColor: '#3b82f6',
    border: '#e5e7eb',
    focusBorder: '#3b82f6',
    focusGlow: 'rgba(59, 130, 246, 0.15)',
  };

  const c = editorLight ? lightColors : darkColors;

  // Language extension
  const extensions = useMemo(() => {
    const exts = [
      EditorView.lineWrapping,
      EditorView.theme({
        '&': {
          backgroundColor: c.bg,
          borderRadius: '12px',
          border: `1px solid ${c.border}`,
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
        },
        '&.cm-focused': {
          outline: 'none',
          borderColor: c.focusBorder,
          boxShadow: `0 0 0 3px ${c.focusGlow}, 0 0 20px ${c.focusGlow}`,
        },
        '.cm-gutters': {
          backgroundColor: c.gutterBg,
          borderRight: `1px solid ${c.gutterBorder}`,
          color: c.gutterText,
          paddingLeft: '4px',
          paddingRight: '8px',
          minWidth: '40px',
        },
        '.cm-lineNumbers .cm-gutterElement': {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '12px',
          padding: '0 8px 0 4px',
          minWidth: '20px',
        },
        '.cm-activeLineGutter': {
          backgroundColor: c.activeGutterBg,
          color: c.activeGutterColor,
        },
        '.cm-activeLine': {
          backgroundColor: c.activeLineBg,
        },
        '.cm-content': {
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: '13px',
          lineHeight: '1.7',
          padding: '8px 0',
          caretColor: c.caret,
          color: c.text,
        },
        '.cm-cursor': {
          borderLeftColor: c.caret,
          borderLeftWidth: '2px',
        },
        '.cm-selectionBackground': {
          backgroundColor: `${c.selectionBg} !important`,
        },
        '.cm-placeholder': {
          color: c.placeholderColor,
          fontStyle: 'italic',
        },
        '.cm-matchingBracket': {
          backgroundColor: c.matchBracketBg,
          color: `${c.matchBracketColor} !important`,
          borderBottom: `2px solid ${c.matchBracketColor}`,
        },
        '.cm-scroller': {
          overflow: 'auto',
        },
      }),
    ];

    if (language === 'python') {
      exts.push(python());
    } else {
      // Use javascript for bash as a reasonable fallback
      exts.push(javascript());
    }

    return exts;
  }, [language, minHeight, maxHeight, editorLight]);

  return (
    <div className="code-editor-wrapper relative group">
      {/* Top bar with language badge and light/dark toggle */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {/* Light/dark toggle */}
        <button
          type="button"
          onClick={() => setEditorLight(!editorLight)}
          className="p-1.5 rounded-md transition-all duration-200"
          style={{
            background: editorLight ? '#e5e7eb' : 'var(--surface-3)',
            color: editorLight ? '#6b7280' : 'var(--txt-dim)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = editorLight ? '#1f2937' : 'var(--txt-muted)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = editorLight ? '#6b7280' : 'var(--txt-dim)';
          }}
          title={editorLight ? 'Switch to dark editor' : 'Switch to light editor'}
        >
          {editorLight ? <Moon size={13} /> : <Sun size={13} />}
        </button>

        {/* Language badge */}
        <div className="px-2 py-1 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider"
             style={{
               background: editorLight ? '#e5e7eb' : 'var(--surface-3)',
               color: editorLight ? '#6b7280' : 'var(--txt-dim)',
               opacity: 0.9,
             }}>
          {language}
        </div>
      </div>

      <CodeMirror
        value={value}
        onChange={handleChange}
        extensions={extensions}
        placeholder={placeholder}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          indentOnInput: true,
          tabSize: 4,
        }}
        theme={editorLight ? 'light' : 'dark'}
      />
    </div>
  );
}
