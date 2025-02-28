let bills = JSON.parse(localStorage.getItem(getMonthYearKey())) || [];
let expenses = JSON.parse(localStorage.getItem(getMonthYearKey() + '_expenses')) || [];
let incomes = JSON.parse(localStorage.getItem(getMonthYearKey() + '_incomes')) || { paycheck1: 0, paycheck2: 0 };
let investments = JSON.parse(localStorage.getItem(getMonthYearKey() + '_investments')) || { invested1: 0, invested2: 0 };
let savings = JSON.parse(localStorage.getItem(getMonthYearKey() + '_savings')) || { savings1: 0, savings2: 0 };
const daysInMonth = 30; // Approximate for simplicity
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

window.onload = () => {
    try {
        const selectedYear = document.getElementById('selectedYear');
        const selectedMonth = document.getElementById('selectedMonth');
        if (selectedYear && selectedMonth) {
            selectedYear.textContent = currentYear;
            selectedMonth.textContent = new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' });
        } else {
            console.error('Selected year or month span not found');
        }

        populateYearOptions();
        populateMonthOptions();
        renderBills();
        renderExpenses();
        updateIncome();
        updateInvesting();
        updateSavings();
        loadMonthData();
        updateSummaries();

        // Add event listeners for inputs
        ['paycheck1', 'paycheck2', 'invested1', 'invested2', 'savings1', 'savings2', 'billAmount', 'expenseAmount'].forEach(id => {
            const input = document.getElementById(id);
            input.addEventListener('blur', () => {
                formatCurrency(input);
                if (id === 'paycheck1' || id === 'paycheck2') { updateIncome(); saveMonthData(); }
                if (id === 'invested1' || id === 'invested2') { updateInvesting(); saveMonthData(); }
                if (id === 'savings1' || id === 'savings2') { updateSavings(); saveMonthData(); }
                updateSummaries();
            });
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && id !== 'billAmount' && id !== 'expenseAmount') {
                    formatCurrency(input);
                    if (id === 'paycheck1' || id === 'paycheck2') { updateIncome(); saveMonthData(); }
                    if (id === 'invested1' || id === 'invested2') { updateInvesting(); saveMonthData(); }
                    if (id === 'savings1' || id === 'savings2') { updateSavings(); saveMonthData(); }
                    updateSummaries();
                } else if (e.key === 'Enter' && id === 'expenseAmount') {
                    addQuickExpense();
                }
            });
        });

        // Add event listeners for buttons
        document.querySelector('.action-buttons button[aria-label="Save current budget data"]').addEventListener('click', saveMonthData);
        document.querySelector('.action-buttons button[aria-label="Clear all budget data for this month"]').addEventListener('click', clearMonthData);
        document.getElementById('ytdButton').addEventListener('click', toggleYTDSummary);
        document.getElementById('yearButton').addEventListener('click', showYearOptions);
        document.getElementById('monthButton').addEventListener('click', showMonthOptions);
        document.getElementById('importBillsButton').addEventListener('click', showImportBillsPopup);
        document.getElementById('paycheck1').addEventListener('change', () => { updateIncome(); saveMonthData(); updateSummaries(); });
        document.getElementById('paycheck2').addEventListener('change', () => { updateIncome(); saveMonthData(); updateSummaries(); });
        document.getElementById('invested1').addEventListener('change', () => { updateInvesting(); saveMonthData(); updateSummaries(); });
        document.getElementById('invested2').addEventListener('change', () => { updateInvesting(); saveMonthData(); updateSummaries(); });
        document.getElementById('savings1').addEventListener('change', () => { updateSavings(); saveMonthData(); updateSummaries(); });
        document.getElementById('savings2').addEventListener('change', () => { updateSavings(); saveMonthData(); updateSummaries(); });
    } catch (error) {
        console.error('Error on page load:', error);
        alert('An error occurred while loading the app. Please try refreshing the page.');
    }
};

