import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getDashboardKPIs, getVehicleStatusChart, getExpenseSummary, getRecentTrips } from '../services/dashboardService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDateTime } from '../utils/formatDate';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const KPICard = ({ label, value, sub, color }) => (
  <div className="card hover-scale" style={{ borderLeft: `4px solid ${color}` }}>
    <p style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '0.4rem' }}>{label}</p>
    <p style={{ fontSize: '1.8rem', fontWeight: 700, color }}>{value}</p>
    {sub && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{sub}</p>}
  </div>
);

function Dashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [expenseData, setExpenseData] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [k, c, e, r] = await Promise.all([getDashboardKPIs(), getVehicleStatusChart(), getExpenseSummary(), getRecentTrips()]);
        setKpis(k.data.data);
        setChartData(c.data.data);
        setExpenseData(e.data.data);
        setRecentTrips(r.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Loading dashboard data...</div>;

  const statusColors = { Available: '#10b981', 'On Trip': '#06b6d4', 'In Shop': '#f59e0b', Retired: '#ef4444' };
  const doughnutData = chartData ? {
    labels: chartData.map(d => d.status),
    datasets: [{ data: chartData.map(d => d.count), backgroundColor: chartData.map(d => statusColors[d.status] || '#94a3b8'), borderWidth: 0 }]
  } : null;

  const months = expenseData?.expenses?.map(e => e.month) || [];
  const barData = {
    labels: months,
    datasets: [
      { label: 'Expenses ($)', data: expenseData?.expenses?.map(e => e.total_expenses) || [], backgroundColor: '#3b82f6' },
      { label: 'Fuel ($)', data: expenseData?.fuel?.map(f => f.total_fuel) || [], backgroundColor: '#f59e0b' }
    ]
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title"><h1>Fleet Dashboard</h1><p>Welcome back, <strong>{user?.name}</strong> ({user?.role})</p></div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <KPICard label="Total Vehicles" value={kpis?.total_vehicles ?? 0} color="var(--color-primary)" />
        <KPICard label="Available" value={kpis?.available_vehicles ?? 0} color="var(--color-status-success)" />
        <KPICard label="On Trip" value={kpis?.vehicles_on_trip ?? 0} color="var(--color-status-info)" />
        <KPICard label="In Shop" value={kpis?.vehicles_in_shop ?? 0} color="var(--color-status-warning)" />
        <KPICard label="Active Trips" value={kpis?.active_trips ?? 0} color="#8b5cf6" />
        <KPICard label="Pending Trips" value={kpis?.pending_trips ?? 0} color="#64748b" />
        <KPICard label="Available Drivers" value={kpis?.available_drivers ?? 0} color="var(--color-status-success)" />
        <KPICard label="Drivers On Duty" value={kpis?.drivers_on_duty ?? 0} color="var(--color-status-info)" />
        <KPICard label="Total Fuel Cost" value={formatCurrency(kpis?.total_fuel_cost)} color="#f59e0b" />
        <KPICard label="Maintenance Cost" value={formatCurrency(kpis?.total_maintenance_cost)} color="#ef4444" />
        <KPICard label="Total Op. Cost" value={formatCurrency(kpis?.total_operational_cost)} color="#dc2626" />
        <KPICard label="Fleet Utilization" value={`${kpis?.fleet_utilization ?? 0}%`} sub="Vehicles on active trips" color="var(--color-primary)" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Vehicle Status</h3>
          {doughnutData ? <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'bottom' } } }} /> : <p>No data</p>}
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Monthly Expenses vs Fuel (Last 12 Months)</h3>
          <Bar data={barData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </div>
      </div>

      {/* Recent Trips */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Recent Trips</h3>
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="custom-table">
            <thead><tr><th>#</th><th>Route</th><th>Vehicle</th><th>Driver</th><th>Status</th><th>Revenue</th><th>Dispatched</th></tr></thead>
            <tbody>
              {recentTrips.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>No trips found</td></tr>
              ) : recentTrips.map(t => (
                <tr key={t.id}>
                  <td>#{t.id}</td>
                  <td><strong>{t.source}</strong><br /><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>→ {t.destination}</span></td>
                  <td>{t.registration_number}</td>
                  <td>{t.driver_name}</td>
                  <td><span className={`badge badge-${t.status.toLowerCase().replace(' ', '')}`}>{t.status}</span></td>
                  <td>{formatCurrency(t.revenue)}</td>
                  <td style={{ fontSize: '0.8rem' }}>{formatDateTime(t.dispatch_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
