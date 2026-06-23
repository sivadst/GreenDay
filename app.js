
// Built for hackathon excellence (Interactive visual cues, gamified states, and demo mode)

// Global State
let state = {
  userName: 'Eco Hero',
  hasCalculated: false,
  baseline: {
    transport: 0,
    energy: 0,
    diet: 0,
    consumption: 0,
    total: 0
  },
  saved: 0.0, // Cumulative logged savings in kg CO2e
  pledgedHabits: [], // Array of habit IDs
  logHistory: [], // Array of logged activities
  historicalData: {
    labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Current'],
    actual: [0, 0, 0, 0, 0, 0],
    target: [166.7, 166.7, 166.7, 166.7, 166.7, 166.7] // IPCC monthly target (2000kg / 12)
  }
};

// Chart instances
let progressChartInstance = null;
let distributionChartInstance = null;

// On Page Load
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  loadStateFromLocalStorage();
  setupNavigation();
  setupCalculator();
  setupLogger();
  setupHabits();
  setupDemoMode();
  updateUI();

  // Show calculator immediately if no profile exists
  if (!state.hasCalculated) {
    showCalculatorModal();
  }
}

// -------------------------------------------------------------
// LOCAL STORAGE MANAGEMENT
// -------------------------------------------------------------
function saveStateToLocalStorage() {
  localStorage.setItem('ecostep_state', JSON.stringify(state));
}

function loadStateFromLocalStorage() {
  const savedState = localStorage.getItem('ecostep_state');
  if (savedState) {
    try {
      state = JSON.parse(savedState);
    } catch (e) {
      console.error('Error loading state from localStorage', e);
    }
  }
}

// -------------------------------------------------------------
// NAVIGATION & TABS
// -------------------------------------------------------------
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabs = document.querySelectorAll('.tab-content');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = item.getAttribute('data-tab');
      if (!targetTab) return;

      // Update Navigation styling
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Update Tab visibility
      tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.id === `tab-${targetTab}`) {
          tab.classList.add('active');
        }
      });

      // Special Tab triggers
      if (targetTab === 'insights') {
        renderDistributionChart();
      }

      // Update charts on window resize safety
      if (progressChartInstance) progressChartInstance.resize();
      if (distributionChartInstance) distributionChartInstance.resize();
    });
  });
}

// -------------------------------------------------------------
// MULTI-STEP CALCULATOR WIZARD
// -------------------------------------------------------------
let currentStep = 1;

function setupCalculator() {
  const modal = document.getElementById('calculator-modal');
  const btnClose = document.getElementById('btn-close-calc');
  const btnPrev = document.getElementById('btn-calc-prev');
  const btnNext = document.getElementById('btn-calc-next');
  const btnRecalc = document.getElementById('btn-recalc');

  btnRecalc.addEventListener('click', () => {
    showCalculatorModal();
  });

  btnClose.addEventListener('click', () => {
    if (state.hasCalculated) {
      hideCalculatorModal();
    } else {
      showToast('Please complete the assessment to estimate your baseline carbon footprint.', 'info');
    }
  });

  btnPrev.addEventListener('click', () => {
    navigateCalculator(-1);
  });

  btnNext.addEventListener('click', () => {
    if (currentStep < 4) {
      navigateCalculator(1);
    } else {
      calculateBaselineAndStart();
    }
  });

  // Diet options selection handler (interactive grids)
  const dietCards = document.querySelectorAll('.option-select-card');
  const hiddenDietInput = document.getElementById('calc-diet-type');

  dietCards.forEach(card => {
    card.addEventListener('click', () => {
      dietCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      hiddenDietInput.value = card.getAttribute('data-value');
    });
  });
}

function showCalculatorModal() {
  currentStep = 1;
  updateCalculatorStepView();
  document.getElementById('calculator-modal').classList.add('active');
}

function hideCalculatorModal() {
  document.getElementById('calculator-modal').classList.remove('active');
}

function navigateCalculator(direction) {
  currentStep += direction;
  updateCalculatorStepView();
}

