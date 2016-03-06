using System;
using System.Net;
using System.Collections.Generic;
using System.Xml.Linq;
using System.Text;
using Hl7.Fhir.Model;
using Hl7.Fhir.Serialization;
using static Hl7.Fhir.Model.MedicationStatement;

using System.Diagnostics;
namespace MedicationReconciliation.Models
{
    class RcopiaObject
    {
        private string stagingUrl = "https://engine201.staging.drfirst.com/servlet/rcopia.servlet.EngineServlet";
        private string requestMessageID = "medicationtrace1235";
        private string vendorUsername = "pproviderrmfrqc";
        private string vendorPassword = "Winter16";
        private string systemName = "ivendor20";
        private string rcopiaPracticeUsername = "im4979";
        private string requestXML = "xml=<?xml version=\"1.0\" encoding=\"UTF-8\"?><RCExtRequest version=\"2.12\"><TraceInformation><RequestMessageID>{0}</RequestMessageID></TraceInformation><Caller><VendorName>{1}</VendorName><VendorPassword>{2}</VendorPassword><Application>EMR</Application><Version>1</Version><PracticeName>Test Office</PracticeName><Station>Station A</Station></Caller><SystemName>{3}</SystemName><RcopiaPracticeUsername>{4}</RcopiaPracticeUsername><Request><Command>update_medication</Command><LastUpdateDate>10/01/2010 00:00:00</LastUpdateDate><Patient><RcopiaID>{5}</RcopiaID><ExternalID></ExternalID></Patient></Request></RCExtRequest>";

        private List<MedicationStatement> currentList = new List<MedicationStatement>();
        public RcopiaObject(string firstName)
        {
            string result;
            using (var client = new WebClient())
            {
                client.Headers[HttpRequestHeader.ContentType] = "application/x-www-form-urlencoded";
                string xml = String.Format(requestXML, requestMessageID, vendorUsername, vendorPassword, systemName, rcopiaPracticeUsername, firstName);
                result = client.UploadString(stagingUrl, "POST", xml);
            }
            XDocument xd = XDocument.Parse(result);

            foreach (XElement element in xd.Root.Element("Response").Element("MedicationList").Elements("Medication"))
            {
                string patient = (string)element.Element("Patient").Element("FirstName") + " " + (string)element.Element("Patient").Element("LastName");
                string startTime = (string)element.Element("StartDate");
                string endTime = (string)element.Element("StopDate");

                MedicationStatementStatus status;
                if (startTime.Length == 0)
                {
                    status = MedicationStatementStatus.Intended;
                }
                else if (endTime.Length == 0)
                {
                    status = MedicationStatementStatus.Active;
                }
                else
                {
                    status = MedicationStatementStatus.Completed;
                }

                XElement sig = element.Element("Sig");
                XElement drug = sig.Element("Drug");

                string drugName = (string)drug.Element("BrandName");
                if(drugName.Length == 0)
                {
                    drugName = (string)drug.Element("GenericName");
                }

                string strength = (string)drug.Element("Strength");
                string method = (string)drug.Element("Route");
                string timing = (string)drug.Element("DoseTiming");
                string ndcid = (string)drug.Element("NDCID");

                currentList.Add(setUpObject(patient, status, startTime, endTime, drugName, strength, method, timing, ndcid));
            }
            
        }

        MedicationStatement setUpObject(string patient, MedicationStatementStatus status, string startTime, string endTime, string drugName, string strength, string method, string timing, string ndcid)
        {
            MedicationStatement current = new MedicationStatement();

            current.Patient = new ResourceReference();
            current.Patient.Reference = patient;
            current.InformationSource = new ResourceReference();
            current.InformationSource.Reference = "Rcopia";
            current.Status = status;

            var codeConcept = new CodeableConcept();
            codeConcept.Coding.Add(new Coding() { Display = drugName });
            current.Medication = codeConcept;

            Period period = new Period();
            period.Start = startTime;
            period.End = endTime;
            current.Effective = period;

            DosageComponent dose = new DosageComponent();
            dose.Text = drugName + " - " + strength;
            dose.Method = new CodeableConcept("", method);
            dose.Method.Text = method;
            dose.Timing = new Timing();
            dose.Timing.Code = new CodeableConcept("common", timing);
            
            current.Dosage.Add(dose);
            current.Medication = new CodeableConcept("NDCID", ndcid);

            return current;
        }

        public List<MedicationStatement> listAll()
        {
            return currentList;
        }
    }
}