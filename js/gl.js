/* Bilim Plus — WebGL hero: domain-warped "ink & saffron" field with topographic
   contour lines and a mouse-driven lens. Raw WebGL1, no dependencies. */
(function () {
  'use strict';
  window.HeroGL = function (canvas, opts) {
    opts = opts || {};
    var gl = null;
    try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false }); } catch (e) { gl = null; }
    if (!gl) return null;

    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision highp float;',
      'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uHover;uniform float uScroll;uniform float uIntro;',
      'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
      'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
      ' return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}',
      'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}',
      'void main(){',
      ' vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;',
      ' vec2 p=(uv-.5)*vec2(asp,1.);vec2 m=(uMouse-.5)*vec2(asp,1.);',
      ' vec2 dm=p-m;float d=length(dm);float infl=exp(-d*d*4.5)*uHover;',
      ' p-=dm*infl*.45;',
      ' p.y+=uScroll*.35;',
      ' float t=uTime*.045;',
      ' vec2 sp=p*1.25+vec2(.3,.1);',
      ' vec2 q=vec2(fbm(sp+vec2(0.,t)),fbm(sp+vec2(5.2,1.3)-t));',
      ' vec2 r=vec2(fbm(sp+3.2*q+vec2(1.7,9.2)+t*1.4),fbm(sp+3.2*q+vec2(8.3,2.8)-t*1.1));',
      ' float f=fbm(sp+3.*r+infl*.6);',
      ' vec3 ink=vec3(.024,.16,.106);vec3 plum=vec3(.043,.31,.2);',
      ' vec3 saff=vec3(.12,.79,.54);vec3 lil=vec3(.89,.886,.97);vec3 cream=vec3(.93,.96,.94);',
      ' vec3 col=mix(ink,plum,smoothstep(.2,.7,f));',
      ' col=mix(col,saff,smoothstep(.45,.9,f*length(q)*1.6));',
      ' col=mix(col,lil,smoothstep(.55,1.,r.y*f*1.8)*.8);',
      ' col=mix(col,cream,smoothstep(.93,1.2,f*length(r)*1.7)*.5);',
      ' float c=f*16.-t*6.;float ln=abs(fract(c)-.5);',
      ' float lw=.05+infl*.05;',
      ' col+=vec3(.9,1.,.95)*(1.-smoothstep(0.,lw,ln))*(.045+infl*.22);',
      ' col+=saff*infl*.18;',
      ' float vig=smoothstep(-.15,.85,uv.y*.75+(1.-uv.x)*.05+uv.x*.2);',
      ' col*=mix(.5,1.,vig);',
      ' col*=smoothstep(0.,1.,uIntro);',
      ' col+=(hash(gl_FragCoord.xy+fract(uTime*7.)*91.)-.5)*.055;',
      ' gl_FragColor=vec4(col,1.);',
      '}'
    ].join('\n');

    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    }
    var v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['uRes', 'uTime', 'uMouse', 'uHover', 'uScroll', 'uIntro'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });

    var scale = opts.scale || 0.6;
    var state = { mx: .62, my: .55, tx: .62, ty: .55, hover: .35, th: .35, scroll: 0, intro: opts.intro == null ? 0 : opts.intro, time: 8 + Math.random() * 20, running: true, visible: true };
    var raf = 0, last = performance.now();

    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(w * dpr * scale));
      canvas.height = Math.max(1, Math.round(h * dpr * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    function draw() {
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, state.time);
      gl.uniform2f(U.uMouse, state.mx, state.my);
      gl.uniform1f(U.uHover, state.hover);
      gl.uniform1f(U.uScroll, state.scroll);
      gl.uniform1f(U.uIntro, state.intro);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      var dt = Math.min((now - last) / 1000, .05); last = now;
      if (!state.visible) return;
      state.time += dt;
      var k = 1 - Math.pow(.001, dt);
      state.mx += (state.tx - state.mx) * k * .9;
      state.my += (state.ty - state.my) * k * .9;
      state.hover += (state.th - state.hover) * k * .6;
      draw();
    }
    resize();
    window.addEventListener('resize', resize);
    if (opts.static) { state.intro = 1; state.hover = .3; draw(); }
    else raf = requestAnimationFrame(loop);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { state.visible = e[0].isIntersecting; }).observe(canvas);
    }
    return {
      state: state,
      pointer: function (x, y) { state.tx = x; state.ty = y; state.th = 1; },
      leave: function () { state.th = .35; },
      redraw: draw
    };
  };
})();
