let chartInstance = null;

function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

async function fetchLatestData() {
    try {
        const response = await fetch('/api/data/latest');
        const data = await response.json();
        
        if(Object.keys(data).length > 0) {
            // System
            document.getElementById('sys_p1').textContent = data.Pressure_1.toFixed(1);
            document.getElementById('m_p1').value = data.Pressure_1;
            
            document.getElementById('sys_p2').textContent = data.Pressure_2.toFixed(1);
            document.getElementById('m_p2').value = data.Pressure_2;
            
            document.getElementById('sys_p3').textContent = data.Pressure_3.toFixed(1);
            document.getElementById('m_p3').value = data.Pressure_3;
            
            document.getElementById('sys_pump').textContent = data.Pump_current.toFixed(1);
            document.getElementById('m_pump').value = data.Pump_current;
            
            document.getElementById('sys_tank').textContent = data.Tank_level.toFixed(0);
            document.getElementById('m_tank').value = data.Tank_level;
            
            document.getElementById('sys_valve').textContent = data.Valve_status;
            const vInd = document.getElementById('v_ind');
            if(data.Valve_status === 'OPEN') {
                vInd.className = 'status-indicator status-open';
            } else {
                vInd.className = 'status-indicator status-closed';
            }
            
            document.getElementById('sys_runtime').textContent = data.Filter_runtime.toFixed(1);
            document.getElementById('sys_vol').textContent = data.Water_volume_processed.toFixed(0);

            // Inputs
            document.getElementById('curr_ph_in').textContent = data.pH_in.toFixed(1);
            document.getElementById('m_ph_in').value = data.pH_in;
            document.getElementById('curr_tds_in').textContent = data.TDS_in.toFixed(0);
            document.getElementById('m_tds_in').value = data.TDS_in;
            document.getElementById('curr_turb_in').textContent = data.Turbidity_in.toFixed(1);
            document.getElementById('m_turb_in').value = data.Turbidity_in;
            document.getElementById('curr_temp_in').textContent = data.Temperature_in.toFixed(1);
            document.getElementById('m_temp_in').value = data.Temperature_in;
            document.getElementById('curr_flow_in').textContent = data.Flow_in.toFixed(0);
            document.getElementById('m_flow_in').value = data.Flow_in;

            // Outputs
            document.getElementById('curr_ph_out').textContent = data.pH_out.toFixed(1);
            document.getElementById('m_ph_out').value = data.pH_out;
            document.getElementById('curr_tds_out').textContent = data.TDS_out.toFixed(0);
            document.getElementById('m_tds_out').value = data.TDS_out;
            document.getElementById('curr_turb_out').textContent = data.Turbidity_out.toFixed(1);
            document.getElementById('m_turb_out').value = data.Turbidity_out;
            document.getElementById('curr_temp_out').textContent = data.Temperature_out.toFixed(1);
            document.getElementById('m_temp_out').value = data.Temperature_out;
            document.getElementById('curr_flow_out').textContent = data.Flow_out.toFixed(0);
            document.getElementById('m_flow_out').value = data.Flow_out;
        }
    } catch (e) {
        console.error('Error fetching latest data:', e);
    }
}

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

        const ctx = document.getElementById('historyChart').getContext('2d');
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'TDS IN',
                        data: tdsIn,
                        borderColor: '#ff5252',
                        backgroundColor: 'rgba(255, 82, 82, 0.1)',
                        borderWidth: 2,
                        pointRadius: 2,
                        tension: 0.2,
                        fill: true
                    },
                    {
                        label: 'TDS OUT',
                        data: tdsOut,
                        borderColor: '#00e676',
                        backgroundColor: 'rgba(0, 230, 118, 0.1)',
                        borderWidth: 2,
                        pointRadius: 2,
                        tension: 0.2,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                color: '#eceff1',
                scales: {
                    x: {
                        ticks: { color: '#b0bec5' },
                        grid: { color: '#37474f' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#b0bec5' },
                        grid: { color: '#37474f' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#eceff1', font: { family: 'monospace' } }
                    }
                }
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
setInterval(fetchLatestData, 5000); // refresh every 5s
setInterval(fetchHistoryData, 15000); // refresh chart every 15s
