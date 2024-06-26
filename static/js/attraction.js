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

    LoadAttraction();

    // img slider arrow
    // if only one img -> no cursor at arrows;  
    let leftArrow = document.querySelector('.arrow_btn_left');
    let rightArrow = document.querySelector('.arrow_btn_right');
    let myslide = document.querySelectorAll('.attraction_imgs');


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

    // click dot then show the img change counter index to the target dot
    let dots = document.querySelector('.dot_box');
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

    // if only one attraction img
    if (myslide.length == 1) {
        leftArrow.style.cursor = '';
        rightArrow.style.cursor = '';
    }

    //showSlides(counter); // Initialize the slideshow
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

});


