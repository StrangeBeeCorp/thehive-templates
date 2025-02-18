// Name: Assign High & Critical Alerts
// Type: Notification
// Desc: This function is designed to trigger on alert creation event. It automatically assignes severity High & Critical alerts to a given user.
// Param: 
// - input param is the json value that is passed when calling the function. Here it is the audit object that triggers the function. 
// - context param is an object used to interact with TheHiveAPI.

function handle(input, context) {
    // assignee for high & critical severity alerts. It has to be a valid TheHive login.
    const NewAssignee = 'userassignee@yourcompany.test';

    if (input.object.severity >= 3) {
        context.alert.update(input.object._id, { assignee: NewAssignee })
    };
}