function updateCalculatorStepView() {
  const steps = document.querySelectorAll('.calc-step');
  const dots = document.querySelectorAll('.step-dot');
  const btnPrev = document.getElementById('btn-calc-prev');
  const btnNext = document.getElementById('btn-calc-next');

  steps.forEach(step => {
    step.classList.remove('active');
    if (parseInt(step.getAttribute('data-step')) === currentStep) {
      step.classList.add('active');
    }
  });

  dots.forEach(dot => {
    const dotStep = parseInt(dot.getAttribute('data-step'));
    dot.classList.remove('active', 'completed');
    if (dotStep === currentStep) {
      dot.classList.add('active');
    } else if (dotStep < currentStep) {
      dot.classList.add('completed');
    }
  });

  // Button visibility styling
  if (currentStep === 1) {
    btnPrev.style.visibility = 'hidden';
  } else {
    btnPrev.style.visibility = 'visible';
  }

  if (currentStep === 4) {
    btnNext.innerHTML = 'Calculate & Start &check;';
    btnNext.style.background = 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)';
  } else {
    btnNext.innerHTML = 'Next step &rarr;';
    btnNext.style.background = 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)';
  }
}

function calculateBaselineAndStart() {
  const userNameInput = document.getElementById('user-name-input').value.trim();
  state.userName = userNameInput || 'Eco Hero';

  // 1. TRANSPORT CALCULATION
  const commuteMode = document.getElementById('calc-commute-mode').value;
  const commuteDistance = parseFloat(document.getElementById('calc-commute-distance').value) || 0;
  const flightFactorMultiplier = parseInt(document.getElementById('calc-flights').value) || 0;

  let transportMonthly = 0;
  if (commuteMode !== 'none') {
    // Distance (weekly) * 52 weeks / 12 months = km per month
    const monthlyDistance = commuteDistance * (52 / 12);
    transportMonthly += monthlyDistance * CARBON_DATA.factors.transport[commuteMode];
  }
  // Short/medium flight estimate (assume 1500km per flight average, divided into 12 months)
  transportMonthly += (flightFactorMultiplier * 1500 * CARBON_DATA.factors.transport.shortFlight) / 12;

  // 2. ENERGY CALCULATION
  const energyBill = parseFloat(document.getElementById('calc-energy-bill').value) || 0;
  const heatingSource = document.getElementById('calc-heating-source').value;
  const householdSize = parseInt(document.getElementById('calc-household-size').value) || 1;

  // Roughly assume bill is split: 60% electricity, 40% heating fuel.
  // Average electricity cost is $0.15/kWh, so kWh = bill * 0.60 / 0.15
  const electricityKwh = (energyBill * 0.60) / 0.15;
  let energyMonthly = electricityKwh * CARBON_DATA.factors.energy.electricityKwh;

  // Heating carbon:
  const heatingRatio = (energyBill * 0.40);
  if (heatingSource === 'electricityKwh') {
    energyMonthly += (heatingRatio / 0.15) * CARBON_DATA.factors.energy.electricityKwh;
  } else if (heatingSource !== 'cleanEnergyKwh') {
    // Assume price per unit: Gas = $1.00/m3, Heating oil = $1.20/Liter
    const unitPrice = heatingSource === 'naturalGasM3' ? 1.00 : 1.20;
    const heatingUnits = heatingRatio / unitPrice;
    energyMonthly += heatingUnits * CARBON_DATA.factors.energy[heatingSource];
  } else {
    // Clean energy
    energyMonthly += (heatingRatio / 0.15) * CARBON_DATA.factors.energy.cleanEnergyKwh;
  }

  // Shared energy cost per household member
  energyMonthly = energyMonthly / householdSize;

  // 3. DIET CALCULATION
  const dietType = document.getElementById('calc-diet-type').value;
  const dietMonthly = CARBON_DATA.factors.diet[dietType] * 30.4;

  // 4. CONSUMPTION CALCULATION
  const shoppingBudget = parseFloat(document.getElementById('calc-shopping-level').value) || 0;
  const recycleHabit = document.getElementById('calc-waste-recycle').value;

  // Shopping carbon: composite multiplier of clothing/electronics mix
  let consumptionMonthly = shoppingBudget * 0.35;

  // Waste recycling adjustment
  if (recycleHabit === 'none') consumptionMonthly += 30;
  if (recycleHabit === 'partial') consumptionMonthly += 10;
  if (recycleHabit === 'full') consumptionMonthly -= 20;
  if (consumptionMonthly < 10) consumptionMonthly = 10; // minimum carbon floor

  // Save baseline state
  state.baseline.transport = parseFloat(transportMonthly.toFixed(1));
  state.baseline.energy = parseFloat(energyMonthly.toFixed(1));
  state.baseline.diet = parseFloat(dietMonthly.toFixed(1));
  state.baseline.consumption = parseFloat(consumptionMonthly.toFixed(1));

  const totalBaseline = transportMonthly + energyMonthly + dietMonthly + consumptionMonthly;
  state.baseline.total = parseFloat(totalBaseline.toFixed(1));

  // Reset logs and savings on recalculation unless they already have logs
  if (state.logHistory.length === 0) {
    state.saved = 0.0;
  }
  state.hasCalculated = true;

  // Seed standard historical data
  state.historicalData.actual = [
    parseFloat((totalBaseline * 1.05).toFixed(1)),
    parseFloat((totalBaseline * 1.02).toFixed(1)),
    parseFloat((totalBaseline * 0.98).toFixed(1)),
    parseFloat((totalBaseline * 0.95).toFixed(1)),
    parseFloat((totalBaseline * 0.92).toFixed(1)),
    parseFloat((totalBaseline - (state.saved || 0)).toFixed(1))
  ];

  saveStateToLocalStorage();
  hideCalculatorModal();
  updateUI();
  showToast(`Baseline calculated successfully, ${state.userName}!`, 'success');
}

