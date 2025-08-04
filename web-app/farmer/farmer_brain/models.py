from django.db import models

class Plants(models.Model):
    plant = models.CharField(max_length=255, unique=True, null=False)
    urea_kg_ha = models.CharField(max_length=255)
    tsp_kg_ha = models.CharField(max_length=255)
    mop_kg_ha = models.CharField(max_length=255)

class Farming_Suggesstions(models.Model):
    plant = models.ForeignKey(Plants, on_delete=models.CASCADE, default=1)
    suggestions = models.JSONField(null=True, blank=True, default=[])



