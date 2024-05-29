import os
import json
import mysql.connector

# MySQL settings
mysql_secret_code = os.environ.get('ENV_MYSQL_PASSWORD')

db = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="sql_pool",
    host="localhost", # in same ec2 use localhost; otherwise, use the endpoint
    user="root", 
    password=mysql_secret_code)

# SQL statements for creating database and table
sql_create_db = "CREATE DATABASE IF NOT EXISTS TaipeiTrip;"
sql_use_db = "USE TaipeiTrip;"
sql_create_table = '''
CREATE TABLE IF NOT EXISTS attractions (
    id BIGINT AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    description VARCHAR(6000) NOT NULL,
    address VARCHAR(255) NOT NULL,
    transport VARCHAR(1000) NOT NULL,
    mrt VARCHAR(50),
    lat DECIMAL(8,6),
    lng DECIMAL(9,6),
    images JSON,
    PRIMARY KEY (id)
);
'''

# sql_create_table = '''
# CREATE TABLE IF NOT EXISTS attractions (
#     id BIGINT AUTO_INCREMENT,
#     name VARCHAR(255) NOT NULL,
#     category VARCHAR(255) NOT NULL,
#     description VARCHAR(6000) NOT NULL,
#     address VARCHAR(255) NOT NULL,
#     transport VARCHAR(1000) NOT NULL,
#     mrt VARCHAR(50),
#     lat DECIMAL(8,6),
#     lng DECIMAL(9,6),
#     images JSON,
#     PRIMARY KEY (id)
# );
# CREATE FULLTEXT INDEX idx_name ON attractions(name);
# CREATE FULLTEXT INDEX idx_description ON attractions(description);
# '''

# SQL statement for inserting data
sql_insert_data = '''
INSERT INTO TaipeiTrip.attractions (name, category, description, address, transport, mrt, lat, lng, images) 
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
'''

# Establish a connection
con = db.get_connection()
cursor = con.cursor()

# separate sql queries and execute them one by one
try:
    # Create database and table
    cursor.execute(sql_create_db)
    cursor.execute(sql_use_db)
    for statement in sql_create_table.split(';'):
        if statement.strip():
            cursor.execute(statement)
    con.commit()

    # Load data from JSON
    with open('taipei-attractions.json', 'r', encoding='utf-8') as file:
        attractions = json.load(file)
        attractions = attractions['result']['results']

    # Prepare data for insertion
    # Use auto-increment id
    data_items = []
    for data in attractions:
        image_urls = ['https://' + url for url in data['file'].split('https://') if url.lower().endswith('.jpg') or url.lower().endswith('.png')]
        data_items.append((data['name'], data['CAT'], data['description'], data['address'], data['direction'], data['MRT'], data['latitude'], data['longitude'], json.dumps(image_urls)))

    # Insert data into the database
    cursor.executemany(sql_insert_data, data_items)
    con.commit()

    print(f"Inserted {cursor.rowcount} records successfully.")

except mysql.connector.Error as err:
    print(f"Error: {err}")
finally:
    cursor.close()
    con.close()

# sql = '''

# CREATE DATABASE TaipeiTrip;
# USE TaipeiTrip;
# CREATE TABLE attractions (
#     id BIGINT AUTO_INCREMENT,
#     name VARCHAR(255) NOT NULL,
#     category VARCHAR(255) NOT NULL,
#     description VARCHAR(max) NOT NULL,
#     address VARCHAR(255) NOT NULL,
#     transport VARCHAR(255) NOT NULL,
#     mrt VARCHAR(255) NOT NULL,
#     lat DECIMAL(8,6),
#     lng DECIMAL(9,6),
#     images JSON,
#     primary key (id));
# CREATE INDEX idx_name ON attractions(name);
# CREATE INDEX idx_description ON attractions(description);

# INSERT INTO attractions (id, name, category, description, address, transport, mrt, lat, lng, images) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)

# '''

# con = db.get_connection()
# Cursor = con.cursor(dictionary=True)

# with open('taipei-attractions.json', 'r', encoding='utf-8') as file:
#     attractions = json.load(file)
#     attractions = attractions['result']['results']

# data_items = []

# for data in attractions:

#     # handle imgs url
#     image_urls = ['https://'+url for url in data['file'].split('https://') if url.lower().endswith('.jpg') or url.lower().endswith('.png')]

#     # insert data into db 
#     data_items.append((data['_id'], data['name'], data['CAT'], data['description'], data['address'], data['direction'], data['MRT'], data['latitude'], data['longitude'], f"{image_urls}"))

# Cursor.executemany(sql, data_items)
# con.commit()

# Cursor.close()
# con.close()