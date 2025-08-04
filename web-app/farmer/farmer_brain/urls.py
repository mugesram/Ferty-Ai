from django.urls import path
from . import views
urlpatterns = [
    path('', views.index_view, name='index_view'),
    path('connect', views.connect_view, name='connect_view'),
    path('chatbot', views.chatbot_view, name='chatbot_view'),
    path('calculate_npk/<n>/<p>/<k>/<plant_id>', views.calculate_npk, name='calculate_npk'),
]