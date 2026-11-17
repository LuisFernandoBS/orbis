export type Priority='alta'|'media'|'baixa';export type Status='desejado'|'pesquisando'|'comprado';
export interface Offer{id:string;name:string;features:string;price:number;store:string;url:string;used:boolean;date:string;selected:boolean}
export interface Item{id:string;name:string;desc:string;qty:number;priority:Priority;status:Status;roomId:string|null;offers:Offer[];purchase?:{price:number;store:string;date:string;notes:string}}
export interface Room{id:string;name:string}
export type Rec='none'|'weekly'|'biweekly'|'monthly'|'yearly';
export interface Expense{id:string;name:string;value:number;category:string;kind:'fixa'|'variavel'|'eventual';date:string;desc:string;rec:Rec}
export interface Sub{id:string;name:string;done:boolean}
export interface Goal{id:string;name:string;done:boolean;subs:Sub[]}
export interface Subject{id:string;name:string;goals:Goal[]}
export type MType='video'|'artigo'|'pdf'|'curso'|'doc'|'github';export type MStatus='pendente'|'estudando'|'estudado';
export interface Material{id:string;name:string;url:string;type:MType;status:MStatus;links:string[]}
export interface State{materials:Material[];rooms:Room[];items:Item[];expenses:Expense[];subjects:Subject[];prefs:{theme:'dark'|'light'}}
