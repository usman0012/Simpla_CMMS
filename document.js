$(document).ready(function () {
    // Retrieve token from sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('nid');
    const countryId = urlParams.get('cid');

    const userSession = JSON.parse(sessionStorage.getItem('userSession'));
    const token = userSession ? userSession.token : null;
    
    const apiBaseUrl = window.settings.apiBaseUrl; // Access global settings

    getDocumentList(id, token, apiBaseUrl);

    $(document).on('click', '.delete', function () {
        docId = this.parentElement.className;
        const isConfirmed = window.confirm('Are you certain? This action will permanently delete the file from the database and cannot be undone.');
        if (isConfirmed) {
            deleteDocument(docId, token, id, apiBaseUrl);
        }
    })

    $(document).on('click', '.view', function () {
        s3Link   = this.parentElement.parentElement.parentElement.children[0].children[0].getAttribute('s3');
        PreviewDoc(s3Link);
    })

    $(document).on('click', '.doc-details', function () {
        displayName = this.children[0].getAttribute('display-name');
        fileName = this.children[0].getAttribute('name');
        confirmed_to_prod = this.children[0].getAttribute('confirmed_to_prod');
        is_notified = this.children[0].getAttribute('is_notified');
        docId = this.parentElement.id
        EditDocument(displayName, docId, fileName, confirmed_to_prod, is_notified, apiBaseUrl);
    })

    $(document).on('click', '#back-to-namespace', function () {
        window.location.href = `country.html?id=${countryId}`;
    });

    // popup to add or edit document 
    const addItemBtn = document.getElementById("addItemBtn");
    const popupContainer = document.getElementById("popupContainer");
    const closePopupBtn = document.getElementById("closePopupBtn");

    // Show popup
    addItemBtn.addEventListener("click", () => {
        $("#preview-doc-sec").hide();
        $("#add-edit-doc-sec").show();
        popupContainer.classList.add("show");
        $("#proprietary_sec").show();
        $("#confirmed_to_prod_sec").css("display", "none");
        $("#is_notified_sec").css("display", "none");
        $('.file-count')[0].innerText  = 'No file chosen';
        $("#doc_heading")[0].innerHTML = 'Add Document';
        $("#file-name")[0].value = ''

    });

    // Hide popup
    closePopupBtn.addEventListener("click", () => {
        popupContainer.classList.remove("show");
        popupContainer.classList.remove("max-width");

    });

    // Optionally close the popup when clicking outside of it
    window.addEventListener("click", (event) => {
        if (event.target === popupContainer) {
            popupContainer.classList.remove("show");
        }
    });

    const addDocForm = document.getElementById('add-edit-document');
    addDocForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        check = $("#doc_heading")[0].innerText
        if(check == "Add Document") {
            addNewDoc(id, token, apiBaseUrl);
        } else {
            updateDoc(id, token, apiBaseUrl);
        }
    });

    function addNewDoc(id, token, apiBaseUrl) {
        var files = $('#file')[0].files;
        var fileName = $('#file-name').val();
        var proprietary = $('#proprietary')[0].checked

        if (files.length === 0) {
            alert('Please upload at least one file.');
            return;
        }

        var formData = new FormData();

        if(files.length > 0){
            $.each(files, function (i, file) {
                formData.append('file', file);
            });
        }
        formData.append('display_name', fileName);
        formData.append('is_proprietary', proprietary);
        formData.append('namespace', id);
        formData.append('country', countryId);
        showLoader();
        $.ajax({
            url: `${apiBaseUrl}/dms/documents/`,
            type: 'POST',
            data: formData,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            contentType: false,
            processData: false,
            success: function (response) {
                getDocumentList(id, token, apiBaseUrl);
                const popupContainer = document.getElementById("popupContainer");
                const addForm = document.getElementById("add-edit-document");
                addForm.reset();
                popupContainer.classList.remove("show");
                hideLoader();
                $("#no_data").css("display", "none");
            },
            error: function (xhr, status, error) {
                console.error('Error uploading files and text:', error);
                alert('Error uploading files and text.');
                hideLoader();
            },
            complete: function () {
                // Hide the loader after the API call completes
                hideLoader();
            }
        });
    }

    function updateDoc(id, token, apiBaseUrl) {
        var files = $('#file')[0].files;
        var fileName = $('#file-name').val();
        var docId = $('#doc_id').val();
        var is_notified = $('#is_notified')[0].checked
        var confirmed_to_prod = $('#confirmed_to_prod')[0].checked

        var formData = new FormData();
        if(files.length > 0){
            $.each(files, function (i, file) {
                formData.append('file', file);
            });
        }

        formData.append('display_name', fileName);
        formData.append('is_notified', is_notified);
        formData.append('confirmed_to_prod', confirmed_to_prod);

        showLoader();
        $.ajax({
            url: `${apiBaseUrl}/dms/documents/${docId}/`,
            type: 'PATCH',
            data: formData,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            contentType: false,
            processData: false,
            success: function (response) {
                getDocumentList(id, token, apiBaseUrl);
                const popupContainer = document.getElementById("popupContainer");
                const addForm = document.getElementById("add-edit-document");
                addForm.reset();
                popupContainer.classList.remove("show");
                hideLoader();
            },
            error: function (xhr, status, error) {
                console.error('Error uploading files and text:', error);
                alert('Error while uploading the file');
                hideLoader();
            },
            complete: function () {
                // Hide the loader after the API call completes
                hideLoader();
            }
        });
    }

    function PreviewDoc(s3Link) {
        const popupContainer = document.getElementById("popupContainer");
        popupContainer.classList.add("show");
        popupContainer.classList.add("max-width");
        $("#preview-doc-sec").show();
        $("#add-edit-doc-sec").hide();
        $("#preview-doc-sec").html(`<embed id = 'pdf' src="${s3Link}" style="height: 100%;width:100%"></embed>`);
    }

    $(document).on('click', '.upload-files', function () {
        document.getElementById('file').click();
    });

    $(document).on('change', '#file', function () {
        const fileInput = document.getElementById('file');
        const fileCount = fileInput.files.length;
        $(".file-count")[0].innerText = fileInput.files[0].name;
    })
});

