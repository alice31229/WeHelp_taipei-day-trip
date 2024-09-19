// load previous booking history
async function LoadBookingRecord() {

    try {
        const token = localStorage.getItem("authToken");
        const getResponse = await fetch('/api/booking', {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        let result = await getResponse.json();

        // member name
        let memberInfo = await fetch('/taipei-trip/api/user/auth', {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        })


        if (result.status === 403) { // not log in

            window.location.href = '/taipei-trip';

        } 
        
        if (result.data){ // have booking record

            showElements();

            if (memberInfo.ok) {
                let memberData = await memberInfo.json();
                if (memberData.data) {
                    document.querySelector('.title_style_up').textContent = `您好，${memberData.data.name}，待預定的行程如下：`;
                    document.querySelector('#inputName').value = memberData.data.name;
                    document.querySelector('#inputEmail').value = memberData.data.email;
                }
            }

            document.querySelector('.site_info').id = result.data.attraction.id;
            document.querySelector('.attraction_img').src = result.data.attraction.image;
            document.querySelector('#name').textContent = `台北一日遊：${result.data.attraction.name}`;
            document.querySelector('#date').textContent = result.data.date;

            // 上半天：早上9點到下午4點
            // 下半天：下午2點到晚上9點
            if (result.data.time === 'afternoon') {
                document.querySelector('#time').textContent = '下午2點到晚上9點';
            } else {
                document.querySelector('#time').textContent = '早上9點到下午4點';
            }
            
            let insertPrice = result.data.price
            insertPrice = insertPrice.toLocaleString('en-US');
            document.querySelector('#fee').textContent = `新台幣${insertPrice}元`;
            document.querySelector('#check_book_money').textContent = `總價：新台幣${insertPrice}元`

            document.querySelector('#address').textContent = result.data.attraction.address;
            

        } else { // no booking record

            let showNoBooking = document.querySelector('.noBookingRecord');
            showNoBooking.style.display = 'flex';

            if (memberInfo.ok) {
                let memberData = await memberInfo.json();
                if (memberData.data) {
                    document.querySelector('.title_style_up').textContent = `您好，${memberData.data.name}，待預定的行程如下：`;
                }
            }

            hideElements();

        }

    } catch(e) {
        console.log('load booking error');
    }

}

function showPageContent() {
    // Implement this function to show your main page content
    const mainContent = document.querySelector('.main-content');
    mainContent.style.display = 'block';
}

// hide contents
function hideElements() {
                
    let showNoBooking = document.querySelector('.noBookingRecord');
    let footerElement = document.querySelector('.copyRight');

    // 獲取 無預定行程 元素之後的所有同層標籤 直到 copyRight
    let sibling = showNoBooking.nextElementSibling;
    while (sibling && sibling !== footerElement) {
        sibling.classList.add('hidden');
        sibling = sibling.nextElementSibling;
    }
}

async function checkLogIn() {
    const token = localStorage.getItem("authToken");

    try {
        const getLogInResponse = await fetch('/taipei-trip/api/user/auth', {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (getLogInResponse.ok) {
            const data = await getLogInResponse.json();
            if (data.data) {
                return true;
            } else {
                return false;
            }
        }else {
            return false;
        }

    }catch (e) {
        return false;
    }
}


function showElements() {

    let showNoBooking = document.querySelector('.noBookingRecord');
    let footerElement = document.querySelector('.copyRight');

    showNoBooking.classList.add('hidden');

    // 獲取 無預定行程 元素之後的所有同層標籤 直到 copyRight
    var sibling = showNoBooking.nextElementSibling;
    while (sibling && sibling !== footerElement) {
        sibling.classList.remove('hidden');
        sibling = sibling.nextElementSibling;
    }

}


// loading before the data fetch back from db and backend
window.addEventListener("load", () => {
    const loader = document.querySelector(".loader");
    setTimeout(() => {
        loader.classList.add('loader--hidden');
    }, 1500);
});

// 從 1. index click 預定行程; 2. attraction click 開始預定行程
document.addEventListener("DOMContentLoaded", async function () {

    // booking page detail: member_name, name(attraction), date, time, fee, address, attraction_img, check_book_money
    // autocomplete 聯絡姓名(name) 聯絡信箱(email)
    // check the member has booked attraction before or not -> booking info ; no record
    
    // check log in or not then render
    if (await checkLogIn()) {
        LoadBookingRecord();
    } else {
        // Token is invalid or expired
        localStorage.removeItem("authToken");
        window.location.assign('/taipei-trip');
    };
    

    // back to homePage
    let title = document.querySelector('.title');
    title.addEventListener('click', () => {
        window.location.href = '/taipei-trip';
    })

    // log out -> remove token -> back to homePage
    let logOut = document.querySelector('#signInEnroll');
    logOut.addEventListener('click', () => {

        localStorage.removeItem("authToken");
        window.location.href = '/taipei-trip';

    })

    
    // delete booking by clicking garbage can icon
    let deleteBooking = document.querySelector('.garbage_can');
    deleteBooking.addEventListener('click', async (event) => {

        event.preventDefault();

        // check log in or not
        try {
            const token = localStorage.getItem("authToken");
            const getResponse = await fetch('/taipei-trip/api/user/auth', {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
    
            let result = await getResponse.json();
    
            if (!result.data) { // not log in
    
                let signIn = document.querySelector('.pop-background-color-sign-in');
                signIn.style.display = 'flex';

    
            } else {

                const deleteResponse = await fetch('/api/booking', {
                    method: 'DELETE',
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });

                if (deleteResponse.ok) {

                    let showNoBooking = document.querySelector('.noBookingRecord');
                    showNoBooking.style.display = 'flex';

                    hideElements();

                } else {
                    throw new Error("Failed to delete");
                }

            }
        } catch(e) {
            console.log('delete booking error');
        }

    })

    // tappay info request response
    TPDirect.setupSDK(
        152010,
        "app_Mcgzi1l36EKBSqJiDTXn8rRkcmOOFC9y8jF2RP2nNxocLU9HcHEM152HKOBA",
        "sandbox"
    );
    
    let fields = {
        number: {
        element: "#card-number",
        placeholder: "**** **** **** ****",
        },
        expirationDate: {
        element: document.getElementById("card-expiration-date"),
        placeholder: "MM / YY",
        },
        ccv: {
        element: "#card-ccv",
        placeholder: "CVV",
        },
    };
    
    TPDirect.card.setup({
        fields: fields,
        styles: {
        // Style all elements
        input: {
            color: "gray",
        },
        // Styling ccv field
        "input.ccv": {
            "font-size": "16px",
        },
        // Styling expiration-date field
        "input.expiration-date": {
            "font-size": "16px",
        },
        // Styling card-number field
        "input.card-number": {
            "font-size": "16px",
        },
        // style focus state
        ":focus": {
            color: "black",
        },
        // style valid state
        ".valid": {
            color: "green",
        },
        // style invalid state
        ".invalid": {
            color: "red",
        },
        // Media queries
        // Note that these apply to the iframe, not the root window.
        "@media screen and (max-width: 400px)": {
            input: {
                color: "orange",
            },
        },
        },
    });
    let cardprompt = document.querySelector(".cardprompt");


    async function onSubmit() {
        // 取得 TapPay Fields 的 status
        let name = document.querySelector("#inputName").value;
        let email = document.querySelector("#inputEmail").value;
        let phone = document.querySelector("#inputPhone").value;
        let prompt = document.querySelector(".prompt");
        let cardprompt = document.querySelector(".cardprompt");
    
        // phone number and email format validation
        let phoneRE = /^(09)[0-9]{8}$/;
        let emailRE = /^[a-zA-Z0-9.-_]+@[a-zA-Z.-]+\.[a-zA-Z]{2,}$/;
        if (name == "" || email == "" || phone == "") {
            prompt.textContent = "請輸入完整資訊";
            return [false, ''];
        } else if (!phone.match(phoneRE)) {
            prompt.textContent = "手機號碼格式不符合";
            return [false, ''];
        } else if (!email.match(emailRE)) {
            prompt.textContent = "電子信箱格式不符合";
            return [false, ''];
        }
    
        const tappayStatus = TPDirect.card.getTappayFieldsStatus();
        if (tappayStatus.canGetPrime === false) {
            console.log("can not get prime");
            cardprompt.textContent = "信用卡填寫錯誤";
            return [false, ''];
        }
    
        // Get prime wrapped in a Promise
        return new Promise((resolve, reject) => {
            TPDirect.card.getPrime((result) => {
                if (result.status !== 0) {
                    console.log("get prime error " + result.msg);
                    cardprompt.textContent = "信用卡填寫錯誤";
                    resolve([false, '']);
                } else {
                    let prime = result.card.prime;
                    resolve([true, prime]);
                }
            });
        });
    }

    let phoneInput = document.querySelector('#inputPhone');
    let errorText = document.querySelector('.prompt');
    phoneInput.addEventListener('input', () => {
        if (phoneInput.value != '') {
            errorText.textContent = '';
        }
    })

    let cardNumInput = document.querySelector('#card-number');
    let cardDateInput = document.querySelector('#card-expiration-date');
    let ccvInput = document.querySelector('#card-ccv');
    let cardErrorText = document.querySelector('.cardprompt');

    function checkInputs() {
        if (cardNumInput.value != '' && cardDateInput.value != '' && ccvInput.value != '') {
            cardErrorText.textContent = '';
        }
    }

    cardNumInput.addEventListener('input', checkInputs);
    cardDateInput.addEventListener('input', checkInputs);
    ccvInput.addEventListener('input', checkInputs);


    // click ordering the attraction buttom
    let orderBtn = document.querySelector('.check_book_btn');
    orderBtn.addEventListener('click', async(event) => {
        event.preventDefault();

        let [correct, prime] = await onSubmit();

        if (checkLogIn()) {
            
            if (correct) {

                try {

                    const loader = document.querySelector(".loader");
                    loader.classList.remove("loader--hidden");

                    let requestBookingData = {'prime':'', 'order':{'price': '', 'trip':{'attraction': {'id': '', 'name': '', 'address': '', 'image': ''}}, 'date': '', 'time': '', 'contact': {'name': '', 'email': '', 'phone': ''}}};
                    
                    // order
                    let price = document.querySelector('#fee').textContent;
                    let priceOri = price.match(/\d{1,3}(,\d{3})*/)[0];
                    priceOri = priceOri.replace(/,/g, '');
                    price = parseInt(priceOri);

                    let attrId = document.querySelector('.site_info').id;
                    
                    let attrName = document.querySelector('#name').textContent;
                    const parts = attrName.split('：');
                    attrName = parts.length > 1 ? parts[1].trim() : '';
                    
                    let attrAddress = document.querySelector('#address').textContent;
                    let attrImage = document.querySelector('.attraction_img').src;
                    let date = document.querySelector('#date').textContent;
                    
                    let time = document.querySelector('#time').textContent;
                    if (time == '早上9點到下午4點') {
                        time = 'morning';
                    } else if (time == '下午2點到晚上9點') {
                        time = 'afternoon';
                    }

                    let name = document.querySelector('#inputName').value;
                    let email = document.querySelector('#inputEmail').value;
                    let phone = document.querySelector('#inputPhone').value;

                    // get prime
                    requestBookingData['prime'] = prime;
                    requestBookingData['order']['price'] = price;
                    requestBookingData['order']['trip']['date'] = date;
                    requestBookingData['order']['trip']['time'] = time;
                    requestBookingData['order']['trip']['attraction']['id'] = attrId;
                    requestBookingData['order']['trip']['attraction']['name'] = attrName;
                    requestBookingData['order']['trip']['attraction']['address'] = attrAddress;
                    requestBookingData['order']['trip']['attraction']['image'] = attrImage;
                    requestBookingData['order']['contact']['name'] = name;
                    requestBookingData['order']['contact']['email'] = email;
                    requestBookingData['order']['contact']['phone'] = phone;


                    let token = localStorage.getItem("authToken");

                    const postResponse = await fetch('/api/orders', {
                        method: "POST",
                        body: JSON.stringify(requestBookingData),
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    })

                    let result = await postResponse.json();

                    if (result["error"]) {
                        cardprompt.textContent = result["message"];
                    } else if (result["data"]["payment"]["status"] != 0) {
                        cardprompt.textContent = result["data"]["payment"]["message"] + "，請再試一次";
                    } else {
                        window.location.href = `/taipei-trip/thankyou?number=${result["data"]["number"]}`;
                    }


                } catch (e) {
                    console.log(e);
                }

            } else {

                console.log('input error');

            }

        } else{

            localStorage.removeItem("authToken");
            window.location.assign('/taipei-trip');

        }

    })

})