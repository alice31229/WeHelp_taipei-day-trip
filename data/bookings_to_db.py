import os
import mysql.connector

# MySQL settings
mysql_secret_code = os.environ.get('ENV_MYSQL_PASSWORD')

db = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="sql_pool",
    host="localhost", # in same ec2 use localhost; otherwise, use the endpoint
    user="root", 
    password=mysql_secret_code)

sql_use_db = "USE TaipeiTrip;"
sql_create_table = '''
CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT AUTO_INCREMENT,
    memberId BIGINT NOT NULL,
    attractionId BIGINT NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(100) NOT NULL,
    price INT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (memberId) REFERENCES members(id),
    FOREIGN KEY (attractionId) REFERENCES attractions(id)
);
'''

# Establish a connection
con = db.get_connection()
cursor = con.cursor()

try:
    
    cursor.execute(sql_use_db)
    cursor.execute(sql_create_table)
    con.commit()
    print("Created bookings table successfully.")

except mysql.connector.Error as err:

    print(f"Error: {err}")

finally:

    cursor.close()
    con.close()
