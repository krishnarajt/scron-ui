import { useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';

/**
 * CodeEditor — A beautifully themed code editor built on CodeMirror 6.
 * Supports Python and Bash with full syntax highlighting,
 * line numbers, active line gutter, and bracket matching.
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
  const handleChange = useCallback((val) => {
    if (onChange) onChange(val);
  }, [onChange]);

  // Language extension
  const extensions = useMemo(() => {
    const exts = [
      EditorView.lineWrapping,
      EditorView.theme({
        '&': {
          backgroundColor: 'var(--surface-0)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
        },
        '&.cm-focused': {
          outline: 'none',
          borderColor: 'var(--accent)',
          boxShadow: '0 0 0 3px var(--accent-glow), 0 0 20px var(--accent-glow)',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--surface-0)',
          borderRight: '1px solid var(--border)',
          color: 'var(--txt-dim)',
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
          backgroundColor: 'rgba(from var(--accent) r g b / 0.1)',
          color: 'var(--accent)',
        },
        '.cm-activeLine': {
          backgroundColor: 'rgba(from var(--accent) r g b / 0.04)',
        },
        '.cm-content': {
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: '13px',
          lineHeight: '1.7',
          padding: '8px 0',
          caretColor: 'var(--accent)',
        },
        '.cm-cursor': {
          borderLeftColor: 'var(--accent)',
          borderLeftWidth: '2px',
        },
        '.cm-selectionBackground': {
          backgroundColor: 'rgba(from var(--accent) r g b / 0.15) !important',
        },
        '.cm-placeholder': {
          color: 'var(--txt-dim)',
          fontStyle: 'italic',
        },
        '.cm-matchingBracket': {
          backgroundColor: 'rgba(from var(--accent) r g b / 0.2)',
          color: 'var(--accent) !important',
          borderBottom: '2px solid var(--accent)',
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
  }, [language, minHeight, maxHeight]);

  return (
    <div className="code-editor-wrapper relative group">
      {/* Language badge */}
      <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider transition-opacity duration-200"
           style={{
             background: 'var(--surface-3)',
             color: 'var(--txt-dim)',
             opacity: 0.8,
           }}>
        {language}
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
        theme="dark"
      />
    </div>
  );
}
