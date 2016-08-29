'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

window.app = angular.module('Newman', ['NewmanPreBuilt', 'ui.router', 'ui.bootstrap', 'ngAnimate', 'ngMaterial', 'ngMessages', 'md.data.table', 'ngDraggable', 'ui.ace']);

app.config(function ($urlRouterProvider, $locationProvider, $mdThemingProvider) {

    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    //$locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    // $urlRouterProvider.otherwise('/');
    // Trigger page refresh when accessing an OAuth route
    $urlRouterProvider.when('/auth/:provider', function () {
        window.location.reload();
    });

    var customPrimary = {
        '50': '#e4ebf1',
        '100': '#d3dfe8',
        '200': '#c2d3df',
        '300': '#b1c7d6',
        '400': '#a1bbce',
        '500': '#90AFC5',
        '600': '#7fa3bc',
        '700': '#6e97b3',
        '800': '#5e8bab',
        '900': '#527e9d',
        'A100': '#C2C2C2',
        'A200': '#ffffff',
        'A400': '#ffffff',
        'A700': '#49708c'
    };
    $mdThemingProvider.definePalette('customPrimary', customPrimary);

    var customAccent = {
        '50': '#32924a',
        '100': '#38a554',
        '200': '#3fb85e',
        '300': '#4ec36b',
        '400': '#61c97b',
        '500': '#74cf8b',
        '600': '#9adcab',
        '700': '#ade3bb',
        '800': '#c0e9cb',
        '900': '#d3f0da',
        'A100': '#9adcab',
        'A200': '87D69B',
        'A400': '#74cf8b',
        'A700': '#e6f6ea'
    };
    $mdThemingProvider.definePalette('customAccent', customAccent);

    var customWarn = {
        '50': '#ffe5e5',
        '100': '#ffcccc',
        '200': '#ffb3b3',
        '300': '#ff9999',
        '400': '#ff8080',
        '500': '#ff6666',
        '600': '#ff4c4c',
        '700': '#ff3333',
        '800': '#ff1919',
        '900': '#ff0000',
        'A100': '#ffffff',
        'A200': '#ffffff',
        'A400': '#ffffff',
        'A700': '#e50000'
    };
    $mdThemingProvider.definePalette('customWarn', customWarn);

    var customBackground = {
        '50': '#ffffff',
        '100': '#ffffff',
        '200': '#ffffff',
        '300': '#ffffff',
        '400': '#ffffff',
        '500': '#FFFFFF',
        '600': '#f2f2f2',
        '700': '#e6e6e6',
        '800': '#d9d9d9',
        '900': '#cccccc',
        'A100': '#ffffff',
        'A200': '#ffffff',
        'A400': '#ffffff',
        'A700': '#bfbfbf'
    };
    $mdThemingProvider.definePalette('customBackground', customBackground);

    $mdThemingProvider.theme('default').primaryPalette('customPrimary', {
        'default': '500',
        'hue-1': '50',
        'hue-2': '200',
        'hue-3': 'A100'
    }).accentPalette('customAccent').warnPalette('customWarn').backgroundPalette('customBackground');
});

app.config(function ($sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist(['**']);
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state, $location) {
    $rootScope.assetsPath = process.cwd() + '/assets';

    AuthService.getLoggedInUser().then(function (user) {
        $rootScope.user = user;
    });

    if (!$rootScope.user) $state.go('login');

    // The given state requires an authenticated user.
    var destinationStateRequiresAuth = function destinationStateRequiresAuth(state) {
        return state.data && state.data.authenticate;
    };

    // var d3 = require('path/to/d3.js');

    // $stateChangeStart is an event fired
    // whenever the process of changing a state begins.
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
        if (!destinationStateRequiresAuth(toState)) {
            // The destination state does not require authentication
            // Short circuit with return.
            return;
        }

        if (AuthService.isAuthenticated()) {
            // The user is authenticated.
            // Short circuit with return.
            return;
        }

        // Cancel navigating to new state.
        event.preventDefault();

        AuthService.getLoggedInUser().then(function (user) {
            // If a user is retrieved, then renavigate to the destination
            // (the second time, AuthService.isAuthenticated() will work)
            // otherwise, if no user is logged in, go to "login" state.
            if (user) {
                $rootScope.user = user;
                $rootScope.userId = user._id;
                $state.go(toState.name, toParams);
            } else {
                $state.go('login');
            }
        });
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('allTests', {
        url: '/allTests',
        templateUrl: './assets/templates/allTests.html',
        controller: 'allTestsCtrl',
        resolve: {
            allTests: function allTests($http, $stateParams, AuthService) {
                return AuthService.getLoggedInUser().then(function (user) {
                    var currentDate = new Date();
                    var time = currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();
                    return $http.get('https://warm-lowlands-63755.herokuapp.com/api/tests?userId=' + user._id);
                }).then(function (response) {
                    return response.data;
                });
            }
        }
    });
});

// app.controller('allTestsCtrl',function($scope, allTests) {
//     $scope.allTests = allTests;
// });


app.controller('allTestsCtrl', function ($log, $mdEditDialog, $mdDialog, $q, $state, $scope, $timeout, allTests, TestBuilderFactory, AuthService, $http) {
    //allTests injected here
    'use strict';

    $scope.selected = [];
    $scope.limitOptions = [5, 10, 15, 50];

    $scope.options = {
        rowSelection: true,
        multiSelect: true,
        autoSelect: true,
        decapitate: false,
        largeEditDialog: false,
        boundaryLinks: false,
        limitSelect: true,
        pageSelect: true
    };

    $scope.query = {
        order: 'name',
        limit: 50,
        page: 1
    };

    $scope.tests = allTests;
    $scope.getTests = function () {
        TestBuilderFactory.allTests().then(function (data) {
            $scope.tests = data;
            $scope.$evalAsync();
        });
    };

    $scope.toggleLimitOptions = function () {
        $scope.limitOptions = $scope.limitOptions ? undefined : [5, 10, 15];
    };

    $scope.loadStuff = function () {
        $scope.promise = $timeout(function () {
            // loading
        }, 2000);
    };

    $scope.deletetests = function () {
        var deletePromises = $scope.selected.map(function (test) {
            return TestBuilderFactory.delete(test);
        });
        return Promise.all(deletePromises).then(function (val) {
            $scope.getTests();
        });
    };

    $scope.showConfirm = function (ev) {
        // Appending dialog to document.body to cover sidenav in docs app
        var confirm = $mdDialog.confirm().title("Confirm Deletion").ariaLabel('Delete').targetEvent(ev).ok('Delete').cancel('Cancel');
        $mdDialog.show(confirm).then(function () {
            $scope.deletetests().then(function () {
                $scope.tests = $scope.tests.filter(function (ele) {
                    return $scope.selected.indexOf(ele) === -1;
                });
                $scope.selected = [];
                $scope.$evalAsync();
            });
        }, function () {
            $scope.status = 'Delete cancelled';
        });
    };
});

'use strict';

app.config(function ($stateProvider) {
    $stateProvider.state('testeditor', {
        url: '/editTest/:testId',
        templateUrl: './assets/templates/editTest.html',
        controller: 'TestEditorCtrl',
        resolve: {
            test: function test($http, $stateParams) {
                return $http.get('https://warm-lowlands-63755.herokuapp.com/api/tests/' + $stateParams.testId).then(function (res) {
                    return res.data;
                }).then(function (test) {
                    test.validators = JSON.parse(test.validators);
                    if (typeof test.validators === 'string') {
                        test.validators = JSON.parse(test.validators);
                    }
                    return test;
                });
            }
        }
    });
});

app.controller('TestEditorCtrl', function ($scope, test, TestBuilderFactory, $rootScope, $state, $log, TestFactory, $mdDialog, $mdMedia) {

    $scope.test = test;

    TestFactory.getStackTests(test).then(function (stackTests) {
        return $scope.stackTests = stackTests;
    }).catch($log.error);

    if (typeof $scope.test.body.data === 'string') $scope.test.body.data = JSON.parse($scope.test.body.data);
    $scope.test.user = $rootScope.user;
    $scope.showParams = false;
    $scope.showHeaders = false;
    $scope.showBody = false;
    $scope.showValidators = false;
    $scope.numParams = 0;
    $scope.numHeaders = 0;
    $scope.numBodyObj = 0;
    $scope.addForm = function (index, type) {
        if (type === 'validator') $scope.test.validators.push({ name: $scope.test.name + (Number($scope.test.validators.length) + 1).toString(), func: "(function(response) {\n\n});" });else if (index === $scope.test[type].length - 1 || $scope.test[type].length === 0 || index === $scope.test[type].data.length - 1 || $scope.test[type].data.length === 0) {
            if (type === "params") {
                $scope.numParams++;
                $scope.test.params.push({});
            } else if (type === "headers") {
                $scope.numHeaders++;
                $scope.test.headers.push({});
            } else if (type === "body") {
                $scope.numBodyObj++;
                $scope.test.body.data.push({});
            }
        }

        $scope.$evalAsync();
    };

    $scope.showForm = function () {
        if ($scope.test.params.length === 0) {
            $scope.addForm(0, "params");
            $scope.numParams++;
        }
        $scope.showParams = !$scope.showParams;
    };

    $scope.displayHeaders = function () {
        if ($scope.test.headers.length === 0) {
            $scope.addForm(0, "headers");
            $scope.numHeaders++;
        }
        $scope.showHeaders = !$scope.showHeaders;
    };

    $scope.displayBody = function () {
        if ($scope.test.body.data.length === 0) {
            $scope.addForm(0, "body");
            $scope.numBodyObj++;
        }
        $scope.showBody = !$scope.showBody;
    };

    $scope.displayValidators = function () {
        if ($scope.test.validators.length === 0) {
            $scope.addForm(0, "validator");
        }
        $scope.showValidators = !$scope.showValidators;
    };

    $scope.composeURL = function () {
        var indexQuestionMark = $scope.test.url.indexOf('?');
        if (indexQuestionMark !== -1) {
            $scope.test.url = $scope.test.url.substring(0, indexQuestionMark);
        }
        $scope.test.url += '?';
        var finalString = '';
        for (var i = 0; i < $scope.test.params.length - 1; i++) {
            finalString = finalString + $scope.test.params[i].key + '=' + $scope.test.params[i].value + '&';
        }
        $scope.test.url = $scope.test.url + finalString;
        $scope.test.url = $scope.test.url.slice(0, $scope.test.url.length - 1);
    };

    $scope.setToggle = function () {
        $scope.toggle = !$scope.toggle;
        $scope.$evalAsync();
    };

    $scope.intermediary = function () {
        $scope.setToggle();
        window.setTimeout($scope.saveTest, 800);
    };

    $scope.saveTest = function () {
        var currentDate = new Date();
        var time = currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();
        TestBuilderFactory.edit($scope.test).then(function () {
            currentDate = new Date();
            var time = currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();
            $state.go('allTests');
        }).catch($log.error);
    };

    $scope.viewPreviousResults = function (test) {
        if (!test.result) {
            alert("NO RESULT TO SHOW");
        } else {
            TestFactory.getPreviousResults(test).then(function (result) {
                $scope.results = result;
                $scope.showResults(test);
            }).catch($log.error);
        }
    };

    $scope.showResults = function (test) {
        $mdDialog.test = test;
        $mdDialog.results = $scope.results;
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
        $mdDialog.show({
            controller: DialogController,
            templateUrl: './assets/templates/testResults.html',
            parent: angular.element(document.body),
            //targetEvent: ev,
            clickOutsideToClose: true,
            fullscreen: useFullScreen
        });
    };

    $scope.runTest = function () {

        //Populate the responsePool with results from earlier tests, if required
        TestFactory.clearResponsePool();
        $scope.stackTests.forEach(function (test) {
            var data = {
                name: test.name,
                response: JSON.parse(test.response)
            };
            TestFactory.addToResponsePool(data);
        });

        var funcArray = [];
        var cancelTest = false;
        $scope.results = {
            validatorResults: [],
            lastRun: Date.now()
        };
        if (typeof $scope.test.validators === 'string') $scope.test.validators = JSON.parse($scope.test.validators);
        $scope.test.validators.forEach(function (elem) {
            try {
                if (elem.func.length > 26) {
                    funcArray.push(eval(elem.func));
                }
            } catch (err) {
                alert('There was an error parsing the ' + elem.name + ' validator function. Refactor that function and try again.');
                cancelTest = true;
            }
        });
        if (cancelTest) return;

        TestFactory.runTest($scope.test).then(function (resData) {

            $scope.test.response = JSON.stringify(resData);

            for (var i = 0; i < funcArray.length; i++) {
                try {
                    $scope.results.validatorResults.push(!!funcArray[i](resData));
                } catch (err) {
                    alert('The following error occured while running the ' + $scope.test.validators[i].name + ' validator function: ' + err.message + '. Refactor that function and try again.');
                    return;
                }
            }
            if ($scope.results.validatorResults.length) $scope.results.finalResult = $scope.results.validatorResults.every(function (validatorResult) {
                return validatorResult;
            });
            return TestFactory.saveResults($scope.results, $scope.test);
        }).then(function (test) {
            $scope.test.result = test.result._id;
            $scope.showResults(test);
        }).catch($log.error);
    };

    function DialogController($scope, $mdDialog) {
        $scope.test = $mdDialog.test;
        if (typeof $scope.test.validators === 'string') {
            $scope.test.validators = JSON.parse($scope.test.validators);
        }
        $scope.results = $mdDialog.results;
        $scope.hide = function () {
            $mdDialog.hide();
        };
        $scope.cancel = function () {
            $mdDialog.cancel();
        };
        $scope.answer = function (answer) {
            $mdDialog.hide(answer);
        };
    }
});

app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/home', //TEST :id and trailing slash
        templateUrl: './assets/templates/home.html',
        controller: 'homeCtrl',
        resolve: {
            user: function user(AuthService) {
                return AuthService.getLoggedInUser();
            },
            stacks: function stacks($http, user, StackBuilderFactory) {
                return StackBuilderFactory.getUserStacks(user);
            }
        }
    });
});

app.controller('homeCtrl', function ($scope, user, stacks, $rootScope, StackBuilderFactory, $log) {
    $scope.user = user;
    $scope.stacks = stacks;
    console.log('user:', user);
    console.log('stacks:', stacks);

    $rootScope.$on('deletestack', function (event, data) {
        $scope.stacks = $scope.stacks.filter(function (ele) {
            return data !== ele._id;
        });
    });

    $rootScope.$on('testUpdate', function (event, dataObj) {

        var updatedStack = $scope.stacks.filter(function (stack) {
            return stack._id == dataObj.stack._id;
        })[0];

        var updatedTest = updatedStack.tests.filter(function (test) {
            return test._id == dataObj.test._id;
        })[0];

        updatedTest.body.result = dataObj.test.body.result;
    });
});

app.config(function ($stateProvider) {

    $stateProvider.state('login', {
        url: '/',
        templateUrl: './assets/templates/login.html',
        controller: 'LoginCtrl'
    });
});

app.controller('LoginCtrl', function ($scope, AuthService, $state, $rootScope) {
    $scope.login = {};
    $scope.error = null;

    $scope.sendLogin = function (loginInfo) {

        $scope.error = null;

        AuthService.login(loginInfo).then(function (user) {
            $rootScope.user = user;
            $scope.$evalAsync();
            $state.go('home'); //TEST {id: user._id}
        }).catch(function (error) {
            $scope.error = 'Invalid login credentials.';
        });
    };
});

(function () {

    'use strict';

    // Hope you didn't forget Angular! Duh-doy.

    if (!window.angular) throw new Error('I can\'t find Angular!');

    var app = angular.module('NewmanPreBuilt', []);

    app.factory('Socket', function () {
        if (!window.io) throw new Error('socket.io not found!');
        return window.io(window.location.origin);
    });

    // AUTH_EVENTS is used throughout our app to
    // broadcast and listen from and to the $rootScope
    // for important events about authentication flow.
    app.constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

    app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        var statusDict = {
            401: AUTH_EVENTS.notAuthenticated,
            403: AUTH_EVENTS.notAuthorized,
            419: AUTH_EVENTS.sessionTimeout,
            440: AUTH_EVENTS.sessionTimeout
        };
        return {
            responseError: function responseError(response) {
                $rootScope.$broadcast(statusDict[response.status], response);
                return $q.reject(response);
            }
        };
    });

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push(['$injector', function ($injector) {
            return $injector.get('AuthInterceptor');
        }]);
    });

    app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q) {

        function onSuccessfulLogin(response) {
            var data = response.data;
            Session.create(data.id, data.user);
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            return data.user;
        }

        // Uses the session factory to see if an
        // authenticated user is currently registered.
        this.isAuthenticated = function () {
            return !!Session.user;
        };

        this.getLoggedInUser = function (fromServer) {
            console.log('getLoggedInUser was called');
            // If an authenticated session exists, we
            // return the user attached to that session
            // with a promise. This ensures that we can
            // always interface with this method asynchronously.

            // Optionally, if true is given as the fromServer parameter,
            // then this cached value will not be used.

            if (this.isAuthenticated() && fromServer !== true) {
                return $q.when(Session.user);
            }
            return Promise.resolve(null);
            console.log('about to make the /session get request');

            // Make request GET /session.
            // If it returns a user, call onSuccessfulLogin with the response.
            // If it returns a 401 response, we catch it and instead resolve to null.
            return $http.get('https://warm-lowlands-63755.herokuapp.com/session').then(onSuccessfulLogin).catch(function () {
                return null;
            });
        };

        this.login = function (credentials) {
            return $http.post('https://warm-lowlands-63755.herokuapp.com/login', credentials).then(onSuccessfulLogin).catch(function () {
                return $q.reject({ message: 'Invalid login credentials.' });
            });
        };

        this.logout = function () {
            return $http.get('https://warm-lowlands-63755.herokuapp.com/logout').then(function () {
                Session.destroy();
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            });
        };
    });

    app.service('Session', function ($rootScope, AUTH_EVENTS) {

        var self = this;

        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
            self.destroy();
        });

        $rootScope.$on(AUTH_EVENTS.sessionTimeout, function () {
            self.destroy();
        });

        this.id = null;
        this.user = null;

        this.create = function (sessionId, user) {
            this.id = sessionId;
            this.user = user;
        };

        this.destroy = function () {
            this.id = null;
            this.user = null;
        };
    });
})();

app.factory('SignupFactory', function ($http) {
    var SignupFactory = {};

    SignupFactory.createNewUser = function (userInfo) {
        return $http.post('https://warm-lowlands-63755.herokuapp.com/signup', userInfo);
    };

    return SignupFactory;
});

'use strict';

app.config(function ($stateProvider) {

    $stateProvider.state('signup', {
        url: '/signup',
        templateUrl: './assets/templates/signup.html',
        controller: 'SignupCtrl'
    });
});

app.controller('SignupCtrl', function ($scope, AuthService, $state, SignupFactory, $mdToast, $log) {

    $scope.error = null;

    $scope.createUser = function (signupInfo) {
        if (signupInfo.passwordA !== signupInfo.passwordB) {
            $scope.error = 'Your passwords don\'t match.';
        } else {
            SignupFactory.createNewUser({ email: signupInfo.email, password: signupInfo.passwordA, username: signupInfo.username, firstName: signupInfo.firstName, lastName: signupInfo.lastName, isAdmin: false }).then($scope.showSuccessToast()).then($state.go('login')).catch($log.error);
        }
    };
    $scope.showSuccessToast = function () {
        $mdToast.show($mdToast.simple().textContent('Sign up successful.').position('bottom right').hideDelay(2000));
    };
});

app.config(function ($stateProvider) {
    $stateProvider.state('stackBuilder', {
        url: '/stackbuilder',
        templateUrl: './assets/templates/stackBuilder.html',
        controller: 'StackBuilderCtrl',
        resolve: {
            user: function user(AuthService) {
                return AuthService.getLoggedInUser();
            },
            tests: function tests($http, user) {
                return $http.get('https://warm-lowlands-63755.herokuapp.com/api/tests?userId=' + user._id).then(function (res) {
                    return res.data;
                });
            }
        }
    });
});

app.factory('StackBuilderFactory', function ($http, $rootScope, TestBuilderFactory) {
    var obj = {};
    var storedStacks = [];
    obj.getStacks = function () {
        return storedStacks;
    };
    obj.getUserStacks = function (user) {
        return $http.get('https://warm-lowlands-63755.herokuapp.com/api/stacks?userId=' + user._id).then(function (response) {
            angular.copy(response.data, storedStacks);
            return storedStacks;
        });
    };

    obj.create = function (stackObj) {
        var newTests = stackObj.tests.map(function (test) {
            return TestBuilderFactory.create(test);
        });
        return Promise.all(newTests).then(function (savedTests) {
            return stackObj.tests = savedTests;
        }).then(function () {
            return $http.post('https://warm-lowlands-63755.herokuapp.com/api/stacks', stackObj);
        }).then(function (res) {
            $rootScope.$emit('createstack', res.data);
            return res.data;
        });
    };
    obj.delete = function (stackObj) {
        return $http.delete('https://warm-lowlands-63755.herokuapp.com/api/stacks/' + stackObj._id).then(function (res) {
            storedStacks = storedStacks.filter(function (ele) {
                return ele._id !== res.data;
            });
            $rootScope.$emit('deletestack', res.data);
            return res.data;
        });
    };
    return obj;
});

app.controller('StackBuilderCtrl', function ($scope, $state, $log, tests, StackBuilderFactory, $rootScope, TestBuilderFactory) {

    $scope.toggle = false;
    $scope.setToggle = function () {
        $scope.toggle = !$scope.toggle;
        $scope.$evalAsync();
    };

    $scope.tests = tests.filter(function (test) {
        return !test.stack;
    });
    $scope.stack = {};
    $scope.stack.user = $rootScope.user;
    $scope.stack.userId = $rootScope.user._id;
    $scope.stack.tests = [];

    $scope.intermediary = function () {
        $scope.setToggle();
        window.setTimeout($scope.submitStack, 800);
    };

    $scope.submitStack = function () {
        StackBuilderFactory.create($scope.stack).then(function (stack) {
            return $state.go('stackView', { stackId: stack._id });
        }).catch($log.error);
    };
    $scope.addToStack = function (test) {
        $scope.stack.tests.push(test);
        $scope.$evalAsync();
    };
    $scope.removeFromStack = function (obj) {
        $scope.stack.tests = $scope.stack.tests.filter(function (el) {
            return el !== obj;
        });
        $scope.$evalAsync();
    };
    $scope.onDropComplete = function (index, obj, evt) {
        var otherObj = $scope.stack.tests[index];
        var otherIndex = $scope.stack.tests.indexOf(obj);
        $scope.stack.tests[index] = obj;
        $scope.stack.tests[otherIndex] = otherObj;
    };
});

app.config(function ($stateProvider) {
    $stateProvider.state('stackView', {
        url: '/stackView/:stackId',
        templateUrl: './assets/templates/stackView.html',
        controller: 'StackViewCtrl',
        resolve: {
            stack: function stack($http, $stateParams) {
                return $http.get('https://warm-lowlands-63755.herokuapp.com/api/stacks/' + $stateParams.stackId).then(function (res) {
                    return res.data;
                });
            }
        }
    });
});

app.factory('StackViewFactory', function ($http) {
    return {
        edit: function edit(obj) {
            return $http.put('https://warm-lowlands-63755.herokuapp.com/api/stacks/' + obj._id, obj).then(function (response) {
                return response.data;
            });
        },
        getTestWithStatus: function getTestWithStatus(arr, status) {
            return arr.filter(function (ele) {
                return ele.body.result === status;
            });
        },
        getPercent: function getPercent(arr, totallen) {
            return arr.length / totallen * 100;
        }
    };
});

app.controller('StackViewCtrl', function ($scope, $rootScope, $state, $log, stack, StackViewFactory, TestFactory) {
    $scope.stack = stack;
    $scope.removeFromStack = function (index) {
        $scope.stack.tests.splice(index, 1);
        $scope.$evalAsync();
    };
    $scope.submitStack = function () {
        StackViewFactory.edit($scope.stack).then(function () {
            return $scope.$evalAsync();
        }).then(function () {
            return alert("Your changes were saved!");
        }).catch($log.error);
    };

    $scope.newTests = StackViewFactory.getTestWithStatus($scope.stack.tests, "New");
    $scope.failTests = StackViewFactory.getTestWithStatus($scope.stack.tests, "Failing");
    $scope.passTests = StackViewFactory.getTestWithStatus($scope.stack.tests, "Passing");
    $scope.newPercent = StackViewFactory.getPercent($scope.newTests, $scope.stack.tests.length);
    $scope.failPercent = StackViewFactory.getPercent($scope.failTests, $scope.stack.tests.length);
    $scope.passPercent = StackViewFactory.getPercent($scope.passTests, $scope.stack.tests.length);

    $(function () {
        var $ppc = $('.progress-pie-chart'),
            percent = $scope.passPercent.toFixed(0),
            deg = 360 * percent / 100;
        if (percent > 50) {
            $ppc.addClass('gt-50');
        }
        $('.ppc-progress-fill').css('transform', 'rotate(' + deg + 'deg)');
        $('.ppc-percents span').html(percent + '%');
    });
    var dateObj = new Date($scope.stack.lastRun);
    $scope.dateString = dateObj.toString();
});

app.config(function ($stateProvider) {
    $stateProvider.state('userspage', {
        url: '/userpage',
        templateUrl: './assets/templates/userspage.html',
        // The following data.authenticate is read by an event listener
        // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        },
        controller: 'usersPageCtrl',
        resolve: {
            user: function user(AuthService) {
                return AuthService.getLoggedInUser();
            }
        }
    });
});

app.factory('UsersPageFactory', function ($http) {
    return {
        saveChanges: function saveChanges(user) {
            return $http.put('https://warm-lowlands-63755.herokuapp.com/api/users/' + user._id, user).then(function (res) {
                return res.data;
            });
        }
    };
});

app.controller('usersPageCtrl', function ($log, $mdToast, $scope, user, UsersPageFactory) {
    $scope.user = user;
    $scope.saveChanges = function () {
        UsersPageFactory.saveChanges($scope.user).then(function () {
            return $scope.showSuccessToast();
        }).catch($log.error);
    };
    $scope.showSuccessToast = function () {
        $mdToast.show($mdToast.simple().textContent('Changes saved.').position('bottom right').hideDelay(2000));
    };
}).config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('customBackground', 'default').primaryPalette('customBackground');
});

'use strict';

app.factory('TestBuilderFactory', function ($http, AuthService) {
    var testobj = {};

    testobj.create = function (obj) {
        var clonedObj = _.cloneDeep(obj);
        if (clonedObj._id) {
            delete clonedObj._id;
        }
        if (clonedObj.validators) {
            clonedObj.validators = JSON.stringify(clonedObj.validators);
        }
        clonedObj.body.data = JSON.stringify(clonedObj.body.data);
        return $http.post('https://warm-lowlands-63755.herokuapp.com/api/tests/', clonedObj).then(function (response) {
            return response.data;
        });
    };
    testobj.edit = function (obj) {
        var clonedObj = _.cloneDeep(obj);
        if (clonedObj.validators) {
            clonedObj.validators = JSON.stringify(clonedObj.validators);
        }
        clonedObj.body.data = JSON.stringify(clonedObj.body.data);
        return $http.put('https://warm-lowlands-63755.herokuapp.com/api/tests/' + clonedObj._id, clonedObj).then(function (response) {
            return response.data;
        });
    };
    testobj.delete = function (obj) {
        return $http.delete('https://warm-lowlands-63755.herokuapp.com/api/tests/' + obj._id);
    };

    testobj.allTests = function () {
        return AuthService.getLoggedInUser().then(function (user) {
            return $http.get('https://warm-lowlands-63755.herokuapp.com/api/tests?userId=' + user._id);
        }).then(function (response) {
            return response.data;
        });
    };

    return testobj;
});

app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: './assets/templates/navbar.html',
        link: function link(scope) {

            scope.items = [{ label: 'Home', state: 'home' }, { label: 'About', state: 'about' }, { label: 'Documentation', state: 'docs' }, { label: 'Members Only', state: 'membersOnly', auth: true }, { label: 'Add Test', state: 'testbuilder', auth: true }];

            scope.user = null;

            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

            scope.logout = function () {
                AuthService.logout().then(function () {
                    $state.go('login');
                });
            };

            var setUser = function setUser() {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };

            var removeUser = function removeUser() {
                scope.user = null;
            };

            setUser();

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);
        }

    };
});

app.directive('stackCard', function () {
    return {
        restrict: 'E',
        scope: {
            stack: '='
        },
        templateUrl: './assets/templates/stackCard.html',
        controller: 'StackCardCtrl'
    };
});

app.controller('StackCardCtrl', function ($scope, $rootScope, StackBuilderFactory, $mdDialog, TestFactory, $log, StackViewFactory) {

    $scope.toggle = false;
    $scope.setToggle = function () {
        $scope.toggle = !$scope.toggle;
        $scope.$evalAsync();
    };

    $scope.showConfirm = function (stack) {
        var confirm = $mdDialog.confirm().title("Confirm Deletion").ariaLabel('Delete').ok('Delete').cancel('Cancel');
        $mdDialog.show(confirm).then(function () {
            return StackBuilderFactory.delete(stack);
        }, function () {
            $scope.status = 'Delete cancelled';
        });
    };

    $scope.runTests = function (stack) {
        $scope.setToggle();
        var tests = stack.tests.slice();

        // Recursive function that shifts a test off of the tests array with each recursive call until the array is empty
        var runTests = function runTests(tests) {
            if (!tests.length) {
                TestFactory.clearResponsePool();
                stack.lastRun = new Date();
                return StackViewFactory.edit(stack).catch($log.error);
            }
            var test = tests.shift();
            var funcArray = [];
            var cancelTest = false;
            var results = {
                validatorResults: [],
                lastRun: Date.now()
            };
            if (typeof test.validators === 'string') test.validators = JSON.parse(test.validators);
            if (typeof test.validators === 'string') test.validators = JSON.parse(test.validators);
            test.validators.forEach(function (elem) {
                try {
                    if (elem.func.length > 26) {
                        funcArray.push(eval(elem.func));
                    }
                } catch (err) {
                    alert('There was an error parsing the ' + elem.name + ' validator function. Refactor that function and try again.');
                    cancelTest = true;
                }
            });
            if (cancelTest) return;
            TestFactory.runTest(test).then(function (resData) {

                test.response = JSON.stringify(resData);

                TestFactory.addToResponsePool({
                    name: test.name,
                    response: resData
                });

                for (var i = 0; i < funcArray.length; i++) {
                    try {
                        results.validatorResults.push(!!funcArray[i](resData));
                    } catch (err) {
                        alert('The following error occured while running the ' + test.validators[i].name + ' validator function: ' + err.message + '. Refactor that function and try again.');
                        return;
                    }
                }
                if (results.validatorResults.length) results.finalResult = results.validatorResults.every(function (validatorResult) {
                    return validatorResult;
                });
                return TestFactory.saveResults(results, test);
            }).then(function (updatedTest) {
                var dataObj = {
                    test: updatedTest,
                    stack: stack
                };
                $rootScope.$emit('testUpdate', dataObj);
                runTests(tests);
            }).catch($log.error);
        };
        runTests(tests);
        window.setTimeout($scope.setToggle, 800);
    };
});

'use strict';

app.directive('sidebar', function () {
    return {
        restrict: 'E',
        templateUrl: './assets/templates/sidebar.html',
        controller: 'sidebarCtrl'
    };
});

app.controller('sidebarCtrl', function ($scope, $log, $rootScope, StackBuilderFactory, AuthService) {

    $rootScope.$on('auth-login-success', function() {
        AuthService.getLoggedInUser()
        .then(function (user) {
            $scope.user = user;
            return user;
        })
        .then(user => StackBuilderFactory.getUserStacks(user))
        .then(function (stacks) {
            $scope.stacks = stacks;
            $scope.$evalAsync();
            console.log('$scope.stacks:', stacks);
        })
        .catch($log.error);
    });

    $rootScope.$on('createstack', function (event, data) {
        $scope.stacks.push(data);
        $scope.$evalAsync();
    });

    $rootScope.$on('deletestack', function (event, data) {
        $scope.stacks = $scope.stacks.filter(function (ele) {
            return data !== ele._id;
        });
    });
});

'use strict';

app.config(function ($stateProvider) {
    $stateProvider.state('testbuilder', {
        url: '/testbuilder',
        templateUrl: './assets/templates/newTest.html',
        controller: 'TestbuilderCtrl'
    });
});

app.directive('testbuilder', function () {
    return {
        restrict: 'E',
        templateUrl: './assets/templates/testbuilder.html'
    };
});

