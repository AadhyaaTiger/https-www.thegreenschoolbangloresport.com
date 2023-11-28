(function (global) {
    var modules = {};
    window.loadedExternals = {};

    function getExternals() {
        var url = commonProps['externalsUrl'];
        if (commonProps['server.for.resources']) {
            // url = url.replace('externals.min.js', 'externals.js');
        }
        return new Promise(function (resolve) {
            if (window.loadedExternals[url]) {
                resolve(window.loadedExternals[url]);
            } else {
                getScript(url, function onExternalScript(result) {
                    window.loadedExternals[url] = result || true;
                    resolve(result);
                });
            }
        });
    }

    function getScript(url, callback) {
        $.ajax({
            url: url,
            success: callback,
            error: function (xhr, status, error) {
                console.error('loading script ' + url + ' failed.', error);
            },
            type: 'GET',
            dataType: 'script',
            cache: true,
        });
    }

    function getModuleProductionPath(moduleName, options) {
        options = options || {};
        var serverForResources = options.serverForResources;
        var serverName = '';
        if (typeof serverForResources === 'string') {
            serverName = serverForResources;
        } else if (serverForResources === true) {
            serverName = commonProps['server.for.resources'] || '';
        }

        if (serverName === '') {
            // if we don't have a server name, point to my-test-master
            serverName = commonProps['common.resources.folder'];
        }
        var folderName = options.folderName || moduleName;
        return (
            serverName +
            '/editor/apps/modules/' +
            folderName +
            '/' +
            moduleName +
            '.js'
        );
    }

    function requireAsPromise(moduleName) {
        return new Promise(function (resolve, reject) {
            require([moduleName], function resolveModule(module) {
                resolve(module);
            }, function onError(err) {
                reject(err);
            });
        });
    }

    function getModuleAsync(moduleName, options) {
        options = options || {};
        return new Promise(function loadModule(resolve, reject) {
            if (getModuleFromCache(moduleName)) {
                resolve(getModuleFromCache(moduleName));
            } else if (window['hot-reload-' + moduleName]) {
                // hot reloaded - use global variable
                var globalModuleName = options.globalName || moduleName;
                var module = window[globalModuleName];
                modules[moduleName] = module;
                resolve(module);
            } else {
                // require it using AMD
                getExternals().then(function onExternalScriptPromise(result) {
                    var serverForResources =
                        commonProps['server.for.resources'];
                    var clientModulesFallback =
                        commonProps['client.modules.fallback'];
                    var requireModuleName =
                        options.requireName ||
                        getModuleProductionPath(moduleName, {
                            serverForResources: serverForResources,
                            folderName: options.folderName,
                        });
                    if (
                        window.isMobileDevice &&
                        !window.define &&
                        !!window._define
                    ) {
                        // restore temporarily hidden global define()
                        // See jira: FAST-3443
                        window.define = window._define;
                    }
                    requireAsPromise(requireModuleName)
                        .catch(function onFirstRequireFail(err) {
                            if (
                                !serverForResources ||
                                !err ||
                                err.requireType !== 'scripterror'
                            ) {
                                return Promise.reject(err);
                            } else {
                                console.error(
                                    'Unable to fetch module: ' +
                                        moduleName +
                                        ', retrying from relative'
                                );
                                var requireModuleNameClean =
                                    options.requireName ||
                                    getModuleProductionPath(moduleName, {
                                        folderName: options.folderName,
                                    });
                                return requireAsPromise(requireModuleNameClean);
                            }
                        })
                        .catch(function onSecondRequireFail(err) {
                            if (
                                !clientModulesFallback ||
                                !err ||
                                err.requireType !== 'scripterror'
                            ) {
                                return Promise.reject(err);
                            }
                            console.error(
                                'Unable to fetch module: ' +
                                    moduleName +
                                    ', retrying from master'
                            );
                            var requireModuleNameMaster =
                                options.requireName ||
                                getModuleProductionPath(moduleName, {
                                    serverForResources: clientModulesFallback,
                                    folderName: options.folderName,
                                });
                            return requireAsPromise(requireModuleNameMaster);
                        })
                        .then(function onModuleResolve(module) {
                            setModuleInCache(moduleName, module);
                            resolve(module);
                        })
                        .catch(function onFetchModuleFail(err) {
                            if (err && err.requireType === 'scripterror') {
                                console.error(
                                    'Unable to fetch module: ' + moduleName
                                );
                            }
                            reject(err);
                        });
                });
            }
        }).catch(function (err) {
            console.error('Error in loading ' + moduleName);
            console.error(err);
            return {};
        });
    }

    function getModuleSync(moduleName) {
        return getModuleFromCache(moduleName);
    }

    function setModule(moduleName, module) {
        return setModuleInCache(moduleName, module);
    }

    /* Private functions  */

    function setModuleInCache(moduleName, module) {
        modules[moduleName] = module;
    }

    function getModuleFromCache(moduleName) {
        return modules[moduleName];
    }

    (function _init() {
        var loadedModules = window.loadedModules;
        if (loadedModules) {
            Object.keys(loadedModules).forEach(function (loadedModuleName) {
                setModuleInCache(
                    loadedModuleName,
                    loadedModules[loadedModuleName]
                );
            });
        }
    })();

    global.$.modulesManager = {
        getModuleAsync: getModuleAsync,
        getModuleSync: getModuleSync,
        setModule: setModule,
    };
})(window);