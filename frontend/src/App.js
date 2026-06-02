import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data from our Django Backend API
    axios.get('http://localhost:8000/api/report/')
      .then(response => {
        setReportData(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching the report!", err);
        setError("Failed to load data. Please ensure Django server is running.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '100px' }}><h2>Loading Dashboard Data...</h2></div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', marginTop: '100px', color: 'red' }}><h2>{error}</h2></div>;
  }

  // Calculate the maximum sold quantity to set the dynamic width of the bars
  const maxSold = Math.max(...reportData.top_products.map(p => p.total_sold));

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '40px' }}>
        Micronsoft Sales Dashboard
      </h1>
      
      {/* Total Revenue Card */}
      <div style={{ 
          backgroundColor: '#fff', 
          padding: '30px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
          marginBottom: '40px', 
          textAlign: 'center' 
        }}>
        <h3 style={{ margin: '0', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Total Revenue
        </h3>
        <h1 style={{ margin: '15px 0 0 0', color: '#27ae60', fontSize: '54px' }}>
          ${reportData.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h1>
      </div>

      {/* Custom HTML/CSS Bar Chart for Top 5 Products */}
      <div style={{ 
          backgroundColor: '#fff', 
          padding: '30px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
        }}>
        <h2 style={{ textAlign: 'center', color: '#34495e', marginBottom: '40px' }}>
          Top 5 Best-Selling Products
        </h2>
        
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {reportData.top_products.map((product, index) => {
            // Calculate percentage for the bar width
            const percentage = (product.total_sold / maxSold) * 100;
            
            return (
              <div key={index} style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#2c3e50', fontSize: '16px', fontWeight: 'bold' }}>
                  <span>{product.product__name}</span>
                  <span>{product.total_sold.toLocaleString()} units <span style={{ color: '#e67e22' }}>(${product.total_earned.toLocaleString()})</span></span>
                </div>
                {/* Background Bar */}
                <div style={{ width: '100%', backgroundColor: '#ecf0f1', borderRadius: '6px', height: '24px', overflow: 'hidden' }}>
                  {/* Dynamic Filled Bar */}
                  <div style={{ width: `${percentage}%`, backgroundColor: '#3498db', height: '100%', borderRadius: '6px' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;