import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { fetchProducts, submitCheckout } from '../services/api';
import ProductCard from '../components/ProductCard';
import CartItem from '../components/CartItem';
import Receipt from '../components/Receipt';

function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // Load products from API
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetchProducts();
      setProducts(response.data);
      setLoading(false);
    } catch (err) {
      toast.error('Failed to load products. Is the Django server running?');
      setLoading(false);
    }
  };

  // Add product to cart
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Only ${product.stock} units available for ${product.name}`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      toast.success(`${product.name} added to cart`);
      return [
        ...prevCart,
        {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          emoji: product.emoji,
          quantity: 1,
          maxStock: product.stock,
        },
      ];
    });
  };

  // Increase quantity
  const increaseQty = (productId) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === productId) {
          if (item.quantity >= item.maxStock) {
            toast.error(`Maximum stock reached for ${item.name}`);
            return item;
          }
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      })
    );
  };

  // Decrease quantity
  const decreaseQty = (productId) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  // Calculate grand total
  const grandTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Handle checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    setCheckingOut(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        total_amount: grandTotal,
      };

      const response = await submitCheckout(payload);
      toast.success('Checkout successful!');
      setReceipt(response.data);
      setCart([]);
      // Reload products to reflect updated stock
      loadProducts();
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Checkout failed. Please try again.';
      toast.error(msg);
    } finally {
      setCheckingOut(false);
    }
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    toast('Cart cleared', { icon: '🗑️' });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="pos-layout">
      {/* Left Panel: Product Selection */}
      <div className="pos-products-panel">
        <div className="panel-header">
          <h2>Products</h2>
          <span className="badge">{products.length} items</span>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={addToCart}
            />
          ))}
        </div>
      </div>

      {/* Right Panel: Shopping Cart */}
      <div className="pos-cart-panel">
        <div className="panel-header">
          <h2>Shopping Cart</h2>
          {cart.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearCart}>
              Clear
            </button>
          )}
        </div>

        <div className="cart-items-container">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <span className="cart-empty-icon">🛒</span>
              <p>Cart is empty</p>
              <p className="cart-empty-hint">Click on products to add them</p>
            </div>
          ) : (
            cart.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onIncrease={increaseQty}
                onDecrease={decreaseQty}
                onRemove={removeFromCart}
              />
            ))
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary">
              <div className="cart-summary-row">
                <span>Items</span>
                <span>{cart.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <div className="cart-summary-row cart-grand-total">
                <span>Grand Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>
            <button
              className="btn btn-checkout"
              onClick={handleCheckout}
              disabled={checkingOut}
              id="checkout-btn"
            >
              {checkingOut ? (
                <>
                  <span className="loading-spinner-sm"></span> Processing...
                </>
              ) : (
                <>💳 Checkout — ${grandTotal.toFixed(2)}</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Receipt Modal (Bonus) */}
      {receipt && (
        <Receipt order={receipt} onClose={() => setReceipt(null)} />
      )}
    </div>
  );
}

export default POS;
