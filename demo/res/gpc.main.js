
var poly1,
	poly2,
	ctx;

var init = function() {
	var cvs = document.getElementById("canvas");
	ctx = cvs.getContext("2d");
	
	//define polygons
	var vertices1 = [
		[61,68],	
		[145,122],	
		[186,94],	
		[224,135],	
		[204,211],	
		[105,200],	
		[141,163],	
		[48,139],	
		[74,117]	
	];
	poly1 = createPoly(vertices1);

	// var vertices2 = [
	// 	[131,84],	
	// 	[224,110],	
	// 	[174,180],	
	// 	[120,136],	
	// 	[60,167],	
	// ];
	var vertices2 = [
		[10,10],	
		[100,10],	
		[100,100],	
		[10,100],	
		[10,20],	
	];
	poly2 = createPoly(vertices2);
	//bring to screen
	drawPoly(poly1,"blue",0,-8);
	drawPoly(poly2,"red",0,-8);
	
	//listen to buttons
	document.getElementById("difBtn").addEventListener("click",difference);
	document.getElementById("intBtn").addEventListener("click",intersection);
	document.getElementById("unBtn").addEventListener("click",union);
	document.getElementById("xorBtn").addEventListener("click",xor);

	xor();
	
}

var difference = function(e) {
	clearScreen();
	
	drawPoly(poly1, "blue", 0, -8);
	drawPoly(poly2, "red", 0, -8);
		
	var diff = poly1.difference(poly2);
	drawPoly(diff, "green", 0, 150);
	
}

var intersection = function(e) {
	clearScreen();
	
	drawPoly(poly1, "blue", 0, -8);
	drawPoly(poly2, "red", 0, -8);
		
	var diff = poly1.intersection(poly2);
	drawPoly(diff, "green", 0, 150);
}

var union = function(e) {
	clearScreen();
	
	drawPoly(poly1, "blue", 0, -8);
	drawPoly(poly2, "red", 0, -8);
		
	var diff = poly1.union(poly2);
	drawPoly(diff, "green", 0, 150);
}

var xor = function(e) {
	clearScreen();
	
	drawPoly(poly1, "blue", 0, -8);
	drawPoly(poly2, "red", 0, -8);
		
	var diff = poly1.xor(poly2);
	drawPoly(diff, "green", 0, 150);
}

var createPoly = function(points) {
    var res  = new polyop.PolyDefault();
    for(var i=0; i < points.length; i++) {    
        res.addPoint(new polyop.Point(points[i][0], points[i][1]));
    }
    return res;
}

var getPolygonVertices = function(poly) {
	var vertices = [];
		numPoints = poly.getNumPoints();
		i;
	
	for(i=0; i<numPoints; i++) {
		vertices.push([poly.getX(i), poly.getY(i)]);
	}
	return vertices;
}

var drawPoly = function(polygon,strokeColor,ox,oy) {
	var num = polygon.getNumInnerPoly();
	var i;
	
	//if more than one poly produced, use multiple color to display
	var colors=["#91ab19","#ab9119","#e5ce35","#ab1998"];
	
	for(i=0;i<num;i++) {
		var poly = polygon.getInnerPoly(i);
		var vertices  = getPolygonVertices(poly);

		if (i==0) drawSinglePoly(vertices, strokeColor, poly.isHole(), ox, oy);
		else drawSinglePoly(vertices, colors[i%num], poly.isHole(), ox, oy);
	}
}
	
var drawSinglePoly = function(vertices,strokeColor,hole,ox,oy) {
	var i;

	if (ox == undefined) ox = 0;
	if (oy == undefined) oy = 0;

	ctx.beginPath();
	ctx.moveTo(vertices[0][0]+ox, vertices[0][1]+oy);

	for(i=1;i<vertices.length;i++) {
		ctx.lineTo(vertices[i][0]+ox, vertices[i][1]+oy);	
	}

	ctx.lineWidth = 2;
	ctx.strokeStyle = strokeColor;
	ctx.fillStyle = "rgba(255, 0, 0, 0.1)";

	if (hole == true) {
		ctx.fillStyle = "#ffffff";
	}
	ctx.closePath();
	ctx.stroke();
	ctx.fill();
}

var clearScreen = function() {
	ctx.clearRect (0,0,400,400);
}