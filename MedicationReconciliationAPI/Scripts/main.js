/*
    This section is the UI Part of the JS
    Handles the pretty parts of the client
*/

$('#search').click(function (e) {
    var searchTerm = $('#patient-search').val();
    if (searchTerm.length == 0) {
        return;
    }

    displaySinglePatient(searchTerm);
})

$('#reconcile-button').click(function (e) {
    var target = $('#reconciliation');
    console.log(target.offset().top);

    $('html, body').animate({
        scrollTop: target.offset().top
    }, 1000);
})

$('#back').click(function (e) {
    $('html, body').animate({
        scrollTop: 0
    }, 1000);
})


/*
    This section is the API calling section of the client
    It handles the full trip part of the project
*/

var selectedPatient = -1;
var patients = [];
var token = "";

function displaySinglePatient(patientName) {
    $('#selected-patient').css('opacity', "1");
    $('#patient-name').html(patientName);

    $('#')
    var patientID = patients[selectedPatient]["id"];

    var getURL = '/api/record?id=' + patientID;
    $.get(getURL, function (data) {
        parseMedicalXML(data);
    });
}

/**
    This method displays the names of the patient gotten from our API into the DOM
*/
function displayPatients() {
    $.get('/api/record', function (data) {
        var half = data.length / 2;
        for (var i = 0; i < half; i++) {
            var elem = {
                "name": data[i],
                "id": data[i + half]
            };
            patients.push(elem);
        }

        for (var i = 0; i < half; i++) {
            var html = "<div class='single-patient' target='" + i + "'>" + patients[i].name + "</div>";
            $('#patient-container').append(html);
        }

        setUpEventHandlers();
    })
}

/**
    This takes the medical statment data from a single patient
*/
function parseMedicalXML(data) {

}

function setUpEventHandlers() {
    $('.single-patient').click(function(e) {
        selectedPatient = $(e.target).attr('target');
        var patientName = patients[selectedPatient]["name"];
        displaySinglePatient(patientName);
    })
}

$(document).ready(function () {

    var myURL = window.location.href;
    /*
    var index = myURL.indexOf("access_token");
    if (index == -1) {
        window.location.replace("http://sso-dev.e-imo.com/core/connect/authorize?client_id=medrecon_imp&response_type=id_token token&scope=openid medrecon roles&redirect_uri=http://localhost:20857/");
    } else {
        token = myURL.substring(index + 1);
        console.log(token);
    }*/

    displayPatients();
})

/* Sample POST request
$.ajax({
    type: "POST",
    beforeSend: function (req) {
        var header = "Bearer " + token;
        req.setRequestHeader("Authorization", header) 
    },
    url: "/api/reconciliation",
    data: data,
    success: function (msg) {
        console.log(msg);
    }
})
*/