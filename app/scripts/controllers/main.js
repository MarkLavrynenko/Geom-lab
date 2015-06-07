angular.module('geomApp')
    .controller('MainCtrl', function ($scope) {
        $scope.canvasWidth = 900;
        $scope.addCount = 30;
        $scope.canvasHeight = 700;
        $scope.testesTriangles = [];
        $scope.points = [{x: 40, y: 400},
            {x: 16, y: 300},
            {x: 230, y: 200},
            {x: 430, y: 100},
            {x: 330, y: 400},
            {x: 130, y: 270}];
        //$scope.points = [{x: 116, y: 300}];
        $scope.labels = [];
        $scope.searchZone = [
            {x: 100, y: 250},
            {x: 200, y: 300},
            {x: 250, y: 400},
            {x: 100, y: 500}];

        $scope.remove = function (index) {
            $scope.searchZone.splice(index, 1);
        };

        $scope.addAfter = function (index) {
            $scope.searchZone.splice(index, 0, angular.copy($scope.searchZone[index]));
        };

        function getCenterOfMass(points) {
            var xx = 0, yy = 0;
            points.forEach(function (point) {
                xx += point.x;
                yy += point.y;
            });
            return {
                x: xx / points.length,
                y: yy / points.length
            };
        }

        function getPolarAngle(x, y) {
            var pi = Math.PI;
            var len = Math.sqrt(x * x + y * y);
            if (x >= 0 && y == 0) return 0; else if (x > 0 && y > 0) return Math.asin(y / len); else if (x == 0 && y > 0) return pi / 2; else if (x < 0 && y > 0) return pi / 2 + Math.asin(-x / len); else if (x < 0 && y == 0) return pi / 2; else if (x < 0 && y < 0) return pi + Math.asin(-y / len)
            if (x == 0 && y < 0) return pi * 4 / 3.0; else
                return 2 * pi - Math.asin(-y / len);
        }

        function buildSortedPoly(center, points) {
            var a = angular.copy(points);
            angular.forEach(a, function (point) {
                var vec = {
                    x: point.x - center.x,
                    y: point.y - center.y
                };
                var angle = getPolarAngle(vec.x, vec.y);
                point.angle = angle;
            });
            a = a.sort(function (pointa, pointb) {
                return pointa.angle > pointb.angle;
            });
            $scope.labels = a.map(function (point, i) {
                return new fabric.Text(i + ' ' + point.angle.toFixed(2), {
                    top: point.y,
                    left: point.x,
                    originX: 'center',
                    originY: 'center'
                });
            });
            return {
                center: center,
                poly: a
            };
        }

        function dist(a, b) {
            return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
        }

        // accept tree points
        function square(pA, pB, pC) {
            var lAB = dist(pA, pB),
                lAC = dist(pA, pC),
                lBC = dist(pB, pC);
            var s = (lAB + lAC + lBC) / 2.0;
            return Math.sqrt(s * (s - lAB) * (s - lAC) * (s - lBC));
        }

        function insideTriangle(a, b, c, point) {
            $scope.testesTriangles.push([a, b, c]);
            var whole = square(a, b, c);
            var part1 = square(a, b, point),
                part2 = square(a, c, point),
                part3 = square(b, c, point);
            var diff = Math.abs(whole - part1 - part2 - part3);
            return diff < 1e-5;
        }

        function isInside(point, sortedPoly, useHack) {
            if (useHack) {
                // point by index
                function pbi(i) {
                    var len = sortedPoly.poly.length;
                    return sortedPoly.poly[(i + len) % len];
                }
                var inside = false;
                for (var i = 0; i < sortedPoly.poly.length; ++i) {
                    console.log("Check if inside ", i);
                    inside |= insideTriangle(pbi(i), pbi(i+1), sortedPoly.center, point);
                }
                return inside;
            }

            var len = sortedPoly.poly.length;
            var test_polar = getPolarAngle(point.x - sortedPoly.center.x, point.y - sortedPoly.center.y);
            var left = 0, right = len - 1;
            while (left < right) {
                var middle = Math.floor((left + right) / 2);
                var angle = sortedPoly.poly[middle].angle;
                if (test_polar < angle) {
                    right = middle;
                } else {
                    left = middle + 1;
                }
            }
            return insideTriangle(sortedPoly.poly[left], sortedPoly.poly[(left + len - 1) % len], sortedPoly.center,
                point);
        }

        function resetHighlightedPoints() {
            angular.forEach($scope.points, function (point) {
                point.inside = false;
            });
        }

        function W(){
            return Math.floor(Math.random() * $scope.canvasWidth);
        }

        function H() {
            return Math.floor(Math.random() * $scope.canvasHeight);
        }

        $scope.generatePolygon = function () {
            var zone = [];
            var cx = W(),
                cy = H();
            zone.push({ x : cx - W() / 4, y : cy - H() / 4});
            zone.push({ x : cx - W() / 4, y : cy + H() / 4});
            zone.push({ x : cx + W() / 4, y : cy + H() / 4});
            zone.push({ x : cx + W() / 4, y : cy - H() / 4});


            $scope.searchZone = zone;
            $scope.$emit("redraw");
        };

        $scope.generatePoints = function () {
            $scope.points = [];
            for (var i = 0; i < $scope.addCount; ++i) {
                var x = Math.floor(Math.random() * $scope.canvasWidth),
                    y = Math.floor(Math.random() * $scope.canvasHeight);
                $scope.points.push({x: x, y: y});
            }
            $scope.$emit("redraw");
        };

        $scope.findInnerPoints = function () {
            resetHighlightedPoints();
            $scope.massCenter = getCenterOfMass($scope.searchZone);
            $scope.testesTriangles = [];
            var sortedPoly = buildSortedPoly($scope.massCenter, $scope.searchZone);
            angular.forEach($scope.points, function (point) {
                if (isInside(point, sortedPoly, true)) {
                    point.inside = true;
                }
            });
            $scope.$emit("redraw");
        };

        var canvas = new fabric.StaticCanvas('c');

        $scope.$watch("points", function () {
            if ($scope.points) {
                $scope.$emit("redraw");
            }
        }, true);

        $scope.$watch("searchZone", function () {
            if ($scope.searchZone) {
                $scope.massCenter = null;
                $scope.$emit("redraw");
            }
        }, true);

        $scope.$on("redraw", function () {
            canvas.clear();
            var pol = new fabric.Polygon();
            pol.fill = 'blue';
            pol.initialize(angular.copy($scope.searchZone));
            canvas.add(pol);


            angular.forEach($scope.points, function (point) {
                var graphicPoint = new fabric.Circle({
                    radius: 5,
                    fill: !point.inside ? "red" : "purple",
                    originX: 'center',
                    originY: 'center',
                    left: point.x,
                    top: point.y
                });
                canvas.add(graphicPoint);
            });
            if ($scope.massCenter) {
                var center = new fabric.Circle({
                    radius: 5,
                    fill: "green",
                    originX: 'center',
                    originY: 'center',
                    left: $scope.massCenter.x,
                    top: $scope.massCenter.y
                });
                angular.forEach($scope.searchZone, function (point) {
                    var line = new fabric.Line([point.x, point.y, $scope.massCenter.x, $scope.massCenter.y], {
                        stroke: "red"
                    });
                    canvas.add(line);
                });
                canvas.add(center);
            }
            //addTestTrianglesToCanvas(canvas);
            //// add labels
            //angular.forEach($scope.labels, function (label) {
            //    canvas.add(label);
            //});
            canvas.renderAll();
        });

        function addTestTrianglesToCanvas(canvas) {
            angular.forEach($scope.testesTriangles, function (trianglePoints) {
                var triangle = new fabric.Polygon();
                triangle.fill = 'yellow';
                triangle.initialize(angular.copy(trianglePoints));
                canvas.add(triangle);
            })
        }
    })
    .directive('numericsaving', function () {
        return {
            restrict: 'A',
            require: '?ngModel',
            scope: {
                model: '=ngModel'
            },
            link: function (scope, element, attrs, ngModelCtrl) {
                if (!ngModelCtrl) {
                    return;
                }
                ngModelCtrl.$parsers.push(function (value) {
                    if (!value || value === '' || isNaN(parseInt(value)) || parseInt(value) != value) {
                        value = 0;
                    }
                    return parseInt(value);
                });
            }
        };
    });