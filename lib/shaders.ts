// All GLSL lives here. Colours are authored in sRGB and converted to linear with pow(c, 2.2).
// PERFORMANCE: the Moon/Mars surfaces and the nebula are "baked" once into textures at load (see components/Baker.tsx).
// Per frame, the planet shader only reads those textures, which is far cheaper than recomputing craters per pixel.

export const NOISE = /* glsl */ `
float hash(vec3 p3){ p3=fract(p3*.1031); p3+=dot(p3,p3.zyx+31.32); return fract((p3.x+p3.y)*p3.z); }
vec3 hash3(vec3 p){ return vec3(hash(p), hash(p+19.19), hash(p+47.7)); }
float noise(vec3 x){
  vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x), mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x), mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p, float oct){
  float a=.5, s=0.;
  for(int i=0;i<7;i++){ if(float(i)>=oct) break; s+=a*noise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=.5; }
  return s;
}`;

// Direction on the unit sphere for an equirectangular texel (matches three.js SphereGeometry UVs and latLonToVec).
const DIR = /* glsl */ `
vec3 dirFromUv(vec2 uv){ float th=uv.x*6.28318530718; float ph=(1.0-uv.y)*3.14159265359; return vec3(-cos(th)*sin(ph), cos(ph), sin(th)*sin(ph)); }`;

const SURFACE = /* glsl */ `
uniform float uWorld; uniform float uOct; uniform float uSmall; uniform float uK;
float craters(vec3 p, float scale, float density){
  vec3 q=p*scale, ic=floor(q); float h=0.;
  for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++) for(int z=-1;z<=1;z++){
    vec3 c=ic+vec3(float(x),float(y),float(z));
    if(hash(c+7.3)>density) continue;
    vec3 r=hash3(c); vec3 fp=c+r*0.7+0.15;
    float rad=0.16+0.30*r.y*r.y; float d=length(q-fp)/rad;
    float bowl = d<1.0 ? -(1.0-d*d) : 0.0;
    float rim = 0.45*exp(-pow((d-1.05)*5.0,2.0));
    h += (bowl*0.7+rim)*rad;
  }
  return h;
}
float surfH(vec3 p){
  float isMars=step(0.5,uWorld);
  float h = fbm(p*3.0,uOct)*0.6 + craters(p,5.0,mix(0.55,0.22,isMars));
  if(uSmall>0.5) h += craters(p,12.0,mix(0.5,0.2,isMars))*0.5;
  if(uSmall>1.5) h += craters(p,26.0,mix(0.45,0.18,isMars))*0.25;
  if(isMars>0.5) h += fbm(vec3(p.x*9.0,p.y*30.0,p.z*9.0),3.0)*0.12;
  return h;
}
vec3 surfColor(vec3 p, float h){
  float isMars=step(0.5,uWorld); vec3 base;
  if(isMars<0.5){
    float a = fbm(p*2.0+5.0,4.0)+h*0.25;
    base = mix(vec3(.30,.30,.32), vec3(.80,.78,.75), smoothstep(.25,.80,a));
    float maria = smoothstep(.47,.58,fbm(p*1.3+3.0,4.0));
    base = mix(base, base*vec3(.50,.52,.58), maria*0.85);
  } else {
    float a = fbm(p*2.5+2.0,4.0);
    base = mix(vec3(.50,.22,.12), vec3(.85,.46,.26), a);
    base = mix(base, vec3(.92,.72,.50), smoothstep(.45,.75,fbm(p*5.0,3.0))*0.35);
    base *= 1.0 - 0.45*smoothstep(.52,.68,fbm(p*1.7+8.0,4.0));
    float cap = smoothstep(.86,.94, abs(p.y) + (fbm(p*8.0,3.0)-.5)*.09);
    base = mix(base, vec3(.95,.96,.98), cap);
  }
  return base;
}`;

