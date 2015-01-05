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
  'wu.masonry',
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
        images.push({src: baseURL + img['url'],
        id: img['imageId'],
        originSrc: originalSrc
      })});
      //console.log(images);
      return images;
    };
    return service;
  });
