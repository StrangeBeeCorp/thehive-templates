// Delete IP Observables from an alert
// Type: Action:Alert
// Desc: This function will delete all the IP Observable from an alert.
// Param: 
// - input param is the json value that is passed when calling the function. Here it is the alert object where the function is executed
// - context param is an object used to interact with TheHiveAPI
function handle(input, context) {
    
    // Query to get the IP observables of the alert
    const query = [
        {
            "_name": "getAlert",
            "idOrName": input._id
        },
        {
            "_name": "observables"
        },
        {
            "_name": "filter",
            "_and":
            [
                {
                    "_field": "dataType",
                    "_value": "ip"
                }
            ]
        }
    ];
    
    // Get the IP observables of the alert
    const obsList = context.query.execute(query);
    
    // delete all the IP observables
    obsList.map((obs) => {
        context.observable.delete(obs._id);
      });

}