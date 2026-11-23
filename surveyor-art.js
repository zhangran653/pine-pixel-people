// Local coordinates point forward (x), across the shoulders (y), and up (z).
const surveyorArt = {
  materials: {
    skin:'c88a66', skinLight:'edb78b', skinShade:'ac735b', blush:'d39272',
    lip:'985c54', lid:'9a6655', white:'f0dfc6', iris:'674f3d', eye:'372f33',
    hair:'393139', hairWarm:'5b4142', hairLight:'805747',
    hat:'cbaa72', straw:'e4c98d', strawLight:'f3db9e', feltShade:'ad895c',
    brimEdge:'997345', brimUnder:'88704f', hatBand:'55463e', bandEdge:'705543',
    coat:'c99545', coatSun:'e6b45d', coatShade:'af783c', coatEdge:'805a37', lining:'956238',
    teal:'39868b', tealDeep:'305c64', tealLight:'78b5af',
    trousers:'414c5b', pantsLight:'596374', pantsDark:'323b4a', knee:'58616a',
    leather:'674a42', leatherLight:'8c6147', leatherDark:'503e38', bootToe:'765846',
    sole:'393835', lace:'dbc084', canvas:'61735f', canvasLight:'809076', canvasDark:'495e53',
    brass:'dbaf66', paper:'efdcad', paperShade:'cfbd92', mapLine:'94a28c', red:'a55747'
  },

  paint(pose, brush, ink) {
    const { frame, stamp, blob, link } = brush;
    frame(null);
    for (let i=0; i<2; i++) {
      const side = i ? 1 : -1, foot = pose.feet[i], {hip,knee} = pose.legs[i];
      link(hip,knee,2.68,2.19,.94,(t,u,v) => {
        if (side*v > 1.49 && Math.abs(u-.28) < .27) return ink.pantsLight;
        if (u > .68 && t > .77) return ink.knee;
        return side*v < -1.32 ? ink.pantsDark : ink.trousers;
      });
      link(knee,foot,2.28,1.56,.91,(t,u,v) => {
        if (t < .25 && u > .50) return ink.knee;
        if (t > .47 && t < .58) return ink.pantsLight;
        return side*v < -1 ? ink.pantsDark : ink.trousers;
      });
      const x=foot[0], y=foot[1], lift=foot[2]-3.1;
      // A welted outsole, toe cap, tongue and two runs of lacing read in profile.
      blob(x+.85,y,lift+1.50,3.67,2.04,1.48,(px,py,z) => {
        const h=z-lift, front=px-x;
        if (h < .56) return ink.sole;
        if (h < .98) return ink.leatherLight;
        if (front > 2.24) return ink.bootToe;
        return front < -.65 ? ink.leatherDark : ink.leather;
      },3.5);
      const shaft = foot.map((v,j) => v + .32*(knee[j]-v));
      link(shaft,foot,1.79,1.80,1.01,(t,u,v) => {
        if (t < .16) return ink.leatherLight;
        if (u > 1.04) {
          const lace=(t-.31)*3.45;
          if (Math.abs(lace-Math.round(lace)-.16*v) < .14) return ink.lace;
          return ink.leatherDark;
        }
        return side*v > .75 ? ink.bootToe : ink.leather;
      });
    }

    frame(pose.torso);
    blob(-.15,0,19.2,3.95,5.35,3.25,ink.trousers,2.8);
    // The jacket flares below a narrow belt, with a diagonal satchel strap above.
    stamp(-4.4,4.9,-6.7,6.7,17.95,34.25,(x,y,z) => {
      const h=z-18, a=Math.abs(y);
      const halfWidth = h<4 ? 5.73-.21*h : h<13.7 ? 4.89+.15*(h-4) : 6.35-.60*(h-13.7);
      const depth = h<4 ? 3.92-.13*h : h<13 ? 3.40+.074*(h-4) : 4.07-.21*(h-13);
      const u=Math.abs(x-.1)/depth, v=a/halfWidth, u2=u*u, v2=v*v;
      if (u2*u2+v2*v2 > 1 || z < 18.0+.19*a/halfWidth) return 0;
      if (z < 18.78) return ink.coatShade;
      if (z > 21 && z < 22.25) {
        if (x>1.7 && Math.abs(y-.12)<.91) return ink.brass;
        return Math.abs(a-3.62)<.32 ? ink.coat : ink.leather;
      }
      if (x>.9) {
        if (z>22.35 && Math.abs(y-((z-21.2)*.55-3.58))<.64)
          return z>28.1 && z<28.75 ? ink.brass : ink.leather;
        if (Math.abs(y-.15)<.28) return ink.coatEdge;
        if (y>.45 && y<1.06 && Math.abs(z-24.05)<.32) return ink.brass;
        if (z<20.45 && a>2.6 && Math.abs(z-19.1-(a-3)*.35)<.34) return ink.coatEdge;
        return z>30.4 ? ink.coatSun : ink.coat;
      }
      return x<-1.55 || a>halfWidth-.75 ? ink.coatShade : ink.coat;
    });
    // Pleated chest pocket and the pale folded corner of a route card.
    blob(3.49,-2.48,28.0,.79,1.72,1.74,(x,y,z) => {
      if (z>28.81) return ink.coatSun;
      if (Math.abs(z-28.69)<.22 || Math.abs(y+2.54)<.20) return ink.coatEdge;
      if (Math.abs(z-28.14)<.27 && Math.abs(y+2.55)<.35) return ink.brass;
      return ink.coatShade;
    },4);
    stamp(3.26,4.02,-3.41,-1.51,29.05,30.65,(x,y,z) => {
      if (z>30.22+.23*(y+2.44) || x<3.46) return 0;
      return Math.abs(z-29.92-.28*(y+2.31))<.14 ? ink.mapLine : ink.paper;
    });

    // Canvas survey satchel with a leather base, binding and paired buckles.
    blob(-5.35,.28,25.48,2.89,5.0,5.53,(x,y,z) => {
      const side=Math.abs(y-.28);
      if (z<21.18) return ink.leather;
      if (side>4.34) return ink.canvasDark;
      if (x < -6.12 && z>27.1) return z<27.65 ? ink.canvasDark : ink.canvasLight;
      if (x < -6.35 && Math.abs(side-2.63)<.58 && z<27.95)
        return z>25.7 && z<26.47 ? ink.brass : ink.leather;
      return x> -5.50 ? ink.canvasDark : ink.canvas;
    },4);
    blob(-4.75,-5.46,22.08,2.03,1.75,2.03,(x,y,z) =>
      z>23.18 ? ink.leatherLight : ink.canvasDark,3.6);
    // An oblique roll of survey paper has two leather ties and a visible wound end.
    const x0=-7.78, y0=-3.47, z0=21.45, dx=-.46, dy=9.76, dz=10.3;
    const length2=dx*dx+dy*dy+dz*dz;
    stamp(-9.93,-5.92,-5.30,8.14,19.65,33.65,(x,y,z) => {
      const px=x-x0, py=y-y0, pz=z-z0, t=(px*dx+py*dy+pz*dz)/length2;
      if (t<0 || t>1) return 0;
      const u=px-t*dx, v=py-t*dy, w=pz-t*dz, r2=u*u+v*v+w*w;
      if (r2>2.68) return 0;
      if (t<.044 || t>.958) return r2<.28 || (r2>.82 && r2<1.39) ? ink.canvasDark : ink.paper;
      if ((t>.20 && t<.31) || (t>.67 && t<.775))
        return u<-.94 && Math.abs(v)<.49 ? ink.brass : ink.leather;
      if (t>.49 && t<.555 && Math.abs(v+w*.45)<.55) return ink.mapLine;
      return u<-.69 || w>.88 ? ink.paper : ink.paperShade;
    });
    // Layered neckerchief; its asymmetric pointed end falls over the button placket.
    blob(.56,0,34.50,3.44,4.44,1.60,(x,y,z) =>
      z>34.68 && x>-.75 ? ink.tealLight : z<34 ? ink.tealDeep : ink.teal,2.7);
    stamp(3.10,4.75,-1.96,1.65,29.65,34.65,(x,y,z) => {
      const t=(z-29.65)/5, mid=-1.15+1.04*t, width=.13+1.54*t;
      if (Math.abs(y-mid)>width || x<3.32 || x>3.95+.51*t) return 0;
      return Math.abs(y-mid+.30*t)<.24 ? ink.tealLight : ink.teal;
    });

    frame(null);
    for (const {side,shoulder,elbow,wrist,hand} of pose.arms) {
      link(shoulder,elbow,2.58,2.08,.91,(t,u,v) => {
        if (t>.71 && u<-.40) return ink.lining;
        if (side*v>1.43 && Math.abs(u-.08)<.29) return ink.coatShade;
        return t<.24 || u>1.38 ? ink.coatSun : ink.coat;
      });
      link(elbow,wrist,2.08,1.51,.96,(t,u,v) => {
        if (t>.82) return side===1 && t>.90 ? ink.leather : ink.tealDeep;
        if (t>.61) return t<.70 ? ink.lining : ink.coatSun;
        return u<-.86 || side*v<-1.05 ? ink.coatShade : ink.coat;
      });
      blob(...hand,1.53,1.44,1.99,(x,y) => side*(y-hand[1])>.15 ? ink.skinLight : ink.skin,2.7);
    }

    frame(pose.head);
    // Jaw and cheeks taper independently, keeping the lips on the drinking contact.
    stamp(-4.4,5.85,-5.35,5.35,34.40,45.26,(x,y,z) => {
      const h=(z-39.91)/5.47;
      const width=5.07*(1-.14*Math.max(0,-h));
      const u=(x-.62)/5.06, v=y/width, u2=u*u, v2=v*v, h2=h*h;
      if (u2*u2+v2*v2+h2>1) return 0;
      const side=Math.abs(y);
      if (x < -.64 || (x<2.08 && side>3.84 && z>40.05) || (z>42.8 && x<3.82+.27*y)) {
        if (Math.abs(y+2.1+.25*(z-38))<.37 && x<0) return ink.hairLight;
        return x< -1.82 ? ink.hair : ink.hairWarm;
      }
      if (x>3.35 && side>1.50 && side<3.76) {
        if (Math.abs(z-(41.87+.10*(side-2.5)))<.29 && side<3.50) return ink.hair;
        const height=1.14*(1-(pose.blink||0));
        if (z>39.98 && z<39.98+height) {
          if (Math.abs(side-2.62)<.60) return z<40.46 ? ink.iris : ink.eye;
          return ink.white;
        }
        if ((pose.blink||0)>.5 && Math.abs(z-40.08)<.18) return ink.lid;
      }
      if (x>3.20 && side>3.10 && z>38.32 && z<39.65) return ink.blush;
      return x>2.72 ? ink.skinLight : (z<37.2 ? ink.skinShade : ink.skin);
    });
    for (const side of [-1,1]) {
      blob(.05,side*4.98,39.35,1.24,.92,1.53,(x,y,z) =>
        x<.36 && z<39.85 ? ink.skinShade : ink.skinLight);
    }
    blob(4.93,0,39.42,1.48,.97,1.17,(x,y,z) => z>39.18 ? ink.skinLight : ink.skinShade);
    blob(5.14,-.14,37.62,.58,1.24,.44,(x,y,z) => z>37.62 ? ink.lip : ink.blush,2.8);
    // Interlaced locks form a single low plait, offset from the map roll.
    blob(-2.83,-.88,38.54,2.45,3.97,2.91,(x,y,z) =>
      Math.abs(y+.7+.48*(z-38.4))<.62 ? ink.hairWarm : ink.hair,2.35);
    for (let j=0;j<4;j++) {
      const y=-.82-.35*j, z=36.8-1.18*j, r=1.72-.14*j;
      blob(-4.55-.33*j,y+(j%2?.33:-.33),z,r,r*1.17,1.48,(x,py,pz) =>
        Math.abs(py-y-.65*(pz-z)*(j%2?1:-1))<.48 ? ink.hairWarm : ink.hair);
    }
    blob(-5.77,-2.12,32.50,1.19,1.20,.64,ink.tealLight,2.7);
    blob(-5.89,-2.32,31.69,1.02,.97,1.08,ink.hairWarm);

    // The brim lifts at the sides and drops in front. Its underside has its own ink.
    stamp(-8.19,8.92,-8.77,8.77,42.16,45.72,(x,y,z) => {
      const u=(x-.27)/8.43, v=y/8.70, r2=u*u+v*v;
      if (r2>1) return 0;
      const mid=43.89+.94*v*v-.48*Math.max(0,u)+.17*Math.max(0,-u);
      if (Math.abs(z-mid)>(r2>.84?.47:.36)) return 0;
      if (r2>.92) return z>mid+.04 ? ink.strawLight : ink.brimEdge;
      if (z<mid-.10) return ink.brimUnder;
      return r2>.76 && r2<.82 ? ink.hat : ink.straw;
    });
    // A pinched felt crown, recessed top crease and separate leather hatband.
    stamp(-6.10,6.14,-6.37,6.37,43.62,49.98,(x,y,z) => {
      const t=(z-43.62)/6.1, u=(x+.18)/(5.80-1.25*t);
      const pinch=.30*Math.max(0,u)*Math.max(0,t), v=y/(6.02-1.38*t-pinch);
      const r2=u*u+v*v;
      const valley=Math.max(0,1-Math.abs(y+.105*x)/1.22)*Math.max(0,1-.035*x*x);
      if (r2>1 || z>49.96-.74*r2-.81*valley) return 0;
      const band=46.08+.10*v-.13*u;
      if (z<band) return z>band-.37 ? ink.bandEdge : ink.hatBand;
      if (z>48.75-.60*r2 && valley>.40) return ink.feltShade;
      if (u<-.49 && Math.abs(v-.20)<.038) return ink.feltShade;
      return r2<.58 && z>48.4 ? ink.strawLight : (u<-.28 || v>.62 ? ink.hat : ink.straw);
    });
    // A short red survey pencil tucks into the band over the right ear.
    link([-3.3,-5.04,45.15],[2.50,-5.26,45.88],.35,.31,1,(t) =>
      t>.92 ? ink.eye : t>.76 ? ink.paper : ink.red);
    frame(null);
  }
};
