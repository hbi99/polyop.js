

/////////////////////// Rectangle  ///////////////////
GEOMETRY.Rectangle = function(_x, _y, _w, _h) {
	this.x = _x; 
	this.y = _y;
	this.w = _w;
	this.h = _h;
}
GEOMETRY.Rectangle.prototype = {
	getMaxY: function() {
		return this.y + this.h;
	},
	getMinY: function() {
		return this.y;
	},
	getMaxX: function() {
		return this.x+this.w;
	},
	getMinX: function() {
		return this.x;
	},
	toString: function() {
		return '['+ x.toString() +' '+ y.toString() +' '+ w.toString() +' '+ h.toString() +']';
	}
};
