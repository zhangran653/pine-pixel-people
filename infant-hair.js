// Infant hair is drawn in the baby's own scalp coordinates. Latitude starts at the
// crown, bearing zero points towards the nose, and lift is measured in head radii.
const pineInfantHair = (() => {
  const styles = {
    'baby-sprout': { label:'头顶小软翘', grown:'crop', pigment:.78 },
    'baby-comma': { label:'额前逗号卷', grown:'curly', pigment:.84 },
    'baby-sweep': { label:'偏分细软刘海', grown:'side-part', pigment:.88, cap:[.78,.40,.07] },
    'baby-cloud': { label:'云朵短卷', grown:'curly', pigment:.95, cap:[.72,.32,.05] },
    'baby-whorl': { label:'旋儿胎发', grown:'crew', pigment:.54 },
    'baby-puffs': { label:'双簇小绒团', grown:'space-buns', pigment:.90, cap:[.81,.46,.11] }
  };
  const choices = Object.fromEntries(Object.entries(styles).map(([id,s])=>[id,s.label]));
  const group = '婴儿专属';
  function capEdge(id,angle) {
    const [front,side,back]=styles[id].cap, u=Math.cos(angle);
    const edge=side+Math.abs(u)*((u>0 ? front : back)-side);
    if (id==='baby-sweep') return edge+.095*Math.sin(angle+.30)-.036*Math.cos(4*angle);
    return edge-.028*Math.cos((id==='baby-cloud' ? 9 : 5)*angle+.36);
  }
  function strands(id,project,front,hat) {
    const strokes=[], turn=2*Math.PI;
    // A tapered stroke is connected in all views. The radius swells in the
    // middle and the tip ends on a single voxel in the close portrait.
    function stroke(curve,width,shade,steps=6,map=project) {
      const points=[], radii=[];
      for (let j=0;j<=steps;j++) {
        const t=j/steps;
        points.push(map(...curve(t)));
        radii.push(width*(.10+.49*(1-t)+.57*Math.sin(Math.PI*t)));
      }
      strokes.push({points,radii,shade});
    }
    function ribbon(controls,width,shade,map=project) {
      stroke(t=>{
        const s=1-t;
        return controls[0].map((_,i)=>s*s*s*controls[0][i]+3*s*s*t*controls[1][i]+
          3*s*t*t*controls[2][i]+t*t*t*controls[3][i]);
      },width,shade,6,map);
    }
    // Short, separate strokes at the back and behind the ears keep the nape
    // soft. A head covering tucks the longer lengths, including both puffs.
    const dense=!!styles[id].cap;
    const sides=dense ? [1.76,2.20,2.57,2.86] : [2.00,2.46];
    for (const sign of [-1,1]) {
      for (const [i,az] of sides.entries()) {
        const p=(hat ? 1.39 : dense ? 1.02 : 1.24)+.09*Math.sin(3*i+sign)+.12*(az-2);
        ribbon([[p,sign*az,-.012],[p+.13,sign*(az+.08),.012],
          [p+.22,sign*(az+.17),.023],[p+.25+.04*i,sign*(az+.29),.008]],
          hat ? .032 : dense ? .060 : .029,3);
      }
    }
    if (hat) {
      for (const side of [-1,1]) {
        const a=side*(dense ? 1.53 : 1.74);
        ribbon([[1.37,a,-.006],[1.50,a+side*.03,.042],[1.56,a+side*.15,.057],
          [dense ? 1.71 : 1.65,a+side*.18,.020]],dense ? .067 : .041,dense ? 1 : 3);
      }
      return strokes;
    }
    if (id==='baby-sprout') {
      // A broad root and a sideways bend make one low cowlick from either side.
      for (const [offset,w,tone] of [[-.20,.090,2],[.02,.107,1],[.18,.066,0]])
        ribbon([[.65,-.55+offset,-.008],[.43,-.67+offset,.066],[.19,-1.23+offset,.28],
          [.46,-1.78+offset,.115]],w,tone);
      ribbon([[.73,-.80,0],[.60,-.92,.025],[.47,-1.04,.063],[.35,-1.23,.071]],.057,3);
      ribbon([[.56,.02,0],[.48,-.35,.03],[.43,-.67,.070],[.46,-.85,.04]],.052,1);
    } else if (id==='baby-comma') {
      // Draw the curl across the real forehead; narrowing the return stroke
      // leaves a small opening inside the comma even in a frontal thumbnail.
      ribbon([[.58,-.50,.003],[.44,-.39,.045],[.35,.09,.073],[.43,.50,.037]],.094,1);
      ribbon([[.47,-.52,.006],[.35,-.41,.06],[.30,.09,.079],[.41,.49,.037]],.045,0);
      for (const [offset,w,tone] of [[-.046,.09,2],[.016,.096,1],[.053,.048,0]])
        ribbon([[.18,.90+offset,.016],[.44,.90+offset,.060],
          [.38,.66+offset,.090],[.14,.65+offset,.056]],w,tone,front);
      ribbon([[.16,.65,.060],[-.025,.62,.092],[-.065,.75,.073],[.064,.77,.032]],.064,1,front);
      ribbon([[.34,.88,.073],[.36,.82,.098],[.32,.75,.105],[.25,.72,.088]],.035,0,front);
    } else if (id==='baby-sweep') {
      for (let i=0;i<7;i++) {
        const root=-1.62+.20*i, end=.18+.165*i;
        ribbon([[.36+.04*i,root,.01],[.53,root+.33,.085],[.80,end-.35,.115],
          [.91+.08*Math.sin(.68*i),end,.018]],.096-.004*i,i===1 || i===5 ? 0 : i===0 || i===4 ? 2 : 1);
      }
      for(const [offset,tone] of [[-.12,0],[.04,1],[.23,0]]) {
        ribbon([[-.41+offset,.83,.012],[-.18+offset,.91,.064],
          [.11+offset,.76,.078],[.28+offset,.61+offset*.10,.012]],.060,tone,front);
      }
      for (const sign of [-1,1])
        ribbon([[.62,sign*2.63,.014],[.79,sign*2.32,.051],[1.20,sign*2.02,.049],
          [1.43,sign*1.86,.014]],.082,1);
    } else if (id==='baby-cloud') {
      // Short open curls sit on a shallow undercoat. Staggered arcs break up
      // the outer contour without making a ring of equally spaced beads.
      for (const [p,count,phase] of [[.18,4,-.20],[.59,7,.34],[.94,9,-.14],[1.23,8,.31]]) {
        for(let i=0;i<count;i++) {
          const a=turn*(i+phase)/count, root=p+.055*Math.sin(a*3+p);
          if (Math.cos(root)<capEdge(id,a)-.04) continue;
          stroke(t=>[root+.21*t-.12*Math.sin(Math.PI*t),
            a+.35*Math.sin(Math.PI*t)+.15*t,
            .016+(.086+.024*Math.cos(3*a))*Math.sin(Math.PI*t)],
          .089+.027*(1+Math.cos(i*2.2+p))*.5,i%4===1 ? 0 : i%4===3 ? 2 : 1);
        }
      }
    } else if (id==='baby-whorl') {
      // The off-centre part remains visible between ribbons that spiral out
      // across the crown; the ends follow the nape on the far side.
      for(let i=0;i<7;i++) {
        const a=turn*i/7, length=.70-.14*Math.cos(a+1.2);
        stroke(t=>{
          const r=.055+length*t, twist=a+2.4*t-.32*t*t;
          const x=-.24+r*Math.cos(twist), y=-.12+r*Math.sin(twist);
          return [Math.hypot(x,y),Math.atan2(y,x),.005+.037*Math.sin(Math.PI*t)];
        },.046+.010*(i%3),i===1 || i===5 ? 1 : i===3 ? 0 : 3,9);
      }
    } else if (id==='baby-puffs') {
      for(const sign of [-1,1])
        ribbon([[.41,sign*.72,.005],[.46,sign*.98,.040],[.57,sign*1.42,.059],
          [.73,sign*1.76,.015]],.070,1);
    }
    return strokes;
  }
  function puffs(project,fit) {
    const tufts=[];
    // Joined rounded tufts sit directly on the scalp. The smaller lobes
    // overlap the base so there is no stalk between a puff and the head.
    for (const side of [-1,1]) {
      const [x,y,z]=project(.72,side*1.88,0);
      for (const [u,v,h,rx,ry,rz,tone] of [
        [0,.05,.025,.21,.18,.20,2],[-.01,.14,.115,.19,.185,.164,1],
        [-.055,.085,.192,.134,.136,.117,1],[.079,.108,.158,.123,.125,.113,0],
        [-.09,.19,.09,.119,.114,.112,1]
      ]) tufts.push({center:[x+u*fit.rx,y+side*v*fit.ry,z+h*fit.rz],
        size:[rx*fit.rx,ry*fit.ry,rz*fit.rz],tone});
    }
    return tufts;
  }
  return { styles, choices, group, capEdge, strands, puffs };
})();
