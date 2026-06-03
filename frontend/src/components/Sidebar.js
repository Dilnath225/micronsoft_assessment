import React from 'react';
import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">M</div>
        <div>
          <h1 className="sidebar-title">Micronsoft</h1>
          <p className="sidebar-subtitle">Solutions POS</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
          }
          end
        >
          <span className="sidebar-link-icon">🛒</span>
          <span>Point of Sale</span>
        </NavLink>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
          }
        >
          <span className="sidebar-link-icon">📊</span>
          <span>Analytics</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-badge">
          <span>⚡</span>
          <span>Assessment v2.0</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
