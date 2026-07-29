/**
 * Chart.js Analytics Visualization Manager
 * IT Call Center Analytics Web Application
 */

const chartInstances = {};

const STAFF_COLORS = Object.freeze({
  'กรพี': '#f97316',
  'อธิบดี': '#8b5cf6',
  'อัศวิน': '#0ea5e9',
  'ณภัทร': '#10b981'
});

const DEFAULT_PALETTE = ['#ec4899', '#eab308', '#f43f5e', '#84cc16', '#14b8a6', '#64748b'];

export function renderDailyChart(canvasId, data, activeMonthKey) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let labels = [];
  let dataPoints = [];

  if (activeMonthKey && activeMonthKey !== 'all') {
    const [year, month] = activeMonthKey.split('-');
    const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
    labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
    
    const dailyCounts = new Array(daysInMonth).fill(0);
    data.forEach(row => {
      if (row._dayNum) {
        const dayIndex = parseInt(row._dayNum, 10) - 1;
        if (dayIndex >= 0 && dayIndex < daysInMonth) {
          dailyCounts[dayIndex]++;
        }
      }
    });
    dataPoints = dailyCounts;
  } else {
    const dailyCounts = {};
    const sortedForLine = [...data].reverse();
    sortedForLine.forEach(row => {
      if (row.date) dailyCounts[row.date] = (dailyCounts[row.date] || 0) + 1;
    });
    labels = Object.keys(dailyCounts).slice(-30);
    dataPoints = Object.values(dailyCounts).slice(-30);
  }

  if (chartInstances[canvasId]) {
    chartInstances[canvasId].data.labels = labels;
    chartInstances[canvasId].data.datasets[0].data = dataPoints;
    chartInstances[canvasId].update();
  } else {
    chartInstances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'จำนวนปัญหา',
          data: dataPoints,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          borderWidth: 3,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#6366f1',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            padding: 10,
            cornerRadius: 8,
            titleFont: { family: 'Kanit' },
            bodyFont: { family: 'Sarabun' }
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0, color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { ticks: { color: '#64748b' }, grid: { display: false } }
        }
      }
    });
  }
}

export function renderTimeChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const timeCounts = data.reduce((acc, curr) => {
    if (curr._hourKey !== "ไม่ระบุ") {
      acc[curr._hourKey] = (acc[curr._hourKey] || 0) + 1;
    }
    return acc;
  }, {});

  const sortedTimes = Object.keys(timeCounts).sort();
  const timeLabels = sortedTimes;
  const timeData = sortedTimes.map(key => timeCounts[key]);

  if (chartInstances[canvasId]) {
    chartInstances[canvasId].data.labels = timeLabels;
    chartInstances[canvasId].data.datasets[0].data = timeData;
    chartInstances[canvasId].update();
  } else {
    chartInstances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: timeLabels,
        datasets: [{
          label: 'จำนวนปัญหา',
          data: timeData,
          backgroundColor: 'rgba(244, 63, 94, 0.8)',
          hoverBackgroundColor: 'rgba(225, 29, 72, 1)',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeOutBounce' },
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0, color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { ticks: { maxRotation: 45, minRotation: 45, color: '#64748b' }, grid: { display: false } }
        }
      }
    });
  }
}

export function renderDeptChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const deptCounts = data.reduce((acc, curr) => {
    if (curr.dept) acc[curr.dept] = (acc[curr.dept] || 0) + 1;
    return acc;
  }, {});

  const sortedDepts = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const deptLabels = sortedDepts.map(item => item[0]);
  const deptData = sortedDepts.map(item => item[1]);

  if (chartInstances[canvasId]) {
    chartInstances[canvasId].data.labels = deptLabels;
    chartInstances[canvasId].data.datasets[0].data = deptData;
    chartInstances[canvasId].update();
  } else {
    chartInstances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: deptLabels,
        datasets: [{
          label: 'จำนวน Ticket',
          data: deptData,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          hoverBackgroundColor: 'rgba(37, 99, 235, 1)',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeOutBounce' },
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0, color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { ticks: { color: '#64748b' }, grid: { display: false } }
        }
      }
    });
  }
}

export function renderStaffChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const staffCounts = data.reduce((acc, curr) => {
    if (curr.operator) acc[curr.operator] = (acc[curr.operator] || 0) + 1;
    return acc;
  }, {});

  const staffLabels = Object.keys(staffCounts);
  const staffData = Object.values(staffCounts);

  const staffColors = staffLabels.map((name, i) => {
    const n = name.toLowerCase();
    for (const [key, color] of Object.entries(STAFF_COLORS)) {
      if (n.includes(key.toLowerCase())) return color;
    }
    return DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
  });

  if (chartInstances[canvasId]) {
    chartInstances[canvasId].data.labels = staffLabels;
    chartInstances[canvasId].data.datasets[0].data = staffData;
    chartInstances[canvasId].data.datasets[0].backgroundColor = staffColors;
    chartInstances[canvasId].update();
  } else {
    chartInstances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: staffLabels,
        datasets: [{
          data: staffData,
          backgroundColor: staffColors,
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { animateScale: true, animateRotate: true, duration: 1000 },
        plugins: {
          legend: {
            position: 'right',
            labels: { usePointStyle: true, boxWidth: 8, color: '#475569', font: { family: 'Kanit' } }
          }
        },
        cutout: '65%'
      }
    });
  }
}

export function renderAllCharts(data, activeMonthKey) {
  // Render Desktop Canvases
  renderDailyChart('dailyChart', data, activeMonthKey);
  renderTimeChart('timeChart', data);
  renderDeptChart('deptChart', data);
  renderStaffChart('staffChart', data);

  // Render Mobile Canvases
  renderDailyChart('mobileSummaryChart', data, activeMonthKey);
  renderTimeChart('mobileTimeChart', data);
  renderDeptChart('mobileDeptChart', data);
  renderStaffChart('mobileStaffChart', data);
}
