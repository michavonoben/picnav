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
        redirectTo: '/'
      });
  })
  .factory('picService', function () {
    var data;
    var imageData;
    var items = [];
    var pics = {};

    pics.setData = function (d) {
      data = d;
    };

    pics.setImageData = function (d) {
      imageData = d;
    };

    pics.getData = function () {
      return data;
    };

    pics.getImageData = function () {
      return imageData;
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

    service.getClusterHeadUrls = function (data) {
      var clustersHeadUrls = [];
      var baseURL = data['baseURL'];
      var i = 0;
      data['clusterPreviews'].forEach(function (cluster) {
        clustersHeadUrls.push(baseURL + cluster['representatives'][0]['url']);
        i++;
      });
      return clustersHeadUrls;
    };

    service.getClusterPreviewUrls = function (data) {
      var clusterPreviewUrls = [];
      var baseURL = data['baseURL'];
      var x = 0;
      data['clusterPreviews'].forEach(function (cluster) {
        var groupUrl = [];
        cluster['representatives'].forEach(function (reps) {
          groupUrl.push(baseURL + reps['url']);
        });
        clusterPreviewUrls.push(groupUrl)
        x++;
      });
      return clusterPreviewUrls;
    };

    service.getClusterPreviewIds = function (data) {
      var clusterPreviewIds = [];
      var x = 0;
      data['clusterPreviews'].forEach(function (cluster) {
        var groupUrl = [];
        cluster['representatives'].forEach(function (reps) {
          groupUrl.push(reps['id']);
        });
        clusterPreviewIds.push(groupUrl);
        x++;
      });
      return clusterPreviewIds;
    };

    service.getClusterIds = function (data) {
      var clusterIds = [];
      data['clusterPreviews'].forEach(function (cluster) {
        clusterIds.push(cluster['ID']);
      });
      return clusterIds;
    };

    service.getImages = function (data) {
      var baseURL = data['baseURL'];
      var images = [];
      //console.log(data);
      data['images'].forEach(function (img) {
        //local       http://141.45.146.52/jpg160/00/12/74/62/160_F_12746292_T6hzDiFsVMwcMfOUqsP3b18eb5HyTRVm.jpg
        //fotoliaUrl  http://t1.ftcdn.net/jpg/00/18/47/57/400_F_18475763_ORbnj9aujO1GrtO7VgNPzejFZv8mMbwb.jpg
        var originalSrc = 'http://t1.ftcdn.net/jpg/' + img['url'].replace('jpg160', 'jpg').replace('160', '400');
        images.push({
          src: baseURL + img['url'],
          id: img['imageId'],
          originSrc: originalSrc
        })
      });
      //console.log(images);
      return images;
    };
    return service;
  })
  .factory('httpService', function () {
    /**
     * Most part of code in this service was taken from:
     *
     * http://www.html5rocks.com/en/tutorials/cors/#toc-making-a-cors-request
     * @author: Monsur Hossain
     */
    var service = {};
    var createCORSRequest = function (method, url) {
      var xhr = new XMLHttpRequest();
      if ("withCredentials" in xhr) {
        // XHR for Chrome/Firefox/Opera/Safari.
        xhr.open(method, url, true);
      } else if (typeof XDomainRequest != "undefined") {
        // XDomainRequest for IE.
        xhr = new XDomainRequest();
        xhr.open(method, url);
      } else {
        // CORS not supported.
        xhr = null;
      }
      return xhr;
    };

    var handleXLMData = function(data, callback) {
      /**
       * CHROME Unexpected token 'e' might come from the XML responseText
       * which starts with 'error' in this case. For some reason the cluster ID
       * doesn't arrive correctly - but only on the first hit...
       * %3B seems to transform to ;
       *
       * --> send clusterId=10000%3B30%3Bbird%2C%3B%3B
       * --> Response: error: no clusterview possible with '10000;30;bird,;;'
       */
      callback(JSON.parse(data));
    };

    service.makeCorsRequest = function makeCorsRequest(url, callback) {
      var xhr = createCORSRequest('GET', url);
      if (!xhr) {
        alert('CORS not supported');
        return;
      }
      // Response handlers.
      xhr.onload = function () {
        if (xhr.responseText.split(':')[0] === 'error') {
          window.alert('Something went wrong. This is a known issue we\'re working on. Please just hit "search" again.\n\n\n'
          + 'Request url was: ' + url + '\n\n'
          + 'Response: ' + xhr.responseText);
        }
        handleXLMData(xhr.responseText, callback);
      };
      xhr.onerror = function () {
        console.log(xhr.response)
      };
      xhr.send();
    };

    return service;
  });
