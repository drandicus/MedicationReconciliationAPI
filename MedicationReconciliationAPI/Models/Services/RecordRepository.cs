using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Hl7.Fhir.Model;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Threading.Tasks;
using MedicationReconciliationAPI.Models;

namespace MedicationReconciliationAPI.Models.Services
{
    public class RecordRespository
    {

        const string CREATE = "CREATE";
        const string UPDATE = "UPDATE";
        const string DELETE = "DELETE";
        private const string PatientKey = "PatientStore";
        private const string MedicationKey = "MedicationStore";
        public RecordRespository(string connection)
        {
            if (string.IsNullOrWhiteSpace(connection))
            {
                connection = "mongodb://localhost:27017";
            }
            MongoClientSettings settings = MongoClientSettings.FromUrl(new MongoUrl(connection));
            MongoClient mongoClient = new MongoClient(settings);
            List<Patient> patientlist = new List<Patient>();
            List<MedicationStatement> medicationlist = new List<MedicationStatement>();
            var ctx = HttpContext.Current;
            var database = mongoClient.GetDatabase("test");

            //get mongodb collection
            var collection_patient = database.GetCollection<Patient>("patient");
            var cursor_p = collection_patient.Find(new BsonDocument());
            var documentlist_p = (cursor_p.ToCursor()).Current;
            if (documentlist_p == null)
            {
            }
            else
            {
                foreach (var document in documentlist_p)
                {
                    patientlist.Add(document);
                }
            }



            var collection_medication = database.GetCollection<MedicationStatement>("medication");
            var cursor_m = collection_medication.Find(new BsonDocument());
            var documentlist_m = (cursor_m.ToCursor()).Current;
            if (documentlist_m == null) { }
            else
            {
                foreach (var document in documentlist_m)
                {
                    medicationlist.Add(document);
                }
            }

            if (ctx != null)
            {
                if (ctx.Cache[PatientKey] == null)
                {
                    ctx.Cache[PatientKey] = patientlist;
                }
                if (ctx.Cache[MedicationKey] == null)
                {
                    ctx.Cache[MedicationKey] = medicationlist;
                }
            }
        }

        //duplicated medication records patients will still posted to server with different Id
        public async Task<bool> CreateRecord(String recordString, string connection)
        {

            if (string.IsNullOrWhiteSpace(connection))
            {
                connection = "mongodb://localhost:27017";
            }
            MongoClientSettings settings = MongoClientSettings.FromUrl(new MongoUrl(connection));
            MongoClient mongoClient = new MongoClient(settings);

            var database = mongoClient.GetDatabase("test");

            var collection_count = database.GetCollection<Count>("count");
            int numb_count = (int)collection_count.Count(new BsonDocument());
            Count total = new Count();
            total.count = numb_count + 1;
            await collection_count.InsertOneAsync(total);



            var collection_record = database.GetCollection<Record>("record");
            int numb = (int)collection_record.Count(new BsonDocument());

            Record record = new Record(numb + 1, recordString, "Create");


            if (record.Type == "Undefined")
            {
                return false;
            }
            else {
                try
                {
                    await collection_record.InsertOneAsync(record);
                }
                catch
                {
                    return false;
                }
                var ctx = HttpContext.Current;


                if (record.Type == "Patient")
                {
                    var collection_patient = database.GetCollection<Patient>("patient");
                    Patient patient = new Patient();
                    patient = (Hl7.Fhir.Model.Patient)record.FhirPatient.DeepCopy();
                    // patient.Id = (numb_count + 1).ToString();
                    try
                    {
                        await collection_patient.InsertOneAsync(patient);
                    }
                    catch
                    {
                        return false;
                    }
                    List<Patient> patientlist = new List<Patient>();
                    if (ctx != null)
                    {

                        if (ctx.Cache[PatientKey] == null)
                        {
                            patientlist.Add(patient);
                            ctx.Cache[PatientKey] = patientlist;
                        }
                        else
                        {
                            patientlist = (List<Patient>)ctx.Cache[PatientKey];
                            patientlist.Add(patient);
                            ctx.Cache[PatientKey] = patientlist;
                        }

                    }

                }
                if (record.Type == "Medication")
                {
                    var collection_medication = database.GetCollection<MedicationStatement>("medication");
                    MedicationStatement medicationstatement = new MedicationStatement();
                    medicationstatement = (Hl7.Fhir.Model.MedicationStatement)record.FhirMedication.DeepCopy();
                    medicationstatement.Id = (numb_count + 1).ToString();
                    //BsonDocument temp = medicationstatement.ToBsonDocument();
                    //temp.Set("_id", (count + 1).ToSt);
                    try
                    {
                        await collection_medication.InsertOneAsync(medicationstatement);
                    }
                    catch
                    {
                        return false;
                    }
                    List<MedicationStatement> medicationlist = new List<MedicationStatement>();
                    if (ctx != null)
                    {

                        if (ctx.Cache[MedicationKey] == null)
                        {
                            medicationlist.Add(medicationstatement);
                            ctx.Cache[MedicationKey] = medicationlist;
                        }
                        else
                        {
                            medicationlist = (List<MedicationStatement>)ctx.Cache[MedicationKey];
                            medicationlist.Add(medicationstatement);
                            ctx.Cache[MedicationKey] = medicationlist;
                        }

                    }

                }
            }


            return true;
        }


