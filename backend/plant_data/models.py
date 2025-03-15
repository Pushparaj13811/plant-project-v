from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from users.models import Plant

class FormulaVariable(models.Model):
    """Model to store configurable formula variables used in calculations"""
    name = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    default_value = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.display_name} ({self.name})"

    def reset_to_default(self):
        """Reset the variable to its default value"""
        self.value = self.default_value
        self.save()

class PlantRecord(models.Model):
    # Foreign Key relationship
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE, related_name='plant_records')
    
    # Common Fields (General Information)
    date = models.DateField()
    code = models.CharField(max_length=50)
    product = models.CharField(max_length=100)
    truck_no = models.CharField(max_length=50)
    bill_no = models.CharField(max_length=50)
    party_name = models.CharField(max_length=100)
    
    # Input Variables
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    mv = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    oil = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    fiber = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    starch = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    maize_rate = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Dry Variables (Calculated)
    dm = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)], editable=False)
    rate_on_dm = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    oil_value = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    net_wo_oil_fiber = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)], editable=False)
    starch_per_point = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    starch_value = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    grain = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    doc = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['code']),
            models.Index(fields=['product']),
            models.Index(fields=['party_name']),
        ]

    def __str__(self):
        return f"{self.plant.name} - {self.date} - {self.code}"

    def save(self, *args, **kwargs):
        # Calculate derived values before saving
        self.calculate_derived_values()
        super().save(*args, **kwargs)

    def calculate_derived_values(self):
        """Calculate all derived values based on input data"""
        # Get all formula variables or use defaults if they don't exist
        try:
            dm_factor = FormulaVariable.objects.get(name='dm_factor').value
        except FormulaVariable.DoesNotExist:
            dm_factor = Decimal('100')
            
        try:
            oil_value_factor = FormulaVariable.objects.get(name='oil_value_factor').value
        except FormulaVariable.DoesNotExist:
            oil_value_factor = Decimal('60')
            
        try:
            net_factor = FormulaVariable.objects.get(name='net_factor').value
        except FormulaVariable.DoesNotExist:
            net_factor = Decimal('100')
            
        try:
            starch_per_point_divisor = FormulaVariable.objects.get(name='starch_per_point_divisor').value
        except FormulaVariable.DoesNotExist:
            starch_per_point_divisor = Decimal('64')
            
        try:
            grain_factor = FormulaVariable.objects.get(name='grain_factor').value
        except FormulaVariable.DoesNotExist:
            grain_factor = Decimal('0.70')
        
        # DM = 100 - Mv
        self.dm = dm_factor - self.mv
        
        # Rate on DM = (Rate / DM) * 100
        self.rate_on_dm = (self.rate / self.dm) * Decimal('100')
        
        # Oil Value = 60 * Oil
        self.oil_value = oil_value_factor * self.oil
        
        # Net (wo Oil & Fiber) = 100 - Oil - Fiber
        self.net_wo_oil_fiber = net_factor - self.oil - self.fiber
        
        # Starch Per Point = Maize Rate / 64
        self.starch_per_point = self.maize_rate / starch_per_point_divisor
        
        # Starch Value = Starch * Starch Per Point
        self.starch_value = self.starch * self.starch_per_point
        
        # Grain = Starch * 0.70
        self.grain = self.starch * grain_factor
        
        # DOC = Starch - Grain
        self.doc = self.starch - self.grain
