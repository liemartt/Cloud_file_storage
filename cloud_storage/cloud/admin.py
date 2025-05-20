from django.contrib import admin
from .models import SharedFile

@admin.register(SharedFile)
class SharedFileAdmin(admin.ModelAdmin):
    list_display = ('original_name', 'owner', 'shared_with', 'shared_at')
    list_filter = ('shared_at', 'owner', 'shared_with')
    search_fields = ('original_name', 'owner__username', 'shared_with__username')
    date_hierarchy = 'shared_at'
