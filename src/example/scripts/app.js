var myApp = angular.module('myApp', ['avaughan.logging', 'ngResource']);

/**
 * configure the logging infrastructure
 */
myApp.config(function(avLogProvider, avLevel) {

    //configure logging
    var myLogConfig = {
        //set a default log level - this will be used if someone logs under a category that is not defined below
        loglevel: avLevel.INFO, //TRACE, DEBUG, INFO, WARN, ERROR
        //these are the configured channels for logging - each channel can have it's own threshold
        //only log statements above the threshould will be output to the underlying $log
        category: {
            testController: avLevel.DEBUG, //all logging from the 'testController' controller will only be logged if .warn or above
            nameServiceMock: avLevel.DEBUG,
            nameServiceReal: avLevel.DEBUG
        }
    };
    console.log('provider', avLogProvider);
    avLogProvider.$get[1]().setConfig(myLogConfig);
});
