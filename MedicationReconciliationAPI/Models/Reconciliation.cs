using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Hl7.Fhir.Model;
using System.Net.Http;
using System.Text;
using System.Xml;
using System.IO;
using Hl7.Fhir.Rest;
using MedicationReconciliationAPI.Models;
using static Hl7.Fhir.Model.MedicationStatement;
using System.Diagnostics;


namespace MedicationReconciliation.Models
{
    public class Reconciliation
    {

        private static String[] externalID;

        /**
            Main handler for the reconciliation process.
            Sends information recieved to different parts of the process
            and recompiles the completed information to XML and sends it on their way

            Returns: XML of the final reconciled differences
        */
        public static HttpResponseMessage reconcile(String clientInformation)
        {
            externalID = extractID(clientInformation);

            List<MedicationStatement> clientPatient = parseClientInformation(clientInformation);
            List<MedicationStatement> ePrescribePatient = parseEPrescribeInformation(externalID);

            return reconcileDifferences(clientPatient, ePrescribePatient);
        }

        /**
            Extracts the first/last name combination from the XML
            Used predominatly for searching for the client in the EPrescribe Database
        */
        private static String[] extractID(String clientInformation)
        {
            String firstName = "";
            String lastName = "";
            String rcopiaID = "";
            using (XmlReader reader = XmlReader.Create(new StringReader(clientInformation)))
            {
                while (reader.Read())
                {
                    if (reader.NodeType == XmlNodeType.Element)
                    {
                        switch (reader.Name)
                        {
                            case "first_name":
                                reader.Read();
                                firstName = reader.Value;
                                break;
                            case "last_name":
                                reader.Read();
                                lastName = reader.Value;
                                break;

                            case "rcopia_id":
                                reader.Read();
                                rcopiaID = reader.Value;
                                break;
                        }
                    }

                }
            }
            return new String[] {
                firstName,
                lastName,
                rcopiaID
            };
        }

        class myMedication
        {
            public string name { get; set; }
            public string dosage { get; set; }

        }

        /**
            Returns the client information in a FHIR Object
            It takes the initial XML from the client and then parses it into
            a list of Medication Statments to be compared and reconciled
        */
        private static List<MedicationStatement> parseClientInformation(String clientInformation)
        {
            Boolean medElement = false;
            var medicationList = new List<myMedication>();
            myMedication newMedication = null;
            using (XmlReader reader = XmlReader.Create(new StringReader(clientInformation)))
            {
                while (reader.Read())
                {
                    if (reader.NodeType == XmlNodeType.Element)
                    {
                        if (!medElement)
                            newMedication = new myMedication(); //reading a new medication
                        switch (reader.Name)
                        {
                            case "medName":
                                medElement = true;
                                reader.Read();
                                newMedication.name = reader.Value;
                                break;
                            case "sig":
                                medElement = false;
                                reader.Read();
                                newMedication.dosage = reader.Value;
                                medicationList.Add(newMedication);
                                break;
                        }
                    }
                }
            }

            var medicationFHIR = new List<MedicationStatement>();
            foreach (myMedication med in medicationList)
            {
                MedicationStatement currentMed = new MedicationStatement(); // the FHIR object, we are going to used to do reconciliation
                string medName = med.name;
                string dosageString = med.dosage;
                int dosageFrequency, dose;
                dosageFrequency = dose = 1; // this information should be parsed from dosageString
                currentMed.Medication = new CodeableConcept();

                var codeConcept = new CodeableConcept();
                codeConcept.Coding.Add(new Coding() { Display = medName });
                currentMed.Medication = codeConcept;
                //dosage in text format

                //Assuming the dosage has the folloing information provided
                //the dosage information should be parsed from the dosageString
                decimal duration = 1.4M;
                var medTiming = new Timing();
                medTiming.Repeat = new Timing.RepeatComponent();
                medTiming.Repeat.Duration = duration;
                medTiming.Repeat.PeriodUnits = Timing.UnitsOfTime.H;
                medTiming.Repeat.Period = dosageFrequency;

                currentMed.Dosage = new List<MedicationStatement.DosageComponent>();
                var dosageComp = new MedicationStatement.DosageComponent();
                dosageComp.Timing = medTiming;
                dosageComp.Text = medName + " - " + med.dosage;
                currentMed.Dosage.Add(dosageComp);
                medicationFHIR.Add(currentMed);
            }

            return medicationFHIR;
        }

