// Name: Change imported Alerts status when case is closed
// Type: Notification
// Desc: This function is designed to trigger on case closed event. It automatically changes imported alerts to a given custom status.
// Param: 
// - input param is the json value that is passed when calling the function. Here it is the audit object that triggers the function. 
// - context param is an object used to interact with TheHive API.

function handle(input, context) {
    // Query to get the LinkedAlerts
    const query = [
            {
              "_name" : "getCase",
              "idOrName": input.object._id
            },
            {
              "_name":"alerts"
            }
          ]
        
      // Get the linkedAlert list
      const alertList = context.query.execute(query);
      
      if (alertList.length > 0) {
        // change linked Alerts to ignore
        for (alert of alertList) {
          context.alert.update(alert._id, { "status": "Ignored", "stage": "Closed"})
        }
      }
}