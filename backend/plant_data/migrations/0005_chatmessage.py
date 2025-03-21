# Generated by Django 5.0.2 on 2025-03-19 15:09

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plant_data', '0004_populate_formula_variables'),
        ('users', '0004_role_alter_user_role'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ChatMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('role', models.CharField(choices=[('user', 'User'), ('assistant', 'Assistant')], max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('plant', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='users.plant')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
