'use strict';
var $; // so JS lint won't throw error on jQuery

angular.module('PicNavigatorApp.controllers', []).
  controller('initialController', function ($scope, $http, $q, picService, dataService, httpService) {
    $scope.picList = [];
    $scope.previewPic = null;
    $scope.resultPreview = false;
    $scope.currentView = 'CLUSTER';

    $scope.wrapperHeight = 550;
    $scope.wrapperWidth = 550;


    /**
     * the following function was taken from:
     * http://www.markcampbell.me/tutorial/2013/10/08/preventing-navigation-in-an-angularjs-project.html
     * @author Mark Campell
     */
    $scope.$on('$locationChangeStart', function (event) {
      if (!window.confirm('Do you really want to leave Picture Navigator and start a new search? \n If you just want to navigate back, use the BACK button below. \n\n Press CANCEL to stay on Picture Navigator.')) {
        event.preventDefault(); // This prevents the navigation from happening
      }
    });
    // end @author Mark Campell

    var data = picService.getData();
    dataService.addDataToHistory(data);

    var setData = function (data, callback) {
      $scope.representativeUrls = dataService.getClusterPreviewUrls(data);
      $scope.clusterIds = dataService.getClusterIds(data);
      if (callback) {
        callback();
      }
    };

    var urls = {
      clusterRequest: 'http://www.palm-search.com/service/view/cluster/?&clusterId=',
      singleRequest: 'http://www.palm-search.com/service/view/image/reference/?&imageId=',
      subClusterRequest: 'http://www.palm-search.com/service/view/image/subcluster/?&clusterId=',
      allowCORSHeader: {headers: {'Access-Control-Request-Headers': 'x-requested-with'}}
    };

    var col, row;

    var fillContainer = function () {
      var deferred = $q.defer();
      for (var i = 0; i < 9; i++) {
        $scope.picList[i] = {
          srcs: {
            previewSrcs: $scope.representativeUrls[i]
          },
          id: $scope.clusterIds[i]
        };
      }
      if (!$scope.$$phase) {
        // apply changes
        $scope.$apply();
      }

      return deferred.promise;
    };

    // initial filling of picList
    setData(data);
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
    $scope.scaleResultPicOverlay = function () {
      var img = new Image;
      img.src = $('#previewResults').css('background-image').replace(/url\(|\)$/ig, "");
      var bgImgWidth = img.width + 1;
      var bgImgHeight = img.height + 1;
      $('.bigOver').css({
        width: bgImgWidth,
        height: bgImgHeight
      });
    };


    /**
     * toggles the view between cluster-search and resultlist
     */
    $scope.toggleView = function () {
      var transitionTime = 200;
      if ($scope.currentView === 'CLUSTER') {
        // goto results
        $(function () {
          $('#resultPage').animate({
            opacity: 1,
            zIndex: 20
          }, {duration: transitionTime, queue: false});
          $('#scrollResults').animate({
            scrollTop: 0
          }, {duration: 0, queue: false});
          $scope.currentView = 'RESULTS';
          $scope.inResultView = true;
        });
      } else {
        // goto cluster
        $(function () {
          $('#resultPage').animate({
            opacity: 0,
            zIndex: -20
          }, {duration: transitionTime, queue: false});
          $scope.currentView = 'CLUSTER';
          $scope.inResultView = false;
        });
      }
      $scope.previewPic = $scope.resultPics[0];
      $scope.$broadcast('previewChanged', $scope.previewPic);
      if (!$scope.$$phase) {
        // apply changes
        $scope.$apply();
      }
      // scale the overlays with new loaded image
      $scope.scaleResultPicOverlay();
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
        httpService.makeCorsRequest(isSingle ? urls.singleRequest + clusterId : urls.subClusterRequest + clusterId, function(data){
          if(!updateClusters) $scope.resultPics = dataService.getImages(data);
          if(updateClusters) {
            httpService.makeCorsRequest(urls.clusterRequest + data.clusterID, function(data) {
              dataService.addDataToHistory(data);
              setData(data, function() {
                fillContainer();
              });
            });
          }
          callback();
        });
    };

    /**
     * exchanges the two cluster containers and animates the transition
     * @param index
     * @returns {promise}
     */
    var clusterSearchTransition = function (index, animation) {
      var deferred = $q.defer();
      var activeContainer = $('.mycontainer.active');
      var hiddenContainer = $('.mycontainer.myhidden');
      col = Math.floor(index / 3);
      row = index % 3;
      activeContainer.css({
        opacity: 0,
        zIndex: 5
      });
      activeContainer.removeClass('active').addClass('myhidden');

      hiddenContainer.animate({
        opacity: 1,
        zIndex: 10
      }, {duration: 1000, queue: true});
      hiddenContainer.removeClass('myhidden').addClass('active');

      if (animation) {
        hiddenContainer.animate({
          top: '-=' + col * 20 + 'px',
          left: '-=' + row * 20 + 'px',
          width: '+=5%',
          height: '+=5%'
        }, {duration: 500, queue: true});
      }
      hiddenContainer.animate({
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }, {duration: 600, queue: true});
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
      $scope.overlayScreenOn().
        then($scope.httpRequest(clusterId, isSingle, true, function () {
          clusterSearchTransition(index, true).
            then($scope.overlayScreenOff());
        }));
    };

    $scope.stepBack = function (oldData) {
      //if (!$scope.movingBack) {
      //  $scope.dataHistory.pop();
      //  console.log('Removing one');
      //  console.log($scope.dataHistory);
      //}
      //$scope.movingBack = true;
      //var oldData = $scope.dataHistory.length === 1 ? $scope.dataHistory[0] : $scope.dataHistory.pop();
      ////var oldData = $scope.dataHistory.pop();

      var dataUpdate = function (oldData) {
        var deferred = $q.defer();
        $scope.representativeUrls = dataService.getClusterPreviewUrls(oldData);
        $scope.clusterIds = dataService.getClusterIds(oldData);
        $scope.resultPics = dataService.getImages(oldData);
        return deferred.promise;
      };

      var backTransition = function () {
        var deferred = $q.defer();
        // move hidden container to wrapper mid
        $('.mycontainer.myhidden')
          .css({
            top: $scope.wrapperHeight / 2.4 + 'px',
            left: $scope.wrapperHeight / 2.4 + 'px',
            width: $scope.wrapperWidth / 3 + 'px',
            height: $scope.wrapperHeight / 3 + 'px'
          });
        clusterSearchTransition(4, false);
        return deferred.promise;
      };

      $scope.overlayScreenOn().then(
        dataUpdate(oldData).
          then(fillContainer().
            then(backTransition().
              then($scope.overlayScreenOff()))));
    };
  }).
  controller('picBoxController', function ($scope) {
    $scope.preview = false;
    $scope.hideBox = function (pic) {
      return pic.id === undefined;
    };

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
        .css({
          opacity: 0,
          top: col * $scope.wrapperHeight / 2.4 + 'px',
          left: row * $scope.wrapperHeight / 2.4 + 'px',
          width: $scope.wrapperWidth / 3 + 'px',
          height: $scope.wrapperHeight / 3 + 'px'
        });
    };
    $scope.picBoxMouseLeave = function () {
      $scope.preview = false;
    };

    /**
     * passing through to clusterSearch
     * @param index
     */
    $scope.continueClusterSearch = function (index) {
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
        $scope.preview = false;
        $scope.httpRequest($scope.clusterIds[index], false, false, function () {
          $scope.overlayScreenOff();
          $scope.toggleView();
        });
      };

      $scope.overlayScreenOn().
        then(dataUpdate());
    };

    $scope.singlePicClicked = function (id) {
      $scope.overlayScreenOn();
      $scope.httpRequest(id, true, true, function () {
        $scope.overlayScreenOff();
        $scope.toggleView();
      });
    };

    $scope.picSelected = function (id) {
      if (window.confirm('Go to original image Url and leave Picture Navigator?')) {
        window.location.href = 'http://www.fotolia.com/id/' + id;
      }
    };

    $scope.resultPicMouseEnter = function (pic) {
      $scope.previewPic = pic;
      $scope.preview = true;
    };

    $scope.resultPicMouseLeave = function () {
      // scale the overlays with new loaded image
      $scope.scaleResultPicOverlay();
      $scope.preview = false;
    };

    $scope.resultPreviewMouseEnter = function () {
      $scope.resultPreview = true;
    };

    $scope.resultPreviewMouseLeave = function () {
      $scope.resultPreview = false;
    };

    $scope.$on('previewChanged', function (newPic) {
      $scope.previewPic = newPic.targetScope.previewPic;
    });
  }).
  controller('historyController', function ($scope, dataService) {
    $scope.newSearch = function () {
      window.location.href = '/';
    };
    $scope.back = function () {
      var oldData = dataService.getPreviousData();
      //if ($scope.endOfHistory) {
      //  window.alert('Cannot go back any further');
      //  return;
      //}
      //if($scope.clusterHistory.length === 1 ) {
      //  oldData = $scope.clusterHistory[0];
      //  $scope.endOfHistory = true;
      //} else {
      //  oldData = $scope.clusterHistory.pop();
      //  $scope.endOfHistory = false;
      //}

      $scope.stepBack(oldData);
      $('#backBtn').blur();
    };
  });
