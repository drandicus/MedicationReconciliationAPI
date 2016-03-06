using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Hl7.Fhir;
using Hl7.Fhir.Model;
using Hl7.Fhir.Serialization;

namespace MedicationReconciliationAPI.Models
{
    public class Record
    {
        public Record()
        {
            DateTime localDate = DateTime.Now;
            this.RecordNo = -1;
            this.Action = "Undefined";
            this.Timestamp = DateTime.Now;
            this.Format = "Undefined";
            this.Type = "Undefined";
            this.FhirPatient = new Patient();
            this.FhirMedication = new MedicationStatement();
        }


        public Record(int CurrentNo, String Unknown, String action)
        {
            DateTime localDate = DateTime.Now;
            this.RecordNo = CurrentNo + 1;
            this.Action = action;
            this.Timestamp = DateTime.Now;

            this.Format = "Undefined";
            this.Type = "Undefined";
            this.FhirPatient = new Patient();
            this.FhirMedication = new MedicationStatement();
            try
            {
                this.FhirPatient = xmlToPatient(Unknown);
                var noob = this.FhirPatient.Gender;
                this.Format = "xml";
                this.Type = "Patient";

            }
            catch { }
            try
            {
                this.FhirPatient = jsonToPatient(Unknown);
                var noob = this.FhirPatient.Gender;
                this.Format = "json";
                this.Type = "Patient";
            }
            catch
            { }
            try
            {
                this.FhirMedication = xmlToMedication(Unknown);
                var noob = this.FhirMedication.Dosage;
                this.Format = "xml";
                this.Type = "Medication";
            }
            catch
            { }
            try
            {
                this.FhirMedication = jsonToMedication(Unknown);
                var noob = this.FhirMedication.Dosage;
                this.Format = "json";
                this.Type = "Medication";
            }
            catch { }


        }

        private static Patient xmlToPatient(string a)
        {
            Patient result = new Patient();
            Resource b = FhirParser.ParseResourceFromXml(a);
            result = b as Hl7.Fhir.Model.Patient;
            return result;
        }

        private static MedicationStatement xmlToMedication(string a)
        {
            MedicationStatement result = new MedicationStatement();
            Resource b = FhirParser.ParseResourceFromXml(a);
            result = b as Hl7.Fhir.Model.MedicationStatement;
            return result;
        }

        private static Patient jsonToPatient(string a)
        {
            Patient result = new Patient();
            Resource b = FhirParser.ParseResourceFromJson(a);
            result = b as Hl7.Fhir.Model.Patient;
            return result;
        }


        private static MedicationStatement jsonToMedication(string a)
        {
            MedicationStatement result = new MedicationStatement();
            Resource b = FhirParser.ParseResourceFromJson(a);
            result = b as Hl7.Fhir.Model.MedicationStatement;
            return result;
        }
        // Each Record is immutable, in case of updates we create a new record and 
        // keep track of Version, Time of modification and action type like CREATE/UPDATE
        public int RecordNo { get; set; }
        public DateTime Timestamp { get; set; }
        public String Action { get; set; }
        public String Format { get; set; }
        public Patient FhirPatient;
        public MedicationStatement FhirMedication;
        public String Type { get; set; }
    }
}