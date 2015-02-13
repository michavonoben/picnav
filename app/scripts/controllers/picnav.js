'use strict';
var $; // so JS lint won't throw error on jQuery

angular.module('PicNavigatorApp.controllers', []).
  directive('autofocus', function($timeout) {
    return function(scope, element) {
      var input = element.find('input');
      $timeout(function() { input[0].focus(); }, 100);
    };
  }).
  controller('initialController', function ($scope, $http, $q, dataService) {
    $scope.picList = [];
    $scope.resultPics = [];
    $scope.currentView = 'CLUSTER';
    $scope.clusterEdgeUrls = [];

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

    /*******************
     * INNER FUNCTIONS *
     *******************/

    function setData (callback) {
      $scope.clusterUrls = []; //empty clusters
      $scope.clusterEdgeUrls = dataService.getClusterEdges();
      $scope.clusterEdgeUrls.forEach(function (edgeUrl) {
        // for each cluster corner calculate surrounding images
        var clusterGroup = dataService.getImageGroup(edgeUrl);
        $scope.clusterUrls.push(clusterGroup);
      });
      if (callback) {
        callback();
      }
    }

    function fillContainer (initialView) {
      var deferred = $q.defer();
      for (var i = 0; i < 16; i++) {
        // if intialView is true, we show several points of the map at once. don't shift
        var index = initialView ? i : $scope.indexShift(i);
        $scope.picList[index] = {
          srcs: {
            previewSrcs: $scope.clusterUrls[i].srcs
          },
          id: $scope.clusterUrls[i].id
        };
      }
      if (!$scope.$$phase) {
        // apply changes
        $scope.$apply();
      }
      return deferred.promise;
    }

    /*********************
     * GRAPHIC FUNCTIONS *
     *********************/

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
    $scope.toggleView = function (newResults) {
      //  toggles the view between cluster-search and result list
      if (newResults) {
        $scope.resultPics = newResults;
      }
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
      if (!$scope.$$phase) {
        // apply changes
        $scope.$apply();
      }
    };

    function clusterSearchTransition (index, callback) {
      // exchanges the two cluster containers and animates the transition
      var activeContainer = $('.mycontainer.active');
      var hiddenContainer = $('.mycontainer.myhidden');
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
      hiddenContainer.animate({
        top: 0,
        left: 0,
        width: '98%',
        height: '98%'
      }, {duration: 600, queue: true});
      setTimeout(function () {
        callback();
      }, 1000)
    }

    /*************************
     * CALCULATION FUNCTIONS *
     *************************/

      // save first set to history
    dataService.addDataToHistory(dataService.getClusterEdges());
    // initial filling of picList
    setData();
    fillContainer(true);

    $scope.indexShift = function (index) {
      // this is necessary since Image Map has X/Y zero on the left lower corner but
      // Picture Navigator on the left upper corner. We want to compare them, so we
      // shift the cluster rows
      var shifter = 0;
      if (index < 4) shifter = 12;
      else if (index < 8) shifter = 4;
      else if (index < 12) shifter = -4;
      else if (index < 16) shifter = -12;
      index += shifter;
      return index;
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

    $scope.calculateNewClusters = function (referencePic, index, isSingle, updateClusters, callback) {
      var urls = [];
      if (referencePic.id.l > 0) {
        urls = dataService.getClusterEdgesForLevel(referencePic.id, true);
      } else {
        urls = dataService.getClusterEdgesForPositionShift(referencePic.id, $scope.indexShift(index));
      }
      dataService.setClusterEdges(urls);
      dataService.addDataToHistory(dataService.getClusterEdges());
      setData(function () {
        fillContainer();
        callback();
      });

    };



    /**
     * fires calculateNewClusters with clusterID and triggers animation
     * updates clusters
     * updates resultPic list
     * @param clusterId
     * @param isSingle
     * @param index
     */
    $scope.clusterSearch = function (index, isSingle) {
      var referencePic = $scope.picList[index];
      $('body').css('pointer-events', 'none');
      $scope.overlayScreenOn().
        then($scope.calculateNewClusters(referencePic, index, isSingle, true, function () {
          clusterSearchTransition(5, function () {
            $('body').css('pointer-events', 'all');
            $scope.overlayScreenOff();
          })
        }));
    };


    $scope.stepBack = function (oldData) {
      dataService.setClusterEdges(oldData);
      setData();
      fillContainer();
    };
  }).
  controller('picBoxController', function ($scope, dataService) {
    /**
     * this is necessary so that the hidden container is in the right position for
     * the animation when the cluster search continues
     * @param index
     */
    function moveHiddenContainerInPosition(index) {
      var col = Math.floor(index / 4);
      var row = index % 4;
      var wrapper = $('.mycontainer.active');
      $scope.wrapperHeight = $(wrapper).height();
      $scope.wrapperWidth = $(wrapper).width();
      // move the hidden container behind the img with the mouse over it
      $('.mycontainer.myhidden')
        .css({
          opacity: 0,
          top: col * $scope.wrapperHeight / 3.8 + 'px',
          left: row * $scope.wrapperHeight / 3.8 + 'px',
          width: $scope.wrapperWidth / 5 + 'px',
          height: $scope.wrapperHeight / 5 + 'px'
        });
    }

    function getHoveredCluster (index) {
      var activeContainer = $('.mycontainer.active');
      var clustersOfInterest = $(activeContainer).find($('.box.cluster'));
      return $(clustersOfInterest).eq(index);
    }

    function getMiniBox (index, i) {
      return $(getHoveredCluster(index)).find($('.box.mini')).eq(i);
    }

    $scope.miniBoxEnter = function (index, i) {
      var e = getMiniBox(index, i);
      e.addClass('mouseRests');
      setTimeout(function () {
        if (e.hasClass('mouseRests')) {
          $(e).animate({
            borderWidth: 4 + 'px',
            borderRadius: 8 + 'px'
          }, 300);
        }
      }, 200);
    };
    $scope.miniBoxLeave = function (index, i) {
      var e = getMiniBox(index, i);
      e.removeClass('mouseRests');
      $(e).animate({
        borderWidth: 0,
        borderRadius: 0
      }, 100);
    };

    $scope.interestInCluster = function (index) {
      moveHiddenContainerInPosition(index);
      var e = getHoveredCluster(index);
      e.addClass('mouseRests');
      setTimeout(function () {
        if (e.hasClass('mouseRests')) {
          $(e).animate({
            borderWidth: 4 + 'px',
            padding: 4 + 'px'
          }, 300);
        }
      }, 200);
    };

    $scope.lostInterest = function (index) {
      var e = getHoveredCluster(index);
      e.removeClass('mouseRests');
      $(e).animate({
        borderWidth: 0,
        padding: 0
      }, 100);
    };

    /**
     * passing through to clusterSearch
     * @param index
     */
    $scope.continueClusterSearch = function (index) {
      $scope.clusterSearch(index, false);
    };

    /**
     * gets all 50 result pics for a cluster
     * then switches the view to the result page
     * updates resultPic list
     * @param index
     */
    $scope.goToResults = function (src) {
      var srcs = [];
      dataService.getResultsForSrc(src, function (resultPics) {
        resultPics.forEach(function (pic) {
          srcs.push(pic)
        });
        $scope.toggleView(srcs);
      });
    };

    $scope.picSelected = function (id) {
      if (window.confirm('Go to original image Url and leave Picture Navigator?')) {
        window.location.href = 'http://www.fotolia.com/id/' + id;
      }
    };

  }).
  controller('historyController', function ($scope, dataService) {
    $scope.newSearch = function () {
      window.location.href = '/imgMap';
    };
    $scope.back = function () {
      var oldData = dataService.getPreviousData();
      $scope.stepBack(oldData);
      $('#backBtn').blur();
    };
  });
