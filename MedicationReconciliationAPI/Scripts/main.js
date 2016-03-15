/*
    This section is the UI Part of the JS
    Handles the pretty parts of the client
*/

var selectedPatient = -1;
var patients = [];
var token = "";
var hospitalMedication = [];
var ePrescribeMedication = [];
var similar = [];
var shared = [];

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

$("#eprescribe-similar div").hover(function () {

}, function () {

})

$('#reconcile-button').click(function (e) {
    var target = $('#reconciliation');
    console.log(target.offset().top);

    $('html, body').animate({
        scrollTop: target.offset().top
    }, 1000);

    var url = "/api/record/GetXML?type=test&id=" + patients[selectedPatient].id;
    $.get(url, function (data) {
        var patientXML = data;
        var postURL = "/api/reconciliation/";
        $.post(postURL, patientXML, function (data) {
            console.log(data);
            parseMedicalXML(data);
        })
    })
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
    var patientID = patient.id;
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

function displayMedicalData(data, id) {
    $(id).html("");
    var medList = [];

    var shadedColumns = [1, 3, 5];
    var counter = 1;
    data.forEach(function (element) {
        var app = "";
        if (shadedColumns.indexOf(counter) > -1) {
            app = "<div class='shaded'>";
            shadedColumns[shadedColumns.indexOf(counter)] += 5;
        } else {
            app = "<div class='unshaded'>"
        }
        app += "<p><b>" + element.name + "</b></p>";
        app += "<p>" + element.sig + "</p>";
        app += "</div>";

        $(id).append(app);
        counter++;
    })
}

function storeXML(data) {
    var medList = [];
    data.find("medication").each(function () {
        var medicalObject = {
            "name": $(this).find("name").text(),
            "sig": $(this).find("sig").text()
        }
        medList.push(medicalObject);
    })

    return medList;
}

function storeSimilarXML(data) {
    var medList = [];

    data.find("hospitalMedication").each(function () {
        var similarObject = {
            "name": $(this).find("name").text(),
            "sig": $(this).find("sig").text(),
            "eprescribe": []
        }
        var ePrescribe = [];
        $(this).find("ePrescribeMedication").each(function () {
            var medicalObject = {
                "name": $(this).find("name").text(),
                "sig": $(this).find("sig").text()
            }

            ePrescribe.push(medicalObject);
        })

        similarObject.eprescribe = ePrescribe;

        medList.push(similarObject);
    })

    return medList;
}

function displaySimilarMedicalData(data) {
    var hID = "#hospital-similar";
    var rID = "#eprescribe-similar";

    $(hID).html("");
    $(rID).html("");

    var counter = 1;
    data.forEach(function (elem) {
        var rDiv = "<div data-num='" + counter + "'>"
        console.log(elem);
        elem.eprescribe.forEach(function (rElem) {
            rDiv += "<p><b>" + rElem.name + "</b></p>";
            rDiv += "<p>" + rElem.sig + "</p>";
            rDiv += "<br/>";
        })
        rDiv += "</div>";

        $(rID).append(rDiv);


        var eDiv = "<div>"
        eDiv += "<p><b>" + elem.name + "</b></p>";
        eDiv += "<p>" + elem.sig + "</p>";
        eDiv += "</div>"

        $(hID).append(eDiv);
    })
}

var hospitalMedication = [];
var ePrescribeMedication = [];
var hospitalUnique = [];
var ePrescribeUnique = [];
var similar = [];
var shared = [];
/**
    This takes the medical statment data from a single patient
*/
function parseMedicalXML(data) {
    var xml = $($.parseXML(data));
    hospitalMedication = storeXML(xml.find("hospital"));
    ePrescribeMedication = storeXML(xml.find("ePrescribe"));
    hospitalUnique = storeXML(xml.find("clientUnique"));
    ePrescribeUnique = storeXML(xml.find("ePrescribeUnique"));
    shared = storeXML(xml.find("shared"));

    displayMedicalData(hospitalMedication, "#hospital-medication");
    displayMedicalData(ePrescribeMedication, "#eprescribe-medication");
    displayMedicalData(hospitalUnique, '#hospital-unique');
    displayMedicalData(ePrescribeUnique, '#eprescribe-unique');
    displayMedicalData(shared, '#shared');

    similar = storeSimilarXML(xml.find("similar"));
    displaySimilarMedicalData(similar)
}

function setUpEventHandlers() {
    $('.single-patient').click(function (e) {
        selectedPatient = $(e.target).attr('target');
        var patientName = patients[selectedPatient]["name"];
        displaySinglePatient(patientName);
    })
}


$(document).ready(function () {
    getPatients();

    var data = `
        <medication_reconciliation>
    <patient_name>
        <first_name>John</first_name>
        <last_name>Travolta</last_name>
    </patient_name>
    <hospital>
        <medication>
            <name>cephalexin</name>
            <sig>500 mg PO q6h</sig>
        </medication>
        <medication>
            <name>enoxaparin</name>
            <sig>40 mg SC daily</sig>
        </medication>
        <medication>
            <name>insulin sliding scale</name>
            <sig>SC q4h prn</sig>
        </medication>
        <medication>
            <name>Lantus</name>
            <sig>20 mg SC qHS</sig>
        </medication>
        <medication>
            <name>acetaminophen</name>
            <sig>1g PO q6h prn pain</sig>
        </medication>
        <medication>
            <name>lorazepam</name>
            <sig>1 mg PO q8h prn anxiety</sig>
        </medication>
        <medication>
            <name>tramadol</name>
            <sig>50 mg PO q6h prn pain</sig>
        </medication>
        <medication>
            <name>donepezil</name>
            <sig>10 mg PO qHS</sig>
        </medication>
        <medication>
            <name>clopidogrel</name>
            <sig>75 mg PO daily</sig>
        </medication>
        <medication>
            <name>fluoxetine</name>
            <sig>20 mg PO daily</sig>
        </medication>
        <medication>
            <name>rosuvastatin</name>
            <sig>40 mg PO daily</sig>
        </medication>
        <medication>
            <name>metoprolol</name>
            <sig>50 mg PO BID</sig>
        </medication>
    </hospital>
    <ePrescribe>
        <medication>
            <name>Aricept</name>
            <sig>10 mg</sig>
        </medication>
        <medication>
            <name>tramadol</name>
            <sig>50 mg</sig>
        </medication>
        <medication>
            <name>lorazepam</name>
            <sig>1 mg</sig>
        </medication>
        <medication>
            <name>acetaminophen</name>
            <sig>650 mg/20.3 mL</sig>
        </medication>
        <medication>
            <name>vitamin b12</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Tirosint</name>
            <sig>100 mcg</sig>
        </medication>
        <medication>
            <name>glyburide</name>
            <sig>5 mg</sig>
        </medication>
        <medication>
            <name>Pradaxa</name>
            <sig>150 mg</sig>
        </medication>
        <medication>
            <name>calcium carbonate</name>
            <sig>500 mg calcium (1, 250 mg) </sig>
        </medication>
        <medication>
            <name>Calciferol</name>
            <sig>8, 000 unit/mL</sig>
        </medication>
        <medication>
            <name>metformin</name>
            <sig>850 mg</sig>
        </medication>
        <medication>
            <name>temazepam</name>
            <sig>22.5 mg</sig>
        </medication>
        <medication>
            <name>MICRO K 10</name>
            <sig></sig>
        </medication>
        <medication>
            <name>VITAMIN C</name>
            <sig>1 GM</sig>
        </medication>
        <medication>
            <name>VITAMIN D</name>
            <sig></sig>
        </medication>
        <medication>
            <name>VITAMIN E</name>
            <sig></sig>
        </medication>
        <medication>
            <name>LUXIQ FOAM</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Ambien</name>
            <sig>10 mg</sig>
        </medication>
        <medication>
            <name>Allegra Allergy</name>
            <sig>180 mg</sig>
        </medication>
        <medication>
            <name>Zyrtec</name>
            <sig>10 mg</sig>
        </medication>
        <medication>
            <name>CALCIUM</name>
            <sig>600 MG</sig>
        </medication>
        <medication>
            <name>HYDROCHLOROTHIAZIDE</name>
            <sig>25 mg</sig>
        </medication>
        <medication>
            <name>Restoril</name>
            <sig>15 mg</sig>
        </medication>
        <medication>
            <name>FLONASE</name>
            <sig>50 MCG/SPRAY</sig>
        </medication>
        <medication>
            <name>OMEPRAZOLE</name>
            <sig>40 MG</sig>
        </medication>
        <medication>
            <name>AMLODIPINE</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ADVAIR DISKUS</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Rx for Hearing Aid</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Rx for Physical Therapy</name>
            <sig></sig>
        </medication>
        <medication>
            <name>lisinopril</name>
            <sig>10 mg</sig>
        </medication>
        <medication>
            <name>LIDEX</name>
            <sig>0.5 MG</sig>
        </medication>
        <medication>
            <name>Benadryl</name>
            <sig>25 mg</sig>
        </medication>
        <medication>
            <name>Rx</name>
            <sig>PHYSICAL THERAPY</sig>
        </medication>
        <medication>
            <name>ZITHROMAX</name>
            <sig>250 mg</sig>
        </medication>
        <medication>
            <name>VENTOLIN HFA</name>
            <sig>0.09 MG/ACTUAT</sig>
        </medication>
        <medication>
            <name>Rx for Physical Therapy</name>
            <sig></sig>
        </medication>
        <medication>
            <name>RX ORDER</name>
            <sig>ULTRASOUND KIDNEYS</sig>
        </medication>
        <medication>
            <name>AMBIEN</name>
            <sig>10 mg</sig>
        </medication>
        <medication>
            <name>ECOTRIN</name>
            <sig></sig>
        </medication>
        <medication>
            <name>LEVAQUIN</name>
            <sig>500 mg</sig>
        </medication>
        <medication>
            <name>LEVAQUIN</name>
            <sig>500 mg</sig>
        </medication>
        <medication>
            <name>Rx for Hearing Aid</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Arimidex</name>
            <sig>1 mg</sig>
        </medication>
        <medication>
            <name>REMERON</name>
            <sig>15 MG</sig>
        </medication>
        <medication>
            <name>ZITHROMAX</name>
            <sig>250 mg</sig>
        </medication>
        <medication>
            <name>Walter Smith Rx</name>
            <sig></sig>
        </medication>
        <medication>
            <name>pravastatin</name>
            <sig>20 mg</sig>
        </medication>
        <medication>
            <name>omeprazole</name>
            <sig>40 mg</sig>
        </medication>
        <medication>
            <name>Rx for Physical Therapy</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ZITHROMAX</name>
            <sig>250 mg</sig>
        </medication>
        <medication>
            <name>Ativan</name>
            <sig>1 mg</sig>
        </medication>
        <medication>
            <name>AMBIEN</name>
            <sig>5 mg</sig>
        </medication>
        <medication>
            <name>RX ORDER</name>
            <sig>ULTRASOUND KIDNEYS</sig>
        </medication>
        <medication>
            <name>Rx for Hearing Aid</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Walter Smith Rx</name>
            <sig></sig>
        </medication>
        <medication>
            <name>FOSAMAX</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ZITHROMAX</name>
            <sig></sig>
        </medication>
        <medication>
            <name>RX ORDER</name>
            <sig>ULTRASOUND KIDNEYS</sig>
        </medication>
        <medication>
            <name>LEVAQUIN</name>
            <sig>500 mg</sig>
        </medication>
        <medication>
            <name>ZITHROMAX</name>
            <sig>250 mg</sig>
        </medication>
        <medication>
            <name>ZITHROMAX</name>
            <sig>250 mg</sig>
        </medication>
        <medication>
            <name>ADVAIR DISKUS</name>
            <sig></sig>
        </medication>
        <medication>
            <name>OMNARIS</name>
            <sig></sig>
        </medication>
        <medication>
            <name>LEVAQUIN</name>
            <sig>500 mg</sig>
        </medication>
        <medication>
            <name>Rx for CT of Abdomen</name>
            <sig>With and Without Infusion</sig>
        </medication>
        <medication>
            <name>Rx for Physical Therapy</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Voltaren</name>
            <sig>1%</sig>
        </medication>
        <medication>
            <name>COD LIVER OIL</name>
            <sig></sig>
        </medication>
        <medication>
            <name>RX MRI LUMBAR SPINE</name>
            <sig></sig>
        </medication>
        <medication>
            <name>MEDROL DOSEPAK</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ACCUPRIL</name>
            <sig></sig>
        </medication>
        <medication>
            <name>primidone</name>
            <sig>50 mg</sig>
        </medication>
        <medication>
            <name>Norco</name>
            <sig>5-325 mg</sig>
        </medication>
        <medication>
            <name>Celebrex</name>
            <sig>200 mg</sig>
        </medication>
        <medication>
            <name>FISH OIL</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Norco 5/325</name>
            <sig></sig>
        </medication>
        <medication>
            <name>GLUCOSAMINE-CHONDROINTIN</name>
            <sig></sig>
        </medication>
        <medication>
            <name>MOBIC</name>
            <sig></sig>
        </medication>
        <medication>
            <name>MVI</name>
            <sig></sig>
        </medication>
        <medication>
            <name>VITAMIN D3</name>
            <sig>1000 int.units</sig>
        </medication>
        <medication>
            <name>Primidone</name>
            <sig></sig>
        </medication>
        <medication>
            <name>PRAVACHOL</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ACEON</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ATORVASTATIN CALCIUM</name>
            <sig></sig>
        </medication>
        <medication>
            <name>clindamycin HCl</name>
            <sig>300 mg</sig>
        </medication>
        <medication>
            <name>TRIAMCINOLONE</name>
            <sig>0.1 %</sig>
        </medication>
        <medication>
            <name>ACTIVELLA</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Cymbalta</name>
            <sig>30 mg</sig>
        </medication>
        <medication>
            <name>ECOTRIN</name>
            <sig>500 MG</sig>
        </medication>
        <medication>
            <name>Avodart</name>
            <sig>0.5 mg</sig>
        </medication>
        <medication>
            <name>Aceon</name>
            <sig>8 mg</sig>
        </medication>
        <medication>
            <name>clindamycin HCl</name>
            <sig>300 mg</sig>
        </medication>
        <medication>
            <name>Betimol</name>
            <sig>0.25%</sig>
        </medication>
        <medication>
            <name>PIROXICAM</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Actonel</name>
            <sig>30 mg</sig>
        </medication>
        <medication>
            <name>Aceon</name>
            <sig>4 mg</sig>
        </medication>
        <medication>
            <name>Climara</name>
            <sig>0.0375 mg/24 hr</sig>
        </medication>
        <medication>
            <name>acyclovir</name>
            <sig>200 mg</sig>
        </medication>
        <medication>
            <name>ADALAT</name>
            <sig>20 MG</sig>
        </medication>
        <medication>
            <name>TRIAMCINOLONE</name>
            <sig></sig>
        </medication>
        <medication>
            <name>LANTUS INSULIN</name>
            <sig></sig>
        </medication>
        <medication>
            <name>atorvastatin</name>
            <sig>10 mg</sig>
        </medication>
        <medication>
            <name>Abilify</name>
            <sig>20 mg</sig>
        </medication>
        <medication>
            <name>ACTIGAL</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ACCOLATE</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Colace</name>
            <sig>100 mg</sig>
        </medication>
        <medication>
            <name>Abilify</name>
            <sig>10 mg</sig>
        </medication>
        <medication>
            <name>ACTIGAL</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ACYCLOVIR</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Abilify</name>
            <sig>20 mg</sig>
        </medication>
        <medication>
            <name>ACTIGAL</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Actonel</name>
            <sig>30 mg</sig>
        </medication>
        <medication>
            <name>Zyprexa</name>
            <sig>2.5 mg</sig>
        </medication>
        <medication>
            <name>ACTOS</name>
            <sig></sig>
        </medication>
        <medication>
            <name>LITHIUM</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Dantrium</name>
            <sig>25 mg</sig>
        </medication>
        <medication>
            <name>Abilify</name>
            <sig>10 mg</sig>
        </medication>
        <medication>
            <name>Claravis</name>
            <sig>20 mg</sig>
        </medication>
        <medication>
            <name>Byetta</name>
            <sig>5 mcg/dose (250 mcg/mL) 1.2 mL</sig>
        </medication>
        <medication>
            <name>ACEON</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Actonel</name>
            <sig>30 mg</sig>
        </medication>
        <medication>
            <name>Dovonex</name>
            <sig>0.005%</sig>
        </medication>
        <medication>
            <name>ACTIGAL</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ACYCLOVIR</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Actonel</name>
            <sig>30 mg</sig>
        </medication>
        <medication>
            <name>acyclovir</name>
            <sig>200 mg</sig>
        </medication>
        <medication>
            <name>Estring</name>
            <sig>2 mg</sig>
        </medication>
        <medication>
            <name>ACCURETIC</name>
            <sig></sig>
        </medication>
    </ePrescribe>
    <shared>
        <medication>
            <name>lorazepam</name>
            <sig>1 mg PO q8h prn anxiety</sig>
        </medication>
        <medication>
            <name>tramadol</name>
            <sig>50 mg PO q6h prn pain</sig>
        </medication>
    </shared>
    <clientUnique>
        <medication>
            <name>insulin sliding scale</name>
            <sig>SC q4h prn</sig>
        </medication>
        <medication>
            <name>clopidogrel</name>
            <sig>75 mg PO daily</sig>
        </medication>
    </clientUnique>
    <similar>
        <hospitalMedication>
            <medication>
                <name>cephalexin</name>
                <sig>500 mg PO q6h</sig>
            </medication>
            <ePrescribeMedication>
                <medication>
                    <name>calcium carbonate</name>
                    <sig>500 mg calcium (1, 250 mg) </sig>
                </medication>
                <medication>
                    <name>LEVAQUIN</name>
                    <sig>500 mg</sig>
                </medication>
                <medication>
                    <name>LEVAQUIN</name>
                    <sig>500 mg</sig>
                </medication>
                <medication>
                    <name>LEVAQUIN</name>
                    <sig>500 mg</sig>
                </medication>
                <medication>
                    <name>LEVAQUIN</name>
                    <sig>500 mg</sig>
                </medication>
                <medication>
                    <name>ECOTRIN</name>
                    <sig>500 MG</sig>
                </medication>
            </ePrescribeMedication>
        </hospitalMedication>
        <hospitalMedication>
            <medication>
                <name>enoxaparin</name>
                <sig>40 mg SC daily</sig>
            </medication>
            <ePrescribeMedication>
                <medication>
                    <name>OMEPRAZOLE</name>
                    <sig>40 MG</sig>
                </medication>
                <medication>
                    <name>omeprazole</name>
                    <sig>40 mg</sig>
                </medication>
            </ePrescribeMedication>
        </hospitalMedication>
        <hospitalMedication>
            <medication>
                <name>Lantus</name>
                <sig>20 mg SC qHS</sig>
            </medication>
            <ePrescribeMedication>
                <medication>
                    <name>pravastatin</name>
                    <sig>20 mg</sig>
                </medication>
                <medication>
                    <name>ADALAT</name>
                    <sig>20 MG</sig>
                </medication>
                <medication>
                    <name>Abilify</name>
                    <sig>20 mg</sig>
                </medication>
                <medication>
                    <name>Abilify</name>
                    <sig>20 mg</sig>
                </medication>
                <medication>
                    <name>Claravis</name>
                    <sig>20 mg</sig>
                </medication>
            </ePrescribeMedication>
        </hospitalMedication>
        <hospitalMedication>
            <medication>
                <name>acetaminophen</name>
                <sig>1g PO q6h prn pain</sig>
            </medication>
            <ePrescribeMedication>
                <medication>
                    <name>acetaminophen</name>
                    <sig>650 mg/20.3 mL</sig>
                </medication>
            </ePrescribeMedication>
        </hospitalMedication>
        <hospitalMedication>
            <medication>
                <name>lorazepam</name>
                <sig>1 mg PO q8h prn anxiety</sig>
            </medication>
            <ePrescribeMedication>
                <medication>
                    <name>Arimidex</name>
                    <sig>1 mg</sig>
                </medication>
                <medication>
                    <name>Ativan</name>
                    <sig>1 mg</sig>
                </medication>
            </ePrescribeMedication>
        </hospitalMedication>
        <hospitalMedication>
            <medication>
                <name>tramadol</name>
                <sig>50 mg PO q6h prn pain</sig>
            </medication>
            <ePrescribeMedication>
                <medication>
                    <name>primidone</name>
                    <sig>50 mg</sig>
                </medication>
            </ePrescribeMedication>
        </hospitalMedication>
        <hospitalMedication>
            <medication>
                <name>donepezil</name>
                <sig>10 mg PO qHS</sig>
            </medication>
            <ePrescribeMedication>
                <medication>
                    <name>Aricept</name>
                    <sig>10 mg</sig>
                </medication>
                <medication>
                    <name>Ambien</name>
                    <sig>10 mg</sig>
                </medication>
                <medication>
                    <name>Zyrtec</name>
                    <sig>10 mg</sig>
                </medication>
                <medication>
                    <name>lisinopril</name>
                    <sig>10 mg</sig>
                </medication>
                <medication>
                    <name>AMBIEN</name>
                    <sig>10 mg</sig>
                </medication>
                <medication>
                    <name>atorvastatin</name>
                    <sig>10 mg</sig>
                </medication>
                <medication>
                    <name>Abilify</name>
                    <sig>10 mg</sig>
                </medication>
                <medication>
                    <name>Abilify</name>
                    <sig>10 mg</sig>
                </medication>
            </ePrescribeMedication>
        </hospitalMedication>
        <hospitalMedication>
            <medication>
                <name>fluoxetine</name>
                <sig>20 mg PO daily</sig>
            </medication>
            <ePrescribeMedication>
                <medication>
                    <name>pravastatin</name>
                    <sig>20 mg</sig>
                </medication>
                <medication>
                    <name>ADALAT</name>
                    <sig>20 MG</sig>
                </medication>
                <medication>
                    <name>Abilify</name>
                    <sig>20 mg</sig>
                </medication>
                <medication>
                    <name>Abilify</name>
                    <sig>20 mg</sig>
                </medication>
                <medication>
                    <name>Claravis</name>
                    <sig>20 mg</sig>
                </medication>
            </ePrescribeMedication>
        </hospitalMedication>
        <hospitalMedication>
            <medication>
                <name>rosuvastatin</name>
                <sig>40 mg PO daily</sig>
            </medication>
            <ePrescribeMedication>
                <medication>
                    <name>OMEPRAZOLE</name>
                    <sig>40 MG</sig>
                </medication>
                <medication>
                    <name>omeprazole</name>
                    <sig>40 mg</sig>
                </medication>
            </ePrescribeMedication>
        </hospitalMedication>
        <hospitalMedication>
            <medication>
                <name>metoprolol</name>
                <sig>50 mg PO BID</sig>
            </medication>
            <ePrescribeMedication>
                <medication>
                    <name>tramadol</name>
                    <sig>50 mg</sig>
                </medication>
                <medication>
                    <name>primidone</name>
                    <sig>50 mg</sig>
                </medication>
            </ePrescribeMedication>
        </hospitalMedication>
    </similar>
    <ePrescribeUnique>
        <medication>
            <name>lorazepam</name>
            <sig>1 mg</sig>
        </medication>
        <medication>
            <name>vitamin b12</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Tirosint</name>
            <sig>100 mcg</sig>
        </medication>
        <medication>
            <name>glyburide</name>
            <sig>5 mg</sig>
        </medication>
        <medication>
            <name>Pradaxa</name>
            <sig>150 mg</sig>
        </medication>
        <medication>
            <name>Calciferol</name>
            <sig>8, 000 unit/mL</sig>
        </medication>
        <medication>
            <name>metformin</name>
            <sig>850 mg</sig>
        </medication>
        <medication>
            <name>temazepam</name>
            <sig>22.5 mg</sig>
        </medication>
        <medication>
            <name>MICRO K 10</name>
            <sig></sig>
        </medication>
        <medication>
            <name>VITAMIN C</name>
            <sig>1 GM</sig>
        </medication>
        <medication>
            <name>VITAMIN D</name>
            <sig></sig>
        </medication>
        <medication>
            <name>VITAMIN E</name>
            <sig></sig>
        </medication>
        <medication>
            <name>LUXIQ FOAM</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Allegra Allergy</name>
            <sig>180 mg</sig>
        </medication>
        <medication>
            <name>CALCIUM</name>
            <sig>600 MG</sig>
        </medication>
        <medication>
            <name>HYDROCHLOROTHIAZIDE</name>
            <sig>25 mg</sig>
        </medication>
        <medication>
            <name>Restoril</name>
            <sig>15 mg</sig>
        </medication>
        <medication>
            <name>FLONASE</name>
            <sig>50 MCG/SPRAY</sig>
        </medication>
        <medication>
            <name>AMLODIPINE</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ADVAIR DISKUS</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Rx for Hearing Aid</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Rx for Physical Therapy</name>
            <sig></sig>
        </medication>
        <medication>
            <name>LIDEX</name>
            <sig>0.5 MG</sig>
        </medication>
        <medication>
            <name>Benadryl</name>
            <sig>25 mg</sig>
        </medication>
        <medication>
            <name>Rx</name>
            <sig>PHYSICAL THERAPY</sig>
        </medication>
        <medication>
            <name>ZITHROMAX</name>
            <sig>250 mg</sig>
        </medication>
        <medication>
            <name>VENTOLIN HFA</name>
            <sig>0.09 MG/ACTUAT</sig>
        </medication>
        <medication>
            <name>Rx for Physical Therapy</name>
            <sig></sig>
        </medication>
        <medication>
            <name>RX ORDER</name>
            <sig>ULTRASOUND KIDNEYS</sig>
        </medication>
        <medication>
            <name>ECOTRIN</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Rx for Hearing Aid</name>
            <sig></sig>
        </medication>
        <medication>
            <name>REMERON</name>
            <sig>15 MG</sig>
        </medication>
        <medication>
            <name>ZITHROMAX</name>
            <sig>250 mg</sig>
        </medication>
        <medication>
            <name>Walter Smith Rx</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Rx for Physical Therapy</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ZITHROMAX</name>
            <sig>250 mg</sig>
        </medication>
        <medication>
            <name>AMBIEN</name>
            <sig>5 mg</sig>
        </medication>
        <medication>
            <name>RX ORDER</name>
            <sig>ULTRASOUND KIDNEYS</sig>
        </medication>
        <medication>
            <name>Rx for Hearing Aid</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Walter Smith Rx</name>
            <sig></sig>
        </medication>
        <medication>
            <name>FOSAMAX</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ZITHROMAX</name>
            <sig></sig>
        </medication>
        <medication>
            <name>RX ORDER</name>
            <sig>ULTRASOUND KIDNEYS</sig>
        </medication>
        <medication>
            <name>ZITHROMAX</name>
            <sig>250 mg</sig>
        </medication>
        <medication>
            <name>ZITHROMAX</name>
            <sig>250 mg</sig>
        </medication>
        <medication>
            <name>ADVAIR DISKUS</name>
            <sig></sig>
        </medication>
        <medication>
            <name>OMNARIS</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Rx for CT of Abdomen</name>
            <sig>With and Without Infusion</sig>
        </medication>
        <medication>
            <name>Rx for Physical Therapy</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Voltaren</name>
            <sig>1%</sig>
        </medication>
        <medication>
            <name>COD LIVER OIL</name>
            <sig></sig>
        </medication>
        <medication>
            <name>RX MRI LUMBAR SPINE</name>
            <sig></sig>
        </medication>
        <medication>
            <name>MEDROL DOSEPAK</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ACCUPRIL</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Norco</name>
            <sig>5-325 mg</sig>
        </medication>
        <medication>
            <name>Celebrex</name>
            <sig>200 mg</sig>
        </medication>
        <medication>
            <name>FISH OIL</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Norco 5/325</name>
            <sig></sig>
        </medication>
        <medication>
            <name>GLUCOSAMINE-CHONDROINTIN</name>
            <sig></sig>
        </medication>
        <medication>
            <name>MOBIC</name>
            <sig></sig>
        </medication>
        <medication>
            <name>MVI</name>
            <sig></sig>
        </medication>
        <medication>
            <name>VITAMIN D3</name>
            <sig>1000 int.units</sig>
        </medication>
        <medication>
            <name>Primidone</name>
            <sig></sig>
        </medication>
        <medication>
            <name>PRAVACHOL</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ACEON</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ATORVASTATIN CALCIUM</name>
            <sig></sig>
        </medication>
        <medication>
            <name>clindamycin HCl</name>
            <sig>300 mg</sig>
        </medication>
        <medication>
            <name>TRIAMCINOLONE</name>
            <sig>0.1 %</sig>
        </medication>
        <medication>
            <name>ACTIVELLA</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Cymbalta</name>
            <sig>30 mg</sig>
        </medication>
        <medication>
            <name>Avodart</name>
            <sig>0.5 mg</sig>
        </medication>
        <medication>
            <name>Aceon</name>
            <sig>8 mg</sig>
        </medication>
        <medication>
            <name>clindamycin HCl</name>
            <sig>300 mg</sig>
        </medication>
        <medication>
            <name>Betimol</name>
            <sig>0.25%</sig>
        </medication>
        <medication>
            <name>PIROXICAM</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Actonel</name>
            <sig>30 mg</sig>
        </medication>
        <medication>
            <name>Aceon</name>
            <sig>4 mg</sig>
        </medication>
        <medication>
            <name>Climara</name>
            <sig>0.0375 mg/24 hr</sig>
        </medication>
        <medication>
            <name>acyclovir</name>
            <sig>200 mg</sig>
        </medication>
        <medication>
            <name>TRIAMCINOLONE</name>
            <sig></sig>
        </medication>
        <medication>
            <name>LANTUS INSULIN</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ACTIGAL</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ACCOLATE</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Colace</name>
            <sig>100 mg</sig>
        </medication>
        <medication>
            <name>ACTIGAL</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ACYCLOVIR</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ACTIGAL</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Actonel</name>
            <sig>30 mg</sig>
        </medication>
        <medication>
            <name>Zyprexa</name>
            <sig>2.5 mg</sig>
        </medication>
        <medication>
            <name>ACTOS</name>
            <sig></sig>
        </medication>
        <medication>
            <name>LITHIUM</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Dantrium</name>
            <sig>25 mg</sig>
        </medication>
        <medication>
            <name>Byetta</name>
            <sig>5 mcg/dose (250 mcg/mL) 1.2 mL</sig>
        </medication>
        <medication>
            <name>ACEON</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Actonel</name>
            <sig>30 mg</sig>
        </medication>
        <medication>
            <name>Dovonex</name>
            <sig>0.005%</sig>
        </medication>
        <medication>
            <name>ACTIGAL</name>
            <sig></sig>
        </medication>
        <medication>
            <name>ACYCLOVIR</name>
            <sig></sig>
        </medication>
        <medication>
            <name>Actonel</name>
            <sig>30 mg</sig>
        </medication>
        <medication>
            <name>acyclovir</name>
            <sig>200 mg</sig>
        </medication>
        <medication>
            <name>Estring</name>
            <sig>2 mg</sig>
        </medication>
        <medication>
            <name>ACCURETIC</name>
            <sig></sig>
        </medication>
    </ePrescribeUnique>
</medication_reconciliation>
        `

    parseMedicalXML(data);
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