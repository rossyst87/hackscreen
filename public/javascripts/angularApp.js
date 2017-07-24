const NOTIF_INFO = 0;
const NOTIF_WARN = 1;
const NOTIF_DANGER = 2;



var app = angular.module('app', ['ngAnimate']);
app.factory('mySharedService', function($rootScope) {
    var sharedService = {};

    sharedService.message = '';

    sharedService.prepForBroadcast = function(msg) {
        this.message = msg;
        this.broadcastItem();
    };

    sharedService.broadcastItem = function() {
        $rootScope.$broadcast('handleBroadcast');
    };

    return sharedService;
});

/**
 * Factory to create a socket and deal with events.
 * Events are on, which listen for emit events.
 */
app.factory('socket', ['$rootScope', function($rootScope) {
    var socket = io.connect();

    return {
        on: function(eventName, callback){
            socket.on(eventName, callback);
        },
        emit: function(eventName, data) {
            socket.emit(eventName, data);
        }
    };
}]);

app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
}
]);


app.controller('AppCtrl', ['$scope','mySharedService', 'socket', function ($scope, sharedService, socket) {
    $scope.screens = [
        {
            order: 2,
            name: "food_order",
            colours: {
                foreground: "#FED74C",
                background: "#333333"
            },
            time: 15
        },
        {
            order: 0,
            name: "index",
            colours: {
                foreground: "#000000",
                background: "#ffffff"
            },
            time: 15
        },
        {
            order: 1,
            name: "time",
            colours: {
                foreground: "#ff0000",
                background: "#660000"
            },
            time: 10
        },
        {
            order: 3,
            name: "metrolink",
            colours: {
                foreground: "#FED74C",
                background: "#333333"
            },
            time: 10
        }
    ];
    $scope.currentScreenIndex = 1;
    $scope.animationHide = false;

    $scope.notification = "";
    $scope.notificationTimeout;
    $scope.notificationLevel = NOTIF_INFO;

    $scope.setNotification = function(content, level){
        $scope.notification = content;
        $scope.notificationLevel = level;

        clearTimeout($scope.notificationTimeout);
        $scope.notificationTimeout = setTimeout(function () {
            $scope.$apply(function(){
               $scope.notification = "";
               $scope.notificationLevel = NOTIF_INFO;
            })
        }, 10000)
    };

    /**
     * Given a slide index, transitions between them.
     * Hides all slides, pauses for the fade out, then changes them and removes the hide.
     * @param indexTo
     */
    $scope.transitionScreens = function(indexTo, callback){
        //fade out all
        $scope.animationHide = true;
        console.log($scope.screens[indexTo].name);
        sharedService.prepForBroadcast($scope.screens[indexTo].name);

        //wait for anim, then change colours and fade in
        setTimeout(function(){
            $scope.$apply(function(){
                $scope.currentScreenIndex = indexTo;
                $scope.animationHide = false;
            });

            callback();

        },1000);

    };

    /**
     * Given an ID of a screen to show, will display it and trigger itself after the screens timeout.
     * @param indexToShow index of screen to show from screens array
     */
    $scope.showScreen = function(indexToShow){
        if(typeof $scope.screens[indexToShow] === 'undefined') indexToShow = 0;
        var timeToShowFor = $scope.screens[indexToShow].time;

        $scope.transitionScreens(indexToShow, function(){
            setTimeout(function(){
                var next = ($scope.currentScreenIndex === $scope.screens.length -1) ? 0 : $scope.currentScreenIndex + 1;
                $scope.$apply(function(){$scope.showScreen(next)});
            }, (timeToShowFor * 1000));
        })

    };

    /**
     * Initialisation function.
     * Orders screens and sets params.
     */
    $scope.init = function(){console.log("Initialised");
        $scope.screens.sort(function(a, b){
            return a.order > b.order;
        });
    };

    /**
     * NOTIFICATIONS HERE
     * When a new message arrives, deal with it.
     */
    socket.on('notification', function(data) {

        switch(data.topic){
            case 'door/outer/opened/username':
                $scope.setNotification(data.message + " has entered!", NOTIF_WARN);
                break;
            case 'door/outer/doorbell':
                $scope.setNotification("Ding Dong! That's the doorbell!", NOTIF_DANGER);
                break;
            default:
                //$scope.setNotification(data.topic + ": " + data.message, NOTIF_INFO);

        }

    });

    $scope.init();
    $scope.showScreen();
    $scope.setNotification("HELLO WORLD! I LIVE!", NOTIF_DANGER);



}]);


app.controller('IndexCtrl', ['$rootScope', '$scope', 'mySharedService', function ($rootScope, $scope, sharedService) {

    $scope.$on('handleBroadcast', function() {
        if(sharedService.message !== 'index') return 0;

    });



}]);

app.controller('FoodOrderCtrl', ['$rootScope', '$scope', '$http', 'mySharedService', function ($rootScope, $scope, $http, sharedService) {

}]);

app.controller('MetrolinkCtrl', ['$rootScope', '$scope', '$http', 'mySharedService', function ($rootScope, $scope, $http, sharedService) {
    $scope.$on('handleBroadcast', function() {

        if(sharedService.message !== 'metrolink') return 0;
        $scope.$emit('metrolink', true);
    });
}]);

app.controller('TimeCtrl', ['$rootScope', '$scope', '$http', 'mySharedService', function ($rootScope, $scope, $http, sharedService) {

    $scope.$on('handleBroadcast', function() {
        if(sharedService.message !== 'time') return 0;
        $scope.date = new Date();
    });

}]);
