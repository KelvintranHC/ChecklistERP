// One grid for picture, score and mix. 96 BPM (felt in half time); every cut lands on a beat.
export const BPM = 96, BEAT = 60 / BPM;          // 0.625 s
export const B = n => n * BEAT;
export const DUR = 30;
export const T = {
  door: 0, cross: B(8), face: B(16), hands: B(22), touch: B(26), bless: B(30), dawn: B(38), end: DUR,
  reachBack: B(23.5), reach: B(24.4),           // anticipation: the arm draws back, then reaches
  title: B(41), verse: B(42.2),
};
export const XF = .55;                           // paint-over sweep length (s)
// on-screen lines: [id, text, t0, t1, x, y, size, align]
export const LINES = [
  ['l1', 'Có những lúc ta ngỡ mình đơn độc…', .8, 4.75, 960, 930, 60, 'center'],
  ['l2', '…giữa bóng tối không lối thoát.', 5.9, 9.8, 960, 960, 60, 'center'],
  ['l3', 'Nhưng có Một Đấng vẫn nhìn thấy ta.', 10.2, 13.7, 560, 990, 56, 'center'],
  ['l4', 'Ngài chưa từng rời xa ta.', 19.4, 23.6, 1560, 120, 60, 'center'],
];
export const VERSE = ['v', '“Hãy đến cùng Ta.” — Ma-thi-ơ 11:28', T.verse, DUR, 1340, 500];
