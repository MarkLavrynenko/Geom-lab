'use strict';

/**
 * @ngdoc function
 * @name geomApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the geomApp
 */
angular.module('geomApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
