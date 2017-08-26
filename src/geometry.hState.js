
/////////////////////   HState   //////////////////////////////////////
GEOMETRY.HState = function() {};
GEOMETRY.HState.NH = 0; /* No horizontal edge                */
GEOMETRY.HState.BH = 1; /* Bottom horizontal edge            */
GEOMETRY.HState.TH = 2; /* Top horizontal edge               */

var NH = GEOMETRY.HState.NH;
var BH = GEOMETRY.HState.BH;
var TH = GEOMETRY.HState.TH;

/* Horizontal edge state transitions within scanbeam boundary */
GEOMETRY.HState.next_h_state =
	  [
	  /*        ABOVE     BELOW     CROSS */
	  /*        L   R     L   R     L   R */  
	  /* NH */ [BH, TH,   TH, BH,   NH, NH],
	  /* BH */ [NH, NH,   NH, NH,   TH, TH],
	  /* TH */ [NH, NH,   NH, NH,   BH, BH]
	];
