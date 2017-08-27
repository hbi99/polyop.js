
// LineHelper
var LineHelper = {
	equalPoint: function (p1, p2) {
		return p1[0] == p2[0] && p1[1] == p2[1];
	},
	equalVertex: function(s1, e1, s2, e2) {
		return (this.equalPoint(s1, s2) && this.equalPoint(e1, e2)) ||
				(this.equalPoint(s1, e2) && this.equalPoint(e1, s2));
	},
	distancePoints: function(p1, p2) {
		return Math.sqrt((p2[0] - p1[0]) * (p2[0] - p1[0]) + (p2[1] - p1[1]) * (p2[1] - p1[1]));  
	},
	clonePoint: function(p) {
		return [p[0], p[1]];
	},
	cloneLine: function(line) {
		var res  = [],
			il = line.length,
			i = 0;
		for (; i<il; i++) {
			res[i] = [line[i][0], line[i][1]];
		}
		return res;
	},
	addLineToLine: function(line1, line2) {
		var il = line2.length,
			i = 0;
		for (; i<il; i++) {
			line1.push(clonePoint(line2[i]));
		}
	},
	roundPoint: function(p) {
		p[0] = Math.round(p[0]);
		p[1] = Math.round(p[1]);
	},
	lineIntersectLine: function(A, B, E, F, as_seg) {
		// Checks for intersection of Segment if as_seg is true.
		// Checks for intersection of Line if as_seg is false.
		// Return intersection of Segment "AB" and Segment "EF" as a Point
		// Return null if there is no intersection
		var denom,
			ip,
			a1,
			a2,
			b1,
			b2,
			c1,
			c2;

		if (as_seg == null) as_seg = true;
	 
		a1 = B.y - A.y;
		b1 = A.x - B.x;
		c1 = B.x * A.y - A.x * B.y;
		a2 = F.y - E.y;
		b2 = E.x - F.x;
		c2 = F.x * E.y - E.x * F.y;
	 
		denom = a1 * b2 - a2 * b1;
		if (denom == 0) return null;
		
		ip = new Point();
		ip.x = (b1 * c2 - b2 * c1) / denom;
		ip.y = (a2 * c1 - a1 * c2) / denom;
	 
		//---------------------------------------------------
		//Do checks to see if intersection to endpoints
		//distance is longer than actual Segments.
		//Return null if it is with any.
		//---------------------------------------------------
		if (as_seg) {
			if (Math.pow((ip.x - B.x) + (ip.y - B.y), 2) > Math.pow((A.x - B.x) + (A.y - B.y), 2)) return null;
			if (Math.pow((ip.x - A.x) + (ip.y - A.y), 2) > Math.pow((A.x - B.x) + (A.y - B.y), 2)) return null;
			if (Math.pow((ip.x - F.x) + (ip.y - F.y), 2) > Math.pow((E.x - F.x) + (E.y - F.y), 2)) return null;
			if (Math.pow((ip.x - E.x) + (ip.y - E.y), 2) > Math.pow((E.x - F.x) + (E.y - F.y), 2)) return null;
		}
		return new Point(Math.round(ip.x), Math.round(ip.y));
	}
};
