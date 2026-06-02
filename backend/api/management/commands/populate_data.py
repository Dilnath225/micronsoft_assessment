import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Product, Transaction


# Realistic product catalog with emojis for the POS display
PRODUCT_CATALOG = [
    {"name": "Wireless Mouse", "price": 29.99, "stock": 150, "emoji": "🖱️"},
    {"name": "Mechanical Keyboard", "price": 89.99, "stock": 80, "emoji": "⌨️"},
    {"name": "USB-C Hub", "price": 45.00, "stock": 200, "emoji": "🔌"},
    {"name": "Webcam HD 1080p", "price": 65.00, "stock": 120, "emoji": "📷"},
    {"name": "Noise-Cancelling Headphones", "price": 199.99, "stock": 60, "emoji": "🎧"},
    {"name": "27\" 4K Monitor", "price": 349.99, "stock": 40, "emoji": "🖥️"},
    {"name": "Laptop Stand", "price": 39.99, "stock": 300, "emoji": "💻"},
    {"name": "Desk Lamp LED", "price": 24.99, "stock": 250, "emoji": "💡"},
    {"name": "Portable SSD 1TB", "price": 109.99, "stock": 90, "emoji": "💾"},
    {"name": "Wireless Charger", "price": 19.99, "stock": 400, "emoji": "🔋"},
    # Special product for Challenge 1 load testing (exactly 50 units)
    {"name": "Flash Sale Item", "price": 9.99, "stock": 50, "emoji": "⚡"},
]


class Command(BaseCommand):
    help = 'Populates the database with realistic products and 100,000 dummy transactions'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Clearing existing data...'))
        Transaction.objects.all().delete()
        Product.objects.all().delete()

        self.stdout.write('Creating products...')
        products = []
        for item in PRODUCT_CATALOG:
            product = Product.objects.create(
                name=item['name'],
                price=item['price'],
                stock=item['stock'],
                emoji=item['emoji'],
            )
            products.append(product)
            self.stdout.write(f'  [+] {item["name"]} - ${item["price"]} ({item["stock"]} in stock)')

        self.stdout.write('')
        self.stdout.write('Generating 100,000 transaction records over 6 months...')

        end_date = timezone.now()
        start_date = end_date - timedelta(days=180)
        total_seconds = int((end_date - start_date).total_seconds())

        transactions = []
        batch_size = 5000
        created = 0

        for i in range(100000):
            product = random.choice(products)
            quantity = random.randint(1, 5)

            # Generate a random datetime within the 6-month range
            random_offset = random.randint(0, total_seconds)
            random_date = start_date + timedelta(seconds=random_offset)

            transactions.append(
                Transaction(
                    product=product,
                    quantity=quantity,
                    total_price=product.price * quantity,
                    created_at=random_date,
                )
            )

            if len(transactions) >= batch_size:
                Transaction.objects.bulk_create(transactions)
                created += len(transactions)
                transactions = []
                self.stdout.write(f'  -> Inserted {created:,} / 100,000 records...')

        # Insert any remaining records
        if transactions:
            Transaction.objects.bulk_create(transactions)
            created += len(transactions)

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'SUCCESS: Populated {created:,} transactions across {len(products)} products!'
        ))
        self.stdout.write(self.style.SUCCESS(
            'Flash Sale Item has exactly 50 units for load testing.'
        ))