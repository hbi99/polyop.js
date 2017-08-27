
// LmtTable
var LmtTable = function() {
	this.top_node;
};

LmtTable.prototype.print = function() {
	var n = 0,
		lmt = this.top_node,
		edge;
	while (lmt != null) {
		n++;
		lmt = lmt.next;
	}
}
