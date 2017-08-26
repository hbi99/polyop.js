
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
