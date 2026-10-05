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
  const T=THREE;
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
    const eyeM=mat(C.blue,{roughness:.12,metalness:.1});
    [-1,1].forEach(s=>{
      const x=.19*s,y=.2,rx=.5,ry=.39,rz=.47,z=rz*Math.sqrt(Math.max(0,1-(x/rx)**2-(y/ry)**2));
      const eg=new T.SphereGeometry(.2,32,24);eg.scale(1,1,.62);
      const eye=new T.Mesh(eg,eyeM);eye.position.set(x*1.02,y*1.04,z*1.0+.03);
      const n=new T.Vector3(x/rx**2,y/ry**2*.6,z/rz**2).normalize();eye.lookAt(eye.position.clone().add(n));root.add(eye);
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
    return root;
  }

  /* 3D 黃皮克敏：比例依照參考截圖（背面、側面、俯視）量測，以「頭寬 = 1」為單位（全身高約 5）：
   *   頭：1.0 × 1.0（深 1.05），接近圓形
   *   耳朵：薄三角片，每隻長約 0.6（尖端到頭中心約 1.0）、根部高約 0.55；上緣幾乎水平、尖端略朝上，
   *         內側桃粉色、朝向前方
   *   眼睛：白色小眼睛＋黑眼珠，各約 0.22，左右分開（中心距頭中心約 ±0.2），在頭正面略高於中線
   *   莖：長，底部像圓錐一樣張開，往上越細並往後彎，上段轉為綠色
   *   花苞：很大，寬約 1.0、高約 1.15，綠色、頂端淡灰白，底部有萼片
   *   脖子：細，寬約 0.4；身體：肩寬約 0.7、腰 0.6、臀 0.66，長約 1.15
   *   手：細，往外下方約 45 度；腳：短，約 0.3，三根腳趾 */
  function buildYellow(){
    const Y={body:0xe6bf26,ear:0xf0b47e,stemTop:0x5f8f35,bud:0x4f9e45,budTop:0xbcc4b6,sepal:0x5aa64a};
    const root=new T.Group(),ym=mat(Y.body,{roughness:.45});
    // 頭：rx .5、ry .5、rz .53，上方稍微收向莖
    const hg=new T.SphereGeometry(1,48,32),hp=hg.attributes.position;
    for(let i=0;i<hp.count;i++){let x=hp.getX(i),y=hp.getY(i),z=hp.getZ(i),k=y>0?1-.1*y*y:1;hp.setXYZ(i,x*.5*k,y*.5,z*.53*k)}
    hg.computeVertexNormals();root.add(new T.Mesh(hg,ym));
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
    const wm=mat(0xffffff,{roughness:.25}),bm=mat(0x111111,{roughness:.2});
    [-1,1].forEach(s=>{
      const x=.2*s,y=.06,z=.53*Math.sqrt(1-(x/.5)**2-(y/.5)**2),n=new T.Vector3(x/.25,y/.25,z/.28).normalize();
      const eye=new T.Mesh(new T.SphereGeometry(.11,24,16),wm);eye.position.set(x,y,z).addScaledVector(n,.02);root.add(eye);
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
    // 脖子＋身體（旋轉體）：脖子寬約 0.4，肩 0.7、腰 0.6、臀 0.66
    const prof=new T.SplineCurve([[.001,-1.69],[.17,-1.67],[.29,-1.6],[.33,-1.47],[.32,-1.32],[.29,-1.17],[.25,-1.03],[.21,-.9],[.19,-.78],[.2,-.66],[.24,-.55],[.32,-.42]].map(([r,y])=>new T.Vector2(r,y))).getPoints(60);
    const lg=new T.LatheGeometry(prof,36);lg.scale(1,1,.86);root.add(new T.Mesh(lg,ym));
    // 手：細，往外下方約 45 度，三根手指
    [-1,1].forEach(s=>{
      const sh=[.29*s,-1.03,0],hd=[.72*s,-1.41,.02];root.add(limb(sh,hd,.032,ym));
      [[-.04,-.09],[.03,-.1],[.08,-.06]].forEach(([dx,dy])=>root.add(limb(hd,[hd[0]+dx*s,hd[1]+dy,hd[2]+.02],.014,ym)));
    });
    // 腳：短，三根腳趾
    [-1,1].forEach(s=>{
      const top=[.19*s,-1.6,0],ft=[.2*s,-1.93,.02];root.add(limb(top,ft,.075,ym));
      [[-.1,.09],[0,.12],[.1,.08]].forEach(([dx,dz])=>root.add(limb(ft,[ft[0]+dx,ft[1]-.04,ft[2]+dz],.025,ym)));
    });
    return root;
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
    (R.model.userData.wings||[]).forEach((p,k)=>p.rotation.z=Math.sin(t*14)*.22*(k?1:-1));
    const dist=R.dist||6.2,cy=R.cy==null?.2:R.cy;R.cam.position.set(0,cy+Math.sin(R.pitch)*dist,Math.cos(R.pitch)*dist);R.cam.lookAt(0,cy,0);
    R.r.render(R.scene,R.cam);
  }
  // 把 3D 皮克敏放進 el；左右拖曳可旋轉，點一下會跳起來
  function mount(el,opt={}){
    if(!init())return false;
    if(R.model)R.scene.remove(R.model);
    R.model=(opt.type==='yellow'?buildYellow:buildWinged)();R.scene.add(R.model);
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
  window.Pikmin3D={mount,setView(yaw,pitch){if(R){R.auto=false;R.yaw=yaw;R.pitch=pitch}}};
})();
