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
	sql = "SELECT * FROM attractions WHERE name like %s OR mrt = %s;"

	# Escaping wildcards in the parameter
	search_param = f"%{kw}%"
	keyword = (search_param, kw)

	try:
		
		con = db.get_connection()
		Cursor = con.cursor(dictionary=True)
		Cursor.execute(sql, keyword)
		query_result_raw = Cursor.fetchall()
		total = len(query_result_raw)

		query_result = []
		for image_datatype in query_result_raw:
			image_datatype['images'] = json.loads(image_datatype['images'])
			query_result.append(image_datatype)

		if total <= 12:

			if page == 0:

				return {'nextPage': None,
						'data': query_result}
			
			else:

				return {'error': True,
						'message': '景點資料超出頁數'}
		
		else:

			if page == 0:

				return {'nextPage': 1,
						'data': query_result[:12]}
			
			elif page > 0 and page <= math.ceil(total / 12) - 1: 

				if page != math.ceil(total / 12) - 1:

					return {'nextPage': page+1,
			 				'data': query_result[12*page:12*(page+1)]}

				else:

					return {'nextPage': None,
			 				'data': query_result[12*page:]}
				
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

	# should get the total amounts of attractions

	try:

		con = db.get_connection()
		Cursor = con.cursor(dictionary=True)
		sql_total_cnt = 'SELECT COUNT(name) AS total FROM attractions;'
		Cursor.execute(sql_total_cnt)
		totals = Cursor.fetchall()[0]['total']

		max_page = math.ceil(totals / 12) - 1

		if page <= max_page and page >= 0:

			sql_12 = 'SELECT * FROM attractions WHERE id >= %s AND id <= %s'
			page_range = ((page*12)+1, (page+1)*12)
			Cursor.execute(sql_12, page_range)
			demand_attractions_raw = Cursor.fetchall()

			demand_attractions = []
			for img_datatype in demand_attractions_raw:
				img_datatype['images'] = json.loads(img_datatype['images'])
				demand_attractions.append(img_datatype)

			if page < max_page:
			
				return {'nextPage': page+1,
						'data': demand_attractions}
			else:

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