'use strict';

/**
 * @ngdoc function
 * @name picnavApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the picnavApp
 */
angular.module('PicNavigatorApp')
  .controller('MainCtrl', function ($scope, $http, $location, picService, httpService) {
    // TODO set focus on input field
    //$(document).ready(function () {
    //  console.log('foo');
    //  console.log($('#query'));
    //  $('.form').focus();
    //  //$('input').tagsinput('focus');
    //});

    $scope.search = function () {
      console.log($scope.quLevel);
      console.log($scope.quX);
      console.log($scope.quY);
      //var locationChange = function () {
      //  $scope.$apply(function () {
      //    $location.path('/picnav');
      //  });
      //};
      var level = + $scope.quLevel;
      var x = + $scope.quX;
      var y = + $scope.quY;
      var data = {
        level: level,
        x: x,
        y: y
      };

      picService.setData(data);
      $location.path('/picnav');

      //var fullTermQuery = '';
      //var fullCLusterQuery = '';
      //
      //for (var i = 0; i < $scope.query.length; i++) {
      //  fullTermQuery += '&terms=' + $scope.query[i].text;
      //  fullCLusterQuery += $scope.query[i].text + '%2C';
      //}
      //
      ////http using service

      //
      //// 1. terms request
      //httpService.makeCorsRequest('http://www.palm-search.com/service/view/image/terms/?' + fullTermQuery,
      //  function () {
      //    // 2. cluster request
      //    httpService.makeCorsRequest('http://www.palm-search.com/service/view/cluster/?&clusterId=10000%3B30%3B' + fullCLusterQuery + '%3B%3B',
      //      function (data) {
      //        picService.setData(data);
      //        locationChange();
      //      });
      //  });
    };
  });
