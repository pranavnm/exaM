let equipmentData = [];
// 1. Load Data
async function loadData() {
    try {
        const res = await fetch('equipment.json');
        equipmentData = res.ok ? await res.json() : [];
    } catch (e) {
        console.error("Error loading data", e);
        equipmentData = [];
    }
}

// 2. Helper
function formatMoney(amount) {
    return "₹" + amount.toFixed(2);
}

// 3. Start Page Logic
window.addEventListener('DOMContentLoaded', async () => {
    await loadData();

    if (document.getElementById('listings-grid')) {
        setupListings();
    } else if (document.getElementById('details-content')) {
        setupDetails();
    } else if (document.getElementById('feedback-form')) {
        setupFeedback();
    } else if (document.getElementById('contact-form')) {
        setupContact();
    } else if (document.getElementById('login-form')) {
        setupLogin();
    }
});

/* --- LOGIN PAGE --- */
function setupLogin() {
    const form = document.getElementById('login-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        if (username) {
            alert(`Welcome back, ${username}! Login successful.`);
            window.location.href = 'index.html';
        }
    };
}




/* --- BILLING PAGE --- */
function setupBilling() {
    const data = JSON.parse(localStorage.getItem('currentBooking'));
    if (!data) {
        alert("No booking found.");
        window.location.href = '../index.html';
        return;
    }

    document.getElementById('invoice-date').innerText = data.date;
    document.getElementById('bill-name').innerText = data.name;
    document.getElementById('bill-phone').innerText = data.phone;

    document.getElementById('bill-item').innerText = data.item;
    document.getElementById('bill-item-price').innerText = formatMoney(data.price * data.days);
    document.getElementById('bill-days').innerText = data.days + " Day(s)";
    document.getElementById('bill-total').innerText = data.total;

    if (data.hasOperator) {
        document.getElementById('row-operator').style.display = 'table-row';
        document.getElementById('bill-operator').innerText = formatMoney(data.days * 5000);
    }

    if (data.hasWaiver) {
        document.getElementById('row-waiver').style.display = 'table-row';
        document.getElementById('bill-waiver').innerText = formatMoney(2000);
    }
}

// 4. Validation Helper
function showError(input, message) {
    const parent = input.parentElement;
    let error = parent.querySelector('.error-message');
    if (!error) {
        error = document.createElement('small');
        error.className = 'error-message';
        parent.appendChild(error);
        if (input.nextSibling) {
            parent.insertBefore(error, input.nextSibling.nextSibling);
        } else {
            parent.appendChild(error);
        }
    }
    error.innerText = message;
    input.classList.add('input-error');
    return false;
}

