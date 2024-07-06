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
        let memberInfo = await fetch('/api/user/auth', {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        })


        if (result.status === 403) { // not log in

            window.location.href = '/';

        } else if (result.data){ // have booking record

            showElements();

            if (memberInfo.ok) {
                let memberData = await memberInfo.json();
                if (memberData.data) {
                    document.querySelector('.title_style_up').textContent = `您好，${memberData.data.name}，待預定的行程如下：`;
                    document.querySelector('#inputName').value = memberData.data.name;
                    document.querySelector('#inputEmail').value = memberData.data.email;
                }
            }

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

// 從 1. index click 預定行程; 2. attraction click 開始預定行程
document.addEventListener("DOMContentLoaded", function () {

    // booking page detail: member_name, name(attraction), date, time, fee, address, attraction_img, check_book_money
    // autocomplete 聯絡姓名(name) 聯絡信箱(email)
    // check the member has booked attraction before or not -> booking info ; no record
    
    // check log in or not
    async function checkLogin() {

        const token = localStorage.getItem("authToken");
        try {
            const response = await fetch('/api/user/auth', {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data) {

                    LoadBookingRecord();

                } else {

                    // Token is invalid or expired
                    localStorage.removeItem("authToken");
                    window.location.assign('/');

                }
            } else {
                throw new Error("Failed to verify token");
            }

        } catch (error) {
            console.error("Error verifying token:", error);
            localStorage.removeItem("authToken");
            showSignInButton();
        }

    }

    checkLogin();
    

    // back to homePage
    let title = document.querySelector('.title');
    title.addEventListener('click', event => {
        window.location.href = '/';
    })

    // log out -> remove token -> back to homePage
    let logOut = document.querySelector('#signInEnroll');
    logOut.addEventListener('click', event => {

        localStorage.removeItem("authToken");
        window.location.href = '/';

    })

    
    // delete booking by clicking garbage can icon
    let deleteBooking = document.querySelector('.garbage_can');
    deleteBooking.addEventListener('click', async (event) => {

        event.preventDefault();

        // check log in or not
        try {
            const token = localStorage.getItem("authToken");
            const getResponse = await fetch('/api/user/auth', {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
    
            let result = await getResponse.json();
    
            if (!result.data) { // not log in
    
                //window.location.href = '/';
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


})