// Helper function to get current or selected month-year key (e.g., "2025-02")
function getMonthYearKey() {
    const month = document.getElementById('selectedMonth').textContent.toLowerCase();
    const year = document.getElementById('selectedYear').textContent;
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthNum = months.indexOf(month) + 1;
    return `${year}-${String(monthNum).padStart(2, '0')}`;
}

// Helper function to get month-year key for any month/year (e.g., "January-2025")
function getMonthYearKeyFor(month, year) {
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthNum = months.indexOf(month.toLowerCase()) + 1;
    return `${year}-${String(monthNum).padStart(2, '0')}`;
}

// Populate year options for the modal (2025, 2026, 2027, 2028, 2029, 2030)
function populateYearOptions() {
    const yearList = document.getElementById('yearList');
    if (!yearList) {
        console.error('Year list element not found');
        return;
    }
    yearList.innerHTML = ''; // Clear existing options
    const years = [2025, 2026, 2027, 2028, 2029, 2030];
    for (const year of years) {
        const li = document.createElement('li');
        li.textContent = year;
        li.onclick = () => {
            document.getElementById('selectedYear').textContent = year;
            document.getElementById('yearOptions').style.display = 'none';
            loadMonthData();
            console.log('Year selected:', year);
        };
        yearList.appendChild(li);
    }
    console.log('Year options populated (2025–2030):', yearList.children);
}

// Populate month options for the modal (January–December, no YTD)
function populateMonthOptions() {
    const monthList = document.getElementById('monthList');
    if (!monthList) {
        console.error('Month list element not found');
        return;
    }
    monthList.innerHTML = ''; // Clear existing options
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    for (const month of months) {
        const li = document.createElement('li');
        li.textContent = month;
        li.onclick = () => {
            document.getElementById('selectedMonth').textContent = month;
            document.getElementById('monthOptions').style.display = 'none';
            loadMonthData();
            console.log('Month selected:', month);
        };
        monthList.appendChild(li);
    }
    console.log('Month options populated (January-December):', monthList.children);
}

// Show year options modal
function showYearOptions(event) {
    event.preventDefault();
    event.stopPropagation();
    const yearOptions = document.getElementById('yearOptions');
    if (yearOptions) {
        yearOptions.style.display = yearOptions.style.display === 'block' ? 'none' : 'block';
        document.getElementById('monthOptions').style.display = 'none';
        document.getElementById('importBillsPopup').style.display = 'none';
        const buttonRect = document.getElementById('yearButton').getBoundingClientRect();
        yearOptions.style.top = `${buttonRect.bottom + window.scrollY}px`;
        yearOptions.style.left = `${buttonRect.left + window.scrollX}px`;
        yearOptions.style.width = `${buttonRect.width}px`;
    } else {
        console.error('Year options modal not found');
    }
}

// Show month options modal
function showMonthOptions(event) {
    event.preventDefault();
    event.stopPropagation();
    const monthOptions = document.getElementById('monthOptions');
    if (monthOptions) {
        monthOptions.style.display = monthOptions.style.display === 'block' ? 'none' : 'block';
        document.getElementById('yearOptions').style.display = 'none';
        document.getElementById('importBillsPopup').style.display = 'none';
        const buttonRect = document.getElementById('monthButton').getBoundingClientRect();
        monthOptions.style.top = `${buttonRect.bottom + window.scrollY}px`;
        monthOptions.style.left = `${buttonRect.left + window.scrollX}px`;
        monthOptions.style.width = `${buttonRect.width}px`;
    } else {
        console.error('Month options modal not found');
    }
}

// Show import bills popup
function showImportBillsPopup() {
    document.getElementById('importBillsPopup').style.display = 'block';
    document.getElementById('importMonth').value = 'january';
    document.getElementById('importYear').value = document.getElementById('selectedYear').textContent;
    document.getElementById('yearOptions').style.display = 'none';
    document.getElementById('monthOptions').style.display = 'none';
}

// Hide import bills popup
function hideImportBillsPopup() {
    document.getElementById('importBillsPopup').style.display = 'none';
}

