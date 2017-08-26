
//////////



///////////  LmtNode //////////////////////////

GEOMETRY.LmtNode = function(yvalue) {
	this.y = yvalue;   /* Y coordinate at local minimum     */
	this.first_bound;  /* Pointer to bound list             */
	this.next;         /* Pointer to next local minimum     */
};

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

/////////////   OperationType //////////////////////////////////
GEOMETRY.OperationType = function(type) {
	this.m_Type = type; 
}
GEOMETRY.OperationType.GPC_DIFF  = new GEOMETRY.OperationType( 'Difference' );
GEOMETRY.OperationType.GPC_INT   = new GEOMETRY.OperationType( 'Intersection' );
GEOMETRY.OperationType.GPC_XOR   = new GEOMETRY.OperationType( 'Exclusive or' );
GEOMETRY.OperationType.GPC_UNION = new GEOMETRY.OperationType( 'Union' );

//////////// Poly  /////////////////////
// ---> an interface


/////////////// PolyDefault  /////////////////////
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
GEOMETRY.PolyDefault = function(isHole) {
	if (isHole == null) isHole = false;
	/**
	* Only applies to the first poly and can only be used with a poly that contains one poly
	*/
	this.m_IsHole = isHole;
	this.m_List = new ArrayList();
}

/**
 * Return true if the given object is equal to this one.
 */
GEOMETRY.PolyDefault.prototype.equals = function (obj) {
	if (!(obj instanceof PolyDefault)) return false;
	var that = obj;
	if (this.m_IsHole != that.m_IsHole) return false;
	if (!equals(this.m_List, that.m_List)) return false;
	return true ;
}

/**
 * Return the hashCode of the object.
 *
 * @return an integer value that is the same for two objects
 * whenever their internal representation is the same (equals() is true)
 **/
GEOMETRY.PolyDefault.prototype.hashCode = function () {
	var m_List = this.m_List;
	
	var result= 17;
	result = 37*result + m_List.hashCode();
	return result;
}

/**
 * Remove all of the points.  Creates an empty polygon.
 */
GEOMETRY.PolyDefault.prototype.clear = function() {
	this.m_List.clear();
}

GEOMETRY.PolyDefault.prototype.add = function(arg0, arg1) {
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
		} else if (args[0] instanceof GEOMETRY.PolySimple) {
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
}

/**
 * Add a point to the first inner polygon.
 * <p>
 * <b>Implementation Note:</b> If a point is added to an empty PolyDefault object,
 * it will create an inner polygon of type <code>PolySimple</code>.
 */
GEOMETRY.PolyDefault.prototype.addPointXY = function(x, y) {
	this.addPoint(new Point(x, y));
}

/**
 * Add a point to the first inner polygon.
 * <p>
 * <b>Implementation Note:</b> If a point is added to an empty PolyDefault object,
 * it will create an inner polygon of type <code>PolySimple</code>.
 */
GEOMETRY.PolyDefault.prototype.addPoint = function( p) {
	var m_List = this.m_List;
	if (m_List.size() == 0) {
		m_List.add(new PolySimple());
	}
	m_List.get(0).addPoint(p);
}

/**
 * Add an inner polygon to this polygon - assumes that adding polygon does not
 * have any inner polygons.
 *
 * @throws IllegalStateException if the number of inner polygons is greater than
 * zero and this polygon was designated a hole.  This would break the assumption
 * that only simple polygons can be holes.
 */
GEOMETRY.PolyDefault.prototype.addPoly = function( p) {
	var m_IsHole = this.m_IsHole,
		m_List = this.m_List;
	if (m_List.size() > 0 && m_IsHole) {
		throw 'ERROR : Cannot add polys to something designated as a hole.';
	}
	m_List.add(p);
}

/**
 * Return true if the polygon is empty
 */
GEOMETRY.PolyDefault.prototype.isEmpty = function() {
	return this.m_List.isEmpty();
}

/**
 * Returns the bounding rectangle of this polygon.
 * <strong>WARNING</strong> Not supported on complex polygons.
 */
GEOMETRY.PolyDefault.prototype.getBounds = function () {
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
}

/**
 * Returns the polygon at this index.
 */
GEOMETRY.PolyDefault.prototype.getInnerPoly = function(polyIndex) {
	return this.m_List.get(polyIndex);
}

/**
 * Returns the number of inner polygons - inner polygons are assumed to return one here.
 */
