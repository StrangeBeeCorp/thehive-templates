// Name: Create Alert based on Splunk Alet
// Type: API
// Desc: This function creates a TheHive Alert based on an input coming from Splunk, and matches the Splunk fields to TheHive fields.
// In Splunk, you'll need to configure the webhook URL to point to the TheHive function URL.
// Param: 
// - input param is the json value that is passed when calling the function. Here it is the Splunk alert details.
// - context param is an object used to interact with TheHiveAPI.


function handle(input, context) {
    const theHiveAlert = {
        "type": "splunk",
        "source": input.search_name,
        "sourceRef": input.result._serial,
        "title": `Splunk Alert triggered: ${input.search_name} by ${input.result.sourcetype}`,
        "description": `Alert created by splunk search '${input.search_name}:\n${input.result._raw}'`,
        "date": (new Date(parseFloat(input.result._time)*1000)).getTime(),
        "observables": [
            {"dataType": "hostname", "data": input.result.host},
            {"dataType": "other", "data": input.result.action, "message": "action"},
            {"dataType": "other", "data": input.result._raw, "message": "raw"}
        ]
    };
    return context.alert.create(theHiveAlert);
}
