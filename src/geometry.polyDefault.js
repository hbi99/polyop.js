
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
