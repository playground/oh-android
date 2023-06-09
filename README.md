# Anax NodeJS toolkit for application deployment and workload placement on Android devices 

The goal is to simplify and to reduce the amount of manual steps in creating and updating configurations and other system files.  

We have created templates in /templates directories to help automate the deployment process by extracting all the hardcoded values and needed envirnoment variables into this /hzn-config/.env-local.json file which should not be checked into Github.  If for some reason /hzn-config/.env-local.json did not get created, you can create copying env-template.json and fill in the appropriate values.  

These ```templates/anax.json, templates/horizon, templates/hzn.json, dockerfile-template``` files use tokenized placeholders and are to be used to generate needed configuration files at run-time.  The output files for each environment are placed in ```dist ``` folder 

With .env-local.json in place, we now can manage as many environments as needed by providing the needed values in .env-local.json.  Please see env-template.json for example.

# Install oh-android
```
npm install -g oh-android
```

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

# Notes
Typically, the following command is usually what you need to run to generate the config files and push application.yaml to the phone --org=<HZN-DEVICE-ID> if all the needed values are provided in /hzn-config/.env-local.json file for a particular device.  I know, --org is a misnomer, I really should change it to --device.

```
oha deploy makeDeploy --org=samsung-R3CT307YNNW
```