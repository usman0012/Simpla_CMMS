$(document).ready(function () { 

    const userSession = JSON.parse(sessionStorage.getItem('userSession'));
    
    const sessionExpiry = userSession ? new Date(userSession.expiry) : null;
    // console.log(sessionExpiry)
    // if (userSession && sessionExpiry > new Date() && window.location.pathname === '/cmms.html') {
    //     redirectToDashboard();
    // }

    if (userSession && sessionExpiry > new Date()) {
        redirectToDashboard();
    }

    if ((!userSession || sessionExpiry <= new Date())) {
        redirectToLogin();
    }
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        login();
    });
});

function login() {
    showLoader()
    const apiBaseUrl = window.settings.apiBaseUrl; // Access global settings
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    formData = {
        'username': email,
        'password': password,
    };
    try {
        $.ajax({
            url: `${apiBaseUrl}/user/login`,
            type: 'POST',
            data: JSON.stringify(formData),
            contentType: 'application/json',
            processData: 'application/json',
            success: function (response) {
                hideLoader();
                console.log(response);
                if(response.message) {
                    // Store user session with expiry time (1 day)
                    const sessionData = {
                        token : response.object.access_token,
                        expiry: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
                    };
                    sessionStorage.setItem('userSession', JSON.stringify(sessionData));

                    // Redirect to dashboard
                    redirectToDashboard();
                 }
            },
            error: function (xhr, status, error) {
                hideLoader();
                console.error('Error refreshing status:', error);
                alert('Error while fetching the files.');
            },
            complete: function () {
            }
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

function showLoader() {
    $('#loader').show();
}

// Function to hide loader
function hideLoader() {
    $('#loader').hide();
}

function redirectToDashboard() {
    window.location.href = 'contries.html'; // Replace with your dashboard page
}