
// ScanBeamTree
GEOMETRY.ScanBeamTree = function(yvalue) {
	this.y = yvalue;  // Scanbeam node y value
	this.less;        // Pointer to nodes with lower y
	this.more;        // Pointer to nodes with higher y
};

// ScanBeamTreeEntries
GEOMETRY.ScanBeamTreeEntries = function() {
	this.sbt_entries = 0;
	this.sb_tree;
};

GEOMETRY.ScanBeamTreeEntries.prototype = {
	build_sbt: function() {
		var sbt = [],
			entries = 0;
		entries = this.inner_build_sbt(entries, sbt, this.sb_tree);
		return sbt;
	},
	inner_build_sbt: function( entries, sbt, sbt_node) {
		if (sbt_node.less != null) {
			entries = this.inner_build_sbt(entries, sbt, sbt_node.less);
		}
		sbt[entries] = sbt_node.y;
		entries++;
		if (sbt_node.more != null) {
			entries = this.inner_build_sbt(entries, sbt, sbt_node.more);
		}
		return entries;
	}
};
