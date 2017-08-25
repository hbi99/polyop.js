
(function() {
	'use strict';

	function equals(x1, x) {
		var p;
		for (p in x1) {
			if(typeof(x[p])=='undefined') {return false;}
		}

		for (p in x1) {
			if (x1[p]) {
				switch(typeof(x1[p])) {
					case 'object':
						if (!equals(x1[p], x[p])) { return false; } break;
					case 'function':
						if (typeof(x[p])=='undefined' ||
							(p != 'equals' && x1[p].toString() != x[p].toString()))
							return false;
						break;
					default:
						if (x1[p] != x[p]) { return false; }
				}
			} else {
				if (x[p])
					return false;
			}
		}

		for (p in x) {
			if (typeof(x1[p]) === 'undefined') return false;
		}
		return true;
	}

})();
