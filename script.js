
// DOM Elements
const expenseForm = document.getElementById('expense-form');
const transactionForm = document.getElementById('transaction-form');
const tableBody = document.getElementById('expense-table-body');
const personSummary = document.getElementById('person-summary');
const totalMonthly = document.getElementById('total-monthly');
const repairStatus = document.getElementById('repair-status');
const finalBalances = document.getElementById('final-balances');
const categoryChartCtx = document.getElementById('categoryChart').getContext('2d');
const filterPerson = document.getElementById('filter-person');
const filterCategory = document.getElementById('filter-category');
const filterMonth = document.getElementById('filter-month');
const applyFiltersBtn = document.getElementById('apply-filters');
const exportCsvBtn = document.getElementById('export-csv');
const downloadPdfBtn = document.getElementById('download-pdf');
const giverSelect = document.getElementById('giver');
const receiverSelect = document.getElementById('receiver');

let expenses = [
  { person: 'John', category: 'Groceries', amount: 3000, date: '2025-03-01', description: 'Monthly shopping', repair: false },
  { person: 'Jane', category: 'Rent / Mortgage', amount: 15000, date: '2025-03-01', description: 'House Rent', repair: false },
  { person: 'John', category: 'Electricity Bill', amount: 1200, date: '2025-03-05', description: 'Power bill', repair: false },
  { person: 'Jane', category: 'House Maintenance & Repairs', amount: 5000, date: '2025-03-10', description: 'Plumbing fix', repair: true }
];

let transactions = [];
let chart;

// Render Table
function renderTable(filtered = expenses) {
  tableBody.innerHTML = '';
  filtered.forEach((exp, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${exp.person}</td><td>${exp.category}</td><td>₹${exp.amount}</td><td>${exp.date}</td><td>${exp.description}</td><td>${exp.repair ? 'Yes' : 'No'}</td>
    <td><button class="delete-btn" onclick="deleteExpense(${index})">Delete</button></td>`;
    tableBody.appendChild(row);
  });
}

// Render Person Summary & Final Balances
function renderSummary(filtered = expenses) {
  const personTotals = {};
  let total = 0;
  let repairFlag = false;
  filtered.forEach(exp => {
    if (!personTotals[exp.person]) personTotals[exp.person] = 0;
    personTotals[exp.person] += exp.amount;
    total += exp.amount;
    if (exp.repair) repairFlag = true;
  });

  personSummary.innerHTML = '';
  totalMonthly.innerHTML = `Total Monthly Expenses: ₹${total}`;
  repairStatus.innerHTML = repairFlag ? "Repairs or Big Purchases: Yes" : "Repairs or Big Purchases: No";

  for (const person in personTotals) {
    const div = document.createElement('div');
    div.textContent = `${person}: ₹${personTotals[person]}`;
    personSummary.appendChild(div);
  }

  // Calculate balances including transactions
  const balances = { ...personTotals };
  transactions.forEach(txn => {
    if (!balances[txn.giver]) balances[txn.giver] = 0;
    if (!balances[txn.receiver]) balances[txn.receiver] = 0;
    balances[txn.giver] -= txn.amount;
    balances[txn.receiver] += txn.amount;
  });

  finalBalances.innerHTML = '<h3>Final Balances:</h3>';
  for (const person in balances) {
    const div = document.createElement('div');
    div.textContent = `${person}: ₹${balances[person]}`;
    finalBalances.appendChild(div);
  }
}

// Render Chart
function renderChart(filtered = expenses) {
  const categoryTotals = {};
  filtered.forEach(exp => {
    if (!categoryTotals[exp.category]) categoryTotals[exp.category] = 0;
    categoryTotals[exp.category] += exp.amount;
  });
  if (chart) chart.destroy();
  chart = new Chart(categoryChartCtx, {
    type: 'pie',
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#FF9800']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// Populate Filters & Transaction Dropdowns
function populateFilters() {
  let persons = [...new Set(expenses.map(e => e.person))];
  filterPerson.innerHTML = '<option value="">All Persons</option>';
  giverSelect.innerHTML = '<option value="">Select Giver</option>';
  receiverSelect.innerHTML = '<option value="">Select Receiver</option>';
  persons.forEach(p => {
    filterPerson.innerHTML += `<option value="${p}">${p}</option>`;
    giverSelect.innerHTML += `<option value="${p}">${p}</option>`;
    receiverSelect.innerHTML += `<option value="${p}">${p}</option>`;
  });

  let categories = [...new Set(expenses.map(e => e.category))];
  filterCategory.innerHTML = '<option value="">All Categories</option>';
  categories.forEach(c => filterCategory.innerHTML += `<option value="${c}">${c}</option>`);
}

// Apply Filters
applyFiltersBtn.addEventListener('click', () => {
  let monthVal = filterMonth.value;
  let filtered = expenses.filter(exp => {
    let expenseMonth = exp.date.substring(0,7);
    return (!filterPerson.value || exp.person === filterPerson.value) &&
           (!filterCategory.value || exp.category === filterCategory.value) &&
           (!monthVal || expenseMonth === monthVal);
  });
  renderTable(filtered);
  renderSummary(filtered);
  renderChart(filtered);
});

// Delete Expense
function deleteExpense(index) {
  expenses.splice(index, 1);
  populateFilters();
  renderTable();
  renderSummary();
  renderChart();
}

// Export CSV
exportCsvBtn.addEventListener('click', () => {
  let csv = "Person,Category,Amount,Date,Description,Repair\n";
  expenses.forEach(exp => {
    csv += `${exp.person},${exp.category},${exp.amount},${exp.date},${exp.description},${exp.repair ? 'Yes' : 'No'}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "expenses.csv";
  link.click();
});

// Download PDF
downloadPdfBtn.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Home Expenses Monthly Report", 20, 20);
  doc.text(totalMonthly.textContent, 20, 35);
  doc.text(repairStatus.textContent, 20, 45);
  doc.text("Person-wise Summary:", 20, 60);

  let y = 70;
  personSummary.querySelectorAll('div').forEach(div => {
    doc.text(div.textContent, 25, y);
    y += 10;
  });

  doc.text("Final Balances:", 20, y + 10);
  y += 20;
  finalBalances.querySelectorAll('div').forEach(div => {
    doc.text(div.textContent, 25, y);
    y += 10;
  });

  doc.save("Monthly-Expenses-Report.pdf");
});

// Add Expense
expenseForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newExpense = {
    person: document.getElementById('person').value,
    category: document.getElementById('category').value,
    amount: parseFloat(document.getElementById('amount').value),
    date: document.getElementById('date').value,
    description: document.getElementById('description').value,
    repair: document.getElementById('repair-check').checked
  };
  expenses.push(newExpense);
  populateFilters();
  renderTable();
  renderSummary();
  renderChart();
  expenseForm.reset();
});

// Add Transaction
transactionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const giver = giverSelect.value;
  const receiver = receiverSelect.value;
  const amount = parseFloat(document.getElementById('transaction-amount').value);
  if (giver && receiver && amount > 0 && giver !== receiver) {
    transactions.push({ giver, receiver, amount });
    renderSummary();
    transactionForm.reset();
  } else {
    alert("Invalid Transaction. Check giver/receiver/amount!");
  }
});

populateFilters();
renderTable();
renderSummary();
renderChart();
