# TheHive Case Templates

A repository dedicated to the sharing of TheHive case templates. Contributions are welcome !

## How to import a case template in TheHive

You must be logged with a user that has the `manageCaseTemplate` permission. 

Go into `Organization`(1) page and open the `Case templates`(2) tab. Click on `Import Case Template`(3) then provide the JSON file that contains the case template. 

![image](https://user-images.githubusercontent.com/32546144/222149895-f1c4827e-54c5-48f2-be64-40c095c67b86.png)


## How to share your case template 

> :warning: **Please consider the following points before sharing a case template**: 
> 
> - Don't include customFields in your case template. Currently TheHive will NOT import the case templates that include customFields not created BEFORE importing case template.
> - Ensure there are no sensitive information in the case template you will share.

Once your case template is ready to be shared, you need to export it as a JSON file.

In TheHive, go into the `Case templates` tab in `Organization`, and open the action menu of the case template. Use the `Export case template` action to download the template as a JSON file. 

Finally, open a pull request containing your case template as JSON file. Once reviewed and validated by StrangeBee crew, your case template will be published. Thanks for your contribution ! 
