
// bundle state
var BundleState = function(state) {
	this.m_State = state ; // string
};

BundleState.UNBUNDLED   = new BundleState('UNBUNDLED');
BundleState.BUNDLE_HEAD = new BundleState('BUNDLE_HEAD');
BundleState.BUNDLE_TAIL = new BundleState('BUNDLE_TAIL');

BundleState.prototype = {
	toString: function() {
		return this.m_State;
	}
};
