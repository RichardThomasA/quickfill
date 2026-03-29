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
    label: r.querySelector('.label').value,
    value: r.querySelector('.value').value
  })).filter(t => t.label);
  
  const allowedSites = sitesArea.value.split('\n').map(s => s.trim()).filter(s => s);
  
  chrome.storage.sync.set({ texts, allowedSites }, () => {
    alert('Settings Saved!');
    chrome.runtime.reload(); // Refresh background logic
  });
};

chrome.storage.sync.get(['texts', 'allowedSites'], (data) => {
  if (data.texts) data.texts.forEach(t => addRow(t.label, t.value));
  if (data.allowedSites) sitesArea.value = data.allowedSites.join('\n');
});