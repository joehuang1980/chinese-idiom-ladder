/* 3D 羽翅皮克敏（three.js r128）
 * 比例依照參考截圖（正面、兩側、背面、俯視）量測，以「頭寬 = 1」為單位：
 *   頭：寬 1.0 × 高 0.78 × 深 0.94，下半部較寬的扁洋蔥形，粉紅色
 *   眼睛：兩顆藍色亮面大眼睛，各約 0.4，彼此相貼，位在頭的前上方並往前突出（沒有黑眼珠）
 *   莖：長約 0.75，上細下粗，從頭頂往後上方彎；越往上越綠
 *   花苞：約 0.58，綠色蛋形、頂端較淡，底部有綠色萼片
 *   身體：寬 0.52 × 高 0.48，比頭小，有深粉紅色條紋
 *   翅膀：兩片半透明翅膀，每片約 0.57 × 0.33，長在身體背後往兩側張開，有翅脈
 *   手腳：細短，三根手指／三根腳趾
 */
(function(){
  const T=THREE,V=(x,y,z)=>new T.Vector3(x,y,z);
  // 顏色取樣自參考截圖
  const C={pink:0xcf66b4,pinkDark:0xb8449c,blue:0x3f9fdb,green:0x45a83e,greenDark:0x3c9a37,budTop:0xc4e3bd,wing:0xd9dccb,vein:0x9fae8c};
  const mat=(color,o={})=>new T.MeshStandardMaterial(Object.assign({color,roughness:.5,metalness:0},o));
  const vmat=(o={})=>new T.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:.5,metalness:0},o));
  // 在兩點之間放一根圓柱（手腳、手指、腳趾用）
  function limb(a,b,r,m){
    const A=new T.Vector3(...a),B=new T.Vector3(...b),len=A.distanceTo(B);
    const mesh=new T.Mesh(new T.CylinderGeometry(r,r,len,10),m);
    mesh.position.copy(A).add(B).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),B.clone().sub(A).normalize());
    const cap=new T.Mesh(new T.SphereGeometry(r,10,8),m);cap.position.copy(B);
    const g=new T.Group();g.add(mesh,cap);return g;
  }
  // 依照曲線做出上細下粗的莖，並由粉紅漸變成綠色
  function taperTube(curve,segs,radial,rFn,colFn){
    const g=new T.TubeGeometry(curve,segs,1,radial,false),pos=g.attributes.position,cols=[];
    const P=new T.Vector3(),V=new T.Vector3(),col=new T.Color();
    for(let i=0;i<=segs;i++){curve.getPointAt(i/segs,P);const r=rFn(i/segs);colFn(i/segs,col);
      for(let j=0;j<=radial;j++){const k=i*(radial+1)+j;V.fromBufferAttribute(pos,k).sub(P).multiplyScalar(r).add(P);pos.setXYZ(k,V.x,V.y,V.z);cols.push(col.r,col.g,col.b)}}
    g.setAttribute('color',new T.Float32BufferAttribute(cols,3));g.computeVertexNormals();return g;
  }
  function colorize(g,fn){const p=g.attributes.position,cols=[],c=new T.Color();for(let i=0;i<p.count;i++){fn(p.getX(i),p.getY(i),p.getZ(i),c);cols.push(c.r,c.g,c.b)}g.setAttribute('color',new T.Float32BufferAttribute(cols,3));return g}
  function buildWinged(){
    const root=new T.Group(),pinkM=mat(C.pink,{roughness:.42});
    // 頭：扁洋蔥形（rx .5、ry .39、rz .47），下半部稍寬
    const hg=new T.SphereGeometry(1,48,32),hp=hg.attributes.position;
    for(let i=0;i<hp.count;i++){let x=hp.getX(i),y=hp.getY(i),z=hp.getZ(i),w=1+.06*(-y)-.04*y*y;hp.setXYZ(i,x*.5*w,y*.39,z*.47*w)}
    hg.computeVertexNormals();
    const head=new T.Mesh(hg,pinkM);root.add(head);
    // 眼睛：前上方兩顆相貼的藍色亮面大眼睛（直徑約 0.4），沿頭部表面法線往前突出
    const eyeM=mat(C.blue,{roughness:.12,metalness:.1}),E=[];
    [-1,1].forEach(s=>{
      const x=.19*s,y=.2,rx=.5,ry=.39,rz=.47,z=rz*Math.sqrt(Math.max(0,1-(x/rx)**2-(y/ry)**2));
      const eg=new T.SphereGeometry(.2,32,24);eg.scale(1,1,.62);
      const eye=new T.Mesh(eg,eyeM);eye.position.set(x*1.02,y*1.04,z*1.0+.03);
      const n=new T.Vector3(x/rx**2,y/ry**2*.6,z/rz**2).normalize();eye.lookAt(eye.position.clone().add(n));root.add(eye);E.push({p:eye.position.clone(),n});
    });
    // 莖：從頭頂往後上方彎，長約 0.75
    const curve=new T.CatmullRomCurve3([new T.Vector3(0,.3,-.02),new T.Vector3(0,.55,-.06),new T.Vector3(.01,.8,-.16),new T.Vector3(.02,1.02,-.32)]);
    const pinkC=new T.Color(C.pink),greenC=new T.Color(C.green);
    const stem=new T.Mesh(taperTube(curve,40,12,t=>.022+.1*Math.pow(1-t,2.2),(t,c)=>c.copy(pinkC).lerp(greenC,Math.max(0,(t-.62)/.38))),vmat({roughness:.45}));
    root.add(stem);
    // 花苞：綠色蛋形，頂端較淡，底部有萼片；朝向莖的方向
    const bud=new T.Group(),tip=curve.getPointAt(1),tan=curve.getTangentAt(1);
    const bg=new T.SphereGeometry(1,32,24),bp=bg.attributes.position;
    for(let i=0;i<bp.count;i++){let x=bp.getX(i),y=bp.getY(i),z=bp.getZ(i),k=y>0?1-.18*y*y:1;bp.setXYZ(i,x*.27*k,y*.32+.3,z*.27*k)}
    bg.computeVertexNormals();
    const bc1=new T.Color(C.green),bc2=new T.Color(C.budTop);
    bud.add(new T.Mesh(colorize(bg,(x,y,z,c)=>c.copy(bc1).lerp(bc2,Math.min(1,Math.max(0,(y-.18)/.4)))),vmat({roughness:.55})));
    const sepM=mat(C.greenDark,{roughness:.6,side:T.DoubleSide});
    for(let k=0;k<5;k++){const a=k/5*Math.PI*2,lg=new T.SphereGeometry(1,16,12);lg.scale(.11,.2,.025);
      const leaf=new T.Mesh(lg,sepM);leaf.position.set(Math.sin(a)*.21,.2,Math.cos(a)*.21);leaf.rotation.y=a;leaf.rotation.x=-.32;bud.add(leaf)}
    bud.position.copy(tip);bud.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),tan.normalize());root.add(bud);
    // 身體：比頭小，有深色條紋
    const body=new T.SphereGeometry(1,36,28),pb=body.attributes.position;
    for(let i=0;i<pb.count;i++){pb.setXYZ(i,pb.getX(i)*.26,pb.getY(i)*.25,pb.getZ(i)*.25)}
    body.computeVertexNormals();
    const pc=new T.Color(C.pink),pd=new T.Color(C.pinkDark);
    const bodyM=new T.Mesh(colorize(body,(x,y,z,c)=>{const band=(y<-.02&&y>-.08)||(y<-.13&&y>-.18);c.copy(band?pd:pc)}),vmat({roughness:.45}));bodyM.position.set(0,-.6,0);root.add(bodyM);
    // 手：細短、三根手指
    [-1,1].forEach(s=>{
      const sh=[.2*s,-.52,.04],hd=[.31*s,-.7,.08];root.add(limb(sh,hd,.026,pinkM));
      [[-.05,-.07],[0,-.08],[.05,-.06]].forEach(([dx,dy])=>root.add(limb(hd,[hd[0]+dx*s+.015*s,hd[1]+dy,hd[2]+.02],.011,pinkM)));
    });
    // 腳：細短、三根腳趾
    [-1,1].forEach(s=>{
      const top=[.08*s,-.8,0],ft=[.09*s,-.97,.02];root.add(limb(top,ft,.028,pinkM));
      [[-.06,.06],[0,.08],[.06,.05]].forEach(([dx,dz])=>root.add(limb(ft,[ft[0]+dx,ft[1]-.02,ft[2]+dz],.012,pinkM)));
    });
    // 翅膀：半透明，長在身體背後往兩側張開，有翅脈；會輕輕拍動
    const shape=new T.Shape();shape.moveTo(0,0);shape.bezierCurveTo(.13,.2,.45,.22,.58,.09);shape.bezierCurveTo(.64,0,.47,-.13,.26,-.11);shape.bezierCurveTo(.12,-.09,.03,-.04,0,0);
    const wingM=new T.MeshStandardMaterial({color:C.wing,transparent:true,opacity:.86,side:T.DoubleSide,depthWrite:false,roughness:.35});
    const veinM=new T.LineBasicMaterial({color:C.vein,transparent:true,opacity:.9});
    const veins=[[[0,0],[.25,.1],[.5,.12]],[[0,0],[.3,0],[.56,.04]],[[0,0],[.25,-.07],[.42,-.09]],[[.25,.1],[.33,.17]],[[.3,0],[.38,.12]],[[.3,0],[.4,-.08]]];
    const wings=[];
    [-1,1].forEach(s=>{
      const w=new T.Group();w.add(new T.Mesh(new T.ShapeGeometry(shape,24),wingM));w.add(new T.Line(new T.BufferGeometry().setFromPoints(shape.getPoints(40).map(q=>new T.Vector3(q.x,q.y,.001))),veinM));w.scale.setScalar(1.5);
      veins.forEach(v=>w.add(new T.Line(new T.BufferGeometry().setFromPoints(v.map(([x,y])=>new T.Vector3(x,y,.001))),veinM)));
      const pivot=new T.Group();pivot.position.set(.1*s,-.47,-.18);w.rotation.set(-.3,-.8,.02);pivot.scale.x=s;pivot.add(w);root.add(pivot);wings.push(pivot);
    });
    root.userData.wings=wings;
    // 裝備位置：帽子戴在頭頂偏後（前上方是大眼睛）；腮紅、嘴巴在眼睛下方；脖子在頭和身體交接處
    root.userData.anchors={hat:{p:V(0,.3,-.1),s:.95,rx:-.38},eyes:E,eyeR:.2,eyeD:.13,face:[head],cheeks:[[.31,-.06],[-.31,-.06]],mouth:[0,-.12],
      wrap:{c:V(0,0,0),z:.02,mesh:[head],t:.11},clamp:{x:.41,y:-.07,d:.94,top:.39},trunk:[head,bodyM],neckY:-.43,body:[-.43,-.8],hand:{p:V(.31,-.7,.08),s:.75,rx:.6},leaf:{obj:bud,p:tip,tan,s:1},back:{y0:-.4,y1:-.9,r1:.1,s:.85}};
    return root;
  }

  /* 3D 黃皮克敏：比例依照參考截圖（背面、側面、俯視）及黃皮克敏照片量測，以「頭寬 = 1」為單位：
   *   頭：1.0 × 1.0（深 1.05），接近圓形
   *   耳朵：薄三角片，每隻長約 0.6（尖端到頭中心約 1.0）、根部高約 0.55；上緣幾乎水平、尖端略朝上，
   *         內側桃粉色、朝向前方
   *   眼睛：白色小眼睛＋黑眼珠，各約 0.22，左右分開（中心距頭中心約 ±0.2），在頭正面略高於中線
   *   莖：長，底部像圓錐一樣張開，往上越細並往後彎，上段轉為綠色
   *   花苞：很大，寬約 1.0、高約 1.15，綠色、頂端淡灰白，底部有萼片
   *   頭＋脖子＋身體一體成形、平順相連；脖子寬約 0.4；身體寬約 0.64，脖子＋身體長約 0.82（約為頭高的 0.84 倍）
   *   手：細，往外下方約 45 度；腳：短，約 0.35，三根腳趾 */
  function buildYellow(){
    const Y={body:0xe6bf26,ear:0xf0b47e,stemTop:0x5f8f35,bud:0x4f9e45,budTop:0xbcc4b6,sepal:0x5aa64a};
    const root=new T.Group(),ym=mat(Y.body,{roughness:.45});
    // 頭＋脖子＋身體：一條連續的輪廓旋轉成形，頭與脖子之間平順相連、沒有接縫。
    // 頭寬 1.0（中心 y=0）；脖子最細處寬約 0.4；脖子＋身體長約 0.82（依照片：約為頭高的 0.84 倍）
    const prof=new T.SplineCurve([[.001,-1.34],[.15,-1.32],[.27,-1.25],[.32,-1.13],[.31,-1.0],[.27,-.87],[.22,-.74],[.205,-.64],[.235,-.54],[.32,-.45],[.41,-.34],[.475,-.18],[.5,0],[.48,.15],[.42,.29],[.32,.4],[.2,.47],[.06,.5]].map(([r,y])=>new T.Vector2(r,y))).getPoints(90);
    const trunk=new T.Mesh(new T.LatheGeometry(prof,48),ym);root.add(trunk);
    // 耳朵：外側黃色、內側桃粉色，朝前方；上緣幾乎水平、尖端略朝上
    const es=new T.Shape();es.moveTo(0,.26);es.lineTo(.63,.32);es.quadraticCurveTo(.3,-.1,0,-.3);es.closePath();
    const eg=new T.ExtrudeGeometry(es,{depth:.035,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2,curveSegments:16});
    const is=new T.Shape();is.moveTo(.05,.19);is.lineTo(.52,.26);is.quadraticCurveTo(.26,-.06,.05,-.21);is.closePath();
    const ig=new T.ShapeGeometry(is,16),im=mat(Y.ear,{roughness:.6,side:T.DoubleSide});
    [-1,1].forEach(s=>{
      const ear=new T.Group();ear.add(new T.Mesh(eg,mat(Y.body,{roughness:.45,side:T.DoubleSide})));
      const inner=new T.Mesh(ig,im);inner.position.z=.05;ear.add(inner);
      ear.position.set(.4*s,.02,-.03);ear.rotation.y=s>0?-.28:.28;ear.scale.x=s;root.add(ear);
    });
    // 眼睛：白色＋黑眼珠，沿頭部表面法線
    const wm=mat(0xffffff,{roughness:.25}),bm=mat(0x111111,{roughness:.2}),E=[];
    [-1,1].forEach(s=>{
      const x=.2*s,y=.06,z=.5*Math.sqrt(1-(x/.5)**2-(y/.5)**2),n=new T.Vector3(x,y,z).normalize();
      const eye=new T.Mesh(new T.SphereGeometry(.11,24,16),wm);eye.position.set(x,y,z).addScaledVector(n,.02);root.add(eye);E.push({p:eye.position.clone(),n});
      const pu=new T.Mesh(new T.SphereGeometry(.058,16,12),bm);pu.position.copy(eye.position).addScaledVector(n,.07);root.add(pu);
    });
    // 莖：底部像圓錐張開，往上越細、往後彎，上段轉為綠色
    const curve=new T.CatmullRomCurve3([new T.Vector3(0,.42,0),new T.Vector3(0,1.0,-.05),new T.Vector3(0,1.5,-.25),new T.Vector3(0,1.82,-.55)]);
    const yc=new T.Color(Y.body),gc=new T.Color(Y.stemTop);
    root.add(new T.Mesh(taperTube(curve,40,14,t=>.026+.24*Math.pow(1-t,5)+.025*(1-t),(t,c)=>c.copy(yc).lerp(gc,Math.max(0,(t-.68)/.32))),vmat({roughness:.45})));
    // 花苞：很大（寬約 1.0、高約 1.15），綠色、頂端淡灰白，底部有萼片
    const bud=new T.Group(),tip=curve.getPointAt(1),tan=curve.getTangentAt(1);
    const bg=new T.SphereGeometry(1,32,24),bp=bg.attributes.position;
    for(let i=0;i<bp.count;i++){let x=bp.getX(i),y=bp.getY(i),z=bp.getZ(i),k=y>0?1-.25*y*y:1-.05*y*y;bp.setXYZ(i,x*.46*k,y*.66+.62,z*.46*k)}
    bg.computeVertexNormals();
    const b1=new T.Color(Y.bud),b2=new T.Color(Y.budTop);
    bud.add(new T.Mesh(colorize(bg,(x,y,z,c)=>c.copy(b1).lerp(b2,Math.min(1,Math.max(0,(y-.85)/.4)))),vmat({roughness:.55})));
    const sm=mat(Y.sepal,{roughness:.6,side:T.DoubleSide});
    for(let k=0;k<5;k++){const a=k/5*Math.PI*2,lg=new T.SphereGeometry(1,16,12);lg.scale(.19,.32,.03);
      const leaf=new T.Mesh(lg,sm);leaf.position.set(Math.sin(a)*.36,.36,Math.cos(a)*.36);leaf.rotation.y=a;leaf.rotation.x=-.35;bud.add(leaf)}
    bud.position.copy(tip);bud.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),tan.normalize());root.add(bud);
    // 手：細，往外下方約 45 度，三根手指
    [-1,1].forEach(s=>{
      const sh=[.25*s,-.82,0],hd=[.64*s,-1.15,.02];root.add(limb(sh,hd,.032,ym));
      [[-.04,-.09],[.03,-.1],[.08,-.06]].forEach(([dx,dy])=>root.add(limb(hd,[hd[0]+dx*s,hd[1]+dy,hd[2]+.02],.014,ym)));
    });
    // 腳：短，三根腳趾
    [-1,1].forEach(s=>{
      const top=[.16*s,-1.24,0],ft=[.17*s,-1.6,.02];root.add(limb(top,ft,.075,ym));
      [[-.1,.09],[0,.12],[.1,.08]].forEach(([dx,dz])=>root.add(limb(ft,[ft[0]+dx,ft[1]-.04,ft[2]+dz],.025,ym)));
    });
    root.userData.anchors={hat:{p:V(0,.33,0),s:1.05,rx:0},eyes:E,eyeR:.11,eyeD:.135,face:[trunk],cheeks:[[.29,-.12],[-.29,-.12]],mouth:[0,-.16],
      wrap:{c:V(0,-.02,0),z:.04,rx:.5,ry:.53,t:.11},clamp:{x:.3,y:.08,d:1,top:.5},trunk:[trunk],neckY:-.64,body:[-.6,-1.27],hand:{p:V(.64,-1.15,.02),s:1,rx:.2},leaf:{obj:bud,p:tip,tan,s:1.75},back:{y0:-.62,y1:-1.5,r1:.14,s:1}};
    return root;
  }

  /* 3D 岩石皮克敏：比例依照參考截圖（正面、斜前、斜後、背面）量測，以截圖中 400 像素為 1 個單位：
   *   身體：一整塊不規則多面體岩石，寬 0.9 × 高 1.04 × 深 0.82（不含手臂，寬:高 ≈ 0.87），上方較窄、最寬處在由上往下約 57%
   *   眼睛：很小的白色圓眼睛，各約 0.14（岩石寬的 14%），中心在左右 ±0.17、由頂端往下約 15%；黑眼珠約眼睛的 0.44
   *   莖：從頂端長出，往右上方彎；下段灰色、上段轉綠，下粗上細
   *   頭上：綠色蛋形花苞（寬約 0.4、高約 0.56），頂端較淡，底部有萼片
   *   手：很細的淺灰色手臂，從兩側由上往下約 57% 處伸出，往外下方；腳：短，約 0.19，左右 ±0.12 */
  function buildRock(){
    const K={lit:0x8a8e94,side:0x46474b,under:0x45493f,arm:0xc4c8cc,leg:0x7a8088,stem:0x8a909a,stemTop:0x6aa04a,calyx:0x5aa64a,bud:0x4f9e45,budTop:0xd6d7d2};
    const root=new T.Group();
    // 岩石：十二面體依量測尺寸縮放，再讓每個頂點稍微不規則
    const g=new T.DodecahedronGeometry(1,0);g.rotateY(Math.PI/2);
    const p=g.attributes.position,seen={},hash=(x,y,z)=>Math.sin(x*12.9898+y*78.233+z*37.719)*43758.5453%1;
    g.computeBoundingBox();const b=g.boundingBox,sx=.9/(b.max.x-b.min.x),sy=1.12/(b.max.y-b.min.y),sz=.82/(b.max.z-b.min.z);
    for(let i=0;i<p.count;i++){
      let x=p.getX(i),y=p.getY(i),z=p.getZ(i),key=x.toFixed(3)+','+y.toFixed(3)+','+z.toFixed(3);
      if(!seen[key]){const h=hash(x,y,z);seen[key]=[1+.04*h,.03*hash(z,x,y)]}
      const [jit,dy]=seen[key];x*=sx*jit;z*=sz*jit;y=y*sy+dy;if(y<-.4)y=-.4+(y+.4)*.45;
      const w=1-.16*Math.pow((y+.07)/.6,2);x*=w;z*=w;p.setXYZ(i,x,y,z)}
    g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
    const cols=[],n=new T.Vector3(),A=new T.Vector3(),B=new T.Vector3(),Cc=new T.Vector3(),cl=new T.Color(K.lit),cs=new T.Color(K.side),cu=new T.Color(K.under),c=new T.Color();
    for(let i=0;i<p.count;i+=3){A.fromBufferAttribute(p,i);B.fromBufferAttribute(p,i+1);Cc.fromBufferAttribute(p,i+2);n.subVectors(Cc,B).cross(A.clone().sub(B)).normalize();
      if(n.y<-.35)c.copy(cu);else c.copy(cs).lerp(cl,Math.min(1,Math.max(0,n.y*.7+n.z*.45+.1)));
      const v=1+.08*hash(A.x,A.y,A.z);c.multiplyScalar(v);for(let k=0;k<3;k++)cols.push(c.r,c.g,c.b)}
    g.setAttribute('color',new T.Float32BufferAttribute(cols,3));
    const rock=new T.Mesh(g,vmat({flatShading:true,roughness:.85}));root.add(rock);rock.updateMatrixWorld();
    const box=new T.Box3().setFromObject(rock),top=box.max.y,H=box.max.y-box.min.y;
    // 眼睛：很小（約岩石寬 14%），貼在上方的面上；用射線找出岩石表面的位置
    const ray=new T.Raycaster(),wm=mat(0xffffff,{roughness:.25}),bm=mat(0x151515,{roughness:.2}),E=[];
    [-1,1].forEach(s=>{
      ray.set(new T.Vector3(.174*s,top-.15*H,3),new T.Vector3(0,0,-1));const hit=ray.intersectObject(rock)[0];if(!hit)return;
      const nn=hit.face.normal.clone().transformDirection(rock.matrixWorld).lerp(new T.Vector3(0,0,1),.6).normalize();
      const eye=new T.Mesh(new T.SphereGeometry(.069,24,16),wm);eye.position.copy(hit.point).addScaledVector(nn,.018);root.add(eye);E.push({p:eye.position.clone(),n:nn});
      const pu=new T.Mesh(new T.SphereGeometry(.031,16,12),bm);pu.position.copy(eye.position).addScaledVector(nn,.052).add(new T.Vector3(-.008*s,-.006,0));root.add(pu);
    });
    // 莖：從頂端長出、往右上方彎；下段灰色、上段轉綠
    const curve=new T.CatmullRomCurve3([new T.Vector3(0,top-.06,0),new T.Vector3(0,top+.22,0),new T.Vector3(.08,top+.44,.03),new T.Vector3(.25,top+.62,.06)]);
    const sc1=new T.Color(K.stem),sc2=new T.Color(K.stemTop);
    root.add(new T.Mesh(taperTube(curve,32,12,t=>.016+.05*Math.pow(1-t,1.6),(t,cc)=>cc.copy(sc1).lerp(sc2,Math.max(0,(t-.5)/.5))),vmat({roughness:.4,metalness:.15})));
    // 花苞：綠色蛋形、頂端較淡，底部有萼片（與黃皮克敏同樣式），朝向莖的方向
    const tip=curve.getPointAt(1),tan=curve.getTangentAt(1).normalize(),bud=new T.Group();
    const bg=new T.SphereGeometry(1,28,20),bp=bg.attributes.position;
    for(let i=0;i<bp.count;i++){let x=bp.getX(i),y=bp.getY(i),z=bp.getZ(i),k=y>0?1-.25*y*y:1-.05*y*y;bp.setXYZ(i,x*.2*k,y*.28+.26,z*.2*k)}
    bg.computeVertexNormals();
    const b1=new T.Color(K.bud),b2=new T.Color(K.budTop);
    bud.add(new T.Mesh(colorize(bg,(x,y,z,cc)=>cc.copy(b1).lerp(b2,Math.min(1,Math.max(0,(y-.36)/.18)))),vmat({roughness:.55})));
    const sm=mat(K.calyx,{roughness:.6,side:T.DoubleSide});
    for(let k=0;k<5;k++){const a=k/5*Math.PI*2,lg=new T.SphereGeometry(1,14,10);lg.scale(.085,.14,.014);
      const leaf=new T.Mesh(lg,sm);leaf.position.set(Math.sin(a)*.16,.15,Math.cos(a)*.16);leaf.rotation.y=a;leaf.rotation.x=-.35;bud.add(leaf)}
    bud.position.copy(tip);bud.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),tan);root.add(bud);
    // 手：從兩側由上往下約 57% 伸出，往外下方；三根手指
    const am=mat(K.arm,{roughness:.5}),lm=mat(K.leg,{roughness:.5}),ay=top-.57*H;
    [-1,1].forEach(s=>{
      const sh=[.42*s,ay,.02],hd=[.58*s,ay-.2,.06];root.add(limb(sh,hd,.022,am));
      [[-.04,-.06],[0,-.07],[.04,-.05]].forEach(([dx,dy])=>root.add(limb(hd,[hd[0]+dx*s+.01*s,hd[1]+dy,hd[2]+.02],.009,am)));
    });
    // 腳：短（約 0.19），左右 ±0.12
    [-1,1].forEach(s=>{
      const tp=[.12*s,box.min.y+.06,0],ft=[.12*s,box.min.y-.19,.02];root.add(limb(tp,ft,.04,lm));
      [[-.07,.06],[0,.09],[.07,.05]].forEach(([dx,dz])=>root.add(limb(ft,[ft[0]+dx,ft[1]-.015,ft[2]+dz],.014,lm)));
    });
    // 岩石沒有脖子：脖子類裝備圍在眼睛下方，衣服包住岩石中下段
    root.userData.anchors={hat:{p:V(0,top-.05,0),s:.8,rx:0},eyes:E,eyeR:.069,eyeD:.088,face:[rock],cheeks:[[.27,top-.27*H],[-.27,top-.27*H]],mouth:[0,top-.29*H],
      wrap:{c:V(0,(top+box.min.y)/2,0),z:.06,mesh:[rock],t:.16,z:.02},clamp:{x:.25,y:top-.4*H,d:.82,top},trunk:[rock],neckY:top-.38*H,body:[top-.42*H,box.min.y+.1*H],hand:{p:V(.58,ay-.2,.06),s:.75,rx:.2},leaf:{obj:bud,p:tip,tan,s:.75},back:{y0:top-.3*H,y1:box.min.y-.08,r1:.12,s:.78}};
    return root;
  }
  /* 3D 裝備：顏色與造型對照商店的平面圖示。每隻皮克敏在 userData.anchors 記錄裝備位置，
   * 衣服、圍巾等會用射線量出身體實際的輪廓，所以三種身形都能貼合。 */
  const ray=new T.Raycaster();
  // 從正前方往後打射線，找出臉上某一點的位置和法線
  function front(meshes,x,y){
    ray.set(V(x,y,3),V(0,0,-1));const h=ray.intersectObjects(meshes,false)[0];if(!h)return null;
    return{p:h.point.clone(),n:h.face.normal.clone().transformDirection(h.object.matrixWorld).normalize()};
  }
  // 在高度 y 從四周往中心打射線，量出身體每個方向的半徑
  function radial(meshes,y,n){
    const rs=[];let last=.2;
    for(let i=0;i<n;i++){const a=i/n*Math.PI*2,d=V(Math.sin(a),0,Math.cos(a));ray.set(d.clone().multiplyScalar(4).setY(y),d.clone().negate());
      const h=ray.intersectObjects(meshes,false)[0];if(h)last=Math.hypot(h.point.x,h.point.z);rs.push(last)}
    return rs.map((r,i)=>(rs[(i+n-1)%n]+2*r+rs[(i+1)%n])/4);
  }
  // 貼著身體的外殼（衣服、披風用）：rows 由上到下，pad 是離身體的距離，arc 是包住的角度（背面為中心）
  function shell(meshes,y0,y1,rows,cols,pad,colFn,arc=Math.PI*2,flare=0){
    const pos=[],cl=[],idx=[],c=new T.Color(),full=arc>=Math.PI*2-1e-6,rr=[];
    for(let j=0;j<=rows;j++)rr.push(radial(meshes,y0+(y1-y0)*j/rows,64));
    for(let j=0;j<=rows;j++){const t=j/rows,y=y0+(y1-y0)*t;
      for(let i=0;i<=cols;i++){const u=i/cols,a=full?u*Math.PI*2:Math.PI-arc/2+u*arc,k=((Math.round(a/(Math.PI*2)*64)%64)+64)%64;
        let r=0;for(let q=Math.max(0,j-1);q<=Math.min(rows,j+1);q++)r=Math.max(r,rr[q][k]);r=r+pad+flare*t*t;
        pos.push(Math.sin(a)*r,y,Math.cos(a)*r);colFn(u,t,a,c);cl.push(c.r,c.g,c.b)}}
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const A=j*(cols+1)+i,B=A+cols+1;idx.push(A,B,A+1,B,B+1,A+1)}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(cl,3));
    g.setIndex(idx);g.computeVertexNormals();return g;
  }
  // 讓物件的 +z 朝向法線 n
  const face=(o,p,n)=>{o.position.copy(p);o.quaternion.setFromUnitVectors(V(0,0,1),n.clone().normalize());return o};
  const gold=()=>mat(0xffc93c,{roughness:.3,metalness:.45});
  // 星星形狀（巫師帽、魔法棒、金牌用）
  function star(r,depth,m){const s=new T.Shape();for(let i=0;i<10;i++){const a=i/10*Math.PI*2,rr=i%2?r*.45:r;i?s.lineTo(Math.sin(a)*rr,Math.cos(a)*rr):s.moveTo(0,rr)}s.closePath();
    const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:depth*.4,bevelSize:r*.06,bevelSegments:1});g.translate(0,0,-depth/2);return new T.Mesh(g,m)}
  // 帽子：以頭寬 1 為基準，原點在帽子底部中央
  const HATS={
    strawhat(){const g=new T.Group(),m=mat(0xf4d06f,{roughness:.8,side:T.DoubleSide});
      const brim=new T.Mesh(new T.CylinderGeometry(.62,.64,.025,40),m);g.add(brim);
      const crown=new T.Mesh(new T.LatheGeometry([[.33,0],[.33,.1],[.31,.19],[.24,.24],[0,.25]].map(([x,y])=>new T.Vector2(x,y)),40),m);g.add(crown);
      const band=new T.Mesh(new T.CylinderGeometry(.335,.335,.06,40,1,true),mat(0xe53935,{roughness:.6}));band.position.y=.05;g.add(band);return g},
    wizard(){const g=new T.Group(),m=mat(0x5e35b1,{roughness:.6,side:T.DoubleSide});
      const brim=new T.Mesh(new T.CylinderGeometry(.56,.58,.025,40),mat(0x4527a0,{roughness:.6}));g.add(brim);
      const cone=new T.Mesh(new T.LatheGeometry(new T.SplineCurve([[.36,0],[.27,.25],[.17,.5],[.08,.72],[.01,.86]].map(([x,y])=>new T.Vector2(x,y))).getPoints(24),40),m);g.add(cone);
      const sm=mat(0xffeb3b,{roughness:.4,emissive:0x5a4a00});[[.24,.12,.6],[-.16,.42,.5],[.1,.55,.4]].forEach(([a,y,r],k)=>{const rr=.36-(.35*y/.86),st=star(.06-.012*k,.01,sm);
        face(st,V(Math.sin(a)*rr*1.02,y,Math.cos(a)*rr*1.02),V(Math.sin(a),.35,Math.cos(a)));g.add(st)});return g},
    santa(){const g=new T.Group(),m=mat(0xe53935,{roughness:.7,side:T.DoubleSide}),w=mat(0xffffff,{roughness:.95});
      const path=new T.CatmullRomCurve3([V(0,0,0),V(0,.25,-.02),V(.05,.48,-.1),V(.2,.58,-.22),V(.34,.5,-.3)]);
      g.add(new T.Mesh(taperTube(path,30,24,t=>.34*Math.pow(1-t,.9)+.03,(t,c)=>c.set(0xe53935)),vmat({roughness:.7})));
      const ring=new T.Mesh(new T.TorusGeometry(.36,.07,14,40),w);ring.rotation.x=Math.PI/2;ring.position.y=.03;g.add(ring);
      const pom=new T.Mesh(new T.SphereGeometry(.09,20,14),w);pom.position.copy(path.getPointAt(1));g.add(pom);return g},
    gradcap(){const g=new T.Group(),m=mat(0x37474f,{roughness:.7}),d=mat(0x263238,{roughness:.6});
      const cap=new T.Mesh(new T.CylinderGeometry(.34,.35,.18,40,1),m);cap.position.y=.09;g.add(cap);
      const board=new T.Mesh(new T.BoxGeometry(.82,.035,.82),d);board.position.y=.2;board.rotation.y=Math.PI/4;g.add(board);
      const btn=new T.Mesh(new T.SphereGeometry(.035,12,8),mat(0xffc107));btn.position.y=.225;g.add(btn);
      const tm=mat(0xffc107,{roughness:.6});g.add(limb([0,.225,0],[.4,.21,.2],.012,tm));g.add(limb([.4,.21,.2],[.42,.02,.21],.012,tm));
      const tas=new T.Mesh(new T.CylinderGeometry(.02,.045,.1,12),tm);tas.position.set(.42,-.02,.21);g.add(tas);return g},
    crown(){const g=new T.Group(),m=gold();
      const ring=new T.Mesh(new T.CylinderGeometry(.335,.335,.11,48,1,true),m);ring.position.y=.055;g.add(ring);
      for(let k=0;k<5;k++){const a=k/5*Math.PI*2,sp2=new T.Mesh(new T.ConeGeometry(.075,.17,4),m);sp2.position.set(Math.sin(a)*.33,.19,Math.cos(a)*.33);g.add(sp2);
        const ball=new T.Mesh(new T.SphereGeometry(.03,12,8),m);ball.position.set(Math.sin(a)*.33,.29,Math.cos(a)*.33);g.add(ball);
        const gem=new T.Mesh(new T.SphereGeometry(.04,14,10),mat([0xe53935,0x1e88e5,0x43a047,0x1e88e5,0xe53935][k],{roughness:.15,metalness:.2}));gem.scale.z=.5;face(gem,V(Math.sin(a)*.34,.055,Math.cos(a)*.34),V(Math.sin(a),0,Math.cos(a)));g.add(gem)}
      return g}
  };
  // 手上拿的東西：原點在手的位置
  const HAND={
    lollipop(){const g=new T.Group();g.add(limb([0,0,0],[0,.5,0],.016,mat(0xf5f5f5,{roughness:.4})));
      const candy=new T.Mesh(new T.CylinderGeometry(.15,.15,.05,32),mat(0xff80ab,{roughness:.25}));candy.rotation.x=Math.PI/2;candy.position.y=.62;g.add(candy);
      const sw=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(Array.from({length:30},(_,i)=>{const a=i*.62,r=.012+i*.0042;return V(Math.cos(a)*r,.62+Math.sin(a)*r,.027)})),60,.01,6),mat(0xffffff,{roughness:.3}));g.add(sw);return g},
    flag(){const g=new T.Group();g.add(limb([0,-.05,0],[0,.75,0],.016,mat(0x8d6e63,{roughness:.7})));
      const s=new T.Shape();s.moveTo(0,0);s.quadraticCurveTo(.2,.03,.36,-.07);s.lineTo(0,-.2);s.closePath();
      const f=new T.Mesh(new T.ShapeGeometry(s,12),mat(0x43a047,{roughness:.6,side:T.DoubleSide}));f.position.set(0,.74,0);f.rotation.y=-.5;g.add(f);return g},
    wand(){const g=new T.Group();g.add(limb([0,-.05,0],[.12,.5,0],.016,mat(0x5d4037,{roughness:.6})));
      const st=star(.13,.04,mat(0xffeb3b,{roughness:.3,emissive:0x6b5a00}));st.position.set(.14,.62,0);g.add(st);g.userData.spin=st;return g}
  };
  // 頭頂（取代原本的花苞）：原點在莖的尖端，往 +y 長
  const LEAF={
    bud(){const g=new T.Group(),bg=new T.SphereGeometry(1,28,20),bp=bg.attributes.position;
      for(let i=0;i<bp.count;i++){let x=bp.getX(i),y=bp.getY(i),z=bp.getZ(i),k=y>0?1-.3*y*y:1;bp.setXYZ(i,x*.2*k,y*.3+.28,z*.2*k)}bg.computeVertexNormals();
      const a=new T.Color(0xf48fb1),b=new T.Color(0xfce4ec);g.add(new T.Mesh(colorize(bg,(x,y,z,c)=>c.copy(a).lerp(b,Math.min(1,Math.max(0,(y-.3)/.25)))),vmat({roughness:.5})));
      const sm=mat(0x43a047,{roughness:.6,side:T.DoubleSide});
      for(let k=0;k<5;k++){const a=k/5*Math.PI*2,lg=new T.SphereGeometry(1,14,10);lg.scale(.1,.17,.02);const l=new T.Mesh(lg,sm);l.position.set(Math.sin(a)*.15,.13,Math.cos(a)*.15);l.rotation.y=a;l.rotation.x=-.4;g.add(l)}
      return g},
    flower(){const g=new T.Group(),pm=mat(0xffffff,{roughness:.55,side:T.DoubleSide});
      const head=new T.Group();head.position.y=.08;head.rotation.x=.9;g.add(head);
      for(let k=0;k<7;k++){const a=k/7*Math.PI*2,pg=new T.SphereGeometry(1,16,10);pg.scale(.1,.2,.025);const pe=new T.Mesh(pg,pm);
        pe.position.set(Math.sin(a)*.2,Math.cos(a)*.2,0);pe.rotation.z=-a;pe.rotation.x=.2;head.add(pe)}
      const ctr=new T.Mesh(new T.SphereGeometry(.1,20,14),mat(0xffc107,{roughness:.6}));ctr.scale.z=.55;ctr.position.z=.03;head.add(ctr);
      g.add(limb([0,0,0],[0,.08,0],.025,mat(0x43a047)));return g}
  };
  // 水玉頭巾：淺藍色白點的布，蓬蓬地圍成一圈包住頭（岩石皮克敏是包住整顆岩石），頭頂打一個蝴蝶結
  let dotTex=null;
  function dots(){
    if(dotTex)return dotTex;
    const cv=document.createElement('canvas');cv.width=cv.height=128;const x=cv.getContext('2d');
    x.fillStyle='#92cfdc';x.fillRect(0,0,128,128);x.fillStyle='#fff';
    [[64,64],[0,0],[128,0],[0,128],[128,128]].forEach(([a,b])=>{x.beginPath();x.arc(a,b,17,0,Math.PI*2);x.fill()});
    dotTex=new T.CanvasTexture(cv);dotTex.wrapS=dotTex.wrapT=T.RepeatWrapping;return dotTex;
  }
  const uvScale=(g,su,sv)=>{const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*su,uv.getY(i)*sv);return g};
  function dotScarf(W,G){
    const m=new T.MeshStandardMaterial({map:dots(),roughness:.85}),n=72,tile=W.t*2.1,c=W.c,pts=[];
    // 在圈所在的平面上，從四周往中心打射線量出輪廓，再平滑
    let rs=[];
    for(let i=0;i<n;i++){const a=i/n*Math.PI*2,d=V(Math.cos(a),Math.sin(a),0);let r=Math.hypot(W.rx*d.x,W.ry*d.y)||.5;
      if(W.mesh){ray.set(V(c.x+d.x*4,c.y+d.y*4,W.z),d.clone().negate());const h=ray.intersectObjects(W.mesh,false)[0];if(h)r=Math.hypot(h.point.x-c.x,h.point.y-c.y)}
      else r=1/Math.sqrt((d.x/W.rx)**2+(d.y/W.ry)**2);rs.push(r)}
    for(let k=0;k<4;k++)rs=rs.map((r,i)=>(rs[(i+n-1)%n]+2*r+rs[(i+1)%n])/4);
    rs.forEach((r,i)=>{const a=i/n*Math.PI*2;pts.push(V(c.x+Math.cos(a)*(r+W.t*.9),c.y+Math.sin(a)*(r+W.t*.9),W.z+W.t*.25*Math.sin(a*5)))});
    const cur=new T.CatmullRomCurve3(pts,true),segs=160,rad=18,L=cur.getLength();
    const g=new T.TubeGeometry(cur,segs,1,rad,true),pos=g.attributes.position,P=new T.Vector3(),Q=new T.Vector3();
    // 布皺皺的、一段一段蓬起來
    for(let i=0;i<=segs;i++){const t=i/segs;cur.getPointAt(t%1,P);const r=W.t*(1+.15*Math.sin(t*Math.PI*2*10)+.08*Math.sin(t*Math.PI*2*4+1));
      for(let j=0;j<=rad;j++){const k=i*(rad+1)+j;Q.fromBufferAttribute(pos,k).sub(P).multiplyScalar(r*(1+.05*Math.sin(j/rad*Math.PI*6+i))).add(P);pos.setXYZ(k,Q.x,Q.y,Q.z)}}
    g.computeVertexNormals();uvScale(g,Math.round(L/tile),Math.max(2,Math.round(Math.PI*2*W.t/tile)));G.add(new T.Mesh(g,m));
    // 頭頂的結和兩片像兔耳朵的布
    const top=cur.getPointAt(.25).add(V(0,W.t*.35,W.t*.3)),knot=new T.Mesh(uvScale(new T.SphereGeometry(W.t*.85,24,16),3,2),m);knot.scale.set(1.15,.9,.9);knot.position.copy(top);G.add(knot);
    [-1,1].forEach(k=>{const eg=uvScale(new T.SphereGeometry(1,24,16),3,3);eg.scale(W.t*1.5,W.t*3,W.t*.32);eg.translate(0,W.t*2.7,0);
      const ear=new T.Mesh(eg,m);ear.position.copy(top);ear.rotation.set(-.2,k*.3,-k*.85);G.add(ear)});
  }
  // 綠色大夾子（G 型夾）：從頭的一側前後夾住，弧形框架跨過頭頂，前面是銀色螺絲和 T 形把手
  function clamp(A,G){
    const C=A.clamp,ms=A.face,hit=(o,d)=>{ray.set(o,d);const h=ray.intersectObjects(ms,false)[0];return h&&h.point};
    const f=hit(V(C.x,C.y,3),V(0,0,-1)),b=hit(V(C.x,C.y,-3),V(0,0,1));if(!f||!b)return;
    const D=f.z-b.z,zc=(f.z+b.z)/2,d=C.d;
    const w=.23*d,bk=-D/2-.12*d-w/2,fr=D/2+.15*d+w/2,it=C.top-C.y+.2*d,ro=w*.9,ri=w*.35,y0=-.05*d,y1=-.2*d;
    // 框架：∩ 形的輪廓（u = 前後，v = 上下，以螺絲高度為 0）
    const band=(bw)=>{const s=new T.Shape(),L=bk-bw/2,R=fr+bw/2,Li=bk+bw/2,Ri=fr-bw/2,Tp=it+(w+bw)/2,Ti=it+(w-bw)/2,ro2=Math.min(ro,bw*1.8),ri2=ri;
      s.moveTo(L,y0);s.lineTo(L,Tp-ro2);s.quadraticCurveTo(L,Tp,L+ro2,Tp);s.lineTo(R-ro2,Tp);s.quadraticCurveTo(R,Tp,R,Tp-ro2);s.lineTo(R,y1);
      s.quadraticCurveTo((R+Ri)/2,y1-bw*.25,Ri,y1);s.lineTo(Ri,Ti-ri2);s.quadraticCurveTo(Ri,Ti,Ri-ri2,Ti);s.lineTo(Li+ri2,Ti);s.quadraticCurveTo(Li,Ti,Li,Ti-ri2);s.lineTo(Li,y0);
      s.quadraticCurveTo((L+Li)/2,y0-bw*.25,L,y0);return s};
    const tm=mat(0x4cc4a0,{roughness:.35}),sm=mat(0xc9ccd1,{roughness:.25,metalness:.75}),g=new T.Group();
    const ext=(sh,d)=>{const e=new T.ExtrudeGeometry(sh,{depth:d,bevelEnabled:true,bevelThickness:w*.1,bevelSize:w*.08,bevelSegments:3,curveSegments:10});e.translate(0,0,-d/2);e.rotateY(-Math.PI/2);return new T.Mesh(e,tm)};
    g.add(ext(band(w),w*.42));g.add(ext(band(w*.42),w*.62));
    const cyl=(r,len,m,u,v)=>{const c=new T.Mesh(new T.CylinderGeometry(r,r,len,24),m);c.rotation.x=Math.PI/2;c.position.set(0,v,u);g.add(c);return c};
    // 後面固定的夾片、前面的螺絲座
    cyl(w*.42,w*.18,tm,bk+w/2+w*.08,y0+w*.35);cyl(w*.38,w*1.05,tm,fr,0);
    // 螺絲：從螺絲座穿過去頂住頭，外面有幾圈螺紋和 T 形把手
    const sIn=D/2+.01*d,sOut=fr+w*1.15;cyl(w*.12,sOut-sIn,sm,(sIn+sOut)/2,0);cyl(w*.38,w*.1,sm,sIn+w*.05,0);
    for(let k=0;k<5;k++){const t=new T.Mesh(new T.TorusGeometry(w*.125,w*.025,6,16),sm);t.position.set(0,0,fr+w*.55+k*w*.1);g.add(t)}
    const hb=new T.Mesh(new T.CylinderGeometry(w*.16,w*.16,w*.3,20),sm);hb.position.set(0,0,sOut);g.add(hb);
    g.add(limb([0,-w*1.1,sOut],[0,w*1.9,sOut],w*.075,sm));
    [[-w*1.1],[w*1.9]].forEach(([v])=>{const cap=new T.Mesh(new T.CylinderGeometry(w*.11,w*.11,w*.22,16),sm);cap.position.set(0,v,sOut);g.add(cap)});
    g.position.set(C.x+.01,C.y,zc);g.rotation.z=-.08;G.add(g);
  }
  function addOutfit(root,outfit){
    const A=root.userData.anchors;if(!A)return;
    if(root.userData.gear)root.remove(root.userData.gear);
    const G=new T.Group();root.add(G);root.userData.gear=G;root.updateMatrixWorld(true);
    A.leaf.obj.visible=true;const nat=root.userData.natWings||(root.userData.natWings=root.userData.wings||[]);nat.forEach(w=>w.visible=true);root.userData.wings=nat.slice();
    const o=outfit||{};root.userData.spin=null;
    // 帽子
    if(o.hat==='dotscarf')dotScarf(A.wrap,G);
    if(o.hat==='clamp')clamp(A,G);
    if(HATS[o.hat]){const h=HATS[o.hat]();h.position.copy(A.hat.p);h.scale.setScalar(A.hat.s);h.rotation.x=A.hat.rx||0;G.add(h)}
    // 臉部
    if(o.face==='glasses'||o.face==='sunglasses'){const sun=o.face==='sunglasses',r=A.eyeR,rim=[];
      A.eyes.forEach(e=>{const p=e.p.clone().addScaledVector(e.n,A.eyeD+(sun?.012:-.004));
        if(sun){const lg=new T.CylinderGeometry(r*1.18,r*1.18,r*.12,32);lg.rotateX(Math.PI/2);lg.scale(1,.8,1);G.add(face(new T.Mesh(lg,mat(0x1c1c1c,{roughness:.12,metalness:.3})),p,e.n))}
        else G.add(face(new T.Mesh(new T.TorusGeometry(r*1.08,r*.11,10,40),mat(0x3e2723,{roughness:.4})),p,e.n));
        rim.push(p)});
      if(rim.length===2){const a=rim[0].x<rim[1].x?rim[0]:rim[1],b=a===rim[0]?rim[1]:rim[0],m=a.clone().lerp(b,.5).add(V(0,r*.25,r*.15));
        const pm=mat(sun?0x1c1c1c:0x3e2723,{roughness:.4}),ra=r*(sun?.1:.09);
        G.add(limb([a.x+r*(sun?1.1:1.05),a.y,a.z],[m.x,m.y,m.z],ra,pm));G.add(limb([m.x,m.y,m.z],[b.x-r*(sun?1.1:1.05),b.y,b.z],ra,pm))}}
    if(o.face==='blush'){const bm=new T.MeshStandardMaterial({color:0xff5c7a,transparent:true,opacity:.55,roughness:.8,depthWrite:false});
      A.cheeks.forEach(([x,y])=>{const h=front(A.face,x,y);if(!h)return;const d=new T.Mesh(new T.CircleGeometry(A.eyeR*.85,28),bm);d.scale.y=.6;face(d,h.p.addScaledVector(h.n,.006),h.n);G.add(d)});
      const pts=[];for(let i=0;i<=8;i++){const x=(i/8-.5)*A.eyeR*1.1,h=front(A.face,A.mouth[0]+x,A.mouth[1]-Math.cos((i/8-.5)*Math.PI)*A.eyeR*.28);if(h)pts.push(h.p.addScaledVector(h.n,.008))}
      if(pts.length>2)G.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),16,A.eyeR*.07,6),mat(0x6d2b2b,{roughness:.6})))}
    // 脖子：沿著身體輪廓繞一圈
    const neckRing=pad=>{const rs=radial(A.trunk,A.neckY,48);return rs.map((r,i)=>{const a=i/48*Math.PI*2;return V(Math.sin(a)*(r+pad),A.neckY,Math.cos(a)*(r+pad))})};
    const nr=A.eyeR<.1?.035:A.trunk.length>1?.04:.05;
    if(o.neck==='scarf'){const pts=neckRing(nr*.8),cur=new T.CatmullRomCurve3(pts,true);
      const tg=new T.TubeGeometry(cur,96,nr,12,true),bl=new T.Color(0x1e88e5),wh=new T.Color(0xffffff);
      const tp=tg.attributes.position,cs=[];for(let i=0;i<tp.count;i++){const seg=Math.floor(i/13)/96;const c=(Math.floor(seg*16)%2)?wh:bl;cs.push(c.r,c.g,c.b)}
      tg.setAttribute('color',new T.Float32BufferAttribute(cs,3));G.add(new T.Mesh(tg,vmat({roughness:.85})));
      const p0=pts[6];const tail=new T.CatmullRomCurve3([p0.clone(),p0.clone().add(V(.02,-nr*2,nr*.8)),p0.clone().add(V(.05,-nr*5,nr*.9))]);
      const tt=new T.TubeGeometry(tail,12,nr*.75,8);G.add(new T.Mesh(tt,mat(0x1e88e5,{roughness:.85})))}
    if(o.neck==='bow'||o.neck==='medal'){const ring=neckRing(.004),fr=ring[0];
      if(o.neck==='bow'){const bm=mat(0xe53935,{roughness:.45}),s=nr*3.2,b=new T.Group();
        [-1,1].forEach(k=>{const c=new T.Mesh(new T.ConeGeometry(s*.55,s*1.1,16),bm);c.rotation.z=k*Math.PI/2;c.position.x=k*s*.5;c.scale.z=.45;b.add(c)});
        const kn=new T.Mesh(new T.SphereGeometry(s*.28,14,10),mat(0xc62828,{roughness:.45}));b.add(kn);b.position.copy(fr).add(V(0,0,s*.12));G.add(b)}
      else{const rm=mat(0x1e88e5,{roughness:.7}),h=front(A.trunk,0,A.neckY-nr*5.5)||{p:fr.clone().add(V(0,-nr*5,0)),n:V(0,0,1)},dp=h.p.clone().addScaledVector(h.n,.03);
        const L=ring[5],Rr=ring[43];G.add(limb([L.x,L.y,L.z],[dp.x,dp.y+nr*.8,dp.z],nr*.28,rm));G.add(limb([Rr.x,Rr.y,Rr.z],[dp.x,dp.y+nr*.8,dp.z],nr*.28,rm));
        const disc=new T.Mesh(new T.CylinderGeometry(nr*2,nr*2,nr*.5,32),gold());disc.rotation.x=Math.PI/2;const dg=new T.Group();dg.add(disc);
        const st=star(nr*1.2,nr*.2,mat(0xff8f00,{roughness:.4,metalness:.3}));st.position.z=nr*.3;dg.add(st);G.add(face(dg,dp,h.n))}}
    // 衣服：貼著身體的外殼
    if(o.body==='raincoat'||o.body==='sweater'){const rain=o.body==='raincoat',[y0,y1]=A.body,pad=A.eyeR<.1?.018:.025;
      const yc=new T.Color(0xfdd835),yd=new T.Color(0xf9a825),rc=new T.Color(0xe57373),wc=new T.Color(0xffffff);
      const g=shell(A.trunk,y0,y1,24,64,pad,(u,t,a,c)=>{if(rain){c.copy(Math.abs(Math.sin(a))<.03&&Math.cos(a)>0?yd:yc)}
        else{const zig=t-.5-.04*Math.abs(((u*24)%2)-1);c.copy((t<.08||t>.9||(zig>0&&zig<.08))?wc:rc)}},Math.PI*2,(y0-y1)*.12);
      G.add(new T.Mesh(g,vmat({roughness:rain?.35:.9,side:T.DoubleSide})));
      if(rain)[.3,.55,.8].forEach(t=>{const y=y0+(y1-y0)*t,h=front(G.children.slice(-1),0,y);if(!h)return;
        const b=new T.Mesh(new T.SphereGeometry(A.eyeR*.22+.006,12,8),mat(0x8d6e63,{roughness:.5}));b.scale.z=.5;G.add(face(b,h.p,h.n))});
      if(!rain){const rs=radial(A.trunk,y0,48),pts=rs.map((r,i)=>{const a=i/48*Math.PI*2;return V(Math.sin(a)*(r+pad),y0,Math.cos(a)*(r+pad))});
        G.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts,true),64,pad*1.2,8,true),mat(0xffffff,{roughness:.95})))}}
    // 背後
    if(o.back==='cape'){const B=A.back,g=shell(A.trunk,B.y0,B.y1,20,40,.03,(u,t,a,c)=>c.set(t>.97||u<.02||u>.98?0xb71c1c:0xd32f2f),Math.PI*.95,B.r1);
      // 披風下方不再貼著身體，而是往外張開
      G.add(new T.Mesh(g,vmat({roughness:.7,side:T.DoubleSide})))}
    if(o.back==='wings'){const B=A.back,y=B.y0-(B.y0-B.y1)*.18,rs=radial(A.trunk,y,64),zb=-rs[32];
      const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(.1,.35,.5,.55,.62,.3);s.bezierCurveTo(.7,.1,.45,-.02,.35,-.02);s.bezierCurveTo(.5,-.1,.5,-.32,.3,-.3);s.bezierCurveTo(.15,-.28,.04,-.12,0,0);
      const rb=[0xff8a80,0xffd180,0xccff90,0x80d8ff,0xb388ff].map(c=>new T.Color(c));
      const wg=colorize(new T.ShapeGeometry(s,24),(x,y2,z,c)=>{const d=Math.min(.999,Math.hypot(x,y2)/.68)*4,i=Math.floor(d);c.copy(rb[i]).lerp(rb[Math.min(4,i+1)],d-i)});
      const wm=vmat({transparent:true,opacity:.88,side:T.DoubleSide,depthWrite:false,roughness:.4});
      nat.forEach(w=>w.visible=false);
      [-1,1].forEach(k=>{const pv=new T.Group();pv.position.set(.04*k,y,zb-.02);pv.scale.set(k*B.s*1.55,B.s*1.55,B.s*1.55);const w=new T.Mesh(wg,wm);w.rotation.set(-.1,-.38,.1);pv.add(w);G.add(pv);root.userData.wings.push(pv)})}
    // 手上
    if(HAND[o.hand]){const h=HAND[o.hand]();h.position.copy(A.hand.p).add(V(.01,.01,.02));h.scale.setScalar(A.hand.s);h.rotation.x=A.hand.rx||0;G.add(h);root.userData.spin=h.userData.spin}
    // 頭頂
    if(LEAF[o.leaf]){const L=A.leaf,l=LEAF[o.leaf]();l.position.copy(L.p);l.quaternion.setFromUnitVectors(V(0,1,0),L.tan.clone().normalize());l.scale.setScalar(L.s);L.obj.visible=false;G.add(l)}
  }
  let R=null;
  function init(){
    if(R)return R;
    let r;try{r=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true})}catch(e){return null}
    r.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    const scene=new T.Scene(),cam=new T.PerspectiveCamera(28,1,.1,50);
    scene.add(new T.HemisphereLight(0xffffff,0xd9c6e0,.5));
    const d=new T.DirectionalLight(0xffffff,.55);d.position.set(2.5,4,4);scene.add(d);
    const f=new T.DirectionalLight(0xffffff,.22);f.position.set(-3,1,2);scene.add(f);
    scene.add(new T.AmbientLight(0xffffff,.12));
    R={r,scene,cam,model:null,el:null,yaw:0,pitch:.12,auto:true,hop:0,t0:performance.now()};return R;
  }
  function frame(){
    if(!R.el||!R.r.domElement.isConnected){R.running=false;return}
    requestAnimationFrame(frame);
    const w=R.el.clientWidth,h=R.el.clientHeight;if(w&&h&&(w!==R.w||h!==R.h)){R.w=w;R.h=h;R.r.setSize(w,h,false);R.cam.aspect=w/h;R.cam.updateProjectionMatrix()}
    const t=(performance.now()-R.t0)/1000;
    if(R.auto&&!R.drag)R.yaw=Math.sin(t*.5)*.5;
    const hopY=R.hop>0?Math.sin((1-R.hop)*Math.PI)*.25:0;if(R.hop>0)R.hop=Math.max(0,R.hop-.03);
    R.model.rotation.y=R.yaw;R.model.position.y=Math.sin(t*2)*.025+hopY;
    (R.model.userData.wings||[]).forEach((p,k)=>p.rotation.z=Math.sin(t*14)*.22*(k%2?1:-1));
    if(R.model.userData.spin)R.model.userData.spin.rotation.y=t*2.5;
    const dist=R.dist||6.2,cy=R.cy==null?.2:R.cy;R.cam.position.set(0,cy+Math.sin(R.pitch)*dist,Math.cos(R.pitch)*dist);R.cam.lookAt(0,cy,0);
    R.r.render(R.scene,R.cam);
  }
  // 建立皮克敏模型並穿上裝備（outfit：{部位: 裝備 id}）
  function build(type,outfit){const m=({yellow:buildYellow,rock:buildRock}[type]||buildWinged)();addOutfit(m,outfit);return m}
  // 把 3D 皮克敏放進 el；左右拖曳可旋轉，點一下會跳起來
  function mount(el,opt={}){
    if(!init())return false;
    if(R.model)R.scene.remove(R.model);
    R.model=build(opt.type,opt.outfit);R.scene.add(R.model);
    {const box=new T.Box3().setFromObject(R.model),sz=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());R.cy=c.y;R.dist=sz.y/2/Math.tan(R.cam.fov*Math.PI/360)*1.18}R.el=el;R.w=R.h=0;R.auto=opt.auto!==false;
    if(opt.yaw!=null)R.yaw=opt.yaw;if(opt.pitch!=null)R.pitch=opt.pitch;
    el.innerHTML='';el.appendChild(R.r.domElement);const c=R.r.domElement;c.style.width='100%';c.style.height='100%';c.style.touchAction='none';
    let sx=0,sy=0,moved=false;
    c.onpointerdown=e=>{R.drag=true;R.auto=false;sx=e.clientX;sy=e.clientY;moved=false;c.setPointerCapture(e.pointerId)};
    c.onpointermove=e=>{if(!R.drag)return;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;R.yaw+=dx*.012;R.pitch=Math.max(-.2,Math.min(1.1,R.pitch+dy*.006));sx=e.clientX;sy=e.clientY};
    c.onpointerup=()=>{R.drag=false;if(!moved){R.hop=1;opt.onTap&&opt.onTap()}};
    if(!R.running){R.running=true;requestAnimationFrame(frame)}
    return true;
  }
  // 產生某一種 3D 皮克敏的靜態圖片（選皮克敏的卡片用），回傳 PNG 的 data URL
  function snapshot(type,w,h,yaw=.35,pitch=.12,outfit){
    if(!init())return null;
    const m=build(type,outfit),old=R.model;
    if(old)R.scene.remove(old);R.scene.add(m);m.rotation.y=yaw;
    const box=new T.Box3().setFromObject(m),sz=box.getSize(new T.Vector3()),cy=box.getCenter(new T.Vector3()).y,dist=sz.y/2/Math.tan(R.cam.fov*Math.PI/360)*1.12;
    R.r.setSize(w,h,false);R.cam.aspect=w/h;R.cam.updateProjectionMatrix();
    R.cam.position.set(0,cy+Math.sin(pitch)*dist,Math.cos(pitch)*dist);R.cam.lookAt(0,cy,0);R.r.render(R.scene,R.cam);
    const url=R.r.domElement.toDataURL('image/png');
    R.scene.remove(m);if(old)R.scene.add(old);R.w=R.h=0;return url;
  }
  window.Pikmin3D={mount,snapshot,build,
    // 換裝時直接替目前顯示的皮克敏換上裝備，不重建模型
    setOutfit(outfit){if(R&&R.model)addOutfit(R.model,outfit)},setView(yaw,pitch){if(R){R.auto=false;R.yaw=yaw;R.pitch=pitch}}};
})();
