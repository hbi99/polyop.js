
////////////// LmtTable ///////////////

GEOMETRY.LmtTable = function() {
	this.top_node;
};

GEOMETRY.LmtTable.prototype.print = function() {
	var n = 0,
		lmt = this.top_node,
		edge;
	while (lmt != null) {
	//	for (edge=lmt.first_bound; edge != null; edge=edge.next_bound) {
	//		console.log('edge.vertex.x='+ edge.vertex.x +'  edge.vertex.y='+ edge.vertex.y);
	//	}
		n++;
		lmt = lmt.next;
	}
}
