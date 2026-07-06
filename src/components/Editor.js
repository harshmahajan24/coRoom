// src/components/Editor.js
import React, { useState, useCallback, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { oneDark } from '@codemirror/theme-one-dark';
import { yCollab } from 'y-codemirror.next';
import { EditorView, drawSelection, highlightActiveLine, lineNumbers } from '@codemirror/view';
import { bracketMatching, foldGutter, indentOnInput } from '@codemirror/language';
import { closeBrackets } from '@codemirror/autocomplete';
import { useCollab } from '../hooks/useCollab';
import './Editor.css';

const LANGUAGE_CONFIG = {
  cpp: { lang: cpp, ext: 'cpp', label: 'C++' },
  c: { lang: cpp, ext: 'c', label: 'C' },
  python: { lang: python, ext: 'py', label: 'Python' },
  java: { lang: java, ext: 'java', label: 'Java' },
  javascript: { lang: javascript, ext: 'js', label: 'JavaScript' }
};

function Editor({ user }) {
  const { ytext, provider, peers } = useCollab();
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [members, setMembers] = useState([]);

  useEffect(() => {
    setMembers(peers);
  }, [peers]);

  useEffect(() => {
    if (provider && provider.doc) {
      const ymap = provider.doc.getMap('metadata');
      
      const syncLanguage = () => {
        const roomLanguage = ymap.get('language');
        if (roomLanguage && LANGUAGE_CONFIG[roomLanguage]) {
          setLanguage(roomLanguage);
        }
      };

      syncLanguage();
      ymap.observe(syncLanguage);

      return () => {
        ymap.unobserve(syncLanguage);
      };
    }
  }, [provider]);

  // Panel Toggle States (VS Code Style)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isOutputOpen, setIsOutputOpen] = useState(true);

  const hexToRgba = (hex, alpha = 0.15) => {
    if (!hex || !hex.startsWith('#')) return `rgba(255, 255, 255, ${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleLanguageChange = (newLang) => {
    if (provider && provider.doc) {
      const ymap = provider.doc.getMap('metadata');
      ymap.set('language', newLang);
      setLanguage(newLang);
    }
  };

  const runCode = useCallback(async () => {
    if (!ytext) return;
    const code = ytext.toString();
    if (!code.trim()) {
      setError('Please write some code first');
      return;
    }

    setLoading(true);
    setError('');
    setOutput('Running code on execution engine...');
    setIsOutputOpen(true);

    try {
      const response = await fetch('http://localhost:5000/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Execution failed');
      
      if (data.error) {
        setError(data.error);
        setOutput('');
      } else {
        setOutput(data.output || 'Program completed with no output sequence.');
      }
    } catch (err) {
      setOutput('');
      setError(err.message || 'Failed to execute code.');
    } finally {
      setLoading(false);
    }
  }, [ytext, language]);

  const editorTheme = EditorView.theme({
    "&": { height: "100%", backgroundColor: "#000000", color: "#ffffff" },
    ".cm-content": { caretColor: "#ffffff", fontFamily: "'Fira Code', monospace", fontSize: "14px" },
    ".cm-cursor": { borderLeftColor: "#ffffff" },
    ".cm-gutters": { backgroundColor: "#050505", borderRight: "1px solid #1a1a1a", color: "#444444" },
    ".cm-activeLineGutter": { backgroundColor: "#111111", color: "#ffffff" },
    ".cm-activeLine": { backgroundColor: "rgba(255, 255, 255, 0.03)" }
  });

  const extensions = [
    LANGUAGE_CONFIG[language].lang(),
    oneDark,
    editorTheme,
    highlightActiveLine(),
    bracketMatching(),
    closeBrackets(),
    foldGutter(),
    indentOnInput(),
    drawSelection(),
    lineNumbers(),
    EditorView.lineWrapping,
    ...(ytext && provider ? [yCollab(ytext, provider.awareness)] : [])
  ];

  return (
    <div className="editor-container">
      {/* Top Controls Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <div className="language-selector" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              className={`layout-toggle-btn ${isSidebarOpen ? 'active' : ''}`}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title="Toggle Members Sidebar"
              style={{ margin: 0 }}
            >
              👥
            </button>
            <label style={{ marginLeft: '0.25rem' }}>Language</label>
            <div className="lang-buttons">
              {Object.entries(LANGUAGE_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleLanguageChange(key)}
                  className={`lang-btn ${language === key ? 'active' : ''}`}
                  disabled={false}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={runCode} disabled={loading || !ytext} className="run-btn">
            <span className="run-icon">{loading ? '⏳' : '▶'}</span>
            {loading ? 'Running...' : 'Run Code'}
          </button>
          
          <button 
            className={`layout-toggle-btn ${isOutputOpen ? 'active' : ''}`}
            onClick={() => setIsOutputOpen(!isOutputOpen)}
            title="Toggle Console Terminal"
          >
            📋
          </button>
        </div>
      </div>

      {/* Main Split Layout Workspace */}
      <div className="editor-main">
        
        {/* Dynamic Presence Side Panel */}
        <div className={`members-sidebar ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
          <div className="panel-header">
            <h3>Active Members ({members.length})</h3>
            <button className="panel-close-btn" onClick={() => setIsSidebarOpen(false)}>✕</button>
          </div>
          <div className="members-list-wrapper">
            {members.map((member, i) => {
              const isMe = member.name === user?.name;
              return (
                <div 
                  key={i} 
                  className="member-item-card"
                  style={{ 
                    backgroundColor: hexToRgba(member.color, 0.08),
                    borderColor: hexToRgba(member.color, 0.2)
                  }}
                >
                  <div className="avatar-wrapper-inline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {member.avatar ? (
                      <img 
                        src={member.avatar} 
                        alt="" 
                        className="member-item-avatar" 
                        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => { 
                          e.target.style.display = 'none';
                          const fallbackNode = document.createElement('span');
                          fallbackNode.style.cssText = "width:24px; height:24px; border-radius:50%; background:#222; display:flex; align-items:center; justify-content:center; font-size:0.65rem; color:#fff; font-weight:700;";
                          fallbackNode.innerText = member.name ? member.name.charAt(0).toUpperCase() : '⚡';
                          e.target.parentNode.appendChild(fallbackNode);
                        }} 
                      />
                    ) : (
                      <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#fff', fontWeight: '700' }}>
                        {member.name ? member.name.charAt(0).toUpperCase() : '⚡'}
                      </span>
                    )}
                  </div>
                  <span className="member-item-name" style={{ color: isMe ? '#ffffff' : '#aaaaaa', fontWeight: isMe ? '700' : '500', marginLeft: '0.5rem' }}>
                    {isMe ? `Me (${member.name})` : member.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Core Code Canvas Panel */}
        <div className="editor-panel">
          <div className="panel-header">
            <h3>Source Workstation</h3>
          </div>
          <div className="editor-wrapper">
            {ytext && provider ? (
              <CodeMirror 
                height="100%" 
                extensions={extensions} 
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: true,
                  bracketMatching: true,
                  closeBrackets: true
                }}
                onCreateEditor={(view) => {
                  if (ytext && typeof ytext.toString === 'function') {
                    const currentDocText = ytext.toString();
                    if (view.state.doc.toString() !== currentDocText) {
                      view.dispatch({
                        changes: { from: 0, to: view.state.doc.length, insert: currentDocText }
                      });
                    }
                  }
                }}
              />
            ) : (
              <div className="editor-loading">
                <div className="spinner"></div>
                <p>Syncing collaboration pipes...</p>
              </div>
            )}
          </div>
        </div>

        {/* Executed Code Console Panel */}
        <div className={`output-panel ${isOutputOpen ? 'expanded' : 'collapsed'}`}>
          <div className="panel-header">
            <h3>Console Output</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {output && <button onClick={() => setOutput('')} className="clear-output-btn" title="Clear panel">Clear</button>}
              <button className="panel-close-btn" onClick={() => setIsOutputOpen(false)}>✕</button>
            </div>
          </div>
          <div className="output-content">
            {error && <div className="output-error">{error}</div>}
            {output && !error && <pre className="output-text">{output}</pre>}
            {!output && !error && (
              <div className="output-placeholder">
                <p>📤 Terminal Idle</p>
                <small>Trigger compilation to view output</small>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Editor;