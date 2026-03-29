const container = document.getElementById('text-container');
const sitesArea = document.getElementById('allowed-sites');

function addRow(label = '', value = '') {
  const div = document.createElement('div');
  div.className = 'row';
  div.innerHTML = `
    <input type="text" class="label" placeholder="Label" value="${label}">
    <input type="text" class="value" placeholder="Text" value="${value}">
    <button class="remove">Delete</button>
  `;
  div.querySelector('.remove').onclick = () => div.remove();
  container.appendChild(div);
}

document.getElementById('add').onclick = () => addRow();

document.getElementById('save').onclick = () => {
  const texts = Array.from(document.querySelectorAll('.row')).map(r => ({
    label: r.querySelector('.label').value.trim(),
    value: r.querySelector('.value').value
  })).filter(t => t.label);
  
  const allowedSites = sitesArea.value.split('\n').map(s => s.trim()).filter(s => s);
  
  chrome.storage.sync.set({ texts, allowedSites }, () => {
    alert('Settings Saved!');
    chrome.runtime.reload(); // Refresh background logic
  });
};

document.getElementById('import-json').onclick = () => {
  const fileInput = document.getElementById('json-file');
  const file = fileInput.files[0];
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
      // Save
      chrome.storage.sync.set({ texts: data.texts, allowedSites: data.allowedSites }, () => {
        alert('Settings imported successfully!');
        // Reload the UI
        container.innerHTML = '';
        if (data.texts) data.texts.forEach(t => addRow(t.label, t.value));
        if (data.allowedSites) sitesArea.value = data.allowedSites.join('\n');
        chrome.runtime.reload();
      });
    } catch (error) {
      alert('Error importing JSON: ' + error.message);
    }
  };
  reader.readAsText(file);
};

document.getElementById('export-json').onclick = () => {
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
};

chrome.storage.sync.get(['texts', 'allowedSites'], (data) => {
  if (data.texts) data.texts.forEach(t => addRow(t.label, t.value));
  if (data.allowedSites) sitesArea.value = data.allowedSites.join('\n');
});