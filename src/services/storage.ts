import type {State} from '../types';const K='orbis:v1';
// Camada de persistência: troque por chamadas de API sem alterar a UI.
export const load=():State|null=>{try{const s=localStorage.getItem(K);return s?JSON.parse(s):null}catch{return null}};
export const save=(d:State)=>{try{localStorage.setItem(K,JSON.stringify(d))}catch{}};
