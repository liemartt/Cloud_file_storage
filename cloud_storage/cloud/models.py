from django.db import models
from django.contrib.auth.models import User


class SharedFile(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_files_owned')
    shared_with = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_files_received')
    file_path = models.CharField(max_length=255)
    original_name = models.CharField(max_length=255)
    shared_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('owner', 'shared_with', 'file_path')
        
    def __str__(self):
        return f"{self.original_name} shared by {self.owner.username} with {self.shared_with.username}" 