
////////////////////  PolygonNode ///////////////////////////
GEOMETRY.PolygonNode = function(next, x, y) {
	var vn;

	this.active;  /* Active flag / vertex count        */
	this.hole;    /* Hole / external contour flag      */
	this.v = [];  /* Left and right vertex list ptrs   */
	this.next;    /* Pointer to next polygon contour   */
	this.proxy;   /* Pointer to actual structure used  */
	
	/* Make v[Clip.LEFT] and v[Clip.RIGHT] point to new vertex */
	vn = new VertexNode(x, y);
	this.v[Clip.LEFT ] = vn;
	this.v[Clip.RIGHT] = vn;
	this.next = next;
	this.proxy = this; /* Initialise proxy to point to p itself */
	this.active = 1;
}

GEOMETRY.PolygonNode.prototype.add_right = function(x, y) {
	var nv = new VertexNode(x, y);

	/* Add vertex nv to the right end of the polygon's vertex list */
	this.proxy.v[Clip.RIGHT].next = nv;

	/* Update proxy->v[Clip.RIGHT] to point to nv */
	this.proxy.v[Clip.RIGHT] = nv;
}

GEOMETRY.PolygonNode.prototype.add_left = function( x, y) {
	var proxy = this.proxy,
		nv = new VertexNode(x, y);

	/* Add vertex nv to the left end of the polygon's vertex list */
	nv.next = proxy.v[Clip.LEFT];

	/* Update proxy->[Clip.LEFT] to point to nv */
	proxy.v[Clip.LEFT] = nv;
}
