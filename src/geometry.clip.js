
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
