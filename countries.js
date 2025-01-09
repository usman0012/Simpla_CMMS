$(document).ready(function () {
    // Retrieve token from sessionStorage
    const userSession = JSON.parse(sessionStorage.getItem('userSession'));
    
    const token = userSession ? userSession.token : null;
    
    if (!token) {
        alert("Session expired or invalid. Please log in again.");
        window.location.href = 'cmms.html'; // Redirect to login
        return;
    }

    const apiBaseUrl = window.settings.apiBaseUrl; // Access global settings

    // Call the function to get countries list
    getCountriesList(token, apiBaseUrl);
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
        addNewCountry(countryName, token, apiBaseUrl);
    });
});

function getCountriesList(token, apiBaseUrl) {
    showLoader();
    $.ajax({
        url: `${apiBaseUrl}/dms/countries/`,
        type: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        contentType: 'application/json',
        success: function (response) {
            displayCountries(response.object)
            console.log("Countries List:", response);
            hideLoader()
            // Populate the data into the UI
        },
        error: function (xhr, status, error) {
            hideLoader()
            console.error('Error fetching countries:', error);
            alert('Failed to fetch countries. Please try again.');
        }
    });
}

function addNewCountry(name, token, apiBaseUrl) {

    $.ajax({
        url: `${apiBaseUrl}/dms/countries/`,
        type: 'POST',
        data: JSON.stringify({name: name}),
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
            
            const countriesContainer = document.getElementById('countries-container');
            const card = document.createElement('div');
            card.className = 'col-md-4';
            card.innerHTML = `
                <div class="card mb-3 country-card" id = ${response.object.id}>
                    <div class="card-body">
                        <h5 class="card-title">${response.object.name}</h5>
                        <p class="card-title">Number of Documents : ${response.object.number_of_documents}</p>
                        <p class="card-title">Number of NameSpace : ${response.object.number_of_namespaces}</p>
                    </div>
                </div>
            `;
            card.addEventListener('click', function () {
                window.location.href = `country.html?id=${response.object.id}`;
            });
            countriesContainer.prepend(card);

            console.log("Countries List:", response);
            // Populate the data into the UI
        },
        error: function (xhr, status, error) {
            console.error('Error fetching countries:', error);
            alert('Failed to add new country. Please try again.');
        }
    });
}

function displayCountries(countries) {
    const countriesContainer = document.getElementById('countries-container');
    if(countries.length > 0) {
        countriesContainer.innerHTML = '';
        countries.forEach(country => {
            const card = document.createElement('div');
            card.className = 'col-md-4';
            card.innerHTML = `
                <div style="cursor:pointer;" class="card mb-3 country-card" id = ${country.id}>
                    <div class="card-body">
                        <h5 class="card-title" title="${country.name}">${country.name}</h5>
                        <p class="card-title">Number of Documents : ${country.number_of_documents}</p>
                        <p class="card-title">Number of NameSpace : ${country.number_of_namespaces}</p>
                    </div>
                </div>
            `;
            card.addEventListener('click', function () {
                window.location.href = `country.html?id=${country.id}`;
            });
            countriesContainer.prepend(card);
        });
    }
}

function showLoader() {
    $('#loader').show();
}

// Function to hide loader
function hideLoader() {
    $('#loader').hide();
}