(this.webpackJsonpweb=this.webpackJsonpweb||[]).push([[0],{18:function(n,e,t){"use strict";var r=this&&this.__extends||function(){var n=function(e,t){return(n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(n,e){n.__proto__=e}||function(n,e){for(var t in e)Object.prototype.hasOwnProperty.call(e,t)&&(n[t]=e[t])})(e,t)};return function(e,t){function r(){this.constructor=e}n(e,t),e.prototype=null===t?Object.create(t):(r.prototype=t.prototype,new r)}}(),i=this&&this.__assign||function(){return(i=Object.assign||function(n){for(var e,t=1,r=arguments.length;t<r;t++)for(var i in e=arguments[t])Object.prototype.hasOwnProperty.call(e,i)&&(n[i]=e[i]);return n}).apply(this,arguments)},o=this&&this.__spreadArrays||function(){for(var n=0,e=0,t=arguments.length;e<t;e++)n+=arguments[e].length;var r=Array(n),i=0;for(e=0;e<t;e++)for(var o=arguments[e],a=0,c=o.length;a<c;a++,i++)r[i]=o[a];return r};Object.defineProperty(e,"__esModule",{value:!0}),e.apply=e.infer=e.unify=e.combine=e.substitute=e.TypeInferenceError=void 0;var a=t(2),c=function(n){function e(e){var t=n.call(this,e)||this;return t.name="TypeInferenceError",t}return r(e,n),e}(Error);function u(n,e){var t=e,r={};for(var i in t)r[i]=y(t[i],n);return r}function s(){for(var n=[],e=0;e<arguments.length;e++)n[e]=arguments[e];if(0===n.length)return{};if(1===n.length)return n[0];if(n.length>2)return s(n[0],s.apply(void 0,n.slice(1)));var t=n[0],r=n[1],i={};for(var o in t)i[o]=y(t[o],r);for(var o in r)o in t||(i[o]=r[o]);return i}function p(n,e){var t;if(n instanceof a.TypeVar){if(b(e,n))throw new c("Contains/occurs check failed with "+JSON.stringify(n)+" and "+JSON.stringify(e));return(t={})[n.name]=e,t}if(e instanceof a.TypeVar)return p(e,n);if(n instanceof a.TypeFuncApp&&e instanceof a.TypeFuncApp){if(n.constructorName!==e.constructorName)throw new c("Could not unify type function applications with different constructors '"+n.constructorName+"' and '"+e.constructorName+"'");if(n.args.length!==e.args.length)throw new c("Could not unify type function applications with different argument list lengths "+JSON.stringify(n)+" and "+JSON.stringify(e));for(var r={},i=0;i<n.args.length;i++)r=s(p(y(n.args[i],r),y(e.args[i],r)),r);return r}throw new Error("Internal error, this should never happen")}function f(n,e){var t=new Set(e);return n.filter((function(n){return!t.has(n)}))}function l(n){if(n instanceof a.PolyType)return f(l(n.monoType),n.quantifiedVars);if(n instanceof a.TypeVar)return[n.name];if(n instanceof a.TypeFuncApp)return n.args.map(l).reduce((function(n,e){return o(n,e)}),[]);if(n)return Object.values(n).map(l).reduce((function(n,e){return o(n,e)}),[]);throw new Error("Internal error, this should never happen")}function h(n,e,t){var r,o;if(n instanceof a.CharLiteral)return[d(new a.PolyType([],new a.TypeFuncApp("char")),t),{}];if(n instanceof a.NumberLiteral)return[d(new a.PolyType([],new a.TypeFuncApp("number")),t),{}];if(n instanceof a.Var){var b=e[n.name];if(!b)throw new c(n.name+" is not in scope");return[d(b,t),{}]}if(n instanceof a.App){var w=h(n.func,e,t),j=w[0],m=w[1],v=h(n.arg,u(m,e),t),g=v[0],O=v[1],x=new a.TypeVar(t()),T=p(y(j,O),new a.TypeFuncApp("->",g,x));return[y(x,T),s(m,O,T)]}if(n instanceof a.Abs){x=new a.TypeVar(t());var F=h(n.body,i(i({},e),((r={})[n.param]=new a.PolyType([],x),r)),t),A=F[0],S=F[1];return[y(new a.TypeFuncApp("->",x,A),S),S]}if(n instanceof a.Let){var C=h(n.def,e,t),_=C[0],k=C[1],N=h(n.body,i(i({},u(k,e)),((o={})[n.param]=function(n,e){return new a.PolyType(f(l(e),l(n)),e)}(u(k,e),_),o)),t);return[A=N[0],s(k,S=N[1])]}throw new Error("Internal error, this should never happen")}function d(n,e,t,r){if(void 0===t&&(t=[]),void 0===r&&(r=[]),n instanceof a.TypeVar){var i=t.indexOf(n.name);return-1===i?n:new a.TypeVar(r[i])}if(n instanceof a.TypeFuncApp)return new(a.TypeFuncApp.bind.apply(a.TypeFuncApp,o([void 0,n.constructorName],n.args.map((function(n){return d(n,e,t,r)})))));if(n instanceof a.PolyType)return d(n.monoType,e,n.quantifiedVars,n.quantifiedVars.map(e));throw new Error("Internal error, this should never happen")}function y(n,e){if(n instanceof a.TypeVar)return n.name in e?e[n.name]:n;if(n instanceof a.TypeFuncApp)return new(a.TypeFuncApp.bind.apply(a.TypeFuncApp,o([void 0,n.constructorName],n.args.map((function(n){return y(n,e)})))));if(n instanceof a.PolyType)return new a.PolyType(n.quantifiedVars,y(n.monoType,e));throw new Error("Internal error, this should never happen")}function b(n,e){if(n instanceof a.TypeVar)return n.name==e.name;if(n instanceof a.TypeFuncApp)return n.args.some((function(n){return b(n,e)}));if(n instanceof a.PolyType)return b(n.monoType,e)&&!n.quantifiedVars.includes(e.name);throw new Error("Internal error, this should never happen")}e.TypeInferenceError=c,e.substitute=u,e.combine=s,e.unify=p,e.infer=function(n,e,t){void 0===e&&(e=!1),void 0===t&&(t=a.typeUtils.standardCtx);var r=0,i=function(){return"t"+r++};if(!e)return h(n,t,i)[0];try{return{accepted:!0,value:h(n,t,i)[0]}}catch(o){return{accepted:!1,issuePosition:{start:0,end:0},message:o.message}}},e.apply=y},2:function(n,e,t){"use strict";var r=this&&this.__extends||function(){var n=function(e,t){return(n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(n,e){n.__proto__=e}||function(n,e){for(var t in e)Object.prototype.hasOwnProperty.call(e,t)&&(n[t]=e[t])})(e,t)};return function(e,t){function r(){this.constructor=e}n(e,t),e.prototype=null===t?Object.create(t):(r.prototype=t.prototype,new r)}}(),i=this&&this.__spreadArrays||function(){for(var n=0,e=0,t=arguments.length;e<t;e++)n+=arguments[e].length;var r=Array(n),i=0;for(e=0;e<t;e++)for(var o=arguments[e],a=0,c=o.length;a<c;a++,i++)r[i]=o[a];return r};Object.defineProperty(e,"__esModule",{value:!0}),e.typeUtils=e.ParseError=e.parse=e.PolyType=e.TypeFuncApp=e.TypeVar=e.Let=e.Abs=e.App=e.Var=e.NumberLiteral=e.CharLiteral=void 0;var o=t(25),a=function(){function n(n){this.value=n}return n.prototype.toString=function(){return this.value},n}();e.CharLiteral=a;var c=function(){function n(n){this.value=n}return n.prototype.toString=function(){return this.value.toString()},n}();e.NumberLiteral=c;var u=function(){function n(n){this.name=n}return n.prototype.toString=function(){return this.name},n}();e.Var=u;var s=function(){function n(n,e){this.func=n,this.arg=e}return n.prototype.toString=function(){return"("+this.func.toString()+" "+this.arg.toString()+")"},n}();e.App=s;var p=function(){function n(n,e){this.param=n,this.body=e}return n.prototype.toString=function(){return"(\\"+this.param+" -> "+this.body.toString()+")"},n}();e.Abs=p;var f=function(){function n(n,e,t){this.param=n,this.def=e,this.body=t}return n.prototype.toString=function(){return"(let "+this.param+" = "+this.def.toString()+" in "+this.body.toString()+")"},n}();e.Let=f;var l=function(){function n(n){this.name=n}return n.prototype.toString=function(){return this.name},n}();e.TypeVar=l;var h=function(){function n(n){for(var e=[],t=1;t<arguments.length;t++)e[t-1]=arguments[t];this.constructorName=n,this.args=e}return n.prototype.toString=function(){return this.constructorName+(this.args.length?" ":"")+this.args.map((function(n){return"("+n.toString()+")"})).join(" ")},n}();e.TypeFuncApp=h;var d=function(){function n(n,e){this.quantifiedVars=n,this.monoType=e}return n.prototype.toString=function(){return this.quantifiedVars.map((function(n){return"\u2200"+n})).join("")+": "+this.monoType.toString()},n}();e.PolyType=d;var y=new h("number"),b=new h("char"),w=new h("boolean"),j=function n(e,t){for(var r=[],o=2;o<arguments.length;o++)r[o-2]=arguments[o];return 0===r.length?new h("->",e,t):new h("->",e,n.apply(void 0,i([t,r[0]],r.slice(1))))},m=function(n){return new h("[]",n)},v=function(){for(var n=[],e=0;e<arguments.length;e++)n[e]=arguments[e];if(n.length<=1)throw new Error("Tuple has too few elements, minimum of 2 but given "+n.length);if(n.length>8)throw new Error("Tuple has too many elements, maximum of 8 but given "+n.length);return new(h.bind.apply(h,i([void 0,",".repeat(n.length-1)],n)))},g=function(n){return new h("Maybe",n)},O=function(n,e){return new h("Either",n,e)},x=new l("a"),T=new l("b"),F=new l("c"),A=new l("d"),S=function(n){return new d([],n)},C={"+":S(j(y,y,y)),"*":S(j(y,y,y)),"-":S(j(y,y,y)),"/":S(j(y,y,y)),"%":S(j(y,y,y)),negate:S(j(y,y)),abs:S(j(y,y)),signum:S(j(y,y)),even:S(j(y,w)),odd:S(j(y,w)),not:S(j(w,w)),"&&":S(j(w,w,w)),"||":S(j(w,w,w)),True:S(w),False:S(w),myNumber:S(y),myBoolean:S(w),"[]":new d(["a"],m(x)),":":new d(["a"],j(x,m(x),m(x))),cons:new d(["a"],j(x,m(x),m(x))),"++":new d(["a"],j(m(x),m(x),m(x))),head:new d(["a"],j(m(x),x)),last:new d(["a"],j(m(x),x)),tail:new d(["a"],j(m(x),m(x))),init:new d(["a"],j(m(x),m(x))),uncons:new d(["a"],j(m(x),g(v(x,m(x))))),null:new d(["a"],j(m(x),w)),length:new d(["a"],j(m(x),y)),map:new d(["a","b"],j(j(x,T),m(x),m(T))),reverse:new d(["a"],j(m(x),m(x))),intersperse:new d(["a"],j(x,m(x),m(x))),intercalate:new d(["a"],j(m(x),m(m(x)),m(x))),transpose:new d(["a"],j(m(m(x)),m(m(x)))),subsequences:new d(["a"],j(m(x),m(m(x)))),permutations:new d(["a"],j(m(x),m(m(x)))),foldl:new d(["a"],j(j(T,x,T),T,m(x),T)),"foldl'":new d(["a"],j(j(T,x,T),T,m(x),T)),foldl1:new d(["a"],j(j(x,x,x),m(x),x)),"foldl1'":new d(["a"],j(j(x,x,x),m(x),x)),foldr:new d(["a"],j(j(x,T,T),T,m(x),T)),foldr1:new d(["a"],j(j(x,x,x),m(x),x)),concat:new d(["a"],j(m(m(x)),m(x))),concatMap:new d(["a"],j(j(x,m(x)),m(x),m(T))),and:S(j(m(w),w)),or:S(j(m(w),w)),any:new d(["a"],j(j(x,w),m(x),w)),all:new d(["a"],j(j(x,w),m(x),w)),sum:S(j(m(y),y)),product:S(j(m(y),y)),maximum:S(j(m(y),y)),minimum:S(j(m(y),y)),take:new d(["a"],j(y,m(x),m(x))),drop:new d(["a"],j(y,m(x),m(x))),splitAt:new d(["a"],j(y,m(x),v(m(x),m(x)))),takeWhile:new d(["a"],j(j(x,w),m(x),m(x))),dropWhile:new d(["a"],j(j(x,w),m(x),m(x))),elem:new d(["a"],j(x,m(x),w)),notElem:new d(["a"],j(x,m(x),w)),lookup:new d(["a","b"],j(x,m(v(x,T)),g(T))),find:new d(["a"],j(j(x,w),m(x),g(x))),filter:new d(["a"],j(j(x,w),m(x),m(x))),partition:new d(["a"],j(j(x,w),m(x),v(m(x),m(x)))),"!!":new d(["a"],j(m(x),y,x)),zip:new d(["a","b"],j(m(x),m(T),m(v(x,T)))),zipWith:new d(["a","b","c"],j(j(x,T,F),m(x),m(T),m(F))),unzip:new d(["a","b"],j(m(v(x,T)),v(m(x),m(T)))),nub:new d(["a"],j(m(x),m(x))),delete:new d(["a"],j(x,m(x),m(x))),"\\\\":new d(["a"],j(m(x),m(x),m(x))),union:new d(["a"],j(m(x),m(x),m(x))),intersect:new d(["a"],j(m(x),m(x),m(x))),sort:new d(["a"],j(m(x),m(x))),",":new d(["a","b"],j(x,T,v(x,T))),",,":new d(["a","b","c"],j(x,T,F,v(x,T,F))),",,,":new d(["a","b","c","d"],j(x,T,F,A,v(x,T,F,A))),fst:new d(["a","b"],j(v(x,T),x)),snd:new d(["a","b"],j(v(x,T),T)),curry:new d(["a","b","c"],j(j(v(x,T),F),x,T,F)),uncurry:new d(["a","b","c"],j(j(x,T,F),v(x,T),F)),Just:new d(["a"],j(x,g(x))),Nothing:new d(["a"],g(x)),Left:new d(["a","b"],j(x,O(x,T))),Right:new d(["a","b"],j(T,O(x,T))),id:new d(["a"],j(x,x))},_=function(n){function e(e){var t=n.call(this,e)||this;return t.name="ParseError",t}return r(e,n),e}(Error);e.ParseError=_;var k=new o.GenLex,N=k.tokenize(o.C.charIn("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*+-/%<>^:[]_|&,").rep().map((function(n){return n.join()})),"identifier"),P=k.tokenize(o.C.charLiteral(),"char"),E=k.tokenize(o.C.stringLiteral(),"string"),V=k.tokenize(o.N.number(),"number"),z=k.tokenize(o.C.char("\\"),"backslash"),L=k.tokenize(o.C.string("->"),"arrow"),I=k.tokenize(o.C.char("("),"lparen"),q=k.tokenize(o.C.char(")"),"rparen"),J=k.tokenize(o.C.string("let"),"let"),M=k.tokenize(o.C.char("="),"equal"),W=k.tokenize(o.C.string("in"),"in"),U=function(){return o.F.try(Y(G())).or(o.F.try(Y(R()))).or(o.F.try(Y(Q()))).or(o.F.try(Y(K())))},B=function(){return o.F.try(G()).or(o.F.try(R())).or(o.F.try(Q())).or(o.F.try(K()))},H=function(n){for(var e=n.split(""),t=new u("[]");e.length;)t=new s(new s(new u(":"),new a(e.pop())),t);return t},G=function(){return o.F.try(V.map((function(n){return new c(n)}))).or(o.F.try(E.map(H))).or(o.F.try(P.map((function(n){return new a(n)})))).or(o.F.try(N.map((function(n){return new u(n)}))))},R=function(){return I.drop().then(D()).then(q.drop()).single()},D=function(){return z.drop().then(N).then(L.drop()).then(o.F.lazy(U)).map((function(n){return new p(n.at(0),n.at(1))}))},K=function(){return I.drop().then(o.F.lazy(U)).then(q.drop()).single()},Q=function(){return I.drop().then(X()).then(q.drop()).single()},X=function(){return J.drop().then(N).then(M.drop()).then(o.F.lazy(U)).then(W.drop()).then(o.F.lazy(U)).map((function(n){return new f(n.at(0),n.at(1),n.at(2))}))},Y=function(n){return n.then(Z()).array().map($)},Z=function(){return o.F.lazy(B).optrep()},$=function(n){return n.reduce((function(n,e){return new s(n,e)}))},nn=k.use(o.F.try(X()).or(o.F.try(D())).or(o.F.try(U())).then(o.F.eos().drop()).single());e.parse=function(n,e){void 0===e&&(e=!1);var t=nn.parse(o.Streams.ofString(n));if(e)return t.isAccepted()?{accepted:!0,value:t.value}:{accepted:!1,issuePosition:{start:t.location(),end:n.length},message:"Failed to parse"};if(t.isAccepted())return t.value;throw new _("Failed to parse:\n\t"+n+"\n\t"+" ".repeat(t.location())+"^")};var en={number:y,char:b,boolean:w,f:j,list:m,tuple:v,maybe:g,either:O,a:x,b:T,c:F,d:A,pt:S,standardCtx:C};e.typeUtils=en},24:function(n,e,t){},34:function(n,e,t){"use strict";t.r(e);var r=t(0),i=t(1),o=t.n(i),a=t(17),c=t.n(a),u=t(13),s=(t(24),t(2)),p=t(18);function f(n){var e=n.node;if(e instanceof s.CharLiteral||e instanceof s.NumberLiteral)return Object(r.jsx)(l,{children:e.value});if(e instanceof s.Var)return Object(r.jsx)(l,{children:e.name});if(e instanceof s.App)return Object(r.jsxs)(r.Fragment,{children:[Object(r.jsx)(l,{children:Object(r.jsx)("span",{className:"sans-serif",children:"Function application"})}),Object(r.jsx)(h,{children:Object(r.jsx)(f,{node:e.func})}),Object(r.jsx)(h,{children:Object(r.jsx)(f,{node:e.arg})})]});if(e instanceof s.Abs)return Object(r.jsxs)(r.Fragment,{children:[Object(r.jsxs)(l,{children:["\u03bb",e.param]}),Object(r.jsx)(h,{symbol:"->",children:Object(r.jsx)(f,{node:e.body})})]});if(e instanceof s.Let)return Object(r.jsxs)(r.Fragment,{children:[Object(r.jsxs)(l,{children:["let ",e.param]}),Object(r.jsx)(h,{symbol:"=",children:Object(r.jsx)(f,{node:e.def})}),Object(r.jsx)(h,{symbol:"in",children:Object(r.jsx)(f,{node:e.body})})]});throw new Error("Attempted to display a node of invalid type "+typeof e)}function l(n){var e=n.children;return Object(r.jsx)("div",{className:"ast-node",children:e})}function h(n){var e=n.children,t=n.symbol;return Object(r.jsx)("div",{className:"ast-child","data-symbol":t,children:e})}var d=function(n){var e=n.ast;return Object(r.jsx)("div",{className:"ast-view",children:Object(r.jsx)(f,{node:e})})};var y=function(n){var e=n.code,t=n.setHighlights,o=Object(i.useMemo)((function(){return Object(s.parse)(e,!0)}),[e]);Object(i.useEffect)((function(){return t(o.accepted?[]:[{start:o.issuePosition.start,end:o.issuePosition.end||0,className:"error"}])}),[o,t]);var a=Object(i.useMemo)((function(){if(o.accepted)return Object(p.infer)(o.value,!0)}),[o]);return Object(i.useEffect)((function(){return a&&t(a.accepted?[]:[{start:a.issuePosition.start,end:a.issuePosition.end||0,className:"error"}])}),[a,t]),o.accepted?a.accepted?Object(r.jsxs)(r.Fragment,{children:[Object(r.jsx)("h2",{children:"AST"}),Object(r.jsx)(d,{ast:o.value}),Object(r.jsx)("h2",{children:"Type"}),Object(r.jsx)("p",{children:a.value.toString()})]}):Object(r.jsxs)(r.Fragment,{children:[Object(r.jsx)("h2",{children:"AST"}),Object(r.jsx)(d,{ast:o.value}),Object(r.jsx)("h2",{children:"Type"}),Object(r.jsx)("p",{children:a.message})]}):Object(r.jsxs)(r.Fragment,{children:[Object(r.jsx)("h2",{children:"AST"}),Object(r.jsx)("p",{children:o.message})]})};var b=function(){var n=Object(i.useState)("map not []"),e=Object(u.a)(n,2),t=e[0],o=e[1],a=Object(i.useState)([]),c=Object(u.a)(a,2),s=c[0],p=c[1];return Object(r.jsxs)(r.Fragment,{children:[Object(r.jsx)("h1",{children:"interactive type inference"}),Object(r.jsx)("h2",{children:"Play with algorithm W in your browser."}),Object(r.jsxs)("h2",{children:["Samples:",Object(r.jsx)("button",{onClick:function(){return o("4")},children:"4"}),Object(r.jsx)("button",{onClick:function(){return o("not")},children:"not"}),Object(r.jsx)("button",{onClick:function(){return o("not True")},children:"not True"}),Object(r.jsx)("button",{onClick:function(){return o("+")},children:"+"}),Object(r.jsx)("button",{onClick:function(){return o("map not []")},children:"map not []"}),Object(r.jsx)("button",{onClick:function(){return o("fst")},children:"fst"}),Object(r.jsx)("button",{onClick:function(){return o("Just")},children:"Just"}),Object(r.jsx)("button",{onClick:function(){return o("let x = 3 in + x")},children:"let x = 3 in + x"}),Object(r.jsxs)("button",{onClick:function(){return o("\\x -> / x 2")},children:["\\x -",">"," / x 2"]}),Object(r.jsx)("button",{onClick:function(){return o("cons 23 []")},children:"cons 23 []"})]}),Object(r.jsxs)("div",{className:"code-container",children:[Object(r.jsx)("input",{placeholder:"Enter code...",value:t,onChange:function(n){return o(n.target.value)}}),t&&s.map((function(n,e){return Object(r.jsxs)("p",{children:[t.slice(0,n.start),Object(r.jsx)("span",{className:n.className,children:t.slice(n.start,n.end)}),t.slice(n.end)]},e)}))]}),t&&Object(r.jsx)(y,{code:t,setHighlights:p})]})};c.a.render(Object(r.jsx)(o.a.StrictMode,{children:Object(r.jsx)(b,{})}),document.getElementById("root"))}},[[34,1,2]]]);
//# sourceMappingURL=main.61d864e6.chunk.js.map