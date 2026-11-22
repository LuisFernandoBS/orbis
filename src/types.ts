export type Priority='alta'|'media'|'baixa';export type Status='desejado'|'pesquisando'|'comprado';
export interface Offer{id:string;name:string;features:string;price:number;frete?:number;store:string;url:string;used:boolean;date:string;selected:boolean}
export interface Item{id:string;name:string;desc:string;qty:number;priority:Priority;status:Status;roomId:string|null;offers:Offer[];purchase?:{price:number;store:string;date:string;notes:string}}
export interface Room{id:string;name:string}
export type Rec='none'|'weekly'|'biweekly'|'monthly'|'yearly';
export interface Expense{id:string;name:string;value:number;category:string;kind:'fixa'|'variavel'|'eventual';date:string;desc:string;rec:Rec}
export interface Sub{id:string;name:string;done:boolean}
export interface Goal{id:string;name:string;done:boolean;subs:Sub[]}
export interface Subject{id:string;name:string;goals:Goal[]}
export type MType='video'|'artigo'|'pdf'|'curso'|'doc'|'github';export type MStatus='pendente'|'estudando'|'estudado';
export interface Material{id:string;name:string;url:string;type:MType;status:MStatus;links:string[]}
export type ObjStatus='nao-iniciado'|'em-andamento'|'concluido'|'arquivado';
export type TaskStatus='pendente'|'em-andamento'|'concluida';
export type MarketPeriod='none'|'current_month';
export interface Subtask{id:string;name:string;done:boolean}
export interface Task{id:string;objectiveId:string;name:string;desc:string;priority:Priority;due:string|null;status:TaskStatus;subs:Subtask[];createdAt:string}
export interface FrequentItem{id:string;name:string;category:string;defaultQuantity:number|null;defaultUnit:string|null;createdAt:string;updatedAt:string}
export interface ShoppingItem{id:string;name:string;quantity:number|null;unit:string|null;category:string;notes:string;period:MarketPeriod;periodMonth:string|null;frequentItemId:string|null;createdAt:string;updatedAt:string}
export interface PurchaseHistory{id:string;name:string;quantity:number|null;unit:string|null;category:string;frequentItemId:string|null;originalItemId:string|null;purchasedAt:string}
export interface MarketState{frequentItems:FrequentItem[];shoppingItems:ShoppingItem[];purchaseHistory:PurchaseHistory[]}
export interface Objective{id:string;name:string;desc:string;category:string;priority:Priority;startDate:string;dueDate:string|null;status:ObjStatus;favorite:boolean;archived:boolean;completedAt:string|null;createdAt:string}
export interface PlanningActivity{id:string;type:string;desc:string;date:string;objectiveId:string|null}
export interface PlanningState{objectives:Objective[];tasks:Task[];customCategories:string[];activities:PlanningActivity[]}
export interface Prefs{theme:'dark'|'light';accent?:string;compact?:boolean;anim?:boolean;labels?:boolean;notif?:boolean;autosave?:boolean;name?:string;email?:string}
export interface State{materials:Material[];rooms:Room[];items:Item[];expenses:Expense[];subjects:Subject[];planning:PlanningState;market:MarketState;prefs:Prefs}
