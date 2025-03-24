// Name: Create Alerts From Airtable database
// Type: Feeder
// Desc: This function creates alerts from data coming from a Airtable database. It checks the alert does not already exist, then creates the alert, and completes type, source, source-ref, title, description and tags  
// Param: 
// - input param is the json value that is passed when calling the function. Here it is the return of HTTP query performed by the Feeder. 
// - context param is an object used to interact with TheHiveAPI.

function handle(input, context) {
    const issues = input.records;
    issues.map((issue) => {

      // check if the alert already exists
      const filters = [
        {
          _name: "filter",
          _and: [
            { 
              _field: "sourceRef", 
              _value: issue.id 
            }
          ]
        }
      ];
      if (context.alert.find(filters).length < 1) {
        // the Alert does not exist in TheHive yet, we create it
        const desc = issue.fields["Issue Description"]
        const alert = {
          "type": "event",
          "source": "Feeder-Airtable",
          "sourceRef": issue.id,
          "title": "Incident reported: " + issue.fields["Incident Category"] + " - " + issue.fields["Department"],
          "description": desc,
          "tags": ['Alertfeeder', 'Airtable', issue.fields["Incident Category"]]
        };
        context.alert.create(alert);
      }
    });
}