function getDocumentList(id, token, apiBaseUrl) {
    $.ajax({
        url: `${apiBaseUrl}/dms/documents/?namespace=${id}`,
        type: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        contentType: 'application/json',
        success: function (response) {
            console.log("namespace Details:", response);
            displayDocuments(response.object)
        },
        error: function (xhr, status, error) {
            hideLoader();
            console.error('Error fetching countries:', error);
            alert('Failed to fetch Document. Please try again.');
        }
    });
}

function displayDocuments(documents) {
     $('#doc_in_prod')[0].innerHTML = ''
     $('#searchContainer')[0].innerHTML = ''
     is_prod = false;
     $("#prod_section").hide();
     $("#both_section").hide();
    if(documents && documents.length > 0) {
        documents.forEach(doc => {
            cardHtml = `
                <div class="col-12 col-sm-6 col-md-3 mb-3">
                    <div class="my-card">
                        <div class="my-card-body" id="${doc.id}" title="${doc.file_name}">
                            <div class = "doc-details">
                                <input type="hidden" value="${doc.file_type}" name = "${doc.file_name}" s3 = "${doc.presigned_url}" country = "${doc.country}" namespace = "${doc.namespace}" display-name = "${doc.display_name}" is_proprietary = "${doc.is_proprietary}" is_notified = "${doc.is_notified}" confirmed_to_prod = "${doc.loaded_to_prod}"></input>
                                <h5 id="chunk-heading"  class="card-title">${doc.display_name}</h5>
                            </div>
                            <div>`;
                            cardHtml += `<svg width="55" height="25" viewBox="0 0 51 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g opacity="0.75">
                                <rect width="51" height="20" rx="5" fill="#808080" fill-opacity="0.25"/>
                                <path d="M7.75146 17.3359C7.05322 17.3359 6.52214 17.154 6.1582 16.79C5.7985 16.4261 5.61865 15.8929 5.61865 15.1904V5.6499C5.61865 4.95166 5.7985 4.41846 6.1582 4.05029C6.52214 3.68213 7.05322 3.49805 7.75146 3.49805H10.6396V8.40479C10.6396 9.18343 11.0269 9.57275 11.8013 9.57275H16.6636V15.1904C16.6636 15.8929 16.4816 16.4261 16.1177 16.79C15.7537 17.154 15.2248 17.3359 14.5308 17.3359H7.75146ZM11.9854 8.59521C11.7357 8.59521 11.6108 8.47249 11.6108 8.22705V3.56152C11.7632 3.57845 11.9155 3.64193 12.0679 3.75195C12.2202 3.85775 12.3789 3.99528 12.5439 4.16455L15.9907 7.64941C16.1642 7.82715 16.3039 7.99219 16.4097 8.14453C16.5155 8.29688 16.5789 8.4471 16.6001 8.59521H11.9854Z" fill="black" fill-opacity="0.65"/>
                                <path d="M22.8779 15V5.84033H26.312C27.2218 5.84033 27.9963 6.01807 28.6353 6.37354C29.2785 6.729 29.7694 7.24528 30.1079 7.92236C30.4507 8.59945 30.6221 9.41618 30.6221 10.3726V10.3853C30.6221 11.3628 30.4528 12.1965 30.1143 12.8862C29.7757 13.5718 29.2848 14.0965 28.6416 14.4604C28.0026 14.8201 27.2261 15 26.312 15H22.8779ZM24.5156 13.6226H26.0962C26.7013 13.6226 27.2176 13.4977 27.645 13.248C28.0724 12.9984 28.3962 12.6344 28.6162 12.1562C28.8405 11.6781 28.9526 11.0962 28.9526 10.4106V10.3979C28.9526 9.72933 28.8384 9.15804 28.6099 8.68408C28.3856 8.20589 28.0597 7.84196 27.6323 7.59229C27.2049 7.34261 26.6929 7.21777 26.0962 7.21777H24.5156V13.6226ZM35.332 15.1396C34.6423 15.1396 34.0477 14.9958 33.5483 14.708C33.049 14.416 32.6639 14.0013 32.3931 13.4639C32.1265 12.9264 31.9932 12.2832 31.9932 11.5342V11.5215C31.9932 10.7809 32.1286 10.1419 32.3994 9.60449C32.6702 9.06283 33.0532 8.64811 33.5483 8.36035C34.0477 8.07259 34.6423 7.92871 35.332 7.92871C36.0218 7.92871 36.6143 8.07259 37.1094 8.36035C37.6087 8.64811 37.9938 9.06071 38.2646 9.59814C38.5355 10.1356 38.6709 10.7767 38.6709 11.5215V11.5342C38.6709 12.2832 38.5355 12.9264 38.2646 13.4639C37.998 14.0013 37.6151 14.416 37.1157 14.708C36.6206 14.9958 36.026 15.1396 35.332 15.1396ZM35.332 13.8574C35.696 13.8574 36.0049 13.7664 36.2588 13.5845C36.5169 13.3983 36.7137 13.1338 36.8491 12.791C36.9845 12.444 37.0522 12.0272 37.0522 11.5405V11.5278C37.0522 11.0369 36.9845 10.6201 36.8491 10.2773C36.7137 9.93034 36.5169 9.66585 36.2588 9.48389C36.0049 9.29769 35.696 9.20459 35.332 9.20459C34.9681 9.20459 34.6571 9.29769 34.3989 9.48389C34.1408 9.66585 33.944 9.93034 33.8086 10.2773C33.6732 10.6201 33.6055 11.0369 33.6055 11.5278V11.5405C33.6055 12.0272 33.6732 12.444 33.8086 12.791C33.944 13.138 34.1387 13.4025 34.3926 13.5845C34.6507 13.7664 34.9639 13.8574 35.332 13.8574ZM43.2349 15.1396C42.5366 15.1396 41.9399 14.9958 41.4448 14.708C40.9497 14.4202 40.571 14.0055 40.3086 13.4639C40.0462 12.9222 39.915 12.2747 39.915 11.5215V11.5088C39.915 10.7598 40.0462 10.1187 40.3086 9.58545C40.571 9.05225 40.9497 8.64388 41.4448 8.36035C41.9399 8.07259 42.5345 7.92871 43.2285 7.92871C43.8252 7.92871 44.3372 8.03239 44.7646 8.23975C45.1963 8.44287 45.5369 8.7264 45.7866 9.09033C46.0405 9.45003 46.1971 9.87109 46.2563 10.3535V10.3789H44.7646L44.7583 10.3599C44.6864 10.0213 44.5213 9.74414 44.2632 9.52832C44.0093 9.3125 43.6665 9.20459 43.2349 9.20459C42.8752 9.20459 42.5662 9.29557 42.3081 9.47754C42.0542 9.65951 41.8595 9.92188 41.7241 10.2646C41.5887 10.6074 41.521 11.0221 41.521 11.5088V11.5215C41.521 12.0124 41.5887 12.4334 41.7241 12.7847C41.8638 13.1317 42.0605 13.3983 42.3145 13.5845C42.5684 13.7664 42.8752 13.8574 43.2349 13.8574C43.6453 13.8574 43.9754 13.7643 44.2251 13.5781C44.479 13.3919 44.6546 13.1169 44.752 12.7529L44.7646 12.7275L46.25 12.7212L46.2437 12.7783C46.1675 13.248 46.0024 13.6606 45.7485 14.0161C45.4989 14.3716 45.1646 14.6488 44.7456 14.8477C44.3267 15.0423 43.8231 15.1396 43.2349 15.1396Z" fill="black" fill-opacity="0.75"/>
                                </g>
                            </svg>`
                            cardHtml += `
                                <div style ="float:right; cursor:pointer; display:flex" class="${doc.id}">
                                <?xml  version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
                                <svg class="view"  width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="3.5" stroke="#222222"/>
                                <path d="M20.188 10.9343C20.5762 11.4056 20.7703 11.6412 20.7703 12C20.7703 12.3588 20.5762 12.5944 20.188 13.0657C18.7679 14.7899 15.6357 18 12 18C8.36427 18 5.23206 14.7899 3.81197 13.0657C3.42381 12.5944 3.22973 12.3588 3.22973 12C3.22973 11.6412 3.42381 11.4056 3.81197 10.9343C5.23206 9.21014 8.36427 6 12 6C15.6357 6 18.7679 9.21014 20.188 10.9343Z" stroke="#222222"/>
                                </svg>
                                <svg class="delete"  xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 100 100" width=25px" height="25px"><path d="M 46 13 C 44.35503 13 43 14.35503 43 16 L 43 18 L 32.265625 18 C 30.510922 18 28.879517 18.922811 27.976562 20.427734 L 26.433594 23 L 23 23 C 20.802666 23 19 24.802666 19 27 C 19 29.197334 20.802666 31 23 31 L 24.074219 31 L 27.648438 77.458984 C 27.88773 80.575775 30.504529 83 33.630859 83 L 66.369141 83 C 69.495471 83 72.11227 80.575775 72.351562 77.458984 L 75.925781 31 L 77 31 C 79.197334 31 81 29.197334 81 27 C 81 24.802666 79.197334 23 77 23 L 73.566406 23 L 72.023438 20.427734 C 71.120481 18.922811 69.489078 18 67.734375 18 L 57 18 L 57 16 C 57 14.35503 55.64497 13 54 13 L 46 13 z M 46 15 L 54 15 C 54.56503 15 55 15.43497 55 16 L 55 18 L 45 18 L 45 16 C 45 15.43497 45.43497 15 46 15 z M 32.265625 20 L 43.832031 20 A 1.0001 1.0001 0 0 0 44.158203 20 L 55.832031 20 A 1.0001 1.0001 0 0 0 56.158203 20 L 67.734375 20 C 68.789672 20 69.763595 20.551955 70.306641 21.457031 L 71.833984 24 L 68.5 24 A 0.50005 0.50005 0 1 0 68.5 25 L 73.5 25 L 77 25 C 78.116666 25 79 25.883334 79 27 C 79 28.116666 78.116666 29 77 29 L 23 29 C 21.883334 29 21 28.116666 21 27 C 21 25.883334 21.883334 25 23 25 L 27 25 L 61.5 25 A 0.50005 0.50005 0 1 0 61.5 24 L 28.166016 24 L 29.693359 21.457031 C 30.236405 20.551955 31.210328 20 32.265625 20 z M 64.5 24 A 0.50005 0.50005 0 1 0 64.5 25 L 66.5 25 A 0.50005 0.50005 0 1 0 66.5 24 L 64.5 24 z M 26.078125 31 L 73.921875 31 L 70.357422 77.306641 C 70.196715 79.39985 68.46881 81 66.369141 81 L 33.630859 81 C 31.53119 81 29.803285 79.39985 29.642578 77.306641 L 26.078125 31 z M 38 35 C 36.348906 35 35 36.348906 35 38 L 35 73 C 35 74.651094 36.348906 76 38 76 C 39.651094 76 41 74.651094 41 73 L 41 38 C 41 36.348906 39.651094 35 38 35 z M 50 35 C 48.348906 35 47 36.348906 47 38 L 47 73 C 47 74.651094 48.348906 76 50 76 C 51.651094 76 53 74.651094 53 73 L 53 69.5 A 0.50005 0.50005 0 1 0 52 69.5 L 52 73 C 52 74.110906 51.110906 75 50 75 C 48.889094 75 48 74.110906 48 73 L 48 38 C 48 36.889094 48.889094 36 50 36 C 51.110906 36 52 36.889094 52 38 L 52 63.5 A 0.50005 0.50005 0 1 0 53 63.5 L 53 38 C 53 36.348906 51.651094 35 50 35 z M 62 35 C 60.348906 35 59 36.348906 59 38 L 59 39.5 A 0.50005 0.50005 0 1 0 60 39.5 L 60 38 C 60 36.889094 60.889094 36 62 36 C 63.110906 36 64 36.889094 64 38 L 64 73 C 64 74.110906 63.110906 75 62 75 C 60.889094 75 60 74.110906 60 73 L 60 47.5 A 0.50005 0.50005 0 1 0 59 47.5 L 59 73 C 59 74.651094 60.348906 76 62 76 C 63.651094 76 65 74.651094 65 73 L 65 38 C 65 36.348906 63.651094 35 62 35 z M 38 36 C 39.110906 36 40 36.889094 40 38 L 40 73 C 40 74.110906 39.110906 75 38 75 C 36.889094 75 36 74.110906 36 73 L 36 38 C 36 36.889094 36.889094 36 38 36 z M 59.492188 41.992188 A 0.50005 0.50005 0 0 0 59 42.5 L 59 44.5 A 0.50005 0.50005 0 1 0 60 44.5 L 60 42.5 A 0.50005 0.50005 0 0 0 59.492188 41.992188 z"/></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            if(doc.loaded_to_prod == true){
                is_prod = true;
                $('#doc_in_prod').append(cardHtml);
            }
            $('#searchContainer').append(cardHtml);
        });

        if(is_prod == true) {
            $("#prod_section").show();
        }
        $("#both_section").show();
    } else {
        $("#no_data").css("display", "block");
    }
}

function deleteDocument(id, token, nid, apiBaseUrl) {
    showLoader();
    $.ajax({
        url: `${apiBaseUrl}/dms/documents/${id}/`,
        type: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        contentType: 'application/json',
        processData: 'application/json',
        success: function (response) {
            alert('File deleted successfully');
            $("#" + id)[0].parentElement.remove();
            getDocumentList(nid, token, apiBaseUrl);
            hideLoader();
        },
        error: function (xhr, status, error) {
            console.error('Error while removing  files and text:', error);
            alert('Error while removing files!');
            hideLoader();
        },
        complete: function () {
            hideLoader();
        }
    });
}

function EditDocument(name, id, fileName, confirmed_to_prod, is_notified) {
    const popupContainer = document.getElementById("popupContainer");
    $("#preview-doc-sec").hide();
    $("#doc_heading")[0].innerHTML = 'Edit Document';
    $("#add-edit-doc-sec").show();
    $("#proprietary_sec").hide();
    $("#confirmed_to_prod_sec").css("display", "flex");
    $("#is_notified_sec").css("display", "flex");
    $('.file-count')[0].innerText  = fileName;
    popupContainer.classList.add("show");
    $("#file-name")[0].value = name
    $("#doc_id")[0].value = id
    document.getElementById("confirmed_to_prod").checked = confirmed_to_prod === "true";
    document.getElementById("is_notified").checked = is_notified === "true";
}

function showLoader() {
    $('#loader').show();
}

// Function to hide loader
function hideLoader() {
    $('#loader').hide();
}