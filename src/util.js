
// Point
function Point(x, y) {
	this.x = x;
	this.y = y;
}

// Line
function Line() {
	this.start; 
	this.end;
}

// Rectangle
var Rectangle = function(x, y, w, h) {
	this.x = x; 
	this.y = y;
	this.w = w;
	this.h = h;
};
Rectangle.prototype = {
	getMaxY: function() {
		return this.y + this.h;
	},
	getMinY: function() {
		return this.y;
	},
	getMaxX: function() {
		return this.x + this.w;
	},
	getMinX: function() {
		return this.x;
	},
	toString: function() {
		return '['+ x.toString() +' '+ y.toString() +' '+ w.toString() +' '+ h.toString() +']';
	}
};

// ItNode
var ItNode = function(edge0, edge1, x, y, next) {
	this.ie = [];                // Intersecting edge (bundle) pair
	this.point = new Point(x,y); // Point of intersection
	this.next = next;            // The next intersection table node
	this.ie[0] = edge0;
	this.ie[1] = edge1;
};

// StNode
var StNode = function(edge, prev) {
	this.edge = edge;   // Pointer to AET edge
	this.xb = edge.xb;  // Scanbeam bottom x coordinate
	this.xt = edge.xt;  // Scanbeam top x coordinate
	this.dx = edge.dx;  // Change in x for a unit y increase
	this.prev = prev;   // Previous edge in sorted list
};

// VertexNode
var VertexNode = function(x, y) {
	this.x = x;       // X coordinate component
	this.y = y;       // Y coordinate component
	this.next = null; // Pointer to next vertex in list
};

// VertexType
var VertexType = {
	NUL:  0, // Empty non-intersection
	EMX:  1, // External maximum
	ELI:  2, // External left intermediate
	TED:  3, // Top edge
	ERI:  4, // External right intermediate
	RED:  5, // Right edge
	IMM:  6, // Internal maximum and minimum
	IMN:  7, // Internal minimum
	EMN:  8, // External minimum
	EMM:  9, // External maximum and minimum
	LED: 10, // Left edge
	ILI: 11, // Internal left intermediate
	BED: 12, // Bottom edge
	IRI: 13, // Internal right intermediate
	IMX: 14, // Internal maximum
	FUL: 15, // Full non-intersection
	getType: function(tr, tl ,br ,bl) {
		return tr + (tl << 1) + (br << 2) + (bl << 3);
	}
};



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

// ArrayHelper
var ArrayHelper = {
	create2DArray: function(x, y) {
		var a = [],
			i = 0;
		for (; i<x; i++) {
			a[i] = [];
		}
		return a;
	},
	valueEqual: function(obj1, obj2) {
		if (obj1 === obj2) return true;
		if (equals(obj1, obj2)) return true;
		return false;
	},
	sortPointsClockwise: function(vertices) {
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
};

// ArrayList
var ArrayList = function(arr) {
	this._array = [];
	if (arr != null) this._array = arr;
};

ArrayList.prototype = {
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
