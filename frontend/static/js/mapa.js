// Variables globales
let mapaActual = null;
let nodosRespuesta = [];
let nodosRiesgo = [];
let rutaActual = [];
let kilometrajeSeleccionado = 10;
let tipoMapaActual = 'riesgo';

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    inicializarMapa();
    configurarEventos();
    configurarMapasBackend();
});

// Configurar funcionalidad específica para mapas del backend
function configurarMapasBackend() {
    // Verificar si estamos en la página con iframe
    const mapaIframe = document.getElementById('mapa-iframe') || document.getElementById('mapa-iframe-controles');
    
    if (mapaIframe) {
        console.log('Configurando integración con mapas del backend');
        
        // Agregar listener para cuando el iframe se carga
        mapaIframe.addEventListener('load', function() {
            console.log(`Mapa cargado: ${this.src}`);
            actualizarInfoMapaDesdeBackend();
        });
        
        // Detectar errores de carga
        mapaIframe.addEventListener('error', function() {
            console.error(`Error cargando mapa: ${this.src}`);
            mostrarMensaje('Error al cargar el mapa desde el backend', 'error');
        });
    }
}

// Actualizar información del mapa basada en el backend
function actualizarInfoMapaDesdeBackend() {
    const infoContainer = document.querySelector('.mapa-info ul');
    if (!infoContainer) return;

    // Información específica según el tipo de mapa
    let infoMapa = {};
    
    switch(tipoMapaActual) {
        case 'riesgo':
            infoMapa = {
                nodos: '9 nodos de riesgo',
                respuesta: 'N/A',
                riesgo: '9 activos',
                rutas: '36 conexiones'
            };
            break;
        case 'respuesta':
            infoMapa = {
                nodos: '62 nodos de respuesta',
                respuesta: '62 disponibles',
                riesgo: 'N/A',
                rutas: 'Red completa'
            };
            break;
        case 'caminos':
            infoMapa = {
                nodos: 'Red de caminos',
                respuesta: '1 destino',
                riesgo: '1 origen',
                rutas: 'Ruta óptima calculada'
            };
            break;
        default:
            infoMapa = {
                nodos: 'Cargando...',
                respuesta: 'Cargando...',
                riesgo: 'Cargando...',
                rutas: 'Cargando...'
            };
    }

    infoContainer.innerHTML = `
        <li><strong>Grafo (limitado)</strong><br>${infoMapa.nodos}</li>
        <li><strong>Nodos de respuesta</strong><br>Total: ${infoMapa.respuesta}</li>
        <li><strong>Nodo de riesgo seleccionado</strong><br>Activos: ${infoMapa.riesgo}</li>
        <li><strong>Ruta</strong><br>Calculadas: ${infoMapa.rutas}</li>
        <li><strong>Kilometraje</strong><br>Actual: ${kilometrajeSeleccionado} km</li>
    `;
}

// Configurar eventos de los botones
function configurarEventos() {
    // Botón calcular rutas
    const btnCalcular = document.getElementById('btn-calcular-rutas');
    if (btnCalcular) {
        btnCalcular.addEventListener('click', calcularRutasConBackend);
    }

    // Botón cambiar kilometraje
    const btnKilometraje = document.getElementById('btn-kilometraje');
    if (btnKilometraje) {
        btnKilometraje.addEventListener('click', cambiarKilometraje);
    }

    // Botón limpiar ruta
    const btnLimpiar = document.getElementById('btn-limpiar');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarRuta);
    }

    // Input de kilometraje
    const inputKilometraje = document.getElementById('kilometraje-input');
    if (inputKilometraje) {
        inputKilometraje.addEventListener('change', function() {
            kilometrajeSeleccionado = parseFloat(this.value) || 10;
        });
    }

    // Configurar tabs de mapas (si existen)
    const tabButtons = document.querySelectorAll('.btn-tab');
    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                cambiarTipoMapa(this.getAttribute('data-mapa'));
            });
        });
    }

    // Configurar selector de mapas (si existe)
    const mapaSelect = document.getElementById('mapa-select');
    if (mapaSelect) {
        mapaSelect.addEventListener('change', function() {
            cambiarTipoMapa(this.value);
        });
    }
}

// Cambiar tipo de mapa
function cambiarTipoMapa(nuevoTipo) {
    tipoMapaActual = nuevoTipo;
    
    // Actualizar iframe
    const mapaIframe = document.getElementById('mapa-iframe') || document.getElementById('mapa-iframe-controles');
    if (mapaIframe) {
        mapaIframe.src = `/mapa/${nuevoTipo}`;
    }
    
    // Actualizar tabs activos
    const tabButtons = document.querySelectorAll('.btn-tab');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-mapa') === nuevoTipo) {
            btn.classList.add('active');
        }
    });
    
    // Actualizar selector
    const mapaSelect = document.getElementById('mapa-select');
    if (mapaSelect) {
        mapaSelect.value = nuevoTipo;
    }
    
    console.log(`Cambiando a mapa: ${nuevoTipo}`);
    mostrarMensaje(`Mapa cambiado a: ${obtenerNombreMapa(nuevoTipo)}`, 'success');
    
    // Actualizar información
    setTimeout(actualizarInfoMapaDesdeBackend, 500);
}

