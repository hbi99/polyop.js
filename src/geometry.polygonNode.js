
// PolygonNode
var PolygonNode = function(next, x, y) {
	var vn = new VertexNode(x, y);
	this.v = [];             // Left and right vertex list ptrs
	this.v[Clip.LEFT] = vn;  // Make v[Clip.LEFT] point to new vertex
	this.v[Clip.RIGHT] = vn; // Make v[Clip.RIGHT] point to new vertex
	this.next = next;        // Pointer to next polygon contour
	this.proxy = this;       // Pointer to actual structure used
	this.active = 1;
	this.hole;    		     // Hole / external contour flag
};

PolygonNode.prototype = {
	add_right: function(x, y) {
		var nv = new VertexNode(x, y);
		this.proxy.v[Clip.RIGHT].next = nv; // Add vertex nv to the right end of the polygon's vertex list
		this.proxy.v[Clip.RIGHT] = nv;      // Update proxy->v[Clip.RIGHT] to point to nv
	},
	add_left: function( x, y) {
		var proxy = this.proxy,
			nv = new VertexNode(x, y);
		nv.next = proxy.v[Clip.LEFT]; // Add vertex nv to the left end of the polygon's vertex list
		proxy.v[Clip.LEFT] = nv;      // Update proxy->[Clip.LEFT] to point to nv
	}
};
