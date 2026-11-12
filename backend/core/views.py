from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Endpoint Teste
@api_view(["GET"])
def status(request):
    return Response({"status": "ok", "app": "TaskPilot"})