GEOMETRY.PolyDefault.prototype.getNumInnerPoly = function() {
	return this.m_List.size();
}

/**
 * Return the number points of the first inner polygon
 */
GEOMETRY.PolyDefault.prototype.getNumPoints = function () {
	return this.m_List.get(0).getNumPoints();
}

/**
 * Return the X value of the point at the index in the first inner polygon
 */
GEOMETRY.PolyDefault.prototype.getX = function(index) {
	  return this.m_List.get(0).getX(index);
}

GEOMETRY.PolyDefault.prototype.getPoint = function(index) {
	return this.m_List.get(0).getPoint(index);
}

GEOMETRY.PolyDefault.prototype.getPoints = function() {
	return this.m_List.get(0).getPoints();
}

GEOMETRY.PolyDefault.prototype.isPointInside = function (point) {
	var m_List = this.m_List,
		i, il,
		poly;
	if (!m_List.get(0).isPointInside(point)) return false;
	
	for (i=0, il=m_List.size(); i<il; i++) {
		poly = m_List.get(i);
		if (poly.isHole() && poly.isPointInside(point)) return false;
	}
	return true;
}

/**
 * Return the Y value of the point at the index in the first inner polygon
 */
GEOMETRY.PolyDefault.prototype.getY = function (index) {
	return this.m_List.get(0).getY(index) ;
}

/**
 * Return true if this polygon is a hole.  Holes are assumed to be inner polygons of
 * a more complex polygon.
 *
 * @throws IllegalStateException if called on a complex polygon.
 */
GEOMETRY.PolyDefault.prototype.isHole = function () {
	if (this.m_List.size() > 1) {
		throw 'Cannot call on a poly made up of more than one poly.';
	}
	return this.m_IsHole;
}
   
/**
 * Set whether or not this polygon is a hole.  Cannot be called on a complex polygon.
 *
 * @throws IllegalStateException if called on a complex polygon.
 */
GEOMETRY.PolyDefault.prototype.setIsHole = function(isHole) {
	if (this.m_List.size() > 1) {
		throw 'Cannot call on a poly made up of more than one poly.';
	}
	this.m_IsHole = isHole;
}

/**
 * Return true if the given inner polygon is contributing to the set operation.
 * This method should NOT be used outside the Clip algorithm.
 */
GEOMETRY.PolyDefault.prototype.isContributing = function( polyIndex) {
	return this.m_List.get(polyIndex).isContributing(0);
}

/**
 * Set whether or not this inner polygon is constributing to the set operation.
 * This method should NOT be used outside the Clip algorithm.
 *
 * @throws IllegalStateException if called on a complex polygon
 */
GEOMETRY.PolyDefault.prototype.setContributing = function( polyIndex, contributes) {
	if (this.m_List.size() != 1) {
		throw 'Only applies to polys of size 1';
	}
	this.m_List.get(polyIndex).setContributing(0, contributes);
}

/**
 * Return a Poly that is the intersection of this polygon with the given polygon.
 * The returned polygon could be complex.
 *
 * @return the returned Poly will be an instance of PolyDefault.
 */
GEOMETRY.PolyDefault.prototype.intersection = function(p) {
	return Clip.intersection(p, this, 'PolyDefault');
}

/**
 * Return a Poly that is the union of this polygon with the given polygon.
 * The returned polygon could be complex.
 *
 * @return the returned Poly will be an instance of PolyDefault.
 */
GEOMETRY.PolyDefault.prototype.union = function(p) {
	return Clip.union( p, this, 'PolyDefault');
}

/**
 * Return a Poly that is the exclusive-or of this polygon with the given polygon.
 * The returned polygon could be complex.
 *
 * @return the returned Poly will be an instance of PolyDefault.
 */
GEOMETRY.PolyDefault.prototype.xor = function(p) {
	return Clip.xor( p, this, 'PolyDefault' );
}

/**
 * Return a Poly that is the difference of this polygon with the given polygon.
 * The returned polygon could be complex.
 *
 * @return the returned Poly will be an instance of PolyDefault.
 */
GEOMETRY.PolyDefault.prototype.difference = function(p) {
	return Clip.difference(p,this, 'PolyDefault');
}

/**
 * Return the area of the polygon in square units.
 */
