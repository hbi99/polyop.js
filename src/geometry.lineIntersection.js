
//////////////  LineIntersection  ///////////////////////
GEOMETRY.LineIntersection = function() {

};

GEOMETRY.LineIntersection.iteratePoints = function(points, s1, s2,e1,e2) {
	var direction = true,
		pl = points.length,
		s1Ind = points.indexOf(s1),
		s2Ind = points.indexOf(s2),
		start = s1Ind,
		newPoints = [],
		point,
		i;
	
	if (s2Ind > s1Ind) direction = false;
	
	if (direction) {
		for (i=0; i<pl; i++) {
			point = (i + start < pl) ? points[i + start] : points[i + start - pl];
			newPoints.push(point);
			if (equals(point, e1) || equals(point, e2)) break;
		}
	} else {
		for (i=pl; i>=0; i--) {
			point = (i + start < pl) ? points[i + start] : points[i + start - pl];
			newPoints.push(point);
			if (equals(point, e1) || equals(point, e2)) break;
		}	
	}
	return newPoints;			
}

GEOMETRY.LineIntersection.intersectPoly = function(poly, line /* of Points */) {
	var res = [],
		numPoints = poly.getNumPoints(),
		ip,
		p1,
		p2,
		p3,
		p4,
		firstIntersection = null,
		lastIntersection = null,
		firstIntersectionLineIndex = -1,
		lastIntersectionLineIndex = -1,
		firstFound = false,
		il = line.length,
		i = 1,
		j,
		maxDist,
		minDist,
		dist,
		newLine,
		poly1,
		poly2,
		finPoly1,
		finPoly2,
		points1,
		points2;
	
	for (;i<il; i++) {
		p1 = line[i-1];
		p2 = line[i];
		maxDist = 0;
		minDist = Number.MAX_VALUE;
		dist = -1;
		for (j=0; j<numPoints; j++) {
			p3 = poly.getPoint(j == 0 ? numPoints-1 : j-1);
			p4 = poly.getPoint(j);
			if (ip = LineHelper.lineIntersectLine(p1, p2, p3, p4) != null) {
				dist = Point.distance(ip, p2);
				if (dist > maxDist && !firstFound) {
					maxDist = dist;
					firstIntersection = new IntersectionPoint(p3, p4, ip);
					firstIntersectionLineIndex = i;
				}
				if (dist < minDist) {
					minDist = dist;
					lastIntersection = new IntersectionPoint(p3, p4, ip);
					lastIntersectionLineIndex = i-1;
				}
			}
		}
		firstFound = firstIntersection != null;
	}

	if (firstIntersection != null && lastIntersection != null) {
		newLine = [];
		newLine[0] = firstIntersection.intersectionPoint;
		j = 1;
		for (i=firstIntersectionLineIndex; i<=lastIntersectionLineIndex; i++) {
			newLine[j++] = line[i];
		}
		newLine[newLine.length-1] = lastIntersection.intersectionPoint;
		if ((equals(firstIntersection.polygonPoint1, lastIntersection.polygonPoint1) && equals(firstIntersection.polygonPoint2, lastIntersection.polygonPoint2)) || (equals(firstIntersection.polygonPoint1, lastIntersection.polygonPoint2) && equals(firstIntersection.polygonPoint2, lastIntersection.polygonPoint1))) {
			poly1 = new PolySimple();
			poly1.add(newLine);
			finPoly1  = poly.intersection(poly1);
			finPoly2  = poly.xor(poly1);
			if (checkPoly(finPoly1) && checkPoly(finPoly2)) return [finPoly1,finPoly2];
		} else {
			points1 = iteratePoints(poly.getPoints(), firstIntersection.polygonPoint1, firstIntersection.polygonPoint2, lastIntersection.polygonPoint1, lastIntersection.polygonPoint2);
			points1 = points1.concat(newLine.reverse());
			points2 = iteratePoints(poly.getPoints(), firstIntersection.polygonPoint2, firstIntersection.polygonPoint1, lastIntersection.polygonPoint1, lastIntersection.polygonPoint2);
			points2 = points2.concat(newLine);
			poly1 = new PolySimple();
			poly1.add(points1);
			poly2 = new PolySimple();
			poly2.add(points2);
			finPoly1 = poly.intersection(poly1);
			finPoly2 = poly.intersection(poly2);
			if (checkPoly(finPoly1) && checkPoly(finPoly2)) return [finPoly1, finPoly2];
		}	
	}
	return null;	
}
GEOMETRY.LineIntersection.checkPoly = function(poly) {
	var noHoles = 0,
		innerPoly,
		il = poly.getNumInnerPoly(),
		i = 0;
	for (; i<il; i++) {
		innerPoly  = poly.getInnerPoly(i);
		if (innerPoly.isHole()) return false;
		else noHoles++;

		if (noHoles > 1) return false;
	}
	return true;
}
