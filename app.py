from flask import Flask, render_template, request, jsonify, send_file
import os

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
    return f'<h2>¡Hola {nombre}!</h2><p>Bienvenido a nuestra aplicación Flask.</p>'

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

if __name__ == '__main__':
    # ejecutar la aplicación en modo debug
    app.run(debug=True, host='0.0.0.0', port=5000) 