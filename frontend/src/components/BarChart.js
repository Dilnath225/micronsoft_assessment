import React from 'react';

function BarChart({ data, labelKey, valueKey, secondaryKey, maxItems }) {
  if (!data || data.length === 0) {
    return <div className="bar-chart-empty">No data available</div>;
  }

  const items = maxItems ? data.slice(0, maxItems) : data;
  const maxValue = Math.max(...items.map((d) => d[valueKey] || 0));

  const barColors = [
    'var(--accent-cyan)',
    'var(--accent-blue)',
    'var(--accent-purple)',
    'var(--accent-green)',
    'var(--accent-orange)',
  ];

  return (
    <div className="bar-chart">
      {items.map((item, index) => {
        const value = item[valueKey] || 0;
        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
        const label = item[labelKey] || `Item ${index + 1}`;
        const secondary = secondaryKey ? item[secondaryKey] : null;

        return (
          <div className="bar-chart-row" key={index}>
            <div className="bar-chart-label">
              <span className="bar-chart-rank">#{index + 1}</span>
              <span className="bar-chart-name">{label}</span>
            </div>
            <div className="bar-chart-bar-container">
              <div
                className="bar-chart-bar"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: barColors[index % barColors.length],
                  animationDelay: `${index * 0.1}s`,
                }}
              ></div>
            </div>
            <div className="bar-chart-values">
              <span className="bar-chart-primary">
                {typeof value === 'number'
                  ? value.toLocaleString()
                  : value}{' '}
                units
              </span>
              {secondary !== null && (
                <span className="bar-chart-secondary">
                  $
                  {parseFloat(secondary).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BarChart;
