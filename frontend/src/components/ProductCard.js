import React from 'react';

function ProductCard({ product, onAdd }) {
  return (
    <button
      className="product-card"
      onClick={() => onAdd(product)}
      id={`product-${product.id}`}
    >
      <div className="product-card-emoji">{product.emoji || '📦'}</div>
      <h3 className="product-card-name">{product.name}</h3>
      <div className="product-card-price">
        ${parseFloat(product.price).toFixed(2)}
      </div>
      <div className="product-card-stock">
        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
      </div>
    </button>
  );
}

export default ProductCard;
