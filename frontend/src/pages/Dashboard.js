import React, { useState, useEffect } from 'react';
import { fetchAnalytics } from '../services/api';
import BarChart from '../components/BarChart';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetchAnalytics();
        setData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load analytics. Ensure the Django server is running and data is populated.');
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <span className="error-icon">⚠️</span>
        <h2>Connection Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Calculate some derived metrics
  const dailyRevenue = data.daily_revenue || [];
  const todayRevenue = dailyRevenue.length > 0
    ? dailyRevenue[dailyRevenue.length - 1]?.revenue || 0
    : 0;
  const avgDailyRevenue = dailyRevenue.length > 0
    ? dailyRevenue.reduce((s, d) => s + d.revenue, 0) / dailyRevenue.length
    : 0;

  // Find max for daily chart scaling
  const maxDailyRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);

  return (
    <div className="dashboard">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p className="page-subtitle">
            Last 30 days performance · {dailyRevenue.length} days of data
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-revenue">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <span className="kpi-label">Total Revenue</span>
            <span className="kpi-value">
              ${parseFloat(data.total_revenue).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <div className="kpi-card kpi-today">
          <div className="kpi-icon">📈</div>
          <div className="kpi-content">
            <span className="kpi-label">Latest Day Revenue</span>
            <span className="kpi-value">
              ${todayRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <div className="kpi-card kpi-avg">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <span className="kpi-label">Avg. Daily Revenue</span>
            <span className="kpi-value">
              ${avgDailyRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <div className="kpi-card kpi-days">
          <div className="kpi-icon">📅</div>
          <div className="kpi-content">
            <span className="kpi-label">Active Days</span>
            <span className="kpi-value">{dailyRevenue.length}</span>
          </div>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div className="dashboard-card">
        <h2 className="card-title">Daily Revenue — Last 30 Days</h2>
        <div className="daily-chart">
          <div className="daily-chart-bars">
            {dailyRevenue.map((day, index) => {
              const height = (day.revenue / maxDailyRevenue) * 100;
              return (
                <div
                  className="daily-chart-col"
                  key={index}
                  title={`${day.date}: $${parseFloat(day.revenue).toLocaleString()}`}
                >
                  <div
                    className="daily-chart-bar"
                    style={{
                      height: `${height}%`,
                      animationDelay: `${index * 0.02}s`,
                    }}
                  ></div>
                  <span className="daily-chart-label">
                    {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
                      day: 'numeric',
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top 5 Products */}
      <div className="dashboard-card">
        <h2 className="card-title">Top 5 Best-Selling Products</h2>
        <BarChart
          data={data.top_products}
          labelKey="product__name"
          valueKey="total_sold"
          secondaryKey="total_earned"
          maxItems={5}
        />
      </div>
    </div>
  );
}

export default Dashboard;
