async function GetOrder() {

    if (checkLogIn()) {

        try {
            let number = extractNumberFromPath(window.location.href);
            //number = parseInt(number);
            console.log(number);
            let token = localStorage.getItem("authToken");
            const getResponse = await fetch(`/api/order/${number}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
    
            const data = await getResponse.json();

            if (getResponse.ok && data.data) {
                
                let orderNum = document.querySelector('.number');
                orderNum.textContent = number;

            }
    
        } catch (e) {
            console.error('Error fetching order number:', e);
        }

    } else {
        localStorage.removeItem("authToken");
        window.location.assign('/');
    }

}

function extractNumberFromPath(url) {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('number');
}

async function checkLogIn() {
    const token = localStorage.getItem("authToken");

    try {
        const getLogInResponse = await fetch('/api/user/auth', {
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

// loading before the data fetch back from db and backend
window.addEventListener("load", () => {
    const loader = document.querySelector(".loader");
    loader.classList.add("loader--hidden");
});

document.addEventListener("DOMContentLoaded", async function () {

    if (await checkLogIn()) {
         // 取得訂單編號
        GetOrder();
    } else {
        localStorage.removeItem("authToken");
        window.location.assign('/');
    }
   
    

    // 登出回首頁
    let logOut = document.querySelector('#signInEnroll');
    logOut.addEventListener('click', () => {
        localStorage.removeItem("authToken");
        window.location.assign('/');
    })


    // 預定行程 導到沒預定畫面
    let booking = document.querySelector('#bookAttraction');
    booking.addEventListener('click', ( () => {

        // check log in or not
        if (!checkLogIn) {
            window.location.assign('/');
        } else {
            window.location.assign('/booking');
        }

    }))

    // 回首頁
    let title = document.querySelector('.title');
    title.addEventListener('click', () => {
        window.location.href = '/';
    })

})