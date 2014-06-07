'use strict';
/**
 * this.logger.debug (warn, info) is available on every service class in this file
 *
 * @constructor
 */

/**
 * set of date utils for iso 8601 parsing
 *
 * @constructor
 */
var DateUtils = function() {

    this.parseISO8601 = function(str) {
        // we assume str is a UTC date ending in 'Z'

        var parts = str.split('T'),
            dateParts = parts[0].split('-'),
            timeParts = parts[1].split('Z'),
            timeSubParts = timeParts[0].split(':'),
            timeSecParts = timeSubParts[2].split('.'),
            timeHours = Number(timeSubParts[0]),
            _date = new Date();

        _date.setUTCFullYear(Number(dateParts[0]));
        _date.setUTCMonth(Number(dateParts[1]) - 1);
        _date.setUTCDate(Number(dateParts[2]));
        _date.setUTCHours(Number(timeHours));
        _date.setUTCMinutes(Number(timeSubParts[1]));
        _date.setUTCSeconds(Number(timeSecParts[0]));
        if (timeSecParts[1]) _date.setUTCMilliseconds(Number(timeSecParts[1]));

        // by using setUTC methods the date has already been converted to local time(?)
        return _date;
    };
};

/**
 * used to manage dependencies of a service
 * @param logger - a logger to use (must implement debug method)
 * @param servicename - the service this require utils is used by
 * @constructor
 *
 */
var RequireUtils = function(logger, servicename) {

    this.logger = logger;
    this.servicename = servicename;

    if (this.servicename === undefined) {
        throw 'RequireUtils - servicename not defined!!!!';
    }

    if (this.logger === undefined) {
        throw 'RequireUtils - logger is undefined!!!';
    }

    /**
     * pass in a list of required object names, will check the dependencies map for those symbols
     *
     * @param requirements - an array of symbols that are required
     * @param dependencies - the map of symbols to definitions that have been passed in
     */
    this.checkDependencies = function(requirements, dependencies) {
        //console.log('checkDependencies', requirements, dependencies);
        for (var i = 0; i < requirements.length; i++) {
            if (requirements !== undefined && requirements.length > 0) {
                if (dependencies[requirements[i]] === undefined) {
                    this.logger.error('RequireUtils requirement: ' + requirements[i] + ' was not found in dependencies: ', dependencies);
                    alert(JSON.stringify(requirements[i]));
                    throw 'RequireUtils requirement: ' + requirements[i] + ' was not found in dependencies: ' + dependencies.toJSON;
                } else {
                    this.logger.debug(this.servicename + ', found requirement: ', requirements[i]);
                }
            }
        }
        this.logger.debug(this.servicename + ', dependencies resolved');
    };
};

/**
 * utility class to merge lists of requirements from super classes
 *
 * @type {{requirements: undefined, dependencies: undefined, baseMergeRequirements: Function, baseSetDependencies: Function}}
 */
var RequirementsBase = {

    requirements: undefined,
    dependencies: undefined,

    /**
     * merge the base requirements of this class with the extending class so that we have a master list of requirements
     *
     * @param baseRequirements - defined by the subclass
     * @param requirements - defined by the extending class
     */
    baseMergeRequirements: function(baseRequirements, requirements) {
        if (requirements !== undefined && requirements.length > 0) {
            this.requirements = _.union(baseRequirements, requirements);
        } else {
            this.requirements = baseRequirements;
        }

        //console.log('base req', this.baseRequirements, ' super req: ', requirements, 'req', this.requirements);
    },

    /**
     * copy all dependencies onto properties of the class (so that you don't have to access the dependeny map)
     * just reference this.<dependencyName>
     *
     * @param dependencies
     */
    baseSetDependencies: function(dependencies) {
        this.dependencies = dependencies;
        for (var prop in dependencies) {
            this[prop] = dependencies[prop]; //copy all dependencies to local vars....
        }
        //console.log('baseSetDependencies', this);
    }
};

