let chartInstance = null;

async function fetchLatestData() {
    try {
        const response = await fetch('/api/data/latest');
        const data = await response.json();
        
        if(Object.keys(data).length > 0) {
            document.getElementById('sys_p1').textContent = data.Pressure_1.toFixed(2);
            document.getElementById('sys_p2').textContent = data.Pressure_2.toFixed(2);
            document.getElementById('sys_p3').textContent = data.Pressure_3.toFixed(2);
            
            document.getElementById('sys_pump').textContent = data.Pump_current.toFixed(2);
            document.getElementById('sys_tank').textContent = data.Tank_level.toFixed(2);
            document.getElementById('sys_valve').textContent = data.Valve_status;
            
            document.getElementById('sys_runtime').textContent = data.Filter_runtime.toFixed(1);
            document.getElementById('sys_vol').textContent = data.Water_volume_processed.toFixed(0);

            document.getElementById('curr_ph_in').textContent = data.pH_in.toFixed(2);
            document.getElementById('curr_tds_in').textContent = data.TDS_in.toFixed(2);
            document.getElementById('curr_turb_in').textContent = data.Turbidity_in.toFixed(2);
            document.getElementById('curr_temp_in').textContent = data.Temperature_in.toFixed(2);
            document.getElementById('curr_flow_in').textContent = data.Flow_in.toFixed(2);

            document.getElementById('curr_ph_out').textContent = data.pH_out.toFixed(2);
            document.getElementById('curr_tds_out').textContent = data.TDS_out.toFixed(2);
            document.getElementById('curr_turb_out').textContent = data.Turbidity_out.toFixed(2);
            document.getElementById('curr_temp_out').textContent = data.Temperature_out.toFixed(2);
            document.getElementById('curr_flow_out').textContent = data.Flow_out.toFixed(2);
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
            return `${date.getHours()}:${date.getMinutes()}`;
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
                        label: 'TDS In',
                        data: tdsIn,
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1
                    },
                    {
                        label: 'TDS Out',
                        data: tdsOut,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
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
        
        document.getElementById('pred_ph').textContent = resData.pH_out;
        document.getElementById('pred_tds').textContent = resData.TDS_out;
        document.getElementById('pred_turb').textContent = resData.Turbidity_out;
        document.getElementById('pred_temp').textContent = resData.Temperature_out;
        document.getElementById('pred_flow').textContent = resData.Flow_out;
    } catch (e) {
        console.error('Prediction error:', e);
    }
});

// Init
fetchLatestData();
fetchHistoryData();
setInterval(fetchLatestData, 10000); // refresh every 10s
