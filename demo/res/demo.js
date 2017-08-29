
(function(win, doc) {
	'use strict';

	var vertices = [[30, 30], [200, 30], [200, 150], [30, 150]];

	var demo = {
		init: function() {
			// fast references
			this.vertices = vertices;
			this.vertexRadius = 10;

			// initate it all
			for (var name in this) {
				if (typeof(this[name].init) === 'function') {
					this[name].init(this);
				}
			}
			// a few event handlers
			doc.addEventListener('mouseup', this.doEvent, false);
			doc.addEventListener('mousedown', this.doEvent, false);
			doc.addEventListener('mousemove', this.doEvent, false);

			// painter
			this.draw.poly(vertices);
		},
		doEvent: function(event) {
			var self = demo,
				cmd = event.type,
				vertices = self.vertices,
				len = vertices.length,
				radius = self.vertexRadius,
				mx = event.pageX - self.draw.rect.left,
				my = event.pageY - self.draw.rect.top,
				ox, oy,
				isVertex,
				vertex;
			switch(cmd) {
				case 'mousedown':
					// prevent default behaviour
					event.preventDefault();
				case 'mousemove':
					if (cmd === 'mousemove' && self._selected) {
						ox = mx + self._clickX;
						oy = my + self._clickY;
						vertices[self._selected] = [ox, oy];
					} else {
						delete self._selected;
						delete self._hovered;
						while (len--) {
							ox = vertices[len][0] - mx;
							oy = vertices[len][1] - my;
							isVertex = Math.sqrt((ox * ox) + (oy * oy)) <= radius;
							if (isVertex) {
								if (cmd === 'mousedown') {
									self._selected = len;
									self._clickX = ox;
									self._clickY = oy;
								} else {
									self._hovered = len;
								}
								break;
							}
						}
					}
					// painter
					self.draw.poly(vertices);
					break;
				case 'mouseup':
					self._selected = false;
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
					il = vertices.length,
					i = 1;

				ctx.clearRect(0, 0, 1e4, 1e4);

				ctx.lineWidth = 3;
				ctx.strokeStyle = '#369';
				ctx.beginPath();
				ctx.moveTo(vertices[0][0], vertices[0][1]);
				for (; i<il; i++) {
					ctx.lineTo(vertices[i][0], vertices[i][1]);
				}
				ctx.closePath();
				ctx.stroke();

				this.vertex(vertices);
			},
			vertex: function(vertices) {
				var that = demo,
					_selected = that._selected,
					_hovered = that._hovered,
					ctx = this.ctx,
					radius = demo.vertexRadius / 2,
					il = vertices.length,
					i = 0,
					pi2 = Math.PI * 2,
					color;

				for (; i<il; i++) {
					ctx.beginPath();
					ctx.lineWidth = 7;

					switch (i) {
						case _selected: color = 'rgba(100,100,200,0.65)'; break;
						case _hovered: color = 'rgba(100,100,100,0.5)'; break;
						default: color = 'rgba(200,100,100,0.85)';
					}
					ctx.strokeStyle = color;
					ctx.fillStyle = '#fff';
					
					ctx.arc(vertices[i][0], vertices[i][1], radius, 0, pi2);
					ctx.stroke();
					ctx.fill();
					//ctx.stroke();
				}
			}
		}
	};

	window.onload = demo.init.bind(demo);

})(window, document);