/**
 * creates the service - creates either mock or real versions of a service
 *
 * @type {Object}
 */
var FactoryBase = _.extend({}, RequirementsBase, {
    /**
     * used as a tool in debugging
     */
    name: 'FACTORY',
    /**
     * the instance of the service created
     */
    service: undefined,
    /**
     * what is required by the factory in the dependency map in order to do it's job
     */
    baseRequirements: ['avLog', 'serviceName', 'mockDataImpl', 'realDataImpl', 'serviceImpl'],
    /**
     * if false, bind to the real impl (REST)
     * if true, return mocked data
     */
    mockMode: false,

    baseInitialize: function(dependencies, requirements) {
        this.logger = dependencies.avLog.getLogger(dependencies.serviceName);
        this.dependencyUtil = new RequireUtils(this.logger, dependencies.serviceName);
        this.baseSetDependencies(dependencies);
        this.baseMergeRequirements(this.baseRequirements, requirements);
        this.dependencyUtil.checkDependencies(this.requirements, this.dependencies);
    },

    /**
     * called to bootstrap the service and data impl
     * @returns {*}
     */
    create: function() {

        this.logger.debug('FACTORY initializing ' + this.serviceName);

        if (this.service === undefined) {

            var dataImpl;
            if (this.mockMode) {
                this.logger.debug('FACTORY ' + this.serviceName + ' in mock mode');
                dataImpl = this.mockDataImpl;
                dataImpl.initialize(this.dependencies);
            } else {
                this.logger.debug('FACTORY ' + this.serviceName + ' in real mode');
                dataImpl = this.realDataImpl;
                dataImpl.initialize(this.dependencies);
            }
            this.service = this.serviceImpl;
            this.dataImpl = dataImpl;
            this.dependencies.serviceRemote = dataImpl;

            this.service.initialize(this.dependencies);
        }
        return this.service;
    }

});

/**
 * the official API of the service
 * this class wraps the mock and real service impls - it will delegate to the correct configured mock or real impl
 * based on the factory config
 *
 * the mock or real data service can be fetched by this.serviceRemote
 *
 * @type {Object}
 */
var ServiceBase = _.extend({}, RequirementsBase, {

    /**
     * used in debugging
     */
    name: 'SERVICE',
    /**
     * the name of the service
     */
    serviceName: undefined,
    /**
     * the logger instance to use for logging
     */
    logger: undefined,
    /**
     * when the model changes, we will broadcast on the $rootScope to listeners so they can greedily update
     */
    eventChannel: undefined,
    $rootScope: undefined,
    serviceRemote: undefined,
    $resource: undefined,
    self: undefined,
    baseRequirements: ['avLog', 'serviceName', 'eventChannel', '$rootScope', 'serviceRemote', '$resource'],

    baseInitialize: function(dependencies, requirements) {
        //console.log('base initialize called', dependencies, requirements);
        this.logger = dependencies.avLog.getLogger(dependencies.serviceName);
        this.dependencyUtil = new RequireUtils(this.logger, dependencies.serviceName);
        this.baseSetDependencies(dependencies);
        this.baseMergeRequirements(this.baseRequirements, requirements);
        this.dependencyUtil.checkDependencies(this.requirements, this.dependencies);
        this.self = this;

        if (this.customInitialize) {
            this.logger.debug('running custom initialize');
            this.customInitialize(dependencies, requirements);
        }
    },

    /**
     * get all of a collection for a REST resource
     *
     * @param params - will be passed onto the REST call - note that $resource will bind named parameters to the url,
     * any extra parameaters will become search params and passed through
     * @returns {*}
     */
    getAll: function(params) {
        this.logger.debug(this.serviceName + ' SERVICE, get all from remote impl', params);

        this.collection = this.serviceRemote.getAll(params);

        //return the data
        this.logger.debug(this.serviceName + ' SERVICE, get all', this.collection);
        return this.collection;
    },

    /**
     * get a single instance of a REST resource
     * @param params
     * @returns {*}
     */
    get: function(params) {
        this.logger.debug(this.serviceName + ' SERVICE, get from remote impl ', params);
        this.instance = this.serviceRemote.get(params);
        return this.instance;
    },

    /**
     * save or update a resource
     * @param instance - the instance to save
     * @param params
     * @returns the instance
     *
     * NOTE: on save will broadcast a 'SERVICE.<eventChannelName>.SAVED' event
     * the default value of the eventChannelName is the service name in ALL CAPS
     */
    save: function(instance, params) {
        this.logger.debug(this.serviceName + ' SERVICE,  save ', instance);
        this.logger.debug(this.serviceName + ' SERVICE,  save params ', params);
        var result = this.serviceRemote.save(instance, params);
        this.$rootScope.$broadcast('SERVICE.' + this.eventChannel + '.SAVED', instance);
        return result;
    },

    /**
     * delete the instance of a REST resource
     * @param id - the id of the resource to delete
     *
     * NOTE: on delete will broadcast a 'SERVICE.eventChannelName>.DELETED' event
     * the default value of the eventChannelName is the service name in ALL CAPS
     */
    delete: function(id) {
        this.logger.debug(this.serviceName + ' SERVICE, delete ', id);
        this.serviceRemote.delete(id);
        this.$rootScope.$broadcast('SERVICE.' + this.eventChannel + '.DELETED', id);
    }

});

