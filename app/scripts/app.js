'use strict';

/**
 * @ngdoc overview
 * @name PicNavigatorApp
 * @description
 * # picnavApp
 *
 * Main module of the application.
 */
angular.module('PicNavigatorApp', [
  'PicNavigatorApp.controllers',
  'ngAnimate',
  'ngCookies',
  'ngResource',
  'ngRoute',
  'ngSanitize',
  'ngTouch',
  'ngTagsInput'
])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/picnav', {
        templateUrl: 'views/picnav.html',
        controller: 'initialController'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .factory('dataService', function (httpService) {
    var service = {};
    service.dataHistory = [];
    service.clusterEdgeUrls = [];
    service.oldLength = 0;

    var getIdByUrl = function (url) {
      var l = +url.substring(url.indexOf("l") + 1).split('/')[0];
      var y = +url.substring(url.indexOf("y") + 1).split('/')[0];
      var x = +url.substring(url.indexOf("x") + 1).split('.')[0];
      return {l: l, x: x, y: y};
    };

    var keepInRange = function (id) {
      var corL = id.l;
      var x = id.x;
      var y = id.y;
      var max;

      // keep everything within range
      if (corL === 6) {
        // there 16 x 16 positions so 0 to 15
        max = 15;
      } else if (corL === 5) {
        max = 31;
      } else if (corL === 4) {
        max = 63;
      } else if (corL === 3) {
        max = 127;
      } else if (corL === 2) {
        max = 255;
      } else if (corL === 1) {
        max = 511;
      } else if (corL === 0) {
        max = 1023;
      }
      x = (x % max === 0 ? max : x % max);
      y = (y % max === 0 ? max : y % max);
      // shift negative values
      x = (x < 0 ? max + x : x);
      y = (y < 0 ? max + y : y);
      // round values to absolute positions
      x = Math.round(x);
      y = Math.round(y);
      var newId = {
        l: corL,
        x: x,
        y: y
      };
      return newId;
    };

    var getUrlById = function (id) {
      var newId = keepInRange(id);
      return 'http://141.45.146.52/netvis/netvis1024/data/l' + newId.l + '/y' + newId.y + '/x' + newId.x + '.jpg';
    };

    var getNeighbourUrl = function (id, pos) {
      if (pos === 1) {
        id.x++;
      } else if (pos === 2) {
        id.y--;
      } else if (pos === 3) {
        id.x++;
        id.y--;
      }
      var newId = keepInRange(id);
      return 'http://141.45.146.52/netvis/netvis1024/data/l' + newId.l + '/y' + newId.y + '/x' + newId.x + '.jpg';

    };
    service.getResultsForSrc = function (src, callback) {
      var id = getIdByUrl(src);
      var resultPics = [];
      httpService.makeCorsRequest('http://141.45.146.52:8080/ImageMapService/image/' + id.l + '/' + id.x + '/' + id.y + '/',
        function (data) {
          httpService.makeCorsRequest('http://141.45.146.52:8080/ImageMapService/similar/image/' + data.id + '/10',
            function (data) {
              data.forEach(function (d) {
                resultPics.push({
                  src: d.url,
                  id: d.id
                });
              });
              callback(resultPics);
            })
        });
    };

    service.setClusterEdges = function (urls) {
      service.clusterEdgeUrls = urls;
    };

    service.getClusterEdges = function () {
      return service.clusterEdgeUrls;
    };

    service.getImageGroup = function (edgeUrl) {
      var srcs = [4];
      //for (var i=0; i<4; i++) {
      //  srcs[i] = 'http://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg'
      //}
      var id = getIdByUrl(edgeUrl);
      //id.l = 4;
      //id.x /= 8;
      //id.y /= 8;

      id.x = Math.round(id.x);
      id.y = Math.round(id.y);
      var newUrl = getUrlById(id);

      srcs[0] = newUrl;
      srcs[1] = getNeighbourUrl(getIdByUrl(newUrl), 1);
      srcs[2] = getNeighbourUrl(getIdByUrl(newUrl), 2);
      srcs[3] = getNeighbourUrl(getIdByUrl(newUrl), 3);

      var imageGroup = {
        id: id,
        srcs: srcs
      };
      return imageGroup;
    };

    service.getClusterEdgesForLevel = function (leftCornerId, twoStepsDown) {
      var l, x, y, newId;
      if (twoStepsDown) {
        l = leftCornerId.l - 2;
        x = leftCornerId.x * 4;
        y = leftCornerId.y * 4;
        y += 1;
      } else {
        l = leftCornerId.l;
        x = leftCornerId.x;
        y = leftCornerId.y;
      }
      newId = {l: l, x: x, y: y};

      var urls = [];

      urls[0] = getUrlById(newId);
      urls[1] = getUrlById({l: l, x: x + 2, y: y});
      urls[2] = getUrlById({l: l, x: x + 4, y: y});
      urls[3] = getUrlById({l: l, x: x + 6, y: y});

      urls[4] = getUrlById({l: l, x: x, y: y - 2});
      urls[5] = getUrlById({l: l, x: x + 2, y: y - 2});
      urls[6] = getUrlById({l: l, x: x + 4, y: y - 2});
      urls[7] = getUrlById({l: l, x: x + 6, y: y - 2});

      urls[8] = getUrlById({l: l, x: x, y: y - 4});
      urls[9] = getUrlById({l: l, x: x + 2, y: y - 4});
      urls[10] = getUrlById({l: l, x: x + 4, y: y - 4});
      urls[11] = getUrlById({l: l, x: x + 6, y: y - 4});

      urls[12] = getUrlById({l: l, x: x, y: y - 6});
      urls[13] = getUrlById({l: l, x: x + 2, y: y - 6});
      urls[14] = getUrlById({l: l, x: x + 4, y: y - 6});
      urls[15] = getUrlById({l: l, x: x + 6, y: y - 6});
      return urls;
    };

    service.getClusterEdgesForPositionShift = function (id, index) {
      var xShift; //= (index === 0 ||3 || 6 ? -4 : (index === 1 ||4 ||7 ? -2 : 0));
      var yShift; // = (index <= 2 ? -4 : (index <= 5 ? -2 : 0));

      // get new left corner pos
      if (index < 4) {
        //first row
        xShift = (-6 + (index * 2));
        yShift = 6;
      } else if (index < 8) {
        //second row
        index -= 4;
        xShift = (-6 + (index * 2));
        yShift = 4;
      } else if (index < 12) {
        //third row
        index -= 8;
        xShift = (-6 + (index * 2));
        yShift = 2;
      } else if (index < 16) {
        //third row
        index -= 12;
        xShift = (-6 + (index * 2));
        yShift = 0;
      }

      var leftCornerId = {
        l: id.l,
        x: (id.x + xShift),
        y: ((id.y) + yShift)
      };
      return service.getClusterEdgesForLevel(leftCornerId, false);
    };


    service.addDataToHistory = function (data) {
      service.oldLength = service.dataHistory.length;
      service.dataHistory.push(data);
    };

    service.getPreviousData = function () {
      if (service.dataHistory.length === 1) {
        return service.dataHistory[0];
      }
      //else if(service.oldLength === service.dataHistory.length) {
      //  // first back move, remove currently displayed data
      //  service.dataHistory.pop();
      //}
      return service.dataHistory.pop();

    };
    return service;
  })
  .factory('httpService', function () {
    /**
     * Following code in this service was taken from:
     * http://www.html5rocks.com/en/tutorials/cors/#toc-making-a-cors-request
     * @author: Monsur Hossain
     */
    var service = {};
    var createCORSRequest = function (method, url) {
      var xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      if ('withCredentials' in xhr) {
        // XHR for Chrome/Firefox/Opera/Safari.
        xhr.open(method, url, true);
      } else if (typeof XDomainRequest !== 'undefined') {
        // XDomainRequest for IE.
        xhr = new XDomainRequest();
        xhr.open(method, url);
      } else {
        // CORS not supported.
        xhr = null;
      }
      return xhr;
    };

    var handleXLMData = function (data, callback) {
      callback(JSON.parse(data));
    };

    service.makeCorsRequest = function makeCorsRequest(url, callback) {
      var xhr = createCORSRequest('GET', url);
      if (!xhr) {
        window.alert('CORS not supported');
        return;
      }
      // Response handlers.
      xhr.onload = function () {
        if (xhr.responseText.split(':')[0] === 'error') {
          window.alert('Something went wrong. Please try again.\n\n\n' + 'Request url was: ' + url + '\n\n' + 'Response: ' + xhr.responseText);
        }
        handleXLMData(xhr.responseText, callback);
      };
      xhr.onerror = function () {
        console.log(xhr.response);
      };
      xhr.send();
    };
    // end @author: Monsur Hossain
    return service;
  });
