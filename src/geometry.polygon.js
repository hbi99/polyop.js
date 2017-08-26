
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