// -------------------------------------------------------------
// DALLY LOGGER PANEL
// -------------------------------------------------------------
function setupLogger() {
  const container = document.getElementById('logger-options-list');
  const btnClear = document.getElementById('btn-clear-history');

  btnClear.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your daily tracking history?')) {
      state.logHistory = [];
      state.saved = 0.0;
      saveStateToLocalStorage();
      updateUI();
      showToast('Activity history cleared!', 'info');
    }
  });

  // Dynamically generate action cards
  container.innerHTML = '';
  CARBON_DATA.loggableActions.forEach(action => {
    const card = document.createElement('div');
    card.className = 'log-item-card';
    card.innerHTML = `
      <div class="log-item-icon">${action.icon}</div>
      <div class="log-item-details">
        <h4>${action.name}</h4>
        <p>Saves ${action.co2SavedPerUnit.toFixed(2)} kg CO₂e per ${action.unit}</p>
      </div>
      <div class="log-item-action">
        <input type="number" class="log-input" id="input-${action.id}" placeholder="${action.placeholder}" min="1">
        <button class="btn-log" data-id="${action.id}">&plus;</button>
      </div>
    `;
    container.appendChild(card);
  });

  // Event delegation for logging clicks
  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-log')) {
      const actionId = e.target.getAttribute('data-id');
      logActivity(actionId);
    }
  });
}

function logActivity(actionId) {
  const inputElement = document.getElementById(`input-${actionId}`);
  const quantity = parseFloat(inputElement.value);

  if (isNaN(quantity) || quantity <= 0) {
    showToast('Please enter a valid positive number.', 'info');
    return;
  }

  const action = CARBON_DATA.loggableActions.find(a => a.id === actionId);
  const co2Saved = parseFloat((quantity * action.co2SavedPerUnit).toFixed(2));

  // Log to history
  const logEntry = {
    id: actionId,
    name: action.name,
    category: action.category,
    quantity: quantity,
    unit: action.unit,
    co2Saved: co2Saved,
    date: Date.now()
  };

  state.logHistory.unshift(logEntry); // add to top of list
  state.saved = parseFloat((state.saved + co2Saved).toFixed(2));

  // Clear input
  inputElement.value = '';

  saveStateToLocalStorage();
  updateUI();

  // Celebration UI interaction (toast)
  showToast(`Logged! Saved ${co2Saved} kg CO₂e! 🎉`, 'success');
}

