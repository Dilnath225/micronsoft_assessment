from django.contrib import admin
from .models import Product, Transaction, Order, OrderItem


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'price', 'stock', 'emoji')
    search_fields = ('name',)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'quantity', 'total_price', 'created_at')
    list_filter = ('created_at', 'product')
    ordering = ('-created_at',)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'unit_price', 'line_total')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'total_amount', 'created_at')
    ordering = ('-created_at',)
    inlines = [OrderItemInline]
