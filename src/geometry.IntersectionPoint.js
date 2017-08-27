
// IntersectionPoint
GEOMETRY.IntersectionPoint = function(p1, p2, p3) {
	this.polygonPoint1 = p1;  /* of Point */;
	this.polygonPoint2 = p2;  /* of Point */;
	this.intersectionPoint = p3;
};

GEOMETRY.IntersectionPoint.prototype.toString = function () {
	return 'P1 :'+ polygonPoint1.toString() +' P2:'+ polygonPoint2.toString() +' IP:'+ intersectionPoint.toString();
}
