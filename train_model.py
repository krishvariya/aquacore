import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib

print("Generating synthetic water plant data (2000 records)...")
np.random.seed(42)

n_samples = 2000

# Inputs
ph_in = np.random.uniform(6.0, 8.5, n_samples)
tds_in = np.random.uniform(200, 800, n_samples)
turb_in = np.random.uniform(5, 50, n_samples)
temp_in = np.random.uniform(15, 35, n_samples)
flow_in = np.random.uniform(50, 150, n_samples)

# Simulate realistic RO/Filtration behavior + noise
# pH normalizes to around 7.0 - 7.5
ph_out = 7.0 + (ph_in - 7.0) * 0.2 + np.random.normal(0, 0.1, n_samples)
# TDS reduces by 80-95% depending on flow (higher flow = slightly worse reduction)
tds_reduction = 0.95 - (flow_in / 150) * 0.1
tds_out = tds_in * (1 - tds_reduction) + np.random.normal(0, 5, n_samples)
# Turbidity mostly removed
turb_out = turb_in * 0.05 + np.random.normal(0, 0.5, n_samples)
# Temp stays mostly same
temp_out = temp_in + np.random.normal(0.5, 0.2, n_samples)
# Flow loses 2-8% (reject water/brine)
flow_loss = 0.02 + (tds_in / 800) * 0.06
flow_out = flow_in * (1 - flow_loss) + np.random.normal(0, 1, n_samples)

# Ensure no negative values
tds_out = np.clip(tds_out, 0, None)
turb_out = np.clip(turb_out, 0, None)

X = pd.DataFrame({'pH_in': ph_in, 'TDS_in': tds_in, 'Turb_in': turb_in, 'Temp_in': temp_in, 'Flow_in': flow_in})
y = pd.DataFrame({'pH_out': ph_out, 'TDS_out': tds_out, 'Turb_out': turb_out, 'Temp_out': temp_out, 'Flow_out': flow_out})

print("Training Random Forest Regressor Model...")
model = RandomForestRegressor(n_estimators=50, random_state=42)
model.fit(X.values, y.values)  # Train on raw arrays to avoid feature name warnings later

print("Saving model to model.pkl...")
joblib.dump(model, 'model.pkl')
print("Done! AI Model trained and saved.")
