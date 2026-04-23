// Chart.js Setup
const ctx = document.getElementById('telemetryChart').getContext('2d');

// Create gradients
function getGradient(colorHex) {
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    // Convert hex to rgb for rgba manipulation
    // safe: #00FF88, alert: #FF9F00, danger: #FF2A2A
    let r,g,b;
    if(colorHex === '#00FF88') { r=0; g=255; b=136; }
    else if(colorHex === '#FF9F00') { r=255; g=159; b=0; }
    else if(colorHex === '#FF2A2A') { r=255; g=42; b=42; }
    else { r=0; g=229; b=255; } // default blue
    
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.6)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);
    return gradient;
}

const defaultGradient = getGradient('#00E5FF');

// Chart data arrays
const timeLabels = [];
const h2Data = [];
const maxDataPoints = 40; // Dense data view

// Chart config
const telemetryChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: timeLabels,
        datasets: [{
            label: 'H2 Concentration (%)',
            data: h2Data,
            borderColor: '#00E5FF',
            backgroundColor: defaultGradient,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 10,
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false,
                },
                ticks: {
                    color: '#8B949E',
                    font: {
                        family: 'Outfit',
                        size: 12
                    }
                }
            },
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    color: '#8B949E',
                    maxTicksLimit: 8,
                    font: {
                        family: 'Outfit',
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(10, 12, 16, 0.9)',
                titleFont: { family: 'Outfit', size: 14 },
                bodyFont: { family: 'Inter', size: 13 },
                padding: 10,
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1
            }
        },
        animation: {
            duration: 200, 
            easing: 'linear'
        }
    }
});

// Simulation State
let currentState = 'safe'; 
let h2Value = 0.5;

function forceSimulation(state) {
    currentState = state;
    addLogEvent(`System forced into manual override: ${state.toUpperCase()} protocol engaged`, state);
}

// System Status DOM Elements
const systemStatusCard = document.getElementById('system-status');
const statusText = document.getElementById('status-text');
const statusSubtext = document.getElementById('status-subtext');
const currentH2Display = document.getElementById('current-h2');
const eventLog = document.getElementById('event-log');

function addLogEvent(message, type="info") {
    const time = new Date().toLocaleTimeString();
    const li = document.createElement('li');
    
    // Type styling
    let borderCol = "rgba(255,255,255,0.1)";
    if(type === "safe") borderCol = "#00FF88";
    if(type === "alert") borderCol = "#FF9F00";
    if(type === "danger") borderCol = "#FF2A2A";
    
    li.style.borderLeftColor = borderCol;
    li.innerHTML = `<span>${message}</span> <span class="log-time">${time}</span>`;
    eventLog.prepend(li);
    
    if (eventLog.children.length > 20) {
        eventLog.removeChild(eventLog.lastChild);
    }
}

// Generator
setInterval(() => {
    if (currentState === 'safe') {
        h2Value += (Math.random() - 0.5) * 0.4;
        if (h2Value < 0.1) h2Value = 0.1;
        if (h2Value > 1.9) h2Value = 1.9;
    } else if (currentState === 'alert') {
        h2Value += (Math.random() - 0.4) * 0.6;
        if (h2Value < 2.0) h2Value = 2.0;
        if (h2Value > 3.9) h2Value = 3.9;
    } else if (currentState === 'danger') {
        h2Value += (Math.random() - 0.2) * 1.5; 
        if (h2Value < 4.0) h2Value = 4.0;
        if (h2Value > 9.5) h2Value = 9.5;
    }

    const formattedValue = h2Value.toFixed(2);
    
    const now = new Date();
    timeLabels.push(now.getSeconds() + "s");
    h2Data.push(formattedValue);

    if (timeLabels.length > maxDataPoints) {
        timeLabels.shift();
        h2Data.shift();
    }
    telemetryChart.update();

    currentH2Display.innerText = formattedValue + "%";

    // Logic for State changes
    systemStatusCard.className = 'card glass-card status-card'; 

    if (h2Value < 2.0) {
        systemStatusCard.classList.add('state-safe');
        statusText.innerText = "NORMAL";
        statusSubtext.innerText = "Operating within safe parameters.";
        telemetryChart.data.datasets[0].borderColor = '#00FF88';
        telemetryChart.data.datasets[0].backgroundColor = getGradient('#00FF88');
    } else if (h2Value >= 2.0 && h2Value < 4.0) {
        systemStatusCard.classList.add('state-alert');
        statusText.innerText = "WARNING";
        statusSubtext.innerText = "Elevated H2 levels detected. Check seals.";
        telemetryChart.data.datasets[0].borderColor = '#FF9F00';
        telemetryChart.data.datasets[0].backgroundColor = getGradient('#FF9F00');
        
        if (h2Data[h2Data.length-2] < 2.0) {
            addLogEvent("WARNING: H2 above 2.0% threshold", "alert");
        }
    } else {
        systemStatusCard.classList.add('state-danger');
        statusText.innerText = "DANGER!";
        statusSubtext.innerText = "CRITICAL LEAK! Evacuation protocols recommended.";
        telemetryChart.data.datasets[0].borderColor = '#FF2A2A';
        telemetryChart.data.datasets[0].backgroundColor = getGradient('#FF2A2A');

        if (h2Data[h2Data.length-2] < 4.0) {
            addLogEvent("CRITICAL ALARM: H2 Exceeds 4.0% LEL", "danger");
        }
    }

}, 1000);

addLogEvent("System initialized. TCN model active.", "safe");

// Search
const searchInput = document.getElementById('search-paper');
const tableRows = document.querySelectorAll('#literature-table tbody tr');

searchInput.addEventListener('keyup', function(e) {
    const term = e.target.value.toLowerCase();
    tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if(text.includes(term)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});
