from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.db.models import Sum, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta

from .models import Product, Transaction, Order, OrderItem


# =============================================================================
# Challenge 01: High-Concurrency Purchase Endpoint
# =============================================================================

class PurchaseView(APIView):
    """
    POST /api/purchase/
    
    Handles high-concurrency flash sale purchases.
    Uses select_for_update() to acquire a row-level lock on the product,
    preventing race conditions where multiple requests could oversell stock.
    Wrapped in transaction.atomic() to ensure data integrity.
    """

    def post(self, request):
        product_id = request.data.get('product_id')
        
        # Validate quantity
        try:
            quantity = int(request.data.get('quantity', 1))
            if quantity <= 0:
                return Response(
                    {"message": "Quantity must be a positive integer."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {"message": "Invalid quantity provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                # select_for_update() acquires a row-level lock.
                # Other concurrent transactions trying to update the same row
                # will block here until this transaction completes.
                product = Product.objects.select_for_update().get(id=product_id)

                if product.stock >= quantity:
                    product.stock -= quantity
                    product.save()

                    Transaction.objects.create(
                        product=product,
                        quantity=quantity,
                        total_price=product.price * quantity
                    )
                    return Response({
                        "message": "Purchase successful!",
                        "remaining_stock": product.stock
                    }, status=status.HTTP_200_OK)
                else:
                    return Response(
                        {"message": "Out of stock!"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        except Product.DoesNotExist:
            return Response(
                {"message": "Product not found!"},
                status=status.HTTP_404_NOT_FOUND
            )


# =============================================================================
# Challenge 02: Analytics / Big Data Aggregation
# =============================================================================

class AnalyticsView(APIView):
    """
    GET /api/analytics/
    
    Returns daily revenue for the last 30 days and the top 5 selling products.
    All aggregation is done at the database level for performance — no records
    are loaded into Python memory. Combined with db_index on created_at and
    product FK, this ensures sub-500ms response times on 100k+ records.
    """

    def get(self, request):
        try:
            now = timezone.now()
            thirty_days_ago = now - timedelta(days=30)

            # 1. Daily revenue for the last 30 days
            # Uses TruncDate to group transactions by calendar date,
            # then aggregates the total_price at the database level.
            daily_revenue = (
                Transaction.objects
                .filter(created_at__gte=thirty_days_ago)
                .annotate(date=TruncDate('created_at'))
                .values('date')
                .annotate(revenue=Sum('total_price'))
                .order_by('date')
            )

            # 2. Top 5 best-selling products (all-time)
            top_products = (
                Transaction.objects
                .values('product__name')
                .annotate(
                    total_sold=Sum('quantity'),
                    total_earned=Sum('total_price')
                )
                .order_by('-total_sold')[:5]
            )

            # 3. Overall total revenue
            total_revenue = (
                Transaction.objects.aggregate(
                    total_revenue=Sum('total_price')
                )['total_revenue'] or 0
            )

            return Response({
                "message": "Analytics generated successfully",
                "total_revenue": float(total_revenue),
                "daily_revenue": [
                    {
                        "date": entry['date'].strftime('%Y-%m-%d'),
                        "revenue": float(entry['revenue'])
                    }
                    for entry in daily_revenue
                ],
                "top_products": list(top_products)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# =============================================================================
# Challenge 03: POS System
# =============================================================================

class ProductListView(APIView):
    """
    GET /api/products/
    
    Returns all available products for the POS product selection grid.
    """

    def get(self, request):
        products = Product.objects.filter(stock__gt=0).values(
            'id', 'name', 'price', 'stock', 'emoji'
        )
        return Response(list(products), status=status.HTTP_200_OK)


class CheckoutView(APIView):
    """
    POST /api/checkout/
    
    Processes a POS checkout. Accepts a full cart payload and creates an Order
    with OrderItems. Uses transaction.atomic() to ensure transactional integrity:
    if ANY single item fails to save (e.g., insufficient stock), the ENTIRE
    order is rolled back — no partial orders are ever committed.
    
    Expected payload:
    {
        "items": [
            {"product_id": 1, "quantity": 2},
            {"product_id": 3, "quantity": 1}
        ],
        "total_amount": 150.00
    }
    """

    def post(self, request):
        items_data = request.data.get('items', [])
        total_amount = request.data.get('total_amount', 0)

        if not items_data:
            return Response(
                {"message": "Cart is empty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Wrap the ENTIRE checkout in a single atomic block.
            # If any item fails, everything rolls back automatically.
            with transaction.atomic():
                order = Order.objects.create(total_amount=total_amount)
                order_items_response = []

                for item in items_data:
                    product_id = item.get('product_id')
                    quantity = int(item.get('quantity', 1))

                    # Lock the product row to prevent concurrent stock issues
                    product = Product.objects.select_for_update().get(
                        id=product_id
                    )

                    if product.stock < quantity:
                        # This will trigger the atomic rollback for ALL items
                        raise ValueError(
                            f"Insufficient stock for '{product.name}'. "
                            f"Available: {product.stock}, Requested: {quantity}"
                        )

                    # Deduct stock
                    product.stock -= quantity
                    product.save()

                    line_total = product.price * quantity

                    # Create the order item
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=quantity,
                        unit_price=product.price,
                        line_total=line_total
                    )

                    order_items_response.append({
                        "product_name": product.name,
                        "quantity": quantity,
                        "unit_price": float(product.price),
                        "line_total": float(line_total)
                    })

                return Response({
                    "message": "Checkout successful!",
                    "order_number": str(order.order_number),
                    "total_amount": float(order.total_amount),
                    "items": order_items_response,
                    "created_at": order.created_at.strftime('%Y-%m-%d %H:%M:%S')
                }, status=status.HTTP_201_CREATED)

        except Product.DoesNotExist:
            return Response(
                {"message": "One or more products not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response(
                {"message": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )