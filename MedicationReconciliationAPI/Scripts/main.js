/*
    This section is the UI Part of the JS
    Handles the pretty parts of the client
*/

var selectedPatient = -1;
var patients = [];
var token = "";

$('#search').click(function (e) {
    var searchTerm = $('#patient-search').val();
    if (searchTerm.length == 0) {
        return;
    }

    var filteredList = [];
    for (var i = 0; i < patients.length; i++) {
        if (patients[i]["name"].indexOf(searchTerm) > -1) {
            filteredList.push(patients[i]);
        }
    }
    
    if (filteredList.length == 0) {
        alert("No Patient Found");
    } else {
        displayPatients(filteredList);
    }

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

function displaySinglePatient(patientName) {
    $('#selected-patient').css('opacity', "1");
    $('#patient-name').html(patientName);

    var patient = patients[selectedPatient];

    var getURL = '/api/record?id=' + patientID;
    $.get(getURL, function (data) {
        parseMedicalXML(data);
    });
}

/**
    This method displays the names of the patient gotten from our API into the DOM
*/
function getPatients() {
    $.get('/api/record', function (data) {
        var half = data.length / 2;
        for (var i = 0; i < half; i++) {
            var elem = {
                "name": data[i],
                "id": data[i + half]
            };
            patients.push(elem);
        }

        displayPatients(patients);
        setUpEventHandlers();
    })
}

function displayPatients(patients) {
    $('#patient-containter').html("");
    for (var i = 0; i < patients.length; i++) {
        var html = "<div class='single-patient' target='" + i + "'>" + patients[i].name + "</div>";
        $('#patient-container').append(html);
    }

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
    getPatients();
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