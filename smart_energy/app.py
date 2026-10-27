import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px

st.set_page_config(page_title="Smart Energy", page_icon="☑", layout="wide")
st.title("☑ Smart Household Energy Usage & Cost Prediction")
st.write("Estimate household electricity use, appliance contribution and monthly bill.")
st.header("1. Select your city")
city = st.selectbox("City", ["Nagpur", "Pune", "Nashik", "Amravati", "Kolhapur", "Mumbai", "Other"])

if city == "Mumbai":
    provider = st.selectbox("Electricity provider", ["BEST", "Tata Power", "Adani Electricity", "MSEDCL"])
elif city == "Other":
    provider = st.text_input("Enter electricity provider")
else:
    provider = "MSEDCL"
    st.write("Electricity provider:", provider)

st.caption("Confirm the provider and tariff category from your electricity bill.")
st.header("2. Enter household appliances")
default_appliances = pd.DataFrame([
    ["Refrigerator", 1, 180, 24.0, 0],
    ["Fan", 3, 70, 10.0, 9],
    ["LED Light", 6, 12, 6.0, 18],
    ["Air Conditioner", 1, 1500, 6.0, 22],
    ["Television", 1, 100, 4.0, 19],
    ["Washing Machine", 1, 500, 1.0, 11],
    ["Laptop", 1, 65, 5.0, 10],
    ["Geyser", 1, 2000, 0.5, 7]
], columns=["Appliance", "Quantity", "Wattage (W)", "Hours per day", "Start hour"])

appliances = st.data_editor(default_appliances, num_rows="dynamic", use_container_width=True)
appliances["Daily Units (kWh)"] = (appliances["Quantity"] * appliances["Wattage (W)"] * appliances["Hours per day"] / 1000)
appliances["Monthly Units (kWh)"] = appliances["Daily Units (kWh)"] * 30

daily_units = appliances["Daily Units (kWh)"].sum()
monthly_units = daily_units * 30

a, b = st.columns(2)
a.metric("Estimated daily units", f"{daily_units:.2f} kWh")
b.metric("Estimated 30-day units", f"{monthly_units:.2f} kWh")

st.subheader("Appliance-wise consumption")
st.dataframe(appliances, use_container_width=True)
st.subheader("Pie Chart — Which appliance uses the most electricity?")
pie_data = appliances[appliances["Daily Units (kWh)"] > 0]
if len(pie_data) > 0:
    fig = px.pie(pie_data, names="Appliance", values="Daily Units (kWh)", hole=0.4)
    st.plotly_chart(fig, use_container_width=True)

st.subheader("Daily Load Profile")
hourly_load = [0] * 24
for index, row in appliances.iterrows():
    start = int(row["Start hour"]) % 24
    hours = float(row["Hours per day"])
    power = float(row["Quantity"]) * float(row["Wattage (W)"]) / 1000
    for hour in range(24):
        difference = (hour - start) % 24
        if difference < hours:
            hourly_load[hour] += power

load_data = pd.DataFrame({"Hour": list(range(24)), "Estimated Load (kW)": hourly_load})
fig = px.bar(load_data, x="Hour", y="Estimated Load (kW)")
st.plotly_chart(fig, use_container_width=True)

st.header("3. Compare yesterday and today's consumption")
yesterday_units = st.number_input("Yesterday's meter reading (units)", min_value=0.0, value=0.0)
st.metric("Today's appliance-based estimate", f"{daily_units:.2f} units")
difference = daily_units - yesterday_units
st.metric("Difference", f"{difference:+.2f} units")

st.header("4. Electricity slab and bill calculator")
st.write("Enter rates from your current electricity tariff. Slabs are progressive.")

slab1 = st.number_input("First slab upper limit (units)", min_value=1, value=100)
slab2 = st.number_input("Second slab upper limit (units)", min_value=slab1+1, value=300)
slab3 = st.number_input("Third slab upper limit (units)", min_value=slab2+1, value=500)

rate1 = st.number_input("First slab rate (•/unit)", min_value=0.0, value=3.96)
rate2 = st.number_input("Second slab rate (•/unit)", min_value=0.0, value=10.80)
rate3 = st.number_input("Third slab rate (•/unit)", min_value=0.0, value=15.03)
rate4 = st.number_input("Above third slab rate (•/unit)", min_value=0.0, value=17.53)

fixed_charge = st.number_input("Monthly fixed charge (•)", min_value=0.0, value=130.0)
wheeling_rate = st.number_input("Wheeling charge (•/unit)", min_value=0.0, value=1.60)
other_charges = st.number_input("Other charges / FAC / duty (•)", min_value=0.0, value=0.0)
units_for_bill = st.number_input("Units for bill calculation", min_value=0.0, value=float(monthly_units))

slab_limits = [slab1, slab2, slab3, float("inf")]
slab_rates = [rate1, rate2, rate3, rate4]
lower_limit = 0
energy_charge = 0
bill_rows = []

for i in range(4):
    upper_limit = slab_limits[i]
    rate = slab_rates[i]
    if units_for_bill > lower_limit:
        if upper_limit == float("inf"):
            units_in_slab = units_for_bill - lower_limit
        else:
            units_in_slab = min(units_for_bill, upper_limit) - lower_limit
        units_in_slab = max(0, units_in_slab)
    else:
        units_in_slab = 0
    charge = units_in_slab * rate
    energy_charge += charge
    bill_rows.append({"Slab": i + 1, "Units": units_in_slab, "Rate (•)": rate, "Amount (•)": charge})
    lower_limit = upper_limit

wheeling_charge = units_for_bill * wheeling_rate
estimated_bill = energy_charge + wheeling_charge + fixed_charge + other_charges

st.subheader("Bill Breakdown")
st.dataframe(pd.DataFrame(bill_rows), use_container_width=True)

x, y, z = st.columns(3)
x.metric("Energy charge", f"•{energy_charge:.2f}")
y.metric("Wheeling charge", f"•{wheeling_charge:.2f}")
z.metric("Estimated bill", f"•{estimated_bill:.2f}")

st.caption("Illustrative calculator. Actual bill can include electricity duty, FAC, taxes, rebates and other provider-specific charges. Verify rates with your current bill/tariff order.")
st.header("5. ML Prediction Insight")
st.write("This model predicts dataset-level appliance energy from outside temperature. It is separate from the user-entered appliance calculator.")

try:
    import joblib
    import os
    m_path = "smart_energy/models/best_model.pkl" if os.path.exists("smart_energy/models/best_model.pkl") else "models/best_model.pkl"
    model = joblib.load(m_path)
    temperature = st.number_input("Outside temperature (°C)", value=10.0)
    if st.button("Predict appliance energy"):
        prediction = model.predict(pd.DataFrame({"T_out": [temperature]}))[0]
        st.metric("Predicted appliance energy (Wh per 10-minute reading)", f"{max(0, prediction):.2f} Wh")
except Exception:
    st.info("Run all practical cells first to create the saved ML model.")

st.header("6. Historical Dataset")
st.write("UCI Appliances Energy Prediction — historical research dataset.")
st.markdown("[Open UCI dataset](https://archive.ics.uci.edu/dataset/374/appliances+energy+prediction)")
