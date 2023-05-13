# Anax NodeJS toolkit for application deployment and workload placement  

The goal is to simplify and to reduce the amount of manual steps in creating and updating configurations and other system files.  

We have created templates in /templates directories to help automate the deployment process by extracting all the hardcoded values and needed envirnoment variables in the .env-local.json file which should not be checked into Github.  These ```templates/anax.json, templates/horizon, templates/hzn.json, dockerfile-template``` files use tokenized placeholders and are to be used to generate needed configuration files.  The output files for each environment are placed in ```dist ``` folder 

With .env-local.json in place, we now can manage as many environments as needed by providing the needed values in .env-local.json.  Please see env-template.json for example.

# Available commands
```
action  Available actions: adbPush adbPushDreamAgent buildImage ibmLogin
        makeAll makeAnaxJson makeDeploy makeDirectories makeDockerFile
        makeDreamAgentYaml makeHorizon makeNodePolicy makeSystemFiles
        pushImage  
```  

# Examples
```
oha deploy -h
oha deploy makeAll --org=samsung
oha deploy ibmLogin   
```
