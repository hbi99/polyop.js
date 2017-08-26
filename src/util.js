
//Object.prototype.equals = function(x) {
function equals(x1, x) {
	var p;
	for (p in x1) {
		if (typeof(x[p]) === 'undefined') return false;
	}

	for (p in x1) {
		if (x1[p]) {
			switch(typeof(x1[p])) {
				case 'object':
					if (!equals(x1[p], x[p])) return false;
					break;
				case 'function':
					if (typeof(x[p]) === 'undefined' || (p !== 'equals' && x1[p].toString() !== x[p].toString())) return false;
					break;
				default:
					if (x1[p] !== x[p]) return false;
			}
		} else {
			if (x[p]) return false;
		}
	}
	for (p in x) {
		if (typeof(x1[p]) === 'undefined') return false;
	}
	return true;
}

///point
var Point = function(x, y) {
	this.x = x;
	this.y = y;
};

////////////// CLASS ArrayHelper ////////////////////////////////////

UTIL.ArrayHelper = function() {};
var static = UTIL.ArrayHelper;

static.create2DArray = function(x, y) {
	var a = [],
		i = 0;
	for (; i<x; i++) {
		a[i] = [];
	}
	return a;
};

static.valueEqual = function(obj1, obj2) {
	if (obj1 === obj2) return true;
	if (equals(obj1, obj2)) return true;
	return false;
}

static.sortPointsClockwise = function(vertices) {
	var isArrayList  = false,
		maxTop = null,
		maxBottom = null,
		maxLeft = null,
		maxRight = null,
		maxLeftIndex,
		newVertices = vertices,
		i, il, vertex,
		j, jl,
		reverse;

	if (vertices instanceof ArrayList) {
		vertices = vertices.toArray();
		isArrayList = true;
	}

	for (i=0, il=vertices.length; i<il; i++) {
		vertex  = vertices[i] ;
		if ((maxTop === null || maxTop.y > vertex.y) || (maxTop.y === vertex.y && vertex.x < maxTop.x)) maxTop = vertex;
		if ((maxBottom === null || maxBottom.y < vertex.y) || (maxBottom.y === vertex.y && vertex.x > maxBottom.x)) maxBottom = vertex;
		if ((maxRight === null || maxRight.x < vertex.x) || (maxRight.x === vertex.x && vertex.y < maxRight.y)) maxRight = vertex;
		if ((maxLeft === null || maxLeft.x > vertex.x) || (maxLeft.x === vertex.x && vertex.y > maxLeft.y)) {
			maxLeft = vertex;
			maxLeftIndex = i;
		}
	}

	if (maxLeftIndex > 0) {
		newVertices = []
		j = 0;
		for (i=maxLeftIndex, il=vertices.length; i<il; i++) {
			newVertices[j++] = vertices[i];
		}
		for (i=0; i<maxLeftIndex; i++) {
			newVertices[j++] = vertices[i];
		}
		vertices = newVertices;
	}

	reverse = false;
	for (i=0, il=vertices.length; i<il; i++) {
		vertex = vertices[i];
		if (equals(vertex, maxBottom)) {
			reverse = true;
			break;
		} else if (equals(vertex, maxTop)) {
			break;
		}
	}
	if (reverse) {
		newVertices = []
		newVertices[0] = vertices[0];
		j =1;
		for (i=vertices.length-1; i>0; i--) {
			newVertices[j++] = vertices[i];
		}
		vertices = newVertices;
	}
	return isArrayList ? new ArrayList(vertices) : vertices;
}

/////////////// END ArrayHelper  ////////////////////////////////////////////////

var ArrayHelper = UTIL.ArrayHelper;
////////////////// CLASS ArrayList  /////////////////////////

UTIL.ArrayList = function(arr) {
	this._array = [];
	if (arr != null) this._array = arr;
};

UTIL.ArrayList.prototype = {
	add: function(value) {
		this._array.push(value);
	},
	get: function(index) {
		return this._array[index];
	},
	size: function() {
		return this._array.length;
	},
	clear: function() {
		this._array  = [];
	},
	equals: function(list) {
		if (this._array.length != list.size()) return false;
		for (var i=0, il=this._array.length; i<il; i++) {
			if (!ArrayHelper.valueEqual(this._array[i], list.get(i))) return false;
		}
		return true;
	},
	hashCode: function() {
		return 0;
	},
	isEmpty: function() {
		return (this._array.length == 0);
	},
	toArray: function() {
		return this._array;
	}
};

///////////////// END ArrayList ////////////////////////
