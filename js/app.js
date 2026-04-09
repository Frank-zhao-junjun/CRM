// ===== State =====
let currentPage = 'dashboard';
let editingId = null;
let editingType = null;

// ===== Navigation =====
document.querySelectorAll('.nav-item, .view-all').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    const page = el.dataset.page;
    if (page) navigateTo(page);
  });
});

document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');

  const titles = { dashboard: 'Dashboard', customers: 'Customers', leads: 'Leads Pipeline', contacts: 'Contacts', tasks: 'Tasks', reports: 'Reports' };
  document.getElementById('page-title').textContent = titles[page] || page;

  const actionLabels = { customers: '+ New Customer', leads: '+ New Lead', contacts: '+ New Contact', tasks: '+ New Task', dashboard: '', reports: '' };
  const btn = document.getElementById('action-btn');
  btn.textContent = actionLabels[page] || '';
  btn.style.display = actionLabels[page] ? 'inline-flex' : 'none';

  if (page === 'dashboard') renderDashboard();
  if (page === 'customers') renderCustomers();
  if (page === 'leads') renderLeads();
  if (page === 'contacts') renderContacts();
  if (page === 'tasks') renderTasks();
  if (page === 'reports') renderReports();

  document.getElementById('sidebar').classList.remove('open');
}

function handleActionBtn() {
  if (currentPage === 'customers') openCustomerModal();
  if (currentPage === 'leads') openLeadModal();
  if (currentPage === 'contacts') openContactModal();
  if (currentPage === 'tasks') openTaskModal();
}

// ===== Dashboard =====
function renderDashboard() {
  const customers = loadData('customers');
  const leads = loadData('leads');
  const tasks = loadData('tasks');

  const activeLeads = leads.filter(l => l.stage !== 'Closed Won').length;
  const revenue = customers.reduce((s, c) => s + (c.value || 0), 0);
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

  document.getElementById('stat-customers').textContent = customers.length;
  document.getElementById('stat-leads').textContent = activeLeads;
  document.getElementById('stat-revenue').textContent = '$' + revenue.toLocaleString();
  document.getElementById('stat-tasks').textContent = pendingTasks;

  // Recent customers
  const rcEl = document.getElementById('recent-customers');
  if (customers.length === 0) {
    rcEl.innerHTML = '<p class="empty-state">No customers yet.</p>';
  } else {
    const recent = [...customers].slice(-5).reverse();
    rcEl.innerHTML = `<ul class="mini-list">${recent.map(c => `
      <li>
        <div>
          <div class="name">${esc(c.name)}</div>
          <div class="sub">${esc(c.company)}</div>
        </div>
        <span class="badge badge-${c.status.toLowerCase()}">${esc(c.status)}</span>
      </li>`).join('')}</ul>`;
  }

  // Pipeline summary
  const psEl = document.getElementById('pipeline-summary');
  const stages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Closed Won'];
  if (leads.length === 0) {
    psEl.innerHTML = '<p class="empty-state">No leads yet.</p>';
  } else {
    psEl.innerHTML = `<ul class="mini-list">${stages.map(stage => {
      const count = leads.filter(l => l.stage === stage).length;
      const val = leads.filter(l => l.stage === stage).reduce((s, l) => s + (l.value || 0), 0);
      return `<li><span class="name">${stage}</span><span style="color:var(--text-secondary);font-size:12px">${count} lead${count !== 1 ? 's' : ''} · $${val.toLocaleString()}</span></li>`;
    }).join('')}</ul>`;
  }

  // Upcoming tasks
  const utEl = document.getElementById('upcoming-tasks');
  const upcoming = tasks.filter(t => t.status === 'pending').slice(0, 5);
  if (upcoming.length === 0) {
    utEl.innerHTML = '<p class="empty-state">No pending tasks.</p>';
  } else {
    utEl.innerHTML = `<ul class="mini-list">${upcoming.map(t => `
      <li>
        <div>
          <div class="name">${esc(t.title)}</div>
          <div class="sub">${esc(t.relatedTo)} · Due ${esc(t.dueDate)}</div>
        </div>
        <span class="badge badge-${t.priority.toLowerCase()}">${esc(t.priority)}</span>
      </li>`).join('')}</ul>`;
  }
}