        public async Task<bool> DeleteAll(string connection, string type)
        {

            if (string.IsNullOrWhiteSpace(connection))
            {
                connection = "mongodb://localhost:27017";
            }
            MongoClientSettings settings = MongoClientSettings.FromUrl(new MongoUrl(connection));
            MongoClient mongoClient = new MongoClient(settings);
            var database = mongoClient.GetDatabase("test");
            if (type == "record")
            {
                var collection = database.GetCollection<Record>(type);
                var filter = new BsonDocument();
                var result = await collection.DeleteManyAsync(filter);

                return true;
            }
            var ctx = HttpContext.Current;
            if (type == "patient")
            {
                var collection_record = database.GetCollection<Record>("record");
                int numb = (int)collection_record.Count(new BsonDocument());

                Record record = new Record(numb + 1, "", "DeleteAllPatient");
                await collection_record.InsertOneAsync(record);
                var collection = database.GetCollection<Patient>(type);
                var filter = new BsonDocument();
                var result = await collection.DeleteManyAsync(filter);
                HttpContext.Current.Cache.Remove(PatientKey);
                return true;
            }
            if (type == "medication")
            {
                var collection_record = database.GetCollection<Record>("record");
                int numb = (int)collection_record.Count(new BsonDocument());

                Record record = new Record(numb + 1, "", "DeleteAllMedication");
                await collection_record.InsertOneAsync(record);

                var collection = database.GetCollection<MedicationStatement>(type);
                var filter = new BsonDocument();
                var result = await collection.DeleteManyAsync(filter);
                HttpContext.Current.Cache.Remove(PatientKey);
                return true;
            }
            return false;




        }


        public async Task<bool> DeletePatient(string connection, int personal_code)
        {
            if (string.IsNullOrWhiteSpace(connection))
            {
                connection = "mongodb://localhost:27017";
            }
            MongoClientSettings settings = MongoClientSettings.FromUrl(new MongoUrl(connection));
            MongoClient mongoClient = new MongoClient(settings);

            try
            {
                var database = mongoClient.GetDatabase("test");
                var collection = database.GetCollection<Patient>("patient");
                var filter = Builders<Patient>.Filter.Eq("ElementId", personal_code.ToString());
                var result = await collection.DeleteManyAsync(filter);

                await DeleteMedicationAll(connection, personal_code);
                return true;
            }
            catch
            {
                return false;
            }
        }

        //Delete All MedicationStatements of one patient

        public async Task<bool> DeleteMedicationAll(string connection, int personal_code)
        {
            if (string.IsNullOrWhiteSpace(connection))
            {
                connection = "mongodb://localhost:27017";
            }
            MongoClientSettings settings = MongoClientSettings.FromUrl(new MongoUrl(connection));
            MongoClient mongoClient = new MongoClient(settings);

            try
            {
                var database = mongoClient.GetDatabase("test");
                var collection = database.GetCollection<MedicationStatement>("medication");
                var filter = Builders<MedicationStatement>.Filter.Eq("Patient.ElementId", personal_code.ToString());
                var result = await collection.DeleteManyAsync(filter);
                return true;
            }
            catch
            {
                return false;
            }

        }
        //Delete one specific medicationStatement with its ElementId
        public async Task<bool> DeleteMedicationStatement(string connection, int statement_code)
        {
            if (string.IsNullOrWhiteSpace(connection))
            {
                connection = "mongodb://localhost:27017";
            }
            MongoClientSettings settings = MongoClientSettings.FromUrl(new MongoUrl(connection));
            MongoClient mongoClient = new MongoClient(settings);

            try
            {
                var database = mongoClient.GetDatabase("test");
                var collection = database.GetCollection<MedicationStatement>("medication");
                var filter = Builders<MedicationStatement>.Filter.Eq("IdElement.ElementId", statement_code.ToString());
                var result = await collection.DeleteManyAsync(filter);
                return true;
            }
            catch
            {
                return false;
            }

        }