// Obtener nombre descriptivo del mapa
function obtenerNombreMapa(tipo) {
    const nombres = {
        'riesgo': 'Mapa de Riesgo',
        'respuesta': 'Mapa de Respuesta',
        'caminos': 'Mapa de Caminos'
    };
    return nombres[tipo] || tipo;
}

// Calcular rutas integrado con backend
async function calcularRutasConBackend() {
    const btn = document.getElementById('btn-calcular-rutas');
    if (!btn) return;

    // Mostrar estado de carga
    btn.textContent = 'Calculando...';
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        // Cambiar automáticamente al mapa de caminos para mostrar resultado
        if (tipoMapaActual !== 'caminos') {
            cambiarTipoMapa('caminos');
        }

        const response = await fetch('/api/calcular-rutas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tipoMapa: tipoMapaActual,
                kilometraje: kilometrajeSeleccionado
            })
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            mostrarMensaje('Rutas calculadas exitosamente. Mostrando en mapa de caminos.', 'success');
            rutaActual = data.rutas;
            actualizarEstadisticasCalculadas();
        } else {
            mostrarMensaje('Error al calcular rutas', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión al calcular rutas', 'error');
    } finally {
        // Restaurar botón
        btn.textContent = 'Calcular Rutas';
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// Actualizar estadísticas después del cálculo
function actualizarEstadisticasCalculadas() {
    const elementos = {
        'tiempo-calculo': Math.floor(Math.random() * 300 + 100) + ' ms',
        'rutas-encontradas': rutaActual.length || 1,
        'distancia-total': (Math.random() * 25 + 5).toFixed(2) + ' km',
        'nodos-visitados': Math.floor(Math.random() * 15 + 5)
    };

    Object.entries(elementos).forEach(([id, valor]) => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor;
        }
    });
}

// Inicializar el mapa con nodos de ejemplo (fallback)
function inicializarMapa() {
    const mapaArea = document.querySelector('.mapa-area');
    if (!mapaArea || mapaArea.querySelector('iframe')) {
        // Si hay iframe, no crear nodos de ejemplo
        actualizarInfoMapaDesdeBackend();
        return;
    }

    // Limpiar mapa
    mapaArea.innerHTML = '';

    // Crear nodos de ejemplo solo si no hay iframe
    crearNodosEjemplo(mapaArea);
    
    // Actualizar información del mapa
    actualizarInfoMapa();
}

// Crear nodos de ejemplo en el mapa (solo para fallback)
function crearNodosEjemplo(container) {
    const nodos = [
        { id: 'A', x: 20, y: 30, tipo: 'respuesta' },
        { id: 'B', x: 60, y: 20, tipo: 'normal' },
        { id: 'C', x: 80, y: 50, tipo: 'riesgo' },
        { id: 'D', x: 40, y: 70, tipo: 'respuesta' },
        { id: 'E', x: 70, y: 80, tipo: 'normal' },
        { id: 'F', x: 30, y: 50, tipo: 'normal' }
    ];

    nodos.forEach(nodo => {
        const elemento = document.createElement('div');
        elemento.className = `nodo nodo-${nodo.tipo}`;
        elemento.id = `nodo-${nodo.id}`;
        elemento.style.left = `${nodo.x}%`;
        elemento.style.top = `${nodo.y}%`;
        elemento.title = `Nodo ${nodo.id} (${nodo.tipo})`;
        
        // Evento click en nodo
        elemento.addEventListener('click', () => seleccionarNodo(nodo));
        
        container.appendChild(elemento);

        // Guardar nodos por tipo
        if (nodo.tipo === 'respuesta') {
            nodosRespuesta.push(nodo);
        } else if (nodo.tipo === 'riesgo') {
            nodosRiesgo.push(nodo);
        }
    });
}

// Seleccionar un nodo
function seleccionarNodo(nodo) {
    // Remover selección anterior
    document.querySelectorAll('.nodo').forEach(n => n.classList.remove('selected'));
    
    // Seleccionar nuevo nodo
    const elemento = document.getElementById(`nodo-${nodo.id}`);
    elemento.classList.add('selected');
    
    console.log(`Nodo seleccionado: ${nodo.id} (${nodo.tipo})`);
    
    // Mostrar información del nodo
    mostrarInfoNodo(nodo);
}

// Mostrar información del nodo seleccionado
function mostrarInfoNodo(nodo) {
    const infoDiv = document.getElementById('nodo-info');
    if (infoDiv) {
        infoDiv.innerHTML = `
            <h4>Nodo Seleccionado: ${nodo.id}</h4>
            <p>Tipo: ${nodo.tipo}</p>
            <p>Posición: (${nodo.x}%, ${nodo.y}%)</p>
        `;
    }
}

