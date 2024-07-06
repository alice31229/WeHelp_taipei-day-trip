function eventsDomTree(events) {
    const more_attractions = document.querySelector('.load_attractions');

    events.forEach(event => {
        // Create picture div
        const picture = document.createElement('div');
        picture.setAttribute('class', 'picture');
        //picture.setAttribute('id', event.id);

        const eventImg = document.createElement('img');
        eventImg.src = event.images[0];
        eventImg.alt = 'Attraction';

        const attractionName = document.createElement('div');
        attractionName.setAttribute('class', 'attraction_name');
        attractionName.textContent = event.name;

        picture.appendChild(eventImg);
        picture.appendChild(attractionName);

        // Create word div
        const word = document.createElement('div');
        word.setAttribute('class', 'word');

        const attractionMrt = document.createElement('div');
        attractionMrt.setAttribute('class', 'attraction_mrt');
        attractionMrt.textContent = event.mrt;

        const attractionCategory = document.createElement('div');
        attractionCategory.setAttribute('class', 'attraction_category');
        attractionCategory.textContent = event.category;

        word.appendChild(attractionMrt);
        word.appendChild(attractionCategory);

        // Unite picture and word into picture_word
        const picture_word = document.createElement('div');
        picture_word.setAttribute('class', 'picture_word');
        picture_word.setAttribute('id', event.id);

        // Append picture and word divs to the load_attractions div
        picture_word.appendChild(picture);
        picture_word.appendChild(word);

        more_attractions.appendChild(picture_word);
    });
}

let nextPage = 0;
let isLoading = false;

async function addAttraction(page = 0) {
    if (isLoading) return; // Prevent multiple fetch requests
    isLoading = true;

    let clr = document.querySelector('.noAttraction');
    clr.style.display = 'none';
    let footer = document.querySelector('.copyRight');
    footer.style.display = 'none';
    footer.style.position = '';

    let loading = document.querySelector('#loading');
    loading.style.display = 'block';

    try {
        const postResponse = await fetch(`/api/attractions?page=${page}`);
        const postData = await postResponse.text();
        const attraction_result = JSON.parse(postData);
        let infos = attraction_result.data;

        eventsDomTree(infos);

        // Judge last page or not then show footer
        if (attraction_result.nextPage == null) {
            nextPage = 0;
            loading.style.display = 'none';
            footer.style.display = 'flex';
        } else {
            nextPage = attraction_result.nextPage;
        }
    } catch (e) {
        console.error('Error fetching attractions:', e);
    } finally {
        isLoading = false;
    }
}

async function addKwdAttraction(page = 0, keyword) {
    if (isLoading) return; // Prevent multiple fetch requests
    isLoading = true;

    let clr = document.querySelector('.noAttraction');
    clr.style.display = 'none';
    let footer = document.querySelector('.copyRight');
    footer.style.display = 'none';
    footer.style.position = '';

    let loading = document.querySelector('#loading');
    loading.style.display = 'block';

    try {
        const postResponse = await fetch(`/api/attractions?page=${page}&keyword=${keyword}`);
        const postData = await postResponse.text();
        const attraction_result = JSON.parse(postData);
        let infos = attraction_result.data;

        if (attraction_result.error) {
            check();
        } else {
            eventsDomTree(infos);
        }

        // Judge last page or not then add footer
        if (attraction_result.nextPage == null) {
            nextPage = 0;
            loading.style.display = 'none';
            footer.style.display = 'flex';
        } else {
            nextPage = attraction_result.nextPage;
        }
    } catch (e) {
        console.error('Error fetching keyword attractions:', e);
    } finally {
        isLoading = false;
    }
}

function check() {
    let no_attraction = document.querySelector('.noAttraction');
    no_attraction.style.display = 'flex';
    let footerFixed = document.querySelector('.copyRight');
    footerFixed.style.position = 'fixed';
}

