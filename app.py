from fastapi import *
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
app=FastAPI()

app.mount("/taipei-trip/static_taipei_trip", StaticFiles(directory="/app/static_taipei_trip"), name="static_taipei_trip")

# Static Pages

# home page
@app.get("/taipei-trip", include_in_schema=False)
async def index(request: Request):
	return FileResponse("./static_taipei_trip/index.html", media_type="text/html")

# attraction detail page
@app.get("/taipei-trip/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
	return FileResponse("./static_taipei_trip/attraction.html", media_type="text/html")

# booking interested attraction schedule
@app.get("/taipei-trip/booking", include_in_schema=False)
async def booking(request: Request):
	return FileResponse("./static_taipei_trip/booking.html", media_type="text/html")

# thank you page after payment step
@app.get("/taipei-trip/thankyou", include_in_schema=False)
async def thankyou(request: Request):
	return FileResponse("./static_taipei_trip/thankyou.html", media_type="text/html")


##################################

import os
import re
import jwt
import json
import bcrypt
#import uvicorn
import requests
import mysql.connector
from pydantic import BaseModel
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from tools import db_config, get_12_attractions_by_keyword, get_12_attractions_by_page

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)


# user enroll or member log in/out JWT settings
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

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
	encoded_jwt = jwt.encode({**to_encode, "exp": expire}, secret_key, algorithm=algorithm)
	return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        # 檢查token是否在有效期內（七天）

		# 避免aws時區造成問題
        now = datetime.utcnow()  # 使用UTC時間比對，且沒有時區資訊
        exp = datetime.fromtimestamp(payload['exp'], tz=timezone.utc).replace(tzinfo=None)  # 轉換為沒有時區資訊的時間
        
        if now < exp:
            return payload
        else:
            return None
		
    except jwt.ExpiredSignatureError: # 驗證是否在有效期七天內
        return None
    except jwt.InvalidTokenError: 
        return None
	
# 登入錯誤驗證class
# 自定義的 HTTPException
class CustomHTTPException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)
        self.content = {"error": True, "message": detail}

# 登入驗證
def login_required(token: str = Depends(oauth2_scheme)):
	payload = decode_access_token(token)
	if payload is None:
		raise CustomHTTPException(status_code=403, detail='尚未登入，預定行程存取遭拒')
	return payload


# user or member info
# 符合 application/json 資料型別
class user_info(BaseModel): # register
	name: str
	email: str
	password: str

# log in
class member_info(BaseModel): 
	email: str
	password: str

# member booking schedule info
class schedule_info(BaseModel):
	attractionId: int
	date: str
	time: str
	price: int

# order info
class order_info(BaseModel):
	prime: str
	order: dict





# 登入帳號
@app.put("/taipei-trip/api/user/auth")
async def sign_in(member_info: member_info):
#async def sign_in(email: str = Form(...), password: str = Form(...)):

	response_json = {}

	try:

		query = '''SELECT id, name, email, password FROM members WHERE email = %s;'''
		account = (member_info.email,)
	
		db = db_config()
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

		raise CustomHTTPException(status_code=500, detail=str(e))
		
	finally:

		Cursor.close()
		con.close()


# 登入會員資訊
@app.get("/taipei-trip/api/user/auth")
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
@app.post("/taipei-trip/api/user")
async def enroll_account(user_info: user_info):

	response_json = {}

	# 確認是否已註冊
	try:

		db = db_config()
		con = db.get_connection()
		Cursor = con.cursor(dictionary=True)

		if user_info.name == '' or user_info.email == '' or user_info.password == '':

			error_message = "請輸入姓名、電子信箱、密碼"
			response_json['error'] = True
			response_json['message'] = error_message

			return response_json

		else:

			query = '''SELECT * FROM members WHERE email = %s;'''
			Email = (user_info.email,)
			Cursor.execute(query, Email)
			
			if Cursor.fetchone():

				error_message = "帳號已經被註冊"
				response_json['error'] = True
				response_json['message'] = error_message

				return response_json
			
			else:

				query = '''INSERT INTO members (name, email, password) VALUES (%s, %s, %s);'''
				encoded_password = encode_password(user_info.password)
				apply_form = (user_info.name, user_info.email, encoded_password)
				Cursor.execute(query, apply_form)
				con.commit()

				response_json['ok'] = True

				return response_json

	except Exception as e:

		raise CustomHTTPException(status_code=500, detail=str(e))

	finally:

		Cursor.close()
		con.close()



