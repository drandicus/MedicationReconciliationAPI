# MedicationReconciliationAPI
Medication Reconciliation API

API Usage
  - Using Postman or Fiddler
     - Query by posting using the url extension: /api/reconciliation
     - (Temporary) Run the Security Test Library to generate the key to append to the header of the request. It will output to access_key.txt in the source directory.
     - In your query add the raw XML (more extensions and portability to be added on) as raw input. 
     - The XML to be passed in has to be formatted like the example format below.
     
      ```
      <patient>
        <name>
            <first_name>John</first_name>
            <last_name>Travolta</last_name>
        </name>
       <medications>
           <medication>
               <medName>cephalexin</medName>
               <sig>500 mg PO q6h</sig>
           </medication>
           <medication>
               <medName>enoxaparin</medName>
               <sig>40 mg SC daily</sig>
           </medication>
           <medication>
               <medName>insulin sliding scale</medName>
               <sig>SC q4h prn</sig>
           </medication>
           <medication>
               <medName>Lantus</medName>
               <sig>20 mg SC qHS</sig>
           </medication>
           <medication>
               <medName>acetaminophen</medName>
               <sig>1g PO q6h prn pain</sig>
           </medication>
           <medication>
               <medName>lorazepam</medName>
               <sig>1 mg PO q8h prn anxiety</sig>
           </medication>
           <medication>
               <medName>tramadol</medName>
               <sig>50 mg PO q6h prn pain</sig>
           </medication>
           <medication>
               <medName>donepezil</medName>
               <sig>10 mg PO qHS</sig>
           </medication>
           <medication>
               <medName>clopidogrel</medName>
               <sig>75 mg PO daily</sig>
           </medication>
           <medication>
               <medName>fluoxetine</medName>
               <sig>20 mg PO daily</sig>
           </medication>
           <medication>
               <medName>rosuvastatin</medName>
               <sig>40 mg PO daily</sig>
           </medication>
           <medication>
               <medName>metoprolol</medName>
               <sig>50 mg PO BID</sig>
           </medication>
       </medications>
    </patient>
    ```
    
    - This will output XML as well (as mentioned, portability will be addressed soon).

  - Using the Client
    - The client is currently a work in progress, disregard for now.
