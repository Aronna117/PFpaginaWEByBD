const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

// Crear la aplicación Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Conexión a la base de datos MySQL
const db = mysql.createConnection({
    host: 'database-2.cpquyyaciorx.us-east-1.rds.amazonaws.com',
    user: 'Sebastian',
    password: 'sebastian',
    database: 'BaseData',
    port: 3306,
});

// Verificar la conexión a MySQL
db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err.message);
        return;
    }
    console.log('Conectado a la base de datos MySQL.');
});

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static('public'));

// Configurar el body-parser para manejar datos JSON
app.use(bodyParser.json());

// Ruta principal para la aplicación
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Rutas para los feeds (original y procesado) - Se colocan primero para evitar conflictos
app.get('/original_feed', (req, res) => {
    res.redirect('http://44.208.167.207:5000/video_feed');
});

app.get('/processed_feed', (req, res) => {
    res.redirect('http://44.208.167.207:5000/processed_feed');
});

// Almacenar el último estado de la placa detectada
let placaStatus = 'No se ha detectado ninguna placa aún';

// Comunicación en tiempo real usando Socket.IO
io.on('connection', (socket) => {
    console.log('Usuario conectado');

    // Enviar el estado actual de la placa al cliente
    socket.emit('updatePlaca', { placa: placaStatus, timestamp: new Date().toLocaleString() });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });
});

// Ruta para recibir actualizaciones de placas detectadas desde `camnew.py`
app.post('/update', (req, res) => {
    const { placa } = req.body;
    const timestamp = new Date(); // Generar un timestamp actual

    if (placa) {
        // Emitir la placa detectada a los clientes en tiempo real
        placaStatus = placa; // Actualizar el estado actual
        io.emit('updatePlaca', { placa, timestamp: timestamp.toLocaleString() });

        // Guardar en la base de datos
        const query = 'INSERT INTO vehiculos (placas, timestamp) VALUES (?, ?)';
        db.query(query, [placas, timestamp], (err) => {
            if (err) {
                console.error('Error al insertar en la base de datos:', err.message);
                res.status(500).send('Error al guardar la placa en la base de datos.');
            } else {
                console.log(`Placas "${placas}" guardada en la base de datos con timestamp.`);
                res.sendStatus(200);
            }
        });
    } else {
        res.status(400).send('Placa no proporcionada.');
    }
});

// Ruta para reiniciar la tabla
app.post('/reset_table', (req, res) => {
    const resetQuery = `
        TRUNCATE TABLE vehiculos; -- Limpia todos los datos de la tabla
    `;
    db.query(resetQuery, (err, results) => {
        if (err) {
            console.error('Error al reiniciar la tabla:', err.message);
            res.status(500).send('Error al reiniciar la tabla.');
        } else {
            console.log('Tabla reiniciada correctamente.');
            res.send('Tabla reiniciada correctamente.');
        }
    });
});

// Ruta para obtener todas las placas almacenadas en la base de datos
app.get('/plates', (req, res) => {
    const query = 'SELECT id, placas, timestamp FROM vehiculos ORDER BY timestamp DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener las placas de la base de datos:', err.message);
            res.status(500).send('Error interno del servidor.');
        } else {
            res.json(results);
        }
    });
});

// Ruta para buscar placas con parámetros opcionales (nombre y rango de fechas)
app.get('/search_plates', (req, res) => {
    const { placas, startTimestamp, endTimestamp } = req.query;

    let query = 'SELECT * FROM vehiculos WHERE 1=1'; // Base query
    const params = [];

    // Filtros opcionales
    if (placa) {
        query += ' AND placas LIKE ?';
        params.push(`%${placas}%`);
    }
    if (startTimestamp) {
        query += ' AND timestamp >= ?';
        params.push(startTimestamp);
    }
    if (endTimestamp) {
        query += ' AND timestamp <= ?';
        params.push(endTimestamp);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error ejecutando la búsqueda:', err.message);
            return res.status(500).send('Error interno del servidor.');
        }
        res.json(results);
    });
});

// Iniciar el servidor
server.listen(3000, () => {
    console.log('Servidor web corriendo en http://44.208.167.207:3000');
});

console.log('Conectando a la base de datos con:');
console.log(`Host: ${db.config.host}`);
console.log(`Usuario: ${db.config.user}`);
console.log(`Base de datos: ${db.config.database}`);
console.log(`Puerto: ${db.config.port}`);
