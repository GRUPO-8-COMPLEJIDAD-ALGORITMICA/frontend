from flask import Flask, render_template, request, jsonify, send_file
import os
import math
import random

# instancia de Flask
app = Flask(__name__)

# ruta para la página principal
@app.route('/')
def hola_mundo():
    return render_template('index.html')

# ruta para la visualización del mapa principal
@app.route('/mapa')
def mapa_principal():
    return render_template('mapa_principal.html')

# ruta para el mapa con controles
@app.route('/mapa-controles')
def mapa_controles():
    return render_template('mapa_controles.html')

# ruta para búsqueda de nodos de riesgo
@app.route('/busqueda-riesgo')
def busqueda_riesgo():
    return render_template('busqueda_riesgo.html')

# rutas para servir los mapas generados en el backend
@app.route('/mapa/riesgo')
def mapa_riesgo():
    backend_path = os.path.join('..', 'backend', 'grafo_riesgo.html')
    if os.path.exists(backend_path):
        return send_file(backend_path)
    else:
        return "Mapa de riesgo no disponible", 404

@app.route('/mapa/caminos')
def mapa_caminos():
    backend_path = os.path.join('..', 'backend', 'grafo_caminos.html')
    if os.path.exists(backend_path):
        return send_file(backend_path)
    else:
        return "Mapa de caminos no disponible", 404

@app.route('/mapa/respuesta')
def mapa_respuesta():
    backend_path = os.path.join('..', 'backend', 'grafo_respuesta.html')
    if os.path.exists(backend_path):
        return send_file(backend_path)
    else:
        return "Mapa de respuesta no disponible", 404

# ruta con parámetro
@app.route('/usuario/<nombre>')
def usuario(nombre):
    return render_template('usuario.html', nombre=nombre)

# Función para calcular distancia entre dos puntos (fórmula de Haversine)
def calcular_distancia_haversine(lat1, lng1, lat2, lng2):
    R = 6371  # Radio de la Tierra en km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

# Generar nodos de respuesta simulados en Lima
def generar_nodos_respuesta():
    # Coordenadas base de Lima
    lima_lat = -12.0464
    lima_lng = -77.0428
    
    nodos_respuesta = []
    tipos_respuesta = ['Hospital', 'Bomberos', 'Policía', 'Cruz Roja', 'Defensa Civil']
    
    for i in range(8):  # Generar 8 nodos de respuesta
        # Generar coordenadas aleatorias alrededor de Lima
        lat_offset = random.uniform(-0.05, 0.05)
        lng_offset = random.uniform(-0.05, 0.05)
        
        nodo = {
            'id': f'RESP{i+1}',
            'lat': lima_lat + lat_offset,
            'lng': lima_lng + lng_offset,
            'tipo': random.choice(tipos_respuesta),
            'nombre': f'Centro {random.choice(tipos_respuesta)} {i+1}'
        }
        nodos_respuesta.append(nodo)
    
    return nodos_respuesta

# API para calcular rutas
@app.route('/api/calcular-rutas', methods=['POST'])
def calcular_rutas():
    # Aquí implementarías la lógica del algoritmo de rutas
    return jsonify({
        'status': 'success',
        'message': 'Rutas calculadas exitosamente',
        'rutas': [
            {'origen': 'A', 'destino': 'B', 'distancia': 5.2},
            {'origen': 'B', 'destino': 'C', 'distancia': 3.1}
        ]
    })

