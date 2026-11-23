// A painted plan of the island is projected onto the ground. Scenery is
// ordered by its roots so a walker can pass in front of or behind each prop.
const hikerTrail = (() => {
  const tau = Math.PI * 2;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const mix = (a, b, t) => a + (b - a) * t;
  const mod = (x, n) => (x % n + n) % n;
  function hash(x, y, seed = 0) {
    let n = Math.imul(x + 1249, 374761393) ^ Math.imul(y - 793, 668265263) ^ Math.imul(seed, 19349663);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function noise(x, y, spacing, seed) {
    const xx = x / spacing, yy = y / spacing, i = Math.floor(xx), j = Math.floor(yy);
    const u = xx - i, v = yy - j, s = u*u*(3-2*u), t = v*v*(3-2*v);
    return mix(mix(hash(i,j,seed),hash(i+1,j,seed),s),mix(hash(i,j+1,seed),hash(i+1,j+1,seed),s),t);
  }
  function makeCanvas(width, height) {
    const image = document.createElement('canvas');
    image.width = width; image.height = height;
    return image;
  }
  // Integer spans retain clusters of solid pixels when art is enlarged.
  function shape(ctx, pts, color) {
    let top=Infinity, bottom=-Infinity;
    for (const p of pts) { top=Math.min(top,p[1]); bottom=Math.max(bottom,p[1]); }
    ctx.fillStyle=color;
    for(let y=Math.ceil(top-.5); y<bottom-.5; y++) {
      const cross=[], line=y+.5;
      for(let i=0,j=pts.length-1;i<pts.length;j=i++) {
        const a=pts[i], b=pts[j];
        if((a[1]>line)!==(b[1]>line)) cross.push(a[0]+(line-a[1])*(b[0]-a[0])/(b[1]-a[1]));
      }
      cross.sort((a,b)=>a-b);
      for(let i=0;i+1<cross.length;i+=2) {
        const x=Math.ceil(cross[i]-.5), end=Math.ceil(cross[i+1]-.5);
        if(end>x) ctx.fillRect(x,y,end-x,1);
      }
    }
  }
  function pixelLine(ctx, x0, y0, x1, y1, color, width=1) {
    x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
    const dx=Math.abs(x1-x0), dy=-Math.abs(y1-y0), sx=x0<x1?1:-1, sy=y0<y1?1:-1;
    let err=dx+dy;
    ctx.fillStyle=color;
    for(;;) {
      ctx.fillRect(x0,y0,width,width);
      if(x0===x1 && y0===y1) break;
      const d=2*err;
      if(d>=dy) {err+=dy;x0+=sx;}
      if(d<=dx) {err+=dx;y0+=sy;}
    }
  }
  function oval(ctx,x,y,rx,ry,color) {
    ctx.fillStyle=color;
    for(let row=Math.floor(y-ry);row<=Math.ceil(y+ry);row++) {
      const v=(row+.5-y)/ry;
      if(Math.abs(v)>=1) continue;
      const dx=rx*Math.sqrt(1-v*v), left=Math.ceil(x-dx-.5), right=Math.ceil(x+dx-.5);
      ctx.fillRect(left,row,right-left,1);
    }
  }
  function rgb(a,b,t) { return 'rgb('+a.map((v,i)=>Math.round(mix(v,b[i],t))).join(',')+')'; }

  const panoW=1280, panoH=208;
  function paintPanorama() {
    const image=makeCanvas(panoW,panoH), g=image.getContext('2d');
    for(let y=0;y<panoH;y++) {
      g.fillStyle=y<114 ? rgb([133,183,196],[232,226,188],Math.min(1,y/114)) :
        rgb([167,195,178],[91,146,142],Math.min(1,(y-114)/94));
      g.fillRect(0,y,panoW,1);
    }
    // Clouds have flat shaded undersides and a separate bank of light above.
    function cloud(x,y,s,seed) {
      for(let j=0;j<8;j++) {
        const dx=(j-3.5)*6*s, r=(4+hash(j,1,seed)*5)*s;
        oval(g,x+dx,y-1.5*s*Math.sin(j*.55),r*1.9,r*.57,'#d3d9bd');
      }
      for(let j=0;j<7;j++) {
        const dx=(j-3)*6*s, r=(4+hash(j,1,seed)*4)*s;
        oval(g,x+dx,y-3*s-(3+3*Math.cos((j-3)*.8))*s,r*1.7,r*.65,'#f2edd2');
      }
    }
    [[70,25,.9],[228,42,1.6],[333,17,.8],[505,34,1.3],[657,20,.8],[780,48,1.1],
      [855,24,1.4],[1070,35,1.1],[1200,16,.98]].forEach(([x,y,s],i)=>cloud(x,y,s,i+4));
    // Layered painted ridgelines form a seamless panorama as the camera turns.
    for(let x=0;x<panoW;x++) {
      const t=x/panoW*tau;
      const top=Math.round(74+11*Math.sin(4*t+.7)+6*Math.sin(9*t)+5*Math.sin(16*t+1)+2*Math.sin(53*t));
      g.fillStyle='#b5c7bc';g.fillRect(x,top,1,112-top);
    }
    const peaks=[[45,72,154,45],[157,57,163,64],[310,78,153,50],[415,43,165,76],[573,73,161,52],
      [681,62,143,57],[814,74,161,52],[957,48,179,72],[1100,68,150,57],[1231,51,153,69]];
    function peak(cx, peakY, breadth, height, seed) {
      const half=breadth/2, bottom=peakY+height;
      const left=cx-half, right=cx+half;
      for(let x=Math.floor(left);x<=right;x++) {
        if(x<0||x>=panoW) continue;
        const u=(x-cx)/half, au=Math.abs(u);
        const ridge=peakY+height*(au*.85+au*au*.13)
          + (noise(x,seed,8,11)-.5)*6*Math.min(1,au*6) + Math.sin(au*13+seed)*au*4;
        const y0=Math.round(ridge);
        for(let y=y0;y<=Math.min(128,bottom+5);y++) {
          const fall=y-peakY, face=(x-cx)-fall*.13-2.4*Math.sin(fall*.21+seed);
          const seam=face + 5*Math.sin(fall*.15+u*3);
          let color=face>1 ? '#849eaa' : '#a0b3ae';
          if(face>1 && seam>fall*.32+7) color='#91a9ac';
          if(face<0 && -face>fall*.48+3) color='#b1bcad';
          if(fall>height*(.62+.08*Math.sin(u*8+seed))) color=face>0?'#95aaa8':'#a6b6ab';
          const snowLine=height*(.23+.16*Math.max(0,1-au*2.2)) + 3*Math.sin(u*19+seed);
          if(fall<snowLine && au<.53) {
            const groove=face>1 && seam<fall*.59+2;
            color=groove?'#becac2':'#e6e4cd';
            if(fall>snowLine-2 && groove) color='#b0bfba';
          }
          g.fillStyle=color;g.fillRect(x,y,1,1);
        }
      }
    }
    for(let repeat=-1;repeat<=1;repeat++) peaks.forEach(([x,y,w,h],i)=>peak(x+panoW*repeat,y,w,h,i+2));
    for(let x=0;x<panoW;x++) {
      const t=x/panoW*tau;
      const far=Math.round(108+5*Math.sin(4*t+.2)+4*Math.sin(9*t)+2*Math.sin(18*t));
      const near=Math.round(118+4*Math.sin(4*t-.9)+3*Math.sin(7*t+.4));
      g.fillStyle='#9ab5a8';g.fillRect(x,far,1,126-far);
      g.fillStyle='#82a59a';g.fillRect(x,near,1,127-near);
      if(hash(x>>1,3,68)>.6) {
        g.fillStyle='#789c92';g.fillRect(x,near-1-Math.floor(hash(x,4)*3),1,5);
      }
      g.fillStyle='#b1c5b2';g.fillRect(x,126,1,2);
    }
    for(let j=0;j<950;j++) {
      const y=128+Math.floor(hash(j,0,33)*80), x=Math.floor(hash(j,1,33)*panoW);
      const width=2+Math.floor(hash(j,2,33)*(y-118)*.2);
      g.globalAlpha=.13+hash(j,3,33)*.24;g.fillStyle=j%4===0?'#658f89':'#d2dbc0';
      g.fillRect(x,y,width,1);
      if(x+width>panoW) g.fillRect(x-panoW,y,width,1);
    }
    g.globalAlpha=1;
    return image;
  }

  const pathY=x=>6*Math.sin((x+16)/34)-2.8*Math.sin((x-8)/21);
  const restSpot={x:-12,y:pathY(-12)+8,width:19,depth:6,height:5,heading:-Math.PI/2};
  const streamX=y=>12+.13*y+6.8*Math.sin(y/25)+1.9*Math.sin(y*.095+.4);
  const streamWidth=y=>7.1+1.6*Math.sin(y*.085+2.3)+.65*Math.sin(y*.18);
  const edge=[[-120,-30],[-112,-53],[-91,-64],[-67,-65],[-51,-58],[-29,-66],[-3,-69],[25,-63],
    [47,-57],[65,-63],[91,-53],[111,-37],[118,-15],[115,2],[107,14],[112,31],[99,47],[77,57],
    [62,64],[38,59],[18,65],[-6,68],[-29,62],[-47,66],[-66,64],[-87,55],[-107,48],[-117,31],[-124,8]];
  const texW=260, texH=154, ox=130, oy=77;
  const trees=[
    [-103,34,47,4],[-92,51,58,1],[-60,52,39,3],[-38,48,28,2],
    [37,53,58,3],[57,51,38,2],[85,32,66,1],[99,19,39,4],
    [-103,-26,48,2],[-89,-37,28,4],[93,-36,40,3],[100,-11,23,2]
  ];
  const rocks=[
    [-113,-6,5,3],[-94,-53,6,7],[-93,-48,3,2],[-76,-41,4,6],[-52,41,7,2],[-44,38,4,1],
    [-40,-35,5,4],[-36,-38,2.5,8],[-24,46,3.5,3],[-9,-36,5,6],[1,-33,3,5],[5,-43,3,4],
    [7,31,4.5,3],[19,45,3.5,6],[24,49,2.5,8],[16,-51,4.5,1],[58,-37,6.2,5],[64,-41,4,7],
    [75,45,6,11],[83,42,3,5],[94,4,4,6]
  ];
  const tent={x:-74,y:28};
  const sign={x:72,y:pathY(72)+14};
  const bridge={x:15,y:pathY(15),length:34,width:20};
  function inside(x,y) {
    let odd=false;
    for(let i=0,j=edge.length-1;i<edge.length;j=i++) {
      const a=edge[i],b=edge[j];
      if((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) odd=!odd;
    }
    return odd;
  }
  const grass=['#819761','#91a56a','#a0af70','#adba7b','#96aa6d','#849e68'];
  const dirt=['#d1b780','#ddc591','#c4a975','#e3cc98'];
  const water=['#538f8c','#609f98','#71afa3','#89bfb0','#a2cabe'];
  function plan() {
    const top=makeCanvas(texW,texH), g=top.getContext('2d',{willReadFrequently:true});
    const borders=Array.from({length:8},()=>makeCanvas(texW,texH));
    const sideCtx=borders.map(a=>a.getContext('2d'));
    const cliff=['#515f59','#5f6e65','#758171','#8a9179','#9b9e83','#b2ae8f'];
    for(let row=0;row<texH;row++) for(let col=0;col<texW;col++) {
      const x=col-ox+.5,y=row-oy+.5;
      const wobble=(noise(x,y,8,16)-.5)*3.2;
      if(!inside(x+wobble,y+wobble*.6)) continue;
      const dx=x-streamX(y), river=Math.abs(dx)-streamWidth(y);
      const trail=Math.abs(y-pathY(x))-(7.6+1.7*noise(x,y,10,3));
      const local=noise(x,y,14,22)*.73+noise(x,y,33,28)*.27;
      const grain=hash(col,row,2);
      let color;
      if(river<0) {
        const shore=clamp(1+river/6,0,1), waves=noise(x*.6,y,5,13);
        const band=clamp(Math.floor(shore*3.25+waves*1.8),0,4);
        color=water[band];
        if(river< -2 && grain>.90 && waves>.68) color='#b4d6bd';
      } else if(river<2.6+wobble) {
        color=river<1.1 ? '#b6c3a2' : grain>.76?'#d7c999':'#b5b88a';
      } else if(trail < -.8 + wobble && Math.abs(x)<106+3*wobble) {
        color=dirt[local>.72?3:local>.44?1:0];
        if(grain>.91) color=dirt[2];
      } else if(trail<1.5+wobble && Math.abs(x)<106) {
        color=grain>.52?'#b9af78':'#c5b680';
      } else {
        const shade=local+noise(x,y,4.2,77)*.16;
        color=grass[shade<.40?0:shade<.55?1:shade<.68?2:shade<.79?3:4];
        if(grain>.962) color=grass[5];
      }
      g.fillStyle=color;g.fillRect(col,row,1,1);
      // Only the outline of the stacked rock/soil layers can be seen.
      if(inside(x-6,y)&&inside(x+6,y)&&inside(x,y-6)&&inside(x,y+6)) continue;
      for(let k=0;k<8;k++) {
        const ctx=sideCtx[k];
        if(river<0) {
          const foam=hash(col>>1,row>>1,7)>.65;
          ctx.fillStyle=foam?(k>4?'#c2d9c4':'#96c3b9'):(k>3?'#7db9ad':'#609a98');
        } else if(k===7) ctx.fillStyle='#71894f';
        else if(k===6 && noise(x,y,6,3)>.39) ctx.fillStyle='#92895f';
        else {
          const strata=clamp(Math.floor(noise(x+k*.8,y,5,56)*3.3 + .8*(y<0)+k*.11),0,5);
          ctx.fillStyle=cliff[strata];
        }
        ctx.fillRect(col,row,1,1);
      }
    }
    g.save();g.translate(ox,oy);g.globalCompositeOperation='source-atop';
    for(let j=0;j<470;j++) {
      const x=Math.floor(hash(j,1,177)*242-121),y=Math.floor(hash(j,2,177)*132-66);
      const r=Math.abs(x-streamX(y))-streamWidth(y);
      if(r<-.8) {
        if(j%3===0) {
          const len=2+hash(j,6)*5;
          pixelLine(g,x,y,x+len*.15,y+len,j%2===0?'#91c4ae':'#6eaca3');
        }
      } else if(r>2 && Math.abs(y-pathY(x))>10.5) {
        const n=hash(j,7)>.7?3:2;
        for(let k=0;k<n;k++) {
          const px=x+Math.floor(hash(j,k,81)*4),py=y+Math.floor(hash(j,k,33)*3);
          g.fillStyle=k===0?'#82975f':'#b6c384';g.fillRect(px,py,2,1);
        }
      } else if(r>4 && Math.abs(y-pathY(x))<7.1 && j%3===0) {
        g.fillStyle='#ab986d';g.fillRect(x,y,2,1);g.fillStyle='#e6d1a4';g.fillRect(x,y-1,1,1);
      }
    }
    // Broken elongated shadows give the plants contact with the painted ground.
    for(const [x,y,h] of trees) {
      g.globalAlpha=.24;
      shape(g,[[x-3,y-2],[x+4,y-1],[x+h*.38,y+h*.18],[x+h*.52,y+h*.28],[x+h*.21,y+h*.22]],'#3c6962');
      oval(g,x+2,y+1,h*.19,h*.10,'#597a58');
    }
    for(const [x,y,r] of rocks) oval(g,x+r*.48,y+r*.25,r*.97,r*.55,'#6e855e');
    g.globalAlpha=.18;oval(g,restSpot.x+.8,restSpot.y+.6,9.3,2.6,'#597554');
    g.globalAlpha=.27;oval(g,tent.x+6,tent.y+4,20,9,'#597554');g.globalAlpha=1;
    // Two joists can be seen through narrow seams in the footbridge.
    const x0=bridge.x-bridge.length/2, y0=bridge.y-bridge.width/2;
    g.fillStyle='#5c5944';g.fillRect(x0,y0+1,bridge.length,3);g.fillRect(x0,y0+bridge.width-4,bridge.length,3);
    let bx=x0, plank=0;
    while(bx<x0+bridge.length) {
      const w=Math.min(3+Number(plank%4===2),x0+bridge.length-bx);
      const c=['#ba925e','#c6a06d','#b78e5b','#d0ab76'][plank%4];
      const by=Math.round(y0)+(plank%5===2?-1:0),h=bridge.width+(plank%3===0?1:0);
      g.fillStyle=c;g.fillRect(bx,by,w,h);
      g.fillStyle='#dfbf83';g.fillRect(bx,by,1,h-1);
      g.fillStyle='#8b714c';g.fillRect(bx+w-1,by,1,h);
      g.fillStyle='#796b51';g.fillRect(bx+1,by+2,1,1);g.fillRect(bx+1,by+h-3,1,1);
      bx+=w;plank++;
    }
    g.restore();
    return {top,borders};
  }

  const pineCache=new Map();
  function pineSprite(seed,yaw,elevation) {
    const direction=mod(Math.round(yaw/tau*24),24), tilt=Math.round(elevation*180/Math.PI/3)*3;
    const key=[seed,direction,tilt].join('/');
    if(pineCache.has(key)) return pineCache.get(key);
    const image=makeCanvas(62,80), g=image.getContext('2d');
    const a=direction*tau/24,e=tilt*Math.PI/180, ca=Math.cos(a),sa=Math.sin(a),se=Math.sin(e),ce=Math.cos(e);
    const at=(x,y,z)=>[31-sa*x+ca*y,71+se*(ca*x+sa*y)-ce*z];
    const bark=at(0,0,0), crown=at(.9,0,46);
    shape(g,[[bark[0]-2.6,bark[1]+.3],[bark[0]+2.3,bark[1]],[crown[0]+.7,crown[1]],[crown[0]-.8,crown[1]]],'#65533c');
    pixelLine(g,bark[0]-.8,bark[1]-1,crown[0]-.2,crown[1],'#a28b5b');
    for(let j=0;j<5;j++) {
      const t=j*tau/5+seed,tip=at(Math.cos(t)*4,Math.sin(t)*4,0);
      pixelLine(g,bark[0],bark[1]-2,tip[0],tip[1],'#786747');
    }
    const mids=seed%2 ? ['#45695c','#557d63','#6d916c','#80a079'] : ['#416560','#517765','#668a6e','#779b79'];
    const low=seed%2?'#38594f':'#365750';
    const rows=[[18.8,18],[25.2,17.4],[32.5,15.4],[40,12.6],[46.7,10.1],[52.4,7.4],[57.9,4.8],[61.2,2.6]];
    rows.forEach(([height,spread],tier)=>{
      const count=tier<4?11:tier<6?9:7, branches=[];
      for(let j=0;j<count;j++) {
        const angle=(j + .35*(tier%2)+hash(seed,tier,8)*.52)*tau/count;
        const c=Math.cos(angle),s=Math.sin(angle),radius=spread*(.87+.25*hash(j,tier,seed+20));
        branches.push({c,s,r:radius,k:j,depth:ca*c+sa*s});
      }
      branches.sort((l,r)=>l.depth-r.depth);
      for(const b of branches) {
        const {c,s,r,k}=b, width=r*(.39+.06*hash(k,tier,18)), drop=r*.25;
        const lift=height*.025*hash(seed,47);
        function p(t,w,h) {
          return at(c*t*r-s*w*width+lift,s*t*r+c*w*width,height+h-drop*t);
        }
        const root=p(.01,0,r*.47), tip=p(1.02,.04,-.5);
        const points=[root,p(.30,-.69,r*.18),p(.52,-.91,.55),p(.55,-.65,.80),p(.79,-.74,-.3),
          p(.75,-.4,.25),tip,p(.82,.36,-.2),p(.84,.52,-.75),p(.60,.62,-.15),
          p(.65,.75,-.65),p(.40,.7,1.2)];
        shape(g,points.map(([x,y])=>[x,y+1]),low);
        const facing=(-.70*c-.64*s+1)/2;
        const tone=clamp(Math.floor(facing*2.5+.6*hash(k,tier,seed)),0,3);
        shape(g,points,mids[tone]);
        if(r>3.5 && facing>.21) {
          shape(g,[p(.12,0,r*.39),p(.43,-.10,r*.09),p(.86,.02,-.45),p(.57,.16,.35),p(.42,.32,r*.13)],
            facing>.70?'#91ad7b':mids[Math.min(3,tone+1)]);
        }
      }
    });
    const high=at(1.5,0,65);pixelLine(g,high[0],high[1],high[0]-.3,high[1]+4,'#749775');
    if(pineCache.size>220) pineCache.delete(pineCache.keys().next().value);
    pineCache.set(key,image);return image;
  }

  function edgeLine(g,v,a,b,color,width=1) {
    const p=v.project(...a),q=v.project(...b);
    pixelLine(g,p.x,p.y,q.x,q.y,color,width);
  }

  // Hard scenery uses the same convention as the hiker: each height has a
  // transparent horizontal pixel drawing. The transverse bitmaps are copies
  // of their rows and columns, which keep the object solid in profile.
  const objectStacks=new Map(), packedColors=new Map();
  const littleEndian=new Uint8Array(new Uint32Array([1]).buffer)[0]===1;
  function pack(color) {
    if(packedColors.has(color)) return packedColors.get(color);
    const n=parseInt(color.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;
    const word=littleEndian?(255<<24)|(b<<16)|(g<<8)|r:(r<<24)|(g<<16)|(b<<8)|255;
    packedColors.set(color,word);return word;
  }
  function stack(key,nx,ny,nz,ink) {
    if(objectStacks.has(key)) return objectStacks.get(key);
    const rows=Array.from({length:nz},()=>new Uint32Array(nx*ny));
    for(let z=0;z<nz;z++) for(let y=0;y<ny;y++) for(let x=0;x<nx;x++) {
      const color=ink(x+.5-nx/2,y+.5-ny/2,z+.5);
      if(color) rows[z][y*nx+x]=pack(color);
    }
    const model={rows,dims:[nx,ny,nz],sheets:[],last:null};
    objectStacks.set(key,model);return model;
  }
  const spans=[[1,2],[0,2],[0,1]], columns=8, pad=2;
  function slices(model,axis) {
    if(model.sheets[axis]) return model.sheets[axis];
    const dims=model.dims,[u,v]=spans[axis],w=dims[u],h=dims[v],tw=w+2*pad,th=h+2*pad;
    const image=makeCanvas(columns*tw,Math.ceil(dims[axis]/columns)*th);
    const c=image.getContext('2d',{willReadFrequently:true}),data=c.createImageData(image.width,image.height);
    const words=new Uint32Array(data.data.buffer);
    for(let z=0;z<dims[2];z++) for(let y=0;y<dims[1];y++) for(let x=0;x<dims[0];x++) {
      const color=model.rows[z][y*dims[0]+x];if(!color)continue;
      const xyz=[x,y,z],k=xyz[axis];
      words[(Math.floor(k/columns)*th+pad+xyz[v])*image.width+(k%columns)*tw+pad+xyz[u]]=color;
    }
    c.putImageData(data,0,0);
    return model.sheets[axis]={image,w,h,tw,th};
  }
  function stampStack(g,v,model,x,y,z=0) {
    const angle=mod(Math.round(v.yaw/tau*120),120),tilt=Math.round(v.elevation*180/Math.PI);
    if(!model.last||model.last.angle!==angle||model.last.tilt!==tilt) {
      const a=angle*tau/120,e=tilt*Math.PI/180,c=Math.cos(a),s=Math.sin(a),ce=Math.cos(e),se=Math.sin(e);
      const axes=[[-s,se*c,ce*c],[c,se*s,ce*s],[0,-ce,se]];
      let axis=0;
      for(let n=1;n<3;n++) if(Math.abs(axes[n][2])>Math.abs(axes[axis][2])) axis=n;
      const dims=model.dims,scale=2,r=Math.ceil(Math.hypot(dims[0],dims[1])/2)+2;
      const bx=r*scale+2,by=Math.ceil((dims[2]*ce+r*Math.abs(se))*scale)+3;
      const image=makeCanvas(bx*2,by+Math.ceil(r*Math.abs(se)*scale)+4);
      const ctx=image.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;
      const uv=spans[axis],u=axes[uv[0]],vv=axes[uv[1]],normal=axes[axis],source=slices(model,axis);
      const tx=bx-scale*(axes[0][0]*dims[0]+axes[1][0]*dims[1])/2;
      const ty=by-scale*(axes[0][1]*dims[0]+axes[1][1]*dims[1])/2;
      const samples=Math.max(1,Math.ceil(Math.hypot(normal[0],normal[1])*scale*1.55));
      for(let pass=0;pass<dims[axis];pass++) {
        const k=normal[2]>=0?pass:dims[axis]-1-pass;
        for(let j=0;j<samples;j++) {
          const depth=k+((normal[2]>=0?j:samples-1-j)+.5)/samples;
          ctx.setTransform(scale*u[0],scale*u[1],scale*vv[0],scale*vv[1],tx+depth*scale*normal[0],ty+depth*scale*normal[1]);
          ctx.drawImage(source.image,(k%columns)*source.tw+pad,Math.floor(k/columns)*source.th+pad,source.w,source.h,
            0,0,source.w,source.h);
        }
      }
      model.last={image,bx,by,angle,tilt};
    }
    const {image,bx,by}=model.last,p=v.project(x,y,z),ratio=v.scale/2;
    g.save();g.imageSmoothingEnabled=false;
    g.drawImage(image,Math.round(p.x-bx*ratio),Math.round(p.y-by*ratio),Math.max(1,Math.round(image.width*ratio)),Math.max(1,Math.round(image.height*ratio)));
    g.restore();
  }
  function timber(g,v,x,y,w,d,h) {
    const key='wood/'+w+'/'+d+'/'+h;
    const model=stack(key,Math.ceil(w)+2,Math.ceil(d)+2,Math.ceil(h),(px,py,z)=>{
      if(Math.abs(px)>w/2||Math.abs(py)>d/2||z>h) return;
      if(z>h-1.05) return '#d7b17a';
      return py<-.2?'#9c7851':px>.3?'#ad8a5d':'#826644';
    });
    stampStack(g,v,model,x,y);
  }
  function boulder(g,v,x,y,r,seed,z0=0) {
    const h=Math.max(1.5,r*(.65+.22*hash(seed,4))),diameter=Math.ceil(r*2.4)+2;
    const model=stack('rock/'+r+'/'+seed,diameter,diameter,Math.ceil(h),(px,py,z)=>{
      const u=px/r,vv=py/(r*.86),a=Math.atan2(vv,u);
      const rim=.95+.08*Math.cos(3*a+seed)+.05*Math.sin(5*a+seed*.7);
      const reach=Math.hypot(u,vv)/rim;
      const roof=h*(.94+.075*u-.08*vv);
      if(z>roof || reach>1-.42*(z/roof)**1.6) return;
      if(z>=roof-.9 || (z>h*.64 && reach<.54)) return seed%4===2?'#b4b68d':'#bebda2';
      if(-u+.76*vv>.64) return '#acaf97';
      if(-u+.76*vv>.08) return '#969e89';
      return -u+.76*vv>-.51?'#7e8b7c':'#697b72';
    });
    stampStack(g,v,model,x,y,z0);
  }
  function campsite(g,v) {
    const {x,y}=tent,L=15,W=10,H=21;
    for(const side of [-1,1]) for(const end of [-1,1]) {
      const px=x+end*(L+3),py=y+side*(W+3.3);
      edgeLine(g,v,[x+end*(L-.8),y+side*(W-1),4],[px,py,0],'#9d8b67');
      edgeLine(g,v,[px,py,0],[px+.5,py,2.3],'#685e48');
    }
    const model=stack('tent',34,24,22,(px,py,z)=>{
      const ridge=H-.7*(1-Math.min(1,Math.abs(px)/L)),width=W*(1-z/ridge)+.38;
      const end=L+.6*(1-z/ridge);
      if(z>ridge||Math.abs(px)>end||Math.abs(py)>width) return;
      const opening=6.15*Math.max(0,1-z/(ridge-2.2));
      if(px>end-3.4 && Math.abs(py-.45)<opening) return;
      if(opening>.7 && px>end-4.1 && Math.abs(py-.45)<opening+.65) return '#504d41';
      if(z>ridge-1.4) return '#f1c984';
      if(Math.abs(py)>width-1.3) {
        if(z<1.6) return py<0?'#9b724e':'#b18b59';
        const seam=Math.min(Math.abs(px+6.4),Math.abs(px-6.6));
        if(seam<.65) return py<0?'#dca064':'#efbc77';
        return py<0?'#c58a53':'#e5ad6b';
      }
      if(px>end-1.8) return Math.abs(py-.45)<opening+1.46?'#ecc282':'#d69a5c';
      if(px< -end+1.8) return Math.abs(py)<.6?'#9c764d':'#bc8655';
      return py<0?'#c58a53':'#dd9f63';
    });
    stampStack(g,v,model,x,y);
  }
  function waymark(g,v) {
    const model=stack('waymark',20,8,21,(x,y,z)=>{
      for(const [mid,dir] of [[13,-1],[18,1]]) {
        const along=dir*x,h=Math.abs(z-mid);
        if(h>2.2 || along< -4.1 || along>8.3-1.33*h || Math.abs(y-.4)>1.55) continue;
        if(h<.7 && along>-.8 && along<3.3) return dir>0?'#efdbac':'#ddbd8a';
        if(z>mid+1.1) return '#d5b179';
        if(z<mid-1.3) return '#93734a';
        return dir>0?'#c99e62':'#af8957';
      }
      if(Math.abs(x)<1.55 && Math.abs(y)<1.35 && z<20.2) return z>19?'#d7b17a':y<0?'#9a7750':'#826343';
    });
    stampStack(g,v,model,sign.x,sign.y);
  }

  function restBench(g,v) {
    const model=stack('rest-bench',restSpot.width,restSpot.depth,restSpot.height,(x,y,z)=>{
      const u=Math.abs(x),w=Math.abs(y);
      if(z>=3) {
        if(u===9 && w===2.5) return;
        if(z<4) return y<0?'#9c7851':'#826644';
        if(y===.5) return '#a48156';
        if(u===6 && w===1.5) return '#796b51';
        if(u===9) return '#c19965';
        if((y===-1.5 && x>-4 && x<2) || (y===1.5 && x>2 && x<6)) return '#be9965';
        return y<0?'#ddba80':'#cda56f';
      }
      if(u>=6 && u<=7 && w>=1.5) return y<0?'#a48156':'#816446';
      if(z>=2 && u<=6 && w===.5) return '#8e704b';
    });
    stampStack(g,v,model,restSpot.x,restSpot.y);
  }

  const herbs=[];
  for(let j=0;j<190 && herbs.length<62;j++) {
    const x=hash(j,2,88)*214-107, y=hash(j,3,89)*110-55;
    if(!inside(x,y)||Math.abs(y-pathY(x))<11||Math.abs(x-streamX(y))<streamWidth(y)+2.8) continue;
    if(Math.abs(x-tent.x)<17&&Math.abs(y-tent.y)<13)continue;
    herbs.push({x,y,seed:j,flower:hash(j,7,33)>.58});
  }
  function tuft(g,v,plant) {
    const {x,y,seed,flower}=plant;
    for(let k=0;k<5;k++) {
      const px=x+(hash(k,seed,8)-.5)*4.7,py=y+(hash(k,seed,18)-.5)*3.7;
      const h=1.6+hash(k,seed,83)*(flower?5:3.4);
      const tip=[px+(hash(k,seed,9)-.5)*2.3,py+.5,h];
      edgeLine(g,v,[px,py,0],tip,k%3===0?'#6d8553':'#78945a');
      if(flower&&k%2===0) {
        const p=v.project(...tip),s=Math.max(1,Math.round(v.scale*.87));
        g.fillStyle=seed%3===0?'#f0deb2':'#e5ba68';g.fillRect(Math.round(p.x),Math.round(p.y),s+1,s);
      }
    }
  }

  let panorama,ground;
  function drawGround(g,v) {
    if(!panorama) panorama=paintPanorama();
    if(!ground) ground=plan();
    g.save();g.resetTransform();g.imageSmoothingEnabled=false;
    const ratio=v.height/panoH, repeat=panoW*ratio;
    const center=mod(v.yaw/tau*panoW,panoW);
    let x=Math.round(v.width/2-center*ratio);
    while(x>0) x-=repeat;
    for(let start=x;start<v.width;start+=repeat) {
      g.drawImage(panorama,Math.round(start),0,Math.ceil(repeat),v.height);
    }
    const p=v.project(0,0,0),px=v.project(1,0,0),py=v.project(0,1,0),pz=v.project(0,0,1);
    const xx=px.x-p.x,xy=px.y-p.y,yx=py.x-p.x,yy=py.y-p.y;
    const originX=p.x-ox*xx-oy*yx,originY=p.y-ox*xy-oy*yy;
    for(let k=0;k<8;k++) {
      const z=k-8;
      g.setTransform(xx,xy,yx,yy,originX+(pz.x-p.x)*z,originY+(pz.y-p.y)*z);
      g.drawImage(ground.borders[k],0,0);
    }
    g.setTransform(xx,xy,yx,yy,originX,originY);g.drawImage(ground.top,0,0);
    g.restore();
  }
  function props(v) {
    const list=[];
    const entry=(x,y,height,paint)=>list.push({baseX:x,baseY:y,height,depth:v.project(x,y,0).depth,paint});
    for(const [x,y,h,seed] of trees) {
      entry(x,y,h,g=>{
        const art=pineSprite(seed,v.yaw,v.elevation),p=v.project(x,y,0),s=v.scale*h/65;
        g.save();g.imageSmoothingEnabled=false;
        g.drawImage(art,Math.round(p.x-31*s),Math.round(p.y-71*s),Math.round(art.width*s),Math.round(art.height*s));
        g.restore();
      });
    }
    for(const [x,y,r,seed] of rocks) entry(x,y,r,g=>boulder(g,v,x,y,r,seed));
    for(const herb of herbs) entry(herb.x,herb.y,6,g=>tuft(g,v,herb));
    entry(tent.x,tent.y,19,g=>campsite(g,v));
    entry(sign.x,sign.y,20,g=>waymark(g,v));
    list.push({seat:restSpot,baseX:restSpot.x,baseY:restSpot.y,height:restSpot.height,
      depth:v.project(restSpot.x,restSpot.y,0).depth,paint:g=>restBench(g,v)});
    const cairnX=80,cairnY=pathY(80)-12;
    entry(cairnX,cairnY,9,g=>{
      boulder(g,v,cairnX,cairnY,5.4,66);boulder(g,v,cairnX+.6,cairnY,3.4,19,3.5);boulder(g,v,cairnX+.2,cairnY+.2,2.1,73,5.8);
    });
    for(const side of [-1,1]) {
      const by=bridge.y+side*(bridge.width/2-.1);
      const left=bridge.x-bridge.length/2+1.4,right=bridge.x+bridge.length/2-1.4;
      for(const xx of [left,right]) entry(xx,by,6.2,g=>timber(g,v,xx,by,1.8,1.7,side>0?6.3:3.6));
      if(side>0)entry(bridge.x,by,5.8,g=>{
        edgeLine(g,v,[left,by,5.4],[bridge.x,by,4.2],'#8e7554');
        edgeLine(g,v,[bridge.x,by,4.2],[right,by,5.4],'#8e7554');
      });
    }
    return list;
  }
  return {pathY,drawGround,props,restSpot};
})();
