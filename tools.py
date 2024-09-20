import os
import json
import mysql.connector
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

def db_config():
	
    # MySQL settings
    # local 
    # db = mysql.connector.pooling.MySQLConnectionPool(
    #         pool_name="sql_pool",
    #         host=os.getenv('MYSQL_HOST'), 
    #         user=os.getenv('MYSQL_USER'), 
    #         password=os.getenv('MYSQL_PASSWORD'),
    #         database=os.getenv("MYSQL_DB")
    #     )
	
    # return db

    # aws rds 
    db = mysql.connector.pooling.MySQLConnectionPool(
            pool_name = "sql_pool",
            host=os.getenv("AWS_RDS_HOSTNAME"),
            user=os.getenv("AWS_RDS_USER"),
            password=os.getenv("AWS_RDS_PASSWORD"),
            database=os.getenv("AWS_RDS_DB")
         )
	
    return db

# homepage keyword search data 
def get_12_attractions_by_keyword(kw, page=0):

	# sql = 'SELECT * FROM attractions WHERE MATCH(name) AGAINST (%s) OR MATCH(description) AGAINST (%s)'
	# sql = "SELECT * FROM attractions WHERE name like %s OR description like %s;"

	# 用來完全比對捷運站名稱、或模糊比對景點名稱的關鍵字，沒有給定則不做篩選
	sql = '''SELECT * FROM (SELECT * FROM attractions WHERE name like %s OR mrt = %s) AS subquery LIMIT %s, %s;'''

	page_size = 24 # judge the nextPage
	start = page * 12

	# Escaping wildcards in the parameter
	search_param = f"%{kw}%"
	keyword = (search_param, kw, start, page_size)

	try:
		db = db_config()
		con = db.get_connection()
		Cursor = con.cursor(dictionary=True)
		Cursor.execute(sql, keyword)
		query_result_raw = Cursor.fetchall()
		next_page_judge = len(query_result_raw)

		query_result = []
		for image_datatype in query_result_raw:
			image_datatype['images'] = json.loads(image_datatype['images'])
			query_result.append(image_datatype)

		if next_page_judge < 13 and next_page_judge > 0:

			return {'nextPage': None,
					'data': query_result[:next_page_judge]}
		
		elif next_page_judge > 12:

			return {'nextPage': page+1,
					'data': query_result[:12]}

		else:

			return {'error': True,
					'message': '景點資料超出頁數'}

	except mysql.connector.Error as err:

		print(f"Error: {err}")
		return {'error': True,
				'message': '景點資料輸出錯誤'}

	finally:

		con.close()
		Cursor.close()


# homepage infinite scroll data
def get_12_attractions_by_page(page):

    try:
        db = db_config()
        con = db.get_connection()
        Cursor = con.cursor(dictionary=True)
        page_size = 24 # judge the nextPage
        start = page * 12

        sql_12 = '''SELECT * FROM attractions LIMIT %s, %s;'''
        Cursor.execute(sql_12, (start, page_size))
        demand_attractions_raw = Cursor.fetchall()

        demand_attractions = []
        for img_datatype in demand_attractions_raw:
            img_datatype['images'] = json.loads(img_datatype['images'])
            demand_attractions.append(img_datatype)

        if len(demand_attractions) > 12:

            return {'nextPage': page+1,
                    'data': demand_attractions[:12]}

        elif len(demand_attractions) < 13 and len(demand_attractions) > 0:

            return {'nextPage': None,
                    'data': demand_attractions}

        else:

            return {'error': True,
                    'message': '請輸入涵蓋景點資料的正確頁數'}
			

    except mysql.connector.Error as err:

        print(f"Error: {err}")
        return {'error': True,
                'message': '景點資料輸出錯誤'}

    finally:

        con.close()
        Cursor.close()
		
