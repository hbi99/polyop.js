
///////////////  BundleState  //////////////////////////////
GEOMETRY.BundleState = function(state) {
	this.m_State = state ; // String
};
GEOMETRY.BundleState.UNBUNDLED = new GEOMETRY.BundleState('UNBUNDLED');
GEOMETRY.BundleState.BUNDLE_HEAD = new GEOMETRY.BundleState('BUNDLE_HEAD');
GEOMETRY.BundleState.BUNDLE_TAIL = new GEOMETRY.BundleState('BUNDLE_TAIL');
GEOMETRY.BundleState.prototype.toString = function() {
	return this.m_State;
};
