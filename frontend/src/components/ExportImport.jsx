import React, { useRef } from 'react';

function escapeCsv(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function exportCsv(tasks) {
  const header = 'id,title,completed,created_at';
  const rows = tasks.map((t) =>
    [t.id, escapeCsv(t.title), t.completed, t.created_at || ''].join(',')
  );
  return [header, ...rows].join('\n');
}

function exportJson(tasks) {
  return JSON.stringify(tasks, null, 2);
}

function exportXml(tasks) {
  const escape = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  const items = tasks
    .map(
      (t) =>
        `  <task><id>${t.id}</id><title>${escape(t.title)}</title><completed>${t.completed}</completed><created_at>${escape(t.created_at || '')}</created_at></task>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<tasks>\n${items}\n</tasks>`;
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const tasks = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let cur = '';
    let inQuotes = false;
    for (let j = 0; j < lines[i].length; j++) {
      const c = lines[i][j];
      if (c === '"') {
        if (inQuotes && lines[i][j + 1] === '"') {
          cur += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((c === ',' && !inQuotes) || c === '\n') {
        values.push(cur.trim());
        cur = '';
        if (c === '\n') break;
      } else {
        cur += c;
      }
    }
    values.push(cur.trim());
    const row = {};
    headers.forEach((h, idx) => (row[h] = values[idx]));
    const title = row.title || row.task || row.name || '';
    if (title) {
      tasks.push({
        title,
        completed: /^(true|1|yes)$/i.test(String(row.completed ?? row.done ?? '')),
      });
    }
  }
  return tasks;
}

function parseJson(text) {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : (data.tasks || data.items || []);
  return arr.map((t) => ({
    title: t.title || t.task || t.name || '',
    completed: Boolean(t.completed ?? t.done ?? false),
  })).filter((t) => t.title);
}

function parseXml(text) {
  const tasks = [];
  const taskRegex = /<task>([\s\S]*?)<\/task>/gi;
  const getTag = (block, name) => {
    const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'i'));
    return m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").trim() : '';
  };
  let m;
  while ((m = taskRegex.exec(text)) !== null) {
    const block = m[1];
    const title = getTag(block, 'title') || getTag(block, 'task') || getTag(block, 'name');
    if (title) {
      const completed = /^(true|1|yes)$/i.test(getTag(block, 'completed') || getTag(block, 'done'));
      tasks.push({ title, completed });
    }
  }
  return tasks;
}

function ExportImport({ tasks, onImport, disabled }) {
  const fileRef = useRef(null);

  const handleExport = (format) => {
    let content, ext, mime;
    if (format === 'csv') {
      content = exportCsv(tasks);
      ext = 'csv';
      mime = 'text/csv';
    } else if (format === 'json') {
      content = exportJson(tasks);
      ext = 'json';
      mime = 'application/json';
    } else {
      content = exportXml(tasks);
      ext = 'xml';
      mime = 'application/xml';
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || disabled) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      let parsed = [];
      const ext = (file.name || '').toLowerCase();
      try {
        if (ext.endsWith('.csv')) {
          parsed = parseCsv(text);
        } else if (ext.endsWith('.json')) {
          parsed = parseJson(text);
        } else if (ext.endsWith('.xml')) {
          parsed = parseXml(text);
        } else {
          if (text.trim().startsWith('<?xml') || text.trim().startsWith('<')) {
            parsed = parseXml(text);
          } else if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
            parsed = parseJson(text);
          } else {
            parsed = parseCsv(text);
          }
        }
        if (parsed.length > 0) {
          onImport(parsed);
        }
      } catch (err) {
        alert('Failed to parse file: ' + err.message);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="export-import">
      <div className="export-buttons">
        <span className="label">Export:</span>
        <button type="button" onClick={() => handleExport('csv')} disabled={disabled || tasks.length === 0}>
          CSV
        </button>
        <button type="button" onClick={() => handleExport('json')} disabled={disabled || tasks.length === 0}>
          JSON
        </button>
        <button type="button" onClick={() => handleExport('xml')} disabled={disabled || tasks.length === 0}>
          XML
        </button>
      </div>
      <div className="import-section">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.json,.xml"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
        >
          Import from file
        </button>
      </div>
    </div>
  );
}

export default ExportImport;
