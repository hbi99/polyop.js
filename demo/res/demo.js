
@@include('junior.js')

(function(win, doc, $) {
	'use strict';

	var poly1 = [[30, 30], [300, 30], [300, 250], [30, 250]],
		poly2 = [[130, 130], [400, 130], [400, 350], [130, 350]];

	var demo = {
		init: function() {
			// fast references
			this.doc = $(doc);
			this.vertices = {
				poly1: poly1,
				poly2: poly2
			};
			this.vertexRadius = 10;

			this.doEvent('create-polygon', poly1);

			// initate it all
			for (var name in this) {
				if (typeof(this[name].init) === 'function') {
					this[name].init(this);
				}
			}
			// a few event handlers
			this.doc.bind('mouseup mousedown mousemove', this.doEvent);
			this.doc.on('click', '[data-cmd]', this.doEvent);

			// painter
			this.draw.poly(this.vertices);
		},
		doEvent: function(event) {
			var self = demo,
				cmd = (typeof event === 'string') ? event: event.type,
				radius = self.vertexRadius,
				mx,
				my,
				vertices = self.vertices,
				srcEl,
				vx,
				len,
				i, il, res,
				ox, oy,
				isVertex,
				vertex;
			//console.log(cmd);
			switch(cmd) {
				// native events
				case 'click':
					srcEl = $(this);
					if (!srcEl) return;
					// stop default behavior
					event.preventDefault();
					// forward event
					return self.doEvent(srcEl.attr('data-cmd'), srcEl, event);
				case 'mousedown':
					// prevent default behaviour
					event.preventDefault();
				case 'mousemove':
					mx = event.pageX - self.draw.rect.left;
					my = event.pageY - self.draw.rect.top;
					if (cmd === 'mousemove' && (vertices.poly1._selected > -1 || vertices.poly2._selected > -1)) {
						ox = mx + self._clickX;
						oy = my + self._clickY;
						if (vertices.poly1._selected > -1) vertices.poly1[vertices.poly1._selected] = [ox, oy];
						if (vertices.poly2._selected > -1) vertices.poly2[vertices.poly2._selected] = [ox, oy];
					} else {
						// polygon 1 vertices
						vx = vertices.poly1;
						len = vx.length;
						vx._selected = -1;
						vx._hovered = -1;
						while (len--) {
							ox = vx[len][0] - mx;
							oy = vx[len][1] - my;
							isVertex = Math.sqrt((ox * ox) + (oy * oy)) <= radius;
							if (isVertex) {
								if (cmd === 'mousedown') {
									vx._selected = len;
									self._clickX = ox;
									self._clickY = oy;
								} else {
									vx._hovered = len;
								}
								break;
							}
						}
						// polygon 2 vertices
						vx = vertices.poly2;
						len = vx.length;
						vx._selected = -1;
						vx._hovered = -1;
						while (len--) {
							ox = vx[len][0] - mx;
							oy = vx[len][1] - my;
							isVertex = Math.sqrt((ox * ox) + (oy * oy)) <= radius;
							if (isVertex) {
								if (cmd === 'mousedown') {
									vx._selected = len;
									self._clickX = ox;
									self._clickY = oy;
								} else {
									vx._hovered = len;
								}
								break;
							}
						}
					}
					// painter
					self.draw.poly(vertices);
					break;
				case 'mouseup':
					vertices.poly1._selected = -1;
					vertices.poly2._selected = -1;
					break;
				// custom events
				case 'create-polygon':
					res = new polyop.PolyDefault();
					vx = arguments[1];
					for(i=0, il=vx.length; i<il; i++) {    
						res.addPoint(new polyop.Point(vx[i][0], vx[i][1]));
					}
					console.log(res);
					break;
				case 'operation-difference':
					break;
				case 'operation-intersection':
					break;
				case 'operation-union':
					break;
				case 'operation-xor':
					break;
			}
		},
		draw: {
			init: function() {
				this.cvs = doc.getElementById('canvas');
				this.ctx = this.cvs.getContext('2d');
				this.rect = this.cvs.getBoundingClientRect()
			},
			poly: function(vertices) {
				var ctx = this.ctx,
					il, i;

				ctx.clearRect(0, 0, 1e4, 1e4);
				ctx.lineWidth = 3;
				ctx.strokeStyle = '#369';
				
				// polygon 1
				ctx.beginPath();
				ctx.moveTo(vertices.poly1[0][0], vertices.poly1[0][1]);
				for (i=1, il=vertices.poly1.length; i<il; i++) {
					ctx.lineTo(vertices.poly1[i][0], vertices.poly1[i][1]);
				}
				ctx.closePath();
				ctx.stroke();

				// polygon 2
				ctx.beginPath();
				ctx.moveTo(vertices.poly2[0][0], vertices.poly2[0][1]);
				for (i=1, il=vertices.poly2.length; i<il; i++) {
					ctx.lineTo(vertices.poly2[i][0], vertices.poly2[i][1]);
				}
				ctx.closePath();
				ctx.stroke();

				this.vertex(vertices);
			},
			vertex: function(vertices) {
				var _selected,
					_hovered,
					ctx = this.ctx,
					radius = demo.vertexRadius / 2,
					il, i,
					pi2 = Math.PI * 2;

				// set line width
				ctx.lineWidth = 7;

				// polygon vertices 1
				_selected = vertices.poly1._selected;
				_hovered = vertices.poly1._hovered;
				for (i=0, il=vertices.poly1.length; i<il; i++) {
					ctx.beginPath();
					switch (i) {
						case _hovered:
						case _selected: ctx.strokeStyle = 'rgba(100,100,200,0.65)'; break;
						default: ctx.strokeStyle = 'rgba(100,100,100,0.85)';
					}
					ctx.fillStyle = '#fff';
					
					ctx.arc(vertices.poly1[i][0], vertices.poly1[i][1], radius, 0, pi2);
					ctx.stroke();
					ctx.fill();
				}


				// polygon vertices 2
				_selected = vertices.poly2._selected;
				_hovered = vertices.poly2._hovered;
				for (i=0, il=vertices.poly2.length; i<il; i++) {
					ctx.beginPath();
					switch (i) {
						case _hovered:
						case _selected: ctx.strokeStyle = 'rgba(100,100,200,0.65)'; break;
						default: ctx.strokeStyle = 'rgba(100,100,100,0.85)';
					}
					ctx.fillStyle = '#fff';
					
					ctx.arc(vertices.poly2[i][0], vertices.poly2[i][1], radius, 0, pi2);
					ctx.stroke();
					ctx.fill();
				}
			}
		}
	};

	window.onload = demo.init.bind(demo);

})(window, document, jr);
