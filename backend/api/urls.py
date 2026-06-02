from django.urls import path
from .views import PurchaseView, AnalyticsView, ProductListView, CheckoutView

urlpatterns = [
    # Challenge 01: High-Concurrency Purchase
    path('purchase/', PurchaseView.as_view(), name='purchase'),

    # Challenge 02: Big Data Analytics
    path('analytics/', AnalyticsView.as_view(), name='analytics'),

    # Challenge 03: POS System
    path('products/', ProductListView.as_view(), name='products'),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
]