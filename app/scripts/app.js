'use strict';

/**
 * @ngdoc overview
 * @name PicNavigatorApp
 * @description
 * # picnavApp
 *
 * Main module of the application.
 */
angular.module('PicNavigatorApp', [
  'PicNavigatorApp.controllers',
  'ngAnimate',
  'ngCookies',
  'ngResource',
  'ngRoute',
  'ngSanitize',
  'ngTouch',
  'ngTagsInput'
])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/picnav', {
        templateUrl: 'views/picnav.html',
        controller: 'initialController'
      })
      .otherwise({
        redirectTo: '/imgMap'
      });
  })
  .factory('picService', function () {
    var data;
    var items = [];
    var pics = {};

    pics.setData = function (d) {
      data = d;
    };

    pics.getData = function () {
      return data;
    };

    pics.addItem = function (item) {
      items.push(item);
    };
    pics.removeItem = function (item) {
      var index = items.indexOf(item);
      items.splice(index, 1);
    };
    pics.items = function () {
      return items;
    };

    return pics;
  })
  .factory('dataService', function () {
    var service = {};
    service.dataHistory = [];

    service.getClusterPreviewUrls = function (referenceClusterSpecs) {
      var clusterPreviewUrls = []; // 16
      var corL = referenceClusterSpecs.level;
      var x = referenceClusterSpecs.x;
      var y = referenceClusterSpecs.y;

      for (var a = 0; a < 4; a++) {
        for (var b = 0; b < 4; b++) {
          for (var c = 0; c < 4; c++) {
            var groupUrl = [];
            groupUrl.push('http://141.45.146.52/netvis/netvis1024/data/l' + corL + '/y' + y + '/x' + x + '.jpg');
            groupUrl.push('http://141.45.146.52/netvis/netvis1024/data/l' + corL + '/y' + (y + 1) + '/x' + x + '.jpg');
            groupUrl.push('http://141.45.146.52/netvis/netvis1024/data/l' + corL + '/y' + y + '/x' + (x + 1) + '.jpg');
            groupUrl.push('http://141.45.146.52/netvis/netvis1024/data/l' + corL + '/y' + (y + 1) + '/x' + (x + 1) + '.jpg');
            y += 2;
            clusterPreviewUrls.push(groupUrl);
          }
          x += 2;
          y = referenceClusterSpecs.y;
        }
      }
      return clusterPreviewUrls;
    };

    service.getClusterPreviewIds = function (data) {
      var clusterPreviewIds = []; // 16
      var groupUrl = [];          // 4
      var x = 0;

      for (var j = 0; j < 16; j++) {
        for (var i = 0; i < 4; i++) {
          groupUrl.push('http://141.45.146.52/netvis/netvis1024/data/l6/y6/x' + x + '.jpg');
        }
        x++;
        clusterPreviewIds.push(groupUrl);
      }
      //data.clusterPreviews.forEach(function (cluster) {
      //  var groupUrl = [];
      //  cluster.representatives.forEach(function (reps) {
      //    groupUrl.push(reps.id);
      //  });
      //  clusterPreviewIds.push(groupUrl);
      //  x++;
      //});
      return clusterPreviewIds;
    };

    service.getClusterIds = function (referenceClusterSpecs) {
      var l = referenceClusterSpecs.level;
      var x = referenceClusterSpecs.x;
      var y = referenceClusterSpecs.y;
      var clusterIds = [];

      for (var b = 0; b < 4; b++) {
        for (var c = 0; c < 4; c++) {
          clusterIds.push([l, x, y]);
          y += 2;
        }
        x += 2;
        y = referenceClusterSpecs.y;
      }
      return clusterIds;
    };

    // get the bigger sized fotolia result pics
    service.getImages = function (urls) {
      var images = [];
      urls.forEach(function(url) {
        var l = + url.substring(url.indexOf("l") + 1).split('/')[0];
        var y = + url.substring(url.indexOf("y") + 1).split('/')[0];
        var x = + url.substring(url.indexOf("x") + 1).split('.')[0];
        images.push({
          src: url,
          id: [l, x, y],
          originSrc: url
        });
      });
      return images;
    };

    service.addDataToHistory = function (clusterSpecs) {
      // for some odd reason this object has to be created again
      var prestineSpecs = {
        level: clusterSpecs.level,
        x: clusterSpecs.x,
        y: clusterSpecs.y
      };
      service.dataHistory.push(prestineSpecs);
    };

    service.getPreviousData = function () {
      var d;
      if (service.dataHistory.length === 1) {
        d = service.dataHistory[0];
      } else {
        d = service.dataHistory.pop();
      }
      return d;
    };

    return service;
  })
  .factory('httpService', function () {
    /**
     * Following code in this service was taken from:
     * http://www.html5rocks.com/en/tutorials/cors/#toc-making-a-cors-request
     * @author: Monsur Hossain
     */
    var service = {};
    var createCORSRequest = function (method, url) {
      var xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      if ('withCredentials' in xhr) {
        // XHR for Chrome/Firefox/Opera/Safari.
        xhr.open(method, url, true);
      } else if (typeof XDomainRequest !== 'undefined') {
        // XDomainRequest for IE.
        xhr = new XDomainRequest();
        xhr.open(method, url);
      } else {
        // CORS not supported.
        xhr = null;
      }
      return xhr;
    };

    var handleXLMData = function (data, callback) {
      callback(JSON.parse(data));
    };

    service.makeCorsRequest = function makeCorsRequest(url, callback) {
      var xhr = createCORSRequest('GET', url);
      if (!xhr) {
        window.alert('CORS not supported');
        return;
      }
      // Response handlers.
      xhr.onload = function () {
        if (xhr.responseText.split(':')[0] === 'error') {
          window.alert('Something went wrong. Please try again.\n\n\n' + 'Request url was: ' + url + '\n\n' + 'Response: ' + xhr.responseText);
        }
        handleXLMData(xhr.responseText, callback);
      };
      xhr.onerror = function () {
        console.log(xhr.response);
      };
      xhr.send();
    };
    // end @author: Monsur Hossain
    return service;
  })
;
