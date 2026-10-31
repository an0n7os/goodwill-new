'use server';
import {requestAdminRecovery,resetAdminPassword} from './business/recovery';
export async function requestStaffRecovery(email:string){await requestAdminRecovery(email);return {success:true};}
export async function completeStaffRecovery(token:string,password:string){try{await resetAdminPassword(token,password);return {success:true};}catch(e){return {success:false,error:e instanceof Error?e.message:'Recovery could not be completed.'};}}
