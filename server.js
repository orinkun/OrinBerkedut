require("dotenv").config();
const express=require("express");
const session=require("express-session");
const bcrypt=require("bcryptjs");
const crypto=require("crypto");
const fs=require("fs");
const path=require("path");

const app=express();
const PORT=process.env.PORT||3000;
const PRICE=5000;
const API_BASE=(process.env.ADRIANPAY_BASE_URL||"https://payment.adriancloud.web.id").replace(/\/$/,"");
const API_KEY=process.env.ADRIANPAY_API_KEY;
const DB_FILE=path.join(__dirname,"data.json");

function loadDB(){
  try { return JSON.parse(fs.readFileSync(DB_FILE,"utf8")); }
  catch { return {users:[],orders:[]}; }
}
function saveDB(db){ fs.writeFileSync(DB_FILE,JSON.stringify(db,null,2)); }

app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));
app.use(session({
  secret:process.env.SESSION_SECRET||crypto.randomBytes(32).toString("hex"),
  resave:false,saveUninitialized:false,
  cookie:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:1000*60*60*24*7}
}));

function auth(req,res,next){if(!req.session.user)return res.status(401).json({error:"Silakan login dulu."});next();}

app.post("/api/register",async(req,res)=>{
  try{
    const {name,email,password}=req.body||{};
    if(!name||!email||!password||password.length<6)return res.status(400).json({error:"Nama, email, dan password minimal 6 karakter wajib diisi."});
    if(!/^[^\s@]+@[^\s@]+\.com$/i.test(email.trim()))return res.status(400).json({error:"Email harus berakhiran .com."});
    const db=loadDB(), em=email.trim().toLowerCase();
    if(db.users.some(u=>u.email===em))return res.status(400).json({error:"Email sudah terdaftar."});
    const user={id:crypto.randomUUID(),name:name.trim(),email:em,password_hash:await bcrypt.hash(password,12),created_at:new Date().toISOString()};
    db.users.push(user);saveDB(db);
    req.session.user={id:user.id,name:user.name,email:user.email};
    res.json({success:true,user:req.session.user});
  }catch(e){console.error(e);res.status(500).json({error:"Gagal membuat akun."});}
});

app.post("/api/login",async(req,res)=>{
  const {email,password}=req.body||{}, db=loadDB();
  if(!/^[^\s@]+@[^\s@]+\.com$/i.test((email||"").trim()))return res.status(400).json({error:"Email login harus berakhiran .com."});
  const u=db.users.find(x=>x.email===(email||"").trim().toLowerCase());
  if(!u||!(await bcrypt.compare(password||"",u.password_hash)))return res.status(401).json({error:"Email atau password salah."});
  req.session.user={id:u.id,name:u.name,email:u.email};
  res.json({success:true,user:req.session.user});
});
app.post("/api/logout",(req,res)=>req.session.destroy(()=>res.json({success:true})));
app.get("/api/me",(req,res)=>res.json({user:req.session.user||null}));

async function gateway(endpoint,params){
  const url=new URL(API_BASE+endpoint);
  Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,String(v)));
  const r=await fetch(url,{headers:{Accept:"application/json"}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.message||d.error||`Gateway HTTP ${r.status}`);
  return d;
}

app.post("/api/create-payment",auth,async(req,res)=>{
  try{
    if(!API_KEY)return res.status(503).json({error:"API key ADRIANPAY belum dikonfigurasi."});
    const d=await gateway("/api/create/qris",{apikey:API_KEY,amount:PRICE});
    if(!d.success||!d.invoice_id||!d.qris_image)return res.status(502).json({error:d.message||"Format respons gateway tidak sesuai."});
    const db=loadDB();
    db.orders.push({id:crypto.randomUUID(),user_id:req.session.user.id,invoice_id:d.invoice_id,amount:d.amount||PRICE,status:"pending",created_at:new Date().toISOString()});
    saveDB(db);
    res.json({success:true,invoice_id:d.invoice_id,amount:d.amount||PRICE,qris_image:d.qris_image,expired_at:d.expired_at||null});
  }catch(e){console.error("create-payment:",e.message);res.status(502).json({error:"Gagal membuat invoice pembayaran."});}
});

app.get("/api/payment-status/:invoice",auth,async(req,res)=>{
  try{
    const db=loadDB(), order=db.orders.find(o=>o.invoice_id===req.params.invoice&&o.user_id===req.session.user.id);
    if(!order)return res.status(404).json({error:"Invoice tidak ditemukan."});
    if(!API_KEY)return res.status(503).json({error:"API key belum dikonfigurasi."});
    const d=await gateway("/api/invoice/status",{apikey:API_KEY,invoice_id:order.invoice_id});
    const status=String(d.status||"pending").toLowerCase();
    order.status=status;saveDB(db);
    res.json({success:true,status,invoice_id:order.invoice_id});
  }catch(e){console.error("payment-status:",e.message);res.status(502).json({error:"Gagal mengecek status pembayaran."});}
});

app.listen(PORT,()=>console.log(`ORIN server running: http://localhost:${PORT}`));