export const bakeVert = /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`;

// Height is computed ONCE (the expensive part: crater fields), packed into two 8-bit channels (16-bit precision).
const PACK = /* glsl */ `
vec4 packH(float h){ float v=clamp(h*0.3+0.5,0.0,0.9999); float a=v*255.0; float hi=floor(a); return vec4(hi/255.0, fract(a), 0.0, 1.0); }
float unpackH(vec4 t){ return ((t.x*255.0 + t.y)/255.0 - 0.5)/0.3; }`;

export const bakeHeightFrag = /* glsl */ `
precision highp float; varying vec2 vUv;
${NOISE}${DIR}${SURFACE}${PACK}
void main(){ vec3 p=dirFromUv(vUv); gl_FragColor=packH(surfH(p)); }`;

export const bakeColorFrag = /* glsl */ `
precision highp float; varying vec2 vUv; uniform sampler2D uHeight;
${NOISE}${DIR}${SURFACE}${PACK}
void main(){ vec3 p=dirFromUv(vUv); float h=unpackH(texture2D(uHeight,vUv)); gl_FragColor=vec4(surfColor(p,h),1.0); }`;

// Object-space normal from the baked height texture (neighbour reads, no noise evaluation).
export const bakeNormalFrag = /* glsl */ `
precision highp float; varying vec2 vUv; uniform sampler2D uHeight; uniform vec2 uTexel; uniform float uK;
${DIR}${PACK}
void main(){
  float th=vUv.x*6.28318530718, ph=(1.0-vUv.y)*3.14159265359, sp=max(sin(ph),0.02);
  float hL=unpackH(texture2D(uHeight,vUv-vec2(uTexel.x,0.0))), hR=unpackH(texture2D(uHeight,vUv+vec2(uTexel.x,0.0)));
  float hD=unpackH(texture2D(uHeight,vUv-vec2(0.0,uTexel.y))), hU=unpackH(texture2D(uHeight,vUv+vec2(0.0,uTexel.y)));
  float dTheta=(hR-hL)/(2.0*uTexel.x*6.28318530718*sp);      // slope along longitude (per unit arc)
  float dPhi=-(hU-hD)/(2.0*uTexel.y*3.14159265359);            // phi grows toward the south (v decreases)
  vec3 p=dirFromUv(vUv);
  vec3 eT=vec3(sin(th),0.0,cos(th)), eP=vec3(-cos(th)*cos(ph),-sin(ph),sin(th)*cos(ph));
  vec3 n=normalize(p-uK*(dTheta*eT+dPhi*eP));
  gl_FragColor=vec4(n*0.5+0.5,1.0);
}`;

export const bakeNebulaFrag = /* glsl */ `
precision highp float; varying vec2 vUv;
${NOISE}${DIR}
void main(){
  vec3 d=dirFromUv(vUv);
  float band=exp(-pow(dot(d,normalize(vec3(.25,.9,.35)))*2.6,2.0));
  float n=fbm(d*3.2,5.0), n2=fbm(d*7.0+4.0,5.0);
  vec3 col=mix(vec3(.05,.09,.24),vec3(.22,.08,.28),n2)*band*smoothstep(.28,.85,n)*1.15;
  col+=vec3(.015,.025,.06)*n;
  gl_FragColor=vec4(col,1.0);
}`;

export const nebulaVert = /* glsl */ `varying vec3 vDir; void main(){ vDir=normalize(position); gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.0); }`;
export const nebulaFrag = /* glsl */ `
precision highp float; varying vec3 vDir; uniform sampler2D uTex;
void main(){
  vec3 d=normalize(vDir); float th=atan(d.z,-d.x); if(th<0.0) th+=6.28318530718;
  vec2 uv=vec2(th/6.28318530718, 1.0-acos(clamp(d.y,-1.0,1.0))/3.14159265359);
  gl_FragColor=vec4(textureLod(uTex,uv,0.0).rgb,1.0);
}`;

// ---- Runtime planet: just reads the baked colour + normal textures ----
export const planetVert = /* glsl */ `
varying vec3 vWorldPos; varying vec3 vWorldNormal; varying vec2 vUv; varying vec3 vM0; varying vec3 vM1; varying vec3 vM2;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position,1.0);
  vWorldPos = wp.xyz; vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vM0 = normalize(modelMatrix[0].xyz); vM1 = normalize(modelMatrix[1].xyz); vM2 = normalize(modelMatrix[2].xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

export const planetFrag = /* glsl */ `
precision highp float;
${DIR}
uniform vec4 uImpact[3]; uniform vec4 uBeacons[8]; uniform vec3 uBeaconCol[8]; uniform vec4 uBeaconFx[8]; uniform float uBeaconN; uniform float uTime;
uniform sampler2D uColorMap; uniform sampler2D uNormalMap; uniform sampler2D uMap; uniform float uMapOn; uniform float uWorld; uniform vec3 uSun;
varying vec3 vWorldPos; varying vec3 vWorldNormal; varying vec2 vUv; varying vec3 vM0; varying vec3 vM1; varying vec3 vM2;
vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
void main(){
  vec3 Ng = normalize(vWorldNormal); vec3 L = normalize(uSun); vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 no = texture2D(uNormalMap, vUv).xyz*2.0-1.0;
  vec3 N = normalize(no.x*vM0 + no.y*vM1 + no.z*vM2);
  if(uMapOn>0.5) N = normalize(mix(N, Ng, 0.85)); // real imagery: keep only a hint of baked relief
  vec3 base = uMapOn>0.5 ? texture2D(uMap, vUv).rgb : lin(texture2D(uColorMap, vUv).rgb);
  float isMars = step(0.5,uWorld);
  float terminator = smoothstep(-0.02,0.28,dot(Ng,L));
  float lit = max(dot(N,L),0.0)*terminator;
  vec3 sunCol = lin(vec3(1.0,.96,.90))*1.7;
  vec3 ambient = lin(vec3(.05,.07,.14))*0.18;
  vec3 col = base*(lit*sunCol + ambient);
  float limb = pow(1.0-max(dot(Ng,V),0.0), 3.0);
  col += isMars*limb*lin(vec3(1.0,.55,.32))*0.55*smoothstep(-0.15,0.6,dot(Ng,L));
  // Signal rings are painted ON the ground (angular distance from each machine on the sphere), so they can never float off the surface.
  vec3 pObj = dirFromUv(vUv); vec3 rings = vec3(0.0);
  for(int i=0;i<8;i++){
    if(float(i)>=uBeaconN) break;
    float ang = acos(clamp(dot(pObj, uBeacons[i].xyz), -1.0, 1.0)); vec4 fx = uBeaconFx[i];
    float k = fract(uTime*fx.x + uBeacons[i].w), rr = (0.016 + k*0.11)*fx.w, w = 0.0035*fx.w + 0.0015;
    float ring = smoothstep(w, 0.0, abs(ang-rr))*(1.0-k)*fx.y;
    float pr = fx.z*0.2*fx.w, ping = fx.z<1.0 ? smoothstep(w*1.5, 0.0, abs(ang-pr))*(1.0-fx.z) : 0.0; // burst when a replay reaches a new moment
    float dot0 = smoothstep(0.010*fx.w, 0.003*fx.w, ang)*0.8; // small glow where the machine sits
    rings += uBeaconCol[i]*(ring + ping + dot0)*2.4;
  }
  col += rings;
  // impact shockwaves, also painted on the ground
  for(int i=0;i<3;i++){
    float pr = uImpact[i].w;
    if(pr < 1.0){
      float ang = acos(clamp(dot(pObj, uImpact[i].xyz), -1.0, 1.0)), rr = 0.012 + 0.3*(1.0-pow(1.0-pr,3.0)), w = 0.006 + 0.012*pr;
      float ring = smoothstep(w, 0.0, abs(ang-rr))*(1.0-pr), glow = smoothstep(0.035, 0.0, ang)*(1.0-pr);
      col += vec3(1.0,0.62,0.28)*(ring*1.8 + glow*0.9)*2.0;
    }
  }
  gl_FragColor = vec4(col,1.0);
  #include <colorspace_fragment>
}`;

export const atmoVert = /* glsl */ `
varying vec3 vN; varying vec3 vV; varying vec3 vWN;
void main(){
  vN = normalize(normalMatrix*normal); vWN = normalize(mat3(modelMatrix)*normal);
  vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix*mv;
}`;

export const atmoFrag = /* glsl */ `
precision highp float;
uniform vec3 uColor; uniform float uStrength; uniform float uPow; uniform float uInner; uniform vec3 uSun;
varying vec3 vN; varying vec3 vV; varying vec3 vWN;
void main(){
  float a = -dot(normalize(vN), normalize(vV));
  float g = pow(clamp(a/uInner,0.0,1.0), uPow);
  float sunSide = 0.25 + 0.75*smoothstep(-0.3,0.7,dot(normalize(vWN),normalize(uSun)));
  gl_FragColor = vec4(pow(uColor,vec3(2.2))*g*uStrength*sunSide, 1.0);
  #include <colorspace_fragment>
}`;

export const starVert = /* glsl */ `
attribute float aSize; attribute float aPhase; attribute vec3 aColor;
uniform float uTime; uniform float uPx; varying vec3 vC; varying float vA;
void main(){
  vC = aColor; vA = 0.78 + 0.22*sin(uTime*(0.6+aPhase)+aPhase*40.0);
  vec4 mv = modelViewMatrix*vec4(position,1.0);
  gl_PointSize = aSize*uPx; gl_Position = projectionMatrix*mv;
}`;
export const starFrag = /* glsl */ `
precision highp float; varying vec3 vC; varying float vA;
void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.0,d); gl_FragColor=vec4(vC*a*vA, a*vA); }`;

export const dustVert = /* glsl */ `
attribute float aSeed; uniform float uTime; uniform float uPx; varying float vA;
void main(){
  vec3 p = position; p.x += sin(uTime*.12+aSeed*20.)*.35; p.y += sin(uTime*.09+aSeed*31.)*.25; p.z += cos(uTime*.1+aSeed*17.)*.35;
  vec4 mv = modelViewMatrix*vec4(p,1.0); vA = .08+.1*fract(aSeed*7.);
  gl_PointSize = (1.1+1.6*fract(aSeed*13.))*uPx; gl_Position = projectionMatrix*mv;
}`;
export const dustFrag = /* glsl */ `
precision highp float; varying float vA;
void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.0,d)*vA; gl_FragColor=vec4(vec3(1.0,.52,.30)*a, a); }`;

// ---- Far-away worlds seen in the sky (Earth, Jupiter, Saturn). Small on screen, so a per-frame shader is fine. ----
export const farVert = /* glsl */ `
varying vec3 vObj; varying vec3 vWN; varying vec3 vWP; varying float vR;
void main(){
  vObj = normalize(position); vR = length(position.xy);
  vec4 wp = modelMatrix*vec4(position,1.0); vWP = wp.xyz; vWN = normalize(mat3(modelMatrix)*normal);
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;

export const earthFrag = /* glsl */ `
precision highp float; uniform vec3 uSun; uniform float uTime; varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
${NOISE}
vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
void main(){
  vec3 p=normalize(vObj), N=normalize(vWN), L=normalize(uSun), V=normalize(cameraPosition-vWP);
  float land=fbm(p*2.4+3.0,5.0);
  float isLand=smoothstep(.50,.53,land);
  vec3 ocean=mix(vec3(.02,.10,.32),vec3(.05,.25,.55),smoothstep(.25,.5,land));
  vec3 ground=mix(vec3(.12,.30,.10),vec3(.58,.48,.28),smoothstep(.55,.75,fbm(p*3.0+9.0,3.0)));
  vec3 col=mix(ocean,ground,isLand);
  float ice=smoothstep(.83,.92,abs(p.y)+(fbm(p*6.0,3.0)-.5)*.1); col=mix(col,vec3(.95,.97,1.0),ice);
  float cl=smoothstep(.48,.72,fbm(p*3.6+vec3(uTime*.01,0.,0.)+17.0,4.0)); col=mix(col,vec3(.96),cl*.85);
  col=lin(col);
  float lit=smoothstep(-0.03,0.25,dot(N,L))*max(dot(N,L),0.0)*1.15;
  float night=1.0-smoothstep(-0.05,0.2,dot(N,L));
  vec3 c=col*(lit*lin(vec3(1.0,.97,.92))*1.6+lin(vec3(.03,.05,.12))*.3);
  c+=lin(vec3(.18,.38,.9))*pow(1.0-max(dot(N,V),0.0),3.0)*(0.25+0.75*smoothstep(-0.2,0.6,dot(N,L)))*0.9;
  gl_FragColor=vec4(c,1.0);
  #include <colorspace_fragment>
}`;

export const gasFrag = /* glsl */ `
precision highp float; uniform vec3 uSun; uniform float uTime; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform float uFreq;
varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
${NOISE}
vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
void main(){
  vec3 p=normalize(vObj), N=normalize(vWN), L=normalize(uSun), V=normalize(cameraPosition-vWP);
  float warp=fbm(vec3(p.x*3.0,p.y*1.5,p.z*3.0)+uTime*.01,4.0);
  float band=sin((p.y+warp*.22)*uFreq)*.5+.5;
  vec3 col=mix(uC1,uC2,band);
  col=mix(col,uC3,smoothstep(.55,.8,fbm(vec3(p.x*6.0,p.y*14.0,p.z*6.0),3.0))*.5);
  col=col*(0.35+0.65*pow(max(dot(N,V),0.0),0.6)); // uniform colours are already linear (THREE.Color)
  float lit=smoothstep(-0.03,0.3,dot(N,L))*max(dot(N,L),0.0)*1.1;
  gl_FragColor=vec4(col*(lit*lin(vec3(1.0,.96,.9))*1.7+lin(vec3(.03,.04,.08))*.25),1.0);
  #include <colorspace_fragment>
}`;

export const ringFrag = /* glsl */ `
precision highp float; uniform vec3 uSun; varying float vR; varying vec3 vWN;
float h(float x){ return fract(sin(x*127.1)*43758.5453); }
void main(){
  float t=(vR-1.25)/(2.4-1.25);
  float bands=0.55+0.25*sin(t*70.0)+0.2*sin(t*23.0+1.3)+0.15*h(floor(t*120.0));
  float gap=1.0-smoothstep(.0,.03,abs(t-0.62)-.03); // Cassini-like gap
  float a=clamp(bands,0.0,1.0)*(1.0-gap)*smoothstep(0.0,.05,t)*(1.0-smoothstep(.92,1.0,t))*0.85;
  vec3 col=mix(vec3(.62,.54,.40),vec3(.84,.76,.58),t);
  col=pow(col,vec3(2.2));
  gl_FragColor=vec4(col*1.5,a);
  #include <colorspace_fragment>
}`;
