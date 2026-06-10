import React, { useCallback, useEffect } from 'react';
import CodeMirror, { oneDarkTheme } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { useSettingsStore } from '../stores/useSettingsStore';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
  placeholder?: string;
}

export const MarkdownEditor: React.FC<Props> = ({ value, onChange, onSave, readOnly }) => {
  const fontSize = useSettingsStore(s => s.settings.fontSize);

  const handleChange = useCallback((val: string) => {
    onChange(val);
  }, [onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave?.();
    }
  }, [onSave]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="h-full overflow-auto">
      <CodeMirror
        value={value || ''}
        onChange={handleChange}
        theme={oneDarkTheme}
        readOnly={readOnly}
        placeholder="开始创作... (Ctrl+S 保存)"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: '"Source Han Serif SC", "Noto Serif CJK SC", Georgia, serif',
          height: '100%',
        }}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          indentOnInput: true,
          tabSize: 2,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          searchKeymap: false,
          drawSelection: false,
          highlightSpecialChars: false,
        }}
        extensions={[
          markdown({ base: markdownLanguage, codeLanguages: [] }),
          EditorView.lineWrapping,
        ]}
      />
    </div>
  );
};