        public async Task<bool> UpdatePatient(string connection, int personal_code, string recordString)
        {
            if (string.IsNullOrWhiteSpace(connection))
            {
                connection = "mongodb://localhost:27017";
            }
            MongoClientSettings settings = MongoClientSettings.FromUrl(new MongoUrl(connection));
            MongoClient mongoClient = new MongoClient(settings);

            try
            {
                var database = mongoClient.GetDatabase("test");
                var collection = database.GetCollection<Patient>("patient");
                var filter = Builders<Patient>.Filter.Eq("ElementId", personal_code.ToString());
                var result = await collection.Find(filter).ToListAsync();

                var update = result.First();
                /*Patient patient = new Patient();
                patient = (Hl7.Fhir.Model.Patient)record.FhirPatient.DeepCopy();
                patient.Id = (numb_count + 1).ToString();
                try
                {
                    await collection_patient.InsertOneAsync(patient);
                }
                catch
                {
                    return false;
                }
                */


                await DeleteMedicationAll(connection, personal_code);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateMedicationStatement(string connection, int statement_code, string recordString)
        {
            if (string.IsNullOrWhiteSpace(connection))
            {
                connection = "mongodb://localhost:27017";
            }
            MongoClientSettings settings = MongoClientSettings.FromUrl(new MongoUrl(connection));
            MongoClient mongoClient = new MongoClient(settings);

            try
            {
                var database = mongoClient.GetDatabase("test");
                var collection = database.GetCollection<MedicationStatement>("patient");
                var filter = Builders<MedicationStatement>.Filter.Eq("IdElement.ElementId", statement_code.ToString());
                var result = await collection.DeleteManyAsync(filter);

                await DeleteMedicationAll(connection, statement_code);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<List<Patient>> SearchAll(string connection)
        {
            if (string.IsNullOrWhiteSpace(connection))
            {
                connection = "mongodb://localhost:27017";
            }
            MongoClientSettings settings = MongoClientSettings.FromUrl(new MongoUrl(connection));
            MongoClient mongoClient = new MongoClient(settings);

            var database = mongoClient.GetDatabase("test");
            var collection_patient = database.GetCollection<Patient>("patient");
            var filter = new BsonDocument();
            var result = await collection_patient.Find(filter).ToListAsync();


            return result;




        }

        public async Task<List<Patient>> SearchOne(string connection, string Familyname, string Givenname)
        {
            if (string.IsNullOrWhiteSpace(connection))
            {
                connection = "mongodb://localhost:27017";
            }
            MongoClientSettings settings = MongoClientSettings.FromUrl(new MongoUrl(connection));
            MongoClient mongoClient = new MongoClient(settings);

            var database = mongoClient.GetDatabase("test");
            var collection_patient = database.GetCollection<Patient>("patient");
            var filter = Builders<Patient>.Filter.Eq("Name.Family", Familyname) & Builders<Patient>.Filter.Eq("Name.Given", Givenname);
            var result = await collection_patient.Find(filter).ToListAsync();


            return result;

        }

        public async Task<Patient> SearchId(string connection, int Id)
        {
            if (string.IsNullOrWhiteSpace(connection))
            {
                connection = "mongodb://localhost:27017";
            }
            MongoClientSettings settings = MongoClientSettings.FromUrl(new MongoUrl(connection));
            MongoClient mongoClient = new MongoClient(settings);

            var database = mongoClient.GetDatabase("test");
            var collection_patient = database.GetCollection<Patient>("patient");
            var filter = Builders<Patient>.Filter.Eq("IdElement.Value", Id.ToString());
            var result = await collection_patient.Find(filter).ToListAsync();
            if (result[0] == null)
            {
                return new Patient();
            }
            Patient patient = result.First();
            return patient;
        }

        public async Task<List<MedicationStatement>> FindMedication(string connection, int id)
        {
            if (string.IsNullOrWhiteSpace(connection))
            {
                connection = "mongodb://localhost:27017";
            }
            MongoClientSettings settings = MongoClientSettings.FromUrl(new MongoUrl(connection));
            MongoClient mongoClient = new MongoClient(settings);

            try
            {
                var database = mongoClient.GetDatabase("test");
                var collection = database.GetCollection<MedicationStatement>("medication");
                var filter = Builders<MedicationStatement>.Filter.Eq("Patient.ElementId", id.ToString());
                var result = await collection.Find(filter).ToListAsync();
                return result;
            }
            catch
            {
                return null;
            }


        }

        /*
                void UpdatePatient(Patient patient);
                bool DeletePatient(int patid);

                Patient ReadPatient(int id);

                List<Patient> SearchByName(string name);

                Patient ReadPatientHistory(int patid, int version);
                List<Patient> GetPatientHistory(int patid);
                List<Patient> GetPatientHistory(Patient patient);
                */

    }
    class RecordRepository
    {
    }
}