function renderHistoryList() {
  const container = document.getElementById('history-logs-list');
  container.innerHTML = '';

  if (state.logHistory.length === 0) {
    container.innerHTML = `
      <div class="history-empty">
        <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">📝</span>
        <p>No actions logged yet today. Track something above!</p>
      </div>
    `;
    return;
  }

  state.logHistory.forEach(item => {
    const date = new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="history-info">
        <span class="history-icon">${CARBON_DATA.loggableActions.find(a => a.id === item.id)?.icon || '🌿'}</span>
        <div>
          <span class="history-name">${item.name} (${item.quantity} ${item.unit})</span>
          <span class="history-date">${date}</span>
        </div>
      </div>
      <div class="history-impact">-${item.co2Saved} kg</div>
    `;
    container.appendChild(div);
  });
}

// -------------------------------------------------------------
// ACTION PLANNER & PLEDGES
// -------------------------------------------------------------
function setupHabits() {
  const container = document.getElementById('habits-cards-container');
  const filterSelect = document.getElementById('habit-filter-category');

  filterSelect.addEventListener('change', () => {
    renderHabits();
  });

  renderHabits();
}

function renderHabits() {
  const container = document.getElementById('habits-cards-container');
  const filter = document.getElementById('habit-filter-category').value;
  container.innerHTML = '';

  const filteredHabits = CARBON_DATA.habits.filter(habit => {
    return filter === 'all' || habit.category === filter;
  });

  filteredHabits.forEach(habit => {
    const isPledged = state.pledgedHabits.includes(habit.id);
    const card = document.createElement('div');
    card.className = `card glass habit-card ${isPledged ? 'pledged' : ''}`;
    card.innerHTML = `
      <div>
        <div class="habit-header">
          <div class="habit-icon">${habit.icon}</div>
          <span class="habit-badge ${habit.difficulty.toLowerCase()}">${habit.difficulty}</span>
        </div>
        <h4 class="habit-title">${habit.title}</h4>
        <p class="habit-desc" title="${habit.description}">${habit.description}</p>
      </div>
      <div class="habit-footer">
        <div class="habit-saving">${habit.co2SavedPerMonth.toFixed(1)} kg CO₂e/mo</div>
        <button class="btn-pledge ${isPledged ? 'active' : ''}" data-id="${habit.id}">
          ${isPledged ? 'Pledged &check;' : 'Pledge Action'}
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  // Event handler for pledging
  const pledgeButtons = container.querySelectorAll('.btn-pledge');
  pledgeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const habitId = btn.getAttribute('data-id');
      togglePledge(habitId);
    });
  });
}

function togglePledge(habitId) {
  const index = state.pledgedHabits.indexOf(habitId);
  const habit = CARBON_DATA.habits.find(h => h.id === habitId);

  if (index === -1) {
    state.pledgedHabits.push(habitId);
    showToast(`Pledged: ${habit.title}! 🌍`, 'success');
  } else {
    state.pledgedHabits.splice(index, 1);
    showToast(`Removed pledge: ${habit.title}`, 'info');
  }

  saveStateToLocalStorage();
  renderHabits();
  updateUI();
}

