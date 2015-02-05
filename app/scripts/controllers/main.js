'use strict';

/**
 * @ngdoc function
 * @name picnavApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the picnavApp
 */
angular.module('PicNavigatorApp')
  .controller('MainCtrl', function ($scope, $http, $location, dataService, httpService) {
    // TODO set focus on input field
    //$(document).ready(function () {
    //  $('.form').focus();
    //  //$('input').tagsinput('focus');
    //});

    $scope.search = function () {
      var fullTermQuery = $scope.query[0].text;

      if ($scope.query.length > 1) {
        for (var i = 1; i < $scope.query.length; i++) {
          fullTermQuery += ',' + $scope.query[i].text
        }
      }


      var locationChange = function () {
        $scope.$apply(function () {
          $location.path('/picnav');
        });
      };

      // 1. terms request for session
      httpService.makeCorsRequest('http://141.45.146.52:8080/ImageMapService/search/term/' + fullTermQuery + '/16',
        function (data) {

          var clusterEdgeUrls = [];
          data.positions.forEach(function(pos) {
            // Receiving Level 1 data, calculate it up to level 4
            pos.level = 2;
            var x = Math.round(pos.x/2);
            var y = Math.round(pos.y/2);
            var max = 255;
            x = (x % max === 0 ? max : x % max);
            y = (y % max === 0 ? max : y % max);
            // shift negative values
            pos.x = (x < 0 ? max + x : x);
            pos.y = (y < 0 ? max + y : y);

            clusterEdgeUrls.push('http://141.45.146.52/netvis/netvis1024/data/l'+ pos.level + '/y' + pos.y+ '/x'+ pos.x + '.jpg');

          });
          dataService.setClusterEdges(clusterEdgeUrls);
          locationChange();
          // 2. cluster request
          //httpService.makeCorsRequest('http://www.palm-search.com/service/view/cluster/?&clusterId=10000%3B30%3B' + fullCLusterQuery + '%3B%3B',
          //  function (data) {
          //    picService.setData(data);
          //    locationChange();
          //  });
        });
    };
  });
