
@@include('sizzle.min.js')
@@include('junior.js')

(function(win, doc, $) {
	'use strict';

	var poly = [[30, 270], [300, 30], [300, 410], [190, 250]],
		line = [[130, 130], [400, 190]];

	var demo = {
		// difference
		// intersection
		// union
		// xor
		operation: 'xor',
		vertexRadius: 10,
		init: function() {
			// fast references
			this.doc = $(doc);

			// initate it all
			for (var name in this) {
				if (typeof(this[name].init) === 'function') {
					this[name].init(this);
				}
			}

			// a few event handlers
			this.doc.bind('mouseup mousedown mousemove', this.doEvent);
			this.doc.on('click', '[data-cmd]', this.doEvent).trigger('mousemove');
		},
		doEvent: function(event, el, orgEvent) {
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
					if (cmd === 'mousemove' && (poly._selected > -1 || line._selected > -1)) {
						ox = mx + self._clickX;
						oy = my + self._clickY;
						if (poly._selected > -1) poly[poly._selected] = [ox, oy];
						if (line._selected > -1) line[line._selected] = [ox, oy];

						self.doEvent('perform-operation');
					} else {
						// polygon vertices
						vx = poly;
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
						// line vertices
						len = line.length;
						line._selected = -1;
						line._hovered = -1;
						while (len--) {
							ox = line[len][0] - mx;
							oy = line[len][1] - my;
							isVertex = Math.sqrt((ox * ox) + (oy * oy)) <= radius;
							if (isVertex) {
								if (cmd === 'mousedown') {
									line._selected = len;
									self._clickX = ox;
									self._clickY = oy;
								} else {
									line._hovered = len;
								}
								break;
							}
						}
					}
					// painter
					self.draw.poly(self.vertices);
					break;
				case 'mouseup':
					poly._selected = -1;
					line._selected = -1;
					break;
				// custom events
				case 'perform-operation':
					console.log( polyop.getArea(poly) );
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

				// clear canvas
				ctx.clearRect(0, 0, 1e5, 1e5);

				ctx.lineWidth = 3;
				ctx.strokeStyle = '#369';
				
				// polygon
				ctx.beginPath();
				ctx.moveTo(poly[0][0], poly[0][1]);
				for (i=1, il=poly.length; i<il; i++) {
					ctx.lineTo(poly[i][0], poly[i][1]);
				}
				ctx.closePath();
				ctx.stroke();

				// draw line
			//	this.line(line);

				// draw vertices
				this.vertex(vertices);
			},
			line: function(line) {
				var ctx = this.ctx;

				ctx.lineWidth = 3;
				ctx.strokeStyle = '#369';
				
				// line
				ctx.beginPath();
				ctx.moveTo(line[0][0], line[0][1]);
				ctx.lineTo(line[1][0], line[1][1]);
				ctx.stroke();
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
				ctx.fillStyle = '#fff';

				// polygon vertices
				_selected = poly._selected;
				_hovered = poly._hovered;
				for (i=0, il=poly.length; i<il; i++) {
					ctx.beginPath();
					switch (i) {
						case _hovered:
						case _selected: ctx.strokeStyle = 'rgba(200,0,0,1)'; break;
						default: ctx.strokeStyle = 'rgba(100,100,100,0.85)';
					}
					
					ctx.arc(poly[i][0], poly[i][1], radius, 0, pi2);
					ctx.stroke();
					ctx.fill();
				}

				/*
				ctx.strokeStyle = 'rgba(200,100,100,0.85)';

				// line vertices
				_selected = line._selected;
				_hovered = line._hovered;
				for (i=0, il=line.length; i<il; i++) {
					ctx.beginPath();
					switch (i) {
						case _hovered:
						case _selected: ctx.strokeStyle = 'rgba(200,0,0,1)'; break;
						default: ctx.strokeStyle = 'rgba(100,100,100,0.85)';
					}

					ctx.arc(line[i][0], line[i][1], radius, 0, pi2);
					ctx.stroke();
					ctx.fill();
				}
				*/
			}
		}
	};

	window.onload = demo.init.bind(demo);

})(window, document, jr);