// Close modals when clicking outside
document.addEventListener('click', (event) => {
    const yearOptions = document.getElementById('yearOptions');
    const monthOptions = document.getElementById('monthOptions');
    const yearButton = document.getElementById('yearButton');
    const monthButton = document.getElementById('monthButton');
    const importBillsPopup = document.getElementById('importBillsPopup');
    const importBillsButton = document.getElementById('importBillsButton');
    if (!yearButton.contains(event.target) && !yearOptions.contains(event.target)) {
        yearOptions.style.display = 'none';
    }
    if (!monthButton.contains(event.target) && !monthOptions.contains(event.target)) {
        monthOptions.style.display = 'none';
    }
    if (!importBillsButton.contains(event.target) && !importBillsPopup.contains(event.target)) {
        hideImportBillsPopup();
    }
    if (!document.getElementById('quickExpensePopup').contains(event.target) && !document.getElementById('quickExpense').contains(event.target)) {
        hideQuickExpensePopup();
    }
});

// Load monthly data
function loadMonthData() {
    try {
        const monthKey = getMonthYearKey();
        bills = JSON.parse(localStorage.getItem(monthKey)) || [];
        expenses = JSON.parse(localStorage.getItem(monthKey + '_expenses')) || [];
        incomes = JSON.parse(localStorage.getItem(monthKey + '_incomes')) || { paycheck1: 0, paycheck2: 0 };
        investments = JSON.parse(localStorage.getItem(monthKey + '_investments')) || { invested1: 0, invested2: 0 };
        savings = JSON.parse(localStorage.getItem(monthKey + '_savings')) || { savings1: 0, savings2: 0 };
        
        renderBills();
        renderExpenses();
        document.getElementById('paycheck1').value = incomes.paycheck1 ? `$${incomes.paycheck1.toFixed(2)}` : '';
        document.getElementById('paycheck2').value = incomes.paycheck2 ? `$${incomes.paycheck2.toFixed(2)}` : '';
        document.getElementById('invested1').value = investments.invested1 ? `$${investments.invested1.toFixed(2)}` : '';
        document.getElementById('invested2').value = investments.invested2 ? `$${investments.invested2.toFixed(2)}` : '';
        document.getElementById('savings1').value = savings.savings1 ? `$${savings.savings1.toFixed(2)}` : '';
        document.getElementById('savings2').value = savings.savings2 ? `$${savings.savings2.toFixed(2)}` : '';
        document.getElementById('ytdSummary').style.display = 'none';
        updateSummaries();
    } catch (error) {
        console.error('Error loading month data:', error);
        alert('An error occurred while loading month data.');
    }
}

// Toggle YTD summary visibility
function toggleYTDSummary() {
    try {
        const ytdSummary = document.getElementById('ytdSummary');
        if (!ytdSummary) {
            console.error('YTD summary element not found');
            return;
        }

        if (ytdSummary.style.display === 'block') {
            ytdSummary.style.display = 'none';
        } else {
            const year = document.getElementById('selectedYear').textContent;
            updateYTDSummary(year);
            ytdSummary.style.display = 'block';
        }
    } catch (error) {
        console.error('Error toggling YTD summary:', error);
        alert('An error occurred while toggling the YTD summary.');
    }
}

// Update YTD summary
function updateYTDSummary(year) {
    try {
        let ytdIncome = 0, ytdInvested = 0, ytdSaved = 0;
        const maxMonth = (year == now.getFullYear()) ? now.getMonth() + 1 : 12; // Current year up to present month, others all 12
        for (let month = 1; month <= maxMonth; month++) {
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;
            const monthIncomes = JSON.parse(localStorage.getItem(monthKey + '_incomes')) || { paycheck1: 0, paycheck2: 0 };
            const monthInvestments = JSON.parse(localStorage.getItem(monthKey + '_investments')) || { invested1: 0, invested2: 0 };
            const monthSavings = JSON.parse(localStorage.getItem(monthKey + '_savings')) || { savings1: 0, savings2: 0 };
            
            ytdIncome += monthIncomes.paycheck1 + monthIncomes.paycheck2;
            ytdInvested += monthInvestments.invested1 + monthInvestments.invested2;
            ytdSaved += monthSavings.savings1 + monthSavings.savings2;
        }

        const ytdYear = document.getElementById('ytdYear');
        const ytdTotalIncome = document.getElementById('ytdTotalIncome');
        const ytdTotalInvested = document.getElementById('ytdTotalInvested');
        const ytdTotalSavings = document.getElementById('ytdTotalSavings');
        if (ytdYear && ytdTotalIncome && ytdTotalInvested && ytdTotalSavings) {
            ytdYear.textContent = year;
            ytdTotalIncome.textContent = `$${ytdIncome.toFixed(2)}`;
            ytdTotalInvested.textContent = `$${ytdInvested.toFixed(2)}`;
            ytdTotalSavings.textContent = `$${ytdSaved.toFixed(2)}`;
        } else {
            console.error('YTD summary elements not found');
        }
    } catch (error) {
        console.error('Error updating YTD summary:', error);
        alert('An error occurred while calculating the YTD summary.');
    }
}

