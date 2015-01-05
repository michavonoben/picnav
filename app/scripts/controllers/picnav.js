'use strict';

angular.module('PicNavigatorApp.controllers', []).
  controller('initialController', function ($scope, $http, $q, picService, dataService) {
    $scope.dataHistory = [];
    //$scope.prestinePreview = [];
    //$scope.indexHistory = [];
    $scope.picListA = [];
    $scope.picListB = [];
    $scope.picListView = [];

    $scope.title = null;
    $scope.currentView = 'CLUSTER';
    $scope.movingBack = false;
    $scope.showHelp = true;
    $scope.resultPage = false;

    $scope.wrapperHeight = 550;
    $scope.wrapperWidth = 550;

    var data = picService.getData();
    var setData = function (data) {
      // save current data for history
      $scope.dataHistory.push(data)
      $scope.clusterHeadUrls = dataService.getClusterHeadUrls(data);
      $scope.representativeUrls = dataService.getClusterPreviewUrls(data);
      $scope.representativeIds = dataService.getClusterPreviewIds(data);
      $scope.clusterIds = dataService.getClusterIds(data);
    };
    var urls = {
      clusterRequest: "http://www.palm-search.com/service/view/cluster/?&clusterId=",
      singleRequest: "http://www.palm-search.com/service/view/image/reference/?&imageId=",
      subClusterRequest: "http://www.palm-search.com/service/view/image/subcluster/?&clusterId=",
      allowCORSHeader: {headers: {'Access-Control-Allow-Headers': 'x-requested-with'}}
    };
    var col, row;
    // first time only:
    $scope.resultPics = dataService.getImages(picService.getImageData());
    // push first dataSet to history
    //$scope.prestineData = data;
    setData(data);

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

    $scope.overlayScreenOn = function () {
      var deferred = $q.defer();
      $('.overlay').animate({
        zIndex: 20,
        opacity: 1
      }, {duration: 200, queue: false});
      return deferred.promise;
    };
    $scope.overlayScreenOff = function () {
      $('.overlay').animate({
        zIndex: -20,
        opacity: 0
      }, {duration: 200, queue: false});
    };

    /**
     * toggles the view between cluster-search and resultlist
     */
    $scope.toggleView = function () {
      var transitionTime = 200;
      if ($scope.currentView === 'CLUSTER') {
        // goto results
        $(function () {
          $("#resultPage").animate({
            opacity: 1,
            zIndex: 20,
            scrollTop: 0
          }, {duration: transitionTime, queue: false});
          $scope.currentView = 'RESULTS'
        });
      } else {
        // goto cluster
        $(function () {
          $("#resultPage").animate({
            opacity: 0,
            zIndex: -20
          }, {duration: transitionTime, queue: false});
          $scope.currentView = 'CLUSTER'
        });
      }
    };

    /**
     * fires a http request to palm-search.com either with a clusterID or a single picID
     * updates the resultPics list and if desired the clusters as well
     *
     * @param clusterId
     * @param isSingle
     * @param updateClusters
     * @param callback
     */
    $scope.httpRequest = function (clusterId, isSingle, updateClusters, callback) {
      $http.get(isSingle ? urls.singleRequest + clusterId : urls.subClusterRequest + clusterId, urls.allowCORSHeader).
        success(function (data) {
          $scope.resultPics = dataService.getImages(data);
          if (updateClusters) {
            $http.get(urls.clusterRequest + data.clusterID).
              success(function (data, status, headers) {
              }).then(function (data) {
                setData(data.data);
                callback();
              });
          } else {
            callback();
          }
        }).
        error(function (data, status, headers) {
          console.log(status, headers);
        });
    };

    /**
     * exchanges the two cluster containers and animates the transition
     * @param index
     * @returns {promise}
     */
    var clusterSearchTransition = function (index) {
      var deferred = $q.defer();
      var activeContainer = $('.mycontainer.active');
      var hiddenContainer = $('.mycontainer.myhidden');
      col = Math.floor(index / 3);
      row = index % 3;

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
      activeContainer.animate({
        width: $scope.wrapperWidth / 3 + 'px',
        height: $scope.wrapperHeight / 3 + 'px',
        top: 0,
        left: 0
      }, 1000);
      activeContainer.removeClass('notransition');
      // resize hidden container
      hiddenContainer.animate({
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }, 1200);
      // and activate it
      hiddenContainer.removeClass('myhidden').addClass('active');
      //previewContainer.removeClass('myhidden');
      return deferred.promise;
    };

    /**
     * fires httpRequest with clusterID and triggers animation
     * updates clusters
     * updates resultPic list
     * @param clusterId
     * @param isSingle
     * @param index
     */
    $scope.clusterSearch = function (clusterId, isSingle, index) {
      //console.log('Updating with', clusterId, isSingle, index);
      $scope.overlayScreenOn().
        then($scope.httpRequest(clusterId, isSingle, true, function () {
          fillContainer().
            then(clusterSearchTransition(index).
              then($scope.overlayScreenOff()));
        }));
    };

    $scope.stepBack = function () {
      //$scope.picListView = [];
      ////$scope.showHelp = true;


      var dataUpdate = function (oldData) {
        var deferred = $q.defer();
        $scope.clusterHeadUrls = dataService.getClusterHeadUrls(oldData);
        $scope.representativeUrls = dataService.getClusterPreviewUrls(oldData);
        $scope.representativeIds = dataService.getClusterPreviewIds(oldData);
        $scope.clusterIds = dataService.getClusterIds(oldData);
        $scope.resultPics = dataService.getImages(oldData);
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
        // perform clusterSearchTransition from mid
        clusterSearchTransition(4);
        return deferred.promise;
      };

      var oldData = $scope.dataHistory.pop();
      $scope.overlayScreenOn().then(
        dataUpdate(oldData).
          then(fillContainer().
            then(backTransition().
              then($scope.overlayScreenOff()))));
    };
  }).
  controller('picBoxController', function ($scope) {
    $scope.preview = false;
    /**
     * this is necessary so that the hidden container is in the right position for
     * the animation when the cluster search continues
     * @param index
     */
    $scope.picBoxMouseEnter = function (index) {
      var col = Math.floor(index / 3);
      var row = index % 3;
      $scope.preview = true;
      // move the hidden container behind the img with the mouse over it
      $('.mycontainer.myhidden')
        .addClass('notransition')
        .css({
          top: col * $scope.wrapperHeight / 2.5 + 'px',
          left: row * $scope.wrapperHeight / 2.5 + 'px',
          width: $scope.wrapperWidth / 2.5 + 'px',
          height: $scope.wrapperHeight / 2.5 + 'px'
        });
    };
    $scope.picBoxMouseLeave = function () {
      //console.log('left!');
      //$(function () {
      //  //$(event.target).css({zIndex: "-=50"});
      //  $(event.target).animate({
      //    //top: "-=20"
      //  }, {duration: 200, queue: false});
      //  $(event.target).find('.box.cluster').animate({
      //    //top: "-=40",
      //    //height: "+=20%"
      //  }, {duration: 200, queue: false})
      //});
      $scope.preview = false;
    };

    /**
     * passing through to clusterSearch
     * @param index
     */
    $scope.continueClusterSearch = function (index) {
      ////console.log('Search, ', index)
      ///*
      // Start new search with picture id?
      // */
      //// push pristine copies to history
      //$scope.indexHistory.push(index);
      //$scope.dataHistory.push($scope.prestineData);
      //
      //$scope.preview = false;
      $scope.movingBack = false;
      $scope.clusterSearch($scope.clusterIds[index], false, index);
    };

    /**
     * fires a httpRequest to get all 50 result pics for a cluster
     * then switches the view to the result page
     * updates resultPic list
     * @param index
     */
    $scope.goToResults = function (index) {
      var dataUpdate = function () {
        //$scope.indexHistory.push(index);
        //$scope.dataHistory.push($scope.prestineData);
        $scope.preview = false;
        $scope.movingBack = false;
        $scope.httpRequest($scope.clusterIds[index], false, false, function() {
          $scope.overlayScreenOff();
          $scope.toggleView();
        });
      };

      $scope.overlayScreenOn().
        then(dataUpdate());
    };

    $scope.singlePicClicked = function (id, index) {
      //$scope.indexHistory.push(index);
      //$scope.dataHistory.push($scope.prestineData);
      //
      //$scope.preview = false;
      //$scope.movingBack = false;
      $scope.httpRequest(id, true, true, $scope.refreshPreview(index));
      //$scope.clusterSearch(id, true, index);
      //$scope.refreshPreview(index);
    };

    $scope.currentPreview = '';

    $scope.getPreviewPicUrl = function () {
      //console.log($scope.currentPreview);
      return $scope.currentPreview;
    };

    $scope.resultPicMouseEnter = function (pic) {
      //console.log(pic);
      $scope.currentPreview = pic.originSrc;
      $scope.preview = true;
    };

    $scope.resultPicMouseLeave = function () {
      $scope.preview = false;
    };
  }).
  controller('historyController', function ($scope) {
    $scope.newSearch = function () {
      window.location.href = '/'
    };
    $scope.backDisabled = function () {
      return $scope.currentView === 'RESULTS';
    };
    $scope.back = function () {
      if (!$scope.movingBack) {
        $scope.dataHistory.pop();
      }
      if ($scope.dataHistory.length === 0) {
        window.alert('Cannot go back any further');
      } else {
        $scope.stepBack();
        $scope.movingBack = true;
      }
    };
  }).
  controller('viewController', function ($scope) {
    $scope.getToggleTitle = function () {
      return $scope.currentView === 'CLUSTER' ? 'Result View' : 'Cluster View';
    };
    $scope.getToggleClass = function () {
      return $scope.currentView === 'CLUSTER' ? 'glyphicon glyphicon-th-list' : 'glyphicon glyphicon-th';
    };
    //$scope.showTooltip = false;
    $scope.picSelected = function (url) {
      //local       http://141.45.146.52/jpg160/00/12/74/62/160_F_12746292_T6hzDiFsVMwcMfOUqsP3b18eb5HyTRVm.jpg
      //fotoliaUrl  http://t1.ftcdn.net/jpg/00/18/47/57/400_F_18475763_ORbnj9aujO1GrtO7VgNPzejFZv8mMbwb.jpg
      if (window.confirm('Go to original image Url and leave this page?')) {
        window.location.href = url.replace('jpg160', 'jpg').replace('160', '400').replace('http://141.45.146.52/', 'http://t1.ftcdn.net/');
      }
    };
    //$scope.picTooltipOn = function () {
    //  $scope.showTooltip = true;
    //};
    //$scope.picTooltipOff = function () {
    //  $scope.showTooltip = false;
    //};
  });
