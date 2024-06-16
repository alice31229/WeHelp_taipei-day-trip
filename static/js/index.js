function eventsDomTree(events) {
    const more_attractions = document.querySelector('.load_attractions');

    events.forEach(event => {
        // Create picture div
        const picture = document.createElement('div');
        picture.setAttribute('class', 'picture');

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

    // Arrow click event
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
});
