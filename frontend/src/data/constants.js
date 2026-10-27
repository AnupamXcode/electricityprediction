export const INITIAL_APPLIANCES = [
  { id: '1', name: 'Refrigerator', quantity: 1, wattage: 180, hours: 24, startHour: 0, category: 'Kitchen' },
  { id: '2', name: 'Ceiling Fan', quantity: 3, wattage: 70, hours: 10, startHour: 9, category: 'Cooling' },
  { id: '3', name: 'LED Light', quantity: 6, wattage: 12, hours: 6, startHour: 18, category: 'Lighting' },
  { id: '4', name: 'Air Conditioner (1.5 Ton)', quantity: 1, wattage: 1500, hours: 6, startHour: 22, category: 'Cooling' },
  { id: '5', name: 'Smart Television', quantity: 1, wattage: 100, hours: 4, startHour: 19, category: 'Entertainment' },
  { id: '6', name: 'Washing Machine', quantity: 1, wattage: 500, hours: 1, startHour: 11, category: 'Utility' },
  { id: '7', name: 'Laptop / PC', quantity: 1, wattage: 65, hours: 5, startHour: 10, category: 'Work' },
  { id: '8', name: 'Water Geyser', quantity: 1, wattage: 2000, hours: 0.5, startHour: 7, category: 'Bathroom' }
];

export const CITIES = [
  'Nagpur',
  'Pune',
  'Mumbai',
  'Nashik',
  'Amravati',
  'Kolhapur',
  'Other'
];

export const PROVIDERS_MAP = {
  Mumbai: ['BEST', 'Tata Power', 'Adani Electricity', 'MSEDCL'],
  Nagpur: ['MSEDCL'],
  Pune: ['MSEDCL'],
  Nashik: ['MSEDCL'],
  Amravati: ['MSEDCL'],
  Kolhapur: ['MSEDCL'],
  Other: ['MSEDCL', 'Custom Provider']
};

export const DEFAULT_TARIFFS = {
  slab1Limit: 100,
  slab2Limit: 300,
  slab3Limit: 500,
  slab1Rate: 3.96,
  slab2Rate: 10.80,
  slab3Rate: 15.03,
  slab4Rate: 17.53,
  fixedCharge: 130.0,
  wheelingRate: 1.60,
  otherCharges: 0.0
};

// Trained ML model coefficients from UCI Appliances Energy Dataset (Degree 2 Polynomial)
// y = 81.106867 + 3.24118157 * T_out - 0.040135 * T_out^2
export const PREDICT_POLYNOMIAL = (temperature) => {
  const t = Number(temperature);
  const val = 81.106867 + (3.24118157 * t) - (0.040135 * Math.pow(t, 2));
  return Math.max(0, val);
};

export const PREDICT_LINEAR = (temperature) => {
  const t = Number(temperature);
  // Linear regression slope -0.627, intercept 102.77
  const val = 102.77 - (0.627 * t);
  return Math.max(0, val);
};

export const PRACTICALS_SUMMARY = [
  { id: 'P1', title: 'Web Scraping', topic: 'Mahadiscom Tariff Portal scraping & PDF extraction' },
  { id: 'P2', title: 'Exploratory Data Analysis', topic: 'Variance, Std Dev, Boxplots & Skewness of Energy' },
  { id: 'P3', title: 'Sampling & Probability', topic: 'Stratified/Systematic sampling & high-usage odds (P ≈ 0.384)' },
  { id: 'P4', title: 'CLT & Confidence Interval', topic: '100 sample means simulation (95% CI: 23.1 - 28.1 kWh)' },
  { id: 'P5', title: 'Simple Linear Regression', topic: 'Outside Temperature vs Energy (Slope: -0.627)' },
  { id: 'P6', title: 'Correlation & Covariance', topic: 'Pearson & Spearman correlation heatmap (p < 0.001)' },
  { id: 'P7', title: 'Polynomial Regression', topic: 'Degree-2 non-linear curve fitting for thermal response' },
  { id: 'P8', title: 'Model Evaluation & Export', topic: 'Polynomial Regression wins with lowest RMSE (91.83 vs 92.20)' }
];
