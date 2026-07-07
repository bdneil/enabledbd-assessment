// Deterministic persona fixtures (update 5 addendum B2).
// Answers are set programmatically — never re-clicked by hand — so a persona
// always produces identical output. Style answers assume the ORIGINAL (unshuffled)
// option order, which is what you get when answers are set directly without startQuiz():
//   F1 / F5 / F6 / S0 : 0=connector, 1=driver, 2=educator   (S0 also: 3 = "none of these lately")
//   F3 : 0=connector, 1=driver          F4 : 0=solo (recharge alone), 1=in-room
const B   = { low:{B1:0,B2:0,B3:2,B4:0,B5:0,B6:0,B7:0,B8:0}, mid:{B1:2,B2:1,B3:1,B4:1,B5:1,B6:1,B7:1,B8:1}, high:{B1:3,B2:2,B3:0,B4:1,B5:1,B6:2,B7:2,B8:2} };
const CAD = { rhythm:{C1:0,C2:0}, burst:{C1:1,C2:1} };
const OM  = { low:{OM1:0,OM2:0,OM3:0,OM4:0}, mid:{OM1:2,OM2:1,OM3:0,OM4:0}, high:{OM1:3,OM2:2,OM3:1,OM4:1} };
const BM  = { low:{BM1:0,BM2:0,BM3:0,BM4:0,BM5:0}, mid:{BM1:1,BM2:1,BM3:1,BM4:1,BM5:1}, high:{BM1:2,BM2:2,BM3:1,BM4:1,BM5:2} };
const rank = (a,b,c) => ({ order:[a,b,c] });
const F6ORDER = { connector:[0,1,2], driver:[1,0,2], educator:[2,0,1] };

function styleAns(style, solo){
  const si = { connector:0, driver:1, educator:2 }[style];
  return { S0:[si], F1:si, F3:(style==='driver'?1:0), F4:(solo?0:1), F5:si, F6:rank(...F6ORDER[style]), F8:(style==='connector'?0:1) };
}
const owner   = (style, mat, bat, cad, solo) => Object.assign({ GATE:0 }, OM[mat], styleAns(style, solo), B[bat], CAD[cad]);
const builder = (style, mat, bat, cad, solo) => Object.assign({ GATE:3 }, BM[mat], styleAns(style, solo), B[bat], CAD[cad]);
// Powerhouse: an even 3-way blend (Connector ≈ Driver ≈ Educator, all strong),
// strong foundation, high battery, outward. Scores it produces (unshuffled order):
//   S0[0,1,2] → +.75 each · F1:1 driver+1 · F3:1 driver+1.5 · F5:0 connector+1 ·
//   F6 order[2,0,1] → educator+3, connector+1.5, driver+0
//   ⇒ C 3.25 · D 3.25 · E 3.75  → strong=3 (all ≥ 0.6·max) ⇒ Powerhouse on both tracks
const powerhouse = (gate, mat) => Object.assign({ GATE:gate }, mat, { S0:[0,1,2], F1:1, F3:1, F4:1, F5:0, F6:rank(2,0,1), F8:1 }, B.high, CAD.rhythm);

module.exports = [
  { name:'owner-connector',        user:{ name:'Jordan Lee',  industry:'Consulting' }, answers: owner('connector','high','high','rhythm',true) },
  { name:'owner-driver',           user:{ name:'Dana Cole',   industry:'Law' },        answers: owner('driver','high','high','rhythm',false) },
  { name:'owner-educator',         user:{ name:'Alex Kim',    industry:'Accounting' }, answers: owner('educator','mid','mid','rhythm',true) },
  { name:'owner-powerhouse',       user:{ name:'Morgan Vale', industry:'Consulting' }, answers: powerhouse(0, OM.high) },
  { name:'builder-connector',      user:{ name:'Riley Ford',  industry:'Consulting' }, answers: builder('connector','mid','mid','rhythm',false) },
  { name:'builder-driver',         user:{ name:'Toni Diaz',   industry:'Law' },        answers: builder('driver','mid','mid','rhythm',false) },
  { name:'builder-educator',       user:{ name:'Sam Rivera',  industry:'Law' },        answers: builder('educator','mid','mid','rhythm',true) },
  { name:'builder-powerhouse',     user:{ name:'Casey Wu',    industry:'Accounting' }, answers: powerhouse(2, BM.high) },
  { name:'introverted-connector',  user:{ name:'Pat Nguyen',  industry:'Law' },        answers: owner('connector','mid','mid','rhythm',true) },   // F4 solo, connector #1 — must NOT leak to educator
  { name:'aspirational-connector', user:{ name:'Jamie Sol',   industry:'Consulting' }, answers: Object.assign({ GATE:0 }, OM.low, { S0:[3], F1:0, F3:0, F4:1, F5:0, F6:rank(0,1,2), F8:0 }, B.low, CAD.rhythm) }, // none-recent → discrepancy fires
  { name:'burst-owner',            user:{ name:'Lee Park',    industry:'Accounting' }, answers: owner('driver','mid','mid','burst',false) },
  { name:'burst-builder',          user:{ name:'Quinn Ade',   industry:'Law' },        answers: builder('educator','mid','mid','burst',true) },

  // --- Proof fixtures: opposite on every conditional axis (track / energy / maturity band / cadence) ---
  // F-A: owner · in-room energy · top band (Growth Partner) · rhythm
  { name:'F-A', user:{ name:'Ava Stone',  industry:'Consulting' }, answers: owner('connector','high','high','rhythm', false) },
  // F-B: owner · solo energy · bottom band (foundation-led) · burst
  { name:'F-B', user:{ name:'Ben Ortiz',  industry:'Law' },        answers: owner('driver','low','low','burst', true) },
  // F-C: builder · solo energy · middle band · rhythm
  { name:'F-C', user:{ name:'Cara Reyes', industry:'Accounting' }, answers: builder('educator','mid','mid','rhythm', true) },
  // F-D: builder · in-room energy · top band · burst   (cadence twin of F-B for the P5+P6 agreement check)
  { name:'F-D', user:{ name:'Dev Malik',  industry:'Consulting' }, answers: builder('connector','high','high','burst', false) },
];
