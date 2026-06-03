import{s as a}from"./index-1C8I1hHo.js";async function n(){var t;try{const{data:r}=await a.auth.getUser();return((t=r.user)==null?void 0:t.id)??null}catch{return null}}export{n as getCurrentUserId};
