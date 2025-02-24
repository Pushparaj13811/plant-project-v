from django.core.management.base import BaseCommand
from users.models import User, Plant

class Command(BaseCommand):
    help = 'Seeds a superadmin user and a default plant'

    def handle(self, *args, **options):
        try:
            # Delete existing user if exists
            User.objects.filter(email="admin@example.com").delete()

            # Create default plant
            plant, created = Plant.objects.get_or_create(
                name="Main Plant",
                defaults={
                    "address": "123 Main Street, City"
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS('Created default plant'))

            # Create new superuser
            user = User.objects.create_superuser(
                email="admin@example.com",
                password="admin123@#$",
                first_name="Super",
                last_name="Admin",
                plant=plant
            )
            
            self.stdout.write(self.style.SUCCESS(f'''
            Superadmin credentials:
            Email: admin@example.com
            Password: admin123@#$
            '''))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}')) 