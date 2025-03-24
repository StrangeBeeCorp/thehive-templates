function handle(input, context) {
    const issues = input.issues;

    issues.map((issue) => {
        // check if the alert already exists
        const filters = [
            {
                _name: "filter",
                _and: [
                    { 
                        _field: "sourceRef", 
                        _value: "jira-" + issue.id 
                    }
                ]
        }
        ];

        if (context.alert.find(filters).length < 1) {
            // the Alert does not exist in TheHive yet, we create it

            // Get the JIRA issue description depending how it is formated
            const descriptionContent = issue.fields.description?.content || [];
            const description = issue.fields.description?.type !== 'doc' ? issue.fields.description : descriptionContent.flatMap((block) => {
                return block.content?.flatMap((innerBlock) => innerBlock.text || '') || '';
            });

            const timestamp = (new Date()).getTime().toString();

            // mapping with the alert field
            const alert = {
            "type": "event",
            "source": "alertFeeder-JIRA",
            "sourceRef": "jira-" + issue.id,
            "title": "Alert from " + issue.key + " " + issue.fields.summary + " " + timestamp,
            "description": JSON.stringify(description).slice(1, -1)
            };
            context.alert.create(alert);
        }
    });
}