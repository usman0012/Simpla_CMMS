$(document).ready(function () {
    // Retrieve token from sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const countryId = urlParams.get('id');
    console.log("Country ID:", countryId);

    const userSession = JSON.parse(sessionStorage.getItem('userSession'));
    const token = userSession ? userSession.token : null;
    
    // Call the function to get countries list
    getNameSpaceList(countryId, token);

    const addCountryModal = document.getElementById('addCountryModal');
    const addCountryForm = document.getElementById('add-country-form');

    $(document).on('click', '#add-country-btn', function () {
        $('#addCountryModal').show();
    });
    
    $(document).on('click', '.btn-close', function () {
        $('#addCountryModal').hide();
        addCountryForm.reset();
    });
    
    
    addCountryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const countryName = document.getElementById('country-name').value;
        addNewNameSpace(countryName, token, countryId)
    });
});

function getNameSpaceList(id, token) {
    showLoader();
    $.ajax({
        url: `https://sbx.simpla.ai:8000/api/v1/dms/namespaces/?country=${id}`,
        type: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        contentType: 'application/json',
        success: function (response) {
            console.log("Country Details:", response);
            displayCountries(response.object)
            hideLoader();
        },
        error: function (xhr, status, error) {
            hideLoader();
            console.error('Error fetching countries:', error);
            alert('Error While fetching the NameSpace. Please try again.');
        }
    });
}

function displayCountries(namespaces) {
    const namespaceContainer = document.getElementById('namespace-container');
    if(namespaces && namespaces.length > 0) {
        namespaceContainer.innerHTML = '';
        namespaces.forEach(namespace => {
            const card = document.createElement('div');
            card.className = 'col-md-4';
            card.innerHTML = `
                <div class="card mb-3 country-card" id = ${namespace.id}>
                    <div class="card-body">
                        <h5 class="card-title">${namespace.name}</h5>
                    </div>
                </div>
            `;
            card.addEventListener('click', function () {
                window.location.href = `document.html?nid=${namespace.id}&cid=${namespace.country}`;
            });
            namespaceContainer.prepend(card);
        });
    } else {
        $("#no_data").css("display", "block");
    }
}

function addNewNameSpace(name, token, countryId) {

    $.ajax({
        url: `https://sbx.simpla.ai:8000/api/v1/dms/namespaces/`,
        type: 'POST',
        data: JSON.stringify({name: name, country: countryId}),
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        contentType: 'application/json',
        processData: 'application/json',
        success: function (response) {
            const addCountryForm = document.getElementById('add-country-form');
            $('#addCountryModal').hide();
            addCountryForm.reset();
            addCountryForm.reset();
            
            const countriesContainer = document.getElementById('namespace-container');
            const card = document.createElement('div');
            card.className = 'col-md-4';
            card.innerHTML = `
                <div class="card mb-3 country-card" id = ${response.object.id}>
                    <div class="card-body">
                        <h5 class="card-title">${response.object.name}</h5>
                    </div>
                </div>
                `;
                card.addEventListener('click', function () {
                    window.location.href = `document.html?nid=${response.object.id}&cid=${response.object.country}`;
                });
            countriesContainer.prepend(card);
            $("#no_data").css("display", "none");

        },
        error: function (xhr, status, error) {
            hideLoader();
            console.error('Error fetching countries:', error);
            alert('Error While adding a new NameSpace. Please try again.');
        }
    });
}

function showLoader() {
    $('#loader').show();
}

// Function to hide loader
function hideLoader() {
    $('#loader').hide();
}