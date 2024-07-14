let counter = 1;

// fetch /api/attraction/{id}
function ProcessImgs(imgs) {

    let img_box = document.querySelector('.img_box');
    let dot_box = document.querySelector('.dot_box');

    imgs.forEach((img, ind) => {

        let newImg = document.createElement('img');
        newImg.setAttribute('src', img);
        newImg.setAttribute('class', 'attraction_imgs fade');
        img_box.appendChild(newImg);


        // image slide
        // make selection btn and arrows according to the imgs amounts
        let dot = document.createElement('img');
        dot.setAttribute('src', '/static/photo_icon/circle.png');
        dot.setAttribute('class', 'dot');
        dot.setAttribute('id', ind);
        dot_box.appendChild(dot);

        // Set the first image and dot as active
        if (ind === 0) {
            newImg.classList.add('active');
            dot.setAttribute('src', '/static/photo_icon/circle current.png');
        }

    });

};


// use re to extract the attraction id
function extractNumberFromPath(pathname) {
    
    const match = pathname.match(/\/(\d+)$/);
    
    return match ? match[1] : null;
}


async function LoadAttraction() {

    try {
        const postResponse = await fetch(`/api${window.location.pathname}`);
        const postData = await postResponse.text();
        const attraction_result = JSON.parse(postData);
        let info = attraction_result.data;

        let name = document.querySelector('.name');
        let category_at_mrt = document.querySelector('.category_at_mrt');
        let description = document.querySelector('.description');
        let address = document.querySelector('.address');
        let transport = document.querySelector('.transport');
        
        if (!attraction_result.error) {
            name.textContent = info.name;
            
            // handle null mrt information
            if (info.mrt != null) {
                category_at_mrt.textContent = `${info.category} at ${info.mrt}`;
            } else {
                category_at_mrt.textContent = `${info.category}`;
            }
            
            description.textContent = info.description;
            address.textContent = info.address;
            transport.textContent = info.transport;
            ProcessImgs(info.images);

        } else {
            window.location.href = '/';
        }
    } catch (e) {
        console.error('Error fetching attraction:', e);
    }

}


function minusSlides(n) {
    let slides = document.querySelectorAll('.attraction_imgs');
    let dots = document.querySelectorAll('.dot');

    if (n > slides.length) {
        counter = 1;
    }
    if (n < 1) {
        counter = slides.length;
    }

    slides.forEach(slide => slide.style.display = "none");
    dots.forEach(dot => dot.setAttribute('src', '/static/photo_icon/circle.png'));

    if (slides[counter - 1] && dots[counter - 1]) {
        slides[counter - 1].style.display = 'block';
        dots[counter - 1].setAttribute('src', '/static/photo_icon/circle current.png');
    }

}


function plusSlides(n) {
    let slides = document.querySelectorAll('.attraction_imgs');
    let dots = document.querySelectorAll('.dot');

    if (n > slides.length) {
        counter = 1;
    }
    if (n < 1) {
        counter = slides.length;
    }

    slides.forEach(slide => slide.style.display = "none");
    dots.forEach(dot => dot.setAttribute('src', '/static/photo_icon/circle.png'));

    if (slides[counter - 1] && dots[counter - 1]) {
        slides[counter - 1].style.display = 'block';
        dots[counter - 1].setAttribute('src', '/static/photo_icon/circle current.png');
    }
}



