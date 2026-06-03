import React, { useRef } from 'react';

/**
 * Receipt Component — Styled for 80mm Thermal Printer
 * 
 * Standard 80mm thermal printers have a printable area of approximately
 * 72mm (≈ 204px at 72dpi or ~302px at 96dpi). This component uses
 * a fixed width of 302px to match.
 */
function Receipt({ order, onClose }) {
  const receiptRef = useRef(null);

  const handlePrint = () => {
    const content = receiptRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=350,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              margin: 0;
              padding: 8px;
              width: 72mm;
              color: #000;
            }
            .receipt-header { text-align: center; margin-bottom: 8px; }
            .receipt-divider { border-top: 1px dashed #000; margin: 6px 0; }
            .receipt-row { display: flex; justify-content: space-between; padding: 2px 0; }
            .receipt-item-name { max-width: 60%; }
            .receipt-total-row { font-weight: bold; font-size: 14px; }
            .receipt-footer { text-align: center; margin-top: 8px; font-size: 10px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!order) return null;

  return (
    <div className="receipt-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-paper" ref={receiptRef}>
          {/* Header */}
          <div className="receipt-header">
            <div className="receipt-store-name">MICRONSOFT SOLUTIONS</div>
            <div className="receipt-store-sub">(Pvt) Ltd</div>
            <div className="receipt-store-address">123 Tech Street, Colombo</div>
            <div className="receipt-store-phone">Tel: +94 11 234 5678</div>
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-row">
            <span>Order #</span>
            <span>{order.order_number?.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="receipt-row">
            <span>Date</span>
            <span>{order.created_at || new Date().toLocaleString()}</span>
          </div>

          <div className="receipt-divider"></div>

          {/* Items */}
          <div className="receipt-items-header">
            <div className="receipt-row" style={{ fontWeight: 'bold' }}>
              <span>Item</span>
              <span>Total</span>
            </div>
          </div>

          {order.items?.map((item, index) => (
            <div key={index} className="receipt-item">
              <div className="receipt-row">
                <span className="receipt-item-name">{item.product_name}</span>
                <span>${parseFloat(item.line_total).toFixed(2)}</span>
              </div>
              <div className="receipt-item-qty">
                {item.quantity} × ${parseFloat(item.unit_price).toFixed(2)}
              </div>
            </div>
          ))}

          <div className="receipt-divider"></div>

          {/* Total */}
          <div className="receipt-row receipt-total-row">
            <span>GRAND TOTAL</span>
            <span>${parseFloat(order.total_amount).toFixed(2)}</span>
          </div>

          <div className="receipt-divider"></div>

          {/* Footer */}
          <div className="receipt-footer">
            <p>Thank you for your purchase!</p>
            <p>www.micronsoftsolutions.com</p>
            <p style={{ marginTop: '8px' }}>──────────────────────</p>
          </div>
        </div>

        {/* Action Buttons (outside the printable area) */}
        <div className="receipt-actions">
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ Print Receipt
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default Receipt;
