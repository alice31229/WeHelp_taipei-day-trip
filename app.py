from fastapi import *
from fastapi.responses import FileResponse
app=FastAPI()

# Static Pages (Never Modify Code in this Block)
@app.get("/", include_in_schema=False)
async def index(request: Request):
	return FileResponse("./static/index.html", media_type="text/html")
@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
	return FileResponse("./static/attraction.html", media_type="text/html")
@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
	return FileResponse("./static/booking.html", media_type="text/html")
@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
	return FileResponse("./static/thankyou.html", media_type="text/html")







##################################

import os
import math
import json
import uvicorn
import mysql.connector

# MySQL settings
mysql_secret_code = os.environ.get('ENV_MYSQL_PASSWORD')

db = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="sql_pool",
    host="localhost", # in same ec2 use localhost; otherwise, use the endpoint
    user="root", 
    password=mysql_secret_code,
	database="TaipeiTrip")


def get_12_attractions_by_keyword(kw, page=0):

	# sql = 'SELECT * FROM attractions WHERE MATCH(name) AGAINST (%s) OR MATCH(description) AGAINST (%s)'
	# sql = "SELECT * FROM attractions WHERE name like %s OR description like %s;"

	# 用來完全比對捷運站名稱、或模糊比對景點名稱的關鍵字，沒有給定則不做篩選
	sql = "SELECT * FROM (SELECT * FROM attractions WHERE name like %s OR mrt = %s) AS subquery LIMIT %s, %s;"

	page_size = 24 # judge the nextPage
	start = page * 12

	# Escaping wildcards in the parameter
	search_param = f"%{kw}%"
	keyword = (search_param, kw, start, page_size)

	try:
		
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


def get_12_attractions_by_page(page):

	try:

		con = db.get_connection()
		Cursor = con.cursor(dictionary=True)
		page_size = 24 # judge the nextPage
		start = page * 12

		sql_12 = 'SELECT * FROM attractions limit %s, %s'
		Cursor.execute(sql_12, (start, page_size))
		demand_attractions_raw = Cursor.fetchall()

		demand_attractions = []
		for img_datatype in demand_attractions_raw:
			img_datatype['images'] = json.loads(img_datatype['images'])
			demand_attractions.append(img_datatype)

		if len(demand_attractions) > 12:
		
			return {'nextPage': page+1,
					'data': demand_attractions}
		
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


@app.get("/api/attractions")
async def handle_attraction_page(request: Request, page: int = Query(0), keyword: str = Query('')):

	#print(page, keyword)
	if keyword == '':

		# call only get_12_attractions_by_page
		status_json = get_12_attractions_by_page(page)
		

		return status_json
	
	else:

		# judge page or keyword
		keyword_attractions = get_12_attractions_by_keyword(keyword, page)

		return keyword_attractions
	

@app.get("/api/attraction/{id}")
async def get_target_attraction_info(request: Request, id: int):

	try:

		con = db.get_connection()
		Cursor = con.cursor(dictionary=True)

		search_attraction = 'SELECT * FROM attractions WHERE id = %s;'
		target_ID = (id,)
		Cursor.execute(search_attraction, target_ID)
		target_attraction_raw = Cursor.fetchall()

		target_attraction = []
		for image_datatype in target_attraction_raw:
			image_datatype['images'] = json.loads(image_datatype['images'])
			target_attraction.append(image_datatype)

		if target_attraction != []:
			
			attraction_json = {'data': target_attraction[0]}

			return attraction_json

		else:
			attraction_json = {'error': True,
							   'message': '無此景點'}

			return attraction_json
	

	except mysql.connector.Error as err:

		print(f"Error: {err}")
		return {'error': True,
				'message': '景點資料輸出錯誤'}


	finally:
		
		Cursor.close()
		con.close()


@app.get("/api/mrts")
async def get_mrt_info(request: Request):

	mrts = []

	try:
		sql = '''SELECT mrt, COUNT(*) AS mrt_cnt
				 FROM attractions
				 WHERE mrt IS NOT NULL
				 GROUP BY mrt
				 ORDER BY 2 DESC;'''
		con = db.get_connection()
		Cursor = con.cursor(dictionary=True)
		Cursor.execute(sql)
		sorted_mrts = Cursor.fetchall()

		for sm in sorted_mrts:
			mrts.append(sm['mrt'])

		mrts_json = {'data':mrts}

		return mrts_json
	
	except mysql.connector.Error as err:
    	
		return {'error': True,
			    'message': '捷運站資料輸出錯誤'}

	finally:

		con.close()
		Cursor.close()

if __name__ == '__main__':
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
	#uvicorn.run("app:app", port=8000, reload=True)