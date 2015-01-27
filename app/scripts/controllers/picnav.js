'use strict';
var $; // so JS lint won't throw error on jQuery

angular.module('PicNavigatorApp.controllers', [])
  .directive('onErrorSrc', function () {
    return {
      link: function (scope, element, attrs) {
        element.bind('error', function () {
          if (attrs.src != attrs.onErrorSrc) {
            attrs.$set('src', attrs.onErrorSrc);
          }
        });
      }
    }
  }).
  controller('initialController', function ($scope, $http, $q, dataService) {
    $scope.picList = [];
    $scope.resultPics = [];
    $scope.previewPic = null;
    $scope.resultPreview = false;
    $scope.currentView = 'CLUSTER';
    $scope.doubleSteps = true;
    $scope.clusterOfInterest = null;

    $scope.clusterEdgeUrls = [];

    /**
     * the following function was taken from:
     * http://www.markcampbell.me/tutorial/2013/10/08/preventing-navigation-in-an-angularjs-project.html
     * @author Mark Campell
     */
      //todo
    $scope.$on('$locationChangeStart', function (event) {
      if (!window.confirm('Do you really want to leave Picture Navigator and start a new search? \n If you just want to navigate back, use the BACK button below. \n\n Press CANCEL to stay on Picture Navigator.')) {
        event.preventDefault(); // This prevents the navigation from happening
      }
    });
    // end @author Mark Campell


    var setData = function (callback) {
      $scope.clusterUrls = [];
      $scope.clusterEdgeUrls = dataService.getClusterEdges();
      $scope.clusterEdgeUrls.forEach(function (edgeUrl) {
        var clusterGroup = dataService.getImageGroup(edgeUrl);
        $scope.clusterUrls.push(clusterGroup);
      });
      if (callback) {
        callback();
      }
    };

    var col, row;

    var fillContainer = function () {
      var deferred = $q.defer();
      for (var i = 0; i < 9; i++) {
        $scope.picList[i] = {
          srcs: {
            previewSrcs: $scope.clusterUrls[i].srcs
          },
          id: $scope.clusterUrls[i].id,
          errorImg: 'http://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg'
        };
      }
      $scope.clusterOfInterest = $scope.picList[0].id;
      if (!$scope.$$phase) {
        // apply changes
        $scope.$apply();
      }
      return deferred.promise;
    };

    // initial filling of picList

    dataService.addDataToHistory(dataService.getClusterEdges());
    setData();
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
    $scope.toggleView = function (index) {
      var transitionTime = 200;
      if ($scope.currentView === 'CLUSTER') {
        // goto results
        $scope.resultPics = [];
        $scope.picList[index].srcs.previewSrcs.forEach(function (src) {
          $scope.resultPics.push({
            src: src
          });
        });
        //$scope.resultPics = dataService.getImages($scope.representativeUrls[index]);
        //$scope.previewPic = $scope.resultPics[0];
        //$scope.$broadcast('previewChanged', $scope.previewPic);
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
        // scale the overlays with new loaded image
        //$scope.scaleResultPicOverlay();
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
          urls = dataService.getClusterEdgesForPositionShift(referencePic.id, index);
        }
        dataService.setClusterEdges(urls);
        dataService.addDataToHistory(dataService.getClusterEdges());
        setData(function() {
          fillContainer();
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

      hiddenContainer.animate({
        top: 0,
        left: 0,
        width: '98%',
        height: '98%'
      }, {duration: 600, queue: true});
      return deferred.promise;
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
      $scope.overlayScreenOn().
        then($scope.calculateNewClusters(referencePic, index, isSingle, true, function () {
          clusterSearchTransition(5, true).
            then($scope.overlayScreenOff());
        }));
    };


    $scope.stepBack = function (oldData) {
      dataService.setClusterEdges(oldData);
      setData();
      fillContainer();
    };
  }).
  controller('picBoxController', function ($scope, dataService) {
    $scope.preview = false;
    $scope.hideBox = function (pic) {
      return false;
      // todo
      //return pic.id === undefined;
    };

    /**
     * this is necessary so that the hidden container is in the right position for
     * the animation when the cluster search continues
     * @param index
     */
    var moveHiddenContainerInPosition = function (index) {
      var col = Math.floor(index / 3);
      var row = index % 3;
      $scope.preview = true;
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
      if (!$(resultCard).hasClass("interested")) {
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
        $(resultCard).addClass("interested");
      }
      //setTimeout(function(){
      //  hideResultCard(index);
      //}, 1500);
    };

    $scope.hideResultCard = function (index) {
      $scope.preview = false;
      var resultCard = $('.resultCard')[index];
      var resultCardMove = $('.resultCardMove')[index];
      var resultCardStay = $('.resultCardStay')[index];
      $(resultCard).removeClass("selected");
      if ($(resultCard).hasClass("interested")) {
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
        $(resultCard).removeClass("interested");
      }
    };

    $scope.interestInCluster = function(index) {
      $scope.clusterOfInterest = $scope.picList[index].id;
      if (!$scope.$$phase) {
        // apply changes
        $scope.$apply();
      }
      moveHiddenContainerInPosition(index);
      var resultCard = $('.resultCard')[index];
      if (!$(resultCard).hasClass("interested")) {
        showResultCard(index);
      }
    };

    /**
     * passing through to clusterSearch
     * @param index
     */
    $scope.continueClusterSearch = function (index) {
      if($($('.resultCard')[index]).hasClass("interested")) {
        $($('.resultCard')[index]).css("opacity", "0");
        $scope.clusterSearch(index, false);
      }
    };

    /**
     * fires a calculateNewClusters to get all 50 result pics for a cluster
     * then switches the view to the result page
     * updates resultPic list
     * @param index
     */
    $scope.goToResults = function (index) {
      $($('.resultCard')[index]).css("opacity", "0");
      $scope.toggleView(index);
    };

    //$scope.singlePicClicked = function (id) {
    //  $scope.overlayScreenOn();
    //  $scope.calculateNewClusters(id, true, true, function () {
    //    $scope.overlayScreenOff();
    //    $scope.toggleView();
    //  });
    //};
    //
    //$scope.picSelected = function (id) {
    //  if (window.confirm('Go to original image Url and leave Picture Navigator?')) {
    //    window.location.href = 'http://www.fotolia.com/id/' + id;
    //  }
    //};
    //
    //$scope.resultPicMouseEnter = function (pic) {
    //  $scope.previewPic = pic;
    //  $scope.preview = true;
    //};
    //
    //$scope.resultPicMouseLeave = function () {
    //  // scale the overlays with new loaded image
    //  $scope.scaleResultPicOverlay();
    //  $scope.preview = false;
    //};
    //
    //$scope.resultPreviewMouseEnter = function () {
    //  $scope.resultPreview = true;
    //};
    //
    //$scope.resultPreviewMouseLeave = function () {
    //  $scope.resultPreview = false;
    //};
    //
    //$scope.$on('previewChanged', function (newPic) {
    //  $scope.previewPic = newPic.targetScope.previewPic;
    //});
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
