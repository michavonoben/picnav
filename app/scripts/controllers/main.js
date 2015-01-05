'use strict';

/**
 * @ngdoc function
 * @name picnavApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the picnavApp
 */
angular.module('PicNavigatorApp')
  .controller('MainCtrl', function ($scope, $http, $location, picService) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    var headers = {
      headers: {
        //'Access-Control-Allow-Headers': 'Content-Type',
        //'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        //'Access-Control-Request-Headers': 'x-requested-with',
        'Access-Control-Allow-Origin': '*'
      }
    };

    $scope.search = function () {
      // single query first to create ajax session id
      console.log($scope.query);
      var fullTermQuery = '';
      var fullCLusterQuery = '';
      for (var i=0; i<$scope.query.length; i++) {
        console.log($scope.query[i]['text']);
        fullTermQuery += '&terms=' + $scope.query[i]['text'];
        fullCLusterQuery += $scope.query[i]['text'] + '%2C'
      }
      console.log(fullTermQuery);
      $http.get('http://www.palm-search.com/service/view/image/terms/?' + fullTermQuery, headers
      //$http.get('http://www.palm-search.com/service/view/image/terms/?&terms=' + $scope.query, headers
        //{headers:
        //{
        //  'Access-Control-Request-Headers': 'x-requested-with'
        //  //'Access-Control-Expose-Headers': 'x-json',
        //  //'Access-Control-Allow-Headers': 'x-requested-with'
        //}}
      ).
        success(function (data) {
          console.log(data);
          picService.setImageData(data);
          // fire cluster query
          //         http://www.palm-search.com/service/view/cluster/?&clusterId=10000%3B30%3B   dog  %2C  tree   %2C%3B%3B
          $http.get('http://www.palm-search.com/service/view/cluster/?&clusterId=10000%3B30%3B' + fullCLusterQuery + '%3B%3B', headers
            //{headers:
            //////{'Access-Control-Request-Headers': 'x-requested-with'}}).,
            //{'Access-Control-Request-Headers': 'x-requested-with'}}
          ).
            success(function (data) {
              $location.path('/picnav');
              picService.setData(data);
            }).
            error(function (data, status, headers, config) {
              console.log(data, status, headers, config);
            });
        }).
        error(function (status, headers, config) {
          console.log(status, headers, config);
        });
    };
  });