function clearError(input) {
    const parent = input.parentElement;
    const error = parent.querySelector('.error-message');
    if (error) error.remove();
    input.classList.remove('input-error');
    return true;
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* --- LISTINGS PAGE --- */
function setupListings() {
    const grid = document.getElementById('listings-grid');
    const search = document.getElementById('search-input');
    const category = document.getElementById('category-filter');
    const sort = document.getElementById('sort-filter');

    function render() {
        let items = equipmentData;

        if (search && search.value) {
            items = items.filter(i => i.title.toLowerCase().includes(search.value.toLowerCase()));
        }

        if (category && category.value !== 'all') {
            items = items.filter(i => i.category === category.value);
        }

        if (sort && sort.value === 'price-asc') items.sort((a, b) => a.price - b.price);
        if (sort && sort.value === 'price-desc') items.sort((a, b) => b.price - a.price);

        // Show items
        grid.innerHTML = items.length ? '' : '<p>No items found.</p>';

        items.forEach(item => {
            const btn = item.available
                ? `<a href="details.html?id=${item.id}" class="btn">View</a>`
                : `<button class="btn" disabled style="background:#ccc">Rented</button>`;

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-image-container"><img src="${item.image}"></div>
                <div class="card-content">
                    <h3>${item.title}</h3>
                    <p>${formatMoney(item.price)} / day</p>
                    ${btn}
                </div>
            `;
            grid.appendChild(card);
        });
    }


    if (search) search.oninput = render;
    if (category) category.onchange = render;
    if (sort) sort.onchange = render;

    render();
}

/* --- DETAILS PAGE --- */
function setupDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));
    // Find the item with that ID
    let item = equipmentData.find(function (i) {
        return i.id == id;
    });

    // If item doesn't exist, show error and hide form
    if (!item) {
        document.getElementById('detail-title').innerText = "Item not found";
        document.getElementById('detail-desc').innerHTML = '<a href="listings.html">Go Back to Listings</a>';

        // Hide other elements
        document.getElementById('detail-image').style.display = 'none';
        document.getElementById('booking-section').style.display = 'none';
        return;
    }

    // --- POPULATE THE PAGE ---

    // 1. Text Content
    document.getElementById('detail-title').innerText = item.title;
    document.getElementById('detail-desc').innerText = item.description;
    document.getElementById('detail-base-price').innerText = formatMoney(item.price);

    let img = document.getElementById('detail-image');
    img.src = item.image;
    img.alt = item.title;
    img.style.display = 'block';

    document.getElementById('total').innerText = formatMoney(item.price);

    function calculateTotal() {
        let daysInput = document.getElementById('days');
        let operatorCheckbox = document.getElementById('opt-operator');
        let waiverCheckbox = document.getElementById('opt-waiver');
        let discountCheckbox = document.getElementById('opt-discount');
        let totalDisplay = document.getElementById('total');

        let days = parseInt(daysInput.value);
        if (isNaN(days) || days < 1) days = 1;

        let total = days * item.price;

        // Add Operator cost
        if (operatorCheckbox.checked) {
            total = total + (days * 5000);
        }

        // Add Waiver cost
        if (waiverCheckbox.checked) {
            total = total + 2000;
        }

        // Apply 5% Discount
        if (discountCheckbox.checked) {
            total = total * 0.95;
        }

        totalDisplay.innerText = formatMoney(total);
    }

    // Attach events
    document.getElementById('days').oninput = calculateTotal;
    document.getElementById('opt-operator').onchange = calculateTotal;
    document.getElementById('opt-waiver').onchange = calculateTotal;
    document.getElementById('opt-discount').onchange = calculateTotal;

    // Handle Form Submit
    document.getElementById('booking-form').onsubmit = (e) => {
        e.preventDefault();
        const finalTotal = document.getElementById('total').innerText;
        alert(`Booking Confirmed for ${item.title}!\nFinal Total: ${finalTotal}`);
        window.location.href = 'listings.html'; // Go back to home
    };
}

/* --- FEEDBACK PAGE --- */
function setupFeedback() {
    const list = document.getElementById('reviews-list');
    const form = document.getElementById('feedback-form');


    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');

    function renderReviews() {
        if (reviews.length === 0) {
            list.innerHTML = "";
        } else {
            list.innerHTML = reviews.map(r =>
                `<div class="review-item"><strong>${r.name}</strong> (${r.rating}/5): ${r.comment}</div>`
            ).join('');
        }
    }
    renderReviews();

    // 3. Save new review
    form.onsubmit = (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('fb-name');
        const ratingInput = document.getElementById('fb-rating');
        const commentInput = document.getElementById('fb-comment');

        // Validation
        let isValid = true;
        if (nameInput.value.trim().length < 2) isValid = showError(nameInput, "Name must be at least 2 characters");
        else clearError(nameInput);

        if (!ratingInput.value) isValid = showError(ratingInput, "Please select a rating");
        else clearError(ratingInput);

        if (commentInput.value.trim().length < 5) isValid = showError(commentInput, "Comment must be at least 5 characters");
        else clearError(commentInput);

        if (!isValid) return;

        const newReview = {
            name: nameInput.value,
            rating: ratingInput.value,
            comment: commentInput.value
        };
        reviews.unshift(newReview);

        localStorage.setItem('reviews', JSON.stringify(reviews));

        alert("Thank you for your feedback!");
        location.reload();
    };
}

/* --- CONTACT PAGE --- */
function setupContact() {
    const form = document.getElementById('contact-form');

    form.onsubmit = (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('contact-name');
        const phoneInput = document.getElementById('contact-phone');
        const emailInput = document.getElementById('contact-email');
        const msgInput = document.getElementById('contact-message');

        let isValid = true;

        if (nameInput.value.trim().length < 2) isValid = showError(nameInput, "Name must be at least 2 characters");
        else clearError(nameInput);

        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phoneInput.value.trim())) isValid = showError(phoneInput, "Phone must be exactly 10 digits");
        else clearError(phoneInput);

        if (!validateEmail(emailInput.value)) isValid = showError(emailInput, "Please enter a valid email");
        else clearError(emailInput);

        if (msgInput.value.trim().length < 10) isValid = showError(msgInput, "Message must be at least 10 characters");
        else clearError(msgInput);

        if (!isValid) return;

        alert('Thank you for your message! We will get back to you shortly.');
        form.reset();
        clearError(nameInput);
        clearError(phoneInput);
        clearError(emailInput);
        clearError(msgInput);
    };
}