document.addEventListener("DOMContentLoaded", function () {

    // Because LoadAttraction is asynchronous, use a callback or promise
    // so the myslide.length can get the accurate rendered attraction img
    LoadAttraction().then(() => {

        // sign-in pop up
        let signIn = document.querySelector('.pop-background-color-sign-in');
        let closeSignIn = document.querySelector('.close-pop-sign-in');
        let signInEnroll = document.getElementById('signInEnroll');
        signInEnroll.addEventListener('click', function() {
            if (signInEnroll.textContent === '登入/註冊'){
                const fadeElement = document.getElementById('fade-sign-in');
                fadeElement.classList.add('show');
                signIn.style.display = 'flex';
            }
        })
        closeSignIn.addEventListener('click', function(){
            const fadeElement = document.getElementById('fade-sign-in');
            fadeElement.classList.remove('show');
            clearInputValue();
            adjustHeightAll();
            signIn.style.display = 'none';
        })
        signIn.addEventListener('click', function(event) {
            if (event.target === signIn) {

                // if error message shows -> hide
                const fadeElement = document.getElementById('fade-sign-in');
                fadeElement.classList.remove('show');
                let errorShow = document.querySelector('.error-message-sign-in');
                errorShow.style.display = 'none';
                clearInputValue();
                adjustHeightAll();
                signIn.style.display = 'none';

            }
        })

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
                        // User is authenticated
                        signInEnroll.textContent = "登出帳號";
    
                        document.querySelector('#signInEnroll').addEventListener("click", logout);
                    } else {
                        // Token is invalid or expired
                        localStorage.removeItem("authToken");
                        showSignInButton();
                    }
                } else {
                    throw new Error("Failed to verify token");
                }

            } catch (error) {
                console.error("Error verifying token:", error);
                localStorage.removeItem("authToken");
                showSignInButton();
            }
    
            if (!token) { 
                showSignInButton();
            }
        }

        function showSignInButton() {
            signInEnroll.textContent = "登入/註冊";
        }

        // log out -> remove localStorage token
        function logout() {
            localStorage.removeItem("authToken");
            checkLogin();  // update log out -> log-in/enroll
        }

        checkLogin();

        // enroll sign-in switch
        let enroll = document.querySelector('.pop-background-color-enroll');
        let enrollSwitch = document.querySelector('.enroll-dialog');
        let backSignIn = document.querySelector('.sign-in-dialog');
        let closeEnroll = document.querySelector('.close-pop-enroll');


        enrollSwitch.addEventListener('click', function() {
            signIn.style.display = 'none';
            enroll.style.display = 'flex';
            clearInputValue();
            adjustHeightAll();
        })
        backSignIn.addEventListener('click', function() {
            enroll.style.display = 'none';
            signIn.style.display = 'flex';
            clearInputValue();
            adjustHeightAll();
        })
        closeEnroll.addEventListener('click', function() {
            const fadeElement = document.getElementById('fade-sign-in');
            fadeElement.classList.remove('show');
            enroll.style.display = 'none';
            clearInputValue();
            adjustHeightAll();
        })
        enroll.addEventListener('click', function(event) {
            if (event.target === enroll) {
                const fadeElement = document.getElementById('fade-sign-in');
                fadeElement.classList.remove('show');
                let enrollShow = document.querySelector('.message-enroll');
                enrollShow.style.display = 'none';
                enroll.style.display = 'none';
            }
        })

        // sign in token await
        const loginForm = document.getElementById("signin"); // 要用form而不是button
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();


            let email = document.querySelector('#emailID');
            let password = document.querySelector('#passwordID');

            try {
                const response = await fetch('/api/user/auth', {
                    method: "PUT",
                    body: JSON.stringify({
                        email: email.value,
                        password: password.value
                    }),
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                let tokenJson = await response.json();
                
                //if (!response.ok) {
                if (!response.ok || !tokenJson.token) {
                    //let errorMessage = decodeURIComponent(tokenJson.message);
                    let errorMessage = tokenJson.message;

                    let adjustHeight = document.querySelector('.pop-up-sign-in');
                    adjustHeight.style.height = '310px';

                    let errorMsgShow = document.querySelector('.error-message-sign-in'); 
                    errorMsgShow.style.display = 'block';
                    errorMsgShow.textContent = errorMessage;

                    // Add event listener to hide error message on clicking other parts of the sign-in dialog
                    adjustHeight.addEventListener('click', function() {
                        errorMsgShow.style.display = 'none';
                        adjustHeightAll();
                    }, { once: true });

                } else {
                    let token = tokenJson.token;

                    // save token in localStorage
                    localStorage.setItem("authToken", token);

                    // close sign in dilalog
                    const fadeElement = document.getElementById('fade-sign-in');
                    fadeElement.classList.remove('show');
                    let closeSignIn = document.querySelector('.pop-background-color-sign-in');
                    closeSignIn.style.display = 'none';

                    // 登入/註冊 -> 登出帳戶
                    let signInEnroll = document.getElementById('signInEnroll');
                    signInEnroll.textContent = '登出帳號';

                    // 確保token已存入localStorage後才重整頁面
                    Promise.resolve().then(() => {
                    
                        location.reload();

                    });

                }


            } catch (error) {
                console.error("Login failed:", error);
                //alert("登入失敗，請確認電子信箱與密碼是否正確、已註冊");
            }

        })


        // register await
        let registerSubmit = document.querySelector('#enroll');
        registerSubmit.addEventListener('submit', async function(event) {
            
            event.preventDefault();

            let name = document.querySelector('#nameID');
            let email = document.querySelector('#emailID-enroll');
            let password = document.querySelector('#passwordID-enroll');

            try {

                const response = await fetch('/api/user', {
                    method: "POST",
                    body: JSON.stringify({
                        name: name.value,
                        email: email.value,
                        password: password.value
                    }),
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                let result = await response.json();
                let enrollResult = document.querySelector('.message-enroll');

                if (result.ok){

                    let adjustHeight = document.querySelector('.pop-up-enroll');
                    adjustHeight.style.height = '369px';

                    enrollResult.style.display = 'block';
                    enrollResult.style.color = 'green';
                    enrollResult.textContent = '註冊成功，請登入系統';

                    clearInputValue();

                    // Add event listener to hide error message on clicking other parts of the sign-in dialog
                    adjustHeight.addEventListener('click', function() {
                        enrollResult.style.display = 'none';
                        adjustHeightAll();
                    }, { once: true });

                }else {

                    let adjustHeight = document.querySelector('.pop-up-enroll');
                    adjustHeight.style.height = '369px';

                    enrollResult.style.display = 'block';
                    enrollResult.style.color = 'rgb(137, 28, 28)';
                    enrollResult.textContent = result.message;

                    // Add event listener to hide error message on clicking other parts of the sign-in dialog
                    adjustHeight.addEventListener('click', function() {
                        enrollResult.style.display = 'none';
                        adjustHeightAll();
                    }, { once: true });

                }

            }catch (error){
                console.error("Register failed:", error);
            }

        })

        // clear any input value
        function clearInputValue() {
            document.querySelector('#emailID').value = '';
            document.querySelector('#passwordID').value = '';
            document.querySelector('#nameID').value = '';
            document.querySelector('#emailID-enroll').value = '';
            document.querySelector('#passwordID-enroll').value = '';
        }
        // adjust sign in / enroll result height
        function adjustHeightAll() {
            document.querySelector('.pop-up-sign-in').style.height = '275px';
            document.querySelector('.pop-up-enroll').style.height = '332px';
        }


        // img slider arrow
        // if only one img -> no cursor at arrows;  
        let leftArrow = document.querySelector('.arrow_btn_left');
        let rightArrow = document.querySelector('.arrow_btn_right');
        let myslide = document.querySelectorAll('.attraction_imgs');
        let dots = document.querySelector('.dot_box');
        let dot = document.querySelector('.dot');

        // if only one attraction img
        if (myslide.length == 1) {
            leftArrow.classList.add('disabled');
            rightArrow.classList.add('disabled');
            dots.classList.add('disabled');
            dot.classList.add('disabled');
        }

        leftArrow.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent triggering any other click events
            counter = counter - 1;
            minusSlides(counter);
        });

        rightArrow.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent triggering any other click events
            counter = counter + 1;
            plusSlides(counter);
        });

        // click dot then show the img, change counter index to the target dot
        //let dots = document.querySelector('.dot_box');
        dots.addEventListener('click', async (event) => {
            if (event.target.classList.contains('dot')) {

                let dotsDot = document.querySelectorAll('.dot');

                dotsDot.forEach(dot => dot.setAttribute('src', '/static/photo_icon/circle.png'));
                event.target.setAttribute('src', '/static/photo_icon/circle current.png');

                counter = parseInt(event.target.id) + 1;

                let slides = document.querySelectorAll('.attraction_imgs');
                slides.forEach(slide => slide.style.display = "none");
                slides[counter - 1].style.display = 'block';

            }

        })

        plusSlides(counter);

        // checkbox 上半天 $2000 下半天 $2500
        let radioEarlier = document.querySelector('#radioEarlier');
        let radioLater = document.querySelector('#radioLater');
        let fee = document.querySelector('.fee');

        // Function to update the displayed text based on radio button states
        function updateDisplayText() {
            if (radioEarlier.checked) {
                fee.textContent = '新台幣2,000元';
            } else if (radioLater.checked) {
                fee.textContent = '新台幣2,500元';
            } 
        }

        // Add event listeners to the radio buttons to handle clicks and call the update function
        radioEarlier.addEventListener('change', updateDisplayText);
        radioLater.addEventListener('change', updateDisplayText);

        updateDisplayText();


    }).catch(error => {
        console.error('Error loading attraction:', error);
    });

    // 回首頁
    let title = document.querySelector('.title');
    title.addEventListener('click', () => {
        window.location.href = '/';
    })

    // click 開始預定行程
    // 是 -> POST: /api/booking -> booking page
    // 否 -> sign in dialog 
    let BookBtn = document.querySelector('.start_book');
    BookBtn.addEventListener('click', async (event) => {

        event.preventDefault();
        

        // 查看是否登入 
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
    
                const fadeElement = document.getElementById('fade-sign-in');
                fadeElement.classList.add('show');
                let signIn = document.querySelector('.pop-background-color-sign-in');
                signIn.style.display = 'flex';

            } else { // log in

                let attractionId = extractNumberFromPath(window.location.pathname);
                attractionId = parseInt(attractionId);

                let time = document.querySelector('input[name="time"]:checked').value;
                
                if (time == '上半天') {
                    time = 'morning';
                } else {
                    time = 'afternoon';
                }


                let priceOri = document.querySelector('.fee').textContent;
                priceOri = priceOri.match(/\d{1,3}(,\d{3})*/)[0];
                priceOri = priceOri.replace(/,/g, '');
                let price = parseInt(priceOri);

                let date = document.querySelector('.DateSetMargin').value;
    
                if (date != ''){


                    const bookingNew = await fetch('/api/booking', {
                        method: 'POST',
                        body: JSON.stringify({
                            attractionId: attractionId,
                            date: date,
                            time: time,
                            price: price
                        }),
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    })

                    let bookingResult = await bookingNew.json();

                    if (bookingResult.ok) {

                        window.location.assign('/booking');

                    } else {

                        console.log(`${bookingResult.message}`);

                    }
                
                } else {

                    let date = document.querySelector('.DateSetMargin');
                    date.classList.add('error');
                    date.addEventListener('input', () => {
                        if (date.value != '') {
                            date.classList.remove('error');
                        }
                    })

                }

            }
        } catch(e) {

            console.log('check sign in error');

        }


    })

    // 看購物車 預定行程
    let goBooking = document.querySelector('#bookAttraction');
    goBooking.addEventListener('click', async event => {

        event.preventDefault();

        // 登入驗證
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
    
                const fadeElement = document.getElementById('fade-sign-in');
                fadeElement.classList.add('show');
                let signIn = document.querySelector('.pop-background-color-sign-in');
                signIn.style.display = 'flex';

            } else { // log in

                // fix '/attraction/booking' issue
                let currentUrl = window.location.href;
                let newUrl = currentUrl.replace(/\/attraction\/.*/, '/booking');
                window.location.assign(newUrl);

            }

        } catch (e) {
            console.log(e);
        }

    })

});


