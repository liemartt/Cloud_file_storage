import json

from django.views.generic import TemplateView, View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.apps import apps
from django.http.response import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.contrib.auth.models import User
from django.urls import reverse

from ..models import SharedFile


class ShareFileView(LoginRequiredMixin, View):
    def post(self, request, *args, **kwargs):
        s3_service = apps.get_app_config("cloud").s3_service
        
        request_body = json.loads(request.body.decode("utf-8"))
        object_name = request_body.get("nameObject")
        username = request_body.get("username")
        
        current_path = request.GET.get("path", "").strip("/")
        
        # Check if the user exists
        try:
            recipient = User.objects.get(username=username)
            
            # Don't allow sharing with yourself
            if recipient.id == request.user.id:
                return JsonResponse({"error": "Нельзя поделиться файлом с самим собой"}, status=400)
            
            # Create the full path for the file
            file_path = s3_service.create_path(request.user.id, object_name, current_path)
            
            # Create the shared file record
            SharedFile.objects.create(
                owner=request.user,
                shared_with=recipient,
                file_path=file_path,
                original_name=object_name
            )
            
            return JsonResponse({"success": True}, status=201)
            
        except User.DoesNotExist:
            return JsonResponse({"error": "Пользователь не найден"}, status=404)


class SharedFilesView(LoginRequiredMixin, TemplateView):
    template_name = "cloud/layouts/shared_files.html"
    
    def get(self, request, *args, **kwargs):
        # Get files shared with the current user
        shared_files = SharedFile.objects.filter(shared_with=request.user).order_by('-shared_at')
        
        return self.render_to_response({
            'shared_files': shared_files
        })


class DownloadSharedFileView(LoginRequiredMixin, View):
    def get(self, request, pk, *args, **kwargs):
        s3_service = apps.get_app_config("cloud").s3_service
        
        # Get the shared file record
        shared_file = get_object_or_404(SharedFile, pk=pk, shared_with=request.user)
        
        # Extract the user ID from the file path (format: user-{id}-files/...)
        path_parts = shared_file.file_path.split('/')
        owner_id = int(path_parts[0].split('-')[1])
        
        # Get the file name and path
        file_name = shared_file.original_name
        path_without_filename = '/'.join(path_parts[1:-1]) if len(path_parts) > 2 else ""
        
        # Get the file bytes
        object_bytes = s3_service.get_object_bytes(
            owner_id, file_name, path_without_filename
        )
        object_bytes.seek(0)
        
        from django.http import FileResponse
        return FileResponse(
            object_bytes,
            filename=file_name if not file_name.endswith("/") else file_name.strip("/") + ".zip",
            as_attachment=True,
            content_type="application/octet-stream",
        ) 