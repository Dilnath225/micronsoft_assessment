from django.urls import path
from .views import PurchaseProduct, SalesReport

urlpatterns = [
    path('purchase/', PurchaseProduct.as_view(), name='purchase-product'),
    path('report/', SalesReport.as_view(), name='sales-report'),
]