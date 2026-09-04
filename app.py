from flask import Flask, render_template, request, jsonify
import sqlite3
import random
import os
from datetime import datetime, timedelta
import sys
import joblib
import numpy as np

base_dir = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, template_folder=os.path.join(base_dir, 'templates'), static_folder=os.path.join(base_dir, 'static'))

# Load the AI model
model_path = os.path.join(base_dir, 'model.pkl')
ai_model = None
try:
    ai_model = joblib.load(model_path)
    print("Successfully loaded AI model!")
except Exception as e:
    print(f"Warning: Could not load AI model from {model_path}: {e}")

# Use /tmp on Linux (Vercel) to avoid read-only filesystem errors
DB_FILE = '/tmp/water_system.db' if sys.platform != 'win32' else 'water_system.db'

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    
    # Initialize DB lazily to prevent module-level crashes on Vercel
    conn.execute('''
        CREATE TABLE IF NOT EXISTS sensor_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME,
            pH_in REAL, TDS_in REAL, Turbidity_in REAL, Temperature_in REAL, Flow_in REAL,
            pH_out REAL, TDS_out REAL, Turbidity_out REAL, Temperature_out REAL, Flow_out REAL,
            Pressure_1 REAL, Pressure_2 REAL, Pressure_3 REAL,
            Pump_current REAL, Tank_level REAL, Valve_status TEXT,
            Filter_runtime REAL, Water_volume_processed REAL
        )
    ''')
    
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) FROM sensor_data')
    if cur.fetchone()[0] == 0:
        base_time = datetime.now() - timedelta(hours=24)
        for i in range(24):
            t = base_time + timedelta(hours=i)
            conn.execute('''
                INSERT INTO sensor_data (
                    timestamp, pH_in, TDS_in, Turbidity_in, Temperature_in, Flow_in,
                    pH_out, TDS_out, Turbidity_out, Temperature_out, Flow_out,
                    Pressure_1, Pressure_2, Pressure_3, Pump_current, Tank_level, Valve_status,
                    Filter_runtime, Water_volume_processed
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                t.strftime('%Y-%m-%d %H:%M:%S'),
                random.uniform(6.5, 8.5), random.uniform(200, 500), random.uniform(5, 20), random.uniform(20, 35), random.uniform(50, 100),
                random.uniform(6.8, 7.5), random.uniform(50, 100), random.uniform(0.5, 2), random.uniform(20, 35), random.uniform(48, 98),
                random.uniform(1, 3), random.uniform(1, 3), random.uniform(1, 3),
                random.uniform(5, 15), random.uniform(20, 80), random.choice(['OPEN', 'CLOSED']),
                random.uniform(10, 100), random.uniform(1000, 5000)
            ))
        conn.commit()
    
    return conn

@app.route('/ping')
def ping():
    return jsonify({"status": "ok", "db_file": DB_FILE, "platform": sys.platform})

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data/latest')
def latest_data():
    conn = get_db_connection()
    data = conn.execute('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1').fetchone()
    conn.close()
    return jsonify(dict(data) if data else {})

@app.route('/api/data/history')
def history_data():
    conn = get_db_connection()
    data = conn.execute('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 20').fetchall()
    conn.close()
    return jsonify([dict(row) for row in data])

@app.route('/api/predict', methods=['POST'])
def predict():
    req = request.json
    if not req:
        return jsonify({'error': 'Invalid or missing JSON payload'}), 400

    try:
        ph_in = float(req.get('pH_in', 7.0))
        tds_in = float(req.get('TDS_in', 300))
        turb_in = float(req.get('Turbidity_in', 10))
        temp_in = float(req.get('Temperature_in', 25))
        flow_in = float(req.get('Flow_in', 50))
        
        # Security: Backend input validation to prevent malicious or out-of-bounds data
        if not (0 <= ph_in <= 14): return jsonify({'error': 'pH must be between 0 and 14'}), 400
        if not (0 <= tds_in <= 10000): return jsonify({'error': 'TDS must be between 0 and 10000'}), 400
        if not (0 <= turb_in <= 1000): return jsonify({'error': 'Turbidity must be between 0 and 1000'}), 400
        if not (-10 <= temp_in <= 100): return jsonify({'error': 'Temperature must be between -10 and 100'}), 400
        if not (0 <= flow_in <= 10000): return jsonify({'error': 'Flow must be between 0 and 10000'}), 400

        if ai_model:
            # Predict using the real Machine Learning model!
            features = np.array([[ph_in, tds_in, turb_in, temp_in, flow_in]])
            prediction = ai_model.predict(features)[0]
            ph_out, tds_out, turb_out, temp_out, flow_out = prediction
        else:
            # Fallback mock logic
            ph_out = ph_in - (ph_in - 7.0) * 0.8
            tds_out = tds_in * 0.2
            turb_out = turb_in * 0.1
            temp_out = temp_in
            flow_out = flow_in * 0.95 
        
        return jsonify({
            'pH_out': round(ph_out, 2),
            'TDS_out': round(tds_out, 2),
            'Turbidity_out': round(turb_out, 2),
            'Temperature_out': round(temp_out, 2),
            'Flow_out': round(flow_out, 2)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