# homepage attractions data router
@app.get("/taipei-trip/api/attractions")
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
@app.get("/taipei-trip/api/attraction/{id}")
async def get_target_attraction_info(id: int):

	try:

		db = db_config()
		con = db.get_connection()
		Cursor = con.cursor(dictionary=True)

		search_attraction = '''SELECT * FROM attractions WHERE id = %s;'''
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
@app.get("/taipei-trip/api/mrts")
async def get_mrt_info():

	mrts = []

	try:
		sql = '''SELECT mrt, COUNT(*) AS mrt_cnt
				 FROM attractions
				 WHERE mrt IS NOT NULL
				 GROUP BY mrt
				 ORDER BY 2 DESC;'''
		db = db_config()
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


# 行程預定 路由
@app.get("/taipei-trip/api/booking") # 尚未下單的預定行程
async def get_booking_info(payload: dict = Depends(login_required)):
	
	response_json = {"data": None}

	try:

		sql = '''SELECT a.id, a.name, a.address, a.images, b.date, b.time, b.price
				 FROM attractions AS a
				 INNER JOIN bookings AS b
				 ON a.id = b.attractionId
				 WHERE b.memberId = %s;'''
		
		db = db_config()
		con = db.get_connection()
		Cursor = con.cursor(dictionary=True)
		member_id = (payload["user_id"],)
		Cursor.execute(sql, member_id)
		booking_info = Cursor.fetchall()

		if len(booking_info) == 0:

			return response_json

		else:

			attraction = {"attraction":{}}
			attraction['attraction']['id'] = int(booking_info[0]['id'])
			attraction['attraction']['name'] = booking_info[0]['name']
			attraction['attraction']['address'] = booking_info[0]['address']
			attraction['attraction']['image'] = json.loads(booking_info[0]['images'])[0]

			response_json['data'] = attraction

			response_json['data']['date'] = booking_info[0]['date'].strftime('%Y-%m-%d')
			response_json['data']['time'] = booking_info[0]['time']
			response_json['data']['price'] = booking_info[0]['price']

			return response_json

	except Exception as e:

		raise CustomHTTPException(status_code=500, detail=str(e))

	finally:

		con.close()
		Cursor.close()


# 建立新的預定行程
@app.post("/taipei-trip/api/booking")
async def add_new_schedule(schedule_info: schedule_info, payload: dict = Depends(login_required)):

	response_json = {}

	try:

		if schedule_info.attractionId is None or schedule_info.date == '' or schedule_info.time == '' or schedule_info.price is None:

			raise CustomHTTPException(status_code=400, detail='請提供完整預定行程資訊')

		# check the member having booking record or not
		db = db_config()
		con = db.get_connection()
		Cursor = con.cursor(dictionary=True)

		check_query = '''SELECT * FROM bookings WHERE memberId = %s;'''
		Cursor.execute(check_query, (payload['user_id'],))
		yes_or_no = Cursor.fetchall()

		if len(yes_or_no) == 0:

			query = '''INSERT INTO bookings (memberId, attractionId, date, time, price) VALUES (%s, %s, %s, %s, %s);'''
			
			schedule_data = (payload['user_id'], schedule_info.attractionId, schedule_info.date, schedule_info.time, schedule_info.price) # payload['user_id'] ? 
			Cursor.execute(query, schedule_data)
			con.commit()

		else:

			update_query = '''UPDATE bookings 
							  SET attractionId = %s, date = %s, time = %s, price = %s
							  WHERE memberId = %s;'''
			schedule_data = (schedule_info.attractionId, schedule_info.date, schedule_info.time, schedule_info.price, payload['user_id'])  
			Cursor.execute(update_query, schedule_data)
			con.commit()


		response_json['ok'] = True

		return response_json
	
	except Exception as e:

		raise CustomHTTPException(status_code=500, detail=str(e))
	
	finally:

		con.close()
		Cursor.close()


# 刪除預定行程
@app.delete("/taipei-trip/api/booking")
async def remove_schedule(payload: dict = Depends(login_required)):

	response_json = {"ok": True}

	try:

		# 因為在設定裡一個會員只會有一筆未付款的預定行程
		query = '''DELETE FROM bookings WHERE memberId = %s;'''
		db = db_config()
		con = db.get_connection()
		Cursor = con.cursor(dictionary=True)
		member_id = (payload['user_id'],)  
		Cursor.execute(query, member_id)
		con.commit()

		return response_json

	except Exception as e:

		raise CustomHTTPException(status_code=500, detail=str(e))

	finally:

		con.close()
		Cursor.close()