        /**
            Returns the ePrescribe information in a FHIR Object
            It takes the external id's used to query the EPrescribe DB and then build the FHIR
            Medication statments from that information.
        */
        private static List<MedicationStatement> parseEPrescribeInformation(String[] externalID)
        {
            return new RcopiaObject(externalID[2]).listAll();
        }

        /**
            Gets the difference between the 2 patients profiles and then builds the xml that returns
            the difference between the 2 profiles.
        */
        private static HttpResponseMessage reconcileDifferences(List<MedicationStatement> a, List<MedicationStatement> b)
        {
            List<MedicationStatement> shared = new List<MedicationStatement>();
            List<MedicationStatement> hospitalSimilar = new List<MedicationStatement>();
            List<MedicationStatement> ePrescribeSimilar = new List<MedicationStatement>();

            Dictionary<MedicationStatement, List<MedicationStatement>> similar = new Dictionary<MedicationStatement, List<MedicationStatement>>();

            foreach (var hospitalMedication in a)
            {

                foreach (var ePrescribeMedication in b)
                {
                    var comparison = compareMedication(hospitalMedication, ePrescribeMedication);

                    if (comparison == "Equal")
                    {
                        shared.Add(hospitalMedication);
                    } else if (comparison == "Similar")
                    {
                        if (similar.ContainsKey(hospitalMedication))
                        {
                            similar[hospitalMedication].Add(ePrescribeMedication);
                        } else
                        {
                            similar.Add(hospitalMedication, new List<MedicationStatement>() { ePrescribeMedication });
                        }
                        hospitalSimilar.Add(hospitalMedication);
                        ePrescribeSimilar.Add(ePrescribeMedication);
                    }
                }
            }

            List<MedicationStatement> hospitalUnique = a.Except((shared.Union(hospitalSimilar))).ToList();
            List<MedicationStatement> ePrescribeUnique = b.Except((shared.Union(ePrescribeSimilar))).ToList();

            return buildXMLString(a, b, shared, hospitalUnique, similar, ePrescribeUnique);
        }
        
        /**
            This method handles the overall comparison of the medication
            It checks the scores of the criterion and then renders a verdict based on
            the score
        */
        private static String compareMedication(MedicationStatement hospital, MedicationStatement ePrescribe)
        {

            String hInfo = hospital.Dosage.First().Text;
            String eInfo = ePrescribe.Dosage.First().Text;

            int medScore = checkMedicine(hInfo, eInfo);
            int dosageScore = checkDosage(hInfo, eInfo);
            int score = medScore + dosageScore;

            
            if (score == 2)
            {
                return "Equal";
            } else if (score > 0)
            {
                return "Similar";
            }

            return "Not Similar";
        }
        
        /**
            This method compares the medicine name

            Returns 1 if the same name, 0 otherwise
        */
        private static int checkMedicine(String hospital, String ePrescribe)
        {
            hospital = hospital.Split(new string[] { " - " }, StringSplitOptions.None)[0];
            ePrescribe = ePrescribe.Split(new string[] { " - " }, StringSplitOptions.None)[0];

            return (hospital.ToLower() == ePrescribe.ToLower()) ? 1 : 0;
        }
        /**
            This method compares the dosage of the medications to check for similarities
            Usually, the exact same dosage is a sign that the medication is similar.

            Returns 1 if has the same dosage, 0 otherwise
        */
        private static int checkDosage(String hospital, String ePrescribe)
        {
            if(hospital.Length == 0 || ePrescribe.Length == 0)
            {
                return 0;
            }

            hospital = hospital.Split(new string[] { " - " }, StringSplitOptions.None)[1];
            ePrescribe = ePrescribe.Split(new string[] { " - " }, StringSplitOptions.None)[1];

            double hDose = parseDosage(hospital);
            double eDose = parseDosage(ePrescribe);

            if (hDose == -1 || eDose == -1) return 0;
            return (hDose == eDose) ? 1 : 0;
        }