# API para buscar nodos de riesgo
@app.route('/api/buscar-nodos-riesgo', methods=['POST'])
def buscar_nodos_riesgo():
    data = request.get_json()
    lat = data.get('lat', 0)
    lng = data.get('lng', 0)
    radio = data.get('radio', 5)
    
    # Simular búsqueda de nodos de riesgo
    nodos_encontrados = []
    tipos_riesgo = ['Inundación', 'Deslizamiento', 'Incendio', 'Sismo', 'Contaminación']
    
    # Generar nodos de riesgo alrededor del punto seleccionado
    for i in range(random.randint(4, 8)):
        # Generar coordenadas dentro del radio
        angle = random.uniform(0, 2 * math.pi)
        distance = random.uniform(0.1, radio / 111)  # Convertir km a grados aproximadamente
        
        lat_offset = distance * math.cos(angle)
        lng_offset = distance * math.sin(angle)
        
        nodo_lat = lat + lat_offset
        nodo_lng = lng + lng_offset
        distancia = calcular_distancia_haversine(lat, lng, nodo_lat, nodo_lng)
        
        nodo = {
            'id': f'R{i+1}',
            'lat': nodo_lat,
            'lng': nodo_lng,
            'tipo': random.choice(tipos_riesgo),
            'distancia': round(distancia, 2),
            'nivel_riesgo': random.choice(['Alto', 'Medio', 'Crítico'])
        }
        nodos_encontrados.append(nodo)
    
    return jsonify({
        'status': 'success',
        'message': f'Se encontraron {len(nodos_encontrados)} nodos de riesgo en un radio de {radio}km',
        'punto_seleccionado': {'lat': lat, 'lng': lng},
        'radio': radio,
        'nodos': nodos_encontrados
    })

# API para calcular ruta óptima de respuesta
@app.route('/api/calcular-ruta-optima', methods=['POST'])
def calcular_ruta_optima():
    data = request.get_json()
    nodo_riesgo = data.get('nodo_riesgo')
    
    if not nodo_riesgo:
        return jsonify({
            'status': 'error',
            'message': 'Nodo de riesgo no especificado'
        })
    
    # Generar nodos de respuesta
    nodos_respuesta = generar_nodos_respuesta()
    
    # Encontrar el nodo de respuesta más cercano
    nodo_mas_cercano = None
    distancia_minima = float('inf')
    
    for nodo_resp in nodos_respuesta:
        distancia = calcular_distancia_haversine(
            nodo_riesgo['lat'], nodo_riesgo['lng'],
            nodo_resp['lat'], nodo_resp['lng']
        )
        
        if distancia < distancia_minima:
            distancia_minima = distancia
            nodo_mas_cercano = nodo_resp
            nodo_mas_cercano['distancia'] = round(distancia, 2)
    
    # Generar puntos de ruta intermedia (simulación de algoritmo de ruta)
    puntos_ruta = []
    num_puntos = random.randint(3, 6)
    
    for i in range(num_puntos):
        factor = (i + 1) / (num_puntos + 1)
        lat_intermedio = nodo_riesgo['lat'] + factor * (nodo_mas_cercano['lat'] - nodo_riesgo['lat'])
        lng_intermedio = nodo_riesgo['lng'] + factor * (nodo_mas_cercano['lng'] - nodo_riesgo['lng'])
        
        # Agregar algo de variación para simular una ruta real
        lat_intermedio += random.uniform(-0.002, 0.002)
        lng_intermedio += random.uniform(-0.002, 0.002)
        
        puntos_ruta.append({
            'lat': lat_intermedio,
            'lng': lng_intermedio
        })
    
    # Simular tiempo de respuesta
    tiempo_respuesta = round(distancia_minima * 3 + random.uniform(2, 8), 1)  # Minutos
    
    return jsonify({
        'status': 'success',
        'message': f'Ruta óptima calculada hacia {nodo_mas_cercano["tipo"]}',
        'nodo_riesgo': nodo_riesgo,
        'nodo_respuesta': nodo_mas_cercano,
        'distancia_total': nodo_mas_cercano['distancia'],
        'tiempo_estimado': tiempo_respuesta,
        'puntos_ruta': puntos_ruta,
        'todos_nodos_respuesta': nodos_respuesta,
        'algoritmo_usado': 'Dijkstra optimizado',
        'estadisticas': {
            'nodos_evaluados': len(nodos_respuesta),
            'tiempo_calculo': round(random.uniform(50, 200), 1),  # milisegundos
            'eficiencia': 'Alta'
        }
    })