/**
 * the main mock service class - let's you define 'canned' data to pass back to the front end
 *
 * @type {Object}
 */
var MockServiceImplBase = _.extend({}, RequirementsBase, {
    name: 'MOCK',
    /**
     * the name of the service
     */
    serviceName: undefined,
    /**
     * the logger instance to use
     */
    logger: undefined,
    /**
     * mockData passed in that should be returned
     * TODO: make this an empty array by default (and push/delete) so that it works properly w/o a canned data array
     */
    mockData: undefined,
    baseRequirements: ['avLog', 'serviceName', 'mockData'],
    self: undefined,
    dependencies: {

    },

    baseInitialize: function(dependencies, requirements) {
        //console.log('base initialize called', dependencies, requirements);
        this.logger = dependencies.avLog.getLogger(dependencies.serviceName);
        this.dependencyUtil = new RequireUtils(this.logger, dependencies.serviceName);
        this.baseSetDependencies(dependencies);
        this.baseMergeRequirements(this.baseRequirements, requirements);

        this.dependencyUtil.checkDependencies(this.requirements, this.dependencies);

        this.self = this;

        if (this.customInitialize) {
            this.logger.debug('running custom initialize');
            this.customInitialize(dependencies, requirements);
        }
    },

    /**
     * will return all instances of the mock data filtering by any param passed in where
     * objectInstance.param === params[param]
     *
     * @param params
     * @returns {*}
     */
    getAll: function(params) {
        this.logger.debug(this.serviceName + ' MOCK, mock get all, length: ' + params.length, params);
        //console.log('get all called!!!', params);
        //AV: fixme: how to get the count of attributes on an object....
        if (params && Object.keys(params).length > 0 /*&& params.id !== '?'*/ ) {
            var dataToReturn = [];
            for (var mockItem in this.mockData) {
                for (var param in params) {
                    this.logger.debug(' MOCK get all filtering by param: ' + param + ' mockData param:' + this.mockData[param] + 'filter by: ' + params[param]);
                    //console.log('checking ', this.mockData[mockItem][param], 'for', params[param]);
                    if ('' + this.mockData[mockItem][param] + '' === '' + params[param] + '') {
                        //console.log('found!');
                        dataToReturn.push(this.mockData[mockItem]);
                        break;
                    }
                }
            }
            return dataToReturn;
        } else {
            return this.mockData;
        }
    },

    /**
     * will return the mock instance where params.id === objectInstance.id
     * @param params
     * @returns {*}
     */
    get: function(params) {
        this.logger.debug(this.serviceName + ' MOCK, mock get ', params.id);
        if (params.id !== undefined) {
            var index = this.findIndexInMock(params.id);
            return this.mockData[index];
        }
    },

    /**
     * will save a new instance to the mocked data (or update the instance if instance.id === mockDataItem.id)
     * @param instance
     * @param params
     *
     * NOTE: if the extending class defines an 'afterSave' method - it will be invoked after save
     */
    save: function(instance, params) {
        var index = this.findIndexInMock(instance.id);
        this.logger.debug(this.serviceName + ' MOCK, mock saving', [index, instance.id, 'params', params]);
        //go ahead and propagate the values....
        if (index < 0) {
            this.logger.debug(this.serviceName + ' MOCK, mock new for save!!!');
            index = this.mockData.length;
            instance.id = '' + index;
            this.mockData.push(instance);
        } else {
            this.mockData[index] = instance;
        }

        //call after save handler
        if (this.afterSave) {
            this.afterSave(index, instance);
        }

        return instance;
    },

    /**
     * deletes an item from the mocked data array
     * @param id
     */
    delete: function(id) {
        var index = this.findIndexInMock(id);
        this.logger.debug(this.serviceName + ' MOCK, mock delete ', index, id);
        this.mockData.splice(index, 1);
    },

    /**
     * helper util to find the object in the mock data by a given id
     * @param id
     * @returns {number}
     */
    findIndexInMock: function(id) {
        console.log('findIndexInMock', id, this.mockData);
        for (var i = 0; i < this.mockData.length; i++) {
            console.log('mock id ', this.mockData[i].id, id);
            if (this.mockData[i].id === id) {
                console.log('found at ', i, this.mockData[i]);
                return i;
            }
        }
        return -1;
    }
});


