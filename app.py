from fastapi import *
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
app=FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

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
import jwt
import math
import json
import uvicorn
import bcrypt
import mysql.connector
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext


# MySQL settings
mysql_secret_code = os.environ.get('ENV_MYSQL_PASSWORD')

db = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="sql_pool",
    host="localhost", # in same ec2 use localhost; otherwise, use the endpoint
    user="root", 
    password=mysql_secret_code,
	database="TaipeiTrip")

# user enroll or member log in/out JWT settings
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# user or member info
# 符合 application/json 資料型別
class user_info(BaseModel): # register
	name: str
	email: str
	password: str

class member_info(BaseModel): # log in
	email: str
	password: str


# homepage keyword search data 
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


# homepage infinite scroll data
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


# password handle
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

secret_key = os.environ.get('SECRET_KEY')
algorithm = os.environ.get('ALGORITHM')

def encode_password(password: str) -> str:

	hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
	return hashed.decode('utf-8')

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# token時效為七天
def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
	to_encode = data.copy()
	expire = datetime.now() + expires_delta
	# to_encode.update({"exp": expire})
	# encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
	encoded_jwt = jwt.encode({**to_encode, "exp": expire}, secret_key, algorithm=algorithm)
	return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        # 檢查token是否在有效期內（七天）

		# 避免aws時區造成問題
        now = datetime.utcnow()  # 使用UTC時間比對，且沒有時區信息
        exp = datetime.fromtimestamp(payload['exp'], tz=timezone.utc).replace(tzinfo=None)  # 轉換為沒有時區信息的時間
        
        if now < exp:
            return payload
        else:
            return None
		
    except jwt.ExpiredSignatureError: # 驗證是否在有效期七天內
        return None
    except jwt.InvalidTokenError: 
        return None


# 登入帳號
@app.put("/api/user/auth")
async def sign_in(member_info: member_info):
#async def sign_in(email: str = Form(...), password: str = Form(...)):

	response_json = {}

	try:

		query = "SELECT id, name, email, password FROM members WHERE email = %s;"
		account = (member_info.email,)
	
		con = db.get_connection()
		Cursor = con.cursor(dictionary=True)
		Cursor.execute(query, account)
		fetch_result = Cursor.fetchall()

		if not fetch_result or not verify_password(member_info.password, fetch_result[0]['password']):

			error_message = ''
			if member_info.email == '' or member_info.password == '':
				error_message = '請輸入電子郵件、密碼'
			else:
				error_message = '電子郵件或密碼輸入錯誤'

			response_json["error"] = True
			response_json["message"] = error_message

			return response_json

		else:

			# check query result
			member_id = fetch_result[0]['id']
			name = fetch_result[0]['name']
			email = fetch_result[0]['email']

			# 生成 JWT token
			token = create_access_token(data={"user_id": member_id, "email": email, "name": name})
			
			response_json["token"] = token

			return response_json

	except Exception as e:

		raise HTTPException(status_code=500, detail=str(e))
		

	finally:

		Cursor.close()
		con.close()


# 登入會員資訊
@app.get("/api/user/auth")
async def get_user_info(token: str = Depends(oauth2_scheme)):

	response_json = {"data": ''}
	payload = decode_access_token(token)

	if payload is None:
		response_json['data'] = None

	else:
		response_json["data"] = {
			"id": payload["user_id"],
			"name": payload["name"],
			"email": payload["email"]
		}

	return response_json


# 登出帳號
# 使用 JWT 機制 不需要設置登出路由 從前端刪除token即可

# 註冊帳號
@app.post("/api/user")
async def enroll_account(user_info: user_info):

	response_json = {}

	# 確認是否已註冊
	try:

		con = db.get_connection()
		Cursor = con.cursor(dictionary=True)

		if user_info.name == '' or user_info.email == '' or user_info.password == '':

			error_message = "請輸入姓名、電子信箱、密碼"
			response_json['error'] = True
			response_json['message'] = error_message

			return response_json

		else:

			query = "SELECT * FROM members WHERE email = %s;"
			Email = (user_info.email,)
			Cursor.execute(query, Email)
			
			if Cursor.fetchone():

				error_message = "帳號已經被註冊"
				response_json['error'] = True
				response_json['message'] = error_message

				return response_json
			
			else:

				query = "INSERT INTO members (name, email, password) VALUES (%s, %s, %s);"
				encoded_password = encode_password(user_info.password)
				apply_form = (user_info.name, user_info.email, encoded_password)
				Cursor.execute(query, apply_form)
				con.commit()

				response_json['ok'] = True

				return response_json

	except Exception as e:

		raise HTTPException(status_code=500, detail=str(e))

	finally:

		Cursor.close()
		con.close()



# homepage attractions data router
@app.get("/api/attractions")
async def handle_attraction_page(page: int = Query(0), keyword: str = Query('')):

	#print(page, keyword)
	if keyword == '':

		# call only get_12_attractions_by_page
		status_json = get_12_attractions_by_page(page)
		

		return status_json
	
	else:

		# judge page or keyword
		keyword_attractions = get_12_attractions_by_keyword(keyword, page)

		return keyword_attractions


# each attraction info api router
@app.get("/api/attraction/{id}")
async def get_target_attraction_info(id: int):

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


# homepage mrt click keyword search api router
@app.get("/api/mrts")
async def get_mrt_info():

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