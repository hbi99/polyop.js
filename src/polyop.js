
(function() {
	'use strict';

	var polyop = {
		clip: function(operation, vx1, vx2) {
			var poly1 = createPolygon(vx1),
				poly2 = createPolygon(vx2),
				diff = poly1[operation](poly2),
				num = diff.getNumInnerPoly(),
				n = 0,
				innerPoly,
				ret = [];
			for (; n<num; n++) {
				innerPoly = diff.getInnerPoly(n);
				
				ret.push({
					vertices: getVertices(innerPoly),
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
