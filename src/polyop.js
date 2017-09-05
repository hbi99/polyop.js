
(function() {
	'use strict';

	var polyop = {
		getVertices: function(poly) {
			var vertices = [],
				il = poly.getNumPoints(),
				i = 0;
			for (; i<il; i++) {
				vertices.push([poly.getX(i), poly.getY(i)]);
			}
			return vertices;
		},
		clip: function(operation, vx1, vx2) {
			var poly1 = parse(vx1),
				poly2 = parse(vx2),
				diff = poly1[operation](poly2),
				num = diff.getNumInnerPoly(),
				n = 0,
				innerPoly,
				ret = [];
			for (; n<num; n++) {
				innerPoly = diff.getInnerPoly(n);
				
				ret.push({
					vertices: this.getVertices(innerPoly),
					isHole: innerPoly.isHole()
				});
			}
			return ret;
		}
	};

	@@include('util.js')
	@@include('geometry.clip.js')
	@@include('geometry.aeTree.js')
	@@include('geometry.bundleState.js')
	@@include('geometry.edgeTable.js')
	@@include('geometry.IntersectionPoint.js')
	@@include('geometry.itNodeTable.js')
	@@include('geometry.lineHelper.js')
	@@include('geometry.lineIntersection.js')
	@@include('geometry.lmtTable.js')
	@@include('geometry.operationType.js')
	@@include('geometry.polyDefault.js')
	@@include('geometry.polygon.js')
	@@include('geometry.polygonNode.js')
	@@include('geometry.polySimple.js')
	@@include('geometry.topPolygonNode.js')
	@@include('geometry.scanBeamTree.js')

	window.polyop = polyop;

})();
