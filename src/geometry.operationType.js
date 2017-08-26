
/////////////   OperationType //////////////////////////////////
GEOMETRY.OperationType = function(type) {
	this.m_Type = type; 
}
GEOMETRY.OperationType.GPC_DIFF  = new GEOMETRY.OperationType( 'Difference' );
GEOMETRY.OperationType.GPC_INT   = new GEOMETRY.OperationType( 'Intersection' );
GEOMETRY.OperationType.GPC_XOR   = new GEOMETRY.OperationType( 'Exclusive or' );
GEOMETRY.OperationType.GPC_UNION = new GEOMETRY.OperationType( 'Union' );