function renderDashboardHabits() {
  const container = document.getElementById('dashboard-habits-list');
  container.innerHTML = '';

  if (state.pledgedHabits.length === 0) {
    container.innerHTML = `
      <p style="color: var(--text-muted); text-align: center; padding: 2rem 0; font-size: 0.9rem;">
        No active habits. Visit the Action Planner to pledge changes!
      </p>
    `;
    return;
  }

  state.pledgedHabits.forEach(habitId => {
    const habit = CARBON_DATA.habits.find(h => h.id === habitId);
    if (!habit) return;

    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.justify = 'space-between';
    div.style.alignItems = 'center';
    div.style.padding = '0.75rem 1rem';
    div.style.background = 'rgba(255, 255, 255, 0.02)';
    div.style.border = '1px solid var(--border)';
    div.style.borderRadius = '10px';
    div.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 500;">
        <span>${habit.icon}</span>
        <span>${habit.title}</span>
      </div>
      <span style="font-size: 0.85rem; font-weight: 600; color: var(--primary);">&#9662; ${habit.co2SavedPerMonth.toFixed(0)} kg/mo</span>
    `;
    container.appendChild(div);
  });
}

// -------------------------------------------------------------
// ECO TREE GAMIFICATION ENGINE
// -------------------------------------------------------------
function calculateEcoScore() {
  // Start base
  let score = 10;

  // Scale of baseline size: lower baseline gives better initial score
  if (state.baseline.total > 0) {
    const baselineRatio = CARBON_DATA.averages.us / state.baseline.total; // ratio to avg US footprint
    score += Math.min(20, Math.floor(baselineRatio * 8));
  }

  // Active Pledges
  score += state.pledgedHabits.length * 8;

  // Log history count
  score += Math.min(30, state.logHistory.length * 3);

  // Offset proportion bonus
  if (state.baseline.total > 0) {
    const monthlySaved = state.saved + getMonthlyPledgeSavings();
    const offsetRatio = monthlySaved / (state.baseline.total || 1);
    score += Math.min(25, Math.floor(offsetRatio * 50));
  }

  // Cap
  return Math.min(100, Math.max(1, score));
}

function updateEcoTree(score) {
  const fill = document.getElementById('eco-tree-fill');
  const emoji = document.getElementById('eco-tree-emoji');
  const label = document.getElementById('tree-progress-label');
  const percent = document.getElementById('tree-progress-percent');
  const displayLevel = document.getElementById('display-eco-level');

  fill.style.width = `${score}%`;
  percent.innerText = `${score}%`;

  let treeEmoji = '🌱';
  let stageName = 'Seed Stage';

  if (score >= 80) {
    treeEmoji = '🌴🌲🌳';
    stageName = 'Thriving Forest';
  } else if (score >= 60) {
    treeEmoji = '🌲';
    stageName = 'Mature Pine';
  } else if (score >= 40) {
    treeEmoji = '🌳';
    stageName = 'Eco Oak';
  } else if (score >= 20) {
    treeEmoji = '🌿';
    stageName = 'Sprout Stage';
  }

  emoji.innerText = treeEmoji;
  label.innerText = stageName;
  displayLevel.innerText = stageName;
}

// -------------------------------------------------------------
// ANALYTICS & INSIGHT PANEL
// -------------------------------------------------------------
function getMonthlyPledgeSavings() {
  return state.pledgedHabits.reduce((acc, habitId) => {
    const habit = CARBON_DATA.habits.find(h => h.id === habitId);
    return acc + (habit ? habit.co2SavedPerMonth : 0);
  }, 0);
}

function generateInsights() {
  const container = document.getElementById('insights-text-container');
  container.innerHTML = '';

  const base = state.baseline;

  // Find highest category
  let highestCategory = 'balanced';
  let maxEmission = 0;

  ['transport', 'energy', 'diet', 'consumption'].forEach(cat => {
    if (base[cat] > maxEmission) {
      maxEmission = base[cat];
      highestCategory = cat;
    }
  });

  // Verify if baseline is extremely balanced
  const avg = base.total / 4;
  let isBalanced = true;
  ['transport', 'energy', 'diet', 'consumption'].forEach(cat => {
    if (Math.abs(base[cat] - avg) > (base.total * 0.15)) {
      isBalanced = false;
    }
  });

  if (isBalanced && base.total > 0) {
    highestCategory = 'balanced';
  }

  // Display top priority insight
  const insight = CARBON_DATA.insights[highestCategory];
  const insightBox = document.createElement('div');
  insightBox.className = 'insight-item-box high-priority';
  insightBox.innerHTML = `
    <div class="insight-header">
      <span class="insight-category-badge ${highestCategory}">${highestCategory}</span>
      <span class="insight-title">${insight.title}</span>
    </div>
    <div class="insight-short">${insight.short}</div>
    <div class="insight-desc">${insight.text}</div>
  `;
  container.appendChild(insightBox);

  // Also render dashboard mini advice
  document.getElementById('dash-tip-title').innerText = insight.title;
  document.getElementById('dash-tip-text').innerText = insight.text;

  // Add general helpful insights for other categories if emissions exist
  ['transport', 'energy', 'diet', 'consumption'].forEach(cat => {
    if (cat !== highestCategory && base[cat] > (base.total * 0.2)) {
      const lowInsight = CARBON_DATA.insights[cat];
      const box = document.createElement('div');
      box.className = 'insight-item-box';
      box.innerHTML = `
        <div class="insight-header">
          <span class="insight-category-badge ${cat}">${cat}</span>
          <span class="insight-title">${lowInsight.title}</span>
        </div>
        <div class="insight-short">${lowInsight.short}</div>
        <div class="insight-desc">${lowInsight.text}</div>
      `;
      container.appendChild(box);
    }
  });

  // Render Projection summary metrics
  const monthlyPledgeSavings = getMonthlyPledgeSavings();
  const totalOffset = state.saved + monthlyPledgeSavings;
  const actualMonthly = Math.max(0, base.total - totalOffset);
  const actualAnnualTons = parseFloat(((actualMonthly * 12) / 1000).toFixed(2));

  document.getElementById('projection-annual-co2').innerText = actualAnnualTons;

  const targetAnnualTons = CARBON_DATA.averages.target / 1000; // 2.0 Tons
  const diffPercent = Math.round(((actualAnnualTons - targetAnnualTons) / targetAnnualTons) * 100);
  const projectionLabel = document.getElementById('projection-vs-target');
  const projectionBarFill = document.getElementById('projection-bar-fill');

  if (diffPercent <= 0) {
    projectionLabel.innerText = `Climate Goal Achieved! (${Math.abs(diffPercent)}% below target)`;
    projectionLabel.style.color = 'var(--success)';
  } else {
    projectionLabel.innerText = `${diffPercent}% above IPCC 1.5°C Target`;
    projectionLabel.style.color = 'var(--warning)';
  }

  // Adjust projection progress bar: target is 2.0 tons, so ratio is target / current
  const barRatio = Math.min(100, Math.round((targetAnnualTons / (actualAnnualTons || 1)) * 100));
  projectionBarFill.style.width = `${barRatio}%`;
  projectionBarFill.style.background = diffPercent <= 0 ? 'var(--primary)' : 'var(--warning)';
}

// -------------------------------------------------------------
// CHART RENDERING ENGINE
// -------------------------------------------------------------
function renderCharts() {
  renderProgressChart();
  renderDistributionChart();
}

function renderProgressChart() {
  const ctx = document.getElementById('progressChart')?.getContext('2d');
  if (!ctx) return;

  // Clear previous instance
  if (progressChartInstance) {
    progressChartInstance.destroy();
  }

  // Current Month Actual calculation: baseline total minus logged actions + pledges
  const currentActual = Math.max(0, state.baseline.total - (state.saved + getMonthlyPledgeSavings()));

  // Sync last item in actual list
  state.historicalData.actual[state.historicalData.actual.length - 1] = parseFloat(currentActual.toFixed(1));

  // Determine line style colors
  const primaryGlowColor = 'rgba(16, 185, 129, 1)';
  const secondaryGlowColor = 'rgba(99, 102, 241, 1)';

  progressChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: state.historicalData.labels,
      datasets: [
        {
          label: 'Your Emissions (kg CO₂e/mo)',
          data: state.historicalData.actual,
          borderColor: primaryGlowColor,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointBackgroundColor: primaryGlowColor,
          pointHoverRadius: 7
        },
        {
          label: 'IPCC Climate Target',
          data: state.historicalData.target,
          borderColor: 'rgba(239, 68, 68, 0.65)',
          borderDash: [6, 6],
          fill: false,
          tension: 0,
          borderWidth: 2,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#9ca3af', font: { family: 'Inter', weight: '500' } }
        },
        tooltip: {
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' },
          min: 0
        }
      }
    }
  });
}

function renderDistributionChart() {
  const ctx = document.getElementById('distributionChart')?.getContext('2d');
  if (!ctx) return;

  if (distributionChartInstance) {
    distributionChartInstance.destroy();
  }

  const base = state.baseline;
  const empty = base.total === 0;

  // Chart data
  const dataValues = empty ? [25, 25, 25, 25] : [base.transport, base.energy, base.diet, base.consumption];
  const chartLabels = ['Transport', 'Home Utilities', 'Dietary', 'Consumption'];

  distributionChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: chartLabels,
      datasets: [{
        data: dataValues,
        backgroundColor: [
          '#6366f1', // Indigo
          '#f59e0b', // Orange
          '#10b981', // Emerald
          '#3b82f6'  // Blue
        ],
        borderWidth: 0,
        hoverOffset: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#9ca3af', font: { family: 'Inter' } }
        }
      }
    }
  });
}

// -------------------------------------------------------------
// TOP LEVEL UI UPDATE & SYNC
// -------------------------------------------------------------
function updateUI() {
  // Sync name display
  document.getElementById('display-user-name').innerText = state.userName;
  document.getElementById('user-avatar-initials').innerText = state.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  // Baseline metric
  const baselineVal = state.baseline.total;
  document.getElementById('stat-baseline').innerText = Math.round(baselineVal);

  const baselineCompEl = document.getElementById('stat-baseline-comparison');
  const nationalAverageVal = CARBON_DATA.averages.us / 12; // monthly ~1333

  if (baselineVal > 0) {
    const comparisonPercent = Math.round(((baselineVal - nationalAverageVal) / nationalAverageVal) * 100);
    if (comparisonPercent > 0) {
      baselineCompEl.innerHTML = `<span style="color: var(--danger); font-weight:600;">&uarr; ${comparisonPercent}% above</span> regional average`;
    } else {
      baselineCompEl.innerHTML = `<span style="color: var(--success); font-weight:600;">&darr; ${Math.abs(comparisonPercent)}% below</span> regional average`;
    }
  } else {
    baselineCompEl.innerText = 'Calculating footprint...';
  }

  // Savings metric
  const monthlyPledgeSavings = getMonthlyPledgeSavings();
  const totalOffset = state.saved + monthlyPledgeSavings;
  document.getElementById('stat-saved').innerText = totalOffset.toFixed(1);

  const savedPercentEl = document.getElementById('stat-saved-percent');
  if (baselineVal > 0) {
    const percentOffset = Math.min(100, Math.round((totalOffset / baselineVal) * 100));
    savedPercentEl.innerText = `${percentOffset}% offset of baseline`;
  } else {
    savedPercentEl.innerText = '0% offset of baseline';
  }

  // Eco Score
  const score = calculateEcoScore();
  document.getElementById('stat-score').innerText = score;
  updateEcoTree(score);

  // Score tier label
  const scoreTierEl = document.getElementById('stat-score-tier');
  if (score >= 80) {
    scoreTierEl.innerText = 'Forest Guardian';
    scoreTierEl.style.color = 'var(--primary-light)';
  } else if (score >= 60) {
    scoreTierEl.innerText = 'Carbon Warrior';
    scoreTierEl.style.color = 'var(--info)';
  } else if (score >= 40) {
    scoreTierEl.innerText = 'Green Advocate';
    scoreTierEl.style.color = 'var(--accent-light)';
  } else if (score >= 20) {
    scoreTierEl.innerText = 'Active Sprout';
    scoreTierEl.style.color = 'var(--warning)';
  } else {
    scoreTierEl.innerText = 'Climate Initiate';
    scoreTierEl.style.color = 'var(--text-muted)';
  }

  // Render logs, dashboard habits, insights, and charts
  renderHistoryList();
  renderDashboardHabits();
  generateInsights();
  renderCharts();
}

// -------------------------------------------------------------
// HACKATHON DEMO MODE SIMULATION
// -------------------------------------------------------------
function setupDemoMode() {
  const btnDemo = document.getElementById('btn-demo-mode');

  btnDemo.addEventListener('click', () => {
    // Inject a rich historical simulation state
    state = {
      userName: 'Eco Champion',
      hasCalculated: true,
      baseline: {
        transport: 420.5,
        energy: 280.2,
        diet: 171.1,
        consumption: 110.0,
        total: 981.8
      },
      saved: 124.5,
      pledgedHabits: ['meatless_mondays', 'led_bulb_swap', 'cold_water_wash', 'line_dry_clothes'],
      logHistory: [
        {
          id: 'log_walk_bike',
          name: 'Walk/Bike Commute',
          category: 'transport',
          quantity: 12,
          unit: 'km',
          co2Saved: 2.3,
          date: Date.now() - 3600000 // 1 hour ago
        },
        {
          id: 'log_vegan_meal',
          name: 'Vegan Meal Day',
          category: 'diet',
          quantity: 3,
          unit: 'meals',
          co2Saved: 4.35,
          date: Date.now() - 14400000 // 4 hours ago
        },
        {
          id: 'log_short_shower',
          name: 'Short Shower (<5 min)',
          category: 'energy',
          quantity: 1,
          unit: 'showers',
          co2Saved: 0.4,
          date: Date.now() - 28800000 // 8 hours ago
        },
        {
          id: 'log_transit',
          name: 'Public Transit Ride',
          category: 'transport',
          quantity: 15,
          unit: 'km',
          co2Saved: 1.55,
          date: Date.now() - 86400000 // 1 day ago
        }
      ],
      historicalData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        actual: [1020.5, 960.2, 810.4, 690.8, 510.2, 450.0],
        target: [166.7, 166.7, 166.7, 166.7, 166.7, 166.7]
      }
    };

    saveStateToLocalStorage();
    renderHabits(); // reload filter states
    updateUI();
    showToast('🏆 Demo Mode activated! 1 month of eco-data simulated successfully.', 'success');
  });
}

// -------------------------------------------------------------
// FLOATING TOAST NOTIFICATION UTILITY
// -------------------------------------------------------------
function showToast(message, type = 'success') {
  const container = document.getElementById('notification-area');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = '✔';
  if (type === 'info') icon = 'ℹ';
  if (type === 'danger') icon = '⚠';

  toast.innerHTML = `
    <span>${icon}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  // Auto remove toast
  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}