// Save data for the selected month and year
function saveMonthData() {
    const monthKey = getMonthYearKey();
    localStorage.setItem(monthKey, JSON.stringify(bills));
    localStorage.setItem(monthKey + '_expenses', JSON.stringify(expenses));
    localStorage.setItem(monthKey + '_incomes', JSON.stringify(incomes));
    localStorage.setItem(monthKey + '_investments', JSON.stringify(investments));
    localStorage.setItem(monthKey + '_savings', JSON.stringify(savings));
    updateYTDSummary(document.getElementById('selectedYear').textContent);
    // Removed alert to avoid popup on every input change
}

// Clear all data for the selected month and year
function clearMonthData() {
    const monthKey = getMonthYearKey();
    localStorage.removeItem(monthKey);
    localStorage.removeItem(monthKey + '_expenses');
    localStorage.removeItem(monthKey + '_incomes');
    localStorage.removeItem(monthKey + '_investments');
    localStorage.removeItem(monthKey + '_savings');
    
    bills = [];
    expenses = [];
    incomes = { paycheck1: 0, paycheck2: 0 };
    investments = { invested1: 0, invested2: 0 };
    savings = { savings1: 0, savings2: 0 };
    
    renderBills();
    renderExpenses();
    document.getElementById('paycheck1').value = '';
    document.getElementById('paycheck2').value = '';
    document.getElementById('invested1').value = '';
    document.getElementById('invested2').value = '';
    document.getElementById('savings1').value = '';
    document.getElementById('savings2').value = '';
    updateSummaries();
    document.getElementById('ytdSummary').style.display = 'none';
    alert('Data cleared for the selected month and year!');
    hideQuickExpensePopup();
    hideImportBillsPopup();
}

// Format currency
function formatCurrency(input) {
    let value = parseFloat(input.value.replace('$', '').trim()) || 0;
    input.value = `$${value.toFixed(2)}`;
    input.dispatchEvent(new Event('change')); // Trigger change event to update summaries
}

function updateIncome() {
    let paycheck1Value = document.getElementById('paycheck1').value;
    let paycheck2Value = document.getElementById('paycheck2').value;
    incomes.paycheck1 = parseFloat(paycheck1Value.replace('$', '').trim()) || 0;
    incomes.paycheck2 = parseFloat(paycheck2Value.replace('$', '').trim()) || 0;
    localStorage.setItem(getMonthYearKey() + '_incomes', JSON.stringify(incomes));
    updateSummaries();
}

function updateInvesting() {
    let invested1Value = document.getElementById('invested1').value;
    let invested2Value = document.getElementById('invested2').value;
    investments.invested1 = parseFloat(invested1Value.replace('$', '').trim()) || 0;
    investments.invested2 = parseFloat(invested2Value.replace('$', '').trim()) || 0;
    localStorage.setItem(getMonthYearKey() + '_investments', JSON.stringify(investments));
    updateSummaries();
}

function updateSavings() {
    let savings1Value = document.getElementById('savings1').value;
    let savings2Value = document.getElementById('savings2').value;
    savings.savings1 = parseFloat(savings1Value.replace('$', '').trim()) || 0;
    savings.savings2 = parseFloat(savings2Value.replace('$', '').trim()) || 0;
    localStorage.setItem(getMonthYearKey() + '_savings', JSON.stringify(savings));
    updateSummaries();
}

