from django.contrib import admin
from .models import PlantRecord, FormulaVariable

@admin.register(PlantRecord)
class PlantRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'plant', 'date', 'code', 'product', 'party_name', 'rate', 'dm')
    list_filter = ('plant', 'date', 'product')
    search_fields = ('code', 'product', 'party_name')
    readonly_fields = ('dm', 'rate_on_dm', 'oil_value', 'net_wo_oil_fiber', 
                     'starch_per_point', 'starch_value', 'grain', 'doc')
    fieldsets = (
        ('General Information', {
            'fields': ('plant', 'date', 'code', 'product', 'truck_no', 'bill_no', 'party_name')
        }),
        ('Input Variables', {
            'fields': ('rate', 'mv', 'oil', 'fiber', 'starch', 'maize_rate')
        }),
        ('Calculated Variables', {
            'fields': ('dm', 'rate_on_dm', 'oil_value', 'net_wo_oil_fiber', 
                     'starch_per_point', 'starch_value', 'grain', 'doc')
        }),
    )

@admin.register(FormulaVariable)
class FormulaVariableAdmin(admin.ModelAdmin):
    list_display = ('name', 'display_name', 'value', 'default_value', 'updated_at')
    search_fields = ('name', 'display_name')
    list_editable = ('value',)
    readonly_fields = ('default_value', 'created_at', 'updated_at')
    
    actions = ['reset_to_default']
    
    def reset_to_default(self, request, queryset):
        for variable in queryset:
            variable.reset_to_default()
        self.message_user(request, f"{queryset.count()} variables were reset to their default values.")
    reset_to_default.short_description = "Reset selected variables to default values"
