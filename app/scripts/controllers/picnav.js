'use strict';

angular.module('PicNavigatorApp.controllers', []).
  controller('initialController', function ($scope, $http, $q, picService, dataService) {
    var data = picService.getData();
    // push first dataSet to history
    $scope.prestineData = data;
    $scope.dataHistory = [];
    $scope.prestinePreview = [];
    $scope.indexHistory = [];

    $scope.clusterHeadUrls = dataService.getClusterHeadUrls(data);
    $scope.representativeUrls = dataService.getClusterPreviewUrls(data);
    $scope.representativeIds = dataService.getClusterPreviewIds(data);
    $scope.clusterIds = dataService.getClusterIds(data);

    $scope.picListA = [];
    $scope.picListB = [];
    $scope.picListView = [];

    $scope.title = null;
    $scope.movingBack = false;
    $scope.showHelp = true;

    $scope.wrapperHeight = 550;
    $scope.wrapperWidth = 550;

    var index, col, row;

    var fillContainer = function () {
      var deferred = $q.defer();
      if ($scope.title === 'A') {
        $scope.title = 'B';
        for (var i = 0; i < 9; i++) {
          $scope.picListB[i] = {
            srcs: {
              main: $scope.clusterHeadUrls[i],
              previewSrcs: $scope.representativeUrls[i]
            },
            id: $scope.clusterIds[i]
          };
        }
      } else {
        $scope.title = 'A';
        for (var j = 0; j < 9; j++) {
          $scope.picListA[j] = {
            srcs: {
              main: $scope.clusterHeadUrls[j],
              previewSrcs: $scope.representativeUrls[j]
            },
            id: $scope.clusterIds[j]
          };
        }
      }
      return deferred.promise;
    };

    // initial filling of picList
    fillContainer();


    var overlayScreenOn = function () {
      var deferred = $q.defer();
      $('.overlay').css('z-index', 20);
      return deferred.promise;
    };

    var overlayScreenOff = function () {
      $('.overlay').css('z-index', -20);
    };

    var httpRequest = function (clusterId, callback) {
      var deferred = $q.defer();
      $http.get('http://www.palm-search.com/service/view/image/subcluster/?&clusterId=' + clusterId).
        success(function (data) {
          $http.get('http://www.palm-search.com/service/view/cluster/?&clusterId=' + data.clusterID).
            success(function (data, status, headers) {
            }).then(function (data) {
              $scope.clusterHeadUrls = dataService.getClusterHeadUrls(data.data);
              $scope.representativeUrls = dataService.getClusterPreviewUrls(data.data);
              $scope.representativeIds = dataService.getClusterPreviewIds(data.data);
              $scope.clusterIds = dataService.getClusterIds(data.data);
              $scope.prestineData = data.data;
              callback();
            });
        }).
        error(function (data, status, headers) {
          console.log(status, headers);
          deferred.reject();
        });
    };

    var transition = function (index) {
      col = Math.floor(index / 3);
      row = index % 3;
      var deferred = $q.defer();
      var previewContainer = $('.mycontainer.preview');
      var activeContainer = $('.mycontainer.active');
      var hiddenContainer = $('.mycontainer.myhidden');

      // fade preview out
      previewContainer.addClass('myhidden');
      hiddenContainer.removeClass('notransition');

      activeContainer.removeClass('active').addClass('myhidden');
      // shift the container ...
      activeContainer.css({
        top: -col * $scope.wrapperWidth + 'px',
        left: -row * $scope.wrapperHeight + 'px'
      });
      // and resize it
      activeContainer.css({
        width: $scope.wrapperWidth * 3 + 'px',
        height: $scope.wrapperHeight * 3 + 'px'
      });

      activeContainer.addClass('notransition');
      setTimeout(function () {
        activeContainer.css({
          width: $scope.wrapperWidth / 3 + 'px',
          height: $scope.wrapperHeight / 3 + 'px',
          top: 0,
          left: 0
        });
      }, 1000);
      activeContainer.removeClass('notransition');

      // resize hidden container
      hiddenContainer.css({
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      });
      // and activate it
      hiddenContainer.removeClass('myhidden').addClass('active');
      previewContainer.removeClass('myhidden');
      return deferred.promise;
    };

    $scope.refreshPreview = function (index) {
      // preview is set, we don't need the help text anymore
      $scope.showHelp = false;
      for (var i = 0; i < 9; i++) {
        var originSrc = $scope.representativeUrls[index][i].replace('jpg160', 'jpg').replace('160', '400').replace('http://141.45.146.52/', 'http://t1.ftcdn.net/');
        $scope.picListView[i] = {
          src: $scope.representativeUrls[index][i],
          originSrc: originSrc
        };
      }
    };

    $scope.updatePicList = function (clusterId, index) {
      overlayScreenOn().
        then(httpRequest(clusterId, function () {
          fillContainer().
            then(transition(index).
              then(overlayScreenOff()));
        }));
    };

    $scope.stepBack = function (index) {
      $scope.picListView = [];
      $scope.showHelp = true;
      var oldData = $scope.dataHistory.pop();
      overlayScreenOn();
      var dataUpdate = function (oldData) {
        var deferred = $q.defer();
        $scope.clusterHeadUrls = dataService.getClusterHeadUrls(oldData);
        $scope.representativeUrls = dataService.getClusterPreviewUrls(oldData);
        $scope.representativeIds = dataService.getClusterPreviewIds(oldData);
        $scope.clusterIds = dataService.getClusterIds(oldData);
        return deferred.promise;
      };

      var backTransition = function () {
        var deferred = $q.defer();
        // move hidden container to wrapper mid
        $('.mycontainer.myhidden')
          .addClass('notransition')
          .css({
            top: $scope.wrapperHeight / 3 + 'px',
            left: $scope.wrapperHeight / 3 + 'px',
            width: $scope.wrapperWidth / 3 + 'px',
            height: $scope.wrapperHeight / 3 + 'px'
          });
        // perform transition from mid
        transition(4);
        return deferred.promise;
      };

      dataUpdate(oldData).
        then(fillContainer().
          then(backTransition().
            then(overlayScreenOff())));
    };
  }).
  controller('picBoxController', function ($scope, $timeout) {
    $scope.preview = false;
    $scope.picBoxMouseEnter = function (index) {
      //$timeout( function() {
      $scope.preview = true;
      var col = Math.floor(index / 3);
      var row = index % 3;
      // move the hidden container behind the img with the mouse over it
      $('.mycontainer.myhidden')
        .addClass('notransition')
        .css({
          top: col * $scope.wrapperHeight / 3 + 'px',
          left: row * $scope.wrapperHeight / 3 + 'px',
          width: $scope.wrapperWidth / 3 + 'px',
          height: $scope.wrapperHeight / 3 + 'px'
        });
    };
    $scope.picBoxMouseLeave = function () {
      $scope.preview = false;
    };
    $scope.picBoxClicked = function (index) {
      /*
      Start new search with picture id?
       */
      // push pristine copies to history
      $scope.indexHistory.push(index);
      $scope.dataHistory.push($scope.prestineData);

      $scope.preview = false;
      $scope.movingBack = false;

      $scope.updatePicList($scope.clusterIds[index], index);
      $scope.refreshPreview(index);
    };
  }).
  controller('historyController', function ($scope) {
    $scope.newSearch = function() {
      console.log('NEW');
      window.location.href = '/'
    };
    $scope.back = function () {
      if (!$scope.movingBack) {
        $scope.indexHistory.pop();
      }
      if ($scope.dataHistory.length === 0) {
        window.alert('Cannot go back any further');
      } else {
        $scope.stepBack($scope.indexHistory.pop());
        $scope.movingBack = true;
      }
    };
  }).
  controller('currentViewController', function ($scope) {
    $scope.showTooltip = false;
    $scope.picSelected = function (url) {
      //local       http://141.45.146.52/jpg160/00/12/74/62/160_F_12746292_T6hzDiFsVMwcMfOUqsP3b18eb5HyTRVm.jpg
      //fotoliaUrl  http://t1.ftcdn.net/jpg/00/18/47/57/400_F_18475763_ORbnj9aujO1GrtO7VgNPzejFZv8mMbwb.jpg
      if (window.confirm('Go to original image Url and leave this page?')) {
        window.location.href = url.replace('jpg160', 'jpg').replace('160', '400').replace('http://141.45.146.52/', 'http://t1.ftcdn.net/');
      }
    };

    $scope.picTooltipOn = function () {
      $scope.showTooltip = true;
    };
    $scope.picTooltipOff = function () {
      $scope.showTooltip = false;
    };
  });