# 建立新的訂單 並完成付款程序
@app.post("/taipei-trip/api/orders")
def order_attraction(order_info: order_info, payload: dict = Depends(login_required)):

	response_json = {}

	try:
		
		# email and phone valid or not ; no blank contact info
		email_pattern = re.compile("[a-zA-Z0-9.-_]{1,}@[a-zA-Z.-]{2,}[.]{1}[a-zA-Z]{2,}")
		phone_pattern = re.compile("^(09)[0-9]{8}$")

		if not all([order_info.order['contact']['name'], order_info.order['contact']['email'], order_info.order['contact']['phone']]):

			raise CustomHTTPException(status_code=400, detail='請提供完整預定行程資訊')
		
		elif not all([email_pattern.match(order_info.order['contact']['email']), phone_pattern.match(order_info.order['contact']['phone'])]):

			raise CustomHTTPException(status_code=400, detail='請提供正確信箱、手機號碼格式')

		else:

			# TapPay prime 
			order_num = datetime.utcnow().strftime('%Y%m%d%H%M%S%f')
			req_TapPay = {
				"prime": order_info.prime,
				"partner_key": os.getenv('TAPPAY_KEY'),
				"merchant_id": os.getenv('MERCHANT_ID'),
				"details": "TapPay info",
				"amount": order_info.order['price'],
				"order_number": order_num,
				"cardholder": {
					"phone_number": order_info.order['contact']['phone'],
					"name": order_info.order['contact']['name'],
					"email": order_info.order['contact']['email']
				},
				"remember": True
			}

			headers = {'content-type': 'application/json',
			  		   'x-api-key': os.getenv('TAPPAY_KEY')}
			response = requests.post('https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime',
									 data=json.dumps(req_TapPay), headers=headers)
			resp = response.json()
			
			if resp['status'] == 0:
				message = '付款成功'
			else:
				message = '付款失敗'
			

			sql = '''INSERT INTO orders (id, memberId, memberPhone, attractionId, date, time, price, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s);'''
			# status from tappay
			insert_order = (order_num, payload['user_id'], order_info.order['contact']['phone'], int(order_info.order['trip']['attraction']['id']), order_info.order['trip']['date'], order_info.order['trip']['time'], order_info.order['price'], resp['status'])
			db = db_config()
			con = db.get_connection()
			Cursor = con.cursor(dictionary=True)
			Cursor.execute(sql, insert_order)
			con.commit()

			# 訂單新增成功 把預定訂單刪除
			member_id = (payload['user_id'],)  
			Cursor.execute('''DELETE FROM bookings WHERE memberId = %s;''', member_id)
			con.commit()

			# replace the number key value with uuid
			response_json['data'] = {'number': order_num, 'payment': {'status': resp['status'], 'message': message}}

			return response_json

	except Exception as e:

		raise CustomHTTPException(status_code=500, detail=str(e))

	finally:

		con.close()
		Cursor.close()


# 根據訂單編號 取得訂單資訊
@app.get("/taipei-trip/api/order/{orderNumber}")
def get_order_info(orderNumber: str, payload: dict = Depends(login_required)):

	response_json = {"data": None}

	try: 

		sql = '''SELECT o.id, o.price, o.date, o.time, o.status, m.name AS memberName, m.email, o.memberPhone, o.attractionId, a.name AS attractionName, a.address, a.images
				 FROM orders AS o
				 INNER JOIN members AS m
				 ON o.memberId = m.id
				 INNER JOIN attractions AS a
				 ON o.attractionId = a.id
				 WHERE o.id = %s;'''
		orderNum = (orderNumber,)
		db = db_config()
		con = db.get_connection()
		Cursor = con.cursor(dictionary=True)
		Cursor.execute(sql, orderNum)
		order_info = Cursor.fetchall()

		if len(order_info) == 0:

			return response_json
		
		else:
			response_json['data'] = {}
			response_json['data']['number'] = order_info[0]['id']
			response_json['data']['price'] = order_info[0]['price']
			image = json.loads(order_info[0]['images'])[0]
			response_json['data']['trip'] = {'attraction': {'id': order_info[0]['attractionId'], 
									 		 				'name': order_info[0]['attractionName'], 
									 		 				'address': order_info[0]['address'],
									 		 				'image': image},
									 		 'date': order_info[0]['date'],
									 		 'time': order_info[0]['time']}
			response_json['data']['contact'] = {'name': order_info[0]['memberName'],
							   					'email': order_info[0]['email'],
												'phone': order_info[0]['memberPhone']}
			response_json['data']['status'] = order_info[0]['status']

			return response_json

	except Exception as e:

		raise CustomHTTPException(status_code=500, detail=str(e))

	finally:
	
		con.close()
		Cursor.close()


# if __name__ == '__main__':
#     uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
#	  uvicorn.run("app:app", port=8000, reload=True)