
///////////  LmtNode //////////////////////////

GEOMETRY.LmtNode = function(yvalue) {
	this.y = yvalue;   /* Y coordinate at local minimum     */
	this.first_bound;  /* Pointer to bound list             */
	this.next;         /* Pointer to next local minimum     */
};
