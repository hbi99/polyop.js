
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
	}
};
