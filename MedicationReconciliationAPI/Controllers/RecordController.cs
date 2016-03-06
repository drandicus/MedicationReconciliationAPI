using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using Hl7.Fhir.Model;
using Hl7.Fhir.Serialization;
using System.Net.Http;
using System.Web.Http;
using MedicationReconciliationAPI.Models;
using MedicationReconciliationAPI.Models.Services;
using System.Diagnostics;

namespace MedicationReconciliationAPI.Controllers
{
    public class RecordController : ApiController
    {
        private RecordRespository recordRepository;
        private String connection = "";
        public RecordController()
        {
            this.recordRepository = new RecordRespository(connection);
        }


        [HttpPost]
        public async System.Threading.Tasks.Task<HttpResponseMessage> Post(String recordString)
        {
            Debug.WriteLine(recordString);
            bool result = await this.recordRepository.CreateRecord(recordString, connection);
            var response = Request.CreateResponse<String>(System.Net.HttpStatusCode.BadRequest, recordString);
            if (result == true)
            {
                response = Request.CreateResponse<String>(System.Net.HttpStatusCode.Created, recordString);
            }
            return response;
        }

        [HttpDelete]
        public async System.Threading.Tasks.Task<HttpResponseMessage> DeleteAll(String type)
        {
            var response = Request.CreateResponse<String>(System.Net.HttpStatusCode.BadRequest, type);
            bool result = await this.recordRepository.DeleteAll(connection, type);
            if (result == true)
            {
                response = Request.CreateResponse<String>(System.Net.HttpStatusCode.Accepted, type);
            }
            return response;
        }

        [HttpDelete]
        public async System.Threading.Tasks.Task<HttpResponseMessage> DeleteSingle(String type, int person_id)
        {
            var response = Request.CreateResponse<String>(System.Net.HttpStatusCode.BadRequest, "type");
            bool result = false;
            if (type == "patient")
            {
                result = await this.recordRepository.DeletePatient(connection, person_id);
            }
            if (type == "medicationall")
            {
                result = await this.recordRepository.DeleteMedicationAll(connection, person_id);
            }
            if (type == "medication")
            {
                result = await this.recordRepository.DeleteMedicationStatement(connection, person_id);
            }
            if (result == true)
            {
                response = Request.CreateResponse<String>(System.Net.HttpStatusCode.Accepted, "type");
            }
            return response;
        }


        [HttpGet]
        public async System.Threading.Tasks.Task<List<String>> GetAllpatient()
        {
            try
            {
                List<Patient> patientlist = await this.recordRepository.SearchAll(connection);
                List<String> namelist = new List<String>();
                List<String> Idlist = new List<String>();
                foreach (var temp in patientlist)
                {
                    HumanName name = temp.Name.First();
                    String Family = name.Family.First();
                    String Last = name.Given.First();
                    String code = temp.Id;

                    namelist.Add(Last + " " + Family);
                    Idlist.Add(code);

                }

                if (Idlist == null)
                {
                    return null;
                }
                else {
                    namelist.AddRange(Idlist);
                    return namelist;
                }

            }
            catch
            {
                return null;
            }
        }

        [HttpGet]
        public async System.Threading.Tasks.Task<List<int>> GetpatientId(String Familyname, String Givenname)
        {
            List<int> result = new List<int>();
            List<Patient> patientlist = await this.recordRepository.SearchOne(connection, Familyname, Givenname);

            foreach (var temp in patientlist)
            {

                string code = temp.Id;

                result.Add(Int32.Parse(code));

            }
            return result;
        }

        [HttpGet]
        public async System.Threading.Tasks.Task<List<String>> GetMedicationStatement(int id)
        {
            List<String> result = new List<string>();
            List<MedicationStatement> medicationlist = await this.recordRepository.FindMedication(connection, id);

            foreach (var temp in medicationlist)
            {

                string xml = FhirSerializer.SerializeResourceToXml(temp);

                result.Add(xml);

            }
            return result;
        }

        [HttpGet]
        public async System.Threading.Tasks.Task<String> GetXML(String type,int id)
        {

            List<MedicationStatement> medicationlist = await this.recordRepository.FindMedication(connection, id);
            Patient patient = await this.recordRepository.SearchId("", id);
            HumanName humanname = patient.Name.First();
            String given = humanname.Given.First();
            String family = humanname.Family.First();

            String xml = "<patient><name><first_name>" + given + "</first_name><last_name>" + family + "</last_name></name><medications>";
            foreach (var temp in medicationlist)
            {

                String medname = temp.Medication.ElementId;
                String mednote = temp.Note;
                String tempadd = "<medication><medName>" + medname + "</medName><sig>" + mednote + "</sig></medication>";
                xml = xml + tempadd;
            }
            xml = xml + "</medications></patient>";
            return xml;
        }
    }
}