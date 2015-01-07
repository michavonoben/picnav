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

    var headers = {
      headers: {
        //'Access-Control-Allow-Headers': 'Content-Type',
        //'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        //'Access-Control-Request-Headers': 'x-requested-with',
        'Access-Control-Request-Headers': 'http://mvo.suhail.uberspace.de'
      }
    };

    $scope.search = function () {
      var fullTermQuery = '';
      var fullCLusterQuery = '';

      for (var i = 0; i < $scope.query.length; i++) {
        fullTermQuery += '&terms=' + $scope.query[i]['text'];
        fullCLusterQuery += $scope.query[i]['text'] + '%2C';
      }

      //http using service
      var locationChange = function () {
        $scope.$apply(function () {
          $location.path("/picnav");
        });
      };

      httpService.makeCorsRequest('http://www.palm-search.com/service/view/image/terms/?' + fullTermQuery,
        function (data) {
          picService.setImageData(data);
        });
      httpService.makeCorsRequest('http://www.palm-search.com/service/view/cluster/?&clusterId=10000%3B30%3B' + fullCLusterQuery + '%3B%3B',
        function (data) {
          picService.setData(data);
          locationChange();
        });

      // old version:

      //$http.get('http://www.palm-search.com/service/view/image/terms/?' + fullTermQuery, headers
      //  //$http.get('http://www.palm-search.com/service/view/image/terms/?&terms=' + $scope.query, headers
      //  //{headers:
      //  //{
      //  //  'Access-Control-Request-Headers': 'x-requested-with'
      //  //  //'Access-Control-Expose-Headers': 'x-json',
      //  //  //'Access-Control-Allow-Headers': 'x-requested-with'
      //  //}}
      //).
      //  success(function (data) {
      //    picService.setImageData(data);
      //    // fire cluster query
      //    //         http://www.palm-search.com/service/view/cluster/?&clusterId=10000%3B30%3B   dog  %2C  tree   %2C%3B%3B
      //    $http.get('http://www.palm-search.com/service/view/cluster/?&clusterId=10000%3B30%3B' + fullCLusterQuery + '%3B%3B', headers
      //      //{headers:
      //      //////{'Access-Control-Request-Headers': 'x-requested-with'}}).,
      //      //{'Access-Control-Request-Headers': 'x-requested-with'}}
      //    ).
      //      success(function (data) {
      //        $location.path('/picnav');
      //        picService.setData(data);
      //      }).
      //      error(function (data, status, headers, config) {
      //        console.log(data, status, headers, config);
      //      });
      //  }).
      //  error(function (status, headers, config) {
      //    console.log(status, headers, config);
      //  });
    };
  });