/**
 * the base service class - this is where all the real REST boilerplate code lives
 *
 * @type {Object}
 */
var DataServiceBase = _.extend({}, RequirementsBase, {
    name: 'REAL',
    /**
     * the url to use with angular $resource calls
     */
    resourceUrl: undefined,
    /**
     * the fully configured angular $resource
     */
    resource: undefined,
    /**
     * the name of this service
     */
    serviceName: undefined,

    logger: undefined,

    self: undefined,

    baseRequirements: ['avLog', 'serviceName', '$resource', 'resourceUrl', 'eventChannel'],

    baseInitialize: function(dependencies, requirements) {
        //console.log('base initialize called', dependencies, requirements);
        this.logger = dependencies.avLog.getLogger(dependencies.serviceName);
        this.dependencyUtil = new RequireUtils(this.logger, dependencies.serviceName);
        this.baseSetDependencies(dependencies);
        this.baseMergeRequirements(this.baseRequirements, requirements);

        this.dependencyUtil.checkDependencies(this.requirements, this.dependencies);


        //create the angular $resource
        this.resource = this.$resource(this.resourceUrl, null, {
            'update': {
                method: 'PUT'
            }
        });

        this.self = this;

        if (this.customInitialize) {
            this.logger.debug('running custom initialize');
            this.customInitialize(dependencies, requirements);
        }
    },

    /**
     * calls out to the remote to get all in a collection, if onGetAllSuccess is defined (function) will
     * invoke it after the call returns
     *
     * @param params
     * @returns {*}
     */
    getAll: function(params) {
        this.logger.debug(this.serviceName + ' REAL, get all called', params);

        var self = this;
        var collection = this.resource.query(params, function(value, responseHeaders) {
            self.logger.debug(self.serviceName + ' REAL, base getAll success callback: ', value);
            self.logger.debug(self.serviceName + ' REAL should call onGetAllSuccess?', self.onGetAllSuccess);
            if (self.onGetAllSuccess) {
                self.onGetAllSuccess(value, responseHeaders);
                self.$rootScope.$broadcast('SERVICE.' + self.eventChannel + '.UPDATED.ALL', value);
            }
        });
        this.logger.debug(this.serviceName + ' REAL, get all:', collection);
        return collection;
    },

    /**
     * get a single instance of a REST resource
     * NOTE: and id must be passed in
     *
     * if onGetSuccess is defined (function) will invoke on return from the REST call
     *
     * @param params
     * @returns {*}
     */
    get: function(params) {
        this.logger.debug(this.serviceName + ' REAL, get from remote', params);
        if (params === undefined || params.id === undefined) {
            this.logger.debug(this.serviceName + ' REAL, get id was null, no-op');
            return;
        }

        var self = this;
        this.single = this.resource.get(params, function(value, responseHeaders) {
            self.logger.debug(' REAL success: ' + value);
            self.logger.debug(' REAL should call onGetSuccess?', self.onGetSuccess);
            if (self.onGetSuccess) {
                self.onGetSuccess(value, responseHeaders);
                self.$rootScope.$broadcast('SERVICE.' + self.eventChannel + '.GET.SUCCESS', value);
            }
        });

        this.logger.debug(' REAL, get got instance', this.single);
        return this.single;
    },

    /**
     * saves the REST instace - will apply values in teh param map to the object before save
     * if id is undefined - a POST will be called to create the resource
     * if id is defined - a PUT will be called to update the resource
     *
     * @param instance
     * @param params
     */
    save: function(instance, params) {
        this.logger.debug(this.serviceName + ' REAL, doing save', instance);
        this.logger.debug(this.serviceName + ' REAL, doing save params ', params);
        var response;

        console.log('REAL, doing save', params);

        //apply the params to the object before update
        for (var param in params) {
            this.logger.debug(' REAL save param: ' + param, params[param]);
            instance[param] = params[param];
        }
        this.logger.debug(this.serviceName + ' REAL, after applied params ', instance);


        //check whether to do a PUT or POST
        //console.log(' REAL save, instance id: ', instance.id);
        if (instance.id === undefined) {
            console.log('REAL, doing POST (create)', instance);
            this.logger.debug(this.serviceName + ' REAL, doing POST (create)', instance);
            response = this.resource.save(instance);
            console.log('REAL, response ', response);
        } else {
            this.logger.debug(this.serviceName + ' REAL, doing PUT (update)', instance);
            response = this.resource.update({
                id: instance.id
            }, instance);
        }
        this.logger.debug(this.serviceName + ' REAL, save response from server: ', response);
        return response;
    },

    /**
     * deletes a REST resource by id
     * @param id
     */
    delete: function(id) {
        this.logger.debug(this.serviceName + ' REAL, delete', id);
        var response = this.resource.delete({
            id: id
        });
        return response;
    }
});

