import mysql.connector
from mysql.connector import Error

# Conexión a la base de datos MySQL
def conectar_db():
    try:
        conn = mysql.connector.connect(
            host=" database-2.cpquyyaciorx.us-east-1.rds.amazonaws.com",        # Cambia si tu servidor no es local
            user="Sebastian",             # Usuario de MySQL
            password="sebastian",    # Contraseña de MySQL
            database="BaseData"     # Nombre de tu base de datos
        )
        if conn.is_connected():
            print("Conexión exitosa a la base de datos.")
        return conn
    except Error as e:
        print(f"Error al conectar a la base de datos: {e}")
        return None

# Verificar si la placa existe en la base de datos
def verificar_placa(placa, conn):
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM BaseData WHERE vehiculos; = %s"
        cursor.execute(query, (placa,))
        result = cursor.fetchone()
        cursor.close()

        if result:
            return True  # Placa registrada
        else:
            return False  # Placa no registrada
    except Error as e:
        print(f"Error al verificar la placa: {e}")
        return False

# Insertar una nueva placa en la base de datos
def insertar_placa(placa, conn):
    try:
        cursor = conn.cursor()
        query = "INSERT INTO placas (placa) VALUES (%s)"
        cursor.execute(query, (placa,))
        conn.commit()
        cursor.close()
        print(f"Placa '{placa}' insertada correctamente.")
    except Error as e:
        print(f"Error al insertar la placa: {e}")

# Listar todas las placas en la base de datos
def listar_placas(conn):
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM placas ORDER BY timestamp DESC"
        cursor.execute(query)
        results = cursor.fetchall()
        cursor.close()
        return results
    except Error as e:
        print(f"Error al listar las placas: {e}")
        return []

# Cerrar la conexión
def cerrar_conexion(conn):
    try:
        if conn.is_connected():
            conn.close()
            print("Conexión cerrada.")
    except Error as e:
        print(f"Error al cerrar la conexión: {e}")
