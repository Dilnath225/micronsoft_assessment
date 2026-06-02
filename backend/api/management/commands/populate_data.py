import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Product, Transaction
from faker import Faker

class Command(BaseCommand):
    help = 'Populates the database with 100,000 dummy transaction records'

    def handle(self, *args, **kwargs):
        fake = Faker()
        self.stdout.write('Creating dummy products...')
        
        # Create 10 dummy products
        products = []
        for i in range(10):
            product, created = Product.objects.get_or_create(
                name=f"Product {i+1}",
                defaults={
                    'price': round(random.uniform(10.0, 500.0), 2),
                    'stock': random.randint(100, 5000)
                }
            )
            products.append(product)

        self.stdout.write('Creating 100,000 transactions. This might take a minute...')
        
        transactions = []
        end_date = timezone.now()
        
        # Set the start date to 180 days (approx. 6 months) ago
        start_date = end_date - timedelta(days=180) 

        for _ in range(100000):
            product = random.choice(products)
            quantity = random.randint(1, 5)
            
            # Generate a random date within the last 6 months
            random_date = fake.date_time_between(start_date=start_date, end_date=end_date)
            
            # Make the datetime timezone-aware if it is naive
            random_date = timezone.make_aware(random_date) if timezone.is_naive(random_date) else random_date
            
            transactions.append(
                Transaction(
                    product=product,
                    quantity=quantity,
                    total_price=product.price * quantity,
                    created_at=random_date
                )
            )

            # Bulk create in batches of 5000 to prevent RAM overload and speed up the process
            if len(transactions) == 5000:
                Transaction.objects.bulk_create(transactions)
                transactions = []
                self.stdout.write('Inserted 5,000 records...')

        # Insert any remaining records in the list
        if transactions:
            Transaction.objects.bulk_create(transactions)

        self.stdout.write(self.style.SUCCESS('Successfully populated 100,000 transactions!'))