// ===== Customers =====
function renderCustomers() {
  let customers = loadData('customers');
  const search = document.getElementById('customer-search').value.toLowerCase();
  const status = document.getElementById('customer-filter').value;

  if (search) customers = customers.filter(c =>
    c.name.toLowerCase().includes(search) ||
    c.company.toLowerCase().includes(search) ||
    c.email.toLowerCase().includes(search)
  );
  if (status) customers = customers.filter(c => c.status === status);

  const tbody = document.getElementById('customer-tbody');
  if (customers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No customers found.</td></tr>';
    return;
  }
  tbody.innerHTML = customers.map(c => `
    <tr>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${esc(c.company)}</td>
      <td><a href="mailto:${esc(c.email)}" style="color:var(--primary)">${esc(c.email)}</a></td>
      <td>${esc(c.phone)}</td>
      <td><span class="badge badge-${c.status.toLowerCase()}">${esc(c.status)}</span></td>
      <td>$${(c.value || 0).toLocaleString()}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="openCustomerModal(${c.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteRecord('customers', ${c.id})">Delete</button>
      </td>
    </tr>`).join('');
}

function filterCustomers() { renderCustomers(); }

function openCustomerModal(id) {
  editingType = 'customers';
  const customers = loadData('customers');
  const c = id ? customers.find(x => x.id === id) : null;
  editingId = id || null;
  document.getElementById('modal-title').textContent = c ? 'Edit Customer' : 'New Customer';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-row">
      <div class="form-group"><label>Full Name *</label><input type="text" id="f-name" value="${esc(c?.name || '')}" /></div>
      <div class="form-group"><label>Company</label><input type="text" id="f-company" value="${esc(c?.company || '')}" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Email</label><input type="email" id="f-email" value="${esc(c?.email || '')}" /></div>
      <div class="form-group"><label>Phone</label><input type="tel" id="f-phone" value="${esc(c?.phone || '')}" /></div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Status</label>
        <select id="f-status">
          <option ${c?.status === 'Active' ? 'selected' : ''}>Active</option>
          <option ${c?.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
          <option ${c?.status === 'Prospect' ? 'selected' : ''}>Prospect</option>
        </select>
      </div>
      <div class="form-group"><label>Value ($)</label><input type="number" id="f-value" value="${c?.value || 0}" min="0" /></div>
    </div>
    <div class="form-group"><label>Notes</label><textarea id="f-notes">${esc(c?.notes || '')}</textarea></div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveCustomer()">Save</button>
    </div>`;
  openModal();
}

function saveCustomer() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { alert('Name is required.'); return; }
  const customers = loadData('customers');
  const record = {
    name,
    company: document.getElementById('f-company').value.trim(),
    email: document.getElementById('f-email').value.trim(),
    phone: document.getElementById('f-phone').value.trim(),
    status: document.getElementById('f-status').value,
    value: parseInt(document.getElementById('f-value').value) || 0,
    notes: document.getElementById('f-notes').value.trim(),
  };
  if (editingId) {
    const idx = customers.findIndex(x => x.id === editingId);
    customers[idx] = { ...customers[idx], ...record };
  } else {
    customers.push({ id: nextId(customers), ...record });
  }
  saveData('customers', customers);
  closeModal();
  renderCustomers();
}

// ===== Leads =====
function renderLeads() {
  const leads = loadData('leads');
  const stages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Closed Won'];
  const colIds = { 'New': 'cards-new', 'Contacted': 'cards-contacted', 'Qualified': 'cards-qualified', 'Proposal': 'cards-proposal', 'Closed Won': 'cards-closed' };

  stages.forEach(stage => {
    const el = document.getElementById(colIds[stage]);
    const stageLeads = leads.filter(l => l.stage === stage);
    el.innerHTML = stageLeads.length === 0
      ? '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:12px">Drop cards here</div>'
      : stageLeads.map(l => `
        <div class="lead-card" draggable="true" id="lead-${l.id}"
          ondragstart="drag(event, ${l.id})"
          ondragend="dragEnd(event)">
          <div class="lead-card-title">${esc(l.name)}</div>
          <div class="lead-card-company">${esc(l.company)}</div>
          <div class="lead-card-value">$${(l.value || 0).toLocaleString()}</div>
          <div class="lead-card-actions">
            <button class="btn btn-sm btn-secondary" onclick="openLeadModal(${l.id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteRecord('leads', ${l.id})">Delete</button>
          </div>
        </div>`).join('');
  });
}

function openLeadModal(id) {
  editingType = 'leads';
  const leads = loadData('leads');
  const l = id ? leads.find(x => x.id === id) : null;
  editingId = id || null;
  document.getElementById('modal-title').textContent = l ? 'Edit Lead' : 'New Lead';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-row">
      <div class="form-group"><label>Contact Name *</label><input type="text" id="f-name" value="${esc(l?.name || '')}" /></div>
      <div class="form-group"><label>Company</label><input type="text" id="f-company" value="${esc(l?.company || '')}" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Email</label><input type="email" id="f-email" value="${esc(l?.email || '')}" /></div>
      <div class="form-group"><label>Deal Value ($)</label><input type="number" id="f-value" value="${l?.value || 0}" min="0" /></div>
    </div>
    <div class="form-group">
      <label>Stage</label>
      <select id="f-stage">
        ${['New','Contacted','Qualified','Proposal','Closed Won'].map(s => `<option ${l?.stage === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Notes</label><textarea id="f-notes">${esc(l?.notes || '')}</textarea></div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveLead()">Save</button>
    </div>`;
  openModal();
}

function saveLead() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { alert('Name is required.'); return; }
  const leads = loadData('leads');
  const record = {
    name,
    company: document.getElementById('f-company').value.trim(),
    email: document.getElementById('f-email').value.trim(),
    value: parseInt(document.getElementById('f-value').value) || 0,
    stage: document.getElementById('f-stage').value,
    notes: document.getElementById('f-notes').value.trim(),
  };
  if (editingId) {
    const idx = leads.findIndex(x => x.id === editingId);
    leads[idx] = { ...leads[idx], ...record };
  } else {
    leads.push({ id: nextId(leads), ...record });
  }
  saveData('leads', leads);
  closeModal();
  renderLeads();
}

// Drag and Drop
function drag(event, id) {
  event.dataTransfer.setData('leadId', id);
  document.getElementById('lead-' + id).classList.add('dragging');
}

function dragEnd(event) {
  document.querySelectorAll('.lead-card').forEach(c => c.classList.remove('dragging'));
}

function allowDrop(event) { event.preventDefault(); }

function drop(event, stage) {
  event.preventDefault();
  const id = parseInt(event.dataTransfer.getData('leadId'));
  const leads = loadData('leads');
  const lead = leads.find(l => l.id === id);
  if (lead) {
    lead.stage = stage;
    saveData('leads', leads);
    renderLeads();
  }
}

// ===== Contacts =====
function renderContacts() {
  let contacts = loadData('contacts');
  const search = document.getElementById('contact-search').value.toLowerCase();
  if (search) contacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search) ||
    c.company.toLowerCase().includes(search) ||
    c.email.toLowerCase().includes(search)
  );
  const tbody = document.getElementById('contact-tbody');
  if (contacts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No contacts found.</td></tr>';
    return;
  }
  tbody.innerHTML = contacts.map(c => `
    <tr>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${esc(c.title)}</td>
      <td>${esc(c.company)}</td>
      <td><a href="mailto:${esc(c.email)}" style="color:var(--primary)">${esc(c.email)}</a></td>
      <td>${esc(c.phone)}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="openContactModal(${c.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteRecord('contacts', ${c.id})">Delete</button>
      </td>
    </tr>`).join('');
}

function filterContacts() { renderContacts(); }

function openContactModal(id) {
  editingType = 'contacts';
  const contacts = loadData('contacts');
  const c = id ? contacts.find(x => x.id === id) : null;
  editingId = id || null;
  document.getElementById('modal-title').textContent = c ? 'Edit Contact' : 'New Contact';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-row">
      <div class="form-group"><label>Full Name *</label><input type="text" id="f-name" value="${esc(c?.name || '')}" /></div>
      <div class="form-group"><label>Title</label><input type="text" id="f-title" value="${esc(c?.title || '')}" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Company</label><input type="text" id="f-company" value="${esc(c?.company || '')}" /></div>
      <div class="form-group"><label>Email</label><input type="email" id="f-email" value="${esc(c?.email || '')}" /></div>
    </div>
    <div class="form-group"><label>Phone</label><input type="tel" id="f-phone" value="${esc(c?.phone || '')}" /></div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveContact()">Save</button>
    </div>`;
  openModal();
}

function saveContact() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { alert('Name is required.'); return; }
  const contacts = loadData('contacts');
  const record = {
    name,
    title: document.getElementById('f-title').value.trim(),
    company: document.getElementById('f-company').value.trim(),
    email: document.getElementById('f-email').value.trim(),
    phone: document.getElementById('f-phone').value.trim(),
  };
  if (editingId) {
    const idx = contacts.findIndex(x => x.id === editingId);
    contacts[idx] = { ...contacts[idx], ...record };
  } else {
    contacts.push({ id: nextId(contacts), ...record });
  }
  saveData('contacts', contacts);
  closeModal();
  renderContacts();
}

// ===== Tasks =====
function renderTasks() {
  let tasks = loadData('tasks');
  const filter = document.getElementById('task-filter').value;
  if (filter) tasks = tasks.filter(t => t.status === filter);

  const tbody = document.getElementById('task-tbody');
  if (tasks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No tasks found.</td></tr>';
    return;
  }
  tbody.innerHTML = tasks.map(t => `
    <tr>
      <td><strong>${esc(t.title)}</strong></td>
      <td>${esc(t.relatedTo)}</td>
      <td>${esc(t.dueDate)}</td>
      <td><span class="badge badge-${t.priority.toLowerCase()}">${esc(t.priority)}</span></td>
      <td><span class="badge badge-${t.status === 'done' ? 'done' : 'pending'}">${t.status === 'done' ? 'Completed' : 'Pending'}</span></td>
      <td>
        ${t.status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="completeTask(${t.id})">✓ Done</button>` : ''}
        <button class="btn btn-sm btn-secondary" onclick="openTaskModal(${t.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteRecord('tasks', ${t.id})">Delete</button>
      </td>
    </tr>`).join('');
}

function filterTasks() { renderTasks(); }

function completeTask(id) {
  const tasks = loadData('tasks');
  const t = tasks.find(x => x.id === id);
  if (t) { t.status = 'done'; saveData('tasks', tasks); renderTasks(); }
}

function openTaskModal(id) {
  editingType = 'tasks';
  const tasks = loadData('tasks');
  const t = id ? tasks.find(x => x.id === id) : null;
  editingId = id || null;
  document.getElementById('modal-title').textContent = t ? 'Edit Task' : 'New Task';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group"><label>Task Title *</label><input type="text" id="f-title" value="${esc(t?.title || '')}" /></div>
    <div class="form-row">
      <div class="form-group"><label>Related To</label><input type="text" id="f-related" value="${esc(t?.relatedTo || '')}" /></div>
      <div class="form-group"><label>Due Date</label><input type="date" id="f-due" value="${esc(t?.dueDate || '')}" /></div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Priority</label>
        <select id="f-priority">
          ${['High','Medium','Low'].map(p => `<option ${t?.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="f-status">
          <option value="pending" ${t?.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="done" ${t?.status === 'done' ? 'selected' : ''}>Completed</option>
        </select>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveTask()">Save</button>
    </div>`;
  openModal();
}

function saveTask() {
  const title = document.getElementById('f-title').value.trim();
  if (!title) { alert('Title is required.'); return; }
  const tasks = loadData('tasks');
  const record = {
    title,
    relatedTo: document.getElementById('f-related').value.trim(),
    dueDate: document.getElementById('f-due').value,
    priority: document.getElementById('f-priority').value,
    status: document.getElementById('f-status').value,
  };
  if (editingId) {
    const idx = tasks.findIndex(x => x.id === editingId);
    tasks[idx] = { ...tasks[idx], ...record };
  } else {
    tasks.push({ id: nextId(tasks), ...record });
  }
  saveData('tasks', tasks);
  closeModal();
  renderTasks();
}

// ===== Reports =====
function renderReports() {
  const customers = loadData('customers');
  const leads = loadData('leads');

  // Customer status chart
  drawBarChart('chart-customer-status',
    ['Active', 'Inactive', 'Prospect'],
    ['Active', 'Inactive', 'Prospect'].map(s => customers.filter(c => c.status === s).length),
    ['#4f46e5', '#94a3b8', '#06b6d4'],
    'Customers by Status'
  );

  // Pipeline chart
  const stages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Closed Won'];
  drawBarChart('chart-pipeline',
    stages,
    stages.map(s => leads.filter(l => l.stage === s).length),
    ['#4f46e5', '#f59e0b', '#10b981', '#06b6d4', '#22c55e'],
    'Leads by Stage'
  );

  // Revenue chart
  const topCustomers = [...customers].sort((a, b) => b.value - a.value).slice(0, 8);
  drawBarChart('chart-revenue',
    topCustomers.map(c => c.name.split(' ')[0]),
    topCustomers.map(c => c.value),
    Array(topCustomers.length).fill('#4f46e5'),
    'Revenue by Customer ($)'
  );
}

function drawBarChart(canvasId, labels, values, colors, title) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const padL = 50, padR = 20, padT = 36, padB = 50;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  ctx.clearRect(0, 0, W, H);

  const max = Math.max(...values, 1);
  const barW = chartW / labels.length * 0.6;
  const gap = chartW / labels.length;

  // Title
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 13px -apple-system,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, W / 2, 20);

  // Gridlines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + chartH - (i / 4) * chartH;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    const val = Math.round(max * i / 4);
    ctx.fillText(val >= 1000 ? '$' + (val / 1000).toFixed(0) + 'k' : val, padL - 4, y + 3);
  }

  // Bars and labels
  labels.forEach((label, i) => {
    const x = padL + gap * i + gap / 2 - barW / 2;
    const barH = (values[i] / max) * chartH;
    const y = padT + chartH - barH;

    ctx.fillStyle = colors[i % colors.length];
    roundRect(ctx, x, y, barW, barH, 4);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    // Truncate long labels
    const lbl = label.length > 8 ? label.slice(0, 7) + '…' : label;
    ctx.fillText(lbl, padL + gap * i + gap / 2, padT + chartH + 16);

    if (values[i] > 0) {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 10px sans-serif';
      const valStr = values[i] >= 1000 ? '$' + (values[i] / 1000).toFixed(0) + 'k' : values[i];
      ctx.fillText(valStr, padL + gap * i + gap / 2, y - 4);
    }
  });
}

function roundRect(ctx, x, y, w, h, r) {
  if (h <= 0) return;
  r = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ===== Delete =====
function deleteRecord(type, id) {
  if (!confirm('Are you sure you want to delete this record?')) return;
  const data = loadData(type);
  saveData(type, data.filter(x => x.id !== id));
  if (currentPage === 'dashboard') renderDashboard();
  if (currentPage === 'customers') renderCustomers();
  if (currentPage === 'leads') renderLeads();
  if (currentPage === 'contacts') renderContacts();
  if (currentPage === 'tasks') renderTasks();
}

// ===== Modal Helpers =====
function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  editingId = null;
  editingType = null;
}

// Close modal on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ===== Utility =====
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ===== Init =====
navigateTo('dashboard');