async function addMRT() {
    try {
        const postResponse = await fetch('/api/mrts');
        const postData = await postResponse.text();
        const mrt_result = JSON.parse(postData);
        let infos = mrt_result.data;

        let appendHere = document.querySelector('.mrts');

        infos.forEach(m => {
            const newMRTDiv = document.createElement('div');
            newMRTDiv.textContent = m;
            newMRTDiv.className = 'mrt';

            appendHere.appendChild(newMRTDiv);
        });
    } catch (e) {
        console.error('Error fetching MRTs:', e);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    
    addMRT();
    addAttraction();
    checkLogin();

    // sign-in pop up
    let signIn = document.querySelector('.pop-background-color-sign-in');
    let closeSignIn = document.querySelector('.close-pop-sign-in');
    let signInEnroll = document.getElementById('signInEnroll');
    signInEnroll.addEventListener('click', function() {
        if (signInEnroll.textContent === '登入/註冊'){
            signIn.style.display = 'flex';
        }
    })
    closeSignIn.addEventListener('click', function(){
        clearInputValue();
        adjustHeightAll();
        signIn.style.display = 'none';
    })
    signIn.addEventListener('click', function(event) {
        if (event.target === signIn) {

            // if error message shows -> hide
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
        enroll.style.display = 'none';
        clearInputValue();
        adjustHeightAll();
    })
    enroll.addEventListener('click', function(event) {
        if (event.target === enroll) {
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

    // infinite scroll observer settings
    let observer;
    const observerOptions = {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
    };

    const createObserver = (callback) => {
        if (observer) observer.disconnect(); // avoid observers interfering each other
        observer = new IntersectionObserver(callback, observerOptions);
        const loadingElement = document.querySelector('#loading');
        observer.observe(loadingElement);
    };

    const observerCallback = entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading) {
                if (nextPage) {
                    addAttraction(nextPage);
                } else {
                    const footer = document.querySelector('.copyRight');
                    footer.style.display = 'flex';
                }
            }
        });
    };

    createObserver(observerCallback);

    // Keyword search event
    let btn = document.querySelector('.searchKeyword_button');
    btn.addEventListener('click', function (e) {
        e.preventDefault();

        let originalAttractions = document.querySelector('.load_attractions');
        originalAttractions.innerHTML = '';

        let kwd = document.querySelector('.searchKeyword_input');
        addKwdAttraction(0, kwd.value);

        const keywordObserverCallback = entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !isLoading) {
                    if (nextPage) {
                        addKwdAttraction(nextPage, kwd.value);
                    } else {
                        const footer = document.querySelector('.copyRight');
                        footer.style.display = 'flex';
                    }
                }
            });
        };

        createObserver(keywordObserverCallback);
    });

    // attraction click event
    let attractions = document.querySelector('.load_attractions');
    attractions.addEventListener('click', async (event) => {
        // Check if the clicked element or its parent has the 'picture_word' class
        let targetElement = event.target;
        while (targetElement && !targetElement.classList.contains('picture_word')) {
            targetElement = targetElement.parentElement;
        }

        if (targetElement && targetElement.classList.contains('picture_word')) {
            let attrID = targetElement.id;
            console.log(`Navigating to attraction/${attrID}`); // For debugging

            // Ensure attrID is valid before navigating
            if (attrID) {
                window.location.assign(`attraction/${attrID}`);
            }
            return;
        }
    })

    // MRT click event
    let mrts = document.querySelector('.mrts');
    mrts.addEventListener('click', async (event) => {
        if (event.target.classList.contains('mrt')) {
            const keyword = event.target.textContent;
            let searchKeyword_input = document.querySelector('.searchKeyword_input');
            searchKeyword_input.value = keyword;

            let originalAttractions = document.querySelector('.load_attractions');
            originalAttractions.innerHTML = '';

            addKwdAttraction(0, keyword);

            const keywordObserverCallback = entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !isLoading) {
                        if (nextPage) {
                            addKwdAttraction(nextPage, keyword);
                        } else {
                            const footer = document.querySelector('.copyRight');
                            footer.style.display = 'flex';
                        }
                    }
                });
            };

            createObserver(keywordObserverCallback);
        }
    });

    // mrt Arrow click event
    let leftArrow = document.querySelector('.left-arrow');
    let rightArrow = document.querySelector('.right-arrow');
    const mrtList = document.querySelector('.mrts');

    if (leftArrow && rightArrow && mrtList) {
        leftArrow.addEventListener('click', () => {
            mrtList.scrollBy({ left: -300, behavior: 'smooth' });
        });

        rightArrow.addEventListener('click', () => {
            mrtList.scrollBy({ left: 300, behavior: 'smooth' });
        });
    } else {
        console.log("One or more elements not found:", { leftArrow, rightArrow, mrtList });
    }

    // Arrow hover effect
    const leftDefaultSrc = '/static/photo_icon/mrt_left_Default.png';
    const leftHoverSrc = '/static/photo_icon/mrt_left_Hovered.png';
    const rightDefaultSrc = '/static/photo_icon/mrt_right_Default.png';
    const rightHoverSrc = '/static/photo_icon/mrt_right_Hovered.png';

    leftArrow.addEventListener('mouseover', () => {
        leftArrow.src = leftHoverSrc;
    });

    leftArrow.addEventListener('mouseout', () => {
        leftArrow.src = leftDefaultSrc;
    });

    rightArrow.addEventListener('mouseover', () => {
        rightArrow.src = rightHoverSrc;
    });

    rightArrow.addEventListener('mouseout', () => {
        rightArrow.src = rightDefaultSrc;
    });

    // back to home page by clicking 台北一日遊
    let home = document.querySelector('.title');
    home.addEventListener('click', () => {
        let clr = document.querySelector('.noAttraction');
        clr.style.display = 'none';
        let footer = document.querySelector('.copyRight');
        footer.style.display = 'none';
        footer.style.position = '';
        window.location.href = '/';
    });

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
    
                let signIn = document.querySelector('.pop-background-color-sign-in');
                signIn.style.display = 'flex';

            } else { // log in

                window.location.assign('/booking');

            }

        } catch (e) {
            console.log(e);
        }

    })

});
