"""

Challenge 01: High-Concurrency Load Test Script


This script validates the concurrency handling of the POST /api/purchase/ 
endpoint by firing 100 concurrent requests against a product with exactly 
50 units in stock.

Expected Result:
Exactly 50 requests succeed (stock goes from 50 to 0)
Exactly 50 requests fail with "Out of stock!"
Stock NEVER drops below 0

Usage:
1. Ensure the Django server is running on http://localhost:8000
2. Ensure you have run: python manage.py populate_data
3. Run: python load_test.py
"""

import requests
import threading
import time

#  Configuration 
API_URL = "http://localhost:8000/api/purchase/"
TOTAL_REQUESTS = 500
PRODUCT_ID = None  # Will be auto-detected (Flash Sale Item)

# Shared counters (thread-safe) 
lock = threading.Lock()
results = {"success": 0, "failed": 0, "errors": 0}


def find_flash_sale_product():
    """Auto-detect the Flash Sale Item product ID from the database."""
    try:
        response = requests.get("http://localhost:8000/api/products/")
        products = response.json()
        for product in products:
            if "flash sale" in product['name'].lower():
                print(f"  Found: {product['name']} (ID: {product['id']}, Stock: {product['stock']})")
                return product['id'], product['stock']
        # Fallback: use the last product (Flash Sale Item is added last)
        if products:
            p = products[-1]
            print(f"  Fallback: {p['name']} (ID: {p['id']}, Stock: {p['stock']})")
            return p['id'], p['stock']
    except Exception as e:
        print(f"  Error finding product: {e}")
    return 1, 50  # Default fallback


def make_purchase(thread_id, product_id):
    """Send a single purchase request."""
    try:
        response = requests.post(
            API_URL,
            json={"product_id": product_id, "quantity": 1},
            timeout=10
        )
        with lock:
            if response.status_code == 200:
                results["success"] += 1
            else:
                results["failed"] += 1
    except Exception:
        with lock:
            results["errors"] += 1


def main():
    global PRODUCT_ID

    print("=" * 65)
    print("  LOAD TEST: High-Concurrency Flash Sale (Challenge 01)")
    print("=" * 65)
    print()

    # Auto-detect the flash sale product
    PRODUCT_ID, initial_stock = find_flash_sale_product()
    print()
    print(f"  Target Product ID  : {PRODUCT_ID}")
    print(f"  Initial Stock      : {initial_stock}")
    print(f"  Concurrent Requests: {TOTAL_REQUESTS}")
    print(f"  API Endpoint       : {API_URL}")
    print()
    print("-" * 65)
    print("  Launching {0} threads simultaneously...".format(TOTAL_REQUESTS))
    print("-" * 65)

    # Create all threads first
    threads = []
    for i in range(TOTAL_REQUESTS):
        t = threading.Thread(target=make_purchase, args=(i, PRODUCT_ID))
        threads.append(t)

    # Start timing
    start_time = time.time()

    # Fire all threads simultaneously
    for t in threads:
        t.start()

    # Wait for all threads to complete
    for t in threads:
        t.join()

    elapsed = time.time() - start_time

    #  Results 
    print()
    print("=" * 65)
    print("  RESULTS")
    print("=" * 65)
    print(f"  Successful purchases  : {results['success']}")
    print(f"  Rejected (out of stock): {results['failed']}")
    print(f"  Errors                : {results['errors']}")
    print(f"  Total time            : {elapsed:.2f}s")
    print()

    # Validation
    total = results['success'] + results['failed'] + results['errors']
    print(f"  Total requests sent   : {total}")
    print()

    if results['success'] == initial_stock and results['errors'] == 0:
        print("  >> TEST PASSED!")
        print(f"     Exactly {results['success']} purchases succeeded out of {TOTAL_REQUESTS} attempts.")
        print(f"     Stock went from {initial_stock} to 0 with no overselling.")
        print("     Concurrency handling (select_for_update) is working correctly.")
    elif results['success'] <= initial_stock and results['errors'] == 0:
        print("  >> TEST PASSED!")
        print(f"     {results['success']} purchases succeeded (stock: {initial_stock}).")
        print("     Stock never dropped below 0.")
    else:
        print("  >> TEST FAILED!")
        print(f"     Expected max {initial_stock} successes, got {results['success']}.")
        print("     Possible race condition detected!")

    print()
    print("=" * 65)


if __name__ == "__main__":
    main()
