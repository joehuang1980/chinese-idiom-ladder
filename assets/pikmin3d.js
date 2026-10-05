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
    R.model.userData.wings.forEach((p,k)=>p.rotation.z=Math.sin(t*14)*.22*(k?1:-1));
    const dist=6.2;R.cam.position.set(0,.2+Math.sin(R.pitch)*dist,Math.cos(R.pitch)*dist);R.cam.lookAt(0,.2,0);
    R.r.render(R.scene,R.cam);
  }
  // 把 3D 皮克敏放進 el；左右拖曳可旋轉，點一下會跳起來
  function mount(el,opt={}){
    if(!init())return false;
    if(R.model)R.scene.remove(R.model);
    R.model=buildWinged();R.scene.add(R.model);R.el=el;R.w=R.h=0;R.auto=opt.auto!==false;
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
