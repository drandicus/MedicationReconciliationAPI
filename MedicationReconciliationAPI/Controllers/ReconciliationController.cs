using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using MedicationReconciliation.Models;
using System.Web;
using System.Xml;
using System.IO;
using System.Text;
using System.Diagnostics;
using Hl7.Fhir.Model;
using MedicationReconciliationAPI.Models.Services;

namespace MedicationReconciliation.Controllers
{
    public class ReconciliationController : ApiController
    {
        /**
           URI: /api/reconciliation

            This handles the reconciliation of a single patient, it will grab the information of that patient
            from the parameters (sent in as a post request) and then parse that information. After parsing it will
            query RCopia for the new information and then reconcile the 2 FHIR objects to provide a comprehensive list

            Params: POST data about the patient - including medication history and external ids
        */

        private RecordRespository recordRepository;
        private String connection = "";

        [Authorize(Roles = "medrecon_user")]
        public HttpResponseMessage Post(HttpRequestMessage request)
        {
    
            var xml = request.Content.ReadAsStreamAsync().Result;
            using (var reader = new StreamReader(xml, Encoding.UTF8))
            {
                string value = reader.ReadToEnd();
                return Reconciliation.reconcile(value);
            }

        }

        
    }
}

