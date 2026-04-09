// ===== Local Storage Data Layer =====

const STORAGE_KEYS = {
  customers: 'crm_customers',
  leads: 'crm_leads',
  contacts: 'crm_contacts',
  tasks: 'crm_tasks',
};

const DEMO_DATA = {
  customers: [
    { id: 1, name: 'Alice Johnson', company: 'Acme Corp', email: 'alice@acme.com', phone: '555-0101', status: 'Active', value: 24000, notes: 'Key enterprise account.' },
    { id: 2, name: 'Bob Smith', company: 'TechStart Inc', email: 'bob@techstart.io', phone: '555-0102', status: 'Active', value: 8500, notes: 'Interested in premium plan.' },
    { id: 3, name: 'Carol White', company: 'Design Studio', email: 'carol@design.co', phone: '555-0103', status: 'Prospect', value: 3200, notes: 'Demo scheduled next week.' },
    { id: 4, name: 'David Lee', company: 'MegaCorp', email: 'david@megacorp.com', phone: '555-0104', status: 'Inactive', value: 15000, notes: 'Contract expired.' },
    { id: 5, name: 'Eva Martinez', company: 'GreenSolutions', email: 'eva@green.com', phone: '555-0105', status: 'Active', value: 6700, notes: 'Renewal due Q3.' },
  ],
  leads: [
    { id: 1, name: 'Frank Turner', company: 'DataWave', value: 12000, stage: 'New', email: 'frank@datawave.com', notes: 'Referral from Alice.' },
    { id: 2, name: 'Grace Liu', company: 'CloudBase', value: 9500, stage: 'Contacted', email: 'grace@cloudbase.io', notes: 'Called on Monday.' },
    { id: 3, name: 'Harry Brown', company: 'RetailPro', value: 7200, stage: 'Qualified', email: 'harry@retailpro.com', notes: 'Strong buying signals.' },
    { id: 4, name: 'Iris Chan', company: 'FinTrack', value: 18000, stage: 'Proposal', email: 'iris@fintrack.com', notes: 'Proposal sent.' },
    { id: 5, name: 'Jake Wilson', company: 'BuildRight', value: 5400, stage: 'New', email: 'jake@buildright.com', notes: 'Inbound lead.' },
    { id: 6, name: 'Karen Scott', company: 'MediCare', value: 22000, stage: 'Closed Won', email: 'karen@medicare.com', notes: 'Contract signed!' },
  ],
  contacts: [
    { id: 1, name: 'Alice Johnson', title: 'CEO', company: 'Acme Corp', email: 'alice@acme.com', phone: '555-0101' },
    { id: 2, name: 'Tom Parker', title: 'CTO', company: 'Acme Corp', email: 'tom@acme.com', phone: '555-0110' },
    { id: 3, name: 'Bob Smith', title: 'Founder', company: 'TechStart Inc', email: 'bob@techstart.io', phone: '555-0102' },
    { id: 4, name: 'Lisa Green', title: 'VP Sales', company: 'MegaCorp', email: 'lisa@megacorp.com', phone: '555-0111' },
    { id: 5, name: 'David Lee', title: 'Procurement', company: 'MegaCorp', email: 'david@megacorp.com', phone: '555-0104' },
  ],
  tasks: [
    { id: 1, title: 'Follow up with Alice', relatedTo: 'Alice Johnson', dueDate: '2026-04-12', priority: 'High', status: 'pending' },
    { id: 2, title: 'Send proposal to Iris', relatedTo: 'Iris Chan', dueDate: '2026-04-10', priority: 'High', status: 'pending' },
    { id: 3, title: 'Schedule demo for Carol', relatedTo: 'Carol White', dueDate: '2026-04-15', priority: 'Medium', status: 'pending' },
    { id: 4, title: 'Contract renewal call - Eva', relatedTo: 'Eva Martinez', dueDate: '2026-04-20', priority: 'Medium', status: 'pending' },
    { id: 5, title: 'Update MegaCorp account info', relatedTo: 'David Lee', dueDate: '2026-04-08', priority: 'Low', status: 'done' },
  ],
};

function loadData(key) {
  const raw = localStorage.getItem(STORAGE_KEYS[key]);
  if (raw) return JSON.parse(raw);
  // seed with demo data on first load
  saveData(key, DEMO_DATA[key]);
  return DEMO_DATA[key];
}

function saveData(key, data) {
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
}

function nextId(arr) {
  return arr.length > 0 ? Math.max(...arr.map(i => i.id)) + 1 : 1;
}
