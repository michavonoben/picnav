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
  'ngTouch'
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
    return service;
  });
