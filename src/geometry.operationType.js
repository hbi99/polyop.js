
// OperationType
var OperationType = function(type) {
	this.m_Type = type; 
};

OperationType.GPC_DIFF  = new OperationType('Difference');
OperationType.GPC_INT   = new OperationType('Intersection');
OperationType.GPC_XOR   = new OperationType('Exclusive or');
OperationType.GPC_UNION = new OperationType('Union');
