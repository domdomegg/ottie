(this.webpackJsonpweb=this.webpackJsonpweb||[]).push([[0],{2:function(n,t,e){"use strict";var r=this&&this.__extends||function(){var n=function(t,e){return(n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(n,t){n.__proto__=t}||function(n,t){for(var e in t)Object.prototype.hasOwnProperty.call(t,e)&&(n[e]=t[e])})(t,e)};return function(t,e){function r(){this.constructor=t}n(t,e),t.prototype=null===e?Object.create(e):(r.prototype=e.prototype,new r)}}(),i=this&&this.__spreadArrays||function(){for(var n=0,t=0,e=arguments.length;t<e;t++)n+=arguments[t].length;var r=Array(n),i=0;for(t=0;t<e;t++)for(var o=arguments[t],a=0,s=o.length;a<s;a++,i++)r[i]=o[a];return r};Object.defineProperty(t,"__esModule",{value:!0}),t.typeUtils=t.ParseError=t.parse=t.PolyType=t.TypeFuncApp=t.TypeVar=t.Let=t.Abs=t.App=t.Var=t.NumberLiteral=t.CharLiteral=void 0;var o=e(28),a=function(){function n(n,t,e){this.value=n,this.pos=t,this.notes=e}return n.prototype.toString=function(){return"'"+this.value+"'"},n}();t.CharLiteral=a;var s=function(){function n(n,t,e){this.value=n,this.pos=t,this.notes=e}return n.prototype.toString=function(){return this.value.toString()},n}();t.NumberLiteral=s;var c=function(){function n(n,t,e){this.name=n,this.pos=t,this.notes=e}return n.prototype.toString=function(){return this.name},n}();t.Var=c;var u=function(){function n(n,t,e,r){this.func=n,this.arg=t,this.pos=e,this.notes=r}return n.prototype.toString=function(){return"("+this.func.toString()+" "+this.arg.toString()+")"},n}();t.App=u;var p=function(){function n(n,t,e,r){this.param=n,this.body=t,this.pos=e,this.notes=r}return n.prototype.toString=function(){return"(\\"+this.param+" -> "+this.body.toString()+")"},n}();t.Abs=p;var h=function(){function n(n,t,e,r,i){this.param=n,this.def=t,this.body=e,this.pos=r,this.notes=i}return n.prototype.toString=function(){return"(let "+this.param+" = "+this.def.toString()+" in "+this.body.toString()+")"},n}();t.Let=h;var l=function(){function n(n){this.name=n}return n.prototype.toString=function(){return this.name},n}();t.TypeVar=l;var f=function(){function n(n){for(var t=[],e=1;e<arguments.length;e++)t[e-1]=arguments[e];this.constructorName=n,this.args=t}return n.prototype.toString=function(){return"->"==this.constructorName?(this.args[0]instanceof n&&"->"==this.args[0].constructorName?"("+this.args[0].toString()+")":this.args[0].toString())+" -> "+this.args[1].toString():"[]"==this.constructorName?"["+this.args[0].toString()+"]":this.constructorName.startsWith(",")?"("+this.args.join(", ")+")":this.args.every((function(n){return n instanceof l||"number"==n.constructorName||"char"==n.constructorName||"boolean"==n.constructorName}))?this.constructorName+(this.args.length?" ":"")+this.args.map((function(n){return""+n.toString()})).join(" "):this.constructorName+(this.args.length?" ":"")+this.args.map((function(n){return"("+n.toString()+")"})).join(" ")},n}();t.TypeFuncApp=f;var d=function(){function n(n,t){this.quantifiedVars=n,this.monoType=t}return n.prototype.toString=function(){return(this.quantifiedVars.length?this.quantifiedVars.map((function(n){return"\u2200"+n})).join("")+": ":"")+this.monoType.toString()},n}();t.PolyType=d;var b=new f("number"),y=new f("char"),m=new f("boolean"),g=function n(t,e){for(var r=[],o=2;o<arguments.length;o++)r[o-2]=arguments[o];return 0===r.length?new f("->",t,e):new f("->",t,n.apply(void 0,i([e,r[0]],r.slice(1))))},w=function(n){return new f("[]",n)},j=function(){for(var n=[],t=0;t<arguments.length;t++)n[t]=arguments[t];if(n.length<=1)throw new Error("Tuple has too few elements, minimum of 2 but given "+n.length);if(n.length>8)throw new Error("Tuple has too many elements, maximum of 8 but given "+n.length);return new(f.bind.apply(f,i([void 0,",".repeat(n.length-1)],n)))},v=function(n){return new f("Maybe",n)},O=function(n,t){return new f("Either",n,t)},x=new l("a"),T=new l("b"),S=new l("c"),F=new l("d"),k=function(n){return new d([],n)},C={"+":k(g(b,b,b)),"*":k(g(b,b,b)),"-":k(g(b,b,b)),"/":k(g(b,b,b)),"%":k(g(b,b,b)),negate:k(g(b,b)),abs:k(g(b,b)),signum:k(g(b,b)),even:k(g(b,m)),odd:k(g(b,m)),not:k(g(m,m)),"&&":k(g(m,m,m)),"||":k(g(m,m,m)),True:k(m),False:k(m),myNumber:k(b),myBoolean:k(m),"[]":new d(["a"],w(x)),":":new d(["a"],g(x,w(x),w(x))),cons:new d(["a"],g(x,w(x),w(x))),"++":new d(["a"],g(w(x),w(x),w(x))),head:new d(["a"],g(w(x),x)),last:new d(["a"],g(w(x),x)),tail:new d(["a"],g(w(x),w(x))),init:new d(["a"],g(w(x),w(x))),uncons:new d(["a"],g(w(x),v(j(x,w(x))))),null:new d(["a"],g(w(x),m)),length:new d(["a"],g(w(x),b)),map:new d(["a","b"],g(g(x,T),w(x),w(T))),reverse:new d(["a"],g(w(x),w(x))),intersperse:new d(["a"],g(x,w(x),w(x))),intercalate:new d(["a"],g(w(x),w(w(x)),w(x))),transpose:new d(["a"],g(w(w(x)),w(w(x)))),subsequences:new d(["a"],g(w(x),w(w(x)))),permutations:new d(["a"],g(w(x),w(w(x)))),foldl:new d(["a"],g(g(T,x,T),T,w(x),T)),"foldl'":new d(["a"],g(g(T,x,T),T,w(x),T)),foldl1:new d(["a"],g(g(x,x,x),w(x),x)),"foldl1'":new d(["a"],g(g(x,x,x),w(x),x)),foldr:new d(["a"],g(g(x,T,T),T,w(x),T)),foldr1:new d(["a"],g(g(x,x,x),w(x),x)),concat:new d(["a"],g(w(w(x)),w(x))),concatMap:new d(["a"],g(g(x,w(x)),w(x),w(T))),and:k(g(w(m),m)),or:k(g(w(m),m)),any:new d(["a"],g(g(x,m),w(x),m)),all:new d(["a"],g(g(x,m),w(x),m)),sum:k(g(w(b),b)),product:k(g(w(b),b)),maximum:k(g(w(b),b)),minimum:k(g(w(b),b)),take:new d(["a"],g(b,w(x),w(x))),drop:new d(["a"],g(b,w(x),w(x))),splitAt:new d(["a"],g(b,w(x),j(w(x),w(x)))),takeWhile:new d(["a"],g(g(x,m),w(x),w(x))),dropWhile:new d(["a"],g(g(x,m),w(x),w(x))),elem:new d(["a"],g(x,w(x),m)),notElem:new d(["a"],g(x,w(x),m)),lookup:new d(["a","b"],g(x,w(j(x,T)),v(T))),find:new d(["a"],g(g(x,m),w(x),v(x))),filter:new d(["a"],g(g(x,m),w(x),w(x))),partition:new d(["a"],g(g(x,m),w(x),j(w(x),w(x)))),"!!":new d(["a"],g(w(x),b,x)),zip:new d(["a","b"],g(w(x),w(T),w(j(x,T)))),zipWith:new d(["a","b","c"],g(g(x,T,S),w(x),w(T),w(S))),unzip:new d(["a","b"],g(w(j(x,T)),j(w(x),w(T)))),nub:new d(["a"],g(w(x),w(x))),delete:new d(["a"],g(x,w(x),w(x))),"\\\\":new d(["a"],g(w(x),w(x),w(x))),union:new d(["a"],g(w(x),w(x),w(x))),intersect:new d(["a"],g(w(x),w(x),w(x))),sort:new d(["a"],g(w(x),w(x))),",":new d(["a","b"],g(x,T,j(x,T))),",,":new d(["a","b","c"],g(x,T,S,j(x,T,S))),",,,":new d(["a","b","c","d"],g(x,T,S,F,j(x,T,S,F))),fst:new d(["a","b"],g(j(x,T),x)),snd:new d(["a","b"],g(j(x,T),T)),curry:new d(["a","b","c"],g(g(j(x,T),S),x,T,S)),uncurry:new d(["a","b","c"],g(g(x,T,S),j(x,T),S)),Just:new d(["a"],g(x,v(x))),Nothing:new d(["a"],v(x)),Left:new d(["a","b"],g(x,O(x,T))),Right:new d(["a","b"],g(T,O(x,T))),id:new d(["a"],g(x,x))},A=function(n){function t(t){var e=n.call(this,t)||this;return e.name="ParseError",e}return r(t,n),t}(Error);t.ParseError=A;var N=new o.GenLex,P=N.tokenize(o.C.charIn("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*+-/%<>^:[]_|&,").rep().map((function(n){return n.join()})),"identifier"),_=N.tokenize(o.C.charLiteral(),"char"),E=N.tokenize(o.C.stringLiteral(),"string"),V=N.tokenize(o.N.number(),"number"),L=N.tokenize(o.C.char("\\"),"backslash"),z=N.tokenize(o.C.string("->"),"arrow"),I=N.tokenize(o.C.char("("),"lparen"),q=N.tokenize(o.C.char(")"),"rparen"),M=N.tokenize(o.C.string("let"),"let"),W=N.tokenize(o.C.char("="),"equal"),J=N.tokenize(o.C.string("in"),"in"),B=function(){return o.F.try($(D())).or(o.F.try($(K()))).or(o.F.try($(Y()))).or(o.F.try($(X())))},U=function(){return o.F.try(D()).or(o.F.try(K())).or(o.F.try(Y())).or(o.F.try(X()))},H=function(n,t){for(var e=n.split(""),r=G(t),i=new c("[]",{start:r.end-1,end:r.end}),o=e.length-1;o>=0;o--){var s={start:r.start+1+o,end:r.start+2+o};i=new u(new u(new c(":",s),new a(e[o],s),s),i,{start:r.start+1+o,end:r.end-1})}return i.pos.start=r.start,i.pos.end=r.end,i},G=function(n){var t=n.getOffset()-1,e=n.input.location(t),r=n.input.location(t+1),i=n.input.source.input.source.slice(e,r);return{start:e,end:r-(i.length-i.trimEnd().length)}},R=function(n,t){var e=t.input.source.input.source;return n.pos.end+=e.slice(n.pos.end).indexOf(")")+1,n.pos.start=e.slice(0,n.pos.start).lastIndexOf("("),n},D=function(){return o.F.try(V.map((function(n,t){return new s(n,G(t))}))).or(o.F.try(E.map(H))).or(o.F.try(_.map((function(n,t){return new a(n,G(t))})))).or(o.F.try(P.map((function(n,t){return new c(n,G(t))}))))},K=function(){return I.drop().then(Q()).then(q.drop()).single().map(R)},Q=function(){return L.map((function(n,t){return t.location()-1})).then(P).then(z.drop()).then(o.F.lazy(B)).map((function(n,t){return new p(n.at(1),n.at(2),{start:n.at(0),end:t.location()})}))},X=function(){return I.drop().then(o.F.lazy(B)).then(q.drop()).single().map(R)},Y=function(){return I.drop().then(Z()).then(q.drop()).single().map(R)},Z=function(){return M.map((function(n,t){return G(t).start})).then(P).then(W.drop()).then(o.F.lazy(B)).then(J.drop()).then(o.F.lazy(B)).map((function(n,t){return new h(n.at(1),n.at(2),n.at(3),{start:n.at(0),end:t.location()})}))},$=function(n){return n.then(nn()).array().map(tn)},nn=function(){return o.F.lazy(U).optrep()},tn=function(n){return n.reduce((function(n,t){return new u(n,t,{start:n.pos.start,end:t.pos.end})}))},en=N.use(o.F.try(Z()).or(o.F.try(Q())).or(o.F.try(B())).then(o.F.eos().drop()).single());t.parse=function(n,t){void 0===t&&(t=!1);var e=en.parse(o.Streams.ofString(n));if(t)return e.isAccepted()?{accepted:!0,value:e.value}:{accepted:!1,issuePosition:{start:e.location(),end:n.length},message:"Failed to parse"};if(e.isAccepted())return e.value;throw new A("Failed to parse:\n\t"+n+"\n\t"+" ".repeat(e.location())+"^")};var rn={number:b,char:y,boolean:m,f:g,list:w,tuple:j,maybe:v,either:O,a:x,b:T,c:S,d:F,pt:k,standardCtx:C};t.typeUtils=rn},20:function(n,t,e){"use strict";var r=this&&this.__extends||function(){var n=function(t,e){return(n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(n,t){n.__proto__=t}||function(n,t){for(var e in t)Object.prototype.hasOwnProperty.call(t,e)&&(n[e]=t[e])})(t,e)};return function(t,e){function r(){this.constructor=t}n(t,e),t.prototype=null===e?Object.create(e):(r.prototype=e.prototype,new r)}}(),i=this&&this.__assign||function(){return(i=Object.assign||function(n){for(var t,e=1,r=arguments.length;e<r;e++)for(var i in t=arguments[e])Object.prototype.hasOwnProperty.call(t,i)&&(n[i]=t[i]);return n}).apply(this,arguments)},o=this&&this.__spreadArrays||function(){for(var n=0,t=0,e=arguments.length;t<e;t++)n+=arguments[t].length;var r=Array(n),i=0;for(t=0;t<e;t++)for(var o=arguments[t],a=0,s=o.length;a<s;a++,i++)r[i]=o[a];return r};Object.defineProperty(t,"__esModule",{value:!0}),t.apply=t.infer=t.unify=t.combine=t.substitute=t.TypeInferenceError=void 0;var a=e(2),s=function(n){function t(t,e){var r=n.call(this,t)||this;return r.name="TypeInferenceError",r.expr=e,r}return r(t,n),t}(Error);function c(n,t){var e=t,r={};for(var i in e)r[i]=w(e[i],n);return r}function u(){for(var n=[],t=0;t<arguments.length;t++)n[t]=arguments[t];if(0===n.length)return{};if(1===n.length)return n[0];if(n.length>2)return u(n[0],u.apply(void 0,n.slice(1)));var e=n[0],r=n[1],i={};for(var o in e)i[o]=w(e[o],r);for(var o in r)o in e||(i[o]=r[o]);return i}function p(n,t,e){var r;if(n instanceof a.TypeVar){if(j(t,n))throw new s("Contains/occurs check failed with "+JSON.stringify(n)+" and "+JSON.stringify(t),e);return(r={})[n.name]=t,r}if(t instanceof a.TypeVar)return p(t,n,e);if(n instanceof a.TypeFuncApp&&t instanceof a.TypeFuncApp){if(n.constructorName!==t.constructorName)throw new s("Could not unify type function applications with different constructors '"+n.constructorName+"' and '"+t.constructorName+"'",e);if(n.args.length!==t.args.length)throw new s("Could not unify type function applications with different argument list lengths "+JSON.stringify(n)+" and "+JSON.stringify(t),e);for(var i={},o=0;o<n.args.length;o++)i=u(p(w(n.args[o],i),w(t.args[o],i),e),i);return i}throw new Error("Internal error, this should never happen")}function h(n,t){var e=new Set(t);return n.filter((function(n){return!e.has(n)}))}function l(n){if(n instanceof a.PolyType)return h(l(n.monoType),n.quantifiedVars);if(n instanceof a.TypeVar)return[n.name];if(n instanceof a.TypeFuncApp)return n.args.map(l).reduce((function(n,t){return o(n,t)}),[]);if(n)return Object.values(n).map(l).reduce((function(n,t){return o(n,t)}),[]);throw new Error("Internal error, this should never happen")}function f(n,t){return new a.PolyType(function(n){var t=[];return new Set(n).forEach((function(n){return t.push(n)})),t}(h(l(t),l(n))),t)}t.TypeInferenceError=s,t.substitute=c,t.combine=u,t.unify=p,t.infer=function(n,t,e){void 0===t&&(t=!1),void 0===e&&(e=a.typeUtils.standardCtx);var r=0,i=function(){return"t"+r++};if(!t)return m(n,e,i)[0];var o=[];try{return{accepted:!0,value:{type:m(n,e,i,(function(t,e){o.push({message:t,ast:d(n,e)})}))[0],steps:o}}}catch(c){return{accepted:!1,value:{steps:o},issuePosition:c.name==s.name?c.expr.pos:n.pos,message:c.message}}};var d=function n(t,e){if(t instanceof a.CharLiteral)return new a.CharLiteral(t.value,t.pos,e.get(t));if(t instanceof a.NumberLiteral)return new a.NumberLiteral(t.value,t.pos,e.get(t));if(t instanceof a.Var)return new a.Var(t.name,t.pos,e.get(t));if(t instanceof a.App)return new a.App(n(t.func,e),n(t.arg,e),t.pos,e.get(t));if(t instanceof a.Abs)return new a.Abs(t.param,n(t.body,e),t.pos,e.get(t));if(t instanceof a.Let)return new a.Let(t.param,n(t.def,e),n(t.body,e),t.pos,e.get(t));throw new Error("Internal error, this should never happen")},b=function(n){var t=new Map;return t.set(n,"highlight"),t},y=function(n,t){return("{ "+Object.keys(n).filter((function(n){return n!==t})).map((function(t){return t+" \u21a6 "+n[t].toString()})).join(", ")+" }").replace("{  }","{}")};function m(n,t,e,r){var o,h;if(void 0===r&&(r=function(){}),n instanceof a.CharLiteral)return r("We know the primitive `"+n.toString()+"` is a `char`",b(n)),[g(new a.PolyType([],new a.TypeFuncApp("char")),e),{}];if(n instanceof a.NumberLiteral)return r("We know the primitive `"+n.toString()+"` is a `number`",b(n)),[g(new a.PolyType([],new a.TypeFuncApp("number")),e),{}];if(n instanceof a.Var){if(!(P=t[n.name]))throw new s(n.name+" is not in scope",n);var l=g(P,e);return r("We can look up the variable `"+n.toString()+"` and find it has type `"+P.toString()+(P.quantifiedVars.length?"`\nWe instatiate this type with fresh type variables to get `"+l.toString()+"`":""),b(n)),[l,{}]}if(n instanceof a.App){var d=m(n.func,t,e,r),j=d[0],v=d[1],O=m(n.arg,c(v,t),e,r),x=O[0],T=O[1],S=new a.TypeVar(e()),F=p(w(j,T),new a.TypeFuncApp("->",x,S),n),k=w(S,F);return j instanceof a.TypeFuncApp?r("In function application, the function must accept the expected argument type.\nBefore unification, the function has type `"+j.toString()+"`\n\nTherefore we unify:\nFunction accepts `"+j.args[0].toString()+"`\nArgument has type `"+x.toString()+"`\n\nThis gives the substitution `"+y(F,S.name)+"`\nAnd the function's return type as `"+k.toString()+"`",b(n)):r("In function application, the function must accept the expected argument type and returns some other type.\n\nTherefore we unify:\nFunction type `"+j.toString()+"`\nArgument to fresh type `"+new a.TypeFuncApp("->",x,S).toString()+"`\n\nThis gives the substitution `"+y(F)+"`\nAnd the function's return type as `"+k.toString()+"`",b(n)),[k,u(v,T,F)]}if(n instanceof a.Abs){S=new a.TypeVar(e());r("Our function definition binds `"+n.param+"` in the body to the fresh type `"+S.toString()+"`",b(n));var C=m(n.body,i(i({},t),((o={})[n.param]=new a.PolyType([],S),o)),e,r),A=C[0],N=C[1],P=w(new a.TypeFuncApp("->",S,A),N);return r((N[S.name]?"We apply the substitution `{ "+S.name+" \u21a6 "+N[S.name].toString()+" }` to get the parameter's type `"+P.args[0].toString()+"`.\n":"")+"The return type is given by the function body's type `"+P.args[1].toString()+"`\nTherefore the overall type is `"+P.toString()+"`",b(n)),[P,N]}if(n instanceof a.Let){var _=m(n.def,t,e,r),E=_[0],V=_[1],L=f(c(V,t),E);r("Our let statement binds `"+n.param+"` in the body to the type `"+L.toString()+"`",b(n));var z=m(n.body,i(i({},c(V,t)),((h={})[n.param]=L,h)),e,r);A=z[0],N=z[1];return r("Our let statement then takes its body's type `"+A.toString()+"`",b(n)),[A,u(V,N)]}throw new Error("Internal error, this should never happen")}function g(n,t,e,r){if(void 0===e&&(e=[]),void 0===r&&(r=[]),n instanceof a.TypeVar){var i=e.indexOf(n.name);return-1===i?n:new a.TypeVar(r[i])}if(n instanceof a.TypeFuncApp)return new(a.TypeFuncApp.bind.apply(a.TypeFuncApp,o([void 0,n.constructorName],n.args.map((function(n){return g(n,t,e,r)})))));if(n instanceof a.PolyType)return g(n.monoType,t,n.quantifiedVars,n.quantifiedVars.map(t));throw new Error("Internal error, this should never happen")}function w(n,t){if(n instanceof a.TypeVar)return n.name in t?t[n.name]:n;if(n instanceof a.TypeFuncApp)return new(a.TypeFuncApp.bind.apply(a.TypeFuncApp,o([void 0,n.constructorName],n.args.map((function(n){return w(n,t)})))));if(n instanceof a.PolyType)return new a.PolyType(n.quantifiedVars,w(n.monoType,t));throw new Error("Internal error, this should never happen")}function j(n,t){if(n instanceof a.TypeVar)return n.name==t.name;if(n instanceof a.TypeFuncApp)return n.args.some((function(n){return j(n,t)}));if(n instanceof a.PolyType)return j(n.monoType,t)&&!n.quantifiedVars.includes(t.name);throw new Error("Internal error, this should never happen")}t.apply=w},27:function(n,t,e){},37:function(n,t,e){"use strict";e.r(t);var r=e(0),i=e(1),o=e.n(i),a=e(19),s=e.n(a),c=e(15),u=(e(27),e(21)),p=e(2),h=e(20);function l(n){var t=n.node,e=n.hoverCallback;if(t instanceof p.CharLiteral||t instanceof p.NumberLiteral)return Object(r.jsx)(f,{node:t,hoverCallback:e,children:t.value});if(t instanceof p.Var)return Object(r.jsx)(f,{node:t,hoverCallback:e,children:t.name});if(t instanceof p.App)return Object(r.jsxs)(r.Fragment,{children:[Object(r.jsx)(f,{node:t,hoverCallback:e,children:Object(r.jsx)("span",{className:"sans-serif",children:"Function application"})}),Object(r.jsx)(d,{children:Object(r.jsx)(l,{node:t.func,hoverCallback:e})}),Object(r.jsx)(d,{children:Object(r.jsx)(l,{node:t.arg,hoverCallback:e})})]});if(t instanceof p.Abs)return Object(r.jsxs)(r.Fragment,{children:[Object(r.jsxs)(f,{node:t,hoverCallback:e,children:["\u03bb",t.param]}),Object(r.jsx)(d,{symbol:"->",children:Object(r.jsx)(l,{node:t.body,hoverCallback:e})})]});if(t instanceof p.Let)return Object(r.jsxs)(r.Fragment,{children:[Object(r.jsxs)(f,{node:t,hoverCallback:e,children:["let ",t.param]}),Object(r.jsx)(d,{symbol:"=",children:Object(r.jsx)(l,{node:t.def,hoverCallback:e})}),Object(r.jsx)(d,{symbol:"in",children:Object(r.jsx)(l,{node:t.body,hoverCallback:e})})]});throw new Error("Attempted to display a node of invalid type "+typeof t)}function f(n){var t=n.children,e=n.node,i=n.hoverCallback;return Object(r.jsx)("div",{className:"ast-node "+(e.notes||""),onMouseOver:function(){return i(!0,e.pos)},onMouseOut:function(){return i(!1,e.pos)},children:t})}function d(n){var t=n.children,e=n.symbol;return Object(r.jsx)("div",{className:"ast-child","data-symbol":e,children:t})}var b=function(n){var t=n.ast,e=n.hoverCallback;return Object(r.jsx)("div",{className:"ast-view",children:Object(r.jsx)(l,{node:t,hoverCallback:e})})};var y=function(n,t){return function(e,r){n(e?[].concat(Object(u.a)(t),[{start:r.start,end:r.end,className:"highlight-white"}]):t)}},m=function(n){var t=n.code,e=n.setHighlights,o=Object(i.useMemo)((function(){return Object(p.parse)(t,!0)}),[t]);Object(i.useEffect)((function(){return e(o.accepted?[]:[{start:o.issuePosition.start,end:o.issuePosition.end,className:"highlight-error"}])}),[o,e]);var a=Object(i.useMemo)((function(){if(o.accepted)return Object(h.infer)(o.value,!0)}),[o]);if(Object(i.useEffect)((function(){return a&&e(a.accepted?[]:[{start:a.issuePosition.start,end:a.issuePosition.end,className:"highlight-error"}])}),[a,e]),!o.accepted)return Object(r.jsxs)(r.Fragment,{children:[Object(r.jsx)("h2",{children:"AST"}),Object(r.jsx)("p",{children:o.message})]});if(!a.accepted)return Object(r.jsxs)(r.Fragment,{children:[Object(r.jsx)("h2",{children:"AST"}),Object(r.jsx)(b,{ast:o.value,hoverCallback:y(e,[{start:a.issuePosition.start,end:a.issuePosition.end||0,className:"highlight-error"}])}),Object(r.jsx)("h2",{children:"Type"}),Object(r.jsx)("p",{children:a.message})]});var s=y(e,[]);return Object(r.jsxs)(r.Fragment,{children:[Object(r.jsx)("h2",{children:"AST"}),Object(r.jsx)(b,{ast:o.value,hoverCallback:s}),Object(r.jsx)("h2",{children:"Type derivation"}),a.value.steps.map((function(n,t){return Object(r.jsxs)("div",{className:"type-derivation-step",children:[Object(r.jsxs)("h3",{children:["Step ",t+1]}),Object(r.jsx)("p",{children:n.message.split("`").map((function(n,t){return t%2===0?n:Object(r.jsx)("code",{children:n},t)}))}),Object(r.jsx)(b,{ast:n.ast,hoverCallback:s})]},t)})),Object(r.jsx)("h2",{children:"Type"}),Object(r.jsx)("p",{children:Object(r.jsx)("code",{children:a.value.type.toString()})})]})};var g=function(){var n=Object(i.useState)("map not []"),t=Object(c.a)(n,2),e=t[0],o=t[1],a=Object(i.useState)([]),s=Object(c.a)(a,2),u=s[0],p=s[1];return Object(r.jsxs)(r.Fragment,{children:[Object(r.jsx)("h1",{children:"interactive type inference"}),Object(r.jsx)("h2",{children:"Play with algorithm W in your browser."}),Object(r.jsxs)("h2",{children:["Samples:",Object(r.jsx)("button",{onClick:function(){return o("4")},children:"4"}),Object(r.jsx)("button",{onClick:function(){return o("not")},children:"not"}),Object(r.jsx)("button",{onClick:function(){return o("not True")},children:"not True"}),Object(r.jsx)("button",{onClick:function(){return o("+")},children:"+"}),Object(r.jsx)("button",{onClick:function(){return o("map not []")},children:"map not []"}),Object(r.jsx)("button",{onClick:function(){return o("fst")},children:"fst"}),Object(r.jsx)("button",{onClick:function(){return o("Just")},children:"Just"}),Object(r.jsx)("button",{onClick:function(){return o("let x = 3 in + x")},children:"let x = 3 in + x"}),Object(r.jsxs)("button",{onClick:function(){return o("\\x -> / x 2")},children:["\\x -",">"," / x 2"]}),Object(r.jsx)("button",{onClick:function(){return o("cons 23 []")},children:"cons 23 []"})]}),Object(r.jsxs)("div",{className:"code-container",children:[Object(r.jsx)("input",{placeholder:"Enter code...",value:e,onChange:function(n){return o(n.target.value)}}),e&&u.map((function(n,t){return Object(r.jsxs)("p",{children:[e.slice(0,n.start),Object(r.jsx)("span",{className:n.className,children:e.slice(n.start,n.end)}),e.slice(n.end)]},t)}))]}),e&&Object(r.jsx)(m,{code:e,setHighlights:p})]})};s.a.render(Object(r.jsx)(o.a.StrictMode,{children:Object(r.jsx)(g,{})}),document.getElementById("root"))}},[[37,1,2]]]);
//# sourceMappingURL=main.bd2dc8bc.chunk.js.map