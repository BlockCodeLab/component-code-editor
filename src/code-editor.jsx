import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { useRef, useEffect, useState } from 'preact/hooks';
import { useEditor } from '@blockcode/core';
import createEditor from './create-monaco';

import styles from './code-editor.module.css';

const extname = (filename) => filename.split('.').at(-1);

const setModel = (editor, modifyFile, file = { content: '', name: '' }) => {
  const fileUri = monaco.Uri.file(file.name);
  const modelId = fileUri.toString();
  let model = monaco.editor.getModel(modelId);
  if (!model) {
    model = monaco.editor.createModel(file.content, undefined, fileUri);
    model.onDidChangeContent(() => modifyFile({ content: model.getValue() }));
  }
  const oldModel = editor.getModel();
  editor.setModel(model);
  oldModel.dispose();
};

export function CodeEditor({ onSetup }) {
  const ref = useRef(null);

  const [filesCount, setFilesCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentExtname, setCurrentExtname] = useState('');

  const { fileList, selectedIndex, modifyFile } = useEditor();
  const file = selectedIndex >= 0 && fileList[selectedIndex];

  if (ref.editor && file) {
    if (extname(file.name) !== currentExtname) {
      setCurrentExtname(extname(file.name));
      setModel(ref.editor, modifyFile, file);
    }

    if (currentIndex !== selectedIndex || fileList.length !== filesCount) {
      setFilesCount(fileList.length);
      setCurrentIndex(selectedIndex);
      ref.editor.getModel().setValue(file.content);
      ref.editor.updateOptions({ readOnly: file.readOnly });
    }
  }

  useEffect(async () => {
    if (ref.current) {
      ref.editor = await createEditor(ref.current);
      if (file) {
        setFilesCount(fileList.length);
        setCurrentIndex(selectedIndex);
        setCurrentExtname(extname(file.name));
        ref.editor.updateOptions({ readOnly: file.readOnly });
      }
      setModel(ref.editor, modifyFile, file);
      if (onSetup) {
        onSetup(ref.editor);
      }
    }
    return () => {
      if (ref.editor) {
        ref.editor.dispose();
        ref.editor = null;
      }
    };
  }, [ref]);

  return (
    <div
      ref={ref}
      className={styles.editorWrapper}
    ></div>
  );
}
