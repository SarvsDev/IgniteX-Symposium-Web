import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../lib/serverEnv.js';
const text=(v:unknown)=>typeof v==='string'?v.trim():'';
export default async function handler(req:any,res:any){try{
 if(req.method!=='GET') return res.status(405).json({valid:false,status:'ERROR',message:'GET only'});
 const token=text(req.query?.token); if(!token)return res.status(400).json({valid:false,status:'INVALID',message:'Verification token is missing.'});
 const c=supabaseConfig(); if(!c.configured)return res.status(503).json({valid:false,status:'ERROR',message:`Supabase is not configured. Missing ${c.missing.join(' and ')}.`});
 const client=createClient(c.url,c.serviceRoleKey,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:reg,error}=await client.from('registrations').select('*').eq('registration_number',token.toUpperCase()).maybeSingle();
 if(error)throw error;if(!reg)return res.status(404).json({valid:false,status:'INVALID',message:'This QR pass is not registered.'});
 const [{data:agg},{data:links},{data:teams}]=await Promise.all([client.from('registrations').select('*,participants(*)').eq('id',reg.id).single(),client.from('registration_events').select('event_id,events(*)').eq('registration_id',reg.id),client.from('teams').select('*,team_members(*)').eq('registration_id',reg.id)]);
 const p=agg?.participants||{};const events=(links||[]).map((x:any)=>{const e=Array.isArray(x.events)?x.events[0]:x.events;return{title:e?.title||'',venue:e?.venue||'',day:e?.day||''}}).filter((x:any)=>x.title);const t=(teams||[])[0];const team=t?{name:t.team_name||'',members:(t.team_members||[]).map((m:any)=>m.member_name).filter(Boolean)}:null;
 if(reg.status==='CHECKED_IN')return res.json({valid:true,status:'ALREADY_CHECKED_IN',message:'This ticket has already been checked in.',registration_number:reg.registration_number,participant:{name:p.full_name||'',college:p.college||'',department:p.department||''},events,team,checked_in:true});
 if(reg.status!=='APPROVED')return res.json({valid:false,status:reg.status==='REJECTED'?'REJECTED':'PENDING',message:`Registration is ${reg.status}. Only APPROVED passes are valid.`,registration_number:reg.registration_number,participant:{name:p.full_name||'',college:p.college||'',department:p.department||''},events,team,checked_in:false});
 return res.json({valid:true,status:'APPROVED',message:`QR verified for ${p.full_name||'participant'}.`,registration_number:reg.registration_number,participant:{name:p.full_name||'',college:p.college||'',department:p.department||''},events,team,checked_in:false});
}catch(e:any){console.error(e);return res.status(500).json({valid:false,status:'ERROR',message:e?.message||'Ticket verification failed.'})}}