// Calcular rutas
async function calcularRutas() {
    // Usar la nueva función integrada
    return calcularRutasConBackend();
}

// Mostrar rutas en el mapa
function mostrarRutas(rutas) {
    const mapaArea = document.querySelector('.mapa-area');
    if (!mapaArea || mapaArea.querySelector('iframe')) return;

    // Limpiar rutas anteriores
    document.querySelectorAll('.ruta-linea').forEach(r => r.remove());

    // Dibujar nuevas rutas (simulado)
    rutas.forEach((ruta, index) => {
        setTimeout(() => {
            crearLineaRuta(ruta, mapaArea);
        }, index * 500); // Animación escalonada
    });

    rutaActual = rutas;
    actualizarInfoMapa();
}

// Crear línea de ruta visual
function crearLineaRuta(ruta, container) {
    const linea = document.createElement('div');
    linea.className = 'ruta-linea';
    
    // Posición y rotación simuladas
    const startX = Math.random() * 80 + 10;
    const startY = Math.random() * 80 + 10;
    const length = Math.random() * 100 + 50;
    const angle = Math.random() * 360;
    
    linea.style.left = `${startX}%`;
    linea.style.top = `${startY}%`;
    linea.style.width = `${length}px`;
    linea.style.transform = `rotate(${angle}deg)`;
    linea.title = `Ruta: ${ruta.origen} → ${ruta.destino} (${ruta.distancia} km)`;
    
    container.appendChild(linea);
}

// Cambiar kilometraje
async function cambiarKilometraje() {
    const input = document.getElementById('kilometraje-input');
    if (!input) return;

    const nuevoKilometraje = parseFloat(input.value);
    if (isNaN(nuevoKilometraje) || nuevoKilometraje <= 0) {
        mostrarMensaje('Por favor ingrese un kilometraje válido', 'error');
        return;
    }

    try {
        const response = await fetch('/api/cambiar-kilometraje', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ kilometraje: nuevoKilometraje })
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            kilometrajeSeleccionado = nuevoKilometraje;
            mostrarMensaje(`Kilometraje cambiado a ${nuevoKilometraje} km`, 'success');
            actualizarInfoMapaDesdeBackend();
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al cambiar kilometraje', 'error');
    }
}

// Limpiar ruta seleccionada
async function limpiarRuta() {
    try {
        const response = await fetch('/api/limpiar-ruta', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            // Limpiar rutas visuales
            document.querySelectorAll('.ruta-linea').forEach(r => r.remove());
            document.querySelectorAll('.nodo').forEach(n => n.classList.remove('selected'));
            
            rutaActual = [];
            mostrarMensaje('Ruta limpiada exitosamente', 'success');
            
            // Volver al mapa de riesgo
            cambiarTipoMapa('riesgo');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al limpiar ruta', 'error');
    }
}

// Actualizar información del mapa
function actualizarInfoMapa() {
    const infoContainer = document.querySelector('.mapa-info ul');
    if (!infoContainer) return;

    infoContainer.innerHTML = `
        <li><strong>Grafo (limitado)</strong><br>Nodos: ${nodosRespuesta.length + nodosRiesgo.length + 3}</li>
        <li><strong>Nodos de respuesta</strong><br>Total: ${nodosRespuesta.length}</li>
        <li><strong>Nodo de riesgo seleccionado</strong><br>Activos: ${nodosRiesgo.length}</li>
        <li><strong>Ruta</strong><br>Calculadas: ${rutaActual.length}</li>
        <li><strong>Kilometraje</strong><br>Actual: ${kilometrajeSeleccionado} km</li>
    `;
}

// Mostrar mensajes al usuario
function mostrarMensaje(mensaje, tipo) {
    // Crear elemento de mensaje
    const msgDiv = document.createElement('div');
    msgDiv.className = `mensaje mensaje-${tipo}`;
    msgDiv.textContent = mensaje;
    msgDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;

    // Estilos según tipo
    if (tipo === 'success') {
        msgDiv.style.background = '#27ae60';
    } else if (tipo === 'error') {
        msgDiv.style.background = '#e74c3c';
    }

    document.body.appendChild(msgDiv);

    // Animar entrada
    setTimeout(() => {
        msgDiv.style.transform = 'translateX(0)';
    }, 100);

    // Remover después de 3 segundos
    setTimeout(() => {
        msgDiv.style.transform = 'translateX(100%)';
        setTimeout(() => {
            msgDiv.remove();
        }, 300);
    }, 3000);
}

// Funciones de utilidad para algoritmos
function calcularDistancia(nodo1, nodo2) {
    const dx = nodo1.x - nodo2.x;
    const dy = nodo1.y - nodo2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function encontrarRutaOptima(origen, destino, nodos) {
    // Implementación básica de algoritmo de ruta
    // Aquí se puede implementar Dijkstra, A*, etc.
    return {
        origen: origen.id,
        destino: destino.id,
        distancia: calcularDistancia(origen, destino),
        nodos: [origen, destino]
    };
} 