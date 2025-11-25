//Author: @CyberPescadito for StrangeBee
// This alert feeder will get a Jira project issues and make it TheHive Alerts. 
// TheHive alerts will also get updated if Jira issues are updated over time.

// To use it, configure your Alert feeder with the below parameters (mind to changes the parameters needed).
// Change the interval to the same value than in the jql in the body below + 5 minutes. In this example: 65 minutes.
// Method: POST
// URL: https://*company*.atlassian.net/rest/api/3/search/jql
// Body: {
//    "fields": ["*all"],
//    "fieldsByKeys": true,
//    "jql": "project = '*ProjectName*' AND issuetype != Sub-task AND updated >= -60m",
//    "maxResults": 999
// }
//Headers: Content-type: application/json, Accept: application/json
//Auth: Basic (username + apikey as password)
//Use "test connection button" to check the query is working as expected.

// !Please read the function carefully and make mapping with values from your context, eg: statuses (both Jira & TheHive), Jira fields --> TheHive customfields, ...!

//Function definition:

// ------------------- Helpers -------------------

// Make status mapping between Jira & TheHive. Need to be adapted to your needs!
function mapStatus(jiraStatus) {
  if (!jiraStatus) return "New";
  const normalized = jiraStatus.toLowerCase().trim();
  const mapping = {
    "to do": "New",
    "open": "New",
    "in progress": "InProgress",
    "reopened": "InProgress",
    "done": "Done",
    "postponed": "Done",
    "closed": "Resolved",
    "resolved": "Resolved"
  };
  return mapping[normalized] || jiraStatus.replace(/\s+/g, "");
}

// Convert issues time spent from Jira to Hours for a TheHive dedicated customField.
function getSpentHours(issue) {
  const s = issue.fields?.timetracking?.timeSpentSeconds;
  return s ? s / 3600 : 0;
}

// Convert Jira issues description to TheHive format.
function buildDescription(desc) {
  if (!desc) return "(No description)";
  if (desc.type !== "doc") return desc;
  if (!Array.isArray(desc.content)) return "(No description)";

  return desc.content.map(block => {
    if (block.type === "paragraph") {
      const text = (block.content || [])
        .map(inner => inner?.text || "")
        .filter(Boolean)
        .join("");
      return text ? text + "\r\n\r\n" : "";
    }
    if (block.type === "heading") {
      const level = block.attrs?.level || 1;
      const hashes = "#".repeat(level);
      const text = (block.content || [])
        .map(c => c?.text || "")
        .filter(Boolean)
        .join("");
      return text ? `${hashes} ${text}\r\n\r\n` : "";
    }
    if (block.type === "bulletList") {
      return (block.content || []).map(li => {
        const text = (li.content || []).map(p =>
          (p.content || [])
            .map(t => t?.text || "")
            .filter(Boolean)
            .join("")
        ).join("");
        return text ? `- ${text}\r\n` : "";
      }).join("") + "\r\n";
    }
    const text = (block.content || [])
      .map(inner => inner?.text || "")
      .filter(Boolean)
      .join("");
    return text ? text + "\r\n" : "";
  }).join("").trim();
}

// ------------------- Main handler -------------------

function handle(input, context) {
  const issues = input.issues || [];
  // Declare Jira fields with a float format here.
  const floatFields = ["time-spent"];

  // Declare the Jira fields you want to sync in your TheHive alerts here.
  issues.forEach(issue => {
    const description = buildDescription(issue.fields?.description);
    const priority = issue.fields?.priority?.name ?? null;
    const category = issue.fields?.customfield_10052?.value ?? null;
    const region = issue.fields?.customfield_11429?.value ?? null;
    const timeSpent = getSpentHours(issue);

    const filters = [
      {
        _name: "filter",
        _and: [
          { _field: "sourceRef", _value: issue.key }
        ]
      }
    ];

    const existing = context.alert.find(filters);

    const pushCF = (arr, name, value) => {
      if (value === null || value === undefined || value === "") return;
      if (floatFields.includes(name)) {
        const num = parseFloat(value);
        if (!isNaN(num)) arr.push({ name: name, value: num });
      } else {
        arr.push({ name: name, value: String(value) });
      }
    };

    // ---------- CREATE ----------
    if (!existing || existing.length === 0) {
      const alert = {
        type: issue.fields?.issuetype?.name ?? "Unknown",
        source: "Jira",
        sourceRef: issue.key,
        title: issue.fields?.summary ?? "(No summary)",
        description: description,
        status: mapStatus(issue.fields?.status?.name),
        date: issue.fields?.created ?? new Date().toISOString(),
        customFields: []
      };

      //  Make maping between Jira & TheHive customFields here. TheHive customfields first, then the corresponding variable we created earlier.
      pushCF(alert.customFields, "priority", priority);
      pushCF(alert.customFields, "category", category);
      pushCF(alert.customFields, "time-spent", timeSpent);
      pushCF(alert.customFields, "region", region);

      try {
        context.alert.create(alert);
      } catch (err) {
        print(`[ERROR] Failed to create alert for ${issue.key}`);
        print(`Error: ${err}`);
      }
      return;
    }

    // ---------- UPDATE ----------
    const alert = existing[0];
    if (!alert._id) {
      print(`[ERROR] No _id found for existing alert of ${issue.key}`);
      return;
    }

    const updatePayload = {
      description: description,
      customFields: []
    };

    //  Make maping between Jira & TheHive customFields here. TheHive customfields first, then the corresponding variable we created earlier.
    pushCF(updatePayload.customFields, "priority", priority);
    pushCF(updatePayload.customFields, "category", category);
    pushCF(updatePayload.customFields, "time-spent", timeSpent);
    pushCF(updatePayload.customFields, "region", region);

    try {
      context.alert.update(alert._id, updatePayload);
    } catch (err) {
      print(`[ERROR] context.alert.update failed for ${issue.key}`);
      print(`Error: ${err}`);
      return;
    }

    try {
      const newStatus = mapStatus(issue.fields?.status?.name);
      if (newStatus) context.alert.update(alert._id, { status: newStatus });
    } catch (err) {
      print(`[ERROR] during status update for ${issue.key}`);
      print(`Error: ${err}`);
    }

    print(`[END] Update done for ${issue.key}`);
  });
}

