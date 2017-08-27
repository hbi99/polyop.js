
// HState
var NH = 0,
	BH = 1,
	TH = 2;

GEOMETRY.HState = {
	NH: NH, /* No horizontal edge                */
	BH: BH, /* Bottom horizontal edge            */
	TH: TH, /* Top horizontal edge               */
	next_h_state: [
	  /*        ABOVE     BELOW     CROSS */
	  /*        L   R     L   R     L   R */  
	  /* NH */ [BH, TH,   TH, BH,   NH, NH],
	  /* BH */ [NH, NH,   NH, NH,   TH, TH],
	  /* TH */ [NH, NH,   NH, NH,   BH, BH]
	]
};
