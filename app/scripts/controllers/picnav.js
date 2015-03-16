'use strict';
var $; // so JS lint won't throw error on jQuery
/**
 * @description Handles every functionality during search
 * @author Micha Gerwig 2015
 */

angular.module('PicNavigatorApp.controllers', []).
  directive('autofocus', function($timeout) {
    return function(scope, element) {
      var input = element.find('input');
      $timeout(function() { input[0].focus(); }, 100);
    };
  }).
  controller('initialController', function ($scope, $http, $q, dataService, httpService) {
    $scope.picList = [];
    $scope.previewPic = null;
    $scope.resultPreview = false;
    $scope.currentView = 'CLUSTER';

    var col, row;

    var urls = {
      clusterRequest: 'http://palm.visual-computing.com/service/view/cluster/?&clusterId=',
      singleRequest: 'http://palm.visual-computing.com/service/view/image/reference/?&imageId=',
      subClusterRequest: 'http://palm.visual-computing.com/service/view/image/subcluster/?&clusterId=',
      allowCORSHeader: {headers: {'Access-Control-Request-Headers': 'x-requested-with'}}
    };

    /*******************
     * INNER FUNCTIONS *
     *******************/

    var data = dataService.getData();
    dataService.addDataToHistory(data);

    function setData (data, callback) {
      $scope.representativeUrls = dataService.getClusterPreviewUrls(data);
      $scope.clusterIds = dataService.getClusterIds(data);
      if (callback) {
        callback();
      }
    }

    function fillContainer() {
      // This fills the array with pics for the active container
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
    }


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

    // initial filling of picList
    setData(data);
    fillContainer();

    /***************************
     * GRAPHIC STUFF FUNCTIONS *
     ***************************/

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
      var img = new Image();
      img.src = $('#previewResults').css('background-image').replace(/url\(|\)$/ig, '');
      var bgImgWidth = img.width + 1;
      var bgImgHeight = img.height + 1;
      $('.bigOver').css({
        width: bgImgWidth,
        height: bgImgHeight
      });
    };
    $scope.toggleView = function () {
      // toggles the view between cluster-search and result view
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
     * exchanges the two cluster containers and animates the transition
     * @param index
     * @returns {promise}
     */
    function clusterSearchTransition (index, animation) {
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
        width: '98%',
        height: '98%'
      }, {duration: 600, queue: true});
      return deferred.promise;
    }


    /*************************
     * CALCULATION FUNCTIONS *
     *************************/

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
      httpService.makeCorsRequest(isSingle ? urls.singleRequest + clusterId : urls.subClusterRequest + clusterId, function (data) {
        if (!updateClusters) {
          $scope.resultPics = dataService.getImages(data);
        }
        if (updateClusters) {
          httpService.makeCorsRequest(urls.clusterRequest + data.clusterID, function (data) {
            dataService.addDataToHistory(data);
            setData(data, function () {
              fillContainer();
            });
          });
        }
        callback();
      });
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
      var dataUpdate = function (oldData) {
        var deferred = $q.defer();
        $scope.representativeUrls = dataService.getClusterPreviewUrls(oldData);
        $scope.clusterIds = dataService.getClusterIds(oldData);
        $scope.resultPics = dataService.getImages(oldData);
        return deferred.promise;
      };
      $scope.overlayScreenOn().then(
        dataUpdate(oldData).
          then(fillContainer().
            then($scope.overlayScreenOff())));
    };
  }).
  controller('picBoxController', function ($scope) {

    /***************************
     * GRAPHIC STUFF FUNCTIONS *
     ***************************/

    $scope.hideBox = function (pic) {
      return pic.id === undefined;
    };
    /**
     * this is necessary so that the hidden container is in the right position for
     * the animation when the cluster search continues
     * @param index
     */
    var moveHiddenContainerInPosition = function (index) {
      var col = Math.floor(index / 3);
      var row = index % 3;

      var wrapper = $('.mycontainer.active');
      $scope.wrapperHeight = $(wrapper).height();
      $scope.wrapperWidth = $(wrapper).width();
      // move the hidden container behind the img with the mouse over it
      $('.mycontainer.myhidden')
        .css({
          opacity: 0,
          top: col * $scope.wrapperHeight / 2.7 + 'px',
          left: row * $scope.wrapperHeight / 2.7 + 'px',
          width: $scope.wrapperWidth / 3.9 + 'px',
          height: $scope.wrapperHeight / 3.9 + 'px'
        });
    };

    var showResultCard = function (index) {
      var resultCard = $('.resultCard')[index];
      var resultCardMove = $('.resultCardMove')[index];
      var resultCardStay = $('.resultCardStay')[index];
      if (!$(resultCard).hasClass('interested')) {
        $(resultCard).animate({
          zIndex: 15,
          opacity: 1,
          top: '-=' + 5 + '%',
          height: '37%'
        }, {duration: 300, queue: false});
        $(resultCardMove).animate({
          height: '+=' + 13 + '%'
        }, {duration: 300, queue: false});
        $(resultCardStay).animate({
          opacity: 1
        }, {duration: 300, queue: false});
        $(resultCard).addClass('interested');
      }
    };

    $scope.hideResultCard = function (index) {
      // needs to be on scope as it is also triggered from html
      var resultCard = $('.resultCard')[index];
      var resultCardMove = $('.resultCardMove')[index];
      var resultCardStay = $('.resultCardStay')[index];
      $(resultCard).removeClass('selected');
      if ($(resultCard).hasClass('interested')) {
        $(resultCard).animate({
          zIndex: 10,
          opacity: 0,
          top: '+=' + 5 + '%',
          height: '32%'
        }, {duration: 150, queue: false});
        $(resultCardMove).animate({
          height: 0
        }, {duration: 150, queue: false});
        $(resultCardStay).animate({
          opacity: 0
        }, {duration: 150, queue: false});
        $(resultCard).removeClass('interested');
      }
    };

    /*************************
     * CALCULATION FUNCTIONS *
     *************************/

    $scope.interestInCluster = function (index) {
      moveHiddenContainerInPosition(index);
      var resultCard = $('.resultCard')[index];
      if (!$(resultCard).hasClass('interested')) {
        showResultCard(index);
      }
    };

    /**
     * passing through to clusterSearch
     * @param index
     */
    $scope.continueClusterSearch = function (index) {
      if ($($('.resultCard')[index]).hasClass('interested')) {
        $($('.resultCard')[index]).css('opacity', '0');
        $scope.clusterSearch($scope.clusterIds[index], false, index);
      }
    };

    /**
     * fires a httpRequest to get all 50 result pics for a cluster
     * then switches the view to the result page
     * updates resultPic list
     * @param index
     */
    $scope.goToResults = function (index) {
      $($('.resultCard')[index]).css('opacity', '0');
      var dataUpdate = function () {
        $scope.httpRequest($scope.clusterIds[index], false, false, function () {
          $scope.overlayScreenOff();
          $scope.toggleView();
        });
      };
      $scope.overlayScreenOn().
        then(dataUpdate());
    };

    /**
     * searches new Clusters with a single pic id and switches the view
     * @param id
     */
    $scope.singlePicSearch = function (id) {
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

    $scope.updatePreviewPic = function (pic) {
      $scope.previewPic = pic;
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
      var backBtn = $('#backBtn');
      if (typeof oldData === 'undefined') {
        window.alert('Cannot go back further');
        $(backBtn).blur();
        return;
      }
      $scope.stepBack(oldData);
      $(backBtn).blur();
    };
  });
