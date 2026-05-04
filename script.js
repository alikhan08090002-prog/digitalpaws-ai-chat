then({
    duration: 300 }).

  then({
    duration: 350,
    x: { to: 0 },
    easing: easingOut }),


  new mojs.Html({
    ...opts,
    el: el.lineRight,
    x: { 0: -52 } }).

  then({
    duration: boom + move,
    easing,
    x: { to: -52 - 54 } }).

  then({
    duration: boom + move,
    easing,
    x: { to: -52 - 54 - 60 } }).

  then({
    duration: 150,
    easing,
    x: { to: -52 - 54 - 60 - 10 } }).

  then({
    duration: 300 }).

  then({
    duration: 350,
    x: { to: 0 },
    easing: easingOut }),


  new mojs.Html({
    // [I] LOVE YOU
    ...opts,
    el: el.i,
    x: { 0: 34 } }).

  then({
    duration: boom,
    easing: easingBoom,
    x: { to: 34 + 19 } }).

  then({
    duration: move,
    easing,
    x: { to: 34 + 19 + 40 } }).

  then({
    duration: boom,
    easing: easingBoom,
    x: { to: 34 + 19 + 40 + 30 } }).

  then({
    duration: move,
    easing,
    x: { to: 34 + 19 + 40 + 30 + 30 } }),


  new mojs.Html({
    // I [L]OVE YOU
    ...opts,
    el: el.l,
    x: { 0: 15 } }),


  new mojs.Html({
    // I L[O]VE YOU
    ...opts,
    el: el.o,
    x: { 0: 11 } }),


  new mojs.Html({
    // I LO[V]E YOU
    ...opts,
    el: el.v,
    x: { 0: 3 } }),


  new mojs.Html({
    // I LOV[E] YOU
    ...opts,
    el: el.e,
    x: { 0: -3 } }),


  new mojs.Html({
    // I LOVE [Y]OU
    ...opts,
    el: el.y,
    x: { 0: -20 } }).

  then({
    duration: boom,
    easing: easingBoom,
    x: { to: -20 - 33 } }).

  then({
    duration: move,
    easing,
    x: { to: -20 - 33 - 24 } }),


  new mojs.Html({
    // I LOVE Y[O]U
    ...opts,
    el: el.o2,
    x: { 0: -27 } }).

  then({
    duration: boom,
    easing: easingBoom,
    x: { to: -27 - 27 } }).

  then({
    duration: move,
    easing,
    x: { to: -27 - 27 - 30 } }),


  new mojs.Html({
    // I LOVE YO[U]
    ...opts,
    el: el.u,
    x: { 0: -32 } }).

  then({
    duration: boom,
    easing: easingBoom,
    x: { to: -32 - 21 } }).

  then({
    duration: move,
    easing,
    x: { to: -32 - 21 - 36 } }).

  then({
    duration: boom,
    easing: easingBoom,
    x: { to: -32 - 21 - 36 - 31 } }).

  then({
    duration: move,
    easing,
    x: { to: -32 - 21 - 36 - 31 - 27 } }),


  new mojs.Shape({
    parent: el.container,
    shape: "heart",
    delay: move,
    fill: el.colHeart,
    x: -64,
    scale: { 0: 0.95, easing: easingHeart },
    duration: 500 }).

  then({
    x: { to: -62, easing },
    scale: { to: 0.65, easing },
    duration: boom + move - 500 }).

  then({
    duration: boom - 50,
    x: { to: -62 + 48 },
    scale: { to: 0.9 },
    easing: easingBoom }).

  then({
    duration: 125,
    scale: { to: 0.8 },
    easing: easingOut }).

  then({
    duration: 125,
    scale: { to: 0.85 },
    easing: easingOut }).

  then({
    duration: move - 200,
    scale: { to: 0.45 },
    easing }).

  then({
    delay: -75,
    duration: 150,
    x: { to: 0 },
    scale: { to: 0.9 },
    easing: easingBoom }).

  then({
    duration: 125,
    scale: { to: 0.8 },
    easing: easingOut }).

  then({
    duration: 125, // 3725
    scale: { to: 0.85 },
    easing: easingOut }).

  then({
    duration: 125 // 3850
  }).
  then({
    duration: 350,
    scale: { to: 0 },
    easing: easingOut }),


  ...crtBoom(move, -64, 46),
  ...crtBoom(move * 2 + boom, 18, 34),
  ...crtBoom(move * 3 + boom * 2 - delta, -64, 34),
  ...crtBoom(move * 3 + boom * 2, 45, 34)]);

};

const loveTl = crtLoveTl().play();
setInterval(() => {
  loveTl.replay();
}, 4300);

const volume = 0.2;
el.blup.volume = volume;
el.blop.volume = volume;

const toggleSound = () => {
  let on = true;
  return () => {
    if (on) {
      el.blup.volume = 0.0;
      el.blop.volume = 0.0;
      el.sound.classList.add("sound--off");
    } else {
      el.blup.volume = volume;
      el.blop.volume = volume;
      el.sound.classList.remove("sound--off");
    }
    on = !on;
  };
};
el.sound.addEventListener("click", toggleSound());