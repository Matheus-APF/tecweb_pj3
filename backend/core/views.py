from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes

# Endpoint Teste
@api_view(["GET"])
@permission_classes([AllowAny]) # endpoint de status continue público
def status(request):
    return Response({"status": "ok", "app": "TaskPilot"})