function addBill() {
    const billName = document.getElementById('billName').value.trim();
    let billAmount = document.getElementById('billAmount').value;
    billAmount = parseFloat(billAmount.replace('$', '').trim()) || 0;

    if (billName && billAmount > 0) {
        if (!bills.some(b => b.name === billName && b.amount === billAmount)) {
            bills.push({ name: billName, amount: billAmount });
        }

        localStorage.setItem(getMonthYearKey(), JSON.stringify(bills));
        renderBills();
        updateSummaries();
        document.getElementById('billName').value = '';
        document.getElementById('billAmount').value = '';
    } else {
        alert('Please enter a valid bill name and amount.');
    }
}

function addBillOnEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addBill();
    }
}

function renderBills() {
    const billList = document.getElementById('billList');
    billList.innerHTML = '';
    let totalBills = 0;

    bills.forEach((bill, index) => {
        const li = document.createElement('li');
        li.className = 'bill-item';
        const billText = document.createElement('span');
        billText.className = 'bill-text';
        billText.textContent = `${bill.name}: $${bill.amount.toFixed(2)}`;
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => {
            bills.splice(index, 1);
            localStorage.setItem(getMonthYearKey(), JSON.stringify(bills));
            renderBills();
            updateSummaries();
        };
        li.appendChild(billText);
        li.appendChild(deleteBtn);
        billList.appendChild(li);
        totalBills += bill.amount;
    });

    document.getElementById('totalBills').textContent = totalBills.toFixed(2);
    document.getElementById('halfBills').textContent = (totalBills / 2).toFixed(2);
}

function showQuickExpensePopup() {
    document.getElementById('quickExpensePopup').style.display = 'block';
    document.getElementById('expenseName').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseApply').value = 'split';
    document.getElementById('importBillsPopup').style.display = 'none';
}

function hideQuickExpensePopup() {
    document.getElementById('quickExpensePopup').style.display = 'none';
}

function addQuickExpense() {
    const name = document.getElementById('expenseName').value.trim();
    let amount = parseFloat(document.getElementById('expenseAmount').value.replace('$', '').trim()) || 0;
    const applyTo = document.getElementById('expenseApply').value;

    if (name && amount > 0) {
        amount = parseFloat(amount.toFixed(2));
        const expense = { name, amount, applyTo };
        expenses.push(expense);
        localStorage.setItem(getMonthYearKey() + '_expenses', JSON.stringify(expenses));
        renderExpenses();
        updateSummaries();
        saveMonthData(); // Save all data after adding expense
        hideQuickExpensePopup();
    } else {
        alert('Please enter a valid expense name and amount.');
    }
}

function renderExpenses() {
    const expenseList = document.getElementById('expenseList');
    expenseList.innerHTML = '';
    let totalExpenses = 0;

    expenses.forEach((expense, index) => {
        const li = document.createElement('li');
        li.className = 'expense-item';
        const expenseText = document.createElement('span');
        expenseText.className = 'expense-text';
        expenseText.textContent = `${expense.name}: $${expense.amount.toFixed(2)} (${expense.applyTo.charAt(0).toUpperCase() + expense.applyTo.slice(1)})`;
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => {
            expenses.splice(index, 1);
            localStorage.setItem(getMonthYearKey() + '_expenses', JSON.stringify(expenses));
            renderExpenses();
            updateSummaries();
            saveMonthData(); // Save after deletion
        };
        li.appendChild(expenseText);
        li.appendChild(deleteBtn);
        expenseList.appendChild(li);
        totalExpenses += expense.amount;
    });

    const totalBills = parseFloat(document.getElementById('totalBills').textContent) || 0;
    document.getElementById('totalBills').textContent = (totalBills + totalExpenses).toFixed(2);
    document.getElementById('halfBills').textContent = ((totalBills + totalExpenses) / 2).toFixed(2);
}

