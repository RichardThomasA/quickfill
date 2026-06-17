const container = (typeof document !== 'undefined') ? document.getElementById('text-container') : null;
const sitesArea = (typeof document !== 'undefined') ? document.getElementById('allowed-sites') : null;

function normalizeText(s) {
  if (typeof s !== 'string') return '';
  // Replace newlines and tabs with a single space, collapse multiple spaces, trim ends
  let r = s.replace(/\r\n|\r|\n|\t/g, ' ');
  r = r.replace(/ {2,}/g, ' ');
  return r.trim();
}

function normalizeLabel(s) {
  if (typeof s !== 'string') return '';
  // Labels should not contain newlines/tabs; keep other chars intact
  let r = s.replace(/\r\n|\r|\n|\t/g, ' ');
  r = r.replace(/ {2,}/g, ' ');
  r = r.trim();
  return r;
}

function addRow(label = '', value = '') {
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'row';

  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'label';
  labelInput.placeholder = 'Label';
  labelInput.value = normalizeLabel(label);

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.className = 'value';
  valueInput.placeholder = 'Text';
  valueInput.value = normalizeText(value);

  // Paste handlers to sanitize clipboard content immediately
  labelInput.addEventListener('paste', (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    const sanitized = normalizeLabel(paste);
    const start = labelInput.selectionStart || 0;
    const end = labelInput.selectionEnd || 0;
    labelInput.value = labelInput.value.slice(0, start) + sanitized + labelInput.value.slice(end);
  });

  valueInput.addEventListener('paste', (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    const sanitized = normalizeText(paste);
    const start = valueInput.selectionStart || 0;
    const end = valueInput.selectionEnd || 0;
    valueInput.value = valueInput.value.slice(0, start) + sanitized + valueInput.value.slice(end);
  });

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove';
  removeBtn.textContent = 'Delete';
  removeBtn.onclick = () => div.remove();

  div.appendChild(labelInput);
  div.appendChild(valueInput);
  div.appendChild(removeBtn);

  container.appendChild(div);
}

// UI bindings: only attach when running in browser and elements exist
if (typeof document !== 'undefined') {
  document.getElementById('add')?.addEventListener('click', () => addRow());

  document.getElementById('save')?.addEventListener('click', () => {
    const texts = Array.from(document.querySelectorAll('.row')).map(r => ({
      label: normalizeLabel(r.querySelector('.label').value),
      value: normalizeText(r.querySelector('.value').value)
    })).filter(t => t.label);
    
    const allowedSites = (sitesArea ? sitesArea.value.split('\n').map(s => s.trim()).filter(s => s) : []);
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ texts, allowedSites }, () => {
        alert('Settings Saved!');
        chrome.runtime.reload(); // Refresh background logic
      });
    }
  });

  document.getElementById('import-json')?.addEventListener('click', () => {
    const fileInput = document.getElementById('json-file');
    const file = fileInput && fileInput.files && fileInput.files[0];
    if (!file) {
      alert('Please select a JSON file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.texts || !Array.isArray(data.texts) || !data.allowedSites || !Array.isArray(data.allowedSites)) {
          throw new Error('Invalid JSON structure. Must have "texts" and "allowedSites" arrays.');
        }
        // Validate texts
        for (const item of data.texts) {
          if (typeof item.label !== 'string' || typeof item.value !== 'string') {
            throw new Error('Each text item must have "label" and "value" as strings.');
          }
        }
        // Validate allowedSites
        for (const site of data.allowedSites) {
          if (typeof site !== 'string') {
            throw new Error('Allowed sites must be strings.');
          }
        }
        // Sanitize before save
        const sanitizedTexts = data.texts.map(t => ({ label: normalizeLabel(t.label), value: normalizeText(t.value) }));
        const sanitizedSites = data.allowedSites.map(s => (typeof s === 'string' ? s.trim() : '')).filter(s => s);

        // Save
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
          chrome.storage.sync.set({ texts: sanitizedTexts, allowedSites: sanitizedSites }, () => {
            alert('Settings imported successfully!');
            // Reload the UI
            if (container) container.innerHTML = '';
            if (sanitizedTexts && container) sanitizedTexts.forEach(t => addRow(t.label, t.value));
            if (sanitizedSites && sitesArea) sitesArea.value = sanitizedSites.join('\n');
            chrome.runtime.reload();
          });
        }
      } catch (error) {
        alert('Error importing JSON: ' + error.message);
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('export-json')?.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(['texts', 'allowedSites'], (data) => {
        const json = JSON.stringify({ texts: data.texts || [], allowedSites: data.allowedSites || [] }, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quickfill-settings.json';
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  });

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(['texts', 'allowedSites'], (data) => {
      if (data.texts && Array.isArray(data.texts)) data.texts.forEach(t => addRow(t.label, t.value));
      if (data.allowedSites && Array.isArray(data.allowedSites) && sitesArea) sitesArea.value = data.allowedSites.join('\n');
    });
  }
}

// Exports for unit tests
export { normalizeText, normalizeLabel, addRow };