GEOMETRY.PolyDefault.prototype.getArea = function() {
	var area = 0.0,
		il = getNumInnerPoly(),
		i = 0,
		p,
		tarea;
	for (; i<il; i++) {
		p = getInnerPoly(i);
		tarea = p.getArea() * (p.isHole() ? -1.0 : 1.0);
		area += tarea;
	}
	return area;
}

// -----------------------
// --- Package Methods ---
// -----------------------
GEOMETRY.PolyDefault.prototype.toString = function() {
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
   
///////////////  Polygon   /////////////////////////////////
GEOMETRY.Polygon = function() {
	this.maxTop;
	this.maxBottom;
	this.maxLeft;
	this.maxRight;
	this.vertices;
};

GEOMETRY.Polygon.prototype.fromArray = function(v) {
	var pointArr,
		i = 0,
		il = v.length;
	this.vertices = [];
	for (; i<il; i++) {
		pointArr = v[i];
		this.vertices.push(new Point(pointArr[0],pointArr[1]));
	}
}

/*Normalize vertices in polygon to be ordered clockwise from most left point*/
GEOMETRY.Polygon.prototype.normalize = function() {
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
}

GEOMETRY.Polygon.prototype.getVertexIndex = function(vertex) {
	var il = this.vertices.length,
		i = 0;
	for (; i<il; i++) {
		if (equals(vertices[i], vertex)) return i;
	}
	return -1;
}

GEOMETRY.Polygon.prototype.insertVertex = function(vertex1, vertex2, newVertex) {
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
}

GEOMETRY.Polygon.prototype.clone = function() {
	var res = new Polygon();
	res.vertices = vertices.slice(this.vertices.length-1);
	return res;
}

GEOMETRY.Polygon.prototype.toString = function() {
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


////////////////////  PolygonNode ///////////////////////////
GEOMETRY.PolygonNode = function(next, x, y) {
	var vn;

	this.active;  /* Active flag / vertex count        */
	this.hole;    /* Hole / external contour flag      */
	this.v = [];  /* Left and right vertex list ptrs   */
	this.next;    /* Pointer to next polygon contour   */
	this.proxy;   /* Pointer to actual structure used  */
	
	/* Make v[Clip.LEFT] and v[Clip.RIGHT] point to new vertex */
	vn = new VertexNode(x, y);
	this.v[Clip.LEFT ] = vn;
	this.v[Clip.RIGHT] = vn;
	this.next = next;
	this.proxy = this; /* Initialise proxy to point to p itself */
	this.active = 1;
}

GEOMETRY.PolygonNode.prototype.add_right = function(x, y) {
	var nv = new VertexNode(x, y);

	/* Add vertex nv to the right end of the polygon's vertex list */
	this.proxy.v[Clip.RIGHT].next = nv;

	/* Update proxy->v[Clip.RIGHT] to point to nv */
	this.proxy.v[Clip.RIGHT] = nv;
}

GEOMETRY.PolygonNode.prototype.add_left = function( x, y) {
	var proxy = this.proxy,
		nv = new VertexNode(x, y);

	/* Add vertex nv to the left end of the polygon's vertex list */
	nv.next = proxy.v[Clip.LEFT];

	/* Update proxy->[Clip.LEFT] to point to nv */
	proxy.v[Clip.LEFT] = nv;
}  
  
 
//////////////////   PolySimple ////////////////

/**
 * <code>PolySimple</code> is a simple polygon - contains only one inner polygon.
 * <p>
 * <strong>WARNING:</strong> This type of <code>Poly</code> cannot be used for an
 * inner polygon that is a hole.
 *
 * @author  Dan Bridenbecker, Solution Engineering, Inc.
 */
GEOMETRY.PolySimple = function() {
	/**
	* The list of Point objects in the polygon.
	*/
   this.m_List= new ArrayList();

   /** Flag used by the Clip algorithm */
   this.m_Contributes= true ;
};
   
   /**
	* Return true if the given object is equal to this one.
	* <p>
	* <strong>WARNING:</strong> This method failse if the first point
	* appears more than once in the list.
	*/
GEOMETRY.PolySimple.prototype.equals = function(obj) {
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


	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// !!! WARNING: This is not the greatest algorithm.  It fails if !!!
	// !!! the first point in "this" poly appears more than once.    !!!
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
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
}

/**
 * Return the hashCode of the object.
 * <p>
 * <strong>WARNING:</strong>Hash and Equals break contract.
 *
 * @return an integer value that is the same for two objects
 * whenever their internal representation is the same (equals() is true)
 */
GEOMETRY.PolySimple.prototype.hashCode = function() {
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// !!! WARNING:  This hash and equals break the contract. !!!
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	var result = 17;
	result = 37 * result + this.m_List.hashCode();
	return result;
}

/**
 * Return a string briefly describing the polygon.
 */
GEOMETRY.PolySimple.prototype.toString = function() {
	return 'PolySimple: num_points='+ getNumPoints();
}


// --------------------
// --- Poly Methods ---
// --------------------
/**
 * Remove all of the points.  Creates an empty polygon.
 */
GEOMETRY.PolySimple.prototype.clear = function() {
	this.m_List.clear();
}
   
   
GEOMETRY.PolySimple.prototype.add = function(arg0,arg1) {
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
}


/**
 * Add a point to the first inner polygon.
 */
GEOMETRY.PolySimple.prototype.addPointXY = function(x, y) {
	this.addPoint(new Point(x, y));
}
   
/**
 * Add a point to the first inner polygon.
 */
GEOMETRY.PolySimple.prototype.addPoint = function(p) {
	this.m_List.add(p);
}
   
/**
 * Throws IllegalStateexception if called
 */
GEOMETRY.PolySimple.prototype.addPoly = function(p) {
	throw 'Cannot add poly to a simple poly.';
}
   
/**
 * Return true if the polygon is empty
 */
GEOMETRY.PolySimple.prototype.isEmpty = function() {
	return this.m_List.isEmpty();
}
   
/**
 * Returns the bounding rectangle of this polygon.
 */
GEOMETRY.PolySimple.prototype.getBounds = function() {
	var xmin =  Number.MAX_VALUE,
		ymin =  Number.MAX_VALUE,
		xmax = -Number.MAX_VALUE,
		ymax = -Number.MAX_VALUE,
		il = this.m_List.size(),
		i = 0,
		x, u;
	for (; i<il; i++ ) {
		x = this.getX(i);
		y = this.getY(i);
		if (x < xmin) xmin = x;
		if (x > xmax) xmax = x;
		if (y < ymin) ymin = y;
		if (y > ymax) ymax = y;
	}
	return new Rectangle(xmin, ymin, (xmax-xmin), (ymax-ymin));
}

/**
 * Returns <code>this</code> if <code>polyIndex = 0</code>, else it throws
 * IllegalStateException.
 */
GEOMETRY.PolySimple.prototype.getInnerPoly = function(polyIndex) {
	if (polyIndex != 0) alert('PolySimple only has one poly');
	return this;
}

/**
 * Always returns 1.
 */
GEOMETRY.PolySimple.prototype.getNumInnerPoly = function() {
	return 1;
}

/**
 * Return the number points of the first inner polygon
 */
GEOMETRY.PolySimple.prototype.getNumPoints = function() {
	return this.m_List.size();
}   

/**
 * Return the X value of the point at the index in the first inner polygon
 */
GEOMETRY.PolySimple.prototype.getX = function(index) {
	return this.m_List.get(index).x;
}

/**
 * Return the Y value of the point at the index in the first inner polygon
 */
GEOMETRY.PolySimple.prototype.getY = function(index) {
	return this.m_List.get(index).y;
}
   
GEOMETRY.PolySimple.prototype.getPoint = function(index) {
	return this.m_List.get(index);
}
   
GEOMETRY.PolySimple.prototype.getPoints = function() {
	return this.m_List.toArray();
}
   
GEOMETRY.PolySimple.prototype.isPointInside = function(point) {
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
}          

/**
 * Always returns false since PolySimples cannot be holes.
 */
GEOMETRY.PolySimple.prototype.isHole = function() {
	  return false ;
}

/**
 * Throws IllegalStateException if called.
 */
GEOMETRY.PolySimple.prototype.setIsHole = function(isHole) {
	throw 'PolySimple cannot be a hole';
}
   
/**
 * Return true if the given inner polygon is contributing to the set operation.
 * This method should NOT be used outside the Clip algorithm.
 *
 * @throws IllegalStateException if <code>polyIndex != 0</code>
 */
GEOMETRY.PolySimple.prototype.isContributing = function(polyIndex) {
	if (polyIndex != 0) {
		throw 'PolySimple only has one poly';
	}
	return this.m_Contributes ;
}
   
/**
 * Set whether or not this inner polygon is constributing to the set operation.
 * This method should NOT be used outside the Clip algorithm.
 *
 * @throws IllegalStateException if <code>polyIndex != 0</code>
 */
GEOMETRY.PolySimple.prototype.setContributing = function( polyIndex, contributes) {
	if (polyIndex != 0) {
		throw "PolySimple only has one poly";
	}
	this.m_Contributes = contributes ;
}
   
/**
 * Return a Poly that is the intersection of this polygon with the given polygon.
 * The returned polygon is simple.
 *
 * @return The returned Poly is of type PolySimple
 */
GEOMETRY.PolySimple.prototype.intersection = function(p) {
	return Clip.intersection( this, p, 'PolySimple');
}
   
/**
 * Return a Poly that is the union of this polygon with the given polygon.
 * The returned polygon is simple.
 *
 * @return The returned Poly is of type PolySimple
 */
GEOMETRY.PolySimple.prototype.union = function(p) {
	  return Clip.union( this, p, 'PolySimple');
}
   
/**
 * Return a Poly that is the exclusive-or of this polygon with the given polygon.
 * The returned polygon is simple.
 *
 * @return The returned Poly is of type PolySimple
 */
GEOMETRY.PolySimple.prototype.xor = function(p) {
	return Clip.xor( p, this, 'PolySimple');
}
   
/**
 * Return a Poly that is the difference of this polygon with the given polygon.
 * The returned polygon could be complex.
 *
 * @return the returned Poly will be an instance of PolyDefault.
 */
GEOMETRY.PolySimple.prototype.difference = function(p) {
	return Clip.difference(p, this, 'PolySimple');
}
		 
/**
 * Returns the area of the polygon.
 * <p>
 * The algorithm for the area of a complex polygon was take from
 * code by Joseph O'Rourke author of " Computational Geometry in C".
 */
GEOMETRY.PolySimple.prototype.getArea = function() {
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
   
/////////////////////// Rectangle  ///////////////////
GEOMETRY.Rectangle = function(_x, _y, _w, _h) {
	this.x = _x; 
	this.y = _y;
	this.w = _w;
	this.h = _h;
}
GEOMETRY.Rectangle.prototype = {
	getMaxY: function() {
		return this.y + this.h;
	},
	getMinY: function() {
		return this.y;
	},
	getMaxX: function() {
		return this.x+this.w;
	},
	getMinX: function() {
		return this.x;
	},
	toString: function() {
		return '['+ x.toString() +' '+ y.toString() +' '+ w.toString() +' '+ h.toString() +']';
	}
};

/////////////////// ScanBeamTree //////////////////////
GEOMETRY.ScanBeamTree = function(yvalue) {
	this.y = yvalue;   /* Scanbeam node y value             */
	this.less;         /* Pointer to nodes with lower y     */
	this.more;         /* Pointer to nodes with higher y    */
}

///////////////////////// ScanBeamTreeEntries /////////////////
GEOMETRY.ScanBeamTreeEntries = function() {
	this.sbt_entries = 0;
	this.sb_tree;
};
GEOMETRY.ScanBeamTreeEntries.prototype.build_sbt = function() {
	var sbt = [],
		entries = 0;
	entries = this.inner_build_sbt(entries, sbt, this.sb_tree);
	// if (entries != this.sbt_entries) {
	// 	console.log("Something went wrong buildign sbt from tree.");
	// }
	return sbt;
}
GEOMETRY.ScanBeamTreeEntries.prototype.inner_build_sbt = function( entries, sbt, sbt_node) {
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

///////////////////////////  StNode
GEOMETRY.StNode = function( edge, prev) {
	this.edge;         /* Pointer to AET edge               */
	this.xb;           /* Scanbeam bottom x coordinate      */
	this.xt;           /* Scanbeam top x coordinate         */
	this.dx;           /* Change in x for a unit y increase */
	this.prev;         /* Previous edge in sorted list      */
	this.edge = edge;
	this.xb = edge.xb;
	this.xt = edge.xt;
	this.dx = edge.dx;
	this.prev = prev;
}	

/////////////////////   TopPolygonNode /////////////////
GEOMETRY.TopPolygonNode = function() {
	this.top_node;
};

GEOMETRY.TopPolygonNode.prototype.add_local_min = function(x, y) {
	 var existing_min = this.top_node;
	 this.top_node = new PolygonNode(existing_min, x, y);
	 return this.top_node ;
}

GEOMETRY.TopPolygonNode.prototype.merge_left = function(p, q) {
	var top_node = this.top_node,
		target,
		node;
	
	/* Label contour as a hole */
	q.proxy.hole = true;

	if (p.proxy != q.proxy) {
		/* Assign p's vertex list to the left end of q's list */
		p.proxy.v[Clip.RIGHT].next = q.proxy.v[Clip.LEFT];
		q.proxy.v[Clip.LEFT] = p.proxy.v[Clip.LEFT];
		
		/* Redirect any p.proxy references to q.proxy */
		target = p.proxy;
		for (node = top_node; node != null; node=node.next) {
			if (node.proxy == target) {
				node.active = 0;
				node.proxy = q.proxy;
			}
		}
	}
}

GEOMETRY.TopPolygonNode.prototype.merge_right = function(p, q) {
	var top_node = this.top_node,
		target,
		node;

	/* Label contour as external */
	q.proxy.hole = false ;
	
	if (p.proxy != q.proxy) {
		/* Assign p's vertex list to the right end of q's list */
		q.proxy.v[Clip.RIGHT].next = p.proxy.v[Clip.LEFT];
		q.proxy.v[Clip.RIGHT] = p.proxy.v[Clip.RIGHT];
		
		/* Redirect any p->proxy references to q->proxy */
		target = p.proxy;
		for (node=top_node; node != null; node = node.next) {
			if (node.proxy == target) {
				node.active = 0;
				node.proxy= q.proxy;
			}
		}
	}
}

GEOMETRY.TopPolygonNode.prototype.count_contours = function() {
	var nc = 0,
		nv,
		polygon = this.top_node,
		v;
	for (; polygon != null; polygon = polygon.next) {
		if (polygon.active != 0) {
			/* Count the vertices in the current contour */
			nv = 0;
			v = polygon.proxy.v[Clip.LEFT];
			for (; v != null; v = v.next) {
				nv++;
			}
			/* Record valid vertex counts in the active field */
			if (nv > 2) {
				polygon.active = nv;
				nc++;
			} else {
				polygon.active = 0;
			}
		}
	}	
	return nc;
}

GEOMETRY.TopPolygonNode.prototype.getResult = function(polyClass) {
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
}

GEOMETRY.TopPolygonNode.prototype.print = function() {
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
  
///////////    VertexNode  ///////////////
GEOMETRY.VertexNode = function(x, y) {
	this.x = x;       // X coordinate component
	this.y = y;       // Y coordinate component
	this.next = null; // Pointer to next vertex in list
}

/////////////   VertexType   /////////////
GEOMETRY.VertexType = function() {

};
GEOMETRY.VertexType.NUL =  0; /* Empty non-intersection            */
GEOMETRY.VertexType.EMX =  1; /* External maximum                  */
GEOMETRY.VertexType.ELI =  2; /* External left intermediate        */
GEOMETRY.VertexType.TED =  3; /* Top edge                          */
GEOMETRY.VertexType.ERI =  4; /* External right intermediate       */
GEOMETRY.VertexType.RED =  5; /* Right edge                        */
GEOMETRY.VertexType.IMM =  6; /* Internal maximum and minimum      */
GEOMETRY.VertexType.IMN =  7; /* Internal minimum                  */
GEOMETRY.VertexType.EMN =  8; /* External minimum                  */
GEOMETRY.VertexType.EMM =  9; /* External maximum and minimum      */
GEOMETRY.VertexType.LED = 10; /* Left edge                         */
GEOMETRY.VertexType.ILI = 11; /* Internal left intermediate        */
GEOMETRY.VertexType.BED = 12; /* Bottom edge                       */
GEOMETRY.VertexType.IRI = 13; /* Internal right intermediate       */
GEOMETRY.VertexType.IMX = 14; /* Internal maximum                  */
GEOMETRY.VertexType.FUL = 15; /* Full non-intersection             */ 
GEOMETRY.VertexType.getType = function(tr, tl ,br ,bl) {
	return tr + (tl << 1) + (br << 2) + (bl << 3);
}   
	  
////////////////// WeilerAtherton  /////////////
GEOMETRY.WeilerAtherton = function() {};

GEOMETRY.WeilerAtherton.prototype.merge = function(p1, p2) {
	p1 = p1.clone();
	p2 = p2.clone();
}
