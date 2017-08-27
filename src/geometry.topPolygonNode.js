
// TopPolygonNode
GEOMETRY.TopPolygonNode = function() {
	this.top_node;
};

GEOMETRY.TopPolygonNode.prototype = {
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