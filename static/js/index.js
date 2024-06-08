// load more attractions scroll

function eventsDomTree(events){
    const more_attractions = document.querySelector('.load_attractions');
    events.forEach(event => {
        const allEvents = document.createElement('div');
        allEvents.setAttribute('class','picture');

        const card = document.createElement('div');
        card.setAttribute('class', 'word');

        const attractionName = document.createElement('div');
        attractionName.setAttribute('class', 'attraction_name');
        attractionName.textContent = event.name;

        const horizon = document.createElement('div');
        horizon.setAttribute('class', 'horizonal');

        const attractionMrt = document.createElement('div');
        attractionMrt.setAttribute('class', 'attraction_mrt');
        attractionMrt.textContent = event.mrt;

        const attractionCategory = document.createElement('div');
        attractionCategory.setAttribute('class', 'attraction_category');
        attractionCategory.textContent = event.category;

        const eventImg = document.createElement('img');
        eventImg.src = event.images[0];

        horizon.appendChild(attractionMrt);
        horizon.appendChild(attractionCategory);
        card.appendChild(attractionName);
        card.appendChild(horizon);

        allEvents.appendChild(eventImg);
        allEvents.appendChild(card);

        more_attractions.appendChild(allEvents);
    });
    
};

async function addAttraction(page) {
    const postResponse = await fetch(`http://0.0.0.0:8000/api/attractions?page=${page}`);
    const postData = await postResponse.text();
    const attraction_result = JSON.parse(postData);
    let infos = attraction_result.data;
    
    try{
        eventsDomTree(infos);

        // judge last page or not then add footer
        if (attraction_result.nextPage == null){
            pageIndex = 0;
        }else{
            pageIndex += 1;
            document.querySelector('#loading').classList.remove('show');
            isActive = false;
        }
    }catch(e){
        console.log('scroll over');
    }finally{
        document.querySelector('#loading').classList.remove('show');
    }
    
}


async function addKwdAttraction(page, keyword) {
    const postResponse = await fetch(`http://0.0.0.0:8000/api/attractions?page=${page}&keyword=${keyword}`);
    //let pageJudge = await fetch(`http://127.0.0.1:3000/api/attractions?page=${page}`);
    const postData = await postResponse.text();
    //let pageJudge2 = await pageJudge.text();
    const attraction_result = JSON.parse(postData);
    //let pageJudge3 = JSON.parse(pageJudge2);

    let infos = attraction_result.data;
    
    try{
        eventsDomTree(infos);

        // judge last page or not then add footer
        if (attraction_result.nextPage == null){
            //kwdPage = 0;
            isActive = true;
        }else{
            //kwdPage += 1;
            document.querySelector('#loading').classList.remove('show');
            isActive = false;
        }
    }catch(e){
        console.log('scroll over');
    }finally{
        document.querySelector('#loading').classList.remove('show');
    }
    
}


// // keyword search

function check(){
    let originalAttractions = document.querySelector('.load_attractions');
    if (originalAttractions.innerHTML == ''){
        originalAttractions.innerHTML = '<h3>查無旅遊景點資訊</h3>';
    }
}

window.onload = function(){ // 等onload完dom元素才抓得到按鈕
    let btn = document.querySelector('.searchKeyword_button'); 
    btn.addEventListener('click', function(e){
        e.preventDefault(); 
        isActive = false;

        // 先清空景點畫面
        let originalAttractions = document.querySelector('.load_attractions');
        originalAttractions.innerHTML = '';


        // 再載入關鍵字景點
        let kwd = document.querySelector('.searchKeyword_input');

        addKwdAttraction(0, kwd.value);
        
        //setTimeout(check(), 2000);
        
    });
}

// load the mrts into the mrt_sorted part


// if rwd in mobile mode, change the back_img to the [mobile] one