// Name: Assign to me
// Type: Action:Case
// Desc: This function changes the assignee of the Case and all the associated tasks to the user who launches the function.
// Param: 
// - input param is the json value that is passed when calling the function. Here it is the alert object where the function is executed.
// - context param is an object used to interact with TheHiveAPI
function handle(input, context) {
    
    // Query to get the tasks of the case
    const query = [
        {
            "_name": "getCase",
            "idOrName": input._id
        },
        {
            "_name": "tasks"
        },
    ];
    
    // get the tasks
    const taskList = context.query.execute(query);
    
    // change the tasks assignee
    taskList.map((task) => {
        context.task.update(task._id, { assignee: context.userId })
    });
    
    // change the case assignee
    context.caze.update(input._id, { assignee: context.userId });
}