function updateSummaries() {
    const totalBillsBase = bills.reduce((sum, bill) => sum + bill.amount, 0);
    const paycheck1 = incomes.paycheck1 || 0;
    const paycheck2 = incomes.paycheck2 || 0;
    const invested1 = investments.invested1 || 0;
    const invested2 = investments.invested2 || 0;
    const savings1 = savings.savings1 || 0;
    const savings2 = savings.savings2 || 0;

    let expense1 = 0, expense2 = 0;
    expenses.forEach(expense => {
        if (expense.applyTo === 'paycheck1') {
            expense1 += expense.amount;
            expense2 += 0;
        } else if (expense.applyTo === 'paycheck2') {
            expense1 += 0;
            expense2 += expense.amount;
        } else if (expense.applyTo === 'split') {
            expense1 += expense.amount / 2;
            expense2 += expense.amount / 2;
        }
    });

    const totalMonthlyBills = totalBillsBase + expenses.reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('totalBills').textContent = totalMonthlyBills.toFixed(2);
    document.getElementById('halfBills').textContent = (totalMonthlyBills / 2).toFixed(2);

    // Paycheck Cycle 1
    const biWeeklyBills1 = (totalBillsBase / 2) + expense1;
    const totalIncome1 = paycheck1;
    document.getElementById('biWeeklyIncome1').textContent = totalIncome1.toFixed(2);
    document.getElementById('incomePercent1').textContent = totalIncome1 > 0 ? ' (100%)' : '';
    document.getElementById('incomePercent1').style.display = totalIncome1 > 0 ? 'inline' : 'none';

    document.getElementById('biWeeklyBills1').textContent = biWeeklyBills1.toFixed(2);
    document.getElementById('billsPercent1').textContent = totalIncome1 > 0 && biWeeklyBills1 > 0 ? ` (${((biWeeklyBills1 / totalIncome1) * 100).toFixed(1)}%)` : '';
    document.getElementById('billsPercent1').style.display = totalIncome1 > 0 && biWeeklyBills1 > 0 ? 'inline' : 'none';

    document.getElementById('biWeeklyInvested1').textContent = invested1.toFixed(2);
    document.getElementById('investedPercent1').textContent = totalIncome1 > 0 && invested1 > 0 ? ` (${((invested1 / totalIncome1) * 100).toFixed(1)}%)` : '';
    document.getElementById('investedPercent1').style.display = totalIncome1 > 0 && invested1 > 0 ? 'inline' : 'none';

    document.getElementById('biWeeklySavings1').textContent = savings1.toFixed(2);
    document.getElementById('savingsPercent1').textContent = totalIncome1 > 0 && savings1 > 0 ? ` (${((savings1 / totalIncome1) * 100).toFixed(1)}%)` : '';
    document.getElementById('savingsPercent1').style.display = totalIncome1 > 0 && savings1 > 0 ? 'inline' : 'none';

    const net1 = paycheck1 - biWeeklyBills1 - invested1 - savings1;
    document.getElementById('netCycle1').textContent = net1.toFixed(2);
    document.getElementById('netPercent1').textContent = totalIncome1 > 0 && net1 > 0 ? ` (${((net1 / totalIncome1) * 100).toFixed(1)}%)` : '';
    document.getElementById('netPercent1').style.display = totalIncome1 > 0 && net1 > 0 ? 'inline' : 'none';

    // Paycheck Cycle 2
    const biWeeklyBills2 = (totalBillsBase / 2) + expense2;
    const totalIncome2 = paycheck2;
    document.getElementById('biWeeklyIncome2').textContent = totalIncome2.toFixed(2);
    document.getElementById('incomePercent2').textContent = totalIncome2 > 0 ? ' (100%)' : '';
    document.getElementById('incomePercent2').style.display = totalIncome2 > 0 ? 'inline' : 'none';

    document.getElementById('biWeeklyBills2').textContent = biWeeklyBills2.toFixed(2);
    document.getElementById('billsPercent2').textContent = totalIncome2 > 0 && biWeeklyBills2 > 0 ? ` (${((biWeeklyBills2 / totalIncome2) * 100).toFixed(1)}%)` : '';
    document.getElementById('billsPercent2').style.display = totalIncome2 > 0 && biWeeklyBills2 > 0 ? 'inline' : 'none';

    document.getElementById('biWeeklyInvested2').textContent = invested2.toFixed(2);
    document.getElementById('investedPercent2').textContent = totalIncome2 > 0 && invested2 > 0 ? ` (${((invested2 / totalIncome2) * 100).toFixed(1)}%)` : '';
    document.getElementById('investedPercent2').style.display = totalIncome2 > 0 && invested2 > 0 ? 'inline' : 'none';

    document.getElementById('biWeeklySavings2').textContent = savings2.toFixed(2);
    document.getElementById('savingsPercent2').textContent = totalIncome2 > 0 && savings2 > 0 ? ` (${((savings2 / totalIncome2) * 100).toFixed(1)}%)` : '';
    document.getElementById('savingsPercent2').style.display = totalIncome2 > 0 && savings2 > 0 ? 'inline' : 'none';

    const net2 = paycheck2 - biWeeklyBills2 - invested2 - savings2;
    document.getElementById('netCycle2').textContent = net2.toFixed(2);
    document.getElementById('netPercent2').textContent = totalIncome2 > 0 && net2 > 0 ? ` (${((net2 / totalIncome2) * 100).toFixed(1)}%)` : '';
    document.getElementById('netPercent2').style.display = totalIncome2 > 0 && net2 > 0 ? 'inline' : 'none';
}