app.factory('TestFactory', function ($http, $log, TestBuilderFactory) {

    var ResponsePool = function ResponsePool() {};

    ResponsePool.prototype.getValue = function (key) {
        //test1.data.userId
        var currentTestName = this.currentTestName;
        var keys = key.split('.'); //['test1', 'data', 'objectId']
        return keys.reduce(function (currentKey, nextKey) {
            //responsePool[test1] > test1[data] > data[userId]

            try {
                return currentKey[nextKey];
            } catch (error) {
                alert('Whoops! Newman couldn\'t interpolate "' + key + '" while running "' + currentTestName + '". Make sure you\'re interpolating the right value, and try to run the entire stack from the home page.');
            }
        }, responsePool);
    };

    var responsePool = new ResponsePool();

    var interpolate = function interpolate(input) {

        if (typeof input === 'string') {
            var _ret = function () {
                //'http://mysite.com/users/{{test1.data.userId}}/posts/{{test2.data.postId}}'
                if (input.indexOf('{{') === -1) return {
                        v: input
                    };
                var newVals = [];

                input.split("}}").forEach(function (elem) {
                    if (elem.indexOf("{{") !== -1) {
                        var slicePoint = elem.indexOf("{{");
                        var sliced = elem.slice(slicePoint);
                        newVals.push(elem.replace(sliced, responsePool.getValue(sliced.substring(2))));
                    } else newVals.push(elem);
                });

                return {
                    v: newVals.join('')
                }; //'http://mysite.com/users/123/posts/456'
            }();

            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        } else if (Array.isArray(input)) {
            return input.map(interpolate);
        } else if ((typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object') {
            for (var key in input) {
                input[key] = interpolate(input[key]);
            }
            return input;
        } else return input;
    };

    var makeRequest = function makeRequest(test) {

        var requestObj = {};

        requestObj.method = test.method;
        requestObj.url = test.url;

        if (test.headers.length) {
            requestObj.headers = {};
            test.headers.forEach(function (header) {
                if (header !== null) requestObj.headers[header.key] = requestObj.headers[header.value];
            });
        }
        var testData = void 0;
        if (typeof test.body.data === 'string') test.body.data = JSON.parse(test.body.data);
        testData = test.body.data;

        if (test.body.bodytype === 'raw') {
            requestObj.data = testData.reduce(function (dataObj, nextBodyPair) {
                dataObj[nextBodyPair.key] = nextBodyPair.value;
                return dataObj;
            }, {});
        }

        if (test.body.bodytype === 'x-www-form-urlencoded') {
            requestObj.data = testData.reduce(function (dataArr, nextBodyPair) {
                dataArr.push(nextBodyPair.key + '=' + nextBodyPair.value);
                return dataArr;
            }, []).join('&');
            requestObj.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        var formData = void 0;
        if (test.body.bodytype === 'form-data') {
            formData = new FormData();
            testData.forEach(function (keyValuePair) {
                return formData.set(keyValuePair.key, keyValuePair.value);
            });
            requestObj.headers['Content-Type'] = undefined;
        }

        try {

            if (test.body.bodytype === 'form-data') {
                return $http[requestObj.method.toLowerCase()](requestObj.url, formData, {
                    transformRequest: angular.identity,
                    headers: requestObj.headers
                }).then(function (response) {
                    return response.data;
                });
            } else {
                return $http(requestObj).then(function (response) {
                    return response.data;
                });
            }
        } catch (error) {
            alert('Whoops! During ' + responsePool.currentTestName + ', you asked Newman to send a request to ' + requestObj.url + 'but that doesn\'t appear to be a valid address.');
        }
    };

    return {
        runTest: function runTest(test) {

            responsePool.currentTestName = test.name;

            var copyOfTest = _.cloneDeep(test);

            var interpolatedTest = interpolate(copyOfTest);

            //Construct and send the $http request
            return makeRequest(interpolatedTest).catch(function (err) {
                if (err.config.url) alert('Whoops! During ' + test.name + ', we tried to test ' + err.config.url + ' but it looks like this isn\'t a valid address.');
            });
        },
        saveResults: function saveResults(results, test) {

            results.test = test._id;

            return TestBuilderFactory.edit(test).then(function () {
                return $http.post('https://warm-lowlands-63755.herokuapp.com/api/results', results);
            }).then(function (res) {
                return res.data;
            }).catch($log.error);
        },
        getPreviousResults: function getPreviousResults(test) {
            if (!test.result) {
                return false;
            }
            return $http.get('https://warm-lowlands-63755.herokuapp.com/api/results/' + test.result).then(function (res) {
                return res.data;
            });
        },
        addToResponsePool: function addToResponsePool(data) {
            responsePool[data.name] = data.response;
        },
        clearResponsePool: function clearResponsePool() {
            responsePool = new ResponsePool();
        },
        getStackTests: function getStackTests(viewedTest) {
            if (!viewedTest.stack) return Promise.resolve([]);
            return $http.get('https://warm-lowlands-63755.herokuapp.com/api/stacks/' + viewedTest.stack).then(function (res) {
                return res.data.tests;
            }).then(function (tests) {
                var includeTest = true; //Will include only tests that precede the viewedTest in the stack
                return tests.filter(function (test) {
                    if (test._id === viewedTest._id) includeTest = false;
                    return includeTest;
                });
            });
        }
    };
});

app.controller('TestbuilderCtrl', function ($scope, $state, TestBuilderFactory, $rootScope, $log, AuthService, TestFactory, $mdDialog, $mdMedia) {

    $scope.toggle = false;
    $scope.setToggle = function () {
        $scope.toggle = !$scope.toggle;
        $scope.$evalAsync();
    };

    $scope.test = {};
    $scope.test.name = 'newTest';
    AuthService.getLoggedInUser().then(function (user) {
        $scope.test.user = user;
        $scope.test.userId = user._id;
    }).catch($log.error);

    $scope.test.url = 'http://';
    $scope.test.params = [];
    $scope.test.headers = [];
    $scope.test.body = {};
    $scope.test.body.data = [];
    $scope.test.validators = [];
    $scope.test.method = "GET";
    $scope.showParams = false;
    $scope.showHeaders = false;
    $scope.showBody = false;
    $scope.showValidators = false;
    $scope.isNewTest = true;
    $scope.addForm = function (index, type) {
        if (type !== 'body' && (index === $scope.test[type].length - 1 || $scope.test[type].length === 0)) {
            if (type === "params") $scope.test.params.push({});
            if (type === "headers") $scope.test.headers.push({});
            if (type === "validators") $scope.test.validators.push({ name: 'validator' + (Number($scope.test.validators.length) + 1).toString(), func: "(function(response) {\n\n});" });
        } else if (index === $scope.test[type].data.length - 1 || $scope.test[type].data.length === 0) {
            $scope.test.body.data.push({});
        }
        $scope.$evalAsync();
    };

    $scope.showForm = function () {
        if ($scope.test.params.length === 0) {
            $scope.addForm(0, "params");
            // $scope.numParams++;
        }
        $scope.showParams = !$scope.showParams;
    };

    $scope.displayHeaders = function () {
        if ($scope.test.headers.length === 0) {
            $scope.addForm(0, "headers");
            // $scope.numHeaders++;
        }
        $scope.showHeaders = !$scope.showHeaders;
    };

    $scope.displayBody = function () {
        if ($scope.test.body.data.length === 0) {
            $scope.addForm(0, "body");
            // $scope.numBodyObj++;
        }
        $scope.showBody = !$scope.showBody;
    };

    $scope.displayValidators = function () {
        if ($scope.test.validators.length === 0) {
            $scope.addForm(0, "validators");
        }
        $scope.showValidators = !$scope.showValidators;
    };

    $scope.composeURL = function () {
        var indexQuestionMark = $scope.test.url.indexOf('?');
        if (indexQuestionMark !== -1) {
            $scope.test.url = $scope.test.url.substring(0, indexQuestionMark);
        }
        $scope.test.url += '?';
        var finalString = '';
        for (var i = 0; i < $scope.test.params.length - 1; i++) {
            finalString = finalString + $scope.test.params[i].key + '=' + $scope.test.params[i].value + '&';
        }
        $scope.test.url = $scope.test.url + finalString;
        $scope.test.url = $scope.test.url.slice(0, $scope.test.url.length - 1);
    };

    $scope.intermediary = function () {
        $scope.setToggle();
        window.setTimeout($scope.saveTest, 800);
    };

    $scope.saveTest = function () {
        $scope.test.created = true;
        TestBuilderFactory.create($scope.test).then(function () {
            $state.go('allTests');
        }).catch($log.error);
    };

    $scope.runTest = function () {
        var funcArray = [];
        var cancelTest = false;
        $scope.results = {
            validatorResults: [],
            lastRun: Date.now()
        };
        $scope.test.validators.forEach(function (elem) {
            try {
                if (elem.func.length > 26) {
                    funcArray.push(eval(elem.func));
                }
            } catch (err) {
                alert('There was an error parsing the ' + elem.name + ' validator function. Refactor that function and try again.');
                cancelTest = true;
            }
        });
        if (cancelTest) return;
        TestFactory.runTest($scope.test).then(function (resData) {
            $scope.test.response = JSON.stringify(resData);
            for (var i = 0; i < funcArray.length; i++) {
                try {
                    $scope.results.validatorResults.push(!!funcArray[i](resData));
                } catch (err) {
                    alert('The following error occured while running the ' + $scope.test.validators[i].name + ' validator function: ' + err.message + '. Refactor that function and try again.');
                    return;
                }
            }
            if ($scope.results.validatorResults.length) $scope.results.finalResult = $scope.results.validatorResults.every(function (validatorResult) {
                return validatorResult;
            });
        }).then($scope.showResults);
    };

    $scope.showResults = function (ev) {
        $mdDialog.test = $scope.test;
        $mdDialog.results = $scope.results;
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
        $mdDialog.show({
            controller: DialogController,
            templateUrl: './assets/templates/testResults.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true,
            fullscreen: useFullScreen
        });
    };

    function DialogController($scope, $mdDialog) {
        $scope.test = $mdDialog.test;
        $scope.results = $mdDialog.results;
        $scope.hide = function () {
            $mdDialog.hide();
        };
        $scope.cancel = function () {
            $mdDialog.cancel();
        };
        $scope.answer = function (answer) {
            $mdDialog.hide(answer);
        };
    }
});

'use strict';

app.directive('validatorEditor', function () {
    return {
        restrict: 'E',
        templateUrl: './assets/templates/validatorEditor.html',
        controller: 'ValidatorEditorCtrl'
    };
});

app.factory('ValidatorEditorFactory', function () {
    return {};
});

app.controller('ValidatorEditorCtrl', function ($scope, ValidatorEditorFactory) {});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFsbFRlc3RzL2FsbFRlc3RzLmpzIiwiZWRpdFRlc3QvZWRpdFRlc3QuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm5ld21hbmNvcmUvbmV3bWFuLXByZS1idWlsdC5qcyIsInNpZ251cC9zaWdudXAuZmFjdG9yeS5qcyIsInNpZ251cC9zaWdudXAuanMiLCJzdGFja0J1aWxkZXIvc3RhY2tCdWlsZGVyLmpzIiwic3RhY2tWaWV3L3N0YWNrVmlldy5qcyIsInVzZXJzcGFnZS91c2Vyc3BhZ2UuanMiLCJjb21tb24vZmFjdG9yaWVzL3Rlc3RidWlsZGVyZmFjdG9yeS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9zdGFja0NhcmQvc3RhY2tDYXJkLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvc2lkZWJhci9zaWRlYmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvdGVzdGJ1aWxkZXIvdGVzdGJ1aWxkZXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy92YWxpZGF0b3JFZGl0b3IvdmFsaWRhdG9yRWRpdG9yLmpzIl0sIm5hbWVzIjpbIndpbmRvdyIsImFwcCIsImFuZ3VsYXIiLCJtb2R1bGUiLCJjb25maWciLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkbG9jYXRpb25Qcm92aWRlciIsIiRtZFRoZW1pbmdQcm92aWRlciIsImh0bWw1TW9kZSIsIndoZW4iLCJsb2NhdGlvbiIsInJlbG9hZCIsImN1c3RvbVByaW1hcnkiLCJkZWZpbmVQYWxldHRlIiwiY3VzdG9tQWNjZW50IiwiY3VzdG9tV2FybiIsImN1c3RvbUJhY2tncm91bmQiLCJ0aGVtZSIsInByaW1hcnlQYWxldHRlIiwiYWNjZW50UGFsZXR0ZSIsIndhcm5QYWxldHRlIiwiYmFja2dyb3VuZFBhbGV0dGUiLCJydW4iLCIkcm9vdFNjb3BlIiwiQXV0aFNlcnZpY2UiLCIkc3RhdGUiLCIkbG9jYXRpb24iLCJhc3NldHNQYXRoIiwicHJvY2VzcyIsImN3ZCIsImdldExvZ2dlZEluVXNlciIsInRoZW4iLCJ1c2VyIiwiZ28iLCJkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoIiwic3RhdGUiLCJkYXRhIiwiYXV0aGVudGljYXRlIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJpc0F1dGhlbnRpY2F0ZWQiLCJwcmV2ZW50RGVmYXVsdCIsImNvbnNvbGUiLCJsb2ciLCJ1c2VySWQiLCJfaWQiLCJuYW1lIiwiJHN0YXRlUHJvdmlkZXIiLCJ1cmwiLCJ0ZW1wbGF0ZVVybCIsImNvbnRyb2xsZXIiLCJyZXNvbHZlIiwiYWxsVGVzdHMiLCIkaHR0cCIsIiRzdGF0ZVBhcmFtcyIsImN1cnJlbnREYXRlIiwiRGF0ZSIsInRpbWUiLCJnZXRIb3VycyIsImdldE1pbnV0ZXMiLCJnZXRTZWNvbmRzIiwiZ2V0IiwicmVzcG9uc2UiLCIkbG9nIiwiJG1kRWRpdERpYWxvZyIsIiRtZERpYWxvZyIsIiRxIiwiJHNjb3BlIiwiJHRpbWVvdXQiLCJUZXN0QnVpbGRlckZhY3RvcnkiLCJzZWxlY3RlZCIsImxpbWl0T3B0aW9ucyIsIm9wdGlvbnMiLCJyb3dTZWxlY3Rpb24iLCJtdWx0aVNlbGVjdCIsImF1dG9TZWxlY3QiLCJkZWNhcGl0YXRlIiwibGFyZ2VFZGl0RGlhbG9nIiwiYm91bmRhcnlMaW5rcyIsImxpbWl0U2VsZWN0IiwicGFnZVNlbGVjdCIsInF1ZXJ5Iiwib3JkZXIiLCJsaW1pdCIsInBhZ2UiLCJ0ZXN0cyIsImdldFRlc3RzIiwiJGV2YWxBc3luYyIsInRvZ2dsZUxpbWl0T3B0aW9ucyIsInVuZGVmaW5lZCIsImxvYWRTdHVmZiIsInByb21pc2UiLCJkZWxldGV0ZXN0cyIsImRlbGV0ZVByb21pc2VzIiwibWFwIiwiZGVsZXRlIiwidGVzdCIsIlByb21pc2UiLCJhbGwiLCJ2YWwiLCJzaG93Q29uZmlybSIsImV2IiwiY29uZmlybSIsInRpdGxlIiwiYXJpYUxhYmVsIiwidGFyZ2V0RXZlbnQiLCJvayIsImNhbmNlbCIsInNob3ciLCJmaWx0ZXIiLCJlbGUiLCJpbmRleE9mIiwic3RhdHVzIiwidGVzdElkIiwicmVzIiwidmFsaWRhdG9ycyIsIkpTT04iLCJwYXJzZSIsIlRlc3RGYWN0b3J5IiwiJG1kTWVkaWEiLCJnZXRTdGFja1Rlc3RzIiwic3RhY2tUZXN0cyIsImNhdGNoIiwiZXJyb3IiLCJib2R5Iiwic2hvd1BhcmFtcyIsInNob3dIZWFkZXJzIiwic2hvd0JvZHkiLCJzaG93VmFsaWRhdG9ycyIsIm51bVBhcmFtcyIsIm51bUhlYWRlcnMiLCJudW1Cb2R5T2JqIiwiYWRkRm9ybSIsImluZGV4IiwidHlwZSIsInB1c2giLCJOdW1iZXIiLCJsZW5ndGgiLCJ0b1N0cmluZyIsImZ1bmMiLCJwYXJhbXMiLCJoZWFkZXJzIiwic2hvd0Zvcm0iLCJkaXNwbGF5SGVhZGVycyIsImRpc3BsYXlCb2R5IiwiZGlzcGxheVZhbGlkYXRvcnMiLCJjb21wb3NlVVJMIiwiaW5kZXhRdWVzdGlvbk1hcmsiLCJzdWJzdHJpbmciLCJmaW5hbFN0cmluZyIsImkiLCJrZXkiLCJ2YWx1ZSIsInNsaWNlIiwic2V0VG9nZ2xlIiwidG9nZ2xlIiwiaW50ZXJtZWRpYXJ5Iiwic2V0VGltZW91dCIsInNhdmVUZXN0IiwiZWRpdCIsInZpZXdQcmV2aW91c1Jlc3VsdHMiLCJyZXN1bHQiLCJhbGVydCIsImdldFByZXZpb3VzUmVzdWx0cyIsInJlc3VsdHMiLCJzaG93UmVzdWx0cyIsInVzZUZ1bGxTY3JlZW4iLCJjdXN0b21GdWxsc2NyZWVuIiwiRGlhbG9nQ29udHJvbGxlciIsInBhcmVudCIsImVsZW1lbnQiLCJkb2N1bWVudCIsImNsaWNrT3V0c2lkZVRvQ2xvc2UiLCJmdWxsc2NyZWVuIiwicnVuVGVzdCIsImNsZWFyUmVzcG9uc2VQb29sIiwiZm9yRWFjaCIsImFkZFRvUmVzcG9uc2VQb29sIiwiZnVuY0FycmF5IiwiY2FuY2VsVGVzdCIsInZhbGlkYXRvclJlc3VsdHMiLCJsYXN0UnVuIiwibm93IiwiZWxlbSIsImV2YWwiLCJlcnIiLCJyZXNEYXRhIiwic3RyaW5naWZ5IiwibWVzc2FnZSIsImZpbmFsUmVzdWx0IiwiZXZlcnkiLCJ2YWxpZGF0b3JSZXN1bHQiLCJzYXZlUmVzdWx0cyIsImhpZGUiLCJhbnN3ZXIiLCJzdGFja3MiLCJTdGFja0J1aWxkZXJGYWN0b3J5IiwiZ2V0VXNlclN0YWNrcyIsImRhdGFPYmoiLCJ1cGRhdGVkU3RhY2siLCJzdGFjayIsInVwZGF0ZWRUZXN0IiwibG9naW4iLCJzZW5kTG9naW4iLCJsb2dpbkluZm8iLCJFcnJvciIsImZhY3RvcnkiLCJpbyIsIm9yaWdpbiIsImNvbnN0YW50IiwibG9naW5TdWNjZXNzIiwibG9naW5GYWlsZWQiLCJsb2dvdXRTdWNjZXNzIiwic2Vzc2lvblRpbWVvdXQiLCJub3RBdXRoZW50aWNhdGVkIiwibm90QXV0aG9yaXplZCIsIkFVVEhfRVZFTlRTIiwic3RhdHVzRGljdCIsInJlc3BvbnNlRXJyb3IiLCIkYnJvYWRjYXN0IiwicmVqZWN0IiwiJGh0dHBQcm92aWRlciIsImludGVyY2VwdG9ycyIsIiRpbmplY3RvciIsInNlcnZpY2UiLCJTZXNzaW9uIiwib25TdWNjZXNzZnVsTG9naW4iLCJjcmVhdGUiLCJpZCIsImZyb21TZXJ2ZXIiLCJjcmVkZW50aWFscyIsInBvc3QiLCJsb2dvdXQiLCJkZXN0cm95Iiwic2VsZiIsInNlc3Npb25JZCIsIlNpZ251cEZhY3RvcnkiLCJjcmVhdGVOZXdVc2VyIiwidXNlckluZm8iLCIkbWRUb2FzdCIsImNyZWF0ZVVzZXIiLCJzaWdudXBJbmZvIiwicGFzc3dvcmRBIiwicGFzc3dvcmRCIiwiZW1haWwiLCJwYXNzd29yZCIsInVzZXJuYW1lIiwiZmlyc3ROYW1lIiwibGFzdE5hbWUiLCJpc0FkbWluIiwic2hvd1N1Y2Nlc3NUb2FzdCIsInNpbXBsZSIsInRleHRDb250ZW50IiwicG9zaXRpb24iLCJoaWRlRGVsYXkiLCJvYmoiLCJzdG9yZWRTdGFja3MiLCJnZXRTdGFja3MiLCJjb3B5Iiwic3RhY2tPYmoiLCJuZXdUZXN0cyIsInNhdmVkVGVzdHMiLCIkZW1pdCIsInN1Ym1pdFN0YWNrIiwic3RhY2tJZCIsImFkZFRvU3RhY2siLCJyZW1vdmVGcm9tU3RhY2siLCJlbCIsIm9uRHJvcENvbXBsZXRlIiwiZXZ0Iiwib3RoZXJPYmoiLCJvdGhlckluZGV4IiwicHV0IiwiZ2V0VGVzdFdpdGhTdGF0dXMiLCJhcnIiLCJnZXRQZXJjZW50IiwidG90YWxsZW4iLCJTdGFja1ZpZXdGYWN0b3J5Iiwic3BsaWNlIiwiZmFpbFRlc3RzIiwicGFzc1Rlc3RzIiwibmV3UGVyY2VudCIsImZhaWxQZXJjZW50IiwicGFzc1BlcmNlbnQiLCIkIiwiJHBwYyIsInBlcmNlbnQiLCJ0b0ZpeGVkIiwiZGVnIiwiYWRkQ2xhc3MiLCJjc3MiLCJodG1sIiwiZGF0ZU9iaiIsImRhdGVTdHJpbmciLCJzYXZlQ2hhbmdlcyIsIlVzZXJzUGFnZUZhY3RvcnkiLCJ0ZXN0b2JqIiwiY2xvbmVkT2JqIiwiXyIsImNsb25lRGVlcCIsImRpcmVjdGl2ZSIsInJlc3RyaWN0Iiwic2NvcGUiLCJsaW5rIiwiaXRlbXMiLCJsYWJlbCIsImF1dGgiLCJpc0xvZ2dlZEluIiwic2V0VXNlciIsInJlbW92ZVVzZXIiLCJydW5UZXN0cyIsInNoaWZ0IiwiUmVzcG9uc2VQb29sIiwicHJvdG90eXBlIiwiZ2V0VmFsdWUiLCJjdXJyZW50VGVzdE5hbWUiLCJrZXlzIiwic3BsaXQiLCJyZWR1Y2UiLCJjdXJyZW50S2V5IiwibmV4dEtleSIsInJlc3BvbnNlUG9vbCIsImludGVycG9sYXRlIiwiaW5wdXQiLCJuZXdWYWxzIiwic2xpY2VQb2ludCIsInNsaWNlZCIsInJlcGxhY2UiLCJqb2luIiwiQXJyYXkiLCJpc0FycmF5IiwibWFrZVJlcXVlc3QiLCJyZXF1ZXN0T2JqIiwibWV0aG9kIiwiaGVhZGVyIiwidGVzdERhdGEiLCJib2R5dHlwZSIsIm5leHRCb2R5UGFpciIsImRhdGFBcnIiLCJmb3JtRGF0YSIsIkZvcm1EYXRhIiwic2V0Iiwia2V5VmFsdWVQYWlyIiwidG9Mb3dlckNhc2UiLCJ0cmFuc2Zvcm1SZXF1ZXN0IiwiaWRlbnRpdHkiLCJjb3B5T2ZUZXN0IiwiaW50ZXJwb2xhdGVkVGVzdCIsInZpZXdlZFRlc3QiLCJpbmNsdWRlVGVzdCIsImlzTmV3VGVzdCIsImNyZWF0ZWQiLCJWYWxpZGF0b3JFZGl0b3JGYWN0b3J5Il0sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUNBQSxPQUFBQyxHQUFBLEdBQUFDLFFBQUFDLE1BQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQSxnQkFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxZQUFBLEVBQUEsZUFBQSxFQUFBLGFBQUEsRUFBQSxRQUFBLENBQUEsQ0FBQTs7QUFFQUYsSUFBQUcsTUFBQSxDQUFBLFVBQUFDLGtCQUFBLEVBQUFDLGlCQUFBLEVBQUFDLGtCQUFBLEVBQUE7O0FBRUE7QUFDQUQsc0JBQUFFLFNBQUEsQ0FBQSxJQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FILHVCQUFBSSxJQUFBLENBQUEsaUJBQUEsRUFBQSxZQUFBO0FBQ0FULGVBQUFVLFFBQUEsQ0FBQUMsTUFBQTtBQUNBLEtBRkE7O0FBSUEsUUFBQUMsZ0JBQUE7QUFDQSxjQUFBLFNBREE7QUFFQSxlQUFBLFNBRkE7QUFHQSxlQUFBLFNBSEE7QUFJQSxlQUFBLFNBSkE7QUFLQSxlQUFBLFNBTEE7QUFNQSxlQUFBLFNBTkE7QUFPQSxlQUFBLFNBUEE7QUFRQSxlQUFBLFNBUkE7QUFTQSxlQUFBLFNBVEE7QUFVQSxlQUFBLFNBVkE7QUFXQSxnQkFBQSxTQVhBO0FBWUEsZ0JBQUEsU0FaQTtBQWFBLGdCQUFBLFNBYkE7QUFjQSxnQkFBQTtBQWRBLEtBQUE7QUFnQkFMLHVCQUNBTSxhQURBLENBQ0EsZUFEQSxFQUVBRCxhQUZBOztBQUlBLFFBQUFFLGVBQUE7QUFDQSxjQUFBLFNBREE7QUFFQSxlQUFBLFNBRkE7QUFHQSxlQUFBLFNBSEE7QUFJQSxlQUFBLFNBSkE7QUFLQSxlQUFBLFNBTEE7QUFNQSxlQUFBLFNBTkE7QUFPQSxlQUFBLFNBUEE7QUFRQSxlQUFBLFNBUkE7QUFTQSxlQUFBLFNBVEE7QUFVQSxlQUFBLFNBVkE7QUFXQSxnQkFBQSxTQVhBO0FBWUEsZ0JBQUEsUUFaQTtBQWFBLGdCQUFBLFNBYkE7QUFjQSxnQkFBQTtBQWRBLEtBQUE7QUFnQkFQLHVCQUNBTSxhQURBLENBQ0EsY0FEQSxFQUVBQyxZQUZBOztBQUlBLFFBQUFDLGFBQUE7QUFDQSxjQUFBLFNBREE7QUFFQSxlQUFBLFNBRkE7QUFHQSxlQUFBLFNBSEE7QUFJQSxlQUFBLFNBSkE7QUFLQSxlQUFBLFNBTEE7QUFNQSxlQUFBLFNBTkE7QUFPQSxlQUFBLFNBUEE7QUFRQSxlQUFBLFNBUkE7QUFTQSxlQUFBLFNBVEE7QUFVQSxlQUFBLFNBVkE7QUFXQSxnQkFBQSxTQVhBO0FBWUEsZ0JBQUEsU0FaQTtBQWFBLGdCQUFBLFNBYkE7QUFjQSxnQkFBQTtBQWRBLEtBQUE7QUFnQkFSLHVCQUNBTSxhQURBLENBQ0EsWUFEQSxFQUVBRSxVQUZBOztBQUlBLFFBQUFDLG1CQUFBO0FBQ0EsY0FBQSxTQURBO0FBRUEsZUFBQSxTQUZBO0FBR0EsZUFBQSxTQUhBO0FBSUEsZUFBQSxTQUpBO0FBS0EsZUFBQSxTQUxBO0FBTUEsZUFBQSxTQU5BO0FBT0EsZUFBQSxTQVBBO0FBUUEsZUFBQSxTQVJBO0FBU0EsZUFBQSxTQVRBO0FBVUEsZUFBQSxTQVZBO0FBV0EsZ0JBQUEsU0FYQTtBQVlBLGdCQUFBLFNBWkE7QUFhQSxnQkFBQSxTQWJBO0FBY0EsZ0JBQUE7QUFkQSxLQUFBO0FBZ0JBVCx1QkFDQU0sYUFEQSxDQUNBLGtCQURBLEVBRUFHLGdCQUZBOztBQUlBVCx1QkFBQVUsS0FBQSxDQUFBLFNBQUEsRUFDQUMsY0FEQSxDQUNBLGVBREEsRUFDQTtBQUNBLG1CQUFBLEtBREE7QUFFQSxpQkFBQSxJQUZBO0FBR0EsaUJBQUEsS0FIQTtBQUlBLGlCQUFBO0FBSkEsS0FEQSxFQU9BQyxhQVBBLENBT0EsY0FQQSxFQVFBQyxXQVJBLENBUUEsWUFSQSxFQVNBQyxpQkFUQSxDQVNBLGtCQVRBO0FBV0EsQ0F0R0E7O0FBd0dBO0FBQ0FwQixJQUFBcUIsR0FBQSxDQUFBLFVBQUFDLFVBQUEsRUFBQUMsV0FBQSxFQUFBQyxNQUFBLEVBQUFDLFNBQUEsRUFBQTtBQUNBSCxlQUFBSSxVQUFBLEdBQUFDLFFBQUFDLEdBQUEsS0FBQSxTQUFBOztBQUVBTCxnQkFBQU0sZUFBQSxHQUFBQyxJQUFBLENBQUEsVUFBQUMsSUFBQSxFQUFBO0FBQ0FULG1CQUFBUyxJQUFBLEdBQUFBLElBQUE7QUFDQSxLQUZBOztBQUlBLFFBQUEsQ0FBQVQsV0FBQVMsSUFBQSxFQUFBUCxPQUFBUSxFQUFBLENBQUEsT0FBQTs7QUFFQTtBQUNBLFFBQUFDLCtCQUFBLFNBQUFBLDRCQUFBLENBQUFDLEtBQUEsRUFBQTtBQUNBLGVBQUFBLE1BQUFDLElBQUEsSUFBQUQsTUFBQUMsSUFBQSxDQUFBQyxZQUFBO0FBQ0EsS0FGQTs7QUFJQTs7QUFFQTtBQUNBO0FBQ0FkLGVBQUFlLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUFDLEtBQUEsRUFBQUMsT0FBQSxFQUFBQyxRQUFBLEVBQUE7QUFDQSxZQUFBLENBQUFQLDZCQUFBTSxPQUFBLENBQUEsRUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFlBQUFoQixZQUFBa0IsZUFBQSxFQUFBLEVBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBSCxjQUFBSSxjQUFBOztBQUVBbkIsb0JBQUFNLGVBQUEsR0FBQUMsSUFBQSxDQUFBLFVBQUFDLElBQUEsRUFBQTtBQUNBWSxvQkFBQUMsR0FBQSxDQUFBLDJDQUFBLEVBQUFiLElBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBQUEsSUFBQSxFQUFBO0FBQ0FULDJCQUFBUyxJQUFBLEdBQUFBLElBQUE7QUFDQVQsMkJBQUF1QixNQUFBLEdBQUFkLEtBQUFlLEdBQUE7QUFDQXRCLHVCQUFBUSxFQUFBLENBQUFPLFFBQUFRLElBQUEsRUFBQVAsUUFBQTtBQUNBLGFBSkEsTUFJQTtBQUNBaEIsdUJBQUFRLEVBQUEsQ0FBQSxPQUFBO0FBQ0E7QUFDQSxTQVpBO0FBY0EsS0E5QkE7QUErQkEsQ0FqREE7O0FDNUdBaEMsSUFBQUcsTUFBQSxDQUFBLFVBQUE2QyxjQUFBLEVBQUE7QUFDQUEsbUJBQUFkLEtBQUEsQ0FBQSxVQUFBLEVBQUE7QUFDQWUsYUFBQSxXQURBO0FBRUFDLHFCQUFBdkIsUUFBQUMsR0FBQSxLQUFBLG9DQUZBO0FBR0F1QixvQkFBQSxjQUhBO0FBSUFDLGlCQUFBO0FBQ0FDLHNCQUFBLGtCQUFBQyxLQUFBLEVBQUFDLFlBQUEsRUFBQWhDLFdBQUEsRUFBQTtBQUNBLHVCQUFBQSxZQUFBTSxlQUFBLEdBQ0FDLElBREEsQ0FDQSxVQUFBQyxJQUFBLEVBQUE7QUFDQSx3QkFBQXlCLGNBQUEsSUFBQUMsSUFBQSxFQUFBO0FBQ0Esd0JBQUFDLE9BQUFGLFlBQUFHLFFBQUEsS0FBQSxHQUFBLEdBQUFILFlBQUFJLFVBQUEsRUFBQSxHQUFBLEdBQUEsR0FBQUosWUFBQUssVUFBQSxFQUFBO0FBQ0EsMkJBQUFQLE1BQUFRLEdBQUEsQ0FBQSw0Q0FBQS9CLEtBQUFlLEdBQUEsQ0FBQTtBQUNBLGlCQUxBLEVBTUFoQixJQU5BLENBTUEsVUFBQWlDLFFBQUEsRUFBQTtBQUNBLDJCQUFBQSxTQUFBNUIsSUFBQTtBQUNBLGlCQVJBLENBQUE7QUFTQTtBQVhBO0FBSkEsS0FBQTtBQWtCQSxDQW5CQTs7QUFzQkE7QUFDQTtBQUNBOzs7QUFHQW5DLElBQUFtRCxVQUFBLENBQUEsY0FBQSxFQUFBLFVBQUFhLElBQUEsRUFBQUMsYUFBQSxFQUFBQyxTQUFBLEVBQUFDLEVBQUEsRUFBQTNDLE1BQUEsRUFBQTRDLE1BQUEsRUFBQUMsUUFBQSxFQUFBaEIsUUFBQSxFQUFBaUIsa0JBQUEsRUFBQS9DLFdBQUEsRUFBQStCLEtBQUEsRUFBQTtBQUFBO0FBQ0E7O0FBRUFjLFdBQUFHLFFBQUEsR0FBQSxFQUFBO0FBQ0FILFdBQUFJLFlBQUEsR0FBQSxDQUFBLENBQUEsRUFBQSxFQUFBLEVBQUEsRUFBQSxFQUFBLEVBQUEsQ0FBQTs7QUFFQUosV0FBQUssT0FBQSxHQUFBO0FBQ0FDLHNCQUFBLElBREE7QUFFQUMscUJBQUEsSUFGQTtBQUdBQyxvQkFBQSxJQUhBO0FBSUFDLG9CQUFBLEtBSkE7QUFLQUMseUJBQUEsS0FMQTtBQU1BQyx1QkFBQSxLQU5BO0FBT0FDLHFCQUFBLElBUEE7QUFRQUMsb0JBQUE7QUFSQSxLQUFBOztBQVdBYixXQUFBYyxLQUFBLEdBQUE7QUFDQUMsZUFBQSxNQURBO0FBRUFDLGVBQUEsRUFGQTtBQUdBQyxjQUFBO0FBSEEsS0FBQTs7QUFNQWpCLFdBQUFrQixLQUFBLEdBQUFqQyxRQUFBO0FBQ0FlLFdBQUFtQixRQUFBLEdBQUEsWUFBQTtBQUNBakIsMkJBQUFqQixRQUFBLEdBQ0F2QixJQURBLENBQ0EsVUFBQUssSUFBQSxFQUFBO0FBQ0FpQyxtQkFBQWtCLEtBQUEsR0FBQW5ELElBQUE7QUFDQWlDLG1CQUFBb0IsVUFBQTtBQUNBLFNBSkE7QUFLQSxLQU5BOztBQVFBcEIsV0FBQXFCLGtCQUFBLEdBQUEsWUFBQTtBQUNBckIsZUFBQUksWUFBQSxHQUFBSixPQUFBSSxZQUFBLEdBQUFrQixTQUFBLEdBQUEsQ0FBQSxDQUFBLEVBQUEsRUFBQSxFQUFBLEVBQUEsQ0FBQTtBQUNBLEtBRkE7O0FBS0F0QixXQUFBdUIsU0FBQSxHQUFBLFlBQUE7QUFDQXZCLGVBQUF3QixPQUFBLEdBQUF2QixTQUFBLFlBQUE7QUFDQTtBQUNBLFNBRkEsRUFFQSxJQUZBLENBQUE7QUFHQSxLQUpBOztBQU1BRCxXQUFBeUIsV0FBQSxHQUFBLFlBQUE7QUFDQSxZQUFBQyxpQkFBQTFCLE9BQUFHLFFBQUEsQ0FBQXdCLEdBQUEsQ0FBQTtBQUFBLG1CQUFBekIsbUJBQUEwQixNQUFBLENBQUFDLElBQUEsQ0FBQTtBQUFBLFNBQUEsQ0FBQTtBQUNBLGVBQUFDLFFBQUFDLEdBQUEsQ0FBQUwsY0FBQSxFQUNBaEUsSUFEQSxDQUNBLFVBQUFzRSxHQUFBLEVBQUE7QUFDQXpELG9CQUFBQyxHQUFBLENBQUF3RCxHQUFBO0FBQ0FoQyxtQkFBQW1CLFFBQUE7QUFDQSxTQUpBLENBQUE7QUFLQSxLQVBBOztBQVNBbkIsV0FBQWlDLFdBQUEsR0FBQSxVQUFBQyxFQUFBLEVBQUE7QUFDQTtBQUNBLFlBQUFDLFVBQUFyQyxVQUFBcUMsT0FBQSxHQUNBQyxLQURBLENBQ0Esa0JBREEsRUFFQUMsU0FGQSxDQUVBLFFBRkEsRUFHQUMsV0FIQSxDQUdBSixFQUhBLEVBSUFLLEVBSkEsQ0FJQSxRQUpBLEVBS0FDLE1BTEEsQ0FLQSxRQUxBLENBQUE7QUFNQTFDLGtCQUFBMkMsSUFBQSxDQUFBTixPQUFBLEVBQUF6RSxJQUFBLENBQUEsWUFBQTtBQUNBc0MsbUJBQUF5QixXQUFBLEdBQ0EvRCxJQURBLENBQ0EsWUFBQTtBQUNBc0MsdUJBQUFrQixLQUFBLEdBQUFsQixPQUFBa0IsS0FBQSxDQUFBd0IsTUFBQSxDQUFBLFVBQUFDLEdBQUEsRUFBQTtBQUNBLDJCQUFBM0MsT0FBQUcsUUFBQSxDQUFBeUMsT0FBQSxDQUFBRCxHQUFBLE1BQUEsQ0FBQSxDQUFBO0FBQ0EsaUJBRkEsQ0FBQTtBQUdBM0MsdUJBQUFHLFFBQUEsR0FBQSxFQUFBO0FBQ0FILHVCQUFBb0IsVUFBQTtBQUNBLGFBUEE7QUFRQSxTQVRBLEVBU0EsWUFBQTtBQUNBcEIsbUJBQUE2QyxNQUFBLEdBQUEsa0JBQUE7QUFDQSxTQVhBO0FBWUEsS0FwQkE7QUFzQkEsQ0ExRUE7O0FDM0JBOztBQUVBakgsSUFBQUcsTUFBQSxDQUFBLFVBQUE2QyxjQUFBLEVBQUE7QUFDQUEsbUJBQUFkLEtBQUEsQ0FBQSxZQUFBLEVBQUE7QUFDQWUsYUFBQSxtQkFEQTtBQUVBQyxxQkFBQXZCLFFBQUFDLEdBQUEsS0FBQSxvQ0FGQTtBQUdBdUIsb0JBQUEsZ0JBSEE7QUFJQUMsaUJBQUE7QUFDQTZDLGtCQUFBLGNBQUEzQyxLQUFBLEVBQUFDLFlBQUEsRUFBQTtBQUNBLHVCQUFBRCxNQUFBUSxHQUFBLENBQUEscUNBQUFQLGFBQUEyRCxNQUFBLEVBQ0FwRixJQURBLENBQ0E7QUFBQSwyQkFBQXFGLElBQUFoRixJQUFBO0FBQUEsaUJBREEsRUFFQUwsSUFGQSxDQUVBLGdCQUFBO0FBQ0FtRSx5QkFBQW1CLFVBQUEsR0FBQUMsS0FBQUMsS0FBQSxDQUFBckIsS0FBQW1CLFVBQUEsQ0FBQTtBQUNBLHdCQUFBLE9BQUFuQixLQUFBbUIsVUFBQSxLQUFBLFFBQUEsRUFBQTtBQUFBbkIsNkJBQUFtQixVQUFBLEdBQUFDLEtBQUFDLEtBQUEsQ0FBQXJCLEtBQUFtQixVQUFBLENBQUE7QUFBQTtBQUNBLDJCQUFBbkIsSUFBQTtBQUNBLGlCQU5BLENBQUE7QUFPQTtBQVRBO0FBSkEsS0FBQTtBQWdCQSxDQWpCQTs7QUFtQkFqRyxJQUFBbUQsVUFBQSxDQUFBLGdCQUFBLEVBQUEsVUFBQWlCLE1BQUEsRUFBQTZCLElBQUEsRUFBQTNCLGtCQUFBLEVBQUFoRCxVQUFBLEVBQUFFLE1BQUEsRUFBQXdDLElBQUEsRUFBQXVELFdBQUEsRUFBQXJELFNBQUEsRUFBQXNELFFBQUEsRUFBQTs7QUFFQXBELFdBQUE2QixJQUFBLEdBQUFBLElBQUE7O0FBRUFzQixnQkFBQUUsYUFBQSxDQUFBeEIsSUFBQSxFQUNBbkUsSUFEQSxDQUNBO0FBQUEsZUFBQXNDLE9BQUFzRCxVQUFBLEdBQUFBLFVBQUE7QUFBQSxLQURBLEVBRUFDLEtBRkEsQ0FFQTNELEtBQUE0RCxLQUZBOztBQUlBLFFBQUEsT0FBQXhELE9BQUE2QixJQUFBLENBQUE0QixJQUFBLENBQUExRixJQUFBLEtBQUEsUUFBQSxFQUFBaUMsT0FBQTZCLElBQUEsQ0FBQTRCLElBQUEsQ0FBQTFGLElBQUEsR0FBQWtGLEtBQUFDLEtBQUEsQ0FBQWxELE9BQUE2QixJQUFBLENBQUE0QixJQUFBLENBQUExRixJQUFBLENBQUE7QUFDQWlDLFdBQUE2QixJQUFBLENBQUFsRSxJQUFBLEdBQUFULFdBQUFTLElBQUE7QUFDQXFDLFdBQUEwRCxVQUFBLEdBQUEsS0FBQTtBQUNBMUQsV0FBQTJELFdBQUEsR0FBQSxLQUFBO0FBQ0EzRCxXQUFBNEQsUUFBQSxHQUFBLEtBQUE7QUFDQTVELFdBQUE2RCxjQUFBLEdBQUEsS0FBQTtBQUNBN0QsV0FBQThELFNBQUEsR0FBQSxDQUFBO0FBQ0E5RCxXQUFBK0QsVUFBQSxHQUFBLENBQUE7QUFDQS9ELFdBQUFnRSxVQUFBLEdBQUEsQ0FBQTtBQUNBaEUsV0FBQWlFLE9BQUEsR0FBQSxVQUFBQyxLQUFBLEVBQUFDLElBQUEsRUFBQTtBQUNBLFlBQUFBLFNBQUEsV0FBQSxFQUFBbkUsT0FBQTZCLElBQUEsQ0FBQW1CLFVBQUEsQ0FBQW9CLElBQUEsQ0FBQSxFQUFBekYsTUFBQXFCLE9BQUE2QixJQUFBLENBQUFsRCxJQUFBLEdBQUEsQ0FBQTBGLE9BQUFyRSxPQUFBNkIsSUFBQSxDQUFBbUIsVUFBQSxDQUFBc0IsTUFBQSxJQUFBLENBQUEsRUFBQUMsUUFBQSxFQUFBLEVBQUFDLE1BQUEsOEJBQUEsRUFBQSxFQUFBLEtBQ0EsSUFBQU4sVUFBQWxFLE9BQUE2QixJQUFBLENBQUFzQyxJQUFBLEVBQUFHLE1BQUEsR0FBQSxDQUFBLElBQUF0RSxPQUFBNkIsSUFBQSxDQUFBc0MsSUFBQSxFQUFBRyxNQUFBLEtBQUEsQ0FBQSxJQUFBSixVQUFBbEUsT0FBQTZCLElBQUEsQ0FBQXNDLElBQUEsRUFBQXBHLElBQUEsQ0FBQXVHLE1BQUEsR0FBQSxDQUFBLElBQUF0RSxPQUFBNkIsSUFBQSxDQUFBc0MsSUFBQSxFQUFBcEcsSUFBQSxDQUFBdUcsTUFBQSxLQUFBLENBQUEsRUFBQTtBQUNBLGdCQUFBSCxTQUFBLFFBQUEsRUFBQTtBQUNBbkUsdUJBQUE4RCxTQUFBO0FBQ0E5RCx1QkFBQTZCLElBQUEsQ0FBQTRDLE1BQUEsQ0FBQUwsSUFBQSxDQUFBLEVBQUE7QUFDQSxhQUhBLE1BSUEsSUFBQUQsU0FBQSxTQUFBLEVBQUE7QUFDQW5FLHVCQUFBK0QsVUFBQTtBQUNBL0QsdUJBQUE2QixJQUFBLENBQUE2QyxPQUFBLENBQUFOLElBQUEsQ0FBQSxFQUFBO0FBQ0EsYUFIQSxNQUlBLElBQUFELFNBQUEsTUFBQSxFQUFBO0FBQ0FuRSx1QkFBQWdFLFVBQUE7QUFDQWhFLHVCQUFBNkIsSUFBQSxDQUFBNEIsSUFBQSxDQUFBMUYsSUFBQSxDQUFBcUcsSUFBQSxDQUFBLEVBQUE7QUFDQTtBQUNBOztBQUVBcEUsZUFBQW9CLFVBQUE7QUFDQSxLQWxCQTs7QUFvQkFwQixXQUFBMkUsUUFBQSxHQUFBLFlBQUE7QUFDQSxZQUFBM0UsT0FBQTZCLElBQUEsQ0FBQTRDLE1BQUEsQ0FBQUgsTUFBQSxLQUFBLENBQUEsRUFBQTtBQUNBdEUsbUJBQUFpRSxPQUFBLENBQUEsQ0FBQSxFQUFBLFFBQUE7QUFDQWpFLG1CQUFBOEQsU0FBQTtBQUNBO0FBQ0E5RCxlQUFBMEQsVUFBQSxHQUFBLENBQUExRCxPQUFBMEQsVUFBQTtBQUNBbkYsZ0JBQUFDLEdBQUEsQ0FBQXdCLE9BQUE2QixJQUFBLENBQUE0QyxNQUFBO0FBQ0EsS0FQQTs7QUFTQXpFLFdBQUE0RSxjQUFBLEdBQUEsWUFBQTtBQUNBLFlBQUE1RSxPQUFBNkIsSUFBQSxDQUFBNkMsT0FBQSxDQUFBSixNQUFBLEtBQUEsQ0FBQSxFQUFBO0FBQ0F0RSxtQkFBQWlFLE9BQUEsQ0FBQSxDQUFBLEVBQUEsU0FBQTtBQUNBakUsbUJBQUErRCxVQUFBO0FBQ0E7QUFDQS9ELGVBQUEyRCxXQUFBLEdBQUEsQ0FBQTNELE9BQUEyRCxXQUFBO0FBQ0EsS0FOQTs7QUFRQTNELFdBQUE2RSxXQUFBLEdBQUEsWUFBQTtBQUNBLFlBQUE3RSxPQUFBNkIsSUFBQSxDQUFBNEIsSUFBQSxDQUFBMUYsSUFBQSxDQUFBdUcsTUFBQSxLQUFBLENBQUEsRUFBQTtBQUNBdEUsbUJBQUFpRSxPQUFBLENBQUEsQ0FBQSxFQUFBLE1BQUE7QUFDQWpFLG1CQUFBZ0UsVUFBQTtBQUNBO0FBQ0FoRSxlQUFBNEQsUUFBQSxHQUFBLENBQUE1RCxPQUFBNEQsUUFBQTtBQUNBLEtBTkE7O0FBUUE1RCxXQUFBOEUsaUJBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQTlFLE9BQUE2QixJQUFBLENBQUFtQixVQUFBLENBQUFzQixNQUFBLEtBQUEsQ0FBQSxFQUFBO0FBQ0F0RSxtQkFBQWlFLE9BQUEsQ0FBQSxDQUFBLEVBQUEsV0FBQTtBQUNBO0FBQ0FqRSxlQUFBNkQsY0FBQSxHQUFBLENBQUE3RCxPQUFBNkQsY0FBQTtBQUNBLEtBTEE7O0FBT0E3RCxXQUFBK0UsVUFBQSxHQUFBLFlBQUE7QUFDQSxZQUFBQyxvQkFBQWhGLE9BQUE2QixJQUFBLENBQUFoRCxHQUFBLENBQUErRCxPQUFBLENBQUEsR0FBQSxDQUFBO0FBQ0EsWUFBQW9DLHNCQUFBLENBQUEsQ0FBQSxFQUFBO0FBQ0FoRixtQkFBQTZCLElBQUEsQ0FBQWhELEdBQUEsR0FBQW1CLE9BQUE2QixJQUFBLENBQUFoRCxHQUFBLENBQUFvRyxTQUFBLENBQUEsQ0FBQSxFQUFBRCxpQkFBQSxDQUFBO0FBQ0E7QUFDQWhGLGVBQUE2QixJQUFBLENBQUFoRCxHQUFBLElBQUEsR0FBQTtBQUNBLFlBQUFxRyxjQUFBLEVBQUE7QUFDQSxhQUFBLElBQUFDLElBQUEsQ0FBQSxFQUFBQSxJQUFBbkYsT0FBQTZCLElBQUEsQ0FBQTRDLE1BQUEsQ0FBQUgsTUFBQSxHQUFBLENBQUEsRUFBQWEsR0FBQSxFQUFBO0FBQ0FELDBCQUFBQSxjQUFBbEYsT0FBQTZCLElBQUEsQ0FBQTRDLE1BQUEsQ0FBQVUsQ0FBQSxFQUFBQyxHQUFBLEdBQUEsR0FBQSxHQUFBcEYsT0FBQTZCLElBQUEsQ0FBQTRDLE1BQUEsQ0FBQVUsQ0FBQSxFQUFBRSxLQUFBLEdBQUEsR0FBQTtBQUNBO0FBQ0FyRixlQUFBNkIsSUFBQSxDQUFBaEQsR0FBQSxHQUFBbUIsT0FBQTZCLElBQUEsQ0FBQWhELEdBQUEsR0FBQXFHLFdBQUE7QUFDQWxGLGVBQUE2QixJQUFBLENBQUFoRCxHQUFBLEdBQUFtQixPQUFBNkIsSUFBQSxDQUFBaEQsR0FBQSxDQUFBeUcsS0FBQSxDQUFBLENBQUEsRUFBQXRGLE9BQUE2QixJQUFBLENBQUFoRCxHQUFBLENBQUF5RixNQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsS0FaQTs7QUFjQXRFLFdBQUF1RixTQUFBLEdBQUEsWUFBQTtBQUNBdkYsZUFBQXdGLE1BQUEsR0FBQSxDQUFBeEYsT0FBQXdGLE1BQUE7QUFDQXhGLGVBQUFvQixVQUFBO0FBQ0EsS0FIQTs7QUFLQXBCLFdBQUF5RixZQUFBLEdBQUEsWUFBQTtBQUNBekYsZUFBQXVGLFNBQUE7QUFDQTVKLGVBQUErSixVQUFBLENBQUExRixPQUFBMkYsUUFBQSxFQUFBLEdBQUE7QUFDQSxLQUhBOztBQUtBM0YsV0FBQTJGLFFBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQXZHLGNBQUEsSUFBQUMsSUFBQSxFQUFBO0FBQ0EsWUFBQUMsT0FBQUYsWUFBQUcsUUFBQSxLQUFBLEdBQUEsR0FBQUgsWUFBQUksVUFBQSxFQUFBLEdBQUEsR0FBQSxHQUFBSixZQUFBSyxVQUFBLEVBQUE7QUFDQWxCLGdCQUFBQyxHQUFBLENBQUEsa0NBQUEsRUFBQWMsSUFBQTtBQUNBWSwyQkFBQTBGLElBQUEsQ0FBQTVGLE9BQUE2QixJQUFBLEVBQ0FuRSxJQURBLENBQ0EsWUFBQTtBQUNBMEIsMEJBQUEsSUFBQUMsSUFBQSxFQUFBO0FBQ0EsZ0JBQUFDLE9BQUFGLFlBQUFHLFFBQUEsS0FBQSxHQUFBLEdBQUFILFlBQUFJLFVBQUEsRUFBQSxHQUFBLEdBQUEsR0FBQUosWUFBQUssVUFBQSxFQUFBO0FBQ0FsQixvQkFBQUMsR0FBQSxDQUFBLG9CQUFBLEVBQUFjLElBQUE7QUFDQWxDLG1CQUFBUSxFQUFBLENBQUEsVUFBQTtBQUNBLFNBTkEsRUFPQTJGLEtBUEEsQ0FPQTNELEtBQUE0RCxLQVBBO0FBUUEsS0FaQTs7QUFjQXhELFdBQUE2RixtQkFBQSxHQUFBLFVBQUFoRSxJQUFBLEVBQUE7QUFDQSxZQUFBLENBQUFBLEtBQUFpRSxNQUFBLEVBQUE7QUFBQUMsa0JBQUEsbUJBQUE7QUFBQSxTQUFBLE1BQ0E7QUFDQTVDLHdCQUFBNkMsa0JBQUEsQ0FBQW5FLElBQUEsRUFDQW5FLElBREEsQ0FDQSxVQUFBb0ksTUFBQSxFQUFBO0FBQ0E5Rix1QkFBQWlHLE9BQUEsR0FBQUgsTUFBQTtBQUNBOUYsdUJBQUFrRyxXQUFBLENBQUFyRSxJQUFBO0FBQ0EsYUFKQSxFQUtBMEIsS0FMQSxDQUtBM0QsS0FBQTRELEtBTEE7QUFNQTtBQUNBLEtBVkE7O0FBWUF4RCxXQUFBa0csV0FBQSxHQUFBLFVBQUFyRSxJQUFBLEVBQUE7QUFDQS9CLGtCQUFBK0IsSUFBQSxHQUFBQSxJQUFBO0FBQ0EvQixrQkFBQW1HLE9BQUEsR0FBQWpHLE9BQUFpRyxPQUFBO0FBQ0EsWUFBQUUsZ0JBQUEsQ0FBQS9DLFNBQUEsSUFBQSxLQUFBQSxTQUFBLElBQUEsQ0FBQSxLQUFBcEQsT0FBQW9HLGdCQUFBO0FBQ0F0RyxrQkFBQTJDLElBQUEsQ0FBQTtBQUNBMUQsd0JBQUFzSCxnQkFEQTtBQUVBdkgseUJBQUF2QixRQUFBQyxHQUFBLEtBQUEsNERBRkE7QUFHQThJLG9CQUFBekssUUFBQTBLLE9BQUEsQ0FBQUMsU0FBQS9DLElBQUEsQ0FIQTtBQUlBO0FBQ0FnRCxpQ0FBQSxJQUxBO0FBTUFDLHdCQUFBUDtBQU5BLFNBQUE7QUFRQSxLQVpBOztBQWNBbkcsV0FBQTJHLE9BQUEsR0FBQSxZQUFBOztBQUVBO0FBQ0F4RCxvQkFBQXlELGlCQUFBO0FBQ0E1RyxlQUFBc0QsVUFBQSxDQUFBdUQsT0FBQSxDQUFBLGdCQUFBO0FBQ0EsZ0JBQUE5SSxPQUFBO0FBQ0FZLHNCQUFBa0QsS0FBQWxELElBREE7QUFFQWdCLDBCQUFBc0QsS0FBQUMsS0FBQSxDQUFBckIsS0FBQWxDLFFBQUE7QUFGQSxhQUFBO0FBSUF3RCx3QkFBQTJELGlCQUFBLENBQUEvSSxJQUFBO0FBQ0EsU0FOQTs7QUFRQSxZQUFBZ0osWUFBQSxFQUFBO0FBQ0EsWUFBQUMsYUFBQSxLQUFBO0FBQ0FoSCxlQUFBaUcsT0FBQSxHQUFBO0FBQ0FnQiw4QkFBQSxFQURBO0FBRUFDLHFCQUFBN0gsS0FBQThILEdBQUE7QUFGQSxTQUFBO0FBSUEsWUFBQSxPQUFBbkgsT0FBQTZCLElBQUEsQ0FBQW1CLFVBQUEsS0FBQSxRQUFBLEVBQUFoRCxPQUFBNkIsSUFBQSxDQUFBbUIsVUFBQSxHQUFBQyxLQUFBQyxLQUFBLENBQUFsRCxPQUFBNkIsSUFBQSxDQUFBbUIsVUFBQSxDQUFBO0FBQ0FoRCxlQUFBNkIsSUFBQSxDQUFBbUIsVUFBQSxDQUFBNkQsT0FBQSxDQUFBLFVBQUFPLElBQUEsRUFBQTtBQUNBLGdCQUFBO0FBQ0Esb0JBQUFBLEtBQUE1QyxJQUFBLENBQUFGLE1BQUEsR0FBQSxFQUFBLEVBQUE7QUFDQXlDLDhCQUFBM0MsSUFBQSxDQUFBaUQsS0FBQUQsS0FBQTVDLElBQUEsQ0FBQTtBQUNBO0FBQ0EsYUFKQSxDQUtBLE9BQUE4QyxHQUFBLEVBQUE7QUFDQXZCLHNCQUFBLG9DQUFBcUIsS0FBQXpJLElBQUEsR0FBQSw0REFBQTtBQUNBcUksNkJBQUEsSUFBQTtBQUNBO0FBRUEsU0FYQTtBQVlBLFlBQUFBLFVBQUEsRUFBQTs7QUFFQTdELG9CQUFBd0QsT0FBQSxDQUFBM0csT0FBQTZCLElBQUEsRUFDQW5FLElBREEsQ0FDQSxVQUFBNkosT0FBQSxFQUFBOztBQUVBdkgsbUJBQUE2QixJQUFBLENBQUFsQyxRQUFBLEdBQUFzRCxLQUFBdUUsU0FBQSxDQUFBRCxPQUFBLENBQUE7O0FBRUEsaUJBQUEsSUFBQXBDLElBQUEsQ0FBQSxFQUFBQSxJQUFBNEIsVUFBQXpDLE1BQUEsRUFBQWEsR0FBQSxFQUFBO0FBQ0Esb0JBQUE7QUFDQW5GLDJCQUFBaUcsT0FBQSxDQUFBZ0IsZ0JBQUEsQ0FBQTdDLElBQUEsQ0FBQSxDQUFBLENBQUEyQyxVQUFBNUIsQ0FBQSxFQUFBb0MsT0FBQSxDQUFBO0FBQ0EsaUJBRkEsQ0FHQSxPQUFBRCxHQUFBLEVBQUE7QUFDQXZCLDBCQUFBLG1EQUFBL0YsT0FBQTZCLElBQUEsQ0FBQW1CLFVBQUEsQ0FBQW1DLENBQUEsRUFBQXhHLElBQUEsR0FBQSx1QkFBQSxHQUFBMkksSUFBQUcsT0FBQSxHQUFBLHlDQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQUF6SCxPQUFBaUcsT0FBQSxDQUFBZ0IsZ0JBQUEsQ0FBQTNDLE1BQUEsRUFBQXRFLE9BQUFpRyxPQUFBLENBQUF5QixXQUFBLEdBQUExSCxPQUFBaUcsT0FBQSxDQUFBZ0IsZ0JBQUEsQ0FBQVUsS0FBQSxDQUFBO0FBQUEsdUJBQUFDLGVBQUE7QUFBQSxhQUFBLENBQUE7QUFDQSxtQkFBQXpFLFlBQUEwRSxXQUFBLENBQUE3SCxPQUFBaUcsT0FBQSxFQUFBakcsT0FBQTZCLElBQUEsQ0FBQTtBQUNBLFNBaEJBLEVBaUJBbkUsSUFqQkEsQ0FpQkEsVUFBQW1FLElBQUEsRUFBQTtBQUNBN0IsbUJBQUE2QixJQUFBLENBQUFpRSxNQUFBLEdBQUFqRSxLQUFBaUUsTUFBQSxDQUFBcEgsR0FBQTtBQUNBc0IsbUJBQUFrRyxXQUFBLENBQUFyRSxJQUFBO0FBQ0EsU0FwQkEsRUFxQkEwQixLQXJCQSxDQXFCQTNELEtBQUE0RCxLQXJCQTtBQXNCQSxLQXZEQTs7QUF5REEsYUFBQTZDLGdCQUFBLENBQUFyRyxNQUFBLEVBQUFGLFNBQUEsRUFBQTtBQUNBRSxlQUFBNkIsSUFBQSxHQUFBL0IsVUFBQStCLElBQUE7QUFDQSxZQUFBLE9BQUE3QixPQUFBNkIsSUFBQSxDQUFBbUIsVUFBQSxLQUFBLFFBQUEsRUFBQTtBQUNBaEQsbUJBQUE2QixJQUFBLENBQUFtQixVQUFBLEdBQUFDLEtBQUFDLEtBQUEsQ0FBQWxELE9BQUE2QixJQUFBLENBQUFtQixVQUFBLENBQUE7QUFDQXpFLG9CQUFBQyxHQUFBLENBQUEsdUJBQUEsRUFBQXdCLE9BQUE2QixJQUFBLENBQUFtQixVQUFBO0FBQ0E7QUFDQXpFLGdCQUFBQyxHQUFBLENBQUEsY0FBQSxFQUFBd0IsT0FBQTZCLElBQUE7QUFDQTdCLGVBQUFpRyxPQUFBLEdBQUFuRyxVQUFBbUcsT0FBQTtBQUNBakcsZUFBQThILElBQUEsR0FBQSxZQUFBO0FBQ0FoSSxzQkFBQWdJLElBQUE7QUFDQSxTQUZBO0FBR0E5SCxlQUFBd0MsTUFBQSxHQUFBLFlBQUE7QUFDQTFDLHNCQUFBMEMsTUFBQTtBQUNBLFNBRkE7QUFHQXhDLGVBQUErSCxNQUFBLEdBQUEsVUFBQUEsTUFBQSxFQUFBO0FBQ0FqSSxzQkFBQWdJLElBQUEsQ0FBQUMsTUFBQTtBQUNBLFNBRkE7QUFHQTtBQUVBLENBak5BOztBQ3JCQW5NLElBQUFHLE1BQUEsQ0FBQSxVQUFBNkMsY0FBQSxFQUFBO0FBQ0FBLG1CQUFBZCxLQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0FlLGFBQUEsT0FEQSxFQUNBO0FBQ0FDLHFCQUFBdkIsUUFBQUMsR0FBQSxLQUFBLDRCQUZBO0FBR0F1QixvQkFBQSxVQUhBO0FBSUFDLGlCQUFBO0FBQ0FyQixrQkFBQSxjQUFBUixXQUFBLEVBQUE7QUFDQSx1QkFBQUEsWUFBQU0sZUFBQSxFQUFBO0FBQ0EsYUFIQTtBQUlBdUssb0JBQUEsZ0JBQUE5SSxLQUFBLEVBQUF2QixJQUFBLEVBQUFzSyxtQkFBQSxFQUFBO0FBQ0EsdUJBQUFBLG9CQUFBQyxhQUFBLENBQUF2SyxJQUFBLENBQUE7QUFDQTtBQU5BO0FBSkEsS0FBQTtBQWFBLENBZEE7O0FBZ0JBL0IsSUFBQW1ELFVBQUEsQ0FBQSxVQUFBLEVBQUEsVUFBQWlCLE1BQUEsRUFBQXJDLElBQUEsRUFBQXFLLE1BQUEsRUFBQTlLLFVBQUEsRUFBQStLLG1CQUFBLEVBQUFySSxJQUFBLEVBQUE7QUFDQUksV0FBQXJDLElBQUEsR0FBQUEsSUFBQTtBQUNBcUMsV0FBQWdJLE1BQUEsR0FBQUEsTUFBQTs7QUFFQTlLLGVBQUFlLEdBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQUMsS0FBQSxFQUFBSCxJQUFBLEVBQUE7QUFDQWlDLGVBQUFnSSxNQUFBLEdBQUFoSSxPQUFBZ0ksTUFBQSxDQUFBdEYsTUFBQSxDQUFBLFVBQUFDLEdBQUEsRUFBQTtBQUNBLG1CQUFBNUUsU0FBQTRFLElBQUFqRSxHQUFBO0FBQ0EsU0FGQSxDQUFBO0FBR0EsS0FKQTs7QUFNQXhCLGVBQUFlLEdBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQUMsS0FBQSxFQUFBaUssT0FBQSxFQUFBOztBQUVBLFlBQUFDLGVBQUFwSSxPQUFBZ0ksTUFBQSxDQUFBdEYsTUFBQSxDQUFBLFVBQUEyRixLQUFBLEVBQUE7QUFDQSxtQkFBQUEsTUFBQTNKLEdBQUEsSUFBQXlKLFFBQUFFLEtBQUEsQ0FBQTNKLEdBQUE7QUFDQSxTQUZBLEVBRUEsQ0FGQSxDQUFBOztBQUlBLFlBQUE0SixjQUFBRixhQUFBbEgsS0FBQSxDQUFBd0IsTUFBQSxDQUFBLFVBQUFiLElBQUEsRUFBQTtBQUNBLG1CQUFBQSxLQUFBbkQsR0FBQSxJQUFBeUosUUFBQXRHLElBQUEsQ0FBQW5ELEdBQUE7QUFDQSxTQUZBLEVBRUEsQ0FGQSxDQUFBOztBQUlBNEosb0JBQUE3RSxJQUFBLENBQUFxQyxNQUFBLEdBQUFxQyxRQUFBdEcsSUFBQSxDQUFBNEIsSUFBQSxDQUFBcUMsTUFBQTtBQUNBLEtBWEE7QUFZQSxDQXRCQTs7QUNoQkFsSyxJQUFBRyxNQUFBLENBQUEsVUFBQTZDLGNBQUEsRUFBQTs7QUFFQUEsbUJBQUFkLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQWUsYUFBQSxHQURBO0FBRUFDLHFCQUFBdkIsUUFBQUMsR0FBQSxLQUFBLDhCQUZBO0FBR0F1QixvQkFBQTtBQUhBLEtBQUE7QUFNQSxDQVJBOztBQVVBbkQsSUFBQW1ELFVBQUEsQ0FBQSxXQUFBLEVBQUEsVUFBQWlCLE1BQUEsRUFBQTdDLFdBQUEsRUFBQUMsTUFBQSxFQUFBRixVQUFBLEVBQUE7QUFDQThDLFdBQUF1SSxLQUFBLEdBQUEsRUFBQTtBQUNBdkksV0FBQXdELEtBQUEsR0FBQSxJQUFBOztBQUVBeEQsV0FBQXdJLFNBQUEsR0FBQSxVQUFBQyxTQUFBLEVBQUE7O0FBRUF6SSxlQUFBd0QsS0FBQSxHQUFBLElBQUE7O0FBRUFyRyxvQkFBQW9MLEtBQUEsQ0FBQUUsU0FBQSxFQUFBL0ssSUFBQSxDQUFBLFVBQUFDLElBQUEsRUFBQTtBQUNBVCx1QkFBQVMsSUFBQSxHQUFBQSxJQUFBO0FBQ0FxQyxtQkFBQW9CLFVBQUE7QUFDQWhFLG1CQUFBUSxFQUFBLENBQUEsTUFBQSxFQUhBLENBR0E7QUFDQSxTQUpBLEVBSUEyRixLQUpBLENBSUEsVUFBQUMsS0FBQSxFQUFBO0FBQ0F4RCxtQkFBQXdELEtBQUEsR0FBQSw0QkFBQTtBQUNBLFNBTkE7QUFRQSxLQVpBO0FBY0EsQ0FsQkE7O0FDVkEsQ0FBQSxZQUFBOztBQUVBOztBQUVBOztBQUNBLFFBQUEsQ0FBQTdILE9BQUFFLE9BQUEsRUFBQSxNQUFBLElBQUE2TSxLQUFBLENBQUEsd0JBQUEsQ0FBQTs7QUFFQSxRQUFBOU0sTUFBQUMsUUFBQUMsTUFBQSxDQUFBLGdCQUFBLEVBQUEsRUFBQSxDQUFBOztBQUVBRixRQUFBK00sT0FBQSxDQUFBLFFBQUEsRUFBQSxZQUFBO0FBQ0EsWUFBQSxDQUFBaE4sT0FBQWlOLEVBQUEsRUFBQSxNQUFBLElBQUFGLEtBQUEsQ0FBQSxzQkFBQSxDQUFBO0FBQ0EsZUFBQS9NLE9BQUFpTixFQUFBLENBQUFqTixPQUFBVSxRQUFBLENBQUF3TSxNQUFBLENBQUE7QUFDQSxLQUhBOztBQUtBO0FBQ0E7QUFDQTtBQUNBak4sUUFBQWtOLFFBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQUMsc0JBQUEsb0JBREE7QUFFQUMscUJBQUEsbUJBRkE7QUFHQUMsdUJBQUEscUJBSEE7QUFJQUMsd0JBQUEsc0JBSkE7QUFLQUMsMEJBQUEsd0JBTEE7QUFNQUMsdUJBQUE7QUFOQSxLQUFBOztBQVNBeE4sUUFBQStNLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUF6TCxVQUFBLEVBQUE2QyxFQUFBLEVBQUFzSixXQUFBLEVBQUE7QUFDQSxZQUFBQyxhQUFBO0FBQ0EsaUJBQUFELFlBQUFGLGdCQURBO0FBRUEsaUJBQUFFLFlBQUFELGFBRkE7QUFHQSxpQkFBQUMsWUFBQUgsY0FIQTtBQUlBLGlCQUFBRyxZQUFBSDtBQUpBLFNBQUE7QUFNQSxlQUFBO0FBQ0FLLDJCQUFBLHVCQUFBNUosUUFBQSxFQUFBO0FBQ0F6QywyQkFBQXNNLFVBQUEsQ0FBQUYsV0FBQTNKLFNBQUFrRCxNQUFBLENBQUEsRUFBQWxELFFBQUE7QUFDQSx1QkFBQUksR0FBQTBKLE1BQUEsQ0FBQTlKLFFBQUEsQ0FBQTtBQUNBO0FBSkEsU0FBQTtBQU1BLEtBYkE7O0FBZUEvRCxRQUFBRyxNQUFBLENBQUEsVUFBQTJOLGFBQUEsRUFBQTtBQUNBQSxzQkFBQUMsWUFBQSxDQUFBdkYsSUFBQSxDQUFBLENBQ0EsV0FEQSxFQUVBLFVBQUF3RixTQUFBLEVBQUE7QUFDQSxtQkFBQUEsVUFBQWxLLEdBQUEsQ0FBQSxpQkFBQSxDQUFBO0FBQ0EsU0FKQSxDQUFBO0FBTUEsS0FQQTs7QUFTQTlELFFBQUFpTyxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEzSyxLQUFBLEVBQUE0SyxPQUFBLEVBQUE1TSxVQUFBLEVBQUFtTSxXQUFBLEVBQUF0SixFQUFBLEVBQUE7O0FBRUEsaUJBQUFnSyxpQkFBQSxDQUFBcEssUUFBQSxFQUFBO0FBQ0EsZ0JBQUE1QixPQUFBNEIsU0FBQTVCLElBQUE7QUFDQStMLG9CQUFBRSxNQUFBLENBQUFqTSxLQUFBa00sRUFBQSxFQUFBbE0sS0FBQUosSUFBQTtBQUNBVCx1QkFBQXNNLFVBQUEsQ0FBQUgsWUFBQU4sWUFBQTtBQUNBLG1CQUFBaEwsS0FBQUosSUFBQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxhQUFBVSxlQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsQ0FBQXlMLFFBQUFuTSxJQUFBO0FBQ0EsU0FGQTs7QUFJQSxhQUFBRixlQUFBLEdBQUEsVUFBQXlNLFVBQUEsRUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBLGdCQUFBLEtBQUE3TCxlQUFBLE1BQUE2TCxlQUFBLElBQUEsRUFBQTtBQUNBLHVCQUFBbkssR0FBQTNELElBQUEsQ0FBQTBOLFFBQUFuTSxJQUFBLENBQUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQkFBQXVCLE1BQUFRLEdBQUEsQ0FBQSwrQkFBQSxFQUFBaEMsSUFBQSxDQUFBcU0saUJBQUEsRUFBQXhHLEtBQUEsQ0FBQSxZQUFBO0FBQ0EsdUJBQUEsSUFBQTtBQUNBLGFBRkEsQ0FBQTtBQUlBLFNBckJBOztBQXVCQSxhQUFBZ0YsS0FBQSxHQUFBLFVBQUE0QixXQUFBLEVBQUE7QUFDQSxtQkFBQWpMLE1BQUFrTCxJQUFBLENBQUEsNkJBQUEsRUFBQUQsV0FBQSxFQUNBek0sSUFEQSxDQUNBcU0saUJBREEsRUFFQXhHLEtBRkEsQ0FFQSxZQUFBO0FBQ0EsdUJBQUF4RCxHQUFBMEosTUFBQSxDQUFBLEVBQUFoQyxTQUFBLDRCQUFBLEVBQUEsQ0FBQTtBQUNBLGFBSkEsQ0FBQTtBQUtBLFNBTkE7O0FBUUEsYUFBQTRDLE1BQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUFuTCxNQUFBUSxHQUFBLENBQUEsOEJBQUEsRUFBQWhDLElBQUEsQ0FBQSxZQUFBO0FBQ0FvTSx3QkFBQVEsT0FBQTtBQUNBcE4sMkJBQUFzTSxVQUFBLENBQUFILFlBQUFKLGFBQUE7QUFDQSxhQUhBLENBQUE7QUFJQSxTQUxBO0FBT0EsS0FyREE7O0FBdURBck4sUUFBQWlPLE9BQUEsQ0FBQSxTQUFBLEVBQUEsVUFBQTNNLFVBQUEsRUFBQW1NLFdBQUEsRUFBQTs7QUFFQSxZQUFBa0IsT0FBQSxJQUFBOztBQUVBck4sbUJBQUFlLEdBQUEsQ0FBQW9MLFlBQUFGLGdCQUFBLEVBQUEsWUFBQTtBQUNBb0IsaUJBQUFELE9BQUE7QUFDQSxTQUZBOztBQUlBcE4sbUJBQUFlLEdBQUEsQ0FBQW9MLFlBQUFILGNBQUEsRUFBQSxZQUFBO0FBQ0FxQixpQkFBQUQsT0FBQTtBQUNBLFNBRkE7O0FBSUEsYUFBQUwsRUFBQSxHQUFBLElBQUE7QUFDQSxhQUFBdE0sSUFBQSxHQUFBLElBQUE7O0FBRUEsYUFBQXFNLE1BQUEsR0FBQSxVQUFBUSxTQUFBLEVBQUE3TSxJQUFBLEVBQUE7QUFDQSxpQkFBQXNNLEVBQUEsR0FBQU8sU0FBQTtBQUNBLGlCQUFBN00sSUFBQSxHQUFBQSxJQUFBO0FBQ0EsU0FIQTs7QUFLQSxhQUFBMk0sT0FBQSxHQUFBLFlBQUE7QUFDQSxpQkFBQUwsRUFBQSxHQUFBLElBQUE7QUFDQSxpQkFBQXRNLElBQUEsR0FBQSxJQUFBO0FBQ0EsU0FIQTtBQUtBLEtBekJBO0FBMkJBLENBcElBOztBQ0FBL0IsSUFBQStNLE9BQUEsQ0FBQSxlQUFBLEVBQUEsVUFBQXpKLEtBQUEsRUFBQTtBQUNBLFFBQUF1TCxnQkFBQSxFQUFBOztBQUVBQSxrQkFBQUMsYUFBQSxHQUFBLFVBQUFDLFFBQUEsRUFBQTtBQUNBLGVBQUF6TCxNQUFBa0wsSUFBQSxDQUFBLDhCQUFBLEVBQUFPLFFBQUEsQ0FBQTtBQUNBLEtBRkE7O0FBSUEsV0FBQUYsYUFBQTtBQUNBLENBUkE7O0FDQUE7O0FBRUE3TyxJQUFBRyxNQUFBLENBQUEsVUFBQTZDLGNBQUEsRUFBQTs7QUFFQUEsbUJBQUFkLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQWUsYUFBQSxTQURBO0FBRUFDLHFCQUFBdkIsUUFBQUMsR0FBQSxLQUFBLGdDQUZBO0FBR0F1QixvQkFBQTtBQUhBLEtBQUE7QUFNQSxDQVJBOztBQVVBbkQsSUFBQW1ELFVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQWlCLE1BQUEsRUFBQTdDLFdBQUEsRUFBQUMsTUFBQSxFQUFBcU4sYUFBQSxFQUFBRyxRQUFBLEVBQUFoTCxJQUFBLEVBQUE7O0FBRUFJLFdBQUF3RCxLQUFBLEdBQUEsSUFBQTs7QUFFQXhELFdBQUE2SyxVQUFBLEdBQUEsVUFBQUMsVUFBQSxFQUFBO0FBQ0EsWUFBQUEsV0FBQUMsU0FBQSxLQUFBRCxXQUFBRSxTQUFBLEVBQUE7QUFDQWhMLG1CQUFBd0QsS0FBQSxHQUFBLDhCQUFBO0FBQ0EsU0FGQSxNQUVBO0FBQ0FpSCwwQkFBQUMsYUFBQSxDQUFBLEVBQUFPLE9BQUFILFdBQUFHLEtBQUEsRUFBQUMsVUFBQUosV0FBQUMsU0FBQSxFQUFBSSxVQUFBTCxXQUFBSyxRQUFBLEVBQUFDLFdBQUFOLFdBQUFNLFNBQUEsRUFBQUMsVUFBQVAsV0FBQU8sUUFBQSxFQUFBQyxTQUFBLEtBQUEsRUFBQSxFQUNBNU4sSUFEQSxDQUNBc0MsT0FBQXVMLGdCQUFBLEVBREEsRUFFQTdOLElBRkEsQ0FFQU4sT0FBQVEsRUFBQSxDQUFBLE9BQUEsQ0FGQSxFQUdBMkYsS0FIQSxDQUdBM0QsS0FBQTRELEtBSEE7QUFJQTtBQUNBLEtBVEE7QUFVQXhELFdBQUF1TCxnQkFBQSxHQUFBLFlBQUE7QUFDQVgsaUJBQUFuSSxJQUFBLENBQ0FtSSxTQUFBWSxNQUFBLEdBQ0FDLFdBREEsQ0FDQSxxQkFEQSxFQUVBQyxRQUZBLENBRUEsY0FGQSxFQUdBQyxTQUhBLENBR0EsSUFIQSxDQURBO0FBTUEsS0FQQTtBQVNBLENBdkJBOztBQ1pBL1AsSUFBQUcsTUFBQSxDQUFBLFVBQUE2QyxjQUFBLEVBQUE7QUFDQUEsbUJBQUFkLEtBQUEsQ0FBQSxjQUFBLEVBQUE7QUFDQWUsYUFBQSxlQURBO0FBRUFDLHFCQUFBdkIsUUFBQUMsR0FBQSxLQUFBLDRDQUZBO0FBR0F1QixvQkFBQSxrQkFIQTtBQUlBQyxpQkFBQTtBQUNBckIsa0JBQUEsY0FBQVIsV0FBQSxFQUFBO0FBQ0EsdUJBQUFBLFlBQUFNLGVBQUEsRUFBQTtBQUNBLGFBSEE7QUFJQXlELG1CQUFBLGVBQUFoQyxLQUFBLEVBQUF2QixJQUFBLEVBQUE7QUFDQSx1QkFBQXVCLE1BQUFRLEdBQUEsQ0FBQSw0Q0FBQS9CLEtBQUFlLEdBQUEsRUFDQWhCLElBREEsQ0FDQTtBQUFBLDJCQUFBcUYsSUFBQWhGLElBQUE7QUFBQSxpQkFEQSxDQUFBO0FBRUE7QUFQQTtBQUpBLEtBQUE7QUFjQSxDQWZBOztBQWtCQW5DLElBQUErTSxPQUFBLENBQUEscUJBQUEsRUFBQSxVQUFBekosS0FBQSxFQUFBaEMsVUFBQSxFQUFBZ0Qsa0JBQUEsRUFBQTtBQUNBLFFBQUEwTCxNQUFBLEVBQUE7QUFDQSxRQUFBQyxlQUFBLEVBQUE7QUFDQUQsUUFBQUUsU0FBQSxHQUFBLFlBQUE7QUFDQSxlQUFBRCxZQUFBO0FBQ0EsS0FGQTtBQUdBRCxRQUFBMUQsYUFBQSxHQUFBLFVBQUF2SyxJQUFBLEVBQUE7QUFDQSxlQUFBdUIsTUFBQVEsR0FBQSxDQUFBLDZDQUFBL0IsS0FBQWUsR0FBQSxFQUNBaEIsSUFEQSxDQUNBLG9CQUFBO0FBQ0E3QixvQkFBQWtRLElBQUEsQ0FBQXBNLFNBQUE1QixJQUFBLEVBQUE4TixZQUFBO0FBQ0EsbUJBQUFBLFlBQUE7QUFDQSxTQUpBLENBQUE7QUFLQSxLQU5BOztBQVFBRCxRQUFBNUIsTUFBQSxHQUFBLFVBQUFnQyxRQUFBLEVBQUE7QUFDQSxZQUFBQyxXQUFBRCxTQUFBOUssS0FBQSxDQUFBUyxHQUFBLENBQUE7QUFBQSxtQkFBQXpCLG1CQUFBOEosTUFBQSxDQUFBbkksSUFBQSxDQUFBO0FBQUEsU0FBQSxDQUFBO0FBQ0EsZUFBQUMsUUFBQUMsR0FBQSxDQUFBa0ssUUFBQSxFQUNBdk8sSUFEQSxDQUNBO0FBQUEsbUJBQUFzTyxTQUFBOUssS0FBQSxHQUFBZ0wsVUFBQTtBQUFBLFNBREEsRUFFQXhPLElBRkEsQ0FFQTtBQUFBLG1CQUFBd0IsTUFBQWtMLElBQUEsQ0FBQSxrQ0FBQSxFQUFBNEIsUUFBQSxDQUFBO0FBQUEsU0FGQSxFQUdBdE8sSUFIQSxDQUdBLGVBQUE7QUFDQVIsdUJBQUFpUCxLQUFBLENBQUEsYUFBQSxFQUFBcEosSUFBQWhGLElBQUE7QUFDQSxtQkFBQWdGLElBQUFoRixJQUFBO0FBQ0EsU0FOQSxDQUFBO0FBT0EsS0FUQTtBQVVBNk4sUUFBQWhLLE1BQUEsR0FBQSxVQUFBb0ssUUFBQSxFQUFBO0FBQ0EsZUFBQTlNLE1BQUEwQyxNQUFBLENBQUEsc0NBQUFvSyxTQUFBdE4sR0FBQSxFQUNBaEIsSUFEQSxDQUNBLGVBQUE7QUFDQW1PLDJCQUFBQSxhQUFBbkosTUFBQSxDQUFBLFVBQUFDLEdBQUEsRUFBQTtBQUNBLHVCQUFBQSxJQUFBakUsR0FBQSxLQUFBcUUsSUFBQWhGLElBQUE7QUFDQSxhQUZBLENBQUE7QUFHQWIsdUJBQUFpUCxLQUFBLENBQUEsYUFBQSxFQUFBcEosSUFBQWhGLElBQUE7QUFDQSxtQkFBQWdGLElBQUFoRixJQUFBO0FBQ0EsU0FQQSxDQUFBO0FBUUEsS0FUQTtBQVVBLFdBQUE2TixHQUFBO0FBQ0EsQ0FuQ0E7O0FBcUNBaFEsSUFBQW1ELFVBQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUFpQixNQUFBLEVBQUE1QyxNQUFBLEVBQUF3QyxJQUFBLEVBQUFzQixLQUFBLEVBQUErRyxtQkFBQSxFQUFBL0ssVUFBQSxFQUFBZ0Qsa0JBQUEsRUFBQTs7QUFFQUYsV0FBQXdGLE1BQUEsR0FBQSxLQUFBO0FBQ0F4RixXQUFBdUYsU0FBQSxHQUFBLFlBQUE7QUFDQXZGLGVBQUF3RixNQUFBLEdBQUEsQ0FBQXhGLE9BQUF3RixNQUFBO0FBQ0F4RixlQUFBb0IsVUFBQTtBQUNBLEtBSEE7O0FBS0FwQixXQUFBa0IsS0FBQSxHQUFBQSxNQUFBd0IsTUFBQSxDQUFBLFVBQUFiLElBQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQUEsS0FBQXdHLEtBQUE7QUFDQSxLQUZBLENBQUE7QUFHQXJJLFdBQUFxSSxLQUFBLEdBQUEsRUFBQTtBQUNBckksV0FBQXFJLEtBQUEsQ0FBQTFLLElBQUEsR0FBQVQsV0FBQVMsSUFBQTtBQUNBcUMsV0FBQXFJLEtBQUEsQ0FBQTVKLE1BQUEsR0FBQXZCLFdBQUFTLElBQUEsQ0FBQWUsR0FBQTtBQUNBc0IsV0FBQXFJLEtBQUEsQ0FBQW5ILEtBQUEsR0FBQSxFQUFBOztBQUdBbEIsV0FBQXlGLFlBQUEsR0FBQSxZQUFBO0FBQ0F6RixlQUFBdUYsU0FBQTtBQUNBNUosZUFBQStKLFVBQUEsQ0FBQTFGLE9BQUFvTSxXQUFBLEVBQUEsR0FBQTtBQUNBLEtBSEE7O0FBS0FwTSxXQUFBb00sV0FBQSxHQUFBLFlBQUE7QUFDQW5FLDRCQUFBK0IsTUFBQSxDQUFBaEssT0FBQXFJLEtBQUEsRUFDQTNLLElBREEsQ0FDQTtBQUFBLG1CQUFBTixPQUFBUSxFQUFBLENBQUEsV0FBQSxFQUFBLEVBQUF5TyxTQUFBaEUsTUFBQTNKLEdBQUEsRUFBQSxDQUFBO0FBQUEsU0FEQSxFQUVBNkUsS0FGQSxDQUVBM0QsS0FBQTRELEtBRkE7QUFHQSxLQUpBO0FBS0F4RCxXQUFBc00sVUFBQSxHQUFBLFVBQUF6SyxJQUFBLEVBQUE7QUFDQTdCLGVBQUFxSSxLQUFBLENBQUFuSCxLQUFBLENBQUFrRCxJQUFBLENBQUF2QyxJQUFBO0FBQ0E3QixlQUFBb0IsVUFBQTtBQUNBLEtBSEE7QUFJQXBCLFdBQUF1TSxlQUFBLEdBQUEsVUFBQVgsR0FBQSxFQUFBO0FBQ0E1TCxlQUFBcUksS0FBQSxDQUFBbkgsS0FBQSxHQUFBbEIsT0FBQXFJLEtBQUEsQ0FBQW5ILEtBQUEsQ0FBQXdCLE1BQUEsQ0FBQSxVQUFBOEosRUFBQSxFQUFBO0FBQ0EsbUJBQUFBLE9BQUFaLEdBQUE7QUFDQSxTQUZBLENBQUE7QUFHQTVMLGVBQUFvQixVQUFBO0FBQ0EsS0FMQTtBQU1BcEIsV0FBQXlNLGNBQUEsR0FBQSxVQUFBdkksS0FBQSxFQUFBMEgsR0FBQSxFQUFBYyxHQUFBLEVBQUE7QUFDQSxZQUFBQyxXQUFBM00sT0FBQXFJLEtBQUEsQ0FBQW5ILEtBQUEsQ0FBQWdELEtBQUEsQ0FBQTtBQUNBLFlBQUEwSSxhQUFBNU0sT0FBQXFJLEtBQUEsQ0FBQW5ILEtBQUEsQ0FBQTBCLE9BQUEsQ0FBQWdKLEdBQUEsQ0FBQTtBQUNBNUwsZUFBQXFJLEtBQUEsQ0FBQW5ILEtBQUEsQ0FBQWdELEtBQUEsSUFBQTBILEdBQUE7QUFDQTVMLGVBQUFxSSxLQUFBLENBQUFuSCxLQUFBLENBQUEwTCxVQUFBLElBQUFELFFBQUE7QUFDQSxLQUxBO0FBTUEsQ0EzQ0E7O0FDdkRBL1EsSUFBQUcsTUFBQSxDQUFBLFVBQUE2QyxjQUFBLEVBQUE7QUFDQUEsbUJBQUFkLEtBQUEsQ0FBQSxXQUFBLEVBQUE7QUFDQWUsYUFBQSxxQkFEQTtBQUVBQyxxQkFBQXZCLFFBQUFDLEdBQUEsS0FBQSxzQ0FGQTtBQUdBdUIsb0JBQUEsZUFIQTtBQUlBQyxpQkFBQTtBQUNBcUosbUJBQUEsZUFBQW5KLEtBQUEsRUFBQUMsWUFBQSxFQUFBO0FBQ0EsdUJBQUFELE1BQUFRLEdBQUEsQ0FBQSxzQ0FBQVAsYUFBQWtOLE9BQUEsRUFDQTNPLElBREEsQ0FDQTtBQUFBLDJCQUFBcUYsSUFBQWhGLElBQUE7QUFBQSxpQkFEQSxDQUFBO0FBRUE7QUFKQTtBQUpBLEtBQUE7QUFXQSxDQVpBOztBQWNBbkMsSUFBQStNLE9BQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUF6SixLQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EwRyxjQUFBLGNBQUFnRyxHQUFBLEVBQUE7QUFDQSxtQkFBQTFNLE1BQUEyTixHQUFBLENBQUEsc0NBQUFqQixJQUFBbE4sR0FBQSxFQUFBa04sR0FBQSxFQUNBbE8sSUFEQSxDQUNBO0FBQUEsdUJBQUFpQyxTQUFBNUIsSUFBQTtBQUFBLGFBREEsQ0FBQTtBQUVBLFNBSkE7QUFLQStPLDJCQUFBLDJCQUFBQyxHQUFBLEVBQUFsSyxNQUFBLEVBQUE7QUFDQSxtQkFBQWtLLElBQUFySyxNQUFBLENBQUEsVUFBQUMsR0FBQSxFQUFBO0FBQ0EsdUJBQUFBLElBQUFjLElBQUEsQ0FBQXFDLE1BQUEsS0FBQWpELE1BQUE7QUFDQSxhQUZBLENBQUE7QUFHQSxTQVRBO0FBVUFtSyxvQkFBQSxvQkFBQUQsR0FBQSxFQUFBRSxRQUFBLEVBQUE7QUFDQSxtQkFBQUYsSUFBQXpJLE1BQUEsR0FBQTJJLFFBQUEsR0FBQSxHQUFBO0FBQ0E7QUFaQSxLQUFBO0FBY0EsQ0FmQTs7QUFpQkFyUixJQUFBbUQsVUFBQSxDQUFBLGVBQUEsRUFBQSxVQUFBaUIsTUFBQSxFQUFBOUMsVUFBQSxFQUFBRSxNQUFBLEVBQUF3QyxJQUFBLEVBQUF5SSxLQUFBLEVBQUE2RSxnQkFBQSxFQUFBL0osV0FBQSxFQUFBO0FBQ0FuRCxXQUFBcUksS0FBQSxHQUFBQSxLQUFBO0FBQ0FySSxXQUFBdU0sZUFBQSxHQUFBLFVBQUFySSxLQUFBLEVBQUE7QUFDQWxFLGVBQUFxSSxLQUFBLENBQUFuSCxLQUFBLENBQUFpTSxNQUFBLENBQUFqSixLQUFBLEVBQUEsQ0FBQTtBQUNBbEUsZUFBQW9CLFVBQUE7QUFDQSxLQUhBO0FBSUFwQixXQUFBb00sV0FBQSxHQUFBLFlBQUE7QUFDQWMseUJBQUF0SCxJQUFBLENBQUE1RixPQUFBcUksS0FBQSxFQUNBM0ssSUFEQSxDQUNBO0FBQUEsbUJBQUFzQyxPQUFBb0IsVUFBQSxFQUFBO0FBQUEsU0FEQSxFQUVBMUQsSUFGQSxDQUVBO0FBQUEsbUJBQUFxSSxNQUFBLDBCQUFBLENBQUE7QUFBQSxTQUZBLEVBR0F4QyxLQUhBLENBR0EzRCxLQUFBNEQsS0FIQTtBQUlBLEtBTEE7O0FBUUF4RCxXQUFBaU0sUUFBQSxHQUFBaUIsaUJBQUFKLGlCQUFBLENBQUE5TSxPQUFBcUksS0FBQSxDQUFBbkgsS0FBQSxFQUFBLEtBQUEsQ0FBQTtBQUNBbEIsV0FBQW9OLFNBQUEsR0FBQUYsaUJBQUFKLGlCQUFBLENBQUE5TSxPQUFBcUksS0FBQSxDQUFBbkgsS0FBQSxFQUFBLFNBQUEsQ0FBQTtBQUNBbEIsV0FBQXFOLFNBQUEsR0FBQUgsaUJBQUFKLGlCQUFBLENBQUE5TSxPQUFBcUksS0FBQSxDQUFBbkgsS0FBQSxFQUFBLFNBQUEsQ0FBQTtBQUNBbEIsV0FBQXNOLFVBQUEsR0FBQUosaUJBQUFGLFVBQUEsQ0FBQWhOLE9BQUFpTSxRQUFBLEVBQUFqTSxPQUFBcUksS0FBQSxDQUFBbkgsS0FBQSxDQUFBb0QsTUFBQSxDQUFBO0FBQ0F0RSxXQUFBdU4sV0FBQSxHQUFBTCxpQkFBQUYsVUFBQSxDQUFBaE4sT0FBQW9OLFNBQUEsRUFBQXBOLE9BQUFxSSxLQUFBLENBQUFuSCxLQUFBLENBQUFvRCxNQUFBLENBQUE7QUFDQXRFLFdBQUF3TixXQUFBLEdBQUFOLGlCQUFBRixVQUFBLENBQUFoTixPQUFBcU4sU0FBQSxFQUFBck4sT0FBQXFJLEtBQUEsQ0FBQW5ILEtBQUEsQ0FBQW9ELE1BQUEsQ0FBQTs7QUFFQW1KLE1BQUEsWUFBQTtBQUNBLFlBQUFDLE9BQUFELEVBQUEscUJBQUEsQ0FBQTtBQUFBLFlBQ0FFLFVBQUEzTixPQUFBd04sV0FBQSxDQUFBSSxPQUFBLENBQUEsQ0FBQSxDQURBO0FBQUEsWUFFQUMsTUFBQSxNQUFBRixPQUFBLEdBQUEsR0FGQTtBQUdBLFlBQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0FELGlCQUFBSSxRQUFBLENBQUEsT0FBQTtBQUNBO0FBQ0FMLFVBQUEsb0JBQUEsRUFBQU0sR0FBQSxDQUFBLFdBQUEsRUFBQSxZQUFBRixHQUFBLEdBQUEsTUFBQTtBQUNBSixVQUFBLG9CQUFBLEVBQUFPLElBQUEsQ0FBQUwsVUFBQSxHQUFBO0FBQ0EsS0FUQTtBQVVBLFFBQUFNLFVBQUEsSUFBQTVPLElBQUEsQ0FBQVcsT0FBQXFJLEtBQUEsQ0FBQW5CLE9BQUEsQ0FBQTtBQUNBbEgsV0FBQWtPLFVBQUEsR0FBQUQsUUFBQTFKLFFBQUEsRUFBQTtBQUdBLENBbkNBOztBQy9CQTNJLElBQUFHLE1BQUEsQ0FBQSxVQUFBNkMsY0FBQSxFQUFBO0FBQ0FBLG1CQUFBZCxLQUFBLENBQUEsV0FBQSxFQUFBO0FBQ0FlLGFBQUEsV0FEQTtBQUVBQyxxQkFBQXZCLFFBQUFDLEdBQUEsS0FBQSxzQ0FGQTtBQUdBO0FBQ0E7QUFDQU8sY0FBQTtBQUNBQywwQkFBQTtBQURBLFNBTEE7QUFRQWUsb0JBQUEsZUFSQTtBQVNBQyxpQkFBQTtBQUNBckIsa0JBQUEsY0FBQVIsV0FBQSxFQUFBO0FBQ0EsdUJBQUFBLFlBQUFNLGVBQUEsRUFBQTtBQUNBO0FBSEE7QUFUQSxLQUFBO0FBZUEsQ0FoQkE7O0FBa0JBN0IsSUFBQStNLE9BQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUF6SixLQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0FpUCxxQkFBQSxxQkFBQXhRLElBQUEsRUFBQTtBQUNBLG1CQUFBdUIsTUFBQTJOLEdBQUEsQ0FBQSxxQ0FBQWxQLEtBQUFlLEdBQUEsRUFBQWYsSUFBQSxFQUNBRCxJQURBLENBQ0E7QUFBQSx1QkFBQXFGLElBQUFoRixJQUFBO0FBQUEsYUFEQSxDQUFBO0FBRUE7QUFKQSxLQUFBO0FBTUEsQ0FQQTs7QUFTQW5DLElBQUFtRCxVQUFBLENBQUEsZUFBQSxFQUFBLFVBQUFhLElBQUEsRUFBQWdMLFFBQUEsRUFBQTVLLE1BQUEsRUFBQXJDLElBQUEsRUFBQXlRLGdCQUFBLEVBQUE7QUFDQXBPLFdBQUFyQyxJQUFBLEdBQUFBLElBQUE7QUFDQXFDLFdBQUFtTyxXQUFBLEdBQUEsWUFBQTtBQUNBQyx5QkFBQUQsV0FBQSxDQUFBbk8sT0FBQXJDLElBQUEsRUFDQUQsSUFEQSxDQUNBO0FBQUEsbUJBQUFzQyxPQUFBdUwsZ0JBQUEsRUFBQTtBQUFBLFNBREEsRUFFQWhJLEtBRkEsQ0FFQTNELEtBQUE0RCxLQUZBO0FBR0EsS0FKQTtBQUtBeEQsV0FBQXVMLGdCQUFBLEdBQUEsWUFBQTtBQUNBWCxpQkFBQW5JLElBQUEsQ0FDQW1JLFNBQUFZLE1BQUEsR0FDQUMsV0FEQSxDQUNBLGdCQURBLEVBRUFDLFFBRkEsQ0FFQSxjQUZBLEVBR0FDLFNBSEEsQ0FHQSxJQUhBLENBREE7QUFNQSxLQVBBO0FBUUEsQ0FmQSxFQWdCQTVQLE1BaEJBLENBZ0JBLFVBQUFHLGtCQUFBLEVBQUE7QUFDQUEsdUJBQUFVLEtBQUEsQ0FBQSxrQkFBQSxFQUFBLFNBQUEsRUFDQUMsY0FEQSxDQUNBLGtCQURBO0FBRUEsQ0FuQkE7O0FDM0JBOztBQUVBakIsSUFBQStNLE9BQUEsQ0FBQSxvQkFBQSxFQUFBLFVBQUF6SixLQUFBLEVBQUEvQixXQUFBLEVBQUE7QUFDQSxRQUFBa1IsVUFBQSxFQUFBOztBQUVBQSxZQUFBckUsTUFBQSxHQUFBLFVBQUE0QixHQUFBLEVBQUE7QUFDQSxZQUFBMEMsWUFBQUMsRUFBQUMsU0FBQSxDQUFBNUMsR0FBQSxDQUFBO0FBQ0EsWUFBQTBDLFVBQUE1UCxHQUFBLEVBQUE7QUFBQSxtQkFBQTRQLFVBQUE1UCxHQUFBO0FBQUE7QUFDQSxZQUFBNFAsVUFBQXRMLFVBQUEsRUFBQTtBQUNBc0wsc0JBQUF0TCxVQUFBLEdBQUFDLEtBQUF1RSxTQUFBLENBQUE4RyxVQUFBdEwsVUFBQSxDQUFBO0FBQ0E7QUFDQXNMLGtCQUFBN0ssSUFBQSxDQUFBMUYsSUFBQSxHQUFBa0YsS0FBQXVFLFNBQUEsQ0FBQThHLFVBQUE3SyxJQUFBLENBQUExRixJQUFBLENBQUE7QUFDQSxlQUFBbUIsTUFBQWtMLElBQUEsQ0FBQSxrQ0FBQSxFQUFBa0UsU0FBQSxFQUNBNVEsSUFEQSxDQUNBLG9CQUFBO0FBQ0EsbUJBQUFpQyxTQUFBNUIsSUFBQTtBQUNBLFNBSEEsQ0FBQTtBQUlBLEtBWEE7QUFZQXNRLFlBQUF6SSxJQUFBLEdBQUEsVUFBQWdHLEdBQUEsRUFBQTtBQUNBLFlBQUEwQyxZQUFBQyxFQUFBQyxTQUFBLENBQUE1QyxHQUFBLENBQUE7QUFDQSxZQUFBMEMsVUFBQXRMLFVBQUEsRUFBQTtBQUNBc0wsc0JBQUF0TCxVQUFBLEdBQUFDLEtBQUF1RSxTQUFBLENBQUE4RyxVQUFBdEwsVUFBQSxDQUFBO0FBQ0E7QUFDQXNMLGtCQUFBN0ssSUFBQSxDQUFBMUYsSUFBQSxHQUFBa0YsS0FBQXVFLFNBQUEsQ0FBQThHLFVBQUE3SyxJQUFBLENBQUExRixJQUFBLENBQUE7QUFDQSxlQUFBbUIsTUFBQTJOLEdBQUEsQ0FBQSxxQ0FBQXlCLFVBQUE1UCxHQUFBLEVBQUE0UCxTQUFBLEVBQ0E1USxJQURBLENBQ0E7QUFBQSxtQkFBQWlDLFNBQUE1QixJQUFBO0FBQUEsU0FEQSxDQUFBO0FBRUEsS0FSQTtBQVNBc1EsWUFBQXpNLE1BQUEsR0FBQSxVQUFBZ0ssR0FBQSxFQUFBO0FBQ0EsZUFBQTFNLE1BQUEwQyxNQUFBLENBQUEscUNBQUFnSyxJQUFBbE4sR0FBQSxDQUFBO0FBQ0EsS0FGQTs7QUFJQTJQLFlBQUFwUCxRQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUE5QixZQUFBTSxlQUFBLEdBQ0FDLElBREEsQ0FDQSxVQUFBQyxJQUFBLEVBQUE7QUFDQSxtQkFBQXVCLE1BQUFRLEdBQUEsQ0FBQSw0Q0FBQS9CLEtBQUFlLEdBQUEsQ0FBQTtBQUNBLFNBSEEsRUFJQWhCLElBSkEsQ0FJQSxVQUFBaUMsUUFBQSxFQUFBO0FBQ0EsbUJBQUFBLFNBQUE1QixJQUFBO0FBQ0EsU0FOQSxDQUFBO0FBT0EsS0FSQTs7QUFVQSxXQUFBc1EsT0FBQTtBQUNBLENBdkNBOztBQ0ZBelMsSUFBQTZTLFNBQUEsQ0FBQSxRQUFBLEVBQUEsVUFBQXZSLFVBQUEsRUFBQUMsV0FBQSxFQUFBa00sV0FBQSxFQUFBak0sTUFBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBc1Isa0JBQUEsR0FEQTtBQUVBQyxlQUFBLEVBRkE7QUFHQTdQLHFCQUFBdkIsUUFBQUMsR0FBQSxLQUFBLGtEQUhBO0FBSUFvUixjQUFBLGNBQUFELEtBQUEsRUFBQTs7QUFFQUEsa0JBQUFFLEtBQUEsR0FBQSxDQUNBLEVBQUFDLE9BQUEsTUFBQSxFQUFBaFIsT0FBQSxNQUFBLEVBREEsRUFFQSxFQUFBZ1IsT0FBQSxPQUFBLEVBQUFoUixPQUFBLE9BQUEsRUFGQSxFQUdBLEVBQUFnUixPQUFBLGVBQUEsRUFBQWhSLE9BQUEsTUFBQSxFQUhBLEVBSUEsRUFBQWdSLE9BQUEsY0FBQSxFQUFBaFIsT0FBQSxhQUFBLEVBQUFpUixNQUFBLElBQUEsRUFKQSxFQUtBLEVBQUFELE9BQUEsVUFBQSxFQUFBaFIsT0FBQSxhQUFBLEVBQUFpUixNQUFBLElBQUEsRUFMQSxDQUFBOztBQVNBSixrQkFBQWhSLElBQUEsR0FBQSxJQUFBOztBQUVBZ1Isa0JBQUFLLFVBQUEsR0FBQSxZQUFBO0FBQ0EsdUJBQUE3UixZQUFBa0IsZUFBQSxFQUFBO0FBQ0EsYUFGQTs7QUFJQXNRLGtCQUFBdEUsTUFBQSxHQUFBLFlBQUE7QUFDQWxOLDRCQUFBa04sTUFBQSxHQUFBM00sSUFBQSxDQUFBLFlBQUE7QUFDQU4sMkJBQUFRLEVBQUEsQ0FBQSxPQUFBO0FBQ0EsaUJBRkE7QUFHQSxhQUpBOztBQU1BLGdCQUFBcVIsVUFBQSxTQUFBQSxPQUFBLEdBQUE7QUFDQTlSLDRCQUFBTSxlQUFBLEdBQUFDLElBQUEsQ0FBQSxVQUFBQyxJQUFBLEVBQUE7QUFDQWdSLDBCQUFBaFIsSUFBQSxHQUFBQSxJQUFBO0FBQ0EsaUJBRkE7QUFHQSxhQUpBOztBQU1BLGdCQUFBdVIsYUFBQSxTQUFBQSxVQUFBLEdBQUE7QUFDQVAsc0JBQUFoUixJQUFBLEdBQUEsSUFBQTtBQUNBLGFBRkE7O0FBSUFzUjs7QUFFQS9SLHVCQUFBZSxHQUFBLENBQUFvTCxZQUFBTixZQUFBLEVBQUFrRyxPQUFBO0FBQ0EvUix1QkFBQWUsR0FBQSxDQUFBb0wsWUFBQUosYUFBQSxFQUFBaUcsVUFBQTtBQUNBaFMsdUJBQUFlLEdBQUEsQ0FBQW9MLFlBQUFILGNBQUEsRUFBQWdHLFVBQUE7QUFFQTs7QUEzQ0EsS0FBQTtBQStDQSxDQWhEQTs7QUNBQXRULElBQUE2UyxTQUFBLENBQUEsV0FBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0FDLGtCQUFBLEdBREE7QUFFQUMsZUFBQTtBQUNBdEcsbUJBQUE7QUFEQSxTQUZBO0FBS0F2SixxQkFBQXZCLFFBQUFDLEdBQUEsS0FBQSx3REFMQTtBQU1BdUIsb0JBQUE7QUFOQSxLQUFBO0FBUUEsQ0FUQTs7QUFXQW5ELElBQUFtRCxVQUFBLENBQUEsZUFBQSxFQUFBLFVBQUFpQixNQUFBLEVBQUE5QyxVQUFBLEVBQUErSyxtQkFBQSxFQUFBbkksU0FBQSxFQUFBcUQsV0FBQSxFQUFBdkQsSUFBQSxFQUFBc04sZ0JBQUEsRUFBQTs7QUFFQWxOLFdBQUF3RixNQUFBLEdBQUEsS0FBQTtBQUNBeEYsV0FBQXVGLFNBQUEsR0FBQSxZQUFBO0FBQ0F2RixlQUFBd0YsTUFBQSxHQUFBLENBQUF4RixPQUFBd0YsTUFBQTtBQUNBeEYsZUFBQW9CLFVBQUE7QUFDQSxLQUhBOztBQUtBcEIsV0FBQWlDLFdBQUEsR0FBQSxVQUFBb0csS0FBQSxFQUFBO0FBQ0EsWUFBQWxHLFVBQUFyQyxVQUFBcUMsT0FBQSxHQUNBQyxLQURBLENBQ0Esa0JBREEsRUFFQUMsU0FGQSxDQUVBLFFBRkEsRUFHQUUsRUFIQSxDQUdBLFFBSEEsRUFJQUMsTUFKQSxDQUlBLFFBSkEsQ0FBQTtBQUtBMUMsa0JBQUEyQyxJQUFBLENBQUFOLE9BQUEsRUFBQXpFLElBQUEsQ0FBQSxZQUFBO0FBQ0EsbUJBQUF1SyxvQkFBQXJHLE1BQUEsQ0FBQXlHLEtBQUEsQ0FBQTtBQUNBLFNBRkEsRUFFQSxZQUFBO0FBQ0FySSxtQkFBQTZDLE1BQUEsR0FBQSxrQkFBQTtBQUNBLFNBSkE7QUFLQSxLQVhBOztBQWFBN0MsV0FBQW1QLFFBQUEsR0FBQSxVQUFBOUcsS0FBQSxFQUFBO0FBQ0FySSxlQUFBdUYsU0FBQTtBQUNBLFlBQUFyRSxRQUFBbUgsTUFBQW5ILEtBQUEsQ0FBQW9FLEtBQUEsRUFBQTs7QUFFQTtBQUNBLFlBQUE2SixXQUFBLFNBQUFBLFFBQUEsQ0FBQWpPLEtBQUEsRUFBQTtBQUNBLGdCQUFBLENBQUFBLE1BQUFvRCxNQUFBLEVBQUE7QUFDQW5CLDRCQUFBeUQsaUJBQUE7QUFDQXlCLHNCQUFBbkIsT0FBQSxHQUFBLElBQUE3SCxJQUFBLEVBQUE7QUFDQSx1QkFBQTZOLGlCQUFBdEgsSUFBQSxDQUFBeUMsS0FBQSxFQUNBOUUsS0FEQSxDQUNBM0QsS0FBQTRELEtBREEsQ0FBQTtBQUVBO0FBQ0EsZ0JBQUEzQixPQUFBWCxNQUFBa08sS0FBQSxFQUFBO0FBQ0EsZ0JBQUFySSxZQUFBLEVBQUE7QUFDQSxnQkFBQUMsYUFBQSxLQUFBO0FBQ0EsZ0JBQUFmLFVBQUE7QUFDQWdCLGtDQUFBLEVBREE7QUFFQUMseUJBQUE3SCxLQUFBOEgsR0FBQTtBQUZBLGFBQUE7QUFJQSxnQkFBQSxPQUFBdEYsS0FBQW1CLFVBQUEsS0FBQSxRQUFBLEVBQUFuQixLQUFBbUIsVUFBQSxHQUFBQyxLQUFBQyxLQUFBLENBQUFyQixLQUFBbUIsVUFBQSxDQUFBO0FBQ0EsZ0JBQUEsT0FBQW5CLEtBQUFtQixVQUFBLEtBQUEsUUFBQSxFQUFBbkIsS0FBQW1CLFVBQUEsR0FBQUMsS0FBQUMsS0FBQSxDQUFBckIsS0FBQW1CLFVBQUEsQ0FBQTtBQUNBbkIsaUJBQUFtQixVQUFBLENBQUE2RCxPQUFBLENBQUEsVUFBQU8sSUFBQSxFQUFBO0FBQ0Esb0JBQUE7QUFDQSx3QkFBQUEsS0FBQTVDLElBQUEsQ0FBQUYsTUFBQSxHQUFBLEVBQUEsRUFBQTtBQUNBeUMsa0NBQUEzQyxJQUFBLENBQUFpRCxLQUFBRCxLQUFBNUMsSUFBQSxDQUFBO0FBQ0E7QUFDQSxpQkFKQSxDQUtBLE9BQUE4QyxHQUFBLEVBQUE7QUFDQXZCLDBCQUFBLG9DQUFBcUIsS0FBQXpJLElBQUEsR0FBQSw0REFBQTtBQUNBcUksaUNBQUEsSUFBQTtBQUNBO0FBQ0EsYUFWQTtBQVdBLGdCQUFBQSxVQUFBLEVBQUE7QUFDQTdELHdCQUFBd0QsT0FBQSxDQUFBOUUsSUFBQSxFQUNBbkUsSUFEQSxDQUNBLFVBQUE2SixPQUFBLEVBQUE7O0FBRUExRixxQkFBQWxDLFFBQUEsR0FBQXNELEtBQUF1RSxTQUFBLENBQUFELE9BQUEsQ0FBQTs7QUFFQXBFLDRCQUFBMkQsaUJBQUEsQ0FBQTtBQUNBbkksMEJBQUFrRCxLQUFBbEQsSUFEQTtBQUVBZ0IsOEJBQUE0SDtBQUZBLGlCQUFBOztBQUtBLHFCQUFBLElBQUFwQyxJQUFBLENBQUEsRUFBQUEsSUFBQTRCLFVBQUF6QyxNQUFBLEVBQUFhLEdBQUEsRUFBQTtBQUNBLHdCQUFBO0FBQ0FjLGdDQUFBZ0IsZ0JBQUEsQ0FBQTdDLElBQUEsQ0FBQSxDQUFBLENBQUEyQyxVQUFBNUIsQ0FBQSxFQUFBb0MsT0FBQSxDQUFBO0FBQ0EscUJBRkEsQ0FHQSxPQUFBRCxHQUFBLEVBQUE7QUFDQXZCLDhCQUFBLG1EQUFBbEUsS0FBQW1CLFVBQUEsQ0FBQW1DLENBQUEsRUFBQXhHLElBQUEsR0FBQSx1QkFBQSxHQUFBMkksSUFBQUcsT0FBQSxHQUFBLHlDQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQUF4QixRQUFBZ0IsZ0JBQUEsQ0FBQTNDLE1BQUEsRUFBQTJCLFFBQUF5QixXQUFBLEdBQUF6QixRQUFBZ0IsZ0JBQUEsQ0FBQVUsS0FBQSxDQUFBO0FBQUEsMkJBQUFDLGVBQUE7QUFBQSxpQkFBQSxDQUFBO0FBQ0EsdUJBQUF6RSxZQUFBMEUsV0FBQSxDQUFBNUIsT0FBQSxFQUFBcEUsSUFBQSxDQUFBO0FBQ0EsYUFyQkEsRUFzQkFuRSxJQXRCQSxDQXNCQSx1QkFBQTtBQUNBLG9CQUFBeUssVUFBQTtBQUNBdEcsMEJBQUF5RyxXQURBO0FBRUFELDJCQUFBQTtBQUZBLGlCQUFBO0FBSUFuTCwyQkFBQWlQLEtBQUEsQ0FBQSxZQUFBLEVBQUFoRSxPQUFBO0FBQ0FnSCx5QkFBQWpPLEtBQUE7QUFDQSxhQTdCQSxFQThCQXFDLEtBOUJBLENBOEJBM0QsS0FBQTRELEtBOUJBO0FBK0JBLFNBM0RBO0FBNERBMkwsaUJBQUFqTyxLQUFBO0FBQ0F2RixlQUFBK0osVUFBQSxDQUFBMUYsT0FBQXVGLFNBQUEsRUFBQSxHQUFBO0FBQ0EsS0FuRUE7QUFvRUEsQ0F6RkE7O0FDWEE7O0FBRUEzSixJQUFBNlMsU0FBQSxDQUFBLFNBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQTtBQUNBQyxrQkFBQSxHQURBO0FBRUE1UCxxQkFBQXZCLFFBQUFDLEdBQUEsS0FBQSxvREFGQTtBQUdBdUIsb0JBQUE7QUFIQSxLQUFBO0FBS0EsQ0FOQTs7QUFRQW5ELElBQUFtRCxVQUFBLENBQUEsYUFBQSxFQUFBLFVBQUFpQixNQUFBLEVBQUFKLElBQUEsRUFBQTFDLFVBQUEsRUFBQStLLG1CQUFBLEVBQUE5SyxXQUFBLEVBQUE7O0FBRUFBLGdCQUFBTSxlQUFBLEdBQUFDLElBQUEsQ0FBQSxVQUFBQyxJQUFBLEVBQUE7QUFDQXFDLGVBQUFyQyxJQUFBLEdBQUFBLElBQUE7QUFDQSxLQUZBOztBQUlBLFFBQUFxQyxPQUFBckMsSUFBQSxFQUFBO0FBQ0FzSyw0QkFBQUMsYUFBQSxDQUFBbEksT0FBQXJDLElBQUEsRUFDQUQsSUFEQSxDQUNBLFVBQUFzSyxNQUFBLEVBQUE7QUFDQWhJLG1CQUFBZ0ksTUFBQSxHQUFBQSxNQUFBO0FBQ0EsU0FIQTtBQUlBOztBQUVBOUssZUFBQWUsR0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBQyxLQUFBLEVBQUFILElBQUEsRUFBQTtBQUNBaUMsZUFBQWdJLE1BQUEsQ0FBQTVELElBQUEsQ0FBQXJHLElBQUE7QUFDQWlDLGVBQUFvQixVQUFBO0FBQ0EsS0FIQTs7QUFLQWxFLGVBQUFlLEdBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQUMsS0FBQSxFQUFBSCxJQUFBLEVBQUE7QUFDQWlDLGVBQUFnSSxNQUFBLEdBQUFoSSxPQUFBZ0ksTUFBQSxDQUFBdEYsTUFBQSxDQUFBLFVBQUFDLEdBQUEsRUFBQTtBQUNBLG1CQUFBNUUsU0FBQTRFLElBQUFqRSxHQUFBO0FBQ0EsU0FGQSxDQUFBO0FBR0EsS0FKQTtBQUtBLENBdkJBOztBQ1ZBOztBQUVBOUMsSUFBQUcsTUFBQSxDQUFBLFVBQUE2QyxjQUFBLEVBQUE7QUFDQUEsbUJBQUFkLEtBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQWUsYUFBQSxjQURBO0FBRUFDLHFCQUFBdkIsUUFBQUMsR0FBQSxLQUFBLHdEQUZBO0FBR0F1QixvQkFBQTtBQUhBLEtBQUE7QUFLQSxDQU5BOztBQVFBbkQsSUFBQTZTLFNBQUEsQ0FBQSxhQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQUMsa0JBQUEsR0FEQTtBQUVBNVAscUJBQUF2QixRQUFBQyxHQUFBLEtBQUE7QUFGQSxLQUFBO0FBSUEsQ0FMQTs7QUFPQTVCLElBQUErTSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUF6SixLQUFBLEVBQUFVLElBQUEsRUFBQU0sa0JBQUEsRUFBQTs7QUFFQSxRQUFBbVAsZUFBQSxTQUFBQSxZQUFBLEdBQUEsQ0FBQSxDQUFBOztBQUVBQSxpQkFBQUMsU0FBQSxDQUFBQyxRQUFBLEdBQUEsVUFBQW5LLEdBQUEsRUFBQTtBQUFBO0FBQ0EsWUFBQW9LLGtCQUFBLEtBQUFBLGVBQUE7QUFDQSxZQUFBQyxPQUFBckssSUFBQXNLLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FGQSxDQUVBO0FBQ0EsZUFBQUQsS0FBQUUsTUFBQSxDQUFBLFVBQUFDLFVBQUEsRUFBQUMsT0FBQSxFQUFBO0FBQUE7O0FBRUEsZ0JBQUE7QUFDQSx1QkFBQUQsV0FBQUMsT0FBQSxDQUFBO0FBQ0EsYUFGQSxDQUdBLE9BQUFyTSxLQUFBLEVBQUE7QUFDQXVDLHNCQUFBLDJDQUFBWCxHQUFBLEdBQUEsbUJBQUEsR0FBQW9LLGVBQUEsR0FBQSx5R0FBQTtBQUNBO0FBRUEsU0FUQSxFQVNBTSxZQVRBLENBQUE7QUFVQSxLQWJBOztBQWVBLFFBQUFBLGVBQUEsSUFBQVQsWUFBQSxFQUFBOztBQUVBLFFBQUFVLGNBQUEsU0FBQUEsV0FBQSxDQUFBQyxLQUFBLEVBQUE7O0FBRUEsWUFBQSxPQUFBQSxLQUFBLEtBQUEsUUFBQSxFQUFBO0FBQUE7QUFBQTtBQUNBLG9CQUFBQSxNQUFBcE4sT0FBQSxDQUFBLElBQUEsTUFBQSxDQUFBLENBQUEsRUFBQTtBQUFBLDJCQUFBb047QUFBQTtBQUNBLG9CQUFBQyxVQUFBLEVBQUE7O0FBRUFELHNCQUFBTixLQUFBLENBQUEsSUFBQSxFQUNBN0ksT0FEQSxDQUNBLFVBQUFPLElBQUEsRUFBQTtBQUNBLHdCQUFBQSxLQUFBeEUsT0FBQSxDQUFBLElBQUEsTUFBQSxDQUFBLENBQUEsRUFBQTtBQUNBLDRCQUFBc04sYUFBQTlJLEtBQUF4RSxPQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsNEJBQUF1TixTQUFBL0ksS0FBQTlCLEtBQUEsQ0FBQTRLLFVBQUEsQ0FBQTtBQUNBRCxnQ0FBQTdMLElBQUEsQ0FBQWdELEtBQUFnSixPQUFBLENBQUFELE1BQUEsRUFBQUwsYUFBQVAsUUFBQSxDQUFBWSxPQUFBbEwsU0FBQSxDQUFBLENBQUEsQ0FBQSxDQUFBLENBQUE7QUFDQSxxQkFKQSxNQUlBZ0wsUUFBQTdMLElBQUEsQ0FBQWdELElBQUE7QUFDQSxpQkFQQTs7QUFTQTtBQUFBLHVCQUFBNkksUUFBQUksSUFBQSxDQUFBLEVBQUE7QUFBQSxrQkFiQSxDQWFBO0FBYkE7O0FBQUE7QUFjQSxTQWRBLE1BZ0JBLElBQUFDLE1BQUFDLE9BQUEsQ0FBQVAsS0FBQSxDQUFBLEVBQUE7QUFDQSxtQkFBQUEsTUFBQXJPLEdBQUEsQ0FBQW9PLFdBQUEsQ0FBQTtBQUNBLFNBRkEsTUFJQSxJQUFBLFFBQUFDLEtBQUEseUNBQUFBLEtBQUEsT0FBQSxRQUFBLEVBQUE7QUFDQSxpQkFBQSxJQUFBNUssR0FBQSxJQUFBNEssS0FBQSxFQUFBO0FBQ0FBLHNCQUFBNUssR0FBQSxJQUFBMkssWUFBQUMsTUFBQTVLLEdBQUEsQ0FBQSxDQUFBO0FBQ0E7QUFDQSxtQkFBQTRLLEtBQUE7QUFDQSxTQUxBLE1BT0EsT0FBQUEsS0FBQTtBQUNBLEtBOUJBOztBQWdDQSxRQUFBUSxjQUFBLFNBQUFBLFdBQUEsQ0FBQTNPLElBQUEsRUFBQTs7QUFFQSxZQUFBNE8sYUFBQSxFQUFBOztBQUVBQSxtQkFBQUMsTUFBQSxHQUFBN08sS0FBQTZPLE1BQUE7QUFDQUQsbUJBQUE1UixHQUFBLEdBQUFnRCxLQUFBaEQsR0FBQTs7QUFFQSxZQUFBZ0QsS0FBQTZDLE9BQUEsQ0FBQUosTUFBQSxFQUFBO0FBQ0FtTSx1QkFBQS9MLE9BQUEsR0FBQSxFQUFBO0FBQ0E3QyxpQkFBQTZDLE9BQUEsQ0FBQW1DLE9BQUEsQ0FBQSxrQkFBQTtBQUNBLG9CQUFBOEosV0FBQSxJQUFBLEVBQUFGLFdBQUEvTCxPQUFBLENBQUFpTSxPQUFBdkwsR0FBQSxJQUFBcUwsV0FBQS9MLE9BQUEsQ0FBQWlNLE9BQUF0TCxLQUFBLENBQUE7QUFDQSxhQUZBO0FBR0E7QUFDQSxZQUFBdUwsaUJBQUE7QUFDQSxZQUFBLE9BQUEvTyxLQUFBNEIsSUFBQSxDQUFBMUYsSUFBQSxLQUFBLFFBQUEsRUFBQThELEtBQUE0QixJQUFBLENBQUExRixJQUFBLEdBQUFrRixLQUFBQyxLQUFBLENBQUFyQixLQUFBNEIsSUFBQSxDQUFBMUYsSUFBQSxDQUFBO0FBQ0E2UyxtQkFBQS9PLEtBQUE0QixJQUFBLENBQUExRixJQUFBOztBQUVBLFlBQUE4RCxLQUFBNEIsSUFBQSxDQUFBb04sUUFBQSxLQUFBLEtBQUEsRUFBQTtBQUNBSix1QkFBQTFTLElBQUEsR0FBQTZTLFNBQUFqQixNQUFBLENBQUEsVUFBQXhILE9BQUEsRUFBQTJJLFlBQUEsRUFBQTtBQUNBM0ksd0JBQUEySSxhQUFBMUwsR0FBQSxJQUFBMEwsYUFBQXpMLEtBQUE7QUFDQSx1QkFBQThDLE9BQUE7QUFDQSxhQUhBLEVBR0EsRUFIQSxDQUFBO0FBSUE7O0FBRUEsWUFBQXRHLEtBQUE0QixJQUFBLENBQUFvTixRQUFBLEtBQUEsdUJBQUEsRUFBQTtBQUNBSix1QkFBQTFTLElBQUEsR0FBQTZTLFNBQUFqQixNQUFBLENBQUEsVUFBQW9CLE9BQUEsRUFBQUQsWUFBQSxFQUFBO0FBQ0FDLHdCQUFBM00sSUFBQSxDQUFBME0sYUFBQTFMLEdBQUEsR0FBQSxHQUFBLEdBQUEwTCxhQUFBekwsS0FBQTtBQUNBLHVCQUFBMEwsT0FBQTtBQUNBLGFBSEEsRUFHQSxFQUhBLEVBR0FWLElBSEEsQ0FHQSxHQUhBLENBQUE7QUFJQUksdUJBQUEvTCxPQUFBLENBQUEsY0FBQSxJQUFBLG1DQUFBO0FBQ0E7QUFDQSxZQUFBc00saUJBQUE7QUFDQSxZQUFBblAsS0FBQTRCLElBQUEsQ0FBQW9OLFFBQUEsS0FBQSxXQUFBLEVBQUE7QUFDQUcsdUJBQUEsSUFBQUMsUUFBQSxFQUFBO0FBQ0FMLHFCQUFBL0osT0FBQSxDQUFBO0FBQUEsdUJBQUFtSyxTQUFBRSxHQUFBLENBQUFDLGFBQUEvTCxHQUFBLEVBQUErTCxhQUFBOUwsS0FBQSxDQUFBO0FBQUEsYUFBQTtBQUNBb0wsdUJBQUEvTCxPQUFBLENBQUEsY0FBQSxJQUFBcEQsU0FBQTtBQUNBOztBQUVBLFlBQUE7O0FBRUEsZ0JBQUFPLEtBQUE0QixJQUFBLENBQUFvTixRQUFBLEtBQUEsV0FBQSxFQUFBO0FBQ0EsdUJBQUEzUixNQUFBdVIsV0FBQUMsTUFBQSxDQUFBVSxXQUFBLEVBQUEsRUFBQVgsV0FBQTVSLEdBQUEsRUFBQW1TLFFBQUEsRUFBQTtBQUNBSyxzQ0FBQXhWLFFBQUF5VixRQURBO0FBRUE1TSw2QkFBQStMLFdBQUEvTDtBQUZBLGlCQUFBLEVBSUFoSCxJQUpBLENBSUE7QUFBQSwyQkFBQWlDLFNBQUE1QixJQUFBO0FBQUEsaUJBSkEsQ0FBQTtBQUtBLGFBTkEsTUFNQTtBQUNBLHVCQUFBbUIsTUFBQXVSLFVBQUEsRUFDQS9TLElBREEsQ0FDQTtBQUFBLDJCQUFBaUMsU0FBQTVCLElBQUE7QUFBQSxpQkFEQSxDQUFBO0FBRUE7QUFDQSxTQVpBLENBYUEsT0FBQXlGLEtBQUEsRUFBQTtBQUNBdUMsa0JBQUEsb0JBQUErSixhQUFBTixlQUFBLEdBQUEsMENBQUEsR0FBQWlCLFdBQUE1UixHQUFBLEdBQUEsaURBQUE7QUFDQTtBQUNBLEtBdERBOztBQXlEQSxXQUFBO0FBQ0E4SCxpQkFBQSxpQkFBQTlFLElBQUEsRUFBQTs7QUFFQWlPLHlCQUFBTixlQUFBLEdBQUEzTixLQUFBbEQsSUFBQTs7QUFFQSxnQkFBQTRTLGFBQUFoRCxFQUFBQyxTQUFBLENBQUEzTSxJQUFBLENBQUE7O0FBRUEsZ0JBQUEyUCxtQkFBQXpCLFlBQUF3QixVQUFBLENBQUE7O0FBRUE7QUFDQSxtQkFBQWYsWUFBQWdCLGdCQUFBLEVBQ0FqTyxLQURBLENBQ0EsZUFBQTtBQUNBLG9CQUFBK0QsSUFBQXZMLE1BQUEsQ0FBQThDLEdBQUEsRUFBQWtILE1BQUEsb0JBQUFsRSxLQUFBbEQsSUFBQSxHQUFBLHFCQUFBLEdBQUEySSxJQUFBdkwsTUFBQSxDQUFBOEMsR0FBQSxHQUFBLGlEQUFBO0FBQ0EsYUFIQSxDQUFBO0FBSUEsU0FkQTtBQWVBZ0oscUJBQUEscUJBQUE1QixPQUFBLEVBQUFwRSxJQUFBLEVBQUE7O0FBRUFvRSxvQkFBQXBFLElBQUEsR0FBQUEsS0FBQW5ELEdBQUE7O0FBRUEsbUJBQUF3QixtQkFBQTBGLElBQUEsQ0FBQS9ELElBQUEsRUFDQW5FLElBREEsQ0FDQTtBQUFBLHVCQUFBd0IsTUFBQWtMLElBQUEsQ0FBQSxtQ0FBQSxFQUFBbkUsT0FBQSxDQUFBO0FBQUEsYUFEQSxFQUVBdkksSUFGQSxDQUVBO0FBQUEsdUJBQUFxRixJQUFBaEYsSUFBQTtBQUFBLGFBRkEsRUFHQXdGLEtBSEEsQ0FHQTNELEtBQUE0RCxLQUhBLENBQUE7QUFJQSxTQXZCQTtBQXdCQXdDLDRCQUFBLDRCQUFBbkUsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsQ0FBQUEsS0FBQWlFLE1BQUEsRUFBQTtBQUFBLHVCQUFBLEtBQUE7QUFBQTtBQUNBLG1CQUFBNUcsTUFBQVEsR0FBQSxDQUFBLHVDQUFBbUMsS0FBQWlFLE1BQUEsRUFDQXBJLElBREEsQ0FDQTtBQUFBLHVCQUFBcUYsSUFBQWhGLElBQUE7QUFBQSxhQURBLENBQUE7QUFFQSxTQTVCQTtBQTZCQStJLDJCQUFBLDJCQUFBL0ksSUFBQSxFQUFBO0FBQ0ErUix5QkFBQS9SLEtBQUFZLElBQUEsSUFBQVosS0FBQTRCLFFBQUE7QUFDQSxTQS9CQTtBQWdDQWlILDJCQUFBLDZCQUFBO0FBQ0FrSiwyQkFBQSxJQUFBVCxZQUFBLEVBQUE7QUFDQSxTQWxDQTtBQW1DQWhNLHVCQUFBLHVCQUFBb08sVUFBQSxFQUFBO0FBQ0EsZ0JBQUEsQ0FBQUEsV0FBQXBKLEtBQUEsRUFBQSxPQUFBdkcsUUFBQTlDLE9BQUEsQ0FBQSxFQUFBLENBQUE7QUFDQSxtQkFBQUUsTUFBQVEsR0FBQSxDQUFBLHNDQUFBK1IsV0FBQXBKLEtBQUEsRUFDQTNLLElBREEsQ0FDQTtBQUFBLHVCQUFBcUYsSUFBQWhGLElBQUEsQ0FBQW1ELEtBQUE7QUFBQSxhQURBLEVBRUF4RCxJQUZBLENBRUEsaUJBQUE7QUFDQSxvQkFBQWdVLGNBQUEsSUFBQSxDQURBLENBQ0E7QUFDQSx1QkFBQXhRLE1BQUF3QixNQUFBLENBQUEsZ0JBQUE7QUFDQSx3QkFBQWIsS0FBQW5ELEdBQUEsS0FBQStTLFdBQUEvUyxHQUFBLEVBQUFnVCxjQUFBLEtBQUE7QUFDQSwyQkFBQUEsV0FBQTtBQUNBLGlCQUhBLENBQUE7QUFJQSxhQVJBLENBQUE7QUFTQTtBQTlDQSxLQUFBO0FBZ0RBLENBOUpBOztBQWdLQTlWLElBQUFtRCxVQUFBLENBQUEsaUJBQUEsRUFBQSxVQUFBaUIsTUFBQSxFQUFBNUMsTUFBQSxFQUFBOEMsa0JBQUEsRUFBQWhELFVBQUEsRUFBQTBDLElBQUEsRUFBQXpDLFdBQUEsRUFBQWdHLFdBQUEsRUFBQXJELFNBQUEsRUFBQXNELFFBQUEsRUFBQTs7QUFFQXBELFdBQUF3RixNQUFBLEdBQUEsS0FBQTtBQUNBeEYsV0FBQXVGLFNBQUEsR0FBQSxZQUFBO0FBQ0F2RixlQUFBd0YsTUFBQSxHQUFBLENBQUF4RixPQUFBd0YsTUFBQTtBQUNBeEYsZUFBQW9CLFVBQUE7QUFDQSxLQUhBOztBQU1BcEIsV0FBQTZCLElBQUEsR0FBQSxFQUFBO0FBQ0E3QixXQUFBNkIsSUFBQSxDQUFBbEQsSUFBQSxHQUFBLFNBQUE7QUFDQXhCLGdCQUFBTSxlQUFBLEdBQ0FDLElBREEsQ0FDQSxVQUFBQyxJQUFBLEVBQUE7QUFDQXFDLGVBQUE2QixJQUFBLENBQUFsRSxJQUFBLEdBQUFBLElBQUE7QUFDQXFDLGVBQUE2QixJQUFBLENBQUFwRCxNQUFBLEdBQUFkLEtBQUFlLEdBQUE7QUFDQSxLQUpBLEVBS0E2RSxLQUxBLENBS0EzRCxLQUFBNEQsS0FMQTs7QUFPQXhELFdBQUE2QixJQUFBLENBQUFoRCxHQUFBLEdBQUEsU0FBQTtBQUNBbUIsV0FBQTZCLElBQUEsQ0FBQTRDLE1BQUEsR0FBQSxFQUFBO0FBQ0F6RSxXQUFBNkIsSUFBQSxDQUFBNkMsT0FBQSxHQUFBLEVBQUE7QUFDQTFFLFdBQUE2QixJQUFBLENBQUE0QixJQUFBLEdBQUEsRUFBQTtBQUNBekQsV0FBQTZCLElBQUEsQ0FBQTRCLElBQUEsQ0FBQTFGLElBQUEsR0FBQSxFQUFBO0FBQ0FpQyxXQUFBNkIsSUFBQSxDQUFBbUIsVUFBQSxHQUFBLEVBQUE7QUFDQWhELFdBQUE2QixJQUFBLENBQUE2TyxNQUFBLEdBQUEsS0FBQTtBQUNBMVEsV0FBQTBELFVBQUEsR0FBQSxLQUFBO0FBQ0ExRCxXQUFBMkQsV0FBQSxHQUFBLEtBQUE7QUFDQTNELFdBQUE0RCxRQUFBLEdBQUEsS0FBQTtBQUNBNUQsV0FBQTZELGNBQUEsR0FBQSxLQUFBO0FBQ0E3RCxXQUFBMlIsU0FBQSxHQUFBLElBQUE7QUFDQTNSLFdBQUFpRSxPQUFBLEdBQUEsVUFBQUMsS0FBQSxFQUFBQyxJQUFBLEVBQUE7QUFDQSxZQUFBQSxTQUFBLE1BQUEsS0FBQUQsVUFBQWxFLE9BQUE2QixJQUFBLENBQUFzQyxJQUFBLEVBQUFHLE1BQUEsR0FBQSxDQUFBLElBQUF0RSxPQUFBNkIsSUFBQSxDQUFBc0MsSUFBQSxFQUFBRyxNQUFBLEtBQUEsQ0FBQSxDQUFBLEVBQUE7QUFDQSxnQkFBQUgsU0FBQSxRQUFBLEVBQUFuRSxPQUFBNkIsSUFBQSxDQUFBNEMsTUFBQSxDQUFBTCxJQUFBLENBQUEsRUFBQTtBQUNBLGdCQUFBRCxTQUFBLFNBQUEsRUFBQW5FLE9BQUE2QixJQUFBLENBQUE2QyxPQUFBLENBQUFOLElBQUEsQ0FBQSxFQUFBO0FBQ0EsZ0JBQUFELFNBQUEsWUFBQSxFQUFBbkUsT0FBQTZCLElBQUEsQ0FBQW1CLFVBQUEsQ0FBQW9CLElBQUEsQ0FBQSxFQUFBekYsTUFBQSxjQUFBLENBQUEwRixPQUFBckUsT0FBQTZCLElBQUEsQ0FBQW1CLFVBQUEsQ0FBQXNCLE1BQUEsSUFBQSxDQUFBLEVBQUFDLFFBQUEsRUFBQSxFQUFBQyxNQUFBLDhCQUFBLEVBQUE7QUFDQSxTQUpBLE1BS0EsSUFBQU4sVUFBQWxFLE9BQUE2QixJQUFBLENBQUFzQyxJQUFBLEVBQUFwRyxJQUFBLENBQUF1RyxNQUFBLEdBQUEsQ0FBQSxJQUFBdEUsT0FBQTZCLElBQUEsQ0FBQXNDLElBQUEsRUFBQXBHLElBQUEsQ0FBQXVHLE1BQUEsS0FBQSxDQUFBLEVBQUE7QUFDQXRFLG1CQUFBNkIsSUFBQSxDQUFBNEIsSUFBQSxDQUFBMUYsSUFBQSxDQUFBcUcsSUFBQSxDQUFBLEVBQUE7QUFDQTtBQUNBcEUsZUFBQW9CLFVBQUE7QUFDQSxLQVZBOztBQVlBcEIsV0FBQTJFLFFBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQTNFLE9BQUE2QixJQUFBLENBQUE0QyxNQUFBLENBQUFILE1BQUEsS0FBQSxDQUFBLEVBQUE7QUFDQXRFLG1CQUFBaUUsT0FBQSxDQUFBLENBQUEsRUFBQSxRQUFBO0FBQ0E7QUFDQTtBQUNBakUsZUFBQTBELFVBQUEsR0FBQSxDQUFBMUQsT0FBQTBELFVBQUE7QUFDQSxLQU5BOztBQVFBMUQsV0FBQTRFLGNBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQTVFLE9BQUE2QixJQUFBLENBQUE2QyxPQUFBLENBQUFKLE1BQUEsS0FBQSxDQUFBLEVBQUE7QUFDQXRFLG1CQUFBaUUsT0FBQSxDQUFBLENBQUEsRUFBQSxTQUFBO0FBQ0E7QUFDQTtBQUNBakUsZUFBQTJELFdBQUEsR0FBQSxDQUFBM0QsT0FBQTJELFdBQUE7QUFDQSxLQU5BOztBQVFBM0QsV0FBQTZFLFdBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQTdFLE9BQUE2QixJQUFBLENBQUE0QixJQUFBLENBQUExRixJQUFBLENBQUF1RyxNQUFBLEtBQUEsQ0FBQSxFQUFBO0FBQ0F0RSxtQkFBQWlFLE9BQUEsQ0FBQSxDQUFBLEVBQUEsTUFBQTtBQUNBO0FBQ0E7QUFDQWpFLGVBQUE0RCxRQUFBLEdBQUEsQ0FBQTVELE9BQUE0RCxRQUFBO0FBQ0EsS0FOQTs7QUFRQTVELFdBQUE4RSxpQkFBQSxHQUFBLFlBQUE7QUFDQSxZQUFBOUUsT0FBQTZCLElBQUEsQ0FBQW1CLFVBQUEsQ0FBQXNCLE1BQUEsS0FBQSxDQUFBLEVBQUE7QUFDQXRFLG1CQUFBaUUsT0FBQSxDQUFBLENBQUEsRUFBQSxZQUFBO0FBQ0E7QUFDQWpFLGVBQUE2RCxjQUFBLEdBQUEsQ0FBQTdELE9BQUE2RCxjQUFBO0FBQ0EsS0FMQTs7QUFPQTdELFdBQUErRSxVQUFBLEdBQUEsWUFBQTtBQUNBLFlBQUFDLG9CQUFBaEYsT0FBQTZCLElBQUEsQ0FBQWhELEdBQUEsQ0FBQStELE9BQUEsQ0FBQSxHQUFBLENBQUE7QUFDQSxZQUFBb0Msc0JBQUEsQ0FBQSxDQUFBLEVBQUE7QUFDQWhGLG1CQUFBNkIsSUFBQSxDQUFBaEQsR0FBQSxHQUFBbUIsT0FBQTZCLElBQUEsQ0FBQWhELEdBQUEsQ0FBQW9HLFNBQUEsQ0FBQSxDQUFBLEVBQUFELGlCQUFBLENBQUE7QUFDQTtBQUNBaEYsZUFBQTZCLElBQUEsQ0FBQWhELEdBQUEsSUFBQSxHQUFBO0FBQ0EsWUFBQXFHLGNBQUEsRUFBQTtBQUNBLGFBQUEsSUFBQUMsSUFBQSxDQUFBLEVBQUFBLElBQUFuRixPQUFBNkIsSUFBQSxDQUFBNEMsTUFBQSxDQUFBSCxNQUFBLEdBQUEsQ0FBQSxFQUFBYSxHQUFBLEVBQUE7QUFDQUQsMEJBQUFBLGNBQUFsRixPQUFBNkIsSUFBQSxDQUFBNEMsTUFBQSxDQUFBVSxDQUFBLEVBQUFDLEdBQUEsR0FBQSxHQUFBLEdBQUFwRixPQUFBNkIsSUFBQSxDQUFBNEMsTUFBQSxDQUFBVSxDQUFBLEVBQUFFLEtBQUEsR0FBQSxHQUFBO0FBQ0E7QUFDQXJGLGVBQUE2QixJQUFBLENBQUFoRCxHQUFBLEdBQUFtQixPQUFBNkIsSUFBQSxDQUFBaEQsR0FBQSxHQUFBcUcsV0FBQTtBQUNBbEYsZUFBQTZCLElBQUEsQ0FBQWhELEdBQUEsR0FBQW1CLE9BQUE2QixJQUFBLENBQUFoRCxHQUFBLENBQUF5RyxLQUFBLENBQUEsQ0FBQSxFQUFBdEYsT0FBQTZCLElBQUEsQ0FBQWhELEdBQUEsQ0FBQXlGLE1BQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxLQVpBOztBQWNBdEUsV0FBQXlGLFlBQUEsR0FBQSxZQUFBO0FBQ0F6RixlQUFBdUYsU0FBQTtBQUNBNUosZUFBQStKLFVBQUEsQ0FBQTFGLE9BQUEyRixRQUFBLEVBQUEsR0FBQTtBQUNBLEtBSEE7O0FBS0EzRixXQUFBMkYsUUFBQSxHQUFBLFlBQUE7QUFDQTtBQUNBM0YsZUFBQTZCLElBQUEsQ0FBQStQLE9BQUEsR0FBQSxJQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0ExUiwyQkFBQThKLE1BQUEsQ0FBQWhLLE9BQUE2QixJQUFBLEVBQ0FuRSxJQURBLENBQ0EsWUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBTixtQkFBQVEsRUFBQSxDQUFBLFVBQUE7QUFDQSxTQU5BLEVBT0EyRixLQVBBLENBT0EzRCxLQUFBNEQsS0FQQTtBQVFBLEtBZEE7O0FBZ0JBeEQsV0FBQTJHLE9BQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQUksWUFBQSxFQUFBO0FBQ0EsWUFBQUMsYUFBQSxLQUFBO0FBQ0FoSCxlQUFBaUcsT0FBQSxHQUFBO0FBQ0FnQiw4QkFBQSxFQURBO0FBRUFDLHFCQUFBN0gsS0FBQThILEdBQUE7QUFGQSxTQUFBO0FBSUFuSCxlQUFBNkIsSUFBQSxDQUFBbUIsVUFBQSxDQUFBNkQsT0FBQSxDQUFBLFVBQUFPLElBQUEsRUFBQTtBQUNBLGdCQUFBO0FBQ0Esb0JBQUFBLEtBQUE1QyxJQUFBLENBQUFGLE1BQUEsR0FBQSxFQUFBLEVBQUE7QUFDQXlDLDhCQUFBM0MsSUFBQSxDQUFBaUQsS0FBQUQsS0FBQTVDLElBQUEsQ0FBQTtBQUNBO0FBQ0EsYUFKQSxDQUtBLE9BQUE4QyxHQUFBLEVBQUE7QUFDQXZCLHNCQUFBLG9DQUFBcUIsS0FBQXpJLElBQUEsR0FBQSw0REFBQTtBQUNBcUksNkJBQUEsSUFBQTtBQUNBO0FBRUEsU0FYQTtBQVlBLFlBQUFBLFVBQUEsRUFBQTtBQUNBN0Qsb0JBQUF3RCxPQUFBLENBQUEzRyxPQUFBNkIsSUFBQSxFQUNBbkUsSUFEQSxDQUNBLFVBQUE2SixPQUFBLEVBQUE7QUFDQXZILG1CQUFBNkIsSUFBQSxDQUFBbEMsUUFBQSxHQUFBc0QsS0FBQXVFLFNBQUEsQ0FBQUQsT0FBQSxDQUFBO0FBQ0EsaUJBQUEsSUFBQXBDLElBQUEsQ0FBQSxFQUFBQSxJQUFBNEIsVUFBQXpDLE1BQUEsRUFBQWEsR0FBQSxFQUFBO0FBQ0Esb0JBQUE7QUFDQW5GLDJCQUFBaUcsT0FBQSxDQUFBZ0IsZ0JBQUEsQ0FBQTdDLElBQUEsQ0FBQSxDQUFBLENBQUEyQyxVQUFBNUIsQ0FBQSxFQUFBb0MsT0FBQSxDQUFBO0FBQ0EsaUJBRkEsQ0FHQSxPQUFBRCxHQUFBLEVBQUE7QUFDQXZCLDBCQUFBLG1EQUFBL0YsT0FBQTZCLElBQUEsQ0FBQW1CLFVBQUEsQ0FBQW1DLENBQUEsRUFBQXhHLElBQUEsR0FBQSx1QkFBQSxHQUFBMkksSUFBQUcsT0FBQSxHQUFBLHlDQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQUF6SCxPQUFBaUcsT0FBQSxDQUFBZ0IsZ0JBQUEsQ0FBQTNDLE1BQUEsRUFBQXRFLE9BQUFpRyxPQUFBLENBQUF5QixXQUFBLEdBQUExSCxPQUFBaUcsT0FBQSxDQUFBZ0IsZ0JBQUEsQ0FBQVUsS0FBQSxDQUFBO0FBQUEsdUJBQUFDLGVBQUE7QUFBQSxhQUFBLENBQUE7QUFDQSxTQWJBLEVBY0FsSyxJQWRBLENBY0FzQyxPQUFBa0csV0FkQTtBQWVBLEtBbkNBOztBQXNDQWxHLFdBQUFrRyxXQUFBLEdBQUEsVUFBQWhFLEVBQUEsRUFBQTtBQUNBcEMsa0JBQUErQixJQUFBLEdBQUE3QixPQUFBNkIsSUFBQTtBQUNBL0Isa0JBQUFtRyxPQUFBLEdBQUFqRyxPQUFBaUcsT0FBQTtBQUNBLFlBQUFFLGdCQUFBLENBQUEvQyxTQUFBLElBQUEsS0FBQUEsU0FBQSxJQUFBLENBQUEsS0FBQXBELE9BQUFvRyxnQkFBQTtBQUNBdEcsa0JBQUEyQyxJQUFBLENBQUE7QUFDQTFELHdCQUFBc0gsZ0JBREE7QUFFQXZILHlCQUFBdkIsUUFBQUMsR0FBQSxLQUFBLDREQUZBO0FBR0E4SSxvQkFBQXpLLFFBQUEwSyxPQUFBLENBQUFDLFNBQUEvQyxJQUFBLENBSEE7QUFJQW5CLHlCQUFBSixFQUpBO0FBS0F1RSxpQ0FBQSxJQUxBO0FBTUFDLHdCQUFBUDtBQU5BLFNBQUE7QUFRQSxLQVpBOztBQWNBLGFBQUFFLGdCQUFBLENBQUFyRyxNQUFBLEVBQUFGLFNBQUEsRUFBQTtBQUNBRSxlQUFBNkIsSUFBQSxHQUFBL0IsVUFBQStCLElBQUE7QUFDQTdCLGVBQUFpRyxPQUFBLEdBQUFuRyxVQUFBbUcsT0FBQTtBQUNBakcsZUFBQThILElBQUEsR0FBQSxZQUFBO0FBQ0FoSSxzQkFBQWdJLElBQUE7QUFDQSxTQUZBO0FBR0E5SCxlQUFBd0MsTUFBQSxHQUFBLFlBQUE7QUFDQTFDLHNCQUFBMEMsTUFBQTtBQUNBLFNBRkE7QUFHQXhDLGVBQUErSCxNQUFBLEdBQUEsVUFBQUEsTUFBQSxFQUFBO0FBQ0FqSSxzQkFBQWdJLElBQUEsQ0FBQUMsTUFBQTtBQUNBLFNBRkE7QUFHQTtBQUNBLENBN0tBOztBQ2pMQTs7QUFFQW5NLElBQUE2UyxTQUFBLENBQUEsaUJBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQTtBQUNBQyxrQkFBQSxHQURBO0FBRUE1UCxxQkFBQXZCLFFBQUFDLEdBQUEsS0FBQSxvRUFGQTtBQUdBdUIsb0JBQUE7QUFIQSxLQUFBO0FBTUEsQ0FQQTs7QUFTQW5ELElBQUErTSxPQUFBLENBQUEsd0JBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQSxFQUFBO0FBQ0EsQ0FGQTs7QUFJQS9NLElBQUFtRCxVQUFBLENBQUEscUJBQUEsRUFBQSxVQUFBaUIsTUFBQSxFQUFBNlIsc0JBQUEsRUFBQSxDQUdBLENBSEEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbndpbmRvdy5hcHAgPSBhbmd1bGFyLm1vZHVsZSgnTmV3bWFuJywgWydOZXdtYW5QcmVCdWlsdCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZScsICduZ01hdGVyaWFsJywgJ25nTWVzc2FnZXMnLCAnbWQuZGF0YS50YWJsZScsICduZ0RyYWdnYWJsZScgLCAndWkuYWNlJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkbWRUaGVtaW5nUHJvdmlkZXIpIHtcblxuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgLy8gJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgIC8vIFRyaWdnZXIgcGFnZSByZWZyZXNoIHdoZW4gYWNjZXNzaW5nIGFuIE9BdXRoIHJvdXRlXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0pO1xuXG52YXIgY3VzdG9tUHJpbWFyeSA9IHtcbiAgICAgICAgJzUwJzogJyNlNGViZjEnLFxuICAgICAgICAnMTAwJzogJyNkM2RmZTgnLFxuICAgICAgICAnMjAwJzogJyNjMmQzZGYnLFxuICAgICAgICAnMzAwJzogJyNiMWM3ZDYnLFxuICAgICAgICAnNDAwJzogJyNhMWJiY2UnLFxuICAgICAgICAnNTAwJzogJyM5MEFGQzUnLFxuICAgICAgICAnNjAwJzogJyM3ZmEzYmMnLFxuICAgICAgICAnNzAwJzogJyM2ZTk3YjMnLFxuICAgICAgICAnODAwJzogJyM1ZThiYWInLFxuICAgICAgICAnOTAwJzogJyM1MjdlOWQnLFxuICAgICAgICAnQTEwMCc6ICcjQzJDMkMyJyxcbiAgICAgICAgJ0EyMDAnOiAnI2ZmZmZmZicsXG4gICAgICAgICdBNDAwJzogJyNmZmZmZmYnLFxuICAgICAgICAnQTcwMCc6ICcjNDk3MDhjJ1xuICAgIH07XG4gICAgJG1kVGhlbWluZ1Byb3ZpZGVyXG4gICAgICAgIC5kZWZpbmVQYWxldHRlKCdjdXN0b21QcmltYXJ5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbVByaW1hcnkpO1xuXG4gICAgdmFyIGN1c3RvbUFjY2VudCA9IHtcbiAgICAgICAgJzUwJzogJyMzMjkyNGEnLFxuICAgICAgICAnMTAwJzogJyMzOGE1NTQnLFxuICAgICAgICAnMjAwJzogJyMzZmI4NWUnLFxuICAgICAgICAnMzAwJzogJyM0ZWMzNmInLFxuICAgICAgICAnNDAwJzogJyM2MWM5N2InLFxuICAgICAgICAnNTAwJzogJyM3NGNmOGInLFxuICAgICAgICAnNjAwJzogJyM5YWRjYWInLFxuICAgICAgICAnNzAwJzogJyNhZGUzYmInLFxuICAgICAgICAnODAwJzogJyNjMGU5Y2InLFxuICAgICAgICAnOTAwJzogJyNkM2YwZGEnLFxuICAgICAgICAnQTEwMCc6ICcjOWFkY2FiJyxcbiAgICAgICAgJ0EyMDAnOiAnODdENjlCJyxcbiAgICAgICAgJ0E0MDAnOiAnIzc0Y2Y4YicsXG4gICAgICAgICdBNzAwJzogJyNlNmY2ZWEnXG4gICAgfTtcbiAgICAkbWRUaGVtaW5nUHJvdmlkZXJcbiAgICAgICAgLmRlZmluZVBhbGV0dGUoJ2N1c3RvbUFjY2VudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21BY2NlbnQpO1xuXG4gICAgdmFyIGN1c3RvbVdhcm4gPSB7XG4gICAgICAgICc1MCc6ICcjZmZlNWU1JyxcbiAgICAgICAgJzEwMCc6ICcjZmZjY2NjJyxcbiAgICAgICAgJzIwMCc6ICcjZmZiM2IzJyxcbiAgICAgICAgJzMwMCc6ICcjZmY5OTk5JyxcbiAgICAgICAgJzQwMCc6ICcjZmY4MDgwJyxcbiAgICAgICAgJzUwMCc6ICcjZmY2NjY2JyxcbiAgICAgICAgJzYwMCc6ICcjZmY0YzRjJyxcbiAgICAgICAgJzcwMCc6ICcjZmYzMzMzJyxcbiAgICAgICAgJzgwMCc6ICcjZmYxOTE5JyxcbiAgICAgICAgJzkwMCc6ICcjZmYwMDAwJyxcbiAgICAgICAgJ0ExMDAnOiAnI2ZmZmZmZicsXG4gICAgICAgICdBMjAwJzogJyNmZmZmZmYnLFxuICAgICAgICAnQTQwMCc6ICcjZmZmZmZmJyxcbiAgICAgICAgJ0E3MDAnOiAnI2U1MDAwMCdcbiAgICB9O1xuICAgICRtZFRoZW1pbmdQcm92aWRlclxuICAgICAgICAuZGVmaW5lUGFsZXR0ZSgnY3VzdG9tV2FybicsXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21XYXJuKTtcblxuICAgIHZhciBjdXN0b21CYWNrZ3JvdW5kID0ge1xuICAgICAgICAnNTAnOiAnI2ZmZmZmZicsXG4gICAgICAgICcxMDAnOiAnI2ZmZmZmZicsXG4gICAgICAgICcyMDAnOiAnI2ZmZmZmZicsXG4gICAgICAgICczMDAnOiAnI2ZmZmZmZicsXG4gICAgICAgICc0MDAnOiAnI2ZmZmZmZicsXG4gICAgICAgICc1MDAnOiAnI0ZGRkZGRicsXG4gICAgICAgICc2MDAnOiAnI2YyZjJmMicsXG4gICAgICAgICc3MDAnOiAnI2U2ZTZlNicsXG4gICAgICAgICc4MDAnOiAnI2Q5ZDlkOScsXG4gICAgICAgICc5MDAnOiAnI2NjY2NjYycsXG4gICAgICAgICdBMTAwJzogJyNmZmZmZmYnLFxuICAgICAgICAnQTIwMCc6ICcjZmZmZmZmJyxcbiAgICAgICAgJ0E0MDAnOiAnI2ZmZmZmZicsXG4gICAgICAgICdBNzAwJzogJyNiZmJmYmYnXG4gICAgfTtcbiAgICAkbWRUaGVtaW5nUHJvdmlkZXJcbiAgICAgICAgLmRlZmluZVBhbGV0dGUoJ2N1c3RvbUJhY2tncm91bmQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tQmFja2dyb3VuZCk7XG5cbiAgICRtZFRoZW1pbmdQcm92aWRlci50aGVtZSgnZGVmYXVsdCcpXG4gICAgICAgLnByaW1hcnlQYWxldHRlKCdjdXN0b21QcmltYXJ5Jywge1xuICAgICAgICAgICAgJ2RlZmF1bHQnIDogJzUwMCcsXG4gICAgICAgICAgICAnaHVlLTEnIDogJzUwJyxcbiAgICAgICAgICAgICdodWUtMicgOiAnMjAwJyxcbiAgICAgICAgICAgICdodWUtMycgOiAnQTEwMCdcbiAgICAgICB9KVxuICAgICAgIC5hY2NlbnRQYWxldHRlKCdjdXN0b21BY2NlbnQnKVxuICAgICAgIC53YXJuUGFsZXR0ZSgnY3VzdG9tV2FybicpXG4gICAgICAgLmJhY2tncm91bmRQYWxldHRlKCdjdXN0b21CYWNrZ3JvdW5kJylcblxufSk7XG5cbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUsICRsb2NhdGlvbikge1xuICAgICRyb290U2NvcGUuYXNzZXRzUGF0aCA9IHByb2Nlc3MuY3dkKCkgKyAnL2Fzc2V0cyc7XG5cbiAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgJHJvb3RTY29wZS51c2VyID0gdXNlcjtcbiAgICB9KTtcblxuICAgIGlmICghJHJvb3RTY29wZS51c2VyKSAkc3RhdGUuZ28oJ2xvZ2luJyk7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyB2YXIgZDMgPSByZXF1aXJlKCdwYXRoL3RvL2QzLmpzJyk7XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3VzZXIgaW5zaWRlIHRoZSAkc3RhdGVDaGFuZ2VTdGFydCBldmVudDogJywgdXNlcilcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLnVzZXJJZCA9IHVzZXIuX2lkO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhbGxUZXN0cycsIHtcbiAgICAgICAgdXJsOiAnL2FsbFRlc3RzJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6IHByb2Nlc3MuY3dkKCkgKyAnL2Jyb3dzZXIvanMvYWxsVGVzdHMvYWxsVGVzdHMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdhbGxUZXN0c0N0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICBhbGxUZXN0czogZnVuY3Rpb24oJGh0dHAsICRzdGF0ZVBhcmFtcywgQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKClcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbih1c2VyKSB7XG4gICAgICAgICAgICAgICAgICB2YXIgY3VycmVudERhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgdmFyIHRpbWUgPSBjdXJyZW50RGF0ZS5nZXRIb3VycygpICsgXCI6XCIgKyBjdXJyZW50RGF0ZS5nZXRNaW51dGVzKCkgKyBcIjpcIiArIGN1cnJlbnREYXRlLmdldFNlY29uZHMoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnaHR0cDovL2xvY2FsaG9zdDoxMzM3L2FwaS90ZXN0cz91c2VySWQ9JyArIHVzZXIuX2lkKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuXG4vLyBhcHAuY29udHJvbGxlcignYWxsVGVzdHNDdHJsJyxmdW5jdGlvbigkc2NvcGUsIGFsbFRlc3RzKSB7XG4vLyAgICAgJHNjb3BlLmFsbFRlc3RzID0gYWxsVGVzdHM7XG4vLyB9KTtcblxuXG5hcHAuY29udHJvbGxlcignYWxsVGVzdHNDdHJsJywgZnVuY3Rpb24gKCRsb2csICRtZEVkaXREaWFsb2csICRtZERpYWxvZywgJHEsICRzdGF0ZSwgJHNjb3BlLCAkdGltZW91dCwgYWxsVGVzdHMsIFRlc3RCdWlsZGVyRmFjdG9yeSwgQXV0aFNlcnZpY2UsICRodHRwKSB7IC8vYWxsVGVzdHMgaW5qZWN0ZWQgaGVyZVxuICAndXNlIHN0cmljdCc7XG5cbiAgJHNjb3BlLnNlbGVjdGVkID0gW107XG4gICRzY29wZS5saW1pdE9wdGlvbnMgPSBbNSwgMTAsIDE1LCA1MF07XG5cbiAgJHNjb3BlLm9wdGlvbnMgPSB7XG4gICAgcm93U2VsZWN0aW9uOiB0cnVlLFxuICAgIG11bHRpU2VsZWN0OiB0cnVlLFxuICAgIGF1dG9TZWxlY3Q6IHRydWUsXG4gICAgZGVjYXBpdGF0ZTogZmFsc2UsXG4gICAgbGFyZ2VFZGl0RGlhbG9nOiBmYWxzZSxcbiAgICBib3VuZGFyeUxpbmtzOiBmYWxzZSxcbiAgICBsaW1pdFNlbGVjdDogdHJ1ZSxcbiAgICBwYWdlU2VsZWN0OiB0cnVlXG4gIH07XG5cbiAgJHNjb3BlLnF1ZXJ5ID0ge1xuICAgIG9yZGVyOiAnbmFtZScsXG4gICAgbGltaXQ6IDUwLFxuICAgIHBhZ2U6IDFcbiAgfTtcblxuICAkc2NvcGUudGVzdHMgPSBhbGxUZXN0cztcbiAgJHNjb3BlLmdldFRlc3RzID0gZnVuY3Rpb24oKSB7XG4gICAgVGVzdEJ1aWxkZXJGYWN0b3J5LmFsbFRlc3RzKClcbiAgICAudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAkc2NvcGUudGVzdHMgPSBkYXRhO1xuICAgICAgJHNjb3BlLiRldmFsQXN5bmMoKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlTGltaXRPcHRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICRzY29wZS5saW1pdE9wdGlvbnMgPSAkc2NvcGUubGltaXRPcHRpb25zID8gdW5kZWZpbmVkICA6IFs1LCAxMCwgMTVdO1xuICB9O1xuXG5cbiAgJHNjb3BlLmxvYWRTdHVmZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAkc2NvcGUucHJvbWlzZSA9ICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIGxvYWRpbmdcbiAgICB9LCAyMDAwKTtcbiAgfTtcblxuICAkc2NvcGUuZGVsZXRldGVzdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGRlbGV0ZVByb21pc2VzID0gJHNjb3BlLnNlbGVjdGVkLm1hcCh0ZXN0ID0+IFRlc3RCdWlsZGVyRmFjdG9yeS5kZWxldGUodGVzdCkpO1xuICAgIHJldHVybiBQcm9taXNlLmFsbChkZWxldGVQcm9taXNlcylcbiAgICAudGhlbihmdW5jdGlvbih2YWwpe1xuICAgICAgY29uc29sZS5sb2codmFsKTtcbiAgICAgICRzY29wZS5nZXRUZXN0cygpO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5zaG93Q29uZmlybSA9IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAvLyBBcHBlbmRpbmcgZGlhbG9nIHRvIGRvY3VtZW50LmJvZHkgdG8gY292ZXIgc2lkZW5hdiBpbiBkb2NzIGFwcFxuICAgICAgdmFyIGNvbmZpcm0gPSAkbWREaWFsb2cuY29uZmlybSgpXG4gICAgICAudGl0bGUoXCJDb25maXJtIERlbGV0aW9uXCIpXG4gICAgICAuYXJpYUxhYmVsKCdEZWxldGUnKVxuICAgICAgLnRhcmdldEV2ZW50KGV2KVxuICAgICAgLm9rKCdEZWxldGUnKVxuICAgICAgLmNhbmNlbCgnQ2FuY2VsJyk7XG4gICAgICAkbWREaWFsb2cuc2hvdyhjb25maXJtKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUuZGVsZXRldGVzdHMoKVxuICAgICAgICAudGhlbihmdW5jdGlvbigpe1xuICAgICAgICAgICRzY29wZS50ZXN0cyA9ICRzY29wZS50ZXN0cy5maWx0ZXIoZnVuY3Rpb24oZWxlKXtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuc2VsZWN0ZWQuaW5kZXhPZihlbGUpID09PSAtMTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWQgPSBbXTtcbiAgICAgICAgICAkc2NvcGUuJGV2YWxBc3luYygpO1xuICAgICAgICB9KTtcbiAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUuc3RhdHVzID0gJ0RlbGV0ZSBjYW5jZWxsZWQnO1xuICAgICAgfSk7XG4gIH07XG5cbn0pO1xuXG5cbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgndGVzdGVkaXRvcicsIHtcbiAgICAgICAgdXJsOiAnL2VkaXRUZXN0Lzp0ZXN0SWQnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogcHJvY2Vzcy5jd2QoKSArICcvYnJvd3Nlci9qcy9lZGl0VGVzdC9lZGl0VGVzdC5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1Rlc3RFZGl0b3JDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgdGVzdDogZnVuY3Rpb24oJGh0dHAsICRzdGF0ZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJ2h0dHA6Ly9sb2NhbGhvc3Q6MTMzNy9hcGkvdGVzdHMvJyArICRzdGF0ZVBhcmFtcy50ZXN0SWQpXG4gICAgICAgICAgICAgICAgLnRoZW4ocmVzID0+IHJlcy5kYXRhKVxuICAgICAgICAgICAgICAgIC50aGVuKHRlc3QgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0ZXN0LnZhbGlkYXRvcnMgPSBKU09OLnBhcnNlKHRlc3QudmFsaWRhdG9ycyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGVzdC52YWxpZGF0b3JzID09PSAnc3RyaW5nJykgeyB0ZXN0LnZhbGlkYXRvcnMgPSBKU09OLnBhcnNlKHRlc3QudmFsaWRhdG9ycyk7IH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRlc3Q7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignVGVzdEVkaXRvckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIHRlc3QsIFRlc3RCdWlsZGVyRmFjdG9yeSwgJHJvb3RTY29wZSwgJHN0YXRlLCAkbG9nLCBUZXN0RmFjdG9yeSwgJG1kRGlhbG9nLCAkbWRNZWRpYSl7XG5cbiAgICAkc2NvcGUudGVzdCA9IHRlc3Q7XG5cbiAgICBUZXN0RmFjdG9yeS5nZXRTdGFja1Rlc3RzKHRlc3QpXG4gICAgLnRoZW4oc3RhY2tUZXN0cyA9PiAkc2NvcGUuc3RhY2tUZXN0cyA9IHN0YWNrVGVzdHMpXG4gICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuXG4gICAgaWYgKHR5cGVvZiAkc2NvcGUudGVzdC5ib2R5LmRhdGEgPT09ICdzdHJpbmcnKSAgJHNjb3BlLnRlc3QuYm9keS5kYXRhID0gSlNPTi5wYXJzZSgkc2NvcGUudGVzdC5ib2R5LmRhdGEpO1xuICAgICRzY29wZS50ZXN0LnVzZXIgPSAkcm9vdFNjb3BlLnVzZXI7XG4gICAgJHNjb3BlLnNob3dQYXJhbXMgPSBmYWxzZTtcbiAgICAkc2NvcGUuc2hvd0hlYWRlcnMgPSBmYWxzZTtcbiAgICAkc2NvcGUuc2hvd0JvZHkgPSBmYWxzZTtcbiAgICAkc2NvcGUuc2hvd1ZhbGlkYXRvcnMgPSBmYWxzZTtcbiAgICAkc2NvcGUubnVtUGFyYW1zID0gMDtcbiAgICAkc2NvcGUubnVtSGVhZGVycyA9IDA7XG4gICAgJHNjb3BlLm51bUJvZHlPYmogPSAwO1xuICAgICRzY29wZS5hZGRGb3JtID0gZnVuY3Rpb24oaW5kZXgsIHR5cGUpe1xuICAgICAgICBpZiAodHlwZSA9PT0gJ3ZhbGlkYXRvcicpICRzY29wZS50ZXN0LnZhbGlkYXRvcnMucHVzaCh7bmFtZTogJHNjb3BlLnRlc3QubmFtZSArIChOdW1iZXIoJHNjb3BlLnRlc3QudmFsaWRhdG9ycy5sZW5ndGgpICsgMSkudG9TdHJpbmcoKSwgZnVuYzogXCIoZnVuY3Rpb24ocmVzcG9uc2UpIHtcXG5cXG59KTtcIn0pO1xuICAgICAgICBlbHNlIGlmIChpbmRleCA9PT0gJHNjb3BlLnRlc3RbdHlwZV0ubGVuZ3RoIC0gMSB8fCAkc2NvcGUudGVzdFt0eXBlXS5sZW5ndGggPT09IDAgfHwgaW5kZXggPT09ICRzY29wZS50ZXN0W3R5cGVdLmRhdGEubGVuZ3RoIC0gMSB8fCAkc2NvcGUudGVzdFt0eXBlXS5kYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgaWYgKHR5cGUgPT09IFwicGFyYW1zXCIpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUubnVtUGFyYW1zKys7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnRlc3QucGFyYW1zLnB1c2goe30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZSA9PT0gXCJoZWFkZXJzXCIpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUubnVtSGVhZGVycysrO1xuICAgICAgICAgICAgICAgICRzY29wZS50ZXN0LmhlYWRlcnMucHVzaCh7fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlID09PSBcImJvZHlcIikge1xuICAgICAgICAgICAgICAgICRzY29wZS5udW1Cb2R5T2JqKys7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnRlc3QuYm9keS5kYXRhLnB1c2goe30pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgJHNjb3BlLiRldmFsQXN5bmMoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnNob3dGb3JtID0gZnVuY3Rpb24oKXtcbiAgICAgICAgaWYgKCRzY29wZS50ZXN0LnBhcmFtcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICRzY29wZS5hZGRGb3JtKDAsXCJwYXJhbXNcIik7XG4gICAgICAgICAgICAkc2NvcGUubnVtUGFyYW1zKys7XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLnNob3dQYXJhbXMgPSAhJHNjb3BlLnNob3dQYXJhbXM7XG4gICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS50ZXN0LnBhcmFtcyk7XG4gICAgfTtcblxuICAgICRzY29wZS5kaXNwbGF5SGVhZGVycyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGlmICgkc2NvcGUudGVzdC5oZWFkZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgJHNjb3BlLmFkZEZvcm0oMCxcImhlYWRlcnNcIik7XG4gICAgICAgICAgICAkc2NvcGUubnVtSGVhZGVycysrO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS5zaG93SGVhZGVycyA9ICEkc2NvcGUuc2hvd0hlYWRlcnM7XG4gICAgfTtcblxuICAgICRzY29wZS5kaXNwbGF5Qm9keSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGlmICgkc2NvcGUudGVzdC5ib2R5LmRhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAkc2NvcGUuYWRkRm9ybSgwLFwiYm9keVwiKTtcbiAgICAgICAgICAgICRzY29wZS5udW1Cb2R5T2JqKys7XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLnNob3dCb2R5ID0gISRzY29wZS5zaG93Qm9keTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmRpc3BsYXlWYWxpZGF0b3JzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgaWYgKCRzY29wZS50ZXN0LnZhbGlkYXRvcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAkc2NvcGUuYWRkRm9ybSgwLFwidmFsaWRhdG9yXCIpO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS5zaG93VmFsaWRhdG9ycyA9ICEkc2NvcGUuc2hvd1ZhbGlkYXRvcnM7XG4gICAgfTtcblxuICAgICRzY29wZS5jb21wb3NlVVJMID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbmRleFF1ZXN0aW9uTWFyayA9ICRzY29wZS50ZXN0LnVybC5pbmRleE9mKCc/Jyk7XG4gICAgICAgIGlmIChpbmRleFF1ZXN0aW9uTWFyayAhPT0gLTEpIHtcbiAgICAgICAgICAgICRzY29wZS50ZXN0LnVybCA9ICRzY29wZS50ZXN0LnVybC5zdWJzdHJpbmcoMCxpbmRleFF1ZXN0aW9uTWFyayk7XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLnRlc3QudXJsICs9ICc/JztcbiAgICAgICAgdmFyIGZpbmFsU3RyaW5nID0gJyc7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCAkc2NvcGUudGVzdC5wYXJhbXMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICBmaW5hbFN0cmluZyA9IGZpbmFsU3RyaW5nICsgJHNjb3BlLnRlc3QucGFyYW1zW2ldLmtleSArICc9JyArICRzY29wZS50ZXN0LnBhcmFtc1tpXS52YWx1ZSArICcmJztcbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUudGVzdC51cmwgID0gJHNjb3BlLnRlc3QudXJsICsgZmluYWxTdHJpbmc7XG4gICAgICAgICRzY29wZS50ZXN0LnVybCA9ICRzY29wZS50ZXN0LnVybC5zbGljZSgwLCRzY29wZS50ZXN0LnVybC5sZW5ndGggLSAxKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnNldFRvZ2dsZSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICRzY29wZS50b2dnbGUgPSAhJHNjb3BlLnRvZ2dsZTtcbiAgICAgICAgJHNjb3BlLiRldmFsQXN5bmMoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmludGVybWVkaWFyeSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICRzY29wZS5zZXRUb2dnbGUoKTtcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoJHNjb3BlLnNhdmVUZXN0LCA4MDApO1xuICAgIH07XG5cbiAgICAkc2NvcGUuc2F2ZVRlc3QgPSBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgY3VycmVudERhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB2YXIgdGltZSA9IGN1cnJlbnREYXRlLmdldEhvdXJzKCkgKyBcIjpcIiArIGN1cnJlbnREYXRlLmdldE1pbnV0ZXMoKSArIFwiOlwiICsgY3VycmVudERhdGUuZ2V0U2Vjb25kcygpXG4gICAgICAgIGNvbnNvbGUubG9nKFwiYmVmb3JlIFRlc3RCdWlsZGVyRmFjdG9yeS5jcmVhdGVcIiwgdGltZSk7XG4gICAgICAgIFRlc3RCdWlsZGVyRmFjdG9yeS5lZGl0KCRzY29wZS50ZXN0KVxuICAgICAgICAudGhlbigoKSA9PiAge1xuICAgICAgICAgICAgY3VycmVudERhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgdmFyIHRpbWUgPSBjdXJyZW50RGF0ZS5nZXRIb3VycygpICsgXCI6XCIgKyBjdXJyZW50RGF0ZS5nZXRNaW51dGVzKCkgKyBcIjpcIiArIGN1cnJlbnREYXRlLmdldFNlY29uZHMoKVxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJnb2luZyB0byBuZXcgc3RhdGVcIiwgdGltZSk7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2FsbFRlc3RzJylcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgIH07XG5cbiAgICAkc2NvcGUudmlld1ByZXZpb3VzUmVzdWx0cyAgPSBmdW5jdGlvbih0ZXN0KSB7XG4gICAgICBpZiAoIXRlc3QucmVzdWx0KSB7IGFsZXJ0IChcIk5PIFJFU1VMVCBUTyBTSE9XXCIpOyB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgVGVzdEZhY3RvcnkuZ2V0UHJldmlvdXNSZXN1bHRzKHRlc3QpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgICRzY29wZS5yZXN1bHRzID0gcmVzdWx0O1xuICAgICAgICAgICRzY29wZS5zaG93UmVzdWx0cyh0ZXN0KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAkc2NvcGUuc2hvd1Jlc3VsdHMgPSBmdW5jdGlvbih0ZXN0KSB7XG4gICAgICAgICRtZERpYWxvZy50ZXN0ID0gdGVzdDtcbiAgICAgICAgJG1kRGlhbG9nLnJlc3VsdHMgPSAkc2NvcGUucmVzdWx0cztcbiAgICAgICAgdmFyIHVzZUZ1bGxTY3JlZW4gPSAoJG1kTWVkaWEoJ3NtJykgfHwgJG1kTWVkaWEoJ3hzJykpICAmJiAkc2NvcGUuY3VzdG9tRnVsbHNjcmVlbjtcbiAgICAgICAgJG1kRGlhbG9nLnNob3coe1xuICAgICAgICAgICAgY29udHJvbGxlcjogRGlhbG9nQ29udHJvbGxlcixcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBwcm9jZXNzLmN3ZCgpICsgJy9icm93c2VyL2pzL2NvbW1vbi9kaXJlY3RpdmVzL3Rlc3RidWlsZGVyL3Rlc3RSZXN1bHRzLmh0bWwnLFxuICAgICAgICAgICAgcGFyZW50OiBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuYm9keSksXG4gICAgICAgICAgICAvL3RhcmdldEV2ZW50OiBldixcbiAgICAgICAgICAgIGNsaWNrT3V0c2lkZVRvQ2xvc2U6dHJ1ZSxcbiAgICAgICAgICAgIGZ1bGxzY3JlZW46IHVzZUZ1bGxTY3JlZW5cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5ydW5UZXN0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgLy9Qb3B1bGF0ZSB0aGUgcmVzcG9uc2VQb29sIHdpdGggcmVzdWx0cyBmcm9tIGVhcmxpZXIgdGVzdHMsIGlmIHJlcXVpcmVkXG4gICAgICAgIFRlc3RGYWN0b3J5LmNsZWFyUmVzcG9uc2VQb29sKCk7XG4gICAgICAgICRzY29wZS5zdGFja1Rlc3RzLmZvckVhY2godGVzdCA9PiB7XG4gICAgICAgICAgICBsZXQgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiB0ZXN0Lm5hbWUsXG4gICAgICAgICAgICAgICAgcmVzcG9uc2U6IEpTT04ucGFyc2UodGVzdC5yZXNwb25zZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBUZXN0RmFjdG9yeS5hZGRUb1Jlc3BvbnNlUG9vbChkYXRhKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IGZ1bmNBcnJheSA9IFtdO1xuICAgICAgICBsZXQgY2FuY2VsVGVzdCA9IGZhbHNlO1xuICAgICAgICAkc2NvcGUucmVzdWx0cyA9IHtcbiAgICAgICAgICAgIHZhbGlkYXRvclJlc3VsdHM6IFtdLFxuICAgICAgICAgICAgbGFzdFJ1bjogRGF0ZS5ub3coKVxuICAgICAgICB9O1xuICAgICAgICBpZiAodHlwZW9mICRzY29wZS50ZXN0LnZhbGlkYXRvcnMgPT09ICdzdHJpbmcnKSAkc2NvcGUudGVzdC52YWxpZGF0b3JzID0gSlNPTi5wYXJzZSgkc2NvcGUudGVzdC52YWxpZGF0b3JzKTtcbiAgICAgICAgJHNjb3BlLnRlc3QudmFsaWRhdG9ycy5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChlbGVtLmZ1bmMubGVuZ3RoID4gMjYpIHtcbiAgICAgICAgICAgICAgICAgICAgZnVuY0FycmF5LnB1c2goZXZhbChlbGVtLmZ1bmMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaChlcnIpIHtcbiAgICAgICAgICAgICAgICBhbGVydCgnVGhlcmUgd2FzIGFuIGVycm9yIHBhcnNpbmcgdGhlICcgKyBlbGVtLm5hbWUgKyAnIHZhbGlkYXRvciBmdW5jdGlvbi4gUmVmYWN0b3IgdGhhdCBmdW5jdGlvbiBhbmQgdHJ5IGFnYWluLicpO1xuICAgICAgICAgICAgICAgIGNhbmNlbFRlc3QgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoY2FuY2VsVGVzdCkgcmV0dXJuO1xuXG4gICAgICAgIFRlc3RGYWN0b3J5LnJ1blRlc3QoJHNjb3BlLnRlc3QpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc0RhdGEpIHtcblxuICAgICAgICAgICAgJHNjb3BlLnRlc3QucmVzcG9uc2UgPSBKU09OLnN0cmluZ2lmeShyZXNEYXRhKTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmdW5jQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVzdWx0cy52YWxpZGF0b3JSZXN1bHRzLnB1c2goISFmdW5jQXJyYXlbaV0ocmVzRGF0YSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyKXtcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ1RoZSBmb2xsb3dpbmcgZXJyb3Igb2NjdXJlZCB3aGlsZSBydW5uaW5nIHRoZSAnICsgJHNjb3BlLnRlc3QudmFsaWRhdG9yc1tpXS5uYW1lICsgJyB2YWxpZGF0b3IgZnVuY3Rpb246ICcgKyBlcnIubWVzc2FnZSArICcuIFJlZmFjdG9yIHRoYXQgZnVuY3Rpb24gYW5kIHRyeSBhZ2Fpbi4nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgkc2NvcGUucmVzdWx0cy52YWxpZGF0b3JSZXN1bHRzLmxlbmd0aCkgJHNjb3BlLnJlc3VsdHMuZmluYWxSZXN1bHQgPSAkc2NvcGUucmVzdWx0cy52YWxpZGF0b3JSZXN1bHRzLmV2ZXJ5KHZhbGlkYXRvclJlc3VsdCA9PiB2YWxpZGF0b3JSZXN1bHQpO1xuICAgICAgICAgICAgcmV0dXJuIFRlc3RGYWN0b3J5LnNhdmVSZXN1bHRzKCRzY29wZS5yZXN1bHRzLCAkc2NvcGUudGVzdCk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHRlc3QpIHtcbiAgICAgICAgICAgICRzY29wZS50ZXN0LnJlc3VsdCA9IHRlc3QucmVzdWx0Ll9pZDtcbiAgICAgICAgICAgICRzY29wZS5zaG93UmVzdWx0cyh0ZXN0KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBEaWFsb2dDb250cm9sbGVyKCRzY29wZSwgJG1kRGlhbG9nKSB7XG4gICAgICAgICRzY29wZS50ZXN0ID0gJG1kRGlhbG9nLnRlc3Q7XG4gICAgICAgIGlmICh0eXBlb2YgJHNjb3BlLnRlc3QudmFsaWRhdG9ycyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICRzY29wZS50ZXN0LnZhbGlkYXRvcnMgPSBKU09OLnBhcnNlKCRzY29wZS50ZXN0LnZhbGlkYXRvcnMpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJNT0RJRklFRCBESUFMT0cgVEVTVFNcIiwgJHNjb3BlLnRlc3QudmFsaWRhdG9ycyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coXCJESUFMT0cgVEVTVFNcIiwgJHNjb3BlLnRlc3QpO1xuICAgICAgICAkc2NvcGUucmVzdWx0cyA9ICRtZERpYWxvZy5yZXN1bHRzO1xuICAgICAgICAkc2NvcGUuaGlkZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJG1kRGlhbG9nLmhpZGUoKTtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJG1kRGlhbG9nLmNhbmNlbCgpO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuYW5zd2VyID0gZnVuY3Rpb24oYW5zd2VyKSB7XG4gICAgICAgICAgICAkbWREaWFsb2cuaGlkZShhbnN3ZXIpO1xuICAgICAgICB9O1xuICAgIH1cblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgICAgICB1cmw6ICcvaG9tZScsIC8vVEVTVCA6aWQgYW5kIHRyYWlsaW5nIHNsYXNoXG4gICAgICAgIHRlbXBsYXRlVXJsOiBwcm9jZXNzLmN3ZCgpICsgJy9icm93c2VyL2pzL2hvbWUvaG9tZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ2hvbWVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgdXNlcjogZnVuY3Rpb24oQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhY2tzOiBmdW5jdGlvbigkaHR0cCwgdXNlciwgU3RhY2tCdWlsZGVyRmFjdG9yeSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBTdGFja0J1aWxkZXJGYWN0b3J5LmdldFVzZXJTdGFja3ModXNlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignaG9tZUN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCB1c2VyLCBzdGFja3MsICRyb290U2NvcGUsIFN0YWNrQnVpbGRlckZhY3RvcnksICRsb2cpIHtcbiAgJHNjb3BlLnVzZXIgPSB1c2VyO1xuICAkc2NvcGUuc3RhY2tzID0gc3RhY2tzO1xuXG4gICRyb290U2NvcGUuJG9uKCdkZWxldGVzdGFjaycsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKXtcbiAgICAkc2NvcGUuc3RhY2tzID0gJHNjb3BlLnN0YWNrcy5maWx0ZXIoZnVuY3Rpb24oZWxlKXtcbiAgICAgIHJldHVybiBkYXRhICE9PSBlbGUuX2lkO1xuICAgIH0pO1xuICB9KTtcblxuICAkcm9vdFNjb3BlLiRvbigndGVzdFVwZGF0ZScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhT2JqKXtcblxuICAgICAgdmFyIHVwZGF0ZWRTdGFjayA9ICRzY29wZS5zdGFja3MuZmlsdGVyKGZ1bmN0aW9uKHN0YWNrKSB7XG4gICAgICAgIHJldHVybiBzdGFjay5faWQgPT0gZGF0YU9iai5zdGFjay5faWQ7XG4gICAgICB9KVswXTtcblxuICAgICAgdmFyIHVwZGF0ZWRUZXN0ID0gdXBkYXRlZFN0YWNrLnRlc3RzLmZpbHRlcihmdW5jdGlvbih0ZXN0KSB7XG4gICAgICAgIHJldHVybiB0ZXN0Ll9pZCA9PSBkYXRhT2JqLnRlc3QuX2lkO1xuICAgICAgfSlbMF07XG5cbiAgICAgIHVwZGF0ZWRUZXN0LmJvZHkucmVzdWx0ID0gZGF0YU9iai50ZXN0LmJvZHkucmVzdWx0O1xuICB9KTtcbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiBwcm9jZXNzLmN3ZCgpICsgJy9icm93c2VyL2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUsICRyb290U2NvcGUpIHtcbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbykudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgJHJvb3RTY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICRzY29wZS4kZXZhbEFzeW5jKCk7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTsgIC8vVEVTVCB7aWQ6IHVzZXIuX2lkfVxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7XG4iLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnTmV3bWFuUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnaHR0cDovL2xvY2FsaG9zdDoxMzM3L3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCdodHRwOi8vbG9jYWxob3N0OjEzMzcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJ2h0dHA6Ly9sb2NhbGhvc3Q6MTMzNy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTtcbiIsImFwcC5mYWN0b3J5KCdTaWdudXBGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHApe1xuICB2YXIgU2lnbnVwRmFjdG9yeSA9IHt9O1xuXG4gIFNpZ251cEZhY3RvcnkuY3JlYXRlTmV3VXNlciA9IGZ1bmN0aW9uKHVzZXJJbmZvKXtcbiAgICByZXR1cm4gJGh0dHAucG9zdCgnaHR0cDovL2xvY2FsaG9zdDoxMzM3L3NpZ251cCcsIHVzZXJJbmZvKTtcbiAgfTtcblxuICByZXR1cm4gU2lnbnVwRmFjdG9yeTtcbn0pO1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2lnbnVwJywge1xuICAgICAgICB1cmw6ICcvc2lnbnVwJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6IHByb2Nlc3MuY3dkKCkgKyAnL2Jyb3dzZXIvanMvc2lnbnVwL3NpZ251cC5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1NpZ251cEN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignU2lnbnVwQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUsIFNpZ251cEZhY3RvcnksICRtZFRvYXN0LCAkbG9nKSB7XG5cbiAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5jcmVhdGVVc2VyID0gZnVuY3Rpb24oc2lnbnVwSW5mbykge1xuICAgICAgaWYoc2lnbnVwSW5mby5wYXNzd29yZEEgIT09IHNpZ251cEluZm8ucGFzc3dvcmRCKXtcbiAgICAgICAgJHNjb3BlLmVycm9yID0gJ1lvdXIgcGFzc3dvcmRzIGRvblxcJ3QgbWF0Y2guJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIFNpZ251cEZhY3RvcnkuY3JlYXRlTmV3VXNlcih7ZW1haWw6IHNpZ251cEluZm8uZW1haWwsIHBhc3N3b3JkOiBzaWdudXBJbmZvLnBhc3N3b3JkQSwgdXNlcm5hbWU6IHNpZ251cEluZm8udXNlcm5hbWUsIGZpcnN0TmFtZTogc2lnbnVwSW5mby5maXJzdE5hbWUsIGxhc3ROYW1lOiBzaWdudXBJbmZvLmxhc3ROYW1lLCBpc0FkbWluOiBmYWxzZX0pXG4gICAgICAgIC50aGVuKCRzY29wZS5zaG93U3VjY2Vzc1RvYXN0KCkpXG4gICAgICAgIC50aGVuKCRzdGF0ZS5nbygnbG9naW4nKSlcbiAgICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgICAgfVxuICAgIH07XG4gICAgICAkc2NvcGUuc2hvd1N1Y2Nlc3NUb2FzdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkbWRUb2FzdC5zaG93KFxuICAgICAgICAgICRtZFRvYXN0LnNpbXBsZSgpXG4gICAgICAgICAgICAudGV4dENvbnRlbnQoJ1NpZ24gdXAgc3VjY2Vzc2Z1bC4nKVxuICAgICAgICAgICAgLnBvc2l0aW9uKCdib3R0b20gcmlnaHQnKVxuICAgICAgICAgICAgLmhpZGVEZWxheSgyMDAwKVxuICAgICAgICApO1xuICAgIH07XG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc3RhY2tCdWlsZGVyJywge1xuICAgICAgICB1cmw6ICcvc3RhY2tidWlsZGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6IHByb2Nlc3MuY3dkKCkgKyAnL2Jyb3dzZXIvanMvc3RhY2tCdWlsZGVyL3N0YWNrQnVpbGRlci5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1N0YWNrQnVpbGRlckN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICB1c2VyOiBmdW5jdGlvbihBdXRoU2VydmljZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0czogZnVuY3Rpb24oJGh0dHAsIHVzZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCdodHRwOi8vbG9jYWxob3N0OjEzMzcvYXBpL3Rlc3RzP3VzZXJJZD0nICsgdXNlci5faWQpXG4gICAgICAgICAgICAgICAgLnRoZW4ocmVzID0+IHJlcy5kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cblxuYXBwLmZhY3RvcnkoJ1N0YWNrQnVpbGRlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJHJvb3RTY29wZSwgVGVzdEJ1aWxkZXJGYWN0b3J5KSB7XG4gICAgdmFyIG9iaiA9IHt9O1xuICAgICAgICB2YXIgc3RvcmVkU3RhY2tzID0gW107XG4gICAgICAgIG9iai5nZXRTdGFja3MgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuIHN0b3JlZFN0YWNrcztcbiAgICAgICAgfTtcbiAgICAgICAgb2JqLmdldFVzZXJTdGFja3MgPSBmdW5jdGlvbih1c2VyKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJ2h0dHA6Ly9sb2NhbGhvc3Q6MTMzNy9hcGkvc3RhY2tzP3VzZXJJZD0nICsgdXNlci5faWQpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEsIHN0b3JlZFN0YWNrcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlZFN0YWNrcztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIG9iai5jcmVhdGUgPSBmdW5jdGlvbihzdGFja09iaikge1xuICAgICAgICAgICAgbGV0IG5ld1Rlc3RzID0gc3RhY2tPYmoudGVzdHMubWFwKHRlc3QgPT4gVGVzdEJ1aWxkZXJGYWN0b3J5LmNyZWF0ZSh0ZXN0KSk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwobmV3VGVzdHMpXG4gICAgICAgICAgICAudGhlbihzYXZlZFRlc3RzID0+IHN0YWNrT2JqLnRlc3RzID0gc2F2ZWRUZXN0cylcbiAgICAgICAgICAgIC50aGVuKCAoKSA9PiAkaHR0cC5wb3N0KCdodHRwOi8vbG9jYWxob3N0OjEzMzcvYXBpL3N0YWNrcycsIHN0YWNrT2JqKSlcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kZW1pdCgnY3JlYXRlc3RhY2snLCByZXMuZGF0YSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIG9iai5kZWxldGUgPSBmdW5jdGlvbihzdGFja09iaikge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZSgnaHR0cDovL2xvY2FsaG9zdDoxMzM3L2FwaS9zdGFja3MvJyArIHN0YWNrT2JqLl9pZClcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgICAgc3RvcmVkU3RhY2tzID0gc3RvcmVkU3RhY2tzLmZpbHRlcihmdW5jdGlvbihlbGUpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxlLl9pZCAhPT0gcmVzLmRhdGE7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kZW1pdCgnZGVsZXRlc3RhY2snLCByZXMuZGF0YSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgcmV0dXJuIG9iajtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignU3RhY2tCdWlsZGVyQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkbG9nLCB0ZXN0cywgU3RhY2tCdWlsZGVyRmFjdG9yeSwgJHJvb3RTY29wZSwgVGVzdEJ1aWxkZXJGYWN0b3J5KSB7XG5cbiAgICAkc2NvcGUudG9nZ2xlID0gZmFsc2U7XG4gICAgJHNjb3BlLnNldFRvZ2dsZSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICRzY29wZS50b2dnbGUgPSAhJHNjb3BlLnRvZ2dsZTtcbiAgICAgICAgJHNjb3BlLiRldmFsQXN5bmMoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnRlc3RzID0gdGVzdHMuZmlsdGVyKGZ1bmN0aW9uKHRlc3Qpe1xuICAgICAgICByZXR1cm4gIXRlc3Quc3RhY2s7XG4gICAgfSk7XG4gICAgJHNjb3BlLnN0YWNrID0ge307XG4gICAgJHNjb3BlLnN0YWNrLnVzZXIgPSAkcm9vdFNjb3BlLnVzZXI7XG4gICAgJHNjb3BlLnN0YWNrLnVzZXJJZCA9ICRyb290U2NvcGUudXNlci5faWQ7XG4gICAgJHNjb3BlLnN0YWNrLnRlc3RzID0gW107XG5cblxuICAgICRzY29wZS5pbnRlcm1lZGlhcnkgPSBmdW5jdGlvbigpe1xuICAgICAgICAkc2NvcGUuc2V0VG9nZ2xlKCk7XG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCRzY29wZS5zdWJtaXRTdGFjaywgODAwKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnN1Ym1pdFN0YWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBTdGFja0J1aWxkZXJGYWN0b3J5LmNyZWF0ZSgkc2NvcGUuc3RhY2spXG4gICAgICAgIC50aGVuKHN0YWNrID0+ICRzdGF0ZS5nbygnc3RhY2tWaWV3Jywge3N0YWNrSWQ6IHN0YWNrLl9pZH0pKVxuICAgICAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gICAgfTtcbiAgICAkc2NvcGUuYWRkVG9TdGFjayA9IGZ1bmN0aW9uICh0ZXN0KSB7XG4gICAgICAgICRzY29wZS5zdGFjay50ZXN0cy5wdXNoKHRlc3QpO1xuICAgICAgICAkc2NvcGUuJGV2YWxBc3luYygpO1xuICAgIH07XG4gICAgJHNjb3BlLnJlbW92ZUZyb21TdGFjayA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgJHNjb3BlLnN0YWNrLnRlc3RzID0gJHNjb3BlLnN0YWNrLnRlc3RzLmZpbHRlcihmdW5jdGlvbihlbCl7XG4gICAgICAgICAgICByZXR1cm4gZWwgIT09IG9iajtcbiAgICAgICAgfSk7XG4gICAgICAgICRzY29wZS4kZXZhbEFzeW5jKCk7XG4gICAgfTtcbiAgICAkc2NvcGUub25Ecm9wQ29tcGxldGUgPSBmdW5jdGlvbiAoaW5kZXgsIG9iaiwgZXZ0KSB7XG4gICAgICAgIHZhciBvdGhlck9iaiA9ICRzY29wZS5zdGFjay50ZXN0c1tpbmRleF07XG4gICAgICAgIHZhciBvdGhlckluZGV4ID0gJHNjb3BlLnN0YWNrLnRlc3RzLmluZGV4T2Yob2JqKTtcbiAgICAgICAgJHNjb3BlLnN0YWNrLnRlc3RzW2luZGV4XSA9IG9iajtcbiAgICAgICAgJHNjb3BlLnN0YWNrLnRlc3RzW290aGVySW5kZXhdID0gb3RoZXJPYmo7XG4gICAgfTtcbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc3RhY2tWaWV3Jywge1xuICAgICAgICB1cmw6ICcvc3RhY2tWaWV3LzpzdGFja0lkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6IHByb2Nlc3MuY3dkKCkgKyAnL2Jyb3dzZXIvanMvc3RhY2tWaWV3L3N0YWNrVmlldy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1N0YWNrVmlld0N0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICBzdGFjazogZnVuY3Rpb24oJGh0dHAsICRzdGF0ZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJ2h0dHA6Ly9sb2NhbGhvc3Q6MTMzNy9hcGkvc3RhY2tzLycgKyAkc3RhdGVQYXJhbXMuc3RhY2tJZClcbiAgICAgICAgICAgICAgICAudGhlbihyZXMgPT4gcmVzLmRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmZhY3RvcnkoJ1N0YWNrVmlld0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGVkaXQ6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnB1dCgnaHR0cDovL2xvY2FsaG9zdDoxMzM3L2FwaS9zdGFja3MvJyArIG9iai5faWQsIG9iailcbiAgICAgICAgICAgIC50aGVuIChyZXNwb25zZSA9PiByZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0VGVzdFdpdGhTdGF0dXM6IGZ1bmN0aW9uIChhcnIsIHN0YXR1cykge1xuICAgICAgICAgICAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24oZWxlKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlLmJvZHkucmVzdWx0ID09PSBzdGF0dXM7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0UGVyY2VudDogZnVuY3Rpb24oYXJyLCB0b3RhbGxlbikge1xuICAgICAgICAgICAgcmV0dXJuIChhcnIubGVuZ3RoIC8gdG90YWxsZW4pICogMTAwO1xuICAgICAgICB9XG4gICAgfTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignU3RhY2tWaWV3Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSwgJHN0YXRlLCAkbG9nLCBzdGFjaywgU3RhY2tWaWV3RmFjdG9yeSwgVGVzdEZhY3RvcnkpIHtcbiAgICAkc2NvcGUuc3RhY2sgPSBzdGFjaztcbiAgICAkc2NvcGUucmVtb3ZlRnJvbVN0YWNrID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICRzY29wZS5zdGFjay50ZXN0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAkc2NvcGUuJGV2YWxBc3luYygpO1xuICAgIH07XG4gICAgJHNjb3BlLnN1Ym1pdFN0YWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBTdGFja1ZpZXdGYWN0b3J5LmVkaXQoJHNjb3BlLnN0YWNrKVxuICAgICAgICAudGhlbigoKSA9PiAkc2NvcGUuJGV2YWxBc3luYygpIClcbiAgICAgICAgLnRoZW4oKCkgPT4gYWxlcnQoXCJZb3VyIGNoYW5nZXMgd2VyZSBzYXZlZCFcIikpXG4gICAgICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgICB9O1xuXG5cbiAgICAkc2NvcGUubmV3VGVzdHMgPSBTdGFja1ZpZXdGYWN0b3J5LmdldFRlc3RXaXRoU3RhdHVzKCRzY29wZS5zdGFjay50ZXN0cywgXCJOZXdcIik7XG4gICAgJHNjb3BlLmZhaWxUZXN0cyA9IFN0YWNrVmlld0ZhY3RvcnkuZ2V0VGVzdFdpdGhTdGF0dXMoJHNjb3BlLnN0YWNrLnRlc3RzLCBcIkZhaWxpbmdcIik7XG4gICAgJHNjb3BlLnBhc3NUZXN0cyA9IFN0YWNrVmlld0ZhY3RvcnkuZ2V0VGVzdFdpdGhTdGF0dXMoJHNjb3BlLnN0YWNrLnRlc3RzLCBcIlBhc3NpbmdcIik7XG4gICAgJHNjb3BlLm5ld1BlcmNlbnQgPSBTdGFja1ZpZXdGYWN0b3J5LmdldFBlcmNlbnQoJHNjb3BlLm5ld1Rlc3RzLCAkc2NvcGUuc3RhY2sudGVzdHMubGVuZ3RoKTtcbiAgICAkc2NvcGUuZmFpbFBlcmNlbnQgPSBTdGFja1ZpZXdGYWN0b3J5LmdldFBlcmNlbnQoJHNjb3BlLmZhaWxUZXN0cywgJHNjb3BlLnN0YWNrLnRlc3RzLmxlbmd0aCk7XG4gICAgJHNjb3BlLnBhc3NQZXJjZW50ID0gU3RhY2tWaWV3RmFjdG9yeS5nZXRQZXJjZW50KCRzY29wZS5wYXNzVGVzdHMsICRzY29wZS5zdGFjay50ZXN0cy5sZW5ndGgpO1xuXG4gICAgJChmdW5jdGlvbigpe1xuICAgICAgdmFyICRwcGMgPSAkKCcucHJvZ3Jlc3MtcGllLWNoYXJ0JyksXG4gICAgICAgIHBlcmNlbnQgPSAkc2NvcGUucGFzc1BlcmNlbnQudG9GaXhlZCgwKSxcbiAgICAgICAgZGVnID0gMzYwKnBlcmNlbnQvMTAwO1xuICAgICAgaWYgKHBlcmNlbnQgPiA1MCkge1xuICAgICAgICAkcHBjLmFkZENsYXNzKCdndC01MCcpO1xuICAgICAgfVxuICAgICAgJCgnLnBwYy1wcm9ncmVzcy1maWxsJykuY3NzKCd0cmFuc2Zvcm0nLCdyb3RhdGUoJysgZGVnICsnZGVnKScpO1xuICAgICAgJCgnLnBwYy1wZXJjZW50cyBzcGFuJykuaHRtbChwZXJjZW50KyclJyk7XG4gICAgfSk7XG4gICAgdmFyIGRhdGVPYmogPSBuZXcgRGF0ZSgkc2NvcGUuc3RhY2subGFzdFJ1bik7XG4gICAgJHNjb3BlLmRhdGVTdHJpbmcgPSBkYXRlT2JqLnRvU3RyaW5nKCk7XG5cblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd1c2Vyc3BhZ2UnLCB7XG4gICAgICAgIHVybDogJy91c2VycGFnZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiBwcm9jZXNzLmN3ZCgpICsgJy9icm93c2VyL2pzL3VzZXJzcGFnZS91c2Vyc3BhZ2UuaHRtbCcsXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGF0YS5hdXRoZW50aWNhdGUgaXMgcmVhZCBieSBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBjb250cm9sbGVyOiAndXNlcnNQYWdlQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICAgIHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmZhY3RvcnkoJ1VzZXJzUGFnZUZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHNhdmVDaGFuZ2VzOiBmdW5jdGlvbih1c2VyKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucHV0KCdodHRwOi8vbG9jYWxob3N0OjEzMzcvYXBpL3VzZXJzLycgKyB1c2VyLl9pZCwgdXNlcilcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiByZXMuZGF0YSk7XG4gICAgICAgIH1cbiAgICB9O1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCd1c2Vyc1BhZ2VDdHJsJywgZnVuY3Rpb24oJGxvZywgJG1kVG9hc3QsICRzY29wZSwgdXNlciwgVXNlcnNQYWdlRmFjdG9yeSkge1xuICAgICRzY29wZS51c2VyID0gdXNlcjtcbiAgICAkc2NvcGUuc2F2ZUNoYW5nZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgVXNlcnNQYWdlRmFjdG9yeS5zYXZlQ2hhbmdlcygkc2NvcGUudXNlcilcbiAgICAgICAgLnRoZW4oKCkgPT4gJHNjb3BlLnNob3dTdWNjZXNzVG9hc3QoKSlcbiAgICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgIH07XG4gICAgJHNjb3BlLnNob3dTdWNjZXNzVG9hc3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJG1kVG9hc3Quc2hvdyhcbiAgICAgICAgICAkbWRUb2FzdC5zaW1wbGUoKVxuICAgICAgICAgICAgLnRleHRDb250ZW50KCdDaGFuZ2VzIHNhdmVkLicpXG4gICAgICAgICAgICAucG9zaXRpb24oJ2JvdHRvbSByaWdodCcpXG4gICAgICAgICAgICAuaGlkZURlbGF5KDIwMDApXG4gICAgICAgICk7XG4gICAgfTtcbn0pXG4gIC5jb25maWcoZnVuY3Rpb24oJG1kVGhlbWluZ1Byb3ZpZGVyKSB7XG4gICAgJG1kVGhlbWluZ1Byb3ZpZGVyLnRoZW1lKCdjdXN0b21CYWNrZ3JvdW5kJywgJ2RlZmF1bHQnKVxuICAgICAgLnByaW1hcnlQYWxldHRlKCdjdXN0b21CYWNrZ3JvdW5kJyk7XG59KTtcblxuXG5cblxuXG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5mYWN0b3J5KCdUZXN0QnVpbGRlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgQXV0aFNlcnZpY2Upe1xuXHR2YXIgdGVzdG9iaiA9IHt9O1xuXG5cdHRlc3RvYmouY3JlYXRlID0gZnVuY3Rpb24ob2JqKXtcbiAgICAgICAgdmFyIGNsb25lZE9iaiA9IF8uY2xvbmVEZWVwKG9iaik7XG4gICAgICAgIGlmKGNsb25lZE9iai5faWQpe2RlbGV0ZSBjbG9uZWRPYmouX2lkOyB9XG4gICAgICAgIGlmIChjbG9uZWRPYmoudmFsaWRhdG9ycykge1xuICAgICAgICAgICAgY2xvbmVkT2JqLnZhbGlkYXRvcnMgPSBKU09OLnN0cmluZ2lmeShjbG9uZWRPYmoudmFsaWRhdG9ycyk7XG4gICAgICAgIH1cbiAgICAgICAgY2xvbmVkT2JqLmJvZHkuZGF0YSA9IEpTT04uc3RyaW5naWZ5KGNsb25lZE9iai5ib2R5LmRhdGEpO1xuXHRcdHJldHVybiAkaHR0cC5wb3N0KCdodHRwOi8vbG9jYWxob3N0OjEzMzcvYXBpL3Rlc3RzLycsIGNsb25lZE9iailcblx0XHQudGhlbihyZXNwb25zZSA9PiAge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIH0pO1xuXHR9O1xuICAgIHRlc3RvYmouZWRpdCA9IGZ1bmN0aW9uKG9iail7XG4gICAgICAgIHZhciBjbG9uZWRPYmogPSBfLmNsb25lRGVlcChvYmopO1xuICAgICAgICBpZiAoY2xvbmVkT2JqLnZhbGlkYXRvcnMpIHtcbiAgICAgICAgICAgIGNsb25lZE9iai52YWxpZGF0b3JzID0gSlNPTi5zdHJpbmdpZnkoY2xvbmVkT2JqLnZhbGlkYXRvcnMpO1xuICAgICAgICB9XG4gICAgICAgIGNsb25lZE9iai5ib2R5LmRhdGEgPSBKU09OLnN0cmluZ2lmeShjbG9uZWRPYmouYm9keS5kYXRhKTtcbiAgICAgICAgcmV0dXJuICRodHRwLnB1dCgnaHR0cDovL2xvY2FsaG9zdDoxMzM3L2FwaS90ZXN0cy8nICsgY2xvbmVkT2JqLl9pZCwgY2xvbmVkT2JqKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5kYXRhKTtcbiAgICB9O1xuICAgIHRlc3RvYmouZGVsZXRlID0gZnVuY3Rpb24ob2JqKXtcbiAgICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZSgnaHR0cDovL2xvY2FsaG9zdDoxMzM3L2FwaS90ZXN0cy8nICsgb2JqLl9pZClcbiAgICB9O1xuXG4gICAgdGVzdG9iai5hbGxUZXN0cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCdodHRwOi8vbG9jYWxob3N0OjEzMzcvYXBpL3Rlc3RzP3VzZXJJZD0nICsgdXNlci5faWQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRlc3RvYmo7XG59KTtcblxuXG5cblxuXG5cblxuIiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogcHJvY2Vzcy5jd2QoKSArICcvYnJvd3Nlci9qcy9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgICAgICAgc2NvcGUuaXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0hvbWUnLCBzdGF0ZTogJ2hvbWUnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0Fib3V0Jywgc3RhdGU6ICdhYm91dCcgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnRG9jdW1lbnRhdGlvbicsIHN0YXRlOiAnZG9jcycgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTWVtYmVycyBPbmx5Jywgc3RhdGU6ICdtZW1iZXJzT25seScsIGF1dGg6IHRydWUgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnQWRkIFRlc3QnLCBzdGF0ZTogJ3Rlc3RidWlsZGVyJywgYXV0aDogdHJ1ZSB9XG5cbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuXG4gICAgICAgICAgICBzY29wZS5pc0xvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXRVc2VyKCk7XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ3N0YWNrQ2FyZCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnRScsXG4gICAgc2NvcGU6IHtcbiAgICAgIHN0YWNrOiAnPSdcbiAgICB9LFxuICAgIHRlbXBsYXRlVXJsOiBwcm9jZXNzLmN3ZCgpICsgJy9icm93c2VyL2pzL2NvbW1vbi9kaXJlY3RpdmVzL3N0YWNrQ2FyZC9zdGFja0NhcmQuaHRtbCcsXG4gICAgY29udHJvbGxlcjogJ1N0YWNrQ2FyZEN0cmwnXG4gIH07XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1N0YWNrQ2FyZEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkcm9vdFNjb3BlLCBTdGFja0J1aWxkZXJGYWN0b3J5LCAkbWREaWFsb2csIFRlc3RGYWN0b3J5LCAkbG9nLCBTdGFja1ZpZXdGYWN0b3J5KSB7XG5cbiAgJHNjb3BlLnRvZ2dsZSA9IGZhbHNlO1xuICAkc2NvcGUuc2V0VG9nZ2xlID0gZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUudG9nZ2xlID0gISRzY29wZS50b2dnbGU7XG4gICAgJHNjb3BlLiRldmFsQXN5bmMoKTtcbiAgfTtcblxuICAkc2NvcGUuc2hvd0NvbmZpcm0gPSBmdW5jdGlvbihzdGFjaykge1xuICAgICAgdmFyIGNvbmZpcm0gPSAkbWREaWFsb2cuY29uZmlybSgpXG4gICAgICAudGl0bGUoXCJDb25maXJtIERlbGV0aW9uXCIpXG4gICAgICAuYXJpYUxhYmVsKCdEZWxldGUnKVxuICAgICAgLm9rKCdEZWxldGUnKVxuICAgICAgLmNhbmNlbCgnQ2FuY2VsJyk7XG4gICAgICAkbWREaWFsb2cuc2hvdyhjb25maXJtKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gU3RhY2tCdWlsZGVyRmFjdG9yeS5kZWxldGUoc3RhY2spO1xuICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5zdGF0dXMgPSAnRGVsZXRlIGNhbmNlbGxlZCc7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnJ1blRlc3RzID0gZnVuY3Rpb24oc3RhY2spIHtcbiAgICAkc2NvcGUuc2V0VG9nZ2xlKCk7XG4gICAgbGV0IHRlc3RzID0gc3RhY2sudGVzdHMuc2xpY2UoKTtcblxuICAgIC8vIFJlY3Vyc2l2ZSBmdW5jdGlvbiB0aGF0IHNoaWZ0cyBhIHRlc3Qgb2ZmIG9mIHRoZSB0ZXN0cyBhcnJheSB3aXRoIGVhY2ggcmVjdXJzaXZlIGNhbGwgdW50aWwgdGhlIGFycmF5IGlzIGVtcHR5XG4gICAgbGV0IHJ1blRlc3RzID0gZnVuY3Rpb24odGVzdHMpIHtcbiAgICAgIGlmICghdGVzdHMubGVuZ3RoKSB7XG4gICAgICAgIFRlc3RGYWN0b3J5LmNsZWFyUmVzcG9uc2VQb29sKCk7XG4gICAgICAgIHN0YWNrLmxhc3RSdW4gPSBuZXcgRGF0ZSgpO1xuICAgICAgICByZXR1cm4gU3RhY2tWaWV3RmFjdG9yeS5lZGl0KHN0YWNrKVxuICAgICAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gICAgICB9XG4gICAgICBsZXQgdGVzdCA9IHRlc3RzLnNoaWZ0KCk7XG4gICAgICBsZXQgZnVuY0FycmF5ID0gW107XG4gICAgICBsZXQgY2FuY2VsVGVzdCA9IGZhbHNlO1xuICAgICAgbGV0IHJlc3VsdHMgPSB7XG4gICAgICAgICAgdmFsaWRhdG9yUmVzdWx0czogW10sXG4gICAgICAgICAgbGFzdFJ1bjogRGF0ZS5ub3coKVxuICAgICAgfTtcbiAgICAgIGlmICh0eXBlb2YgdGVzdC52YWxpZGF0b3JzID09PSAnc3RyaW5nJykgdGVzdC52YWxpZGF0b3JzID0gSlNPTi5wYXJzZSh0ZXN0LnZhbGlkYXRvcnMpO1xuICAgICAgaWYgKHR5cGVvZiB0ZXN0LnZhbGlkYXRvcnMgPT09ICdzdHJpbmcnKSB0ZXN0LnZhbGlkYXRvcnMgPSBKU09OLnBhcnNlKHRlc3QudmFsaWRhdG9ycyk7XG4gICAgICB0ZXN0LnZhbGlkYXRvcnMuZm9yRWFjaChmdW5jdGlvbiAoZWxlbSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGVsZW0uZnVuYy5sZW5ndGggPiAyNikge1xuICAgICAgICAgICAgICAgIGZ1bmNBcnJheS5wdXNoKGV2YWwoZWxlbS5mdW5jKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICBhbGVydCgnVGhlcmUgd2FzIGFuIGVycm9yIHBhcnNpbmcgdGhlICcgKyBlbGVtLm5hbWUgKyAnIHZhbGlkYXRvciBmdW5jdGlvbi4gUmVmYWN0b3IgdGhhdCBmdW5jdGlvbiBhbmQgdHJ5IGFnYWluLicpO1xuICAgICAgICAgICAgY2FuY2VsVGVzdCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgaWYgKGNhbmNlbFRlc3QpIHJldHVybjtcbiAgICAgIFRlc3RGYWN0b3J5LnJ1blRlc3QodGVzdClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc0RhdGEpIHtcblxuICAgICAgICB0ZXN0LnJlc3BvbnNlID0gSlNPTi5zdHJpbmdpZnkocmVzRGF0YSk7XG5cbiAgICAgICAgVGVzdEZhY3RvcnkuYWRkVG9SZXNwb25zZVBvb2woe1xuICAgICAgICAgIG5hbWU6IHRlc3QubmFtZSxcbiAgICAgICAgICByZXNwb25zZTogcmVzRGF0YVxuICAgICAgICB9KTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZ1bmNBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnZhbGlkYXRvclJlc3VsdHMucHVzaCghIWZ1bmNBcnJheVtpXShyZXNEYXRhKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKXtcbiAgICAgICAgICAgICAgICBhbGVydCgnVGhlIGZvbGxvd2luZyBlcnJvciBvY2N1cmVkIHdoaWxlIHJ1bm5pbmcgdGhlICcgKyB0ZXN0LnZhbGlkYXRvcnNbaV0ubmFtZSArICcgdmFsaWRhdG9yIGZ1bmN0aW9uOiAnICsgZXJyLm1lc3NhZ2UgKyAnLiBSZWZhY3RvciB0aGF0IGZ1bmN0aW9uIGFuZCB0cnkgYWdhaW4uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChyZXN1bHRzLnZhbGlkYXRvclJlc3VsdHMubGVuZ3RoKSByZXN1bHRzLmZpbmFsUmVzdWx0ID0gcmVzdWx0cy52YWxpZGF0b3JSZXN1bHRzLmV2ZXJ5KHZhbGlkYXRvclJlc3VsdCA9PiB2YWxpZGF0b3JSZXN1bHQpO1xuICAgICAgICByZXR1cm4gVGVzdEZhY3Rvcnkuc2F2ZVJlc3VsdHMocmVzdWx0cywgdGVzdCk7XG4gICAgICB9KVxuICAgICAgLnRoZW4odXBkYXRlZFRlc3QgPT4ge1xuICAgICAgICBsZXQgZGF0YU9iaiA9IHtcbiAgICAgICAgICB0ZXN0OiB1cGRhdGVkVGVzdCxcbiAgICAgICAgICBzdGFjazogc3RhY2tcbiAgICAgICAgfTtcbiAgICAgICAgJHJvb3RTY29wZS4kZW1pdCgndGVzdFVwZGF0ZScsIGRhdGFPYmopO1xuICAgICAgICBydW5UZXN0cyh0ZXN0cyk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgIH07XG4gICAgcnVuVGVzdHModGVzdHMpO1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCRzY29wZS5zZXRUb2dnbGUsIDgwMCk7XG4gIH07XG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnc2lkZWJhcicsIGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0UnLFxuICAgIHRlbXBsYXRlVXJsOiBwcm9jZXNzLmN3ZCgpICsgJy9icm93c2VyL2pzL2NvbW1vbi9kaXJlY3RpdmVzL3NpZGViYXIvc2lkZWJhci5odG1sJyxcbiAgICBjb250cm9sbGVyOiAnc2lkZWJhckN0cmwnXG4gIH07XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ3NpZGViYXJDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkbG9nLCAkcm9vdFNjb3BlLCBTdGFja0J1aWxkZXJGYWN0b3J5LCBBdXRoU2VydmljZSkge1xuXG4gIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24odXNlcil7XG4gICAgJHNjb3BlLnVzZXIgPSB1c2VyO1xuICB9KTtcblxuICBpZiAoJHNjb3BlLnVzZXIpIHtcbiAgICBTdGFja0J1aWxkZXJGYWN0b3J5LmdldFVzZXJTdGFja3MoJHNjb3BlLnVzZXIpXG4gICAgLnRoZW4oZnVuY3Rpb24oc3RhY2tzKXtcbiAgICAgICRzY29wZS5zdGFja3MgPSBzdGFja3M7XG4gICAgfSk7XG4gIH1cblxuICAkcm9vdFNjb3BlLiRvbignY3JlYXRlc3RhY2snLCBmdW5jdGlvbihldmVudCwgZGF0YSl7XG4gICAgJHNjb3BlLnN0YWNrcy5wdXNoKGRhdGEpO1xuICAgICRzY29wZS4kZXZhbEFzeW5jKCk7XG4gIH0pO1xuXG4gICRyb290U2NvcGUuJG9uKCdkZWxldGVzdGFjaycsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKXtcbiAgICAkc2NvcGUuc3RhY2tzID0gJHNjb3BlLnN0YWNrcy5maWx0ZXIoZnVuY3Rpb24oZWxlKXtcbiAgICAgIHJldHVybiBkYXRhICE9PSBlbGUuX2lkO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd0ZXN0YnVpbGRlcicsIHtcbiAgICAgICAgdXJsOiAnL3Rlc3RidWlsZGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6IHByb2Nlc3MuY3dkKCkgKyAnL2Jyb3dzZXIvanMvY29tbW9uL2RpcmVjdGl2ZXMvdGVzdGJ1aWxkZXIvbmV3VGVzdC5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1Rlc3RidWlsZGVyQ3RybCdcbiAgICB9KTtcbn0pO1xuXG5hcHAuZGlyZWN0aXZlKCd0ZXN0YnVpbGRlcicsIGZ1bmN0aW9uKCl7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICB0ZW1wbGF0ZVVybDogcHJvY2Vzcy5jd2QoKSArICcvYnJvd3Nlci9qcy9jb21tb24vZGlyZWN0aXZlcy90ZXN0YnVpbGRlci90ZXN0YnVpbGRlci5odG1sJ1xuICB9O1xufSk7XG5cbmFwcC5mYWN0b3J5KCdUZXN0RmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkbG9nLCBUZXN0QnVpbGRlckZhY3RvcnkpIHtcblxuICAgIGxldCBSZXNwb25zZVBvb2wgPSBmdW5jdGlvbigpIHt9O1xuXG4gICAgUmVzcG9uc2VQb29sLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uKGtleSkgeyAvL3Rlc3QxLmRhdGEudXNlcklkXG4gICAgICAgIGxldCBjdXJyZW50VGVzdE5hbWUgPSB0aGlzLmN1cnJlbnRUZXN0TmFtZTtcbiAgICAgICAgbGV0IGtleXMgPSBrZXkuc3BsaXQoJy4nKTsgLy9bJ3Rlc3QxJywgJ2RhdGEnLCAnb2JqZWN0SWQnXVxuICAgICAgICByZXR1cm4ga2V5cy5yZWR1Y2UoZnVuY3Rpb24gKGN1cnJlbnRLZXksIG5leHRLZXkpIHsgLy9yZXNwb25zZVBvb2xbdGVzdDFdID4gdGVzdDFbZGF0YV0gPiBkYXRhW3VzZXJJZF1cblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudEtleVtuZXh0S2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQoJ1dob29wcyEgTmV3bWFuIGNvdWxkblxcJ3QgaW50ZXJwb2xhdGUgXCInICsga2V5ICsgJ1wiIHdoaWxlIHJ1bm5pbmcgXCInICsgY3VycmVudFRlc3ROYW1lICsgJ1wiLiBNYWtlIHN1cmUgeW91XFwncmUgaW50ZXJwb2xhdGluZyB0aGUgcmlnaHQgdmFsdWUsIGFuZCB0cnkgdG8gcnVuIHRoZSBlbnRpcmUgc3RhY2sgZnJvbSB0aGUgaG9tZSBwYWdlLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0sIHJlc3BvbnNlUG9vbCk7XG4gICAgfTtcblxuICAgIGxldCByZXNwb25zZVBvb2wgPSBuZXcgUmVzcG9uc2VQb29sKCk7XG5cbiAgICBsZXQgaW50ZXJwb2xhdGUgPSBmdW5jdGlvbihpbnB1dCkge1xuXG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7IC8vJ2h0dHA6Ly9teXNpdGUuY29tL3VzZXJzL3t7dGVzdDEuZGF0YS51c2VySWR9fS9wb3N0cy97e3Rlc3QyLmRhdGEucG9zdElkfX0nXG4gICAgICAgICAgICBpZiAoaW5wdXQuaW5kZXhPZigne3snKSA9PT0gLTEpIHJldHVybiBpbnB1dDtcbiAgICAgICAgICAgIGxldCBuZXdWYWxzID0gW107XG5cbiAgICAgICAgICAgIGlucHV0LnNwbGl0KFwifX1cIilcbiAgICAgICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uKGVsZW0pIHtcbiAgICAgICAgICAgICAgICBpZiAoZWxlbS5pbmRleE9mKFwie3tcIikgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBzbGljZVBvaW50ID0gZWxlbS5pbmRleE9mKFwie3tcIik7XG4gICAgICAgICAgICAgICAgICAgIGxldCBzbGljZWQgPSBlbGVtLnNsaWNlKHNsaWNlUG9pbnQpO1xuICAgICAgICAgICAgICAgICAgICBuZXdWYWxzLnB1c2goZWxlbS5yZXBsYWNlKHNsaWNlZCwgcmVzcG9uc2VQb29sLmdldFZhbHVlKHNsaWNlZC5zdWJzdHJpbmcoMikpKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIG5ld1ZhbHMucHVzaChlbGVtKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gbmV3VmFscy5qb2luKCcnKTsgLy8naHR0cDovL215c2l0ZS5jb20vdXNlcnMvMTIzL3Bvc3RzLzQ1NidcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoaW5wdXQpKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQubWFwKGludGVycG9sYXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiBpbnB1dCkge1xuICAgICAgICAgICAgICAgIGlucHV0W2tleV0gPSBpbnRlcnBvbGF0ZShpbnB1dFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgcmV0dXJuIGlucHV0O1xuICAgIH07XG5cbiAgICBsZXQgbWFrZVJlcXVlc3QgPSBmdW5jdGlvbih0ZXN0KSB7XG5cbiAgICAgICAgbGV0IHJlcXVlc3RPYmogPSB7fTtcblxuICAgICAgICByZXF1ZXN0T2JqLm1ldGhvZCA9IHRlc3QubWV0aG9kO1xuICAgICAgICByZXF1ZXN0T2JqLnVybCA9IHRlc3QudXJsO1xuXG4gICAgICAgIGlmICh0ZXN0LmhlYWRlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXF1ZXN0T2JqLmhlYWRlcnMgPSB7fTtcbiAgICAgICAgICAgIHRlc3QuaGVhZGVycy5mb3JFYWNoKGhlYWRlciA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGhlYWRlciAhPT0gbnVsbCkgcmVxdWVzdE9iai5oZWFkZXJzW2hlYWRlci5rZXldID0gcmVxdWVzdE9iai5oZWFkZXJzW2hlYWRlci52YWx1ZV07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdGVzdERhdGE7XG4gICAgICAgIGlmICh0eXBlb2YgdGVzdC5ib2R5LmRhdGEgPT09ICdzdHJpbmcnKSB0ZXN0LmJvZHkuZGF0YSA9IEpTT04ucGFyc2UodGVzdC5ib2R5LmRhdGEpO1xuICAgICAgICB0ZXN0RGF0YSA9IHRlc3QuYm9keS5kYXRhO1xuXG4gICAgICAgIGlmICh0ZXN0LmJvZHkuYm9keXR5cGUgPT09ICdyYXcnKSB7XG4gICAgICAgICAgICByZXF1ZXN0T2JqLmRhdGEgPSB0ZXN0RGF0YS5yZWR1Y2UoZnVuY3Rpb24oZGF0YU9iaiwgbmV4dEJvZHlQYWlyKSB7XG4gICAgICAgICAgICAgICAgZGF0YU9ialtuZXh0Qm9keVBhaXIua2V5XSA9IG5leHRCb2R5UGFpci52YWx1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YU9iajtcbiAgICAgICAgICAgIH0sIHt9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0ZXN0LmJvZHkuYm9keXR5cGUgPT09ICd4LXd3dy1mb3JtLXVybGVuY29kZWQnKSB7XG4gICAgICAgICAgICByZXF1ZXN0T2JqLmRhdGEgPSB0ZXN0RGF0YS5yZWR1Y2UoZnVuY3Rpb24oZGF0YUFyciwgbmV4dEJvZHlQYWlyKSB7XG4gICAgICAgICAgICAgICAgZGF0YUFyci5wdXNoKG5leHRCb2R5UGFpci5rZXkgKyAnPScgKyBuZXh0Qm9keVBhaXIudmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhQXJyO1xuICAgICAgICAgICAgfSxbXSkuam9pbignJicpO1xuICAgICAgICAgICAgcmVxdWVzdE9iai5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnO1xuICAgICAgICB9XG4gICAgICAgIGxldCBmb3JtRGF0YTtcbiAgICAgICAgaWYgKHRlc3QuYm9keS5ib2R5dHlwZSA9PT0gJ2Zvcm0tZGF0YScpIHtcbiAgICAgICAgICAgIGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICAgICAgICB0ZXN0RGF0YS5mb3JFYWNoKGtleVZhbHVlUGFpciA9PiBmb3JtRGF0YS5zZXQoa2V5VmFsdWVQYWlyLmtleSwga2V5VmFsdWVQYWlyLnZhbHVlKSk7XG4gICAgICAgICAgICByZXF1ZXN0T2JqLmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcblxuICAgICAgICAgICAgaWYgKHRlc3QuYm9keS5ib2R5dHlwZSA9PT0gJ2Zvcm0tZGF0YScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHBbcmVxdWVzdE9iai5tZXRob2QudG9Mb3dlckNhc2UoKV0ocmVxdWVzdE9iai51cmwsIGZvcm1EYXRhLCB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVJlcXVlc3Q6IGFuZ3VsYXIuaWRlbnRpdHksXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHJlcXVlc3RPYmouaGVhZGVyc1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cChyZXF1ZXN0T2JqKVxuICAgICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoKGVycm9yKSB7XG4gICAgICAgICAgICBhbGVydCgnV2hvb3BzISBEdXJpbmcgJyArIHJlc3BvbnNlUG9vbC5jdXJyZW50VGVzdE5hbWUgKyAnLCB5b3UgYXNrZWQgTmV3bWFuIHRvIHNlbmQgYSByZXF1ZXN0IHRvICcgKyByZXF1ZXN0T2JqLnVybCArICdidXQgdGhhdCBkb2VzblxcJ3QgYXBwZWFyIHRvIGJlIGEgdmFsaWQgYWRkcmVzcy4nKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIHJldHVybiB7XG4gICAgICAgIHJ1blRlc3Q6IGZ1bmN0aW9uKHRlc3QpIHtcblxuICAgICAgICAgICAgcmVzcG9uc2VQb29sLmN1cnJlbnRUZXN0TmFtZSA9IHRlc3QubmFtZTtcblxuICAgICAgICAgICAgbGV0IGNvcHlPZlRlc3QgPSBfLmNsb25lRGVlcCh0ZXN0KTtcblxuICAgICAgICAgICAgbGV0IGludGVycG9sYXRlZFRlc3QgPSBpbnRlcnBvbGF0ZShjb3B5T2ZUZXN0KTtcblxuICAgICAgICAgICAgLy9Db25zdHJ1Y3QgYW5kIHNlbmQgdGhlICRodHRwIHJlcXVlc3RcbiAgICAgICAgICAgIHJldHVybiBtYWtlUmVxdWVzdChpbnRlcnBvbGF0ZWRUZXN0KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVyci5jb25maWcudXJsKSBhbGVydCgnV2hvb3BzISBEdXJpbmcgJyArIHRlc3QubmFtZSArICcsIHdlIHRyaWVkIHRvIHRlc3QgJyArIGVyci5jb25maWcudXJsICsgJyBidXQgaXQgbG9va3MgbGlrZSB0aGlzIGlzblxcJ3QgYSB2YWxpZCBhZGRyZXNzLicpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHNhdmVSZXN1bHRzOiBmdW5jdGlvbihyZXN1bHRzLCB0ZXN0KSB7XG5cbiAgICAgICAgICAgIHJlc3VsdHMudGVzdCA9IHRlc3QuX2lkO1xuXG4gICAgICAgICAgICByZXR1cm4gVGVzdEJ1aWxkZXJGYWN0b3J5LmVkaXQodGVzdClcbiAgICAgICAgICAgIC50aGVuKCgpID0+ICRodHRwLnBvc3QoJ2h0dHA6Ly9sb2NhbGhvc3Q6MTMzNy9hcGkvcmVzdWx0cycsIHJlc3VsdHMpKVxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHJlcy5kYXRhKVxuICAgICAgICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgICAgICB9LFxuICAgICAgICBnZXRQcmV2aW91c1Jlc3VsdHM6IGZ1bmN0aW9uKHRlc3QpIHtcbiAgICAgICAgICAgIGlmICghdGVzdC5yZXN1bHQpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCdodHRwOi8vbG9jYWxob3N0OjEzMzcvYXBpL3Jlc3VsdHMvJyArIHRlc3QucmVzdWx0KVxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHJlcy5kYXRhKTtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkVG9SZXNwb25zZVBvb2w6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHJlc3BvbnNlUG9vbFtkYXRhLm5hbWVdID0gZGF0YS5yZXNwb25zZTtcbiAgICAgICAgfSxcbiAgICAgICAgY2xlYXJSZXNwb25zZVBvb2w6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVzcG9uc2VQb29sID0gbmV3IFJlc3BvbnNlUG9vbCgpO1xuICAgICAgICB9LFxuICAgICAgICBnZXRTdGFja1Rlc3RzOiBmdW5jdGlvbih2aWV3ZWRUZXN0KSB7XG4gICAgICAgICAgICBpZiAoIXZpZXdlZFRlc3Quc3RhY2spIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnaHR0cDovL2xvY2FsaG9zdDoxMzM3L2FwaS9zdGFja3MvJyArIHZpZXdlZFRlc3Quc3RhY2spXG4gICAgICAgICAgICAudGhlbihyZXMgPT4gcmVzLmRhdGEudGVzdHMpXG4gICAgICAgICAgICAudGhlbih0ZXN0cyA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGluY2x1ZGVUZXN0ID0gdHJ1ZTsgLy9XaWxsIGluY2x1ZGUgb25seSB0ZXN0cyB0aGF0IHByZWNlZGUgdGhlIHZpZXdlZFRlc3QgaW4gdGhlIHN0YWNrXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRlc3RzLmZpbHRlcih0ZXN0ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRlc3QuX2lkID09PSB2aWV3ZWRUZXN0Ll9pZCkgaW5jbHVkZVRlc3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluY2x1ZGVUZXN0O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdUZXN0YnVpbGRlckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgVGVzdEJ1aWxkZXJGYWN0b3J5LCAkcm9vdFNjb3BlLCAkbG9nLCBBdXRoU2VydmljZSwgVGVzdEZhY3RvcnksICRtZERpYWxvZywgJG1kTWVkaWEpe1xuXG4gICRzY29wZS50b2dnbGUgPSBmYWxzZTtcbiAgJHNjb3BlLnNldFRvZ2dsZSA9IGZ1bmN0aW9uKCl7XG4gICAgJHNjb3BlLnRvZ2dsZSA9ICEkc2NvcGUudG9nZ2xlO1xuICAgICRzY29wZS4kZXZhbEFzeW5jKCk7XG4gICAgfTtcblxuXG4gICAgJHNjb3BlLnRlc3QgPSB7fTtcblx0JHNjb3BlLnRlc3QubmFtZSA9ICduZXdUZXN0JztcbiAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKVxuICAgIC50aGVuKGZ1bmN0aW9uKHVzZXIpe1xuICAgIFx0JHNjb3BlLnRlc3QudXNlciA9IHVzZXI7XG4gICAgXHQkc2NvcGUudGVzdC51c2VySWQgPSB1c2VyLl9pZDtcbiAgICB9KVxuICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcblxuXHQkc2NvcGUudGVzdC51cmwgPSAnaHR0cDovLyc7XG5cdCRzY29wZS50ZXN0LnBhcmFtcyA9IFtdO1xuXHQkc2NvcGUudGVzdC5oZWFkZXJzID0gW107XG5cdCRzY29wZS50ZXN0LmJvZHkgPSB7fTtcblx0JHNjb3BlLnRlc3QuYm9keS5kYXRhID0gW107XG4gICAgJHNjb3BlLnRlc3QudmFsaWRhdG9ycyA9IFtdO1xuXHQkc2NvcGUudGVzdC5tZXRob2QgPSBcIkdFVFwiO1xuXHQkc2NvcGUuc2hvd1BhcmFtcyA9IGZhbHNlO1xuXHQkc2NvcGUuc2hvd0hlYWRlcnMgPSBmYWxzZTtcblx0JHNjb3BlLnNob3dCb2R5ID0gZmFsc2U7XG4gICAgJHNjb3BlLnNob3dWYWxpZGF0b3JzID0gZmFsc2U7XG4gICAgJHNjb3BlLmlzTmV3VGVzdCA9IHRydWU7XG5cdCRzY29wZS5hZGRGb3JtID0gZnVuY3Rpb24oaW5kZXgsIHR5cGUpe1xuICAgICAgICBpZiAodHlwZSAhPT0gJ2JvZHknICYmIChpbmRleCA9PT0gJHNjb3BlLnRlc3RbdHlwZV0ubGVuZ3RoIC0gMSB8fCAkc2NvcGUudGVzdFt0eXBlXS5sZW5ndGggPT09IDApICkge1xuICAgICAgICAgICAgaWYgKHR5cGUgPT09IFwicGFyYW1zXCIpICRzY29wZS50ZXN0LnBhcmFtcy5wdXNoKHt9KTtcbiAgICAgICAgICAgIGlmICh0eXBlID09PSBcImhlYWRlcnNcIikgJHNjb3BlLnRlc3QuaGVhZGVycy5wdXNoKHt9KTtcbiAgICAgICAgICAgIGlmICh0eXBlID09PSBcInZhbGlkYXRvcnNcIikgJHNjb3BlLnRlc3QudmFsaWRhdG9ycy5wdXNoKHtuYW1lOiAndmFsaWRhdG9yJyArIChOdW1iZXIoJHNjb3BlLnRlc3QudmFsaWRhdG9ycy5sZW5ndGgpICsgMSkudG9TdHJpbmcoKSwgZnVuYzogXCIoZnVuY3Rpb24ocmVzcG9uc2UpIHtcXG5cXG59KTtcIn0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGluZGV4ID09PSAkc2NvcGUudGVzdFt0eXBlXS5kYXRhLmxlbmd0aCAtIDEgfHwgJHNjb3BlLnRlc3RbdHlwZV0uZGF0YS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICRzY29wZS50ZXN0LmJvZHkuZGF0YS5wdXNoKHt9KTtcbiAgICAgICAgfVxuICAgICRzY29wZS4kZXZhbEFzeW5jKCk7XG59O1xuXG5cdCRzY29wZS5zaG93Rm9ybSA9IGZ1bmN0aW9uKCl7XG5cdFx0aWYgKCRzY29wZS50ZXN0LnBhcmFtcy5sZW5ndGggPT09IDApIHtcblx0XHRcdCRzY29wZS5hZGRGb3JtKDAsXCJwYXJhbXNcIik7XG5cdFx0XHQvLyAkc2NvcGUubnVtUGFyYW1zKys7XG5cdFx0fVxuXHRcdCRzY29wZS5zaG93UGFyYW1zID0gISRzY29wZS5zaG93UGFyYW1zO1xuXHR9O1xuXG5cdCRzY29wZS5kaXNwbGF5SGVhZGVycyA9IGZ1bmN0aW9uKCl7XG5cdFx0aWYgKCRzY29wZS50ZXN0LmhlYWRlcnMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHQkc2NvcGUuYWRkRm9ybSgwLFwiaGVhZGVyc1wiKTtcblx0XHRcdC8vICRzY29wZS5udW1IZWFkZXJzKys7XG5cdFx0fVxuXHRcdCRzY29wZS5zaG93SGVhZGVycyA9ICEkc2NvcGUuc2hvd0hlYWRlcnM7XG5cdH07XG5cblx0JHNjb3BlLmRpc3BsYXlCb2R5ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgaWYgKCRzY29wZS50ZXN0LmJvZHkuZGF0YS5sZW5ndGggPT09IDApIHtcblx0XHRcdCRzY29wZS5hZGRGb3JtKDAsXCJib2R5XCIpO1xuXHRcdFx0Ly8gJHNjb3BlLm51bUJvZHlPYmorKztcblx0XHR9XG5cdFx0JHNjb3BlLnNob3dCb2R5ID0gISRzY29wZS5zaG93Qm9keTtcblx0fTtcblxuICAgICRzY29wZS5kaXNwbGF5VmFsaWRhdG9ycyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGlmICgkc2NvcGUudGVzdC52YWxpZGF0b3JzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgJHNjb3BlLmFkZEZvcm0oMCxcInZhbGlkYXRvcnNcIik7XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLnNob3dWYWxpZGF0b3JzID0gISRzY29wZS5zaG93VmFsaWRhdG9ycztcbiAgICB9O1xuXG5cdCRzY29wZS5jb21wb3NlVVJMID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGluZGV4UXVlc3Rpb25NYXJrID0gJHNjb3BlLnRlc3QudXJsLmluZGV4T2YoJz8nKTtcblx0XHRpZiAoaW5kZXhRdWVzdGlvbk1hcmsgIT09IC0xKSB7XG5cdFx0XHQkc2NvcGUudGVzdC51cmwgPSAkc2NvcGUudGVzdC51cmwuc3Vic3RyaW5nKDAsaW5kZXhRdWVzdGlvbk1hcmspO1xuXHRcdH1cblx0XHQkc2NvcGUudGVzdC51cmwgKz0gJz8nO1xuXHRcdHZhciBmaW5hbFN0cmluZyA9ICcnO1xuXHRcdGZvcih2YXIgaSA9IDA7IGkgPCAkc2NvcGUudGVzdC5wYXJhbXMubGVuZ3RoIC0gMTsgaSsrKSB7XG5cdFx0XHRmaW5hbFN0cmluZyA9IGZpbmFsU3RyaW5nICsgJHNjb3BlLnRlc3QucGFyYW1zW2ldLmtleSArICc9JyArICRzY29wZS50ZXN0LnBhcmFtc1tpXS52YWx1ZSArICcmJztcblx0XHR9XG5cdFx0JHNjb3BlLnRlc3QudXJsICA9ICRzY29wZS50ZXN0LnVybCArIGZpbmFsU3RyaW5nO1xuXHRcdCRzY29wZS50ZXN0LnVybCA9ICRzY29wZS50ZXN0LnVybC5zbGljZSgwLCRzY29wZS50ZXN0LnVybC5sZW5ndGggLSAxKTtcblx0fTtcblxuICAgICRzY29wZS5pbnRlcm1lZGlhcnkgPSBmdW5jdGlvbigpe1xuICAgICAgICAkc2NvcGUuc2V0VG9nZ2xlKCk7XG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCRzY29wZS5zYXZlVGVzdCwgODAwKTtcbiAgICB9O1xuXG5cdCRzY29wZS5zYXZlVGVzdCA9IGZ1bmN0aW9uKCl7XG5cdFx0Ly8kc2NvcGUudGVzdC51cmwgPSAkc2NvcGUudGVzdC51cmw7XG5cdFx0JHNjb3BlLnRlc3QuY3JlYXRlZCA9IHRydWU7XG4gICAgICAgIC8vIHZhciBjdXJyZW50RGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgIC8vIHZhciB0aW1lID0gY3VycmVudERhdGUuZ2V0SG91cnMoKSArIFwiOlwiICsgY3VycmVudERhdGUuZ2V0TWludXRlcygpICsgXCI6XCIgKyBjdXJyZW50RGF0ZS5nZXRTZWNvbmRzKClcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJiZWZvcmUgVGVzdEJ1aWxkZXJGYWN0b3J5LmNyZWF0ZVwiLCB0aW1lKTtcblx0XHRUZXN0QnVpbGRlckZhY3RvcnkuY3JlYXRlKCRzY29wZS50ZXN0KVxuICAgICAgICAudGhlbigoKSA9PiAge1xuICAgICAgICAgICAgLy8gY3VycmVudERhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgLy8gdGltZSA9IGN1cnJlbnREYXRlLmdldEhvdXJzKCkgKyBcIjpcIiArIGN1cnJlbnREYXRlLmdldE1pbnV0ZXMoKSArIFwiOlwiICsgY3VycmVudERhdGUuZ2V0U2Vjb25kcygpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJnb2luZyB0byBuZXcgc3RhdGVcIiwgdGltZSk7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2FsbFRlc3RzJylcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuXHR9O1xuXG4kc2NvcGUucnVuVGVzdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgZnVuY0FycmF5ID0gW107XG4gICAgICAgIGxldCBjYW5jZWxUZXN0ID0gZmFsc2U7XG4gICAgICAgICRzY29wZS5yZXN1bHRzID0ge1xuICAgICAgICAgICAgdmFsaWRhdG9yUmVzdWx0czogW10sXG4gICAgICAgICAgICBsYXN0UnVuOiBEYXRlLm5vdygpXG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS50ZXN0LnZhbGlkYXRvcnMuZm9yRWFjaChmdW5jdGlvbiAoZWxlbSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoZWxlbS5mdW5jLmxlbmd0aCA+IDI2KSB7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmNBcnJheS5wdXNoKGV2YWwoZWxlbS5mdW5jKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQoJ1RoZXJlIHdhcyBhbiBlcnJvciBwYXJzaW5nIHRoZSAnICsgZWxlbS5uYW1lICsgJyB2YWxpZGF0b3IgZnVuY3Rpb24uIFJlZmFjdG9yIHRoYXQgZnVuY3Rpb24gYW5kIHRyeSBhZ2Fpbi4nKTtcbiAgICAgICAgICAgICAgICBjYW5jZWxUZXN0ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGNhbmNlbFRlc3QpIHJldHVybjtcbiAgICAgICAgVGVzdEZhY3RvcnkucnVuVGVzdCgkc2NvcGUudGVzdClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzRGF0YSkge1xuICAgICAgICAgICAgJHNjb3BlLnRlc3QucmVzcG9uc2UgPSBKU09OLnN0cmluZ2lmeShyZXNEYXRhKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZnVuY0FycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlc3VsdHMudmFsaWRhdG9yUmVzdWx0cy5wdXNoKCEhZnVuY0FycmF5W2ldKHJlc0RhdGEpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycil7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdUaGUgZm9sbG93aW5nIGVycm9yIG9jY3VyZWQgd2hpbGUgcnVubmluZyB0aGUgJyArICRzY29wZS50ZXN0LnZhbGlkYXRvcnNbaV0ubmFtZSArICcgdmFsaWRhdG9yIGZ1bmN0aW9uOiAnICsgZXJyLm1lc3NhZ2UgKyAnLiBSZWZhY3RvciB0aGF0IGZ1bmN0aW9uIGFuZCB0cnkgYWdhaW4uJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoJHNjb3BlLnJlc3VsdHMudmFsaWRhdG9yUmVzdWx0cy5sZW5ndGgpICRzY29wZS5yZXN1bHRzLmZpbmFsUmVzdWx0ID0gJHNjb3BlLnJlc3VsdHMudmFsaWRhdG9yUmVzdWx0cy5ldmVyeSh2YWxpZGF0b3JSZXN1bHQgPT4gdmFsaWRhdG9yUmVzdWx0KTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oJHNjb3BlLnNob3dSZXN1bHRzKTtcbiAgICB9O1xuXG5cbiAgICAgJHNjb3BlLnNob3dSZXN1bHRzID0gZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgJG1kRGlhbG9nLnRlc3QgPSAkc2NvcGUudGVzdDtcbiAgICAgICAgJG1kRGlhbG9nLnJlc3VsdHMgPSAkc2NvcGUucmVzdWx0cztcbiAgICAgICAgdmFyIHVzZUZ1bGxTY3JlZW4gPSAoJG1kTWVkaWEoJ3NtJykgfHwgJG1kTWVkaWEoJ3hzJykpICAmJiAkc2NvcGUuY3VzdG9tRnVsbHNjcmVlbjtcbiAgICAgICAgJG1kRGlhbG9nLnNob3coe1xuICAgICAgICAgICAgY29udHJvbGxlcjogRGlhbG9nQ29udHJvbGxlcixcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBwcm9jZXNzLmN3ZCgpICsgJy9icm93c2VyL2pzL2NvbW1vbi9kaXJlY3RpdmVzL3Rlc3RidWlsZGVyL3Rlc3RSZXN1bHRzLmh0bWwnLFxuICAgICAgICAgICAgcGFyZW50OiBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuYm9keSksXG4gICAgICAgICAgICB0YXJnZXRFdmVudDogZXYsXG4gICAgICAgICAgICBjbGlja091dHNpZGVUb0Nsb3NlOnRydWUsXG4gICAgICAgICAgICBmdWxsc2NyZWVuOiB1c2VGdWxsU2NyZWVuXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiBmdW5jdGlvbiBEaWFsb2dDb250cm9sbGVyKCRzY29wZSwgJG1kRGlhbG9nKSB7XG4gICAgICAgICRzY29wZS50ZXN0ID0gJG1kRGlhbG9nLnRlc3Q7XG4gICAgICAgICRzY29wZS5yZXN1bHRzID0gJG1kRGlhbG9nLnJlc3VsdHM7XG4gICAgICAgICRzY29wZS5oaWRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkbWREaWFsb2cuaGlkZSgpO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkbWREaWFsb2cuY2FuY2VsKCk7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5hbnN3ZXIgPSBmdW5jdGlvbihhbnN3ZXIpIHtcbiAgICAgICAgICAgICRtZERpYWxvZy5oaWRlKGFuc3dlcik7XG4gICAgICAgIH07XG4gICAgfVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ3ZhbGlkYXRvckVkaXRvcicsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiBwcm9jZXNzLmN3ZCgpICsgJy9icm93c2VyL2pzL2NvbW1vbi9kaXJlY3RpdmVzL3ZhbGlkYXRvckVkaXRvci92YWxpZGF0b3JFZGl0b3IuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdWYWxpZGF0b3JFZGl0b3JDdHJsJ1xuICAgIH07XG5cbn0pO1xuXG5hcHAuZmFjdG9yeSgnVmFsaWRhdG9yRWRpdG9yRmFjdG9yeScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7fTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignVmFsaWRhdG9yRWRpdG9yQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgVmFsaWRhdG9yRWRpdG9yRmFjdG9yeSkge1xuXG5cbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
