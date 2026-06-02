from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum
from .models import Product, Transaction

class PurchaseProduct(APIView):
    def post(self, request):
        product_id = request.data.get('product_id')
        
        # Ensure quantity is provided and is a valid integer
        try:
            quantity = int(request.data.get('quantity', 1))
        except ValueError:
            return Response({"message": "Invalid quantity provided."}, status=400)

        try:
            # Use atomic transaction to ensure data integrity
            with transaction.atomic():
                # select_for_update() locks the selected row until the transaction completes.
                # This prevents race conditions during high-concurrency (e.g., flash sales).
                product = Product.objects.select_for_update().get(id=product_id)
                
                if product.stock >= quantity:
                    # Deduct the stock
                    product.stock -= quantity
                    product.save()
                    
                    # Record the transaction
                    Transaction.objects.create(
                        product=product,
                        quantity=quantity,
                        total_price=product.price * quantity
                    )
                    return Response({"message": "Purchase successful!"}, status=200)
                else:
                    return Response({"message": "Out of stock!"}, status=400)
                    
        except Product.DoesNotExist:
            return Response({"message": "Product not found!"}, status=404)
        except Exception as e:
            return Response({"message": str(e)}, status=500)


class SalesReport(APIView):
    def get(self, request):
        try:
            # 1. Calculate total revenue (at the Database level for optimization)
            revenue_data = Transaction.objects.aggregate(total_revenue=Sum('total_price'))
            total_revenue = revenue_data['total_revenue'] or 0

            # 2. Get the top 5 selling products (Optimized Query without loading all records into RAM)
            top_products = Transaction.objects.values('product__name') \
                .annotate(
                    total_sold=Sum('quantity'),
                    total_earned=Sum('total_price')
                ).order_by('-total_sold')[:5]

            return Response({
                "message": "Report generated successfully",
                "total_revenue": total_revenue,
                "top_products": list(top_products)
            }, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)