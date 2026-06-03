import React from 'react';

function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <div className="cart-item" id={`cart-item-${item.id}`}>
      <div className="cart-item-info">
        <span className="cart-item-emoji">{item.emoji || '📦'}</span>
        <div className="cart-item-details">
          <span className="cart-item-name">{item.name}</span>
          <span className="cart-item-price">
            ${parseFloat(item.price).toFixed(2)} each
          </span>
        </div>
      </div>

      <div className="cart-item-controls">
        <div className="quantity-controls">
          <button
            className="qty-btn"
            onClick={() => onDecrease(item.id)}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="qty-value">{item.quantity}</span>
          <button
            className="qty-btn"
            onClick={() => onIncrease(item.id)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <span className="cart-item-total">
          ${(item.price * item.quantity).toFixed(2)}
        </span>

        <button
          className="cart-item-remove"
          onClick={() => onRemove(item.id)}
          aria-label="Remove item"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default CartItem;
