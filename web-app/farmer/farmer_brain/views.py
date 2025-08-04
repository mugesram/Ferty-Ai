from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import Plants, Farming_Suggesstions

def index_view(request):
    data = {'name': 'index'}


    return render(request, 'index.html', data)

def chatbot_view(request):

    return render(request, 'chatbot.html', {'name': 'chatbot'})

def connect_view(request):
    data = {'name': 'connect',
            'plants': Plants.objects.all()}
    print(data)
    return render(request, 'connect.html', data)

def calculate_npk(request,n,p,k,plant_id):
    dic_conversion = {
        'n': (28 / 60),
        'p': (22.5 / 100),
        'k': (52.5 / 100),
        'dens': 3.6
    }
    def convert_to_mg_kg(nutri,value):

        return (dic_conversion[nutri]*value)/dic_conversion['dens']

    def convert_to_kg_ha(nutri,value):
        return (value/dic_conversion[nutri])*dic_conversion['dens']

    def compare(bar,read):
        if bar-1 <= read <= bar+1:
            return 'Average'
        elif read < bar-1:
            return 'Low'
        else:
            return 'High'
    n = float(n)
    p = float(p)
    k = float(k)
    plant = Plants.objects.get(id=plant_id)
    n_bar = convert_to_mg_kg('n', float(plant.urea_kg_ha))
    p_bar = convert_to_mg_kg('p', float(plant.tsp_kg_ha))
    k_bar = convert_to_mg_kg('k', float(plant.mop_kg_ha))

    def ferfertilizer_sugesstion(nutri,read, bar):
        fertilizers = {
            'n': ['Urea', 'Nitrogen'],
            'p': ['TSP', 'Phosphorous'],
            'k': ['MOP', 'Potassium'],
        }
        compared = compare(bar, read)
        if compared == 'Average':
            return f"{fertilizers[nutri][1]} Fertilizer is in border level check after some weeks."
        elif compared == 'Low':
            need = round(convert_to_kg_ha(nutri, bar-read),2)
            return f"{need} Kg/ha of {fertilizers[nutri][0]} have to be added to soil."
        else:
            ''

    fertilizer_sugesstions = [ferfertilizer_sugesstion('n',n,n_bar), ferfertilizer_sugesstion('p',p,p_bar), ferfertilizer_sugesstion('k',k,k_bar)]
    result = "</li><li>".join ([sugesstion for sugesstion in fertilizer_sugesstions if sugesstion])
    data = {
        'ok':True,
        'n': compare(n_bar, n),
        'p': compare(p_bar, p),
        'k': compare(k_bar, k),
        'suggestions': Farming_Suggesstions.objects.get(plant=plant).suggestions
    }

    if result:
        data['fertilizer_suggestions'] = "<ul><li>" +  result + "</ul></li>"
    else:
        data['fertilizer_suggestions'] = "Fertilizer level in your soil is perfect for your selected plant,For more conformation if you want recheck it after some weeks during the plantation."



    return JsonResponse(data)