/**
 * holds the whole service instance, factory and know how to bootstrap it all
 * takes a ServiceContainerConfig on construction which will propagate to all the service parts
 *
 * @type {{service: undefined, serviceFactory: undefined, mockImpl: undefined, realImpl: undefined, initialize: Function, create: Function}}
 */
var ServiceContainer = {

    service: undefined,
    serviceFactory: undefined,
    mockImpl: undefined,
    realImpl: undefined,

    initialize: function(serviceContainerConfig) {

        //create the mock service impl
        this.mockImpl = _.extend({}, MockServiceImplBase, {

            mockData: serviceContainerConfig.mockData,

            initialize: function(dependencies) {
                //console.log('mock initialize called', dependencies, this.mockData);
                var requirements = serviceContainerConfig.serviceRequirements;
                dependencies.serviceName = serviceContainerConfig.serviceName;
                dependencies.mockData = this.mockData;
                this.baseInitialize(dependencies, requirements);
            }

        }, serviceContainerConfig.mockExtend);
        serviceContainerConfig.mockDataImpl = this.mockImpl;

        //create the real service impl
        this.realImpl = _.extend({}, DataServiceBase, {
            initialize: function(dependencies) {
                dependencies.resourceUrl = serviceContainerConfig.resourceUrl;
                dependencies.serviceName = serviceContainerConfig.serviceName;
                this.baseInitialize(dependencies, {});
            }
        }, serviceContainerConfig.realExtend);
        serviceContainerConfig.realDataImpl = this.realImpl;

        // create the service that wraps the mock or real impl
        this.service = _.extend({}, ServiceBase, {

            dateUtils: new DateUtils(),

            initialize: function(dependencies) {
                //console.log('initialize called', dependencies);
                var requirements = serviceContainerConfig.serviceRequirements;
                dependencies.serviceName = serviceContainerConfig.serviceName;
                this.baseInitialize(dependencies, requirements);
            }
        }, serviceContainerConfig.serviceExtend);
        serviceContainerConfig.serviceImpl = this.service;

        // the factory that creates everything
        this.serviceFactory = _.extend({}, FactoryBase, {
            initialize: function(dependencies) {
                dependencies.serviceName = serviceContainerConfig.serviceName;
                this.baseInitialize(dependencies, {});
            }
        }, serviceContainerConfig.factoryExtend);
        serviceContainerConfig.serviceFactory = this.serviceFactory;

        this.serviceFactory.initialize(serviceContainerConfig);
        return this;
    },

    /**
     * invoke the factory to create an angular service instance
     * @returns the service instance ready for use by angular
     */
    create: function() {
        return this.serviceFactory.create();
    }

};

