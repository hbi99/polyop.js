
(function() {
	'use strict';

	
// HState
var NH = 0,
	BH = 1,
	TH = 2,
	HState = {
		NH: NH, /* No horizontal edge                */
		BH: BH, /* Bottom horizontal edge            */
		TH: TH, /* Top horizontal edge               */
		next_h_state: [
		  /*        ABOVE     BELOW     CROSS */
		  /*        L   R     L   R     L   R */  
		  /* NH */ [BH, TH,   TH, BH,   NH, NH],
		  /* BH */ [NH, NH,   NH, NH,   TH, TH],
		  /* TH */ [NH, NH,   NH, NH,   BH, BH]
		]
	};

// Point
function Point(x, y) {
	this.x = x;
	this.y = y;
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

// EdgeNode
var EdgeNode = function() {
	this.bundle = ArrayHelper.create2DArray(2, 2); // Bundle edge flags
	this.vertex = new Point(); // Piggy-backed contour vertex data
	this.bot = new Point();    // Edge lower (x, y) coordinate
	this.top = new Point();    // Edge upper (x, y) coordinate
	this.xb;                   // Scanbeam bottom x coordinate
	this.xt;                   // Scanbeam top x coordinate
	this.dx;                   // Change in x for a unit y increase
	this.type;                 // Clip / subject edge flag
	this.bside = [];           // Bundle left / right indicators
	this.bstate = [];          // Edge bundle state
	this.outp = [];            // Output polygon / tristrip pointer
	this.prev;                 // Previous edge in the AET
	this.next;                 // Next edge in the AET
	this.pred;                 // Edge connected at the lower end
	this.succ;                 // Edge connected at the upper end
	this.next_bound;           // Pointer to next bound in LMT
};

// ItNode
var ItNode = function(edge0, edge1, x, y, next) {
	this.ie = [];                // Intersecting edge (bundle) pair
	this.point = new Point(x,y); // Point of intersection
	this.next = next;            // The next intersection table node
	this.ie[0] = edge0;
	this.ie[1] = edge1;
};

// LmtNode
var LmtNode = function(yvalue) {
	this.y = yvalue;   // Y coordinate at local minimum
	this.first_bound;  // Pointer to bound list
	this.next;         // Pointer to next local minimum
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

var createSegment = function(vx) {
	var res = new PolyDefault(),
		il = vx.length,
		i = 0;
	for(; i<il; i++) {
		res.addPoint(new Point(vx[i][0], vx[i][1]));
	}
	return res;
};

var getVertices = function(segment) {
	var vertices = [],
		il = segment.getNumPoints(),
		i = 0;
	for (; i<il; i++) {
		vertices.push([segment.getX(i), segment.getY(i)]);
	}
	return vertices;
};

var equals = function(x1, x) {
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
};

var isPointInPolygon = function(point, poly) {
	var x = point[0],
		y = point[1],
		i, il, j,
		xi, yi,
		xj, yj,
		inside = false,
		intersect;
	for (i=0, il=poly.length, j=poly.length-1; i<il; j=i++) {
		xi = poly[i][0];
		yi = poly[i][1];
		xj = poly[j][0];
		yj = poly[j][1];
		intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
		if (intersect) inside = !inside;
	}
	return inside;
};

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

/*
// publish to polyDefault;
polyop.Point       = Point;
polyop.Line        = Line;
polyop.Rectangle   = Rectangle;
polyop.EdgeNode    = EdgeNode;
polyop.ItNode      = ItNode;
polyop.LmtNode     = LmtNode;
polyop.StNode      = StNode;
polyop.VertexNode  = VertexNode;
polyop.ArrayList   = ArrayList;
polyop.ArrayHelper = ArrayHelper;
*/

	
var Clip = {
	DEBUG: false,
	GPC_EPSILON: 2.2204460492503131e-016,
	GPC_VERSION: '2.31',
	LEFT: 0,
	RIGHT: 1,
	ABOVE: 0,
	BELOW: 1,
	CLIP: 0,
	SUBJ: 1,
	/**
	 * Return the intersection of <code>p1</code> and <code>p2</code> where the
	 * return type is of <code>polyClass</code>.  See the note in the class description
	 * for more on <ocde>polyClass</code>.
	 *
	 * @param p1        One of the polygons to performt he intersection with
	 * @param p2        One of the polygons to performt he intersection with
	 * @param polyClass The type of <code>Poly</code> to return
	 */
	intersection: function(p1, p2, polyClass) {
		if (polyClass == null || polyClass == undefined) polyClass = 'PolyDefault';
		return this.clip(OperationType.GPC_INT, p1, p2, polyClass);
	},
	/**
	 * Return the union of <code>p1</code> and <code>p2</code> where the
	 * return type is of <code>polyClass</code>.  See the note in the class description
	 * for more on <ocde>polyClass</code>.
	 *
	 * @param p1        One of the polygons to performt he union with
	 * @param p2        One of the polygons to performt he union with
	 * @param polyClass The type of <code>Poly</code> to return
	 */
	union: function(p1, p2, polyClass) {
		if (polyClass == null || polyClass == undefined) polyClass = 'PolyDefault';
		return this.clip(OperationType.GPC_UNION, p1, p2, polyClass);
	},
	/**
	 * Return the xor of <code>p1</code> and <code>p2</code> where the
	 * return type is of <code>polyClass</code>.  See the note in the class description
	 * for more on <ocde>polyClass</code>.
	 *
	 * @param p1        One of the polygons to performt he xor with
	 * @param p2        One of the polygons to performt he xor with
	 * @param polyClass The type of <code>Poly</code> to return
	 */
	xor: function(p1, p2, polyClass) {
		if (polyClass == null || polyClass == undefined) polyClass = 'PolyDefault';
		return this.clip( OperationType.GPC_XOR, p1, p2, polyClass );
	},
	/**
	 * Return the difference of <code>p1</code> and <code>p2</code> where the
	 * return type is of <code>polyClass</code>.  See the note in the class description
	 * for more on <ocde>polyClass</code>.
	 *
	 * @param p1        Polygon from which second polygon will be substracted
	 * @param p2        Second polygon
	 * @param polyClass The type of <code>Poly</code> to return
	 */
	difference: function(p1, p2, polyClass) {
		if (polyClass == null || polyClass == undefined) polyClass = 'PolyDefault';
		return this.clip( OperationType.GPC_DIFF, p2, p1, polyClass );
	},
	intersection: function(p1, p2) {
		return this.clip( OperationType.GPC_INT, p1, p2, 'PolyDefault.class' );
	},
	/**
	 * Create a new <code>Poly</code> type object using <code>polyClass</code>.
	 */
	createNewPoly: function(polyClass) {
		switch(polyClass) {
			case 'PolySimple':
				return new PolySimple();
			case 'PolyDefault':
				return new PolyDefault();
			case 'PolyDefault.class':
				return new PolyDefault();
		}
		return null;
	},
	/**
	 * <code>clip()</code> is the main method of the clipper algorithm.
	 * This is where the conversion from really begins.
	 */
	clip: function(op, subj, clip, polyClass) {
		var result = this.createNewPoly(polyClass),
			lmt_table,
			sbte,
			s_heap,
			c_heap,
			parity,
			local_min,
			out_poly,
			scanbeam,
			contributing,
			intersect,
			sbt, aet, yb, yt, dy,
			p, q, ix, iy, cf, xb,
			br, bl, tr, tl, px, e0, e1,
			in_clip,
			in_subj,
			edge,
			prev_edge,
			next_edge,
			succ_edge,
			ne_type,
			ne_type_opp,
			horiz,
			exists,
			search,
			vclass;
		
		/* Test for trivial NULL result cases */
		if ((subj.isEmpty() && clip.isEmpty()) || (subj.isEmpty() && (op === OperationType.GPC_INT || op === OperationType.GPC_DIFF)) || (clip.isEmpty() && op === OperationType.GPC_INT) ) {
			return result;
		}
		/* Identify potentialy contributing contours */
		if ((op === OperationType.GPC_INT || op === OperationType.GPC_DIFF) && !subj.isEmpty() && !clip.isEmpty()) {
			this.minimax_test(subj, clip, op);
		}
		
		/* Build LMT */
		lmt_table = new LmtTable();
		sbte = new ScanBeamTreeEntries();
		s_heap = null;
		c_heap = null;
		
		if (!subj.isEmpty()) {
			s_heap = this.build_lmt(lmt_table, sbte, subj, this.SUBJ, op);
		}
		if (!clip.isEmpty()) {
			c_heap = this.build_lmt(lmt_table, sbte, clip, this.CLIP, op);
		}

		/* Return a NULL result if no contours contribute */
		if (lmt_table.top_node == null) return result;
		
		/* Build scanbeam table from scanbeam tree */
		sbt = sbte.build_sbt();
		parity= [];
		parity[0] = this.LEFT;
		parity[1] = this.LEFT;

		/* Invert clip polygon for difference operation */
		if (op === OperationType.GPC_DIFF) {
			parity[this.CLIP] = this.RIGHT;
		}

		local_min = lmt_table.top_node;
		out_poly = new TopPolygonNode(); // used to create resulting Poly
		aet = new AetTree();
		scanbeam = 0;
		
		/* Process each scanbeam */
		while(scanbeam < sbt.length) {
			/* Set yb and yt to the bottom and top of the scanbeam */
			yb = sbt[scanbeam++];
			yt = 0.0;
			dy = 0.0;
			if ( scanbeam < sbt.length ) {
				yt = sbt[scanbeam];
				dy = yt - yb;
			}
			/* === SCANBEAM BOUNDARY PROCESSING ================================ */

			/* If LMT node corresponding to yb exists */
			if (local_min != null ) {
				if (local_min.y == yb) {
					/* Add edges starting at this local minimum to the AET */
					for (edge = local_min.first_bound; edge != null; edge= edge.next_bound) {
						this.add_edge_to_aet( aet, edge );
					}
					local_min = local_min.next;
				}
			}

			/* Set dummy previous x value */
			px = -Number.MAX_VALUE;
			/* Create bundles within AET */
			e0 = aet.top_node;
			e1 = aet.top_node;
			/* Set up bundle fields of first edge */
			aet.top_node.bundle[this.ABOVE][ aet.top_node.type ] = (aet.top_node.top.y != yb) ? 1 : 0;
			aet.top_node.bundle[this.ABOVE][ ((aet.top_node.type == 0) ? 1 : 0) ] = 0;
			aet.top_node.bstate[this.ABOVE] = BundleState.UNBUNDLED;

			for (next_edge = aet.top_node.next; next_edge != null; next_edge = next_edge.next) {
				ne_type = next_edge.type;
				ne_type_opp = ((next_edge.type == 0) ? 1 : 0); //next edge type opposite
				/* Set up bundle fields of next edge */
				next_edge.bundle[this.ABOVE][ ne_type ] = (next_edge.top.y != yb) ? 1 : 0;
				next_edge.bundle[this.ABOVE][ ne_type_opp ] = 0;
				next_edge.bstate[this.ABOVE] = BundleState.UNBUNDLED;

				/* Bundle edges above the scanbeam boundary if they coincide */
				if ( next_edge.bundle[this.ABOVE][ne_type] == 1) {
					if (this.EQ(e0.xb, next_edge.xb) && this.EQ(e0.dx, next_edge.dx) && e0.top.y != yb) {
						next_edge.bundle[this.ABOVE][ ne_type     ] ^= e0.bundle[this.ABOVE][ ne_type     ];
						next_edge.bundle[this.ABOVE][ ne_type_opp ]  = e0.bundle[this.ABOVE][ ne_type_opp ];
						next_edge.bstate[this.ABOVE] = BundleState.BUNDLE_HEAD;
						e0.bundle[this.ABOVE][this.CLIP] = 0;
						e0.bundle[this.ABOVE][this.SUBJ] = 0;
						e0.bstate[this.ABOVE] = BundleState.BUNDLE_TAIL;
					}
					e0 = next_edge;
				}
			}

			horiz = [];
			horiz[this.CLIP] = HState.NH;
			horiz[this.SUBJ] = HState.NH;
			exists = [];
			exists[this.CLIP] = 0;
			exists[this.SUBJ] = 0;
			cf = null;
			
			/* Process each edge at this scanbeam boundary */
			for (edge = aet.top_node; edge != null; edge = edge.next) {
				exists[this.CLIP] = edge.bundle[this.ABOVE][this.CLIP] + (edge.bundle[this.BELOW][this.CLIP] << 1);
				exists[this.SUBJ] = edge.bundle[this.ABOVE][this.SUBJ] + (edge.bundle[this.BELOW][this.SUBJ] << 1);

				if (exists[this.CLIP] != 0 || exists[this.SUBJ] != 0) {
					/* Set bundle side */
					edge.bside[this.CLIP] = parity[this.CLIP];
					edge.bside[this.SUBJ] = parity[this.SUBJ];
					contributing = false;
					br = 0;
					bl = 0;
					tr = 0;
					tl = 0;
					/* Determine contributing status and quadrant occupancies */
					if (op === OperationType.GPC_DIFF || op === OperationType.GPC_INT) {
						contributing = (exists[this.CLIP] != 0 && (parity[this.SUBJ] != 0 || horiz[this.SUBJ] != 0)) || (exists[this.SUBJ] != 0 && (parity[this.CLIP] != 0 || horiz[this.CLIP] != 0)) || (exists[this.CLIP] != 0 && exists[this.SUBJ] != 0 && parity[this.CLIP] == parity[this.SUBJ]);
						br = (parity[this.CLIP] != 0 && parity[this.SUBJ] != 0) ? 1 : 0;
						bl = (parity[this.CLIP] ^ edge.bundle[this.ABOVE][this.CLIP] != 0 && parity[this.SUBJ] ^ edge.bundle[this.ABOVE][this.SUBJ]) != 0 ? 1: 0;
						tr = (((parity[this.CLIP] ^ (horiz[this.CLIP] != HState.NH ? 1 : 0)) != 0) && ((parity[this.SUBJ] ^ (horiz[this.SUBJ] != HState.NH ? 1 : 0)) != 0) ) ? 1 : 0;
						tl = (((parity[this.CLIP] ^ (horiz[this.CLIP] != HState.NH ? 1 : 0) ^ edge.bundle[this.BELOW][this.CLIP]) != 0) && ((parity[this.SUBJ] ^ (horiz[this.SUBJ] != HState.NH ? 1 : 0) ^ edge.bundle[this.BELOW][this.SUBJ]) != 0)) ? 1 : 0;
					} else if (op === OperationType.GPC_XOR) {
						contributing = exists[this.CLIP] != 0 || exists[this.SUBJ] != 0;
						br = parity[this.CLIP] ^ parity[this.SUBJ];
						bl = (parity[this.CLIP] ^ edge.bundle[this.ABOVE][this.CLIP]) ^ (parity[this.SUBJ] ^ edge.bundle[this.ABOVE][this.SUBJ]);
						tr = (parity[this.CLIP] ^ (horiz[this.CLIP] != HState.NH ? 1 : 0)) ^ (parity[this.SUBJ] ^ (horiz[this.SUBJ] != HState.NH ? 1 : 0));
						tl = (parity[this.CLIP] ^ (horiz[this.CLIP] != HState.NH ? 1 : 0) ^ edge.bundle[this.BELOW][this.CLIP]) ^ (parity[this.SUBJ] ^ (horiz[this.SUBJ]!=HState.NH ? 1 : 0) ^ edge.bundle[this.BELOW][this.SUBJ]);
					} else if (op === OperationType.GPC_UNION) {
						contributing = (exists[this.CLIP] != 0 && (!(parity[this.SUBJ] != 0) || horiz[this.SUBJ] != 0)) || (exists[this.SUBJ] != 0 && (!(parity[this.CLIP] != 0) || horiz[this.CLIP] != 0)) || (exists[this.CLIP] != 0 && exists[this.SUBJ] != 0 && parity[this.CLIP] == parity[this.SUBJ]);
						br = (parity[this.CLIP] != 0 || parity[this.SUBJ] != 0) ? 1 : 0;
						bl = (((parity[this.CLIP] ^ edge.bundle[this.ABOVE][this.CLIP]) != 0) || (parity[this.SUBJ] ^ edge.bundle[this.ABOVE][this.SUBJ] != 0)) ? 1 : 0;
						tr = (((parity[this.CLIP] ^ (horiz[this.CLIP] != HState.NH ? 1 : 0)) != 0) || ((parity[this.SUBJ] ^ (horiz[this.SUBJ] != HState.NH ? 1 : 0)) != 0)) ? 1 : 0;
						tl = (((parity[this.CLIP] ^ (horiz[this.CLIP] != HState.NH ? 1 : 0) ^ edge.bundle[this.BELOW][this.CLIP]) != 0) || ((parity[this.SUBJ] ^ (horiz[this.SUBJ] != HState.NH ? 1 : 0) ^ edge.bundle[this.BELOW][this.SUBJ]) != 0) ) ? 1 : 0;
					}

					/* Update parity */
					parity[this.CLIP] ^= edge.bundle[this.ABOVE][this.CLIP];
					parity[this.SUBJ] ^= edge.bundle[this.ABOVE][this.SUBJ];

					/* Update horizontal state */
					if (exists[this.CLIP] != 0) {
						horiz[this.CLIP] = HState.next_h_state[horiz[this.CLIP]][((exists[this.CLIP] - 1) << 1) + parity[this.CLIP]];
					}
					if ( exists[this.SUBJ] != 0) {
						horiz[this.SUBJ] = HState.next_h_state[horiz[this.SUBJ]][((exists[this.SUBJ] - 1) << 1) + parity[this.SUBJ]];
					}
					if (contributing) {
						xb = edge.xb;
						vclass = VertexType.getType(tr, tl, br, bl);
						switch (vclass) {
							case VertexType.EMN:
							case VertexType.IMN:
								edge.outp[this.ABOVE] = out_poly.add_local_min(xb, yb);
								px = xb;
								cf = edge.outp[this.ABOVE];
								break;
							case VertexType.ERI:
								if (xb != px) {
									cf.add_right(xb, yb);
									px = xb;
								}
								edge.outp[this.ABOVE] = cf;
								cf = null;
								break;
							case VertexType.ELI:
								edge.outp[this.BELOW].add_left(xb, yb);
								px = xb;
								cf = edge.outp[this.BELOW];
								break;
							case VertexType.EMX:
								if (xb != px) {
									cf.add_left(xb, yb);
									px = xb;
								}
								out_poly.merge_right(cf, edge.outp[this.BELOW]);
								cf = null;
								break;
							case VertexType.ILI:
								if (xb != px) {
									cf.add_left(xb, yb);
									px = xb;
								}
								edge.outp[this.ABOVE] = cf;
								cf = null;
								break;
							case VertexType.IRI:
								edge.outp[this.BELOW].add_right(xb, yb);
								px = xb;
								cf = edge.outp[this.BELOW];
								edge.outp[this.BELOW] = null;
								break;
							case VertexType.IMX:
								if (xb != px) {
									cf.add_right(xb, yb);
									px = xb;
								}
								out_poly.merge_left(cf, edge.outp[this.BELOW]);
								cf = null;
								edge.outp[this.BELOW] = null;
								break;
							case VertexType.IMM:
								if (xb != px) {
									cf.add_right( xb, yb);
									px = xb;
								}
								out_poly.merge_left(cf, edge.outp[this.BELOW]);
								edge.outp[this.BELOW] = null;
								edge.outp[this.ABOVE] = out_poly.add_local_min(xb, yb);
								cf = edge.outp[this.ABOVE];
								break;
							case VertexType.EMM:
								if (xb != px) {
									cf.add_left(xb, yb);
									px = xb;
								}
								out_poly.merge_right(cf, edge.outp[this.BELOW]);
								edge.outp[this.BELOW] = null;
								edge.outp[this.ABOVE] = out_poly.add_local_min(xb, yb);
								cf = edge.outp[this.ABOVE];
								break;
							case VertexType.LED:
								if (edge.bot.y == yb) edge.outp[this.BELOW].add_left( xb, yb);
								edge.outp[this.ABOVE] = edge.outp[this.BELOW];
								px = xb;
								break;
							case VertexType.RED:
								if (edge.bot.y == yb) edge.outp[this.BELOW].add_right( xb, yb );
								edge.outp[this.ABOVE] = edge.outp[this.BELOW];
								px = xb;
								break;
						}
					}
				}
				out_poly.print();
			}
			
			/* Delete terminating edges from the AET, otherwise compute xt */
			for (edge = aet.top_node; edge != null; edge = edge.next) {
				if (edge.top.y == yb) {
					prev_edge = edge.prev;
					next_edge = edge.next;

					if (prev_edge != null) prev_edge.next = next_edge;
					else aet.top_node = next_edge;

					if (next_edge != null) next_edge.prev = prev_edge;

					/* Copy bundle head state to the adjacent tail edge if required */
					if (edge.bstate[this.BELOW] == BundleState.BUNDLE_HEAD && prev_edge != null) {
						if (prev_edge.bstate[this.BELOW] == BundleState.BUNDLE_TAIL) {
							prev_edge.outp[this.BELOW] = edge.outp[this.BELOW];
							prev_edge.bstate[this.BELOW] = BundleState.UNBUNDLED;
							if (prev_edge.prev != null) {
								if (prev_edge.prev.bstate[this.BELOW] == BundleState.BUNDLE_TAIL) {
									prev_edge.bstate[this.BELOW] = BundleState.BUNDLE_HEAD;
								}
							}
						}
					}
				} else {
					if (edge.top.y == yt) edge.xt = edge.top.x;
					else edge.xt = edge.bot.x + edge.dx * (yt - edge.bot.y);
				}
			}

			if (scanbeam < sbte.sbt_entries) {
				/* === SCANBEAM INTERIOR PROCESSING ============================== */

				/* Build intersection table for the current scanbeam */
				var it_table = new ItNodeTable();
				it_table.build_intersection_table(aet, dy);
				
				/* Process each node in the intersection table */
				for (intersect = it_table.top_node; intersect != null; intersect = intersect.next) {
					e0 = intersect.ie[0];
					e1 = intersect.ie[1];

					/* Only generate output for contributing intersections */
					if ((e0.bundle[this.ABOVE][this.CLIP] != 0 || e0.bundle[this.ABOVE][this.SUBJ] != 0) && (e1.bundle[this.ABOVE][this.CLIP] != 0 || e1.bundle[this.ABOVE][this.SUBJ] != 0)) {
						p = e0.outp[this.ABOVE];
						q = e1.outp[this.ABOVE];
						ix = intersect.point.x;
						iy = intersect.point.y + yb;
						in_clip = ((e0.bundle[this.ABOVE][this.CLIP] != 0 && !(e0.bside[this.CLIP] != 0)) || (e1.bundle[this.ABOVE][this.CLIP] != 0 && e1.bside[this.CLIP] != 0) || (!(e0.bundle[this.ABOVE][this.CLIP] != 0) && !(e1.bundle[this.ABOVE][this.CLIP] != 0) && e0.bside[this.CLIP] != 0 && e1.bside[this.CLIP] != 0)) ? 1 : 0;
						in_subj = ((e0.bundle[this.ABOVE][this.SUBJ] != 0 && !(e0.bside[this.SUBJ] != 0)) || (e1.bundle[this.ABOVE][this.SUBJ] != 0 && e1.bside[this.SUBJ] != 0) || (!(e0.bundle[this.ABOVE][this.SUBJ] != 0) && !(e1.bundle[this.ABOVE][this.SUBJ] != 0) && e0.bside[this.SUBJ] != 0 && e1.bside[this.SUBJ] != 0)) ? 1 : 0;
						tr = 0
						tl = 0;
						br = 0;
						bl = 0;
						/* Determine quadrant occupancies */
						if (op == OperationType.GPC_DIFF || op == OperationType.GPC_INT) {
							tr = (in_clip != 0 && in_subj != 0) ? 1 : 0;
							tl = (((in_clip ^ e1.bundle[this.ABOVE][this.CLIP]) != 0) && ((in_subj ^ e1.bundle[this.ABOVE][this.SUBJ]) != 0)) ? 1 : 0;
							br = (((in_clip ^ e0.bundle[this.ABOVE][this.CLIP]) != 0) && ((in_subj ^ e0.bundle[this.ABOVE][this.SUBJ]) != 0)) ? 1 : 0;
							bl = (((in_clip ^ e1.bundle[this.ABOVE][this.CLIP] ^ e0.bundle[this.ABOVE][this.CLIP]) != 0) && ((in_subj ^ e1.bundle[this.ABOVE][this.SUBJ] ^ e0.bundle[this.ABOVE][this.SUBJ]) != 0) ) ? 1 : 0;
						} else if (op == OperationType.GPC_XOR) {
							tr = in_clip^ in_subj;
							tl = (in_clip ^ e1.bundle[this.ABOVE][this.CLIP]) ^ (in_subj ^ e1.bundle[this.ABOVE][this.SUBJ]);
							br = (in_clip ^ e0.bundle[this.ABOVE][this.CLIP]) ^ (in_subj ^ e0.bundle[this.ABOVE][this.SUBJ]);
							bl = (in_clip ^ e1.bundle[this.ABOVE][this.CLIP] ^ e0.bundle[this.ABOVE][this.CLIP]) ^ (in_subj ^ e1.bundle[this.ABOVE][this.SUBJ] ^ e0.bundle[this.ABOVE][this.SUBJ]);
						} else if ( op == OperationType.GPC_UNION ) {
							tr = (in_clip != 0 || in_subj != 0) ? 1 : 0;
							tl = (((in_clip ^ e1.bundle[this.ABOVE][this.CLIP]) != 0) || ((in_subj ^ e1.bundle[this.ABOVE][this.SUBJ]) != 0)) ? 1 : 0;
							br = (((in_clip ^ e0.bundle[this.ABOVE][this.CLIP]) != 0) || ((in_subj ^ e0.bundle[this.ABOVE][this.SUBJ]) != 0)) ? 1 : 0;
							bl = (((in_clip ^ e1.bundle[this.ABOVE][this.CLIP] ^ e0.bundle[this.ABOVE][this.CLIP]) != 0) || ((in_subj ^ e1.bundle[this.ABOVE][this.SUBJ] ^ e0.bundle[this.ABOVE][this.SUBJ]) != 0)) ? 1 : 0;
						}

						vclass = VertexType.getType(tr, tl, br, bl);
						switch (vclass) {
							case VertexType.EMN:
								e0.outp[this.ABOVE] = out_poly.add_local_min(ix, iy);
								e1.outp[this.ABOVE] = e0.outp[this.ABOVE];
								break;
							case VertexType.ERI:
								if (p != null) {
									p.add_right(ix, iy);
									e1.outp[this.ABOVE] = p;
									e0.outp[this.ABOVE] = null;
								}
								break;
							case VertexType.ELI:
								if (q != null) {
									q.add_left(ix, iy);
									e0.outp[this.ABOVE] = q;
									e1.outp[this.ABOVE] = null;
								}
								break;
							case VertexType.EMX:
								if (p != null && q != null) {
									p.add_left(ix, iy);
									out_poly.merge_right(p, q);
									e0.outp[this.ABOVE] = null;
									e1.outp[this.ABOVE] = null;
								}
								break;
							case VertexType.IMN:
								e0.outp[this.ABOVE] = out_poly.add_local_min(ix, iy);
								e1.outp[this.ABOVE] = e0.outp[this.ABOVE];
								break;
							case VertexType.ILI:
								if (p != null) {
									p.add_left(ix, iy);
									e1.outp[this.ABOVE] = p;
									e0.outp[this.ABOVE] = null;
								}
								break;
							case VertexType.IRI:
								if (q != null) {
									q.add_right(ix, iy);
									e0.outp[this.ABOVE] = q;
									e1.outp[this.ABOVE] = null;
								}
								break;
							case VertexType.IMX:
								if (p != null && q != null) {
									p.add_right(ix, iy);
									out_poly.merge_left(p, q);
									e0.outp[this.ABOVE] = null;
									e1.outp[this.ABOVE] = null;
								}
								break;
							case VertexType.IMM:
								if (p != null && q != null) {
									p.add_right(ix, iy);
									out_poly.merge_left(p, q);
									e0.outp[this.ABOVE] = out_poly.add_local_min(ix, iy);
									e1.outp[this.ABOVE] = e0.outp[this.ABOVE];
								}
								break;
							case VertexType.EMM:
								if (p != null && q != null) {
									p.add_left(ix, iy);
									out_poly.merge_right(p, q);
									e0.outp[this.ABOVE] = out_poly.add_local_min(ix, iy);
									e1.outp[this.ABOVE] = e0.outp[this.ABOVE];
								}
								break;
						}
					}

					/* Swap bundle sides in response to edge crossing */
					if (e0.bundle[this.ABOVE][this.CLIP] != 0) e1.bside[this.CLIP] = (e1.bside[this.CLIP] == 0) ? 1 : 0;
					if (e1.bundle[this.ABOVE][this.CLIP] != 0) e0.bside[this.CLIP] = (e0.bside[this.CLIP] == 0) ? 1 : 0;
					if (e0.bundle[this.ABOVE][this.SUBJ] != 0) e1.bside[this.SUBJ] = (e1.bside[this.SUBJ] == 0) ? 1 : 0;
					if (e1.bundle[this.ABOVE][this.SUBJ] != 0) e0.bside[this.SUBJ] = (e0.bside[this.SUBJ] == 0) ? 1 : 0;

					/* Swap e0 and e1 bundles in the AET */
					prev_edge = e0.prev;
					next_edge = e1.next;
					if (next_edge != null) next_edge.prev = e0;

					if (e0.bstate[this.ABOVE] == BundleState.BUNDLE_HEAD) {
						search = true;
						while (search) {
							prev_edge = prev_edge.prev;
							if (prev_edge != null && prev_edge.bstate[this.ABOVE] != BundleState.BUNDLE_TAIL) {
								search = false;
							} else {
								search = false;
							}
						}
					}
					if (prev_edge == null) {
						aet.top_node.prev = e1;
						e1.next = aet.top_node;
						aet.top_node = e0.next;
					} else {
						prev_edge.next.prev = e1;
						e1.next = prev_edge.next;
						prev_edge.next = e0.next;
					}
					e0.next.prev = prev_edge;
					e1.next.prev = e1;
					e0.next = next_edge;
				}

				/* Prepare for next scanbeam */
				for (edge = aet.top_node; edge != null; edge = edge.next) {
					next_edge = edge.next;
					succ_edge = edge.succ;
					if (edge.top.y == yt && succ_edge != null) {
						/* Replace AET edge by its successor */
						succ_edge.outp[this.BELOW] = edge.outp[this.ABOVE];
						succ_edge.bstate[this.BELOW] = edge.bstate[this.ABOVE];
						succ_edge.bundle[this.BELOW][this.CLIP] = edge.bundle[this.ABOVE][this.CLIP];
						succ_edge.bundle[this.BELOW][this.SUBJ] = edge.bundle[this.ABOVE][this.SUBJ];
						
						prev_edge = edge.prev;
						if (prev_edge != null) prev_edge.next = succ_edge;
						else aet.top_node = succ_edge;

						if (next_edge != null) next_edge.prev = succ_edge;
						succ_edge.prev = prev_edge;
						succ_edge.next = next_edge;
					} else {
						/* Update this edge */
						edge.outp[this.BELOW] = edge.outp[this.ABOVE];
						edge.bstate[this.BELOW] = edge.bstate[this.ABOVE];
						edge.bundle[this.BELOW][this.CLIP] = edge.bundle[this.ABOVE][this.CLIP];
						edge.bundle[this.BELOW][this.SUBJ] = edge.bundle[this.ABOVE][this.SUBJ];
						edge.xb = edge.xt;
					}
					edge.outp[this.ABOVE] = null;
				}
			}
		}
		/* Generate result polygon from out_poly */
		result = out_poly.getResult(polyClass);
			
		return result;
	},
	EQ: function(a, b) {
		return Math.abs(a - b) <= this.GPC_EPSILON;
	},
	PREV_INDEX: function(i, n) {
		return (i - 1+ n) % n;
	},
	NEXT_INDEX: function(i, n) {
		return (i + 1) % n;
	},
	OPTIMAL: function ( p, i) {
		return (p.getY(this.PREV_INDEX (i, p.getNumPoints())) != p.getY(i)) || (p.getY(this.NEXT_INDEX(i, p.getNumPoints())) != p.getY(i)) ;
	},
	create_contour_bboxes: function (p) {
		var box = [],
			inner_poly,
			cl = p.getNumInnerPoly(),
			c = 0;
		/* Construct contour bounding boxes */
		for (; c < cl; c++) {
			inner_poly = p.getInnerPoly(c);
			box[c] = inner_poly.getBounds();
		}
		return box;
	},
	minimax_test: function (subj, clip, op) {
		var s_bbox = this.create_contour_bboxes(subj),
			c_bbox = this.create_contour_bboxes(clip),
			subj_num_poly = subj.getNumInnerPoly(),
			clip_num_poly = clip.getNumInnerPoly(),
			o_table = ArrayHelper.create2DArray(subj_num_poly,clip_num_poly),
			s, c,
			overlap;

		/* Check all subject contour bounding boxes against clip boxes */
		for (s=0; s < subj_num_poly; s++) {
			for (c=0; c < clip_num_poly ; c++) {
				o_table[s][c] =
					(!(s_bbox[s].getMaxX() < c_bbox[c].getMinX() || s_bbox[s].getMinX() > c_bbox[c].getMaxX())) &&
						(!(s_bbox[s].getMaxY() < c_bbox[c].getMinY() || s_bbox[s].getMinY() > c_bbox[c].getMaxY()));
			}
		}

		/* For each clip contour, search for any subject contour overlaps */
		for (c=0; c < clip_num_poly; c++ ) {
			overlap = false;
			for (s=0; !overlap && s < subj_num_poly; s++) {
				overlap = o_table[s][c];
			}
			if (!overlap) {
				clip.setContributing(c, false); // Flag non contributing status
			}
		}

		if (op == OperationType.GPC_INT) {
			/* For each subject contour, search for any clip contour overlaps */
			for (s=0; s < subj_num_poly; s++) {
				overlap = false;
				for (c=0; !overlap && c < clip_num_poly; c++) {
					overlap = o_table[s][c];
				}
				if (!overlap) {
					subj.setContributing(s, false); // Flag non contributing status
				}
			}
		}
	},
	bound_list: function(lmt_table, y) {
		var prev,
			node,
			done,
			existing_node;

		if (lmt_table.top_node == null) {
			lmt_table.top_node = new LmtNode(y);
			return lmt_table.top_node ;
		} else {
			prev = null;
			node = lmt_table.top_node;
			done = false;
			while(!done) {
				if (y < node.y) {
					/* Insert a new LMT node before the current node */
					existing_node = node;
					node = new LmtNode(y);
					node.next = existing_node;
					if (prev == null) lmt_table.top_node = node;
					else  prev.next = node;
					done = true;
				} else if (y > node.y) {
					/* Head further up the LMT */
					if (node.next == null) {
						node.next = new LmtNode(y);
						node = node.next;
						done = true;
					} else {
						prev = node;
						node = node.next;
					}
				} else {
					/* Use this existing LMT node */
					done = true;
				}
			}
			return node;
		}
	},
	insert_bound: function (lmt_node, e) {
		var done,
			prev_bound,
			current_bound;

		if (lmt_node.first_bound == null) {
			/* Link node e to the tail of the list */
			lmt_node.first_bound = e;
		} else {
			done = false;
			prev_bound = null;
			current_bound = lmt_node.first_bound;
			while(!done) {
				/* Do primary sort on the x field */
				if (e.bot.x < current_bound.bot.x) {
					/* Insert a new node mid-list */
					if (prev_bound == null) {
						lmt_node.first_bound = e;
					} else {
						prev_bound.next_bound = e;
					}
					e.next_bound = current_bound;
					done = true;
				} else if (e.bot.x == current_bound.bot.x) {
					/* Do secondary sort on the dx field */
					if (e.dx < current_bound.dx) {
						/* Insert a new node mid-list */
						if (prev_bound == null) {
							lmt_node.first_bound = e;
						} else {
							prev_bound.next_bound = e;
						}
						e.next_bound = current_bound;
						done = true;
					} else {
						/* Head further down the list */
						if (current_bound.next_bound == null) {
							current_bound.next_bound = e;
							done = true;
						} else {
							prev_bound = current_bound;
							current_bound = current_bound.next_bound;
						}
					}
				} else {
					/* Head further down the list */
					if (current_bound.next_bound == null) {
						current_bound.next_bound = e;
						done = true;
					} else {
						prev_bound = current_bound;
						current_bound = current_bound.next_bound;
					}
				}
			}
		}
	},
	add_edge_to_aet: function (aet, edge) {
		var current_edge,
			prev,
			done;

		if (aet.top_node == null) {
			/* Append edge onto the tail end of the AET */
			aet.top_node = edge;
			edge.prev = null ;
			edge.next = null;
		} else {
			current_edge = aet.top_node;
			prev = null;
			done = false;
			while (!done) {
				/* Do primary sort on the xb field */
				if (edge.xb < current_edge.xb) {
					/* Insert edge here (before the AET edge) */
					edge.prev = prev;
					edge.next = current_edge;
					current_edge.prev = edge;

					if (prev == null) aet.top_node = edge;
					else prev.next = edge;
					
					done = true;
				} else if (edge.xb == current_edge.xb) {
					/* Do secondary sort on the dx field */
					if (edge.dx < current_edge.dx) {
						/* Insert edge here (before the AET edge) */
						edge.prev = prev;
						edge.next = current_edge;
						current_edge.prev = edge;
						
						if (prev == null) aet.top_node = edge;
						else prev.next = edge;
						
						done = true;
					} else {
						/* Head further into the AET */
						prev = current_edge;
						if (current_edge.next == null) {
							current_edge.next = edge;
							edge.prev = current_edge;
							edge.next = null;
							done = true;
						} else {
							current_edge = current_edge.next ;
						}
					}
				} else {
					/* Head further into the AET */
					prev = current_edge;
					if (current_edge.next == null) {
						current_edge.next = edge;
						edge.prev = current_edge;
						edge.next = null;
						done = true;
					} else {
						current_edge = current_edge.next;
					}
				}
			}
		}
	},
	add_to_sbtree: function (sbte, y) {
		var tree_node,
			done;
		if (sbte.sb_tree == null) {
			/* Add a new tree node here */
			sbte.sb_tree = new ScanBeamTree(y);
			sbte.sbt_entries++;
			return;
		}
		tree_node = sbte.sb_tree;
		done = false;
		while (!done) {
			if (tree_node.y > y) {
				if (tree_node.less == null) {
					tree_node.less = new ScanBeamTree(y);
					sbte.sbt_entries++;
					done = true;
				} else {
					tree_node = tree_node.less;
				}
			} else if (tree_node.y < y) {
				if (tree_node.more == null) {
					tree_node.more = new ScanBeamTree(y);
					sbte.sbt_entries++;
					done = true;
				} else {
					tree_node = tree_node.more;
				}
			} else {
				done = true;
			}
		}
	},
	build_lmt: function(lmt_table, sbte, p, type, op) {
		/* Create the entire input polygon edge table in one go */
		var edge_table = new EdgeTable(),
			c, cl,
			ip,
			num_vertices,
			num_edges,
			e_index,
			max,
			min,
			x, y,
			v, e, ev, ei,
			i;
		
		for (c=0; c < p.getNumInnerPoly(); c++) {
			ip = p.getInnerPoly(c);
			if (!ip.isContributing(0)) {
				/* Ignore the non-contributing contour */
				ip.setContributing(0, true);
			} else {
				/* Perform contour optimisation */
				num_vertices = 0;
				e_index = 0;
				edge_table = new EdgeTable();
				for ( var i=0; i<ip.getNumPoints(); i++) {
					if (this.OPTIMAL(ip, i)) {
						x = ip.getX(i);
						y = ip.getY(i);
						edge_table.addNode( x, y );
						
						/* Record vertex in the scanbeam table */
						this.add_to_sbtree( sbte, ip.getY(i) );
						
						num_vertices++;
					}
				}
				
				/* Do the contour forward pass */
				for (var min= 0; min < num_vertices; min++) {
					/* If a forward local minimum... */
					if (edge_table.FWD_MIN(min)) {
						/* Search for the next local maximum... */
						num_edges = 1;
						max = this.NEXT_INDEX(min, num_vertices);
						while (edge_table.NOT_FMAX(max)) {
							num_edges++;
							max = this.NEXT_INDEX(max, num_vertices);
						}
						
						/* Build the next edge list */
						v = min;
						e = edge_table.getNode(e_index);
						e.bstate[this.BELOW] = BundleState.UNBUNDLED;
						e.bundle[this.BELOW][this.CLIP] = 0;
						e.bundle[this.BELOW][this.SUBJ] = 0;
						
						for (i=0; i<num_edges; i++) {
							ei = edge_table.getNode(e_index+i);
							ev = edge_table.getNode(v);
							
							ei.xb    = ev.vertex.x;
							ei.bot.x = ev.vertex.x;
							ei.bot.y = ev.vertex.y;
							
							v = this.NEXT_INDEX(v, num_vertices);
							ev = edge_table.getNode(v);
							
							ei.top.x = ev.vertex.x;
							ei.top.y = ev.vertex.y;
							ei.dx = (ev.vertex.x - ei.bot.x) / (ei.top.y - ei.bot.y);
							ei.type = type;
							ei.outp[this.ABOVE] = null;
							ei.outp[this.BELOW] = null;
							ei.next = null;
							ei.prev = null;
							ei.succ = (num_edges > 1 && i < (num_edges - 1)) ? edge_table.getNode(e_index + i + 1) : null;
							ei.pred = (num_edges > 1 && i > 0) ? edge_table.getNode(e_index + i - 1) : null;
							ei.next_bound = null;
							ei.bside[this.CLIP] = (op == OperationType.GPC_DIFF) ? this.RIGHT : this.LEFT;
							ei.bside[this.SUBJ] = this.LEFT;
						}
						this.insert_bound( this.bound_list(lmt_table, edge_table.getNode(min).vertex.y), e);
						e_index += num_edges;
					}
				}
				
				/* Do the contour reverse pass */
				for (min=0; min<num_vertices; min++) {
					/* If a reverse local minimum... */
					if (edge_table.REV_MIN(min)) {
						/* Search for the previous local maximum... */
						num_edges = 1;
						max = this.PREV_INDEX(min, num_vertices);
						while (edge_table.NOT_RMAX(max)) {
							num_edges++;
							max = this.PREV_INDEX(max, num_vertices);
						}
						
						/* Build the previous edge list */
						v = min;
						e = edge_table.getNode(e_index);
						e.bstate[this.BELOW] = BundleState.UNBUNDLED;
						e.bundle[this.BELOW][this.CLIP] = 0;
						e.bundle[this.BELOW][this.SUBJ] = 0;
						
						for (i=0; i<num_edges; i++) {
							ei = edge_table.getNode(e_index+i);
							ev = edge_table.getNode(v);
							
							ei.xb    = ev.vertex.x;
							ei.bot.x = ev.vertex.x;
							ei.bot.y = ev.vertex.y;
							
							v = this.PREV_INDEX(v, num_vertices);
							ev = edge_table.getNode(v);
							
							ei.top.x = ev.vertex.x;
							ei.top.y = ev.vertex.y;
							ei.dx = (ev.vertex.x - ei.bot.x) / (ei.top.y - ei.bot.y);
							ei.type = type;
							ei.outp[this.ABOVE] = null;
							ei.outp[this.BELOW] = null;
							ei.next = null;
							ei.prev = null;
							ei.succ = (num_edges > 1 && i < (num_edges - 1)) ? edge_table.getNode(e_index + i + 1) : null;
							ei.pred = (num_edges > 1 && i > 0) ? edge_table.getNode(e_index + i - 1) : null;
							ei.next_bound = null;
							ei.bside[this.CLIP] = (op == OperationType.GPC_DIFF) ? this.RIGHT : this.LEFT;
							ei.bside[this.SUBJ] = this.LEFT;
						}
						this.insert_bound(this.bound_list(lmt_table, edge_table.getNode(min).vertex.y), e);
						e_index += num_edges;
					}
				}
			}
		}
		return edge_table;
	},
	add_st_edge: function(st, it, edge, dy) {
		var den,
			existing_node,
			r, x, y;
		if (st == null) {
			/* Append edge onto the tail end of the ST */
			st = new StNode(edge, null);
		} else {
			den = (st.xt - st.xb) - (edge.xt - edge.xb);
			/* If new edge and ST edge don't cross */
			if (edge.xt >= st.xt || edge.dx == st.dx || Math.abs(den) <= this.GPC_EPSILON) {
				/* No intersection - insert edge here (before the ST edge) */
				existing_node = st;
				st = new StNode(edge, existing_node);
			} else {
				/* Compute intersection between new edge and ST edge */
				r = (edge.xb - st.xb) / den;
				x = st.xb + r * (st.xt - st.xb);
				y = r * dy;
				/* Insert the edge pointers and the intersection point in the IT */
				it.top_node = this.add_intersection(it.top_node, st.edge, edge, x, y);
				/* Head further into the ST */
				st.prev = this.add_st_edge(st.prev, it, edge, dy);
			}
		}
		return st;
	},
	add_intersection: function (it_node, edge0, edge1, x, y) {
		var existing_node;
		if (it_node == null) {
			/* Append a new node to the tail of the list */
			it_node = new ItNode(edge0, edge1, x, y, null);
		} else {
			if (it_node.point.y > y) {
				/* Insert a new node mid-list */
				existing_node = it_node;
				it_node = new ItNode(edge0, edge1, x, y, existing_node);
			} else {
				/* Head further down the list */
				it_node.next = this.add_intersection( it_node.next, edge0, edge1, x, y);
			}
		}
		return it_node;
	}
};

	
// AetTree
var AetTree = function() {
	this.top_node = null; // edge node
};

AetTree.prototype = {
	print: function() {
		//for (var edge = this.top_node; edge != null; edge = edge.next) {
		//	console.log('edge.vertex.x='+ edge.vertex.x +'  edge.vertex.y='+ edge.vertex.y);
		//}
	}
};

	
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

	
// edgeTable
var EdgeTable = function() {
	this.m_List = new ArrayList();
};

EdgeTable.prototype = {
	addNode: function(x,y) {
		var node = new EdgeNode();
		node.vertex.x = x;
		node.vertex.y = y;
		this.m_List.add(node);
	},
	getNode: function (index) {
		return this.m_List.get(index);
	},
	FWD_MIN: function(i) {
		var m_List = this.m_List,
			prev = m_List.get(Clip.PREV_INDEX(i, m_List.size())),
			next = m_List.get(Clip.NEXT_INDEX(i, m_List.size())),
			ith = m_List.get(i);
		return (prev.vertex.y >= ith.vertex.y && next.vertex.y >  ith.vertex.y);
	}	  ,
	NOT_FMAX: function(i) {
		var m_List = this.m_List,
			next = m_List.get(Clip.NEXT_INDEX(i, m_List.size())),
			ith = m_List.get(i);
		return next.vertex.y > ith.vertex.y;
	},
	REV_MIN: function(i) {
		var m_List = this.m_List,
			prev = m_List.get(Clip.PREV_INDEX(i, m_List.size())),
			next = m_List.get(Clip.NEXT_INDEX(i, m_List.size())),
			ith = m_List.get(i);
		return prev.vertex.y > ith.vertex.y && next.vertex.y >= ith.vertex.y;
	},
	NOT_RMAX: function(i) {
		var m_List = this.m_List,
			prev = m_List.get(Clip.PREV_INDEX(i, m_List.size())),
			ith = m_List.get(i);
		return prev.vertex.y > ith.vertex.y;
	}
};

	
// ItNodeTable
var ItNodeTable = function() {
	this.top_node;
}

ItNodeTable.prototype.build_intersection_table = function(aet, dy) {
	var st = null,
		edge;
	/* Process each AET edge */
	for (edge = aet.top_node; edge != null; edge = edge.next) {
		if (edge.bstate[Clip.ABOVE] == BundleState.BUNDLE_HEAD || edge.bundle[Clip.ABOVE][Clip.CLIP] != 0 || edge.bundle[Clip.ABOVE][Clip.SUBJ] != 0) {
			st = Clip.add_st_edge(st, this, edge, dy);
		}
	}
}

	
// LineHelper
var LineHelper = {
	equalPoint: function (p1, p2) {
		return p1[0] == p2[0] && p1[1] == p2[1];
	},
	equalVertex: function(s1, e1, s2, e2) {
		return (this.equalPoint(s1, s2) && this.equalPoint(e1, e2)) ||
				(this.equalPoint(s1, e2) && this.equalPoint(e1, s2));
	},
	distancePoints: function(p1, p2) {
		return Math.sqrt((p2[0] - p1[0]) * (p2[0] - p1[0]) + (p2[1] - p1[1]) * (p2[1] - p1[1]));  
	},
	clonePoint: function(p) {
		return [p[0], p[1]];
	},
	cloneLine: function(line) {
		var res  = [],
			il = line.length,
			i = 0;
		for (; i<il; i++) {
			res[i] = [line[i][0], line[i][1]];
		}
		return res;
	},
	addLineToLine: function(line1, line2) {
		var il = line2.length,
			i = 0;
		for (; i<il; i++) {
			line1.push(clonePoint(line2[i]));
		}
	},
	roundPoint: function(p) {
		p[0] = Math.round(p[0]);
		p[1] = Math.round(p[1]);
	},
	pointLineDistance: function(point, line) {
		var a = point[0] - line[0][0],
			b = point[1] - line[0][1],
			c = line[1][0] - line[0][0],
			d = line[1][1] - line[0][1],
			dot = a * c + b * d,
			len_sq = c * c + d * d,
			param = -1,
			xx,
			yy,
			dx,
			dy;

		if (len_sq != 0) param = dot / len_sq;

		if (param < 0) {
			xx = line[0][0];
			yy = line[0][1];
		} else if (param > 1) {
			xx = line[1][0];
			yy = line[1][1];
		} else {
			xx = line[0][0] + param * c;
			yy = line[0][1] + param * d;
		}
		dx = point[0] - xx;
		dy = point[1] - yy;

		return Math.sqrt(dx * dx + dy * dy);
	},
	lineIntersect: function(a, b) {
		var dn = (b[1][1] - b[0][1]) * (a[1][0] - a[0][0]) - (b[1][0] - b[0][0]) * (a[1][1] - a[0][1]),
			ua,
			ub;
		if (dn === 0) return;
		
		ua = ((b[1][0] - b[0][0]) * (a[0][1] - b[0][1]) - (b[1][1] - b[0][1]) * (a[0][0] - b[0][0])) / dn;
		ub = ((a[1][0] - a[0][0]) * (a[0][1] - b[0][1]) - (a[1][1] - a[0][1]) * (a[0][0] - b[0][0])) / dn;
		if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
			return [
				a[0][0] + ua * (a[1][0] - a[0][0]),
				a[0][1] + ua * (a[1][1] - a[0][1])
			];
		}
	},
};

	
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

	
// OperationType
var OperationType = function(type) {
	this.m_Type = type; 
};

OperationType.GPC_DIFF  = new OperationType('Difference');
OperationType.GPC_INT   = new OperationType('Intersection');
OperationType.GPC_XOR   = new OperationType('Exclusive or');
OperationType.GPC_UNION = new OperationType('Union');

	
/**
 * <code>PolyDefault</code> is a default <code>Poly</code> implementation.  
 * It provides support for both complex and simple polygons.  A <i>complex polygon</i> 
 * is a polygon that consists of more than one polygon.  A <i>simple polygon</i> is a 
 * more traditional polygon that contains of one inner polygon and is just a 
 * collection of points.
 * <p>
 * <b>Implementation Note:</b> If a point is added to an empty <code>PolyDefault</code>
 * object, it will create an inner polygon of type <code>PolySimple</code>.
 *
 * @see PolySimple
 *
 * @author  Dan Bridenbecker, Solution Engineering, Inc.
 */

var PolyDefault = function(isHole) {
	if (isHole == null) isHole = false;
	// Only applies to the first poly and can only be used with a poly that contains one poly
	this.m_IsHole = isHole;
	this.m_List = new ArrayList();
};

PolyDefault.prototype = {
	equals: function (obj) {
		// Return true if the given object is equal to this one.
		if (!(obj instanceof PolyDefault)) return false;
		var that = obj;
		if (this.m_IsHole != that.m_IsHole) return false;
		if (!equals(this.m_List, that.m_List)) return false;
		return true;
	},
	hashCode: function () {
		/**
		 * Return the hashCode of the object.
		 *
		 * @return an integer value that is the same for two objects
		 * whenever their internal representation is the same (equals() is true)
		 **/
		return 37 * 17 + this.m_List.hashCode();
	},
	clear: function() {
		// Remove all of the points.  Creates an empty polygon.
		this.m_List.clear();
	},
	add: function(arg0, arg1) {
		var args = [],
			arr,
			i, il;
		
		args[0] = arg0;
		if (arg1) args[1] = arg1;
		
		if (args.length == 2) {
			this.addPointXY(args[0], args[1]);
		} else if (args.length == 1) {
			if (args[0] instanceof Point) {
				this.addPoint(args[0]);	
			} else if (args[0] instanceof PolySimple) {
				this.addPoly(args[0]);
			} else if (args[0] instanceof Array) {
				arr = args[0];
				if (arr.length == 2 && arr[0] instanceof Number && arr[1] instanceof Number) {
					this.add(arr[0] ,arr[1] )
				} else {
					for (i=0, il=args[0].length; i<il; i++) {
						this.add(args[0][i]);
					}
				}
			}
		}
	},
	addPointXY: function(x, y) {
		/**
		 * Add a point to the first inner polygon.
		 * <p>
		 * <b>Implementation Note:</b> If a point is added to an empty PolyDefault object,
		 * it will create an inner polygon of type <code>PolySimple</code>.
		 */
		this.addPoint(new Point(x, y));
	},
	addPoint: function( p) {
		/**
		 * Add a point to the first inner polygon.
		 * <p>
		 * <b>Implementation Note:</b> If a point is added to an empty PolyDefault object,
		 * it will create an inner polygon of type <code>PolySimple</code>.
		 */
		var m_List = this.m_List;
		if (m_List.size() == 0) {
			m_List.add(new PolySimple());
		}
		m_List.get(0).addPoint(p);
	},
	addPoly: function( p) {
		/**
		 * Add an inner polygon to this polygon - assumes that adding polygon does not
		 * have any inner polygons.
		 *
		 * @throws IllegalStateException if the number of inner polygons is greater than
		 * zero and this polygon was designated a hole.  This would break the assumption
		 * that only simple polygons can be holes.
		 */
		var m_IsHole = this.m_IsHole,
			m_List = this.m_List;
		if (m_List.size() > 0 && m_IsHole) {
			throw 'ERROR : Cannot add polys to something designated as a hole.';
		}
		m_List.add(p);
	},
	isEmpty: function() {
		// Return true if the polygon is empty
		return this.m_List.isEmpty();
	},
	getBounds: function () {
		/**
		 * Returns the bounding rectangle of this polygon.
		 * <strong>WARNING</strong> Not supported on complex polygons.
		 */
		var m_List = this.m_List,
			ip;
		if (m_List.size() == 0) {
			return new Rectangle();
		} else if (m_List.size() == 1) {
			 ip = this.getInnerPoly(0);
			 return ip.getBounds();
		} else {
			 console.log('getBounds not supported on complex poly.');
		}
	},
	getInnerPoly: function(polyIndex) {
		// Returns the polygon at this index.
		return this.m_List.get(polyIndex);
	},
	getNumInnerPoly: function() {
		// Returns the number of inner polygons - inner polygons are assumed to return one here.
		return this.m_List.size();
	},
	getNumPoints: function () {
		// Return the number points of the first inner polygon
		return this.m_List.get(0).getNumPoints();
	},
	getX: function(index) {
		// Return the X value of the point at the index in the first inner polygon
		return this.m_List.get(0).getX(index);
	},
	getPoint: function(index) {
		return this.m_List.get(0).getPoint(index);
	},
	getPoints: function() {
		return this.m_List.get(0).getPoints();
	},
	isPointInside: function (point) {
		var m_List = this.m_List,
			i, il,
			poly;
		if (!m_List.get(0).isPointInside(point)) return false;
		
		for (i=0, il=m_List.size(); i<il; i++) {
			poly = m_List.get(i);
			if (poly.isHole() && poly.isPointInside(point)) return false;
		}
		return true;
	},
	getY: function (index) {
		// Return the Y value of the point at the index in the first inner polygon
		return this.m_List.get(0).getY(index) ;
	},
	isHole: function () {
		/**
		 * Return true if this polygon is a hole.  Holes are assumed to be inner polygons of
		 * a more complex polygon.
		 *
		 * @throws IllegalStateException if called on a complex polygon.
		 */
		if (this.m_List.size() > 1) {
			throw 'Cannot call on a poly made up of more than one poly.';
		}
		return this.m_IsHole;
	},
	setIsHole: function(isHole) {
		/**
		 * Set whether or not this polygon is a hole.  Cannot be called on a complex polygon.
		 *
		 * @throws IllegalStateException if called on a complex polygon.
		 */
		if (this.m_List.size() > 1) {
			throw 'Cannot call on a poly made up of more than one poly.';
		}
		this.m_IsHole = isHole;
	},
	isContributing: function( polyIndex) {
		/**
		 * Return true if the given inner polygon is contributing to the set operation.
		 * This method should NOT be used outside the Clip algorithm.
		 */
		return this.m_List.get(polyIndex).isContributing(0);
	},
	setContributing: function( polyIndex, contributes) {
		/**
		 * Set whether or not this inner polygon is constributing to the set operation.
		 * This method should NOT be used outside the Clip algorithm.
		 *
		 * @throws IllegalStateException if called on a complex polygon
		 */
		if (this.m_List.size() != 1) {
			throw 'Only applies to polys of size 1';
		}
		this.m_List.get(polyIndex).setContributing(0, contributes);
	},
	intersection: function(p) {
		/**
		 * Return a Poly that is the intersection of this polygon with the given polygon.
		 * The returned polygon could be complex.
		 *
		 * @return the returned Poly will be an instance of PolyDefault.
		 */
		return Clip.intersection(p, this, 'PolyDefault');
	},
	union: function(p) {
		/**
		 * Return a Poly that is the union of this polygon with the given polygon.
		 * The returned polygon could be complex.
		 *
		 * @return the returned Poly will be an instance of PolyDefault.
		 */
		return Clip.union(p, this, 'PolyDefault');
	},
	xor: function(p) {
		/**
		 * Return a Poly that is the exclusive-or of this polygon with the given polygon.
		 * The returned polygon could be complex.
		 *
		 * @return the returned Poly will be an instance of PolyDefault.
		 */
		return Clip.xor(p, this, 'PolyDefault' );
	},
	difference: function(p) {
		/**
		 * Return a Poly that is the difference of this polygon with the given polygon.
		 * The returned polygon could be complex.
		 *
		 * @return the returned Poly will be an instance of PolyDefault.
		 */
		return Clip.difference(p,this, 'PolyDefault');
	},
	getArea: function() {
		// Return the area of the polygon in square units.
		var area = 0.0,
			il = this.getNumInnerPoly(),
			i = 0,
			p,
			tarea;
		for (; i<il; i++) {
			p = this.getInnerPoly(i);
			tarea = p.getArea() * (p.isHole() ? -1.0 : 1.0);
			area += tarea;
		}
		return area;
	},
	toString: function() {
		// package methods
		var res = '',
			points,
			m_List = this.m_List,
			il = m_List.size(),
			i = 0,
			p,
			j, jl;
		for (; i<il; i++) {
			p = this.getInnerPoly(i);
			res += 'InnerPoly('+ i +').hole='+ p.isHole();
			points = [];
			for (j=0, jl=p.getNumPoints(); j<jl; j++) {
				points.push(new Point(p.getX(j), p.getY(j)));
			}
			points = ArrayHelper.sortPointsClockwise(points);
			for (j=0, jl=points.length; j<jl; j++) {
				res += points[j].toString();
			}
		}
		return res;
	}
};

	
// Polygon
var Polygon = function() {
	this.maxTop;
	this.maxBottom;
	this.maxLeft;
	this.maxRight;
	this.vertices;
};

Polygon.prototype = {
	fromArray: function(v) {
		var pointArr,
			i = 0,
			il = v.length;
		this.vertices = [];
		for (; i<il; i++) {
			pointArr = v[i];
			this.vertices.push(new Point(pointArr[0],pointArr[1]));
		}
	},
	normalize: function() {
		// Normalize vertices in polygon to be ordered clockwise from most left point
		var maxLeftIndex,
			vertices = this.vertices,
			newVertices = this.vertices,
			il = vertices.length,
			i = 0,
			vertex,
			j, k, kl,
			reverse = false;
		
		for (; i<il; i++) {
			vertex = vertices[i];
			if (maxTop == null || maxTop.y > vertex.y || (maxTop.y == vertex.y && vertex.x < maxTop.x)) maxTop = vertex;	
			if (maxBottom == null || maxBottom.y < vertex.y || (maxBottom.y == vertex.y && vertex.x > maxBottom.x)) maxBottom = vertex;	
			if (maxRight == null || maxRight.x < vertex.x || (maxRight.x == vertex.x && vertex.y < maxRight.y)) maxRight = vertex;
			if (maxLeft == null || maxLeft.x > vertex.x || (maxLeft.x == vertex.x && vertex.y > maxLeft.y)) {
				maxLeft = vertex;
				maxLeftIndex = i;	
			} 
		}
		if (maxLeftIndex > 0) {
			newVertices = [];
			j = 0;
			for (i=maxLeftIndex, il=vertices.length; i<il; i++) {
				newVertices[j++] = this.vertices[i];
			}
			for (i=0; i<maxLeftIndex; i++) {
				newVertices[j++] = this.vertices[i];
			}
			vertices = newVertices;
		}
		for (k=0, kl=this.vertices.length; k<kl; k++) {
			vertex = this.vertices[k];
			if (equals(vertex, maxBottom)) {
				reverse = true;
				break;
			} else if (equals(vertex, maxTop)) {
				break;
			} 
		}
		if (reverse) {
			newVertices = [];
			newVertices[0] = vertices[0];
			j = 1;
			for (i=vertices.length-1; i>0; i--) {
				newVertices[j++] = this.vertices[i];
			}
			vertices = newVertices;
		}
	},
	getVertexIndex: function(vertex) {
		for (var i=0, il=this.vertices.length; i<il; i++) {
			if (equals(vertices[i], vertex)) return i;
		}
		return -1;
	},
	insertVertex: function(vertex1, vertex2, newVertex) {
		var vertex1Index = getVertexIndex(vertex1),
			vertex2Index = getVertexIndex(vertex2),
			newVertices,
			i, il;
		if (vertex1Index == -1 || vertex2Index == -1) return false;
		
		if (vertex2Index < vertex1Index) {
			i = vertex1Index;
			vertex1Index = vertex2Index;
			vertex2Index = i;
		}
		if (vertex2Index == vertex1Index + 1) {
			newVertices = [];
			for (i=0; i<=vertex1Index; i++) {
				newVertices[i] = this.vertices[i];
			}
			newVertices[vertex2Index] = newVertex;
			for (i=vertex2Index, il=this.vertices.length; i<il; i++) {
				newVertices[i+1] = this.vertices[i];
			}
			this.vertices = newVertices;
		} else if (vertex2Index == vertices.length - 1 && vertex1Index == 0) {
			this.vertices.push(newVertex);
		}
		return true;
	},
	clone: function() {
		var res = new Polygon();
		res.vertices = vertices.slice(this.vertices.length-1);
		return res;
	},
	toString: function() {
		var vertices = this.vertices,
			res = '[',
			il = vertices.length,
			i = 0,
			vertex;
		for (; i<il; i++) {
			vertex = vertices[i];
			res += (i > 0 ? ',' : '') +'['+ vertex.x +','+ vertex.y +']';
		}
		res += ']';
		return res;
	}
};

	
// PolygonNode
var PolygonNode = function(next, x, y) {
	var vn = new VertexNode(x, y);
	this.v = [];             // Left and right vertex list ptrs
	this.v[Clip.LEFT] = vn;  // Make v[Clip.LEFT] point to new vertex
	this.v[Clip.RIGHT] = vn; // Make v[Clip.RIGHT] point to new vertex
	this.next = next;        // Pointer to next polygon contour
	this.proxy = this;       // Pointer to actual structure used
	this.active = 1;
	this.hole;    		     // Hole / external contour flag
};

PolygonNode.prototype = {
	add_right: function(x, y) {
		var nv = new VertexNode(x, y);
		this.proxy.v[Clip.RIGHT].next = nv; // Add vertex nv to the right end of the polygon's vertex list
		this.proxy.v[Clip.RIGHT] = nv;      // Update proxy->v[Clip.RIGHT] to point to nv
	},
	add_left: function( x, y) {
		var proxy = this.proxy,
			nv = new VertexNode(x, y);
		nv.next = proxy.v[Clip.LEFT]; // Add vertex nv to the left end of the polygon's vertex list
		proxy.v[Clip.LEFT] = nv;      // Update proxy->[Clip.LEFT] to point to nv
	}
};

	 
/**
 * <code>PolySimple</code> is a simple polygon - contains only one inner polygon.
 * <p>
 * <strong>WARNING:</strong> This type of <code>Poly</code> cannot be used for an
 * inner polygon that is a hole.
 *
 * @author  Dan Bridenbecker, Solution Engineering, Inc.
 */
var PolySimple = function() {
	this.m_List = new ArrayList(); // The list of Point objects in the polygon.
	this.m_Contributes = true;     // Flag used by the Clip algorithm
};
   
/**
* Return true if the given object is equal to this one.
* <p>
* <strong>WARNING:</strong> This method failse if the first point
* appears more than once in the list.
*/
PolySimple.prototype = {
	equals: function(obj) {
		if (!(obj instanceof PolySimple)) return false;

		var that = obj,
			this_num = this.m_List.size(),
			that_num = that.m_List.size(),
			this_x,
			this_y,
			this_index,
			that_x,
			that_y,
			that_index,
			that_first_index;

		if (this_num != that_num) return false;

		// WARNING: This is not the greatest algorithm.  It fails if
		// the first point in "this" poly appears more than once.
		if (this_num > 0) {
			this_x = this.getX(0);
			this_y = this.getY(0);
			that_first_index = -1;
			for (that_index = 0; (that_first_index == -1) && (that_index < that_num) ; that_index++ ) {
				that_x = that.getX(that_index);
				that_y = that.getY(that_index);
				if (this_x == that_x && this_y == that_y) {
					that_first_index = that_index;
				}
			}
			if (that_first_index == -1) return false;
			that_index = that_first_index;
			for (this_index= 0; this_index < this_num; this_index++) {
				this_x = this.getX(this_index);
				this_y = this.getY(this_index);
				that_x = that.getX(that_index);
				that_y = that.getY(that_index);

				if (this_x != that_x || this_y != that_y) return false;

				that_index++ ;
				if (that_index >= that_num) {
					that_index = 0;
				}
			}
		}
		return true;
	},
	/**
	 * Return the hashCode of the object.
	 * <p>
	 * <strong>WARNING:</strong>Hash and Equals break contract.
	 *
	 * @return an integer value that is the same for two objects
	 * whenever their internal representation is the same (equals() is true)
	 */
	hashCode: function() {
		var result = 17;
		result = 37 * result + this.m_List.hashCode();
		return result;
	},
	toString: function() {
		// Return a string briefly describing the polygon.
		return 'PolySimple: num_points='+ getNumPoints();
	},
	clear: function() {
		// Remove all of the points.  Creates an empty polygon.
		this.m_List.clear();
	},
	add: function(arg0,arg1) {
		var args = [],
			val,
			k, kl;
		args[0] = arg0;
		if (arg1) args[1] = arg1;
		
		if (args.length == 2) {
			this.addPointXY(args[0], args[1]);
		} else if (args.length == 1) {
			if (args[0] instanceof Point) this.addPoint(args[0]);
			else if (args[0] instanceof Poly) this.addPoly(args[0]);
			else if (args[0] instanceof Array) {
				for (k=0, kl=args[0].length; k<kl; k++) {
					val = args[0][k];
					this.add(val);
				}
			}
		}
	},
	addPointXY: function(x, y) {
		// Add a point to the first inner polygon.
		this.addPoint(new Point(x, y));
	},
	addPoint: function(p) {
		// Add a point to the first inner polygon.
		this.m_List.add(p);
	},
	addPoly: function(p) {
		// Throws IllegalStateexception if called
		throw 'Cannot add poly to a simple poly.';
	},
	isEmpty: function() {
		// Return true if the polygon is empty
		return this.m_List.isEmpty();
	},
	getBounds: function() {
		// Returns the bounding rectangle of this polygon.
		var xmin =  Number.MAX_VALUE,
			ymin =  Number.MAX_VALUE,
			xmax = -Number.MAX_VALUE,
			ymax = -Number.MAX_VALUE,
			il = this.m_List.size(),
			i = 0,
			x, y, u;
		for (; i<il; i++ ) {
			x = this.getX(i);
			y = this.getY(i);
			if (x < xmin) xmin = x;
			if (x > xmax) xmax = x;
			if (y < ymin) ymin = y;
			if (y > ymax) ymax = y;
		}
		return new Rectangle(xmin, ymin, (xmax-xmin), (ymax-ymin));
	},
	getInnerPoly: function(polyIndex) {
		// Returns <code>this</code> if <code>polyIndex = 0</code>, else it throws IllegalStateException.
		if (polyIndex != 0) alert('PolySimple only has one poly');
		return this;
	},
	getNumInnerPoly: function() {
		// Always returns 1.
		return 1;
	},
	getNumPoints: function() {
		// Return the number points of the first inner polygon
		return this.m_List.size();
	},
	getX: function(index) {
		// Return the X value of the point at the index in the first inner polygon
		return this.m_List.get(index).x;
	},
	getY: function(index) {
		// Return the Y value of the point at the index in the first inner polygon
		return this.m_List.get(index).y;
	},
	getPoint: function(index) {
		return this.m_List.get(index);
	},
	getPoints: function() {
		return this.m_List.toArray();
	},
	isPointInside: function(point) {
		var points  = this.getPoints(),
		 	j = points.length - 1,
		 	oddNodes = false,
		 	il = points.length,
		 	i = 0;
													 
		for (; i<il; i++) {
			 if (points[i].y < point.y && points[j].y >= point.y || points[j].y < point.y && points[i].y >= point.y) {
				if (points[i].x + (point.y - points[i].y) / (points[j].y - points[i].y) * (points[j].x - points[i].x) < point.x) {
					oddNodes = !oddNodes; 
				}
			}
			j = i;
		}      
		return oddNodes;
	},
	isHole: function() {
		// Always returns false since PolySimples cannot be holes.
		return false ;
	},
	setIsHole: function(isHole) {
		// Throws IllegalStateException if called.
		throw 'PolySimple cannot be a hole';
	},
	isContributing: function(polyIndex) {
		/**
		 * Return true if the given inner polygon is contributing to the set operation.
		 * This method should NOT be used outside the Clip algorithm.
		 *
		 * @throws IllegalStateException if <code>polyIndex != 0</code>
		 */
		if (polyIndex != 0) {
			throw 'PolySimple only has one poly';
		}
		return this.m_Contributes;
	},
	setContributing: function(polyIndex, contributes) {
		/**
		 * Set whether or not this inner polygon is constributing to the set operation.
		 * This method should NOT be used outside the Clip algorithm.
		 *
		 * @throws IllegalStateException if <code>polyIndex != 0</code>
		 */
		if (polyIndex != 0) {
			throw "PolySimple only has one poly";
		}
		this.m_Contributes = contributes ;
	},
	intersection: function(p) {
		/**
		 * Return a Poly that is the intersection of this polygon with the given polygon.
		 * The returned polygon is simple.
		 *
		 * @return The returned Poly is of type PolySimple
		 */
		return Clip.intersection( this, p, 'PolySimple');
	},
	union: function(p) {
		/**
		 * Return a Poly that is the union of this polygon with the given polygon.
		 * The returned polygon is simple.
		 *
		 * @return The returned Poly is of type PolySimple
		 */
		return Clip.union( this, p, 'PolySimple');
	},
	xor: function(p) {
		/**
		 * Return a Poly that is the exclusive-or of this polygon with the given polygon.
		 * The returned polygon is simple.
		 *
		 * @return The returned Poly is of type PolySimple
		 */
		return Clip.xor( p, this, 'PolySimple');
	},
	difference: function(p) {
		/**
		 * Return a Poly that is the difference of this polygon with the given polygon.
		 * The returned polygon could be complex.
		 *
		 * @return the returned Poly will be an instance of PolyDefault.
		 */
		return Clip.difference(p, this, 'PolySimple');
	},
	getArea: function() {
		/**
		 * Returns the area of the polygon.
		 * <p>
		 * The algorithm for the area of a complex polygon was take from
		 * code by Joseph O'Rourke author of " Computational Geometry in C".
		 */
		var ax, ay,
			bx, by,
			cx, cy,
			area = 0.0,
			tarea,
			i, il;
		if (this.getNumPoints() < 3) {
			return 0.0;
		}
		ax = this.getX(0);
		ay = this.getY(0);

		for (i=1, il=this.getNumPoints()-1; i<il ; i++ ) {
			bx = this.getX(i);
			by = this.getY(i);
			cx = this.getX(i+1);
			cy = this.getY(i+1);
			tarea = ((cx - bx)*(ay - by)) - ((ax - bx)*(cy - by));
			area += tarea;
		}
		area = 0.5 * Math.abs(area);
		return area;
	}
};

	
// TopPolygonNode
var TopPolygonNode = function() {
	this.top_node;
};

TopPolygonNode.prototype = {
	add_local_min: function(x, y) {
		 var existing_min = this.top_node;
		 this.top_node = new PolygonNode(existing_min, x, y);
		 return this.top_node ;
	},
	merge_left: function(p, q) {
		var top_node = this.top_node,
			target,
			node;
		
		// Label contour as a hole
		q.proxy.hole = true;

		if (p.proxy != q.proxy) {
			// Assign p's vertex list to the left end of q's list
			p.proxy.v[Clip.RIGHT].next = q.proxy.v[Clip.LEFT];
			q.proxy.v[Clip.LEFT] = p.proxy.v[Clip.LEFT];
			
			// Redirect any p.proxy references to q.proxy
			target = p.proxy;
			for (node = top_node; node != null; node=node.next) {
				if (node.proxy == target) {
					node.active = 0;
					node.proxy = q.proxy;
				}
			}
		}
	},
	merge_right: function(p, q) {
		var top_node = this.top_node,
			target,
			node;

		// Label contour as external
		q.proxy.hole = false ;
		
		if (p.proxy != q.proxy) {
			// Assign p's vertex list to the right end of q's list
			q.proxy.v[Clip.RIGHT].next = p.proxy.v[Clip.LEFT];
			q.proxy.v[Clip.RIGHT] = p.proxy.v[Clip.RIGHT];
			
			// Redirect any p->proxy references to q->proxy
			target = p.proxy;
			for (node=top_node; node != null; node = node.next) {
				if (node.proxy == target) {
					node.active = 0;
					node.proxy= q.proxy;
				}
			}
		}
	},
	count_contours: function() {
		var nc = 0,
			nv,
			polygon = this.top_node,
			v;
		for (; polygon != null; polygon = polygon.next) {
			if (polygon.active != 0) {
				// Count the vertices in the current contour
				nv = 0;
				v = polygon.proxy.v[Clip.LEFT];
				for (; v != null; v=v.next) {
					nv++;
				}
				// Record valid vertex counts in the active field
				if (nv > 2) {
					polygon.active = nv;
					nc++;
				} else {
					polygon.active = 0;
				}
			}
		}	
		return nc;
	},
	getResult: function(polyClass) {
		var top_node = this.top_node,
			result = Clip.createNewPoly(polyClass),
			num_contours = this.count_contours(),
			npoly_node,
			poly_node,
			poly,
			c, i, il,
			vtx,
			orig,
			inner;

		if (num_contours > 0) {
			c = 0;
			npoly_node = null;
			for (poly_node=top_node; poly_node != null; poly_node=npoly_node) {
			   npoly_node = poly_node.next;
			   if (poly_node.active != 0) {
					poly = result;
					if (num_contours > 1) {
						poly = Clip.createNewPoly(polyClass);
					}
					if (poly_node.proxy.hole) {
						poly.setIsHole(poly_node.proxy.hole);
					}
					// This algorithm puts the verticies into the poly in reverse order
					for (vtx=poly_node.proxy.v[Clip.LEFT]; vtx != null ; vtx=vtx.next) {
						poly.add(vtx.x, vtx.y);
					}
					if (num_contours > 1) {
						result.addPoly(poly);
					}
					c++;
				}
			}
			// Sort holes to the end of the list
			orig = result;
			result = Clip.createNewPoly(polyClass);
			for (i=0, il=orig.getNumInnerPoly(); i<il; i++) {
				inner = orig.getInnerPoly(i);
				if (!inner.isHole()) result.addPoly(inner);
			}
			for (i= 0, il=orig.getNumInnerPoly(); i<il; i++) {
				inner = orig.getInnerPoly(i);
				if (inner.isHole()) result.addPoly(inner);
			}
		}
		return result;
	},
	print: function() {
		var top_node = this.top_node,
			c = 0,
			npoly_node = null,
			poly_node,
			v,
			vtx;
		for (poly_node=top_node; poly_node != null; poly_node=npoly_node) {
			npoly_node = poly_node.next;
			if (poly_node.active != 0) {
				v = 0;
				c++;
			}
		}
	}
};
	
// ScanBeamTree
var ScanBeamTree = function(yvalue) {
	this.y = yvalue;  // Scanbeam node y value
	this.less;        // Pointer to nodes with lower y
	this.more;        // Pointer to nodes with higher y
};

// ScanBeamTreeEntries
var ScanBeamTreeEntries = function() {
	this.sbt_entries = 0;
	this.sb_tree;
};

ScanBeamTreeEntries.prototype = {
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


	var polyop = {
		pointLineDistance : LineHelper.pointLineDistance,
		lineIntersect     : LineHelper.lineIntersect,
		distancePoints    : LineHelper.distancePoints,
		isPointInPolygon  : isPointInPolygon,
		getArea: function(vx) {
			var segm = createSegment(vx);
			return segm.getArea();
		},
		clip: function(operation, vx1, vx2) {
			var segm1 = createSegment(vx1),
				segm2 = createSegment(vx2),
				diff = segm1[operation](segm2),
				num = diff.getNumInnerPoly(),
				n = 0,
				innerPoly,
				ret = [];
			for (; n<num; n++) {
				innerPoly = diff.getInnerPoly(n);
				
				ret.push({
					vertices: getVertices(innerPoly),
					isHole: innerPoly.isHole()
				});
			}
			return ret;
		}
	};

	window.polyop = polyop;

})();
