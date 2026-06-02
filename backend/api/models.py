import uuid
from django.db import models
from django.utils import timezone


class Product(models.Model):
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    emoji = models.CharField(max_length=10, default='📦')

    def __str__(self):
        return self.name


class Transaction(models.Model):
    """
    Represents individual purchase transactions (Challenge 1 & 2).
    Indexed on created_at and product for fast aggregation queries
    needed by the analytics endpoint.
    """
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, db_index=True
    )
    quantity = models.IntegerField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        indexes = [
            models.Index(
                fields=['created_at', 'product'],
                name='idx_transaction_date_product'
            ),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.quantity}"


class Order(models.Model):
    """
    Represents a POS checkout order (Challenge 3).
    Groups multiple OrderItems into a single transactional unit.
    """
    order_number = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{str(self.order_number)[:8]}"


class OrderItem(models.Model):
    """
    Individual line item within a POS order.
    """
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name='items'
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"