/**
 * configuration object to pass into the ServiceContainer object
 * @param serviceName [required] - the name of this service instance
 * @param resourceUrl [required] - the REST url ($resource) to use to fetch/update/delete a remote resource
 * @param mockData [required] - an array of data to be returned in mock mode for quick UI development
 * @param $rootScope [required] - angular $rootscope in order to broadcast events
 * @param $resource  [required] - this library uses $resource for making REST calls
 * @param avLog [required] - the chosen logging library
 *
 * optional attributes:
 * eventChannel - default value: serviceName.toUpperCase() - clients can listing on rootScope for events in the form of
 *   SERVICE.<eventChannel>.<eventType> - see individual methods for event types
 * mockMode - default false - means that by defaul the service will work in REST mode, setting this to true will switch
 *   the service into mock mode returning the mockedData (and allowing for fast UI development)
 * serviceExtend - a js object - define extra functions here that you wish the service to provide (uses underscore extend
 *   to graft the functionality on the js instance object)
 * mockExtend - a js object - define extra functions here that are provided by the mock implementation of the service
 * realExtend - a js object - define extra functions here that are provided by the real implementation (REST) service
 * factoryExtend - a js object - define extra functions here that are provided by the factory
 *
 * NOTE: anything set on this object will be available to all classes under the this pointer!!
 *
 * @constructor
 /* jshint ignore:start */
var ServiceContainerConfig = function(serviceName, resourceUrl, mockData, $rootScope, $resource, avLog) { // jhint ignore:line

    this.serviceName = serviceName;
    this.resourceUrl = resourceUrl;
    this.mockData = mockData;
    this.$rootScope = $rootScope;
    this.$resource = $resource;
    this.avLog = avLog;
    this.serviceRequirements = ['avLog'];
    this.eventChannel = serviceName.toUpperCase();
    this.mockMode = false;
    this.serviceExtend = {};
    this.mockExtend = {};
    this.realExtend = {};
    this.factoryExtend = {};

    /**
     * main entry point - creates the service and returns it for use
     * @returns {*}
     */
    this.createService = function() {
        //create an instance of the service container
        var serviceContainer = _.extend({}, ServiceContainer, {});
        //initialize it and create the service
        return serviceContainer.initialize(this).create();
    };
};
/* jshint ignore:end */
ServiceContainerConfig.jsHint = 'ignore me';
