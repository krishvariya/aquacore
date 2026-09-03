let chartInstance = null;

function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

function setBar(id, val, max) {
    let p = (val / max) * 100;
    if(p > 100) p = 100;
    if(p < 0) p = 0;
    const el = document.getElementById(id);
    if(el) el.style.width = p + '%';
}

async function fetchLatestData() {
    try {
        const response = await fetch('/api/data/latest');
        const data = await response.json();
        
        if(Object.keys(data).length > 0) {
            // System top cards
            if(document.getElementById('sys_pump')) document.getElementById('sys_pump').textContent = data.Pump_current.toFixed(1);
            if(document.getElementById('sys_tank')) document.getElementById('sys_tank').textContent = data.Tank_level.toFixed(0);
            if(document.getElementById('sys_runtime')) document.getElementById('sys_runtime').textContent = data.Filter_runtime.toFixed(1);
            if(document.getElementById('sys_vol')) document.getElementById('sys_vol').textContent = data.Water_volume_processed.toFixed(0);

            // Inputs
            document.getElementById('curr_ph_in').textContent = data.pH_in.toFixed(1);
            setBar('b_ph_in', data.pH_in, 14);
            
            document.getElementById('curr_tds_in').textContent = data.TDS_in.toFixed(0);
            setBar('b_tds_in', data.TDS_in, 1000);
            
            document.getElementById('curr_turb_in').textContent = data.Turbidity_in.toFixed(1);
            setBar('b_turb_in', data.Turbidity_in, 50);
            
            document.getElementById('curr_temp_in').textContent = data.Temperature_in.toFixed(1);
            setBar('b_temp_in', data.Temperature_in, 50);
            
            document.getElementById('curr_flow_in').textContent = data.Flow_in.toFixed(0);
            setBar('b_flow_in', data.Flow_in, 150);

            // Outputs
            document.getElementById('curr_ph_out').textContent = data.pH_out.toFixed(1);
            setBar('b_ph_out', data.pH_out, 14);
            
            document.getElementById('curr_tds_out').textContent = data.TDS_out.toFixed(0);
            setBar('b_tds_out', data.TDS_out, 1000);
            
            document.getElementById('curr_turb_out').textContent = data.Turbidity_out.toFixed(1);
            setBar('b_turb_out', data.Turbidity_out, 50);
            
            document.getElementById('curr_temp_out').textContent = data.Temperature_out.toFixed(1);
            setBar('b_temp_out', data.Temperature_out, 50);
            
            document.getElementById('curr_flow_out').textContent = data.Flow_out.toFixed(0);
            setBar('b_flow_out', data.Flow_out, 150);
        }
    } catch (e) {
        console.error('Error fetching latest data:', e);
    }
}

let tdsChartInstance = null;
let flowChartInstance = null;

async function fetchHistoryData() {
    try {
        const response = await fetch('/api/data/history');
        const data = await response.json();
        
        data.reverse(); // chronological order
        const labels = data.map(d => {
            const date = new Date(d.timestamp);
            return `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
        });
        const tdsIn = data.map(d => d.TDS_in);
        const tdsOut = data.map(d => d.TDS_out);
        
        const flowIn = data.map(d => d.Flow_in);
        const flowOut = data.map(d => d.Flow_out);

        Chart.defaults.font.family = "'Inter', sans-serif";

        // --- TDS CHART (Line) ---
        const ctxTds = document.getElementById('tdsChart');
        if(!ctxTds) return;
        if (tdsChartInstance) tdsChartInstance.destroy();
        
        tdsChartInstance = new Chart(ctxTds.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'TDS IN',
                        data: tdsIn,
                        borderColor: '#f87171',
                        backgroundColor: 'rgba(248, 113, 113, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'TDS OUT',
                        data: tdsOut,
                        borderColor: '#34d399',
                        backgroundColor: 'rgba(52, 211, 153, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                color: '#6b7280',
                scales: {
                    x: { ticks: { color: '#9ca3af' }, grid: { display: false } },
                    y: { beginAtZero: true, ticks: { color: '#9ca3af' }, grid: { color: '#f3f4f6', borderDash: [5, 5] } }
                },
                plugins: { legend: { labels: { color: '#4b5563', font: { weight: '600' } }, position: 'top', align: 'end' } }
            }
        });

        // --- FLOW CHART (Bar) ---
        const ctxFlow = document.getElementById('flowChart');
        if(!ctxFlow) return;
        if (flowChartInstance) flowChartInstance.destroy();
        
        flowChartInstance = new Chart(ctxFlow.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Flow IN',
                        data: flowIn,
                        backgroundColor: '#60a5fa',
                        borderRadius: 4,
                        barPercentage: 0.6
                    },
                    {
                        label: 'Flow OUT',
                        data: flowOut,
                        backgroundColor: '#818cf8',
                        borderRadius: 4,
                        barPercentage: 0.6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                color: '#6b7280',
                scales: {
                    x: { ticks: { color: '#9ca3af' }, grid: { display: false } },
                    y: { beginAtZero: true, ticks: { color: '#9ca3af' }, grid: { color: '#f3f4f6', borderDash: [5, 5] } }
                },
                plugins: { legend: { labels: { color: '#4b5563', font: { weight: '600' } }, position: 'top', align: 'end' } }
            }
        });

    } catch (e) {
        console.error('Error fetching history:', e);
    }
}

document.getElementById('predictForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        pH_in: document.getElementById('p_ph_in').value,
        TDS_in: document.getElementById('p_tds_in').value,
        Turbidity_in: document.getElementById('p_turb_in').value,
        Temperature_in: document.getElementById('p_temp_in').value,
        Flow_in: document.getElementById('p_flow_in').value
    };

    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const resData = await response.json();
        
        document.getElementById('pred_ph').textContent = resData.pH_out.toFixed(1);
        document.getElementById('pred_tds').textContent = resData.TDS_out.toFixed(0);
        document.getElementById('pred_turb').textContent = resData.Turbidity_out.toFixed(1);
        document.getElementById('pred_temp').textContent = resData.Temperature_out.toFixed(1);
        document.getElementById('pred_flow').textContent = resData.Flow_out.toFixed(0);
    } catch (e) {
        console.error('Prediction error:', e);
    }
});

// Init
fetchLatestData();
fetchHistoryData();
setInterval(fetchLatestData, 5000); 
setInterval(fetchHistoryData, 15000); 
