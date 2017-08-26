
///////////////////////////  StNode
GEOMETRY.StNode = function(edge, prev) {
	this.edge;         /* Pointer to AET edge               */
	this.xb;           /* Scanbeam bottom x coordinate      */
	this.xt;           /* Scanbeam top x coordinate         */
	this.dx;           /* Change in x for a unit y increase */
	this.prev;         /* Previous edge in sorted list      */
	this.edge = edge;
	this.xb = edge.xb;
	this.xt = edge.xt;
	this.dx = edge.dx;
	this.prev = prev;
}	