// Import bills from a selected month/year
function importSelectedBills() {
    const importMonth = document.getElementById('importMonth').value;
    const importYear = parseInt(document.getElementById('importYear').value) || 0;

    if (importYear < 2025 || importYear > 2030) {
        alert('Please enter a year between 2025 and 2030.');
        return;
    }

    const currentMonth = document.getElementById('selectedMonth').textContent.toLowerCase();
    const currentYear = parseInt(document.getElementById('selectedYear').textContent);
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const currentMonthIndex = months.indexOf(currentMonth);
    const importMonthIndex = months.indexOf(importMonth);
    if (importYear > currentYear || (importYear === currentYear && importMonthIndex >= currentMonthIndex)) {
        alert('Cannot import bills from the current or future month/year.');
        return;
    }

    importPreviousMonthBills(importMonth.charAt(0).toUpperCase() + importMonth.slice(1), importYear);
    hideImportBillsPopup();
}

function importPreviousMonthBills(importMonth, importYear) {
    const importMonthKey = getMonthYearKeyFor(importMonth, importYear);
    let previousBills = JSON.parse(localStorage.getItem(importMonthKey)) || [];
    const currentBills = JSON.parse(localStorage.getItem(getMonthYearKey())) || [];
    const importedBills = previousBills.filter(prevBill =>
        !currentBills.some(currBill => currBill.name === prevBill.name && currBill.amount === prevBill.amount)
    );

    if (importedBills.length > 0) {
        importedBills.forEach(bill => {
            if (!bills.some(existingBill => existingBill.name === bill.name && existingBill.amount === bill.amount)) {
                bills.push(bill);
            }
        });
        localStorage.setItem(getMonthYearKey(), JSON.stringify(bills));
        renderBills();
        updateSummaries();
        saveMonthData(); // Save after importing bills
        alert(`Imported ${importedBills.length} bill(s) from ${importMonth} ${importYear}. You can delete any bill if needed.`);
    } else {
        alert(`No new bills to import from ${importMonth} ${importYear}.`);
    }
    return bills;
}

function removeBillByName(billName) {
    const initialLength = bills.length;
    bills = bills.filter(bill => bill.name !== billName);
    if (bills.length < initialLength) {
        localStorage.setItem(getMonthYearKey(), JSON.stringify(bills));
        renderBills();
        updateSummaries();
        saveMonthData(); // Save after removing bill
        alert(`Bill "${billName}" removed from the current month's budget.`);
    } else {
        alert(`Bill "${billName}" not found in the current month's budget.`);
    }
}
