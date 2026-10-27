import { useState, useMemo } from 'react';
import {
  Zap,
  TrendingUp,
  Cpu,
  Receipt,
  Layers,
  Plus,
  Trash2,
  Info,
  Sun,
  Moon,
  ExternalLink,
  ShieldCheck,
  BarChart2,
  PieChart as PieIcon,
  Sparkles,
  HelpCircle,
  Clock,
  Gauge
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import {
  INITIAL_APPLIANCES,
  CITIES,
  PROVIDERS_MAP,
  DEFAULT_TARIFFS,
  PREDICT_POLYNOMIAL,
  PREDICT_LINEAR,
  PRACTICALS_SUMMARY
} from './data/constants';
import './App.css';

const PIE_COLORS = [
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f59e0b', '#14b8a6', '#6366f1'
];

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator' | 'profile' | 'bill' | 'ml' | 'practicals'
  
  // Location & Provider State
  const [city, setCity] = useState('Nagpur');
  const [provider, setProvider] = useState('MSEDCL');
  const [customProvider, setCustomProvider] = useState('');

  // Appliances State
  const [appliances, setAppliances] = useState(INITIAL_APPLIANCES);
  const [newAppliance, setNewAppliance] = useState({
    name: '',
    quantity: 1,
    wattage: 100,
    hours: 4,
    startHour: 18,
    category: 'Other'
  });
  const [showAddModal, setShowAddModal] = useState(false);

  // Meter Reading Comparison
  const [yesterdayReading, setYesterdayReading] = useState(12.5);

  // Tariff State
  const [tariffs, setTariffs] = useState(DEFAULT_TARIFFS);

  // ML Temperature State
  const [temperature, setTemperature] = useState(18.5);

  // Toggle Theme
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  };

  // Calculations
  const processedAppliances = useMemo(() => {
    return appliances.map((item) => {
      const dailyKwh = (item.quantity * item.wattage * item.hours) / 1000;
      const monthlyKwh = dailyKwh * 30;
      return {
        ...item,
        dailyKwh: Number(dailyKwh.toFixed(2)),
        monthlyKwh: Number(monthlyKwh.toFixed(2))
      };
    });
  }, [appliances]);

  const totalDailyUnits = useMemo(() => {
    return processedAppliances.reduce((acc, curr) => acc + curr.dailyKwh, 0);
  }, [processedAppliances]);

  const totalMonthlyUnits = useMemo(() => {
    return totalDailyUnits * 30;
  }, [totalDailyUnits]);

  // 24-Hour Load Distribution
  const hourlyLoadData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      hourIndex: i,
      loadKw: 0
    }));

    processedAppliances.forEach((app) => {
      const start = app.startHour % 24;
      const duration = app.hours;
      const powerKw = (app.quantity * app.wattage) / 1000;

      for (let h = 0; h < 24; h++) {
        const diff = (h - start + 24) % 24;
        if (diff < duration) {
          hours[h].loadKw += powerKw;
        }
      }
    });

    return hours.map((h) => ({
      ...h,
      loadKw: Number(h.loadKw.toFixed(2))
    }));
  }, [processedAppliances]);

  // Progressive Slab Calculation
  const billBreakdown = useMemo(() => {
    const units = totalMonthlyUnits;
    const slabs = [
      { slab: 1, label: `0 - ${tariffs.slab1Limit} units`, limit: tariffs.slab1Limit, rate: tariffs.slab1Rate },
      { slab: 2, label: `${tariffs.slab1Limit + 1} - ${tariffs.slab2Limit} units`, limit: tariffs.slab2Limit, rate: tariffs.slab2Rate },
      { slab: 3, label: `${tariffs.slab2Limit + 1} - ${tariffs.slab3Limit} units`, limit: tariffs.slab3Limit, rate: tariffs.slab3Rate },
      { slab: 4, label: `Above ${tariffs.slab3Limit} units`, limit: Infinity, rate: tariffs.slab4Rate }
    ];

    let lower = 0;
    let energyCharge = 0;
    const rows = [];

    for (let i = 0; i < slabs.length; i++) {
      const { limit, rate, label, slab } = slabs[i];
      let unitsInSlab = 0;

      if (units > lower) {
        if (limit === Infinity) {
          unitsInSlab = units - lower;
        } else {
          unitsInSlab = Math.min(units, limit) - lower;
        }
        unitsInSlab = Math.max(0, unitsInSlab);
      }

      const charge = unitsInSlab * rate;
      energyCharge += charge;

      rows.push({
        slab,
        label,
        units: Number(unitsInSlab.toFixed(2)),
        rate,
        charge: Number(charge.toFixed(2))
      });

      lower = limit;
    }

    const wheelingCharge = units * tariffs.wheelingRate;
    const totalBill = energyCharge + wheelingCharge + tariffs.fixedCharge + tariffs.otherCharges;

    return {
      rows,
      energyCharge: Number(energyCharge.toFixed(2)),
      wheelingCharge: Number(wheelingCharge.toFixed(2)),
      fixedCharge: tariffs.fixedCharge,
      otherCharges: tariffs.otherCharges,
      totalBill: Number(totalBill.toFixed(2))
    };
  }, [totalMonthlyUnits, tariffs]);

  // ML Prediction
  const polyPrediction = useMemo(() => PREDICT_POLYNOMIAL(temperature), [temperature]);
  const linearPrediction = useMemo(() => PREDICT_LINEAR(temperature), [temperature]);

  // ML Temperature Curve Simulation Data
  const mlCurveData = useMemo(() => {
    const data = [];
    for (let t = -2; t <= 35; t += 2) {
      data.push({
        temp: `${t}°C`,
        tempNum: t,
        polynomial: Number(PREDICT_POLYNOMIAL(t).toFixed(1)),
        linear: Number(PREDICT_LINEAR(t).toFixed(1))
      });
    }
    return data;
  }, []);

  // Handlers
  const handleAddAppliance = (e) => {
    e.preventDefault();
    if (!newAppliance.name.trim()) return;
    setAppliances([
      ...appliances,
      {
        ...newAppliance,
        id: Date.now().toString()
      }
    ]);
    setNewAppliance({
      name: '',
      quantity: 1,
      wattage: 100,
      hours: 4,
      startHour: 18,
      category: 'Other'
    });
    setShowAddModal(false);
  };

  const handleDeleteAppliance = (id) => {
    setAppliances(appliances.filter((a) => a.id !== id));
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar glass-panel">
        <div className="brand">
          <div className="logo-badge">
            <Zap className="logo-icon" />
          </div>
          <div>
            <h1 className="brand-title">Smart Energy AI</h1>
            <p className="brand-sub">Household Energy & Tariff Intelligence</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            <Zap size={16} /> Appliances
          </button>
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <BarChart2 size={16} /> 24h Load
          </button>
          <button
            className={`tab-btn ${activeTab === 'bill' ? 'active' : ''}`}
            onClick={() => setActiveTab('bill')}
          >
            <Receipt size={16} /> Tariff & Bill
          </button>
          <button
            className={`tab-btn ${activeTab === 'ml' ? 'active' : ''}`}
            onClick={() => setActiveTab('ml')}
          >
            <Cpu size={16} /> ML Predictor
          </button>
          <button
            className={`tab-btn ${activeTab === 'practicals' ? 'active' : ''}`}
            onClick={() => setActiveTab('practicals')}
          >
            <Layers size={16} /> Research (P1-P8)
          </button>
        </nav>

        {/* Right Action Bar */}
        <div className="actions">
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noreferrer"
            className="vercel-badge"
            title="Deployable on Vercel"
          >
            <span className="vercel-triangle">▲</span> Vercel Ready
          </a>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle Dark/Light">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        {/* Top Summary Banner */}
        <section className="kpi-grid">
          <div className="kpi-card glass-card">
            <div className="kpi-icon-wrap emerald">
              <Zap size={22} />
            </div>
            <div>
              <p className="kpi-label">Estimated Daily Units</p>
              <h2 className="kpi-value">{totalDailyUnits.toFixed(2)} <span className="unit">kWh</span></h2>
              <span className="badge badge-emerald">Daily Consumption</span>
            </div>
          </div>

          <div className="kpi-card glass-card">
            <div className="kpi-icon-wrap cyan">
              <Clock size={22} />
            </div>
            <div>
              <p className="kpi-label">Estimated 30-Day Units</p>
              <h2 className="kpi-value">{totalMonthlyUnits.toFixed(2)} <span className="unit">kWh</span></h2>
              <span className="badge badge-cyan">Monthly Projected</span>
            </div>
          </div>

          <div className="kpi-card glass-card">
            <div className="kpi-icon-wrap amber">
              <Receipt size={22} />
            </div>
            <div>
              <p className="kpi-label">Projected Monthly Bill</p>
              <h2 className="kpi-value">₹{billBreakdown.totalBill.toLocaleString('en-IN')}</h2>
              <span className="badge badge-amber">{provider} Slabs</span>
            </div>
          </div>

          <div className="kpi-card glass-card">
            <div className="kpi-icon-wrap violet">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="kpi-label">Estimated Carbon Impact</p>
              <h2 className="kpi-value">{(totalMonthlyUnits * 0.82).toFixed(1)} <span className="unit">kg CO₂</span></h2>
              <span className="badge badge-cyan">0.82 kg/kWh CEA</span>
            </div>
          </div>
        </section>

        {/* Location & Provider Strip */}
        <section className="provider-strip glass-panel">
          <div className="provider-col">
            <label className="field-label">Select City:</label>
            <select
              className="select-field"
              value={city}
              onChange={(e) => {
                const c = e.target.value;
                setCity(c);
                const providers = PROVIDERS_MAP[c] || ['MSEDCL'];
                setProvider(providers[0]);
              }}
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="provider-col">
            <label className="field-label">Electricity Provider:</label>
            {city === 'Mumbai' ? (
              <select
                className="select-field"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                {PROVIDERS_MAP.Mumbai.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : city === 'Other' ? (
              <input
                type="text"
                className="text-field"
                placeholder="Enter provider name"
                value={customProvider}
                onChange={(e) => setCustomProvider(e.target.value)}
              />
            ) : (
              <div className="provider-badge">
                <ShieldCheck size={16} className="text-emerald" /> {provider} (State Utility)
              </div>
            )}
          </div>

          <div className="provider-col meter-col">
            <label className="field-label">Yesterday's Meter (Units):</label>
            <div className="meter-input-group">
              <input
                type="number"
                step="0.1"
                min="0"
                className="text-field meter-input"
                value={yesterdayReading}
                onChange={(e) => setYesterdayReading(Number(e.target.value))}
              />
              <span className={`diff-pill ${totalDailyUnits - yesterdayReading > 0 ? 'higher' : 'lower'}`}>
                {totalDailyUnits - yesterdayReading >= 0 ? '+' : ''}
                {(totalDailyUnits - yesterdayReading).toFixed(2)} units
              </span>
            </div>
          </div>
        </section>

        {/* Tab 1: Appliance Manager & Pie Chart */}
        {activeTab === 'calculator' && (
          <section className="tab-pane">
            <div className="split-grid">
              {/* Left Column: Appliance List */}
              <div className="panel-box glass-panel">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Household Appliances</h3>
                    <p className="panel-desc">Manage quantities, wattage, and operating hours</p>
                  </div>
                  <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={16} /> Add Appliance
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Appliance</th>
                        <th>Qty</th>
                        <th>Wattage</th>
                        <th>Hours/Day</th>
                        <th>Daily kWh</th>
                        <th>Monthly kWh</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedAppliances.map((app) => (
                        <tr key={app.id}>
                          <td className="font-semibold">{app.name}</td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              className="table-input"
                              value={app.quantity}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setAppliances(appliances.map((a) => a.id === app.id ? { ...a, quantity: val } : a));
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              className="table-input"
                              value={app.wattage}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setAppliances(appliances.map((a) => a.id === app.id ? { ...a, wattage: val } : a));
                              }}
                            /> W
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.5"
                              min="0.1"
                              max="24"
                              className="table-input"
                              value={app.hours}
                              onChange={(e) => {
                                const val = Math.min(24, Math.max(0.1, parseFloat(e.target.value) || 1));
                                setAppliances(appliances.map((a) => a.id === app.id ? { ...a, hours: val } : a));
                              }}
                            /> h
                          </td>
                          <td className="text-emerald font-semibold">{app.dailyKwh}</td>
                          <td className="font-semibold">{app.monthlyKwh}</td>
                          <td>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteAppliance(app.id)}
                              title="Delete Appliance"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Donut Breakdown */}
              <div className="panel-box glass-panel">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Energy Consumption Share</h3>
                    <p className="panel-desc">Which appliance consumes the highest percentage?</p>
                  </div>
                </div>

                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={290}>
                    <PieChart>
                      <Pie
                        data={processedAppliances}
                        dataKey="dailyKwh"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                      >
                        {processedAppliances.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [`${val} kWh/day`, 'Usage']}
                        contentStyle={{ background: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend list */}
                <div className="pie-legend">
                  {processedAppliances.map((app, idx) => (
                    <div key={app.id} className="legend-item">
                      <span className="color-dot" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                      <span className="legend-name">{app.name}</span>
                      <span className="legend-val">
                        {totalDailyUnits > 0 ? ((app.dailyKwh / totalDailyUnits) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 2: 24h Hourly Load Profile */}
        {activeTab === 'profile' && (
          <section className="tab-pane">
            <div className="panel-box glass-panel">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">24-Hour Daily Load Curve (kW)</h3>
                  <p className="panel-desc">Hourly power demand based on individual start times and duty cycles</p>
                </div>
                <div className="badge badge-cyan">
                  <Clock size={14} /> Peak Hour Optimization
                </div>
              </div>

              <div className="chart-wrapper-tall">
                <ResponsiveContainer width="100%" height={380}>
                  <AreaChart data={hourlyLoadData}>
                    <defs>
                      <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="hour" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" label={{ value: 'Load (kW)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                    <Tooltip
                      formatter={(val) => [`${val} kW`, 'Estimated Demand']}
                      contentStyle={{ background: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                    />
                    <Area type="monotone" dataKey="loadKw" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#loadGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="insights-banner">
                <Info size={20} className="text-cyan" />
                <p>
                  <strong>Energy Saving Tip:</strong> High-draw loads like Water Geysers (2 kW) and Air Conditioners (1.5 kW) account for the dominant spikes. Shifting washing machine and pumping cycles to off-peak daylight hours reduces localized grid stress.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Tab 3: Progressive Tariff Calculator */}
        {activeTab === 'bill' && (
          <section className="tab-pane">
            <div className="split-grid">
              {/* Slabs breakdown */}
              <div className="panel-box glass-panel">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Progressive Slab Breakdown</h3>
                    <p className="panel-desc">Calculated on {totalMonthlyUnits.toFixed(2)} units for current cycle</p>
                  </div>
                  <span className="badge badge-emerald">Progressive Slabs</span>
                </div>

                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Slab Tier</th>
                        <th>Range</th>
                        <th>Units in Slab</th>
                        <th>Rate (₹/unit)</th>
                        <th>Charge (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billBreakdown.rows.map((r) => (
                        <tr key={r.slab}>
                          <td><strong>Slab {r.slab}</strong></td>
                          <td>{r.label}</td>
                          <td className="font-semibold">{r.units}</td>
                          <td>₹{r.rate.toFixed(2)}</td>
                          <td className="text-emerald font-bold">₹{r.charge.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bill-summary-list">
                  <div className="bill-line">
                    <span>Base Energy Charge:</span>
                    <strong>₹{billBreakdown.energyCharge.toFixed(2)}</strong>
                  </div>
                  <div className="bill-line">
                    <span>Wheeling Charge (@ ₹{tariffs.wheelingRate}/unit):</span>
                    <strong>₹{billBreakdown.wheelingCharge.toFixed(2)}</strong>
                  </div>
                  <div className="bill-line">
                    <span>Fixed Monthly Charge:</span>
                    <strong>₹{billBreakdown.fixedCharge.toFixed(2)}</strong>
                  </div>
                  <div className="bill-line total">
                    <span>Estimated Total Bill:</span>
                    <strong className="text-emerald">₹{billBreakdown.totalBill.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Tariff rates editor */}
              <div className="panel-box glass-panel">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Tariff Configuration</h3>
                    <p className="panel-desc">Adjust slab thresholds and per-unit billing rates</p>
                  </div>
                </div>

                <div className="tariff-form">
                  <div className="form-group">
                    <label>Slab 1 Limit (0 to X units):</label>
                    <input
                      type="number"
                      className="text-field"
                      value={tariffs.slab1Limit}
                      onChange={(e) => setTariffs({ ...tariffs, slab1Limit: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Slab 1 Rate (₹/unit):</label>
                    <input
                      type="number"
                      step="0.01"
                      className="text-field"
                      value={tariffs.slab1Rate}
                      onChange={(e) => setTariffs({ ...tariffs, slab1Rate: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Slab 2 Limit:</label>
                    <input
                      type="number"
                      className="text-field"
                      value={tariffs.slab2Limit}
                      onChange={(e) => setTariffs({ ...tariffs, slab2Limit: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Slab 2 Rate (₹/unit):</label>
                    <input
                      type="number"
                      step="0.01"
                      className="text-field"
                      value={tariffs.slab2Rate}
                      onChange={(e) => setTariffs({ ...tariffs, slab2Rate: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Wheeling Charge (₹/unit):</label>
                    <input
                      type="number"
                      step="0.01"
                      className="text-field"
                      value={tariffs.wheelingRate}
                      onChange={(e) => setTariffs({ ...tariffs, wheelingRate: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Monthly Fixed Charge (₹):</label>
                    <input
                      type="number"
                      step="1"
                      className="text-field"
                      value={tariffs.fixedCharge}
                      onChange={(e) => setTariffs({ ...tariffs, fixedCharge: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 4: Machine Learning Predictor */}
        {activeTab === 'ml' && (
          <section className="tab-pane">
            <div className="split-grid">
              {/* Left Column: Interactive Slider & Model Output */}
              <div className="panel-box glass-panel">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Polynomial ML Prediction Engine</h3>
                    <p className="panel-desc">Trained on UCI Appliances Energy Prediction dataset</p>
                  </div>
                  <span className="badge badge-cyan">Degree 2 Model</span>
                </div>

                <div className="slider-box">
                  <div className="slider-label-row">
                    <span>Outside Temperature (T_out):</span>
                    <strong className="temp-display">{temperature.toFixed(1)} °C</strong>
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="40"
                    step="0.5"
                    className="range-slider"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  />
                  <div className="slider-ticks">
                    <span>-5°C (Freezing)</span>
                    <span>18°C (Moderate)</span>
                    <span>40°C (Heatwave)</span>
                  </div>
                </div>

                <div className="predictions-cards">
                  <div className="pred-card best">
                    <div className="pred-tag">Recommended Winner</div>
                    <h4>Polynomial Regression</h4>
                    <div className="pred-val">{polyPrediction.toFixed(2)} <span className="unit">Wh</span></div>
                    <p className="pred-sub">per 10-minute reading (RMSE: 91.83)</p>
                  </div>

                  <div className="pred-card baseline">
                    <div className="pred-tag secondary">Baseline</div>
                    <h4>Linear Regression</h4>
                    <div className="pred-val">{linearPrediction.toFixed(2)} <span className="unit">Wh</span></div>
                    <p className="pred-sub">per 10-minute reading (RMSE: 92.20)</p>
                  </div>
                </div>

                <div className="formula-box">
                  <p className="formula-title">Trained Mathematical Formula:</p>
                  <code>Energy (Wh) = 81.107 + 3.241 × T_out - 0.0401 × (T_out)²</code>
                </div>
              </div>

              {/* Right Column: Temperature Response Curve */}
              <div className="panel-box glass-panel">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Thermal Response Curve</h3>
                    <p className="panel-desc">Comparison of Polynomial vs Linear behavior across temperatures</p>
                  </div>
                </div>

                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={mlCurveData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="temp" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" label={{ value: 'Appliance Wh', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ background: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                      />
                      <Area type="monotone" dataKey="polynomial" stroke="#06b6d4" strokeWidth={3} fillOpacity={0.2} fill="#06b6d4" name="Polynomial Model" />
                      <Area type="monotone" dataKey="linear" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" fill="none" name="Linear Model" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 5: Practicals Summary (P1 - P8) */}
        {activeTab === 'practicals' && (
          <section className="tab-pane">
            <div className="panel-box glass-panel">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">College Laboratory Practicals (P1 — P8)</h3>
                  <p className="panel-desc">Full methodology completed from data engineering to machine learning</p>
                </div>
                <span className="badge badge-emerald">8 / 8 Completed</span>
              </div>

              <div className="practicals-grid">
                {PRACTICALS_SUMMARY.map((p) => (
                  <div key={p.id} className="practical-card glass-card">
                    <div className="p-header">
                      <span className="p-badge">{p.id}</span>
                      <h4 className="p-title">{p.title}</h4>
                    </div>
                    <p className="p-desc">{p.topic}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Add Appliance Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Household Appliance</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddAppliance} className="modal-form">
              <div className="form-group">
                <label>Appliance Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Microwave Oven"
                  className="text-field"
                  value={newAppliance.name}
                  onChange={(e) => setNewAppliance({ ...newAppliance, name: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    className="text-field"
                    value={newAppliance.quantity}
                    onChange={(e) => setNewAppliance({ ...newAppliance, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="form-group">
                  <label>Wattage (Watts):</label>
                  <input
                    type="number"
                    min="1"
                    className="text-field"
                    value={newAppliance.wattage}
                    onChange={(e) => setNewAppliance({ ...newAppliance, wattage: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Operating Hours / Day:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    max="24"
                    className="text-field"
                    value={newAppliance.hours}
                    onChange={(e) => setNewAppliance({ ...newAppliance, hours: parseFloat(e.target.value) || 1 })}
                  />
                </div>
                <div className="form-group">
                  <label>Start Hour (0 - 23):</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    className="text-field"
                    value={newAppliance.startHour}
                    onChange={(e) => setNewAppliance({ ...newAppliance, startHour: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Appliance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>Smart Energy Intelligence Platform • Ready for 1-Click Vercel Deployment</p>
      </footer>
    </div>
  );
}