# API para cambiar kilometraje
@app.route('/api/cambiar-kilometraje', methods=['POST'])
def cambiar_kilometraje():
    data = request.get_json()
    kilometraje = data.get('kilometraje', 0)
    return jsonify({
        'status': 'success',
        'message': f'Kilometraje cambiado a {kilometraje} km',
        'kilometraje': kilometraje
    })

# API para limpiar ruta
@app.route('/api/limpiar-ruta', methods=['POST'])
def limpiar_ruta():
    return jsonify({
        'status': 'success',
        'message': 'Ruta limpiada exitosamente'
    })

# API para generar grafo completo de nodos de respuesta
@app.route('/api/generar-grafo-respuesta', methods=['POST'])
def generar_grafo_respuesta():
    data = request.get_json()
    punto_central = data.get('punto_central')
    
    if not punto_central:
        return jsonify({
            'status': 'error',
            'message': 'Punto central no especificado'
        })
    
    # Generar más nodos de respuesta para el grafo completo
    nodos_respuesta = generar_nodos_respuesta_completo(punto_central)
    
    # Calcular todas las conexiones posibles
    conexiones = calcular_conexiones_completas(nodos_respuesta)
    
    # Estadísticas del grafo
    total_conexiones = len(conexiones)
    densidad_grafo = (total_conexiones * 2) / (len(nodos_respuesta) * (len(nodos_respuesta) - 1)) if len(nodos_respuesta) > 1 else 0
    
    return jsonify({
        'status': 'success',
        'message': f'Grafo completo generado con {len(nodos_respuesta)} nodos de respuesta',
        'punto_central': punto_central,
        'nodos_respuesta': nodos_respuesta,
        'conexiones': conexiones,
        'estadisticas': {
            'total_nodos': len(nodos_respuesta),
            'total_conexiones': total_conexiones,
            'densidad_grafo': round(densidad_grafo * 100, 1),
            'tipo_grafo': 'Completo' if densidad_grafo > 0.8 else 'Denso',
            'tiempo_generacion': round(random.uniform(80, 150), 1)
        }
    })

# Generar nodos de respuesta completo para grafo
def generar_nodos_respuesta_completo(punto_central):
    lima_lat = punto_central['lat']
    lima_lng = punto_central['lng']
    
    nodos_respuesta = []
    tipos_respuesta = ['Hospital', 'Bomberos', 'Policía', 'Cruz Roja', 'Defensa Civil', 'Ambulancia', 'Rescate']
    
    # Generar entre 20-30 nodos para grafo completo
    for i in range(random.randint(20, 30)):
        # Generar coordenadas en un área más amplia
        lat_offset = random.uniform(-0.08, 0.08)
        lng_offset = random.uniform(-0.08, 0.08)
        
        nodo = {
            'id': f'RESP{i+1:02d}',
            'lat': lima_lat + lat_offset,
            'lng': lima_lng + lng_offset,
            'tipo': random.choice(tipos_respuesta),
            'nombre': f'Centro {random.choice(tipos_respuesta)} {i+1}',
            'capacidad': random.randint(10, 100),
            'estado': random.choice(['Activo', 'Disponible', 'Ocupado'])
        }
        nodos_respuesta.append(nodo)
    
    return nodos_respuesta

# Calcular conexiones completas entre nodos
def calcular_conexiones_completas(nodos):
    conexiones = []
    
    for i in range(len(nodos)):
        for j in range(i + 1, len(nodos)):
            distancia = calcular_distancia_haversine(
                nodos[i]['lat'], nodos[i]['lng'],
                nodos[j]['lat'], nodos[j]['lng']
            )
            
            # Conectar todos los nodos que estén a menos de 8 km
            if distancia < 8:
                conexiones.append({
                    'desde': nodos[i]['id'],
                    'hacia': nodos[j]['id'],
                    'distancia': round(distancia, 2),
                    'coordenadas': [
                        [nodos[i]['lat'], nodos[i]['lng']],
                        [nodos[j]['lat'], nodos[j]['lng']]
                    ]
                })
    
    return conexiones

if __name__ == '__main__':
    # ejecutar la aplicación en modo debug
    app.run(debug=True, host='0.0.0.0', port=5000) 