        /**
            This method tries to convert all the dosage into a standard number
            It tries to find the measurments of the dosage in mg/day
        */
        private static double parseDosage(String dosage)
        {
            Dictionary<string, double> conversion = new Dictionary<string, double>();
            conversion.Add("mg", 1.0);
            conversion.Add("mcg", 0.001);

            dosage = dosage.ToLower();
            String[] split = dosage.Split(' ');

            foreach(KeyValuePair<string, double> entry in conversion)
            {
                int loc = Array.IndexOf(split, entry.Key);
                if (loc > 0)
                {
                    Double val;
                    bool result = Double.TryParse(split[loc - 1], out val);
                    if (result)
                    {
                        return val * entry.Value;
                    } 
                }
            }

            return -1;
        }

        /**
            Helper function that gets the XML from a MedicationStatment element
        */
        private static String generateMedicationXML(MedicationStatement element)
        {
            String info = element.Dosage.First().Text;
            String[] details = info.Split(new string[] { " - " }, StringSplitOptions.None);

            String retVal = "";
            retVal += "<medication>";
            retVal += "<name>" + details[0] + "</name>";
            retVal += "<sig>" + details[1] + "</sig>";
            retVal += "</medication>";

            return retVal;
        }

        /**
            Helper function that will generate the return XML string
            Generates the XML for a list of medication statments
        */
        private static String generateListXML(List<MedicationStatement> list, String cat)
        {
            String retVal = "<" + cat + ">";

            foreach(var element in list)
            {
                retVal += generateMedicationXML(element);
            }

            retVal += "</" + cat + ">";
            return retVal;
        }

        /**
            Helper function that generates XML from a dictionary object
        **/
        private static String generateDictionaryXML(Dictionary<MedicationStatement, List<MedicationStatement>> similar)
        {
            String retVal = "<similar>";

            foreach(KeyValuePair<MedicationStatement, List<MedicationStatement>> entry in similar)
            {
                retVal += "<hospitalMedication>";
                retVal += generateMedicationXML(entry.Key);
                retVal += "<ePrescribeMedication>";

                foreach(MedicationStatement element in entry.Value)
                {
                    retVal += generateMedicationXML(element);
                }

                retVal += "</ePrescribeMedication>";
                retVal += "</hospitalMedication>";
            }

            retVal += "</similar>";
            return retVal;
        }

        /**
            Main Helper function that generates the XML
        */
        private static HttpResponseMessage buildXMLString(List<MedicationStatement> hospital, List<MedicationStatement> ePrescribe, List<MedicationStatement> shared, List<MedicationStatement> clientUnique, Dictionary<MedicationStatement, List<MedicationStatement>> similar, List<MedicationStatement> rCopiaUnique)
        {

            var retval = "<medication_reconciliation><patient_name><first_name>" + externalID[0] + "</first_name><last_name>" + externalID[1] + "</last_name></patient_name>";
            retval += generateListXML(hospital, "hospital");
            retval += generateListXML(ePrescribe, "ePrescribe");
            retval += generateListXML(shared, "shared");
            retval += generateListXML(clientUnique, "clientUnique");
            retval += generateDictionaryXML(similar);
            retval += generateListXML(rCopiaUnique, "ePrescribeUnique");
            retval += "</medication_reconciliation>";
            return new HttpResponseMessage()
            {
                Content = new StringContent(retval, Encoding.UTF8, "text/html")
            };
        }
    }
}