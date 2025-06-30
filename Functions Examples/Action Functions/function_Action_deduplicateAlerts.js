/**
    name: "deduplicate",
    mode: "Enabled",
    description: "Detects duplicate alerts by comparing the alert title and all observables. If all match, the alert is automatically closed as a duplicate.",
    types: "action:alert","notification"
 */

async function handle(input, context) {
    console.log("🔹 Starting alert duplicate detection function...");

    // Define alert title patterns to exclude from deduplication
    // Add any strings here that, if found in the alert title, should prevent deduplication
    const EXCLUDED_TITLE_PATTERNS = [
        "User requested to release a quarantined message"
        // Add more patterns as needed
    ];

    const now = new Date();
    console.log(`🕒 Current time: ${now.toISOString()}`);

    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    console.log(`🔍 Checking for alerts created since: ${twelveHoursAgo.toISOString()}`);

    // Get the objectId to fetch the new alert details
    const newAlertId = input.objectId;
    if (!newAlertId) {
        console.error("❌ Error: No objectId found in input.");
        return;
    }

    console.log(`📌 Fetching details for new alert with ID: ${newAlertId}`);

    // Fetch the new alert details
    const newAlert = await context.alert.get(newAlertId);
    if (!newAlert) {
        console.error(`❌ Error: No alert found with ID ${newAlertId}`);
        return;
    }

    // Ensure title is always a string before using .toLowerCase()
    const newTitle = newAlert.title ? String(newAlert.title).toLowerCase() : "";
    console.log(`📌 New Alert Title: ${newTitle}`);

    // Check if the alert title contains any excluded patterns
    const shouldExclude = EXCLUDED_TITLE_PATTERNS.some(pattern => 
        newTitle.includes(pattern.toLowerCase())
    );

    if (shouldExclude) {
        console.log(`⚠️ Alert title contains excluded pattern. Skipping deduplication for: "${newAlert.title}"`);
        return;
    }

    // Query observables for the new alert
    console.log(`🔎 Querying observables for new alert ID: ${newAlertId}`);
    const newObservablesQuery = await context.query.execute([
        { "_name": "getAlert", "idOrName": newAlertId },
        { "_name": "observables" },
        { "_name": "page", "from": 0, "to": 15 }
    ]);

    // Extract only the "data" field from observables
    const newObservables = (newObservablesQuery && Array.isArray(newObservablesQuery))
        ? newObservablesQuery.map(o => o.data) // Extract only the "data" field
        : [];

    console.log(`📌 New Alert has ${newObservables.length} observables.`);
    console.log(`🔍 New Alert Observables: ${JSON.stringify(newObservables, null, 2)}`);

    // Fetch existing alerts from the last 12 hours
    const filters = [
        {
            _name: "filter",
            _and: [
                { _or: [{ _field: "status", _value: "New" }, { _field: "status", _value: "InProgress" }] },
                { _gte: { _field: "_createdAt", _value: twelveHoursAgo.getTime() } }
            ]
        }
    ];

    console.log("🔎 Querying existing alerts...");
    const existingAlerts = await context.alert.find(filters);
    console.log(`📌 Found ${existingAlerts.length} existing alerts in the last 12 hours.`);

    if (existingAlerts.length === 0) {
        console.log("✅ No existing alerts to compare. New alert remains open.");
        return;
    }

    for (const alert of existingAlerts) {
        console.log(`🔍 Checking against existing alert: ${alert._id}`);

        // Query observables for the existing alert
        console.log(`🔎 Querying observables for existing alert ID: ${alert._id}`);
        const existingObservablesQuery = await context.query.execute([
            { "_name": "getAlert", "idOrName": alert._id },
            { "_name": "observables" },
            { "_name": "page", "from": 0, "to": 15 }
        ]);

        // Extract only the "data" field from observables
        const existingObservables = (existingObservablesQuery && Array.isArray(existingObservablesQuery))
            ? existingObservablesQuery.map(o => o.data) // Extract only the "data" field
            : [];

        console.log(`📌 Existing Alert (ID: ${alert._id}) has ${existingObservables.length} observables.`);
        console.log(`🔍 Existing Alert Observables: ${JSON.stringify(existingObservables, null, 2)}`);

        // Ensure title is always a string before using .toLowerCase()
        const existingTitle = alert.title ? String(alert.title).toLowerCase() : "";
        const existingAlertId = alert._id || "UNKNOWN_ID";

        // Ensure we're not comparing the alert to itself
        if (newAlertId === existingAlertId) {
            console.log("⏭️ Skipping comparison: Alert is the same.");
            continue;
        }

        // Check if the title matches
        const titleMatch = newTitle === existingTitle;
        console.log(`🔍 Title Match: ${titleMatch}`);

        // Check if any observables overlap
        const observablesMatch = newObservables.length > 0 && existingObservables.some(o => newObservables.includes(o));
        console.log(`🔍 Observables Match: ${observablesMatch}`);

        if (titleMatch && observablesMatch) {
            console.log(`🚨 Duplicate alert detected! Closing new alert: ${newAlertId}`);
            
            // Close the new alert as a duplicate
            await context.alert.update(newAlertId, { 
                status: "Duplicate", 
                resolution: "Duplicate alert. Title & Observables match an already open alert."
            });

            console.log(`✅ Alert ${newAlertId} marked as Duplicate.`);
            return;
        }
    }

    console.log("✅ No duplicate found. New alert remains open.");
}