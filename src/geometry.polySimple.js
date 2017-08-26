 
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
