import { useState, useEffect, useRef, useCallback } from "react";

// ── CONFIG — замени на свой Render URL после деплоя ───────────────────
const WS_URL = "wsscd codeblitz-frontend://https://codeblitz-9yzz.onrender.com";
// Для локальной разработки: const WS_URL = "ws://localhost:8080";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Orbitron:wght@700;900&display=swap');`;

const css = `
${FONTS}
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#080c10;--panel:#0d1117;--border:#1e2d3d;
  --green:#00ff88;--green-dim:#00ff8820;
  --cyan:#00d4ff;--red:#ff4455;--yellow:#ffcc00;
  --text:#c9d1d9;--muted:#4a5568;
}
body{background:var(--bg);color:var(--text);font-family:'JetBrains Mono',monospace;}
.app{
  min-height:100vh;background:var(--bg);
  background-image:
    radial-gradient(ellipse at 20% 50%,#00ff8808 0%,transparent 50%),
    radial-gradient(ellipse at 80% 20%,#00d4ff08 0%,transparent 50%);
  display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;
}
.app::before{
  content:'';position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:100;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,136,.012) 2px,rgba(0,255,136,.012) 4px);
}
.lobby{text-align:center;max-width:560px;width:100%;animation:fadeIn .4s ease;}
.logo{font-family:'Orbitron',monospace;font-size:clamp(2.2rem,7vw,4rem);font-weight:900;color:var(--green);
  text-shadow:0 0 30px var(--green),0 0 60px rgba(0,255,136,.3);letter-spacing:.05em;line-height:1;margin-bottom:6px;}
.logo span{color:var(--cyan);text-shadow:0 0 30px var(--cyan);}
.tagline{color:var(--muted);font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;margin-bottom:40px;}
.card{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:28px;margin-bottom:12px;}
.sec{font-size:.65rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-bottom:12px;}
.diff-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px;}
.topic-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
.dbtn,.tbtn{padding:9px 6px;background:transparent;border:1px solid var(--border);border-radius:7px;
  color:var(--muted);font-family:'JetBrains Mono',monospace;font-size:.72rem;cursor:pointer;transition:all .2s;}
.dbtn:hover,.tbtn:hover{border-color:var(--green);color:var(--text);}
.dbtn.sel.easy{border-color:var(--green);color:var(--green);background:var(--green-dim);}
.dbtn.sel.medium{border-color:var(--yellow);color:var(--yellow);background:#ffcc0018;}
.dbtn.sel.hard{border-color:var(--red);color:var(--red);background:#ff445518;}
.tbtn.sel{border-color:var(--cyan);color:var(--cyan);background:#00d4ff15;}
.divider{display:flex;align-items:center;gap:12px;color:var(--muted);font-size:.7rem;margin:16px 0;}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--border);}
.mode-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.mode-btn{padding:14px 10px;border:1px solid var(--border);border-radius:9px;background:transparent;
  color:var(--text);font-family:'JetBrains Mono',monospace;font-size:.75rem;cursor:pointer;transition:all .2s;text-align:center;}
.mode-btn:hover{border-color:var(--green);background:var(--green-dim);}
.mode-btn .mi{font-size:1.4rem;display:block;margin-bottom:6px;}
.mode-btn .ml{color:var(--muted);font-size:.65rem;display:block;margin-top:3px;}
.join-row{display:flex;gap:8px;margin-top:12px;}
.join-input{flex:1;padding:11px 14px;background:#050810;border:1px solid var(--border);border-radius:8px;
  color:var(--text);font-family:'Orbitron',monospace;font-size:1rem;letter-spacing:.25em;text-align:center;
  outline:none;transition:border .2s;text-transform:uppercase;}
.join-input:focus{border-color:var(--cyan);}
.big-btn{padding:12px 20px;border-radius:9px;font-family:'Orbitron',monospace;font-size:.82rem;
  font-weight:700;letter-spacing:.08em;cursor:pointer;transition:all .2s;border:none;white-space:nowrap;}
.big-btn.green{background:var(--green);color:#000;box-shadow:0 0 16px rgba(0,255,136,.25);}
.big-btn.green:hover:not(:disabled){box-shadow:0 0 36px rgba(0,255,136,.5);transform:translateY(-1px);}
.big-btn.outline{background:transparent;border:1px solid var(--border);color:var(--muted);}
.big-btn.outline:hover{border-color:var(--red);color:var(--red);}
.big-btn.full{width:100%;display:block;}
.big-btn:disabled{opacity:.4;cursor:not-allowed;transform:none!important;}

/* WAITING */
.wait-screen{text-align:center;max-width:440px;width:100%;animation:fadeIn .4s ease;}
.wait-title{font-family:'Orbitron',monospace;font-size:1rem;color:var(--green);letter-spacing:.1em;margin-bottom:24px;}
.room-code-box{background:var(--panel);border:2px dashed var(--border);border-radius:12px;padding:28px;margin-bottom:16px;}
.room-code{font-family:'Orbitron',monospace;font-size:2.4rem;letter-spacing:.3em;color:var(--cyan);
  text-shadow:0 0 20px var(--cyan);margin-bottom:8px;}
.room-sub{color:var(--muted);font-size:.72rem;letter-spacing:.08em;}
.copy-btn{margin-top:12px;padding:6px 14px;background:transparent;border:1px solid var(--border);
  border-radius:6px;color:var(--muted);font-family:'JetBrains Mono',monospace;font-size:.68rem;cursor:pointer;transition:all .2s;}
.copy-btn:hover{border-color:var(--cyan);color:var(--cyan);}
.pstatus{display:flex;gap:24px;justify-content:center;margin:20px 0;}
.pstat{display:flex;flex-direction:column;align-items:center;gap:5px;font-size:.72rem;}
.pstat .dot{width:10px;height:10px;border-radius:50%;}
.pstat.online .dot{background:var(--green);box-shadow:0 0 8px var(--green);}
.pstat.offline .dot{background:var(--muted);animation:pulse .9s ease infinite alternate;}
.err-msg{color:var(--red);font-size:.75rem;margin:8px 0;text-align:center;}
.conn-badge{display:inline-flex;align-items:center;gap:6px;font-size:.65rem;padding:4px 10px;
  border-radius:4px;margin-bottom:16px;}
.conn-badge.connected{border:1px solid var(--green);color:var(--green);}
.conn-badge.connecting{border:1px solid var(--yellow);color:var(--yellow);}
.conn-badge.error{border:1px solid var(--red);color:var(--red);}
.conn-dot{width:6px;height:6px;border-radius:50%;background:currentColor;animation:pulse .9s ease infinite alternate;}

/* LOADING */
.loading-screen{text-align:center;animation:fadeIn .3s ease;}
.spinner{width:44px;height:44px;border:2px solid var(--border);border-top-color:var(--green);
  border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px;}
.load-title{font-family:'Orbitron',monospace;font-size:1rem;color:var(--green);margin-bottom:8px;letter-spacing:.1em;}
.load-sub{color:var(--muted);font-size:.72rem;letter-spacing:.08em;}

/* GAME */
.game{width:100%;max-width:1200px;animation:fadeIn .4s ease;}
.game-header{display:flex;align-items:center;justify-content:space-between;
  margin-bottom:14px;padding:11px 16px;background:var(--panel);border:1px solid var(--border);border-radius:10px;}
.timer{font-family:'Orbitron',monospace;font-size:1.5rem;font-weight:700;min-width:72px;text-align:center;}
.timer.ok{color:var(--green);}
.timer.warn{color:var(--yellow);}
.timer.urg{color:var(--red);animation:pulse .5s ease infinite alternate;}
.prow{display:flex;gap:20px;align-items:center;}
.ptag{display:flex;align-items:center;gap:7px;font-size:.78rem;}
.pdot{width:8px;height:8px;border-radius:50%;}
.you .pdot{background:var(--green);box-shadow:0 0 6px var(--green);}
.opp .pdot{background:var(--cyan);box-shadow:0 0 6px var(--cyan);animation:blink 1.4s ease infinite;}
.opp-st{font-size:.67rem;color:var(--muted);font-style:italic;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dbadge{padding:3px 9px;border-radius:4px;font-size:.67rem;letter-spacing:.08em;text-transform:uppercase;}
.dbadge.easy{border:1px solid var(--green);color:var(--green);}
.dbadge.medium{border:1px solid var(--yellow);color:var(--yellow);}
.dbadge.hard{border:1px solid var(--red);color:var(--red);}
.game-body{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
@media(max-width:768px){.game-body{grid-template-columns:1fr;}}
.panel{background:var(--panel);border:1px solid var(--border);border-radius:10px;overflow:hidden;display:flex;flex-direction:column;}
.ph{padding:9px 15px;border-bottom:1px solid var(--border);font-size:.67rem;letter-spacing:.15em;
  text-transform:uppercase;color:var(--muted);display:flex;justify-content:space-between;align-items:center;}
.prob-body{padding:18px;flex:1;overflow-y:auto;line-height:1.75;font-size:.85rem;max-height:420px;}
.prob-title{font-family:'Orbitron',monospace;font-size:.95rem;color:var(--green);margin-bottom:14px;}
.ps{margin-bottom:14px;}
.ps h4{color:var(--cyan);font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px;}
.ex{background:#060b10;border:1px solid var(--border);border-radius:6px;padding:9px 13px;font-size:.78rem;margin-bottom:5px;}
.lang-sel{background:transparent;border:1px solid var(--border);border-radius:4px;color:var(--text);
  font-family:'JetBrains Mono',monospace;font-size:.68rem;padding:3px 6px;cursor:pointer;}
.lang-sel option{background:var(--panel);}
textarea.ce{flex:1;min-height:280px;background:#050810;border:none;color:#a8d8a8;
  font-family:'JetBrains Mono',monospace;font-size:.78rem;line-height:1.6;padding:14px;resize:none;outline:none;tab-size:4;}
textarea.ce::placeholder{color:#1e2d3d;}
.out{padding:11px 15px;font-size:.75rem;min-height:72px;background:#050810;border-top:1px solid var(--border);line-height:1.5;}
.out pre{white-space:pre-wrap;font-family:'JetBrains Mono',monospace;}
.out.ok{color:var(--green);}
.out.err{color:var(--red);}
.out.info{color:var(--muted);}
.out.run{color:var(--yellow);}
.ef{padding:10px 14px;border-top:1px solid var(--border);display:flex;gap:8px;align-items:center;}
.btn-run{padding:7px 14px;background:transparent;border:1px solid var(--cyan);border-radius:6px;
  color:var(--cyan);font-family:'JetBrains Mono',monospace;font-size:.72rem;cursor:pointer;transition:all .2s;}
.btn-run:hover:not(:disabled){background:#00d4ff15;}
.btn-run:disabled{opacity:.4;cursor:not-allowed;}
.btn-sub{padding:7px 14px;background:var(--green);border:none;border-radius:6px;color:#000;
  font-family:'Orbitron',monospace;font-size:.72rem;font-weight:700;cursor:pointer;transition:all .2s;letter-spacing:.05em;}
.btn-sub:hover:not(:disabled){box-shadow:0 0 16px rgba(0,255,136,.4);}
.btn-sub:disabled{opacity:.5;cursor:not-allowed;}
.alert-banner{border-radius:7px;padding:8px 14px;font-size:.75rem;text-align:center;margin-top:8px;}
.alert-banner.cyan{background:#00d4ff15;border:1px solid var(--cyan);color:var(--cyan);}
.alert-banner.red{background:#ff445515;border:1px solid var(--red);color:var(--red);}

/* RESULT */
.result-screen{text-align:center;max-width:480px;width:100%;animation:fadeIn .5s ease;}
.ri{font-size:4.5rem;margin-bottom:14px;}
.rt{font-family:'Orbitron',monospace;font-size:1.8rem;font-weight:900;margin-bottom:6px;}
.rt.win{color:var(--green);text-shadow:0 0 30px var(--green);}
.rt.lose{color:var(--red);text-shadow:0 0 30px var(--red);}
.rt.timeout{color:var(--yellow);text-shadow:0 0 30px var(--yellow);}
.rsub{color:var(--muted);font-size:.75rem;margin-bottom:28px;}
.rstats{background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:18px;
  display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;text-align:left;}
.sl{font-size:.62rem;color:var(--muted);letter-spacing:.12em;text-transform:uppercase;margin-bottom:3px;}
.sv{font-size:1rem;font-family:'Orbitron',monospace;}

@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{from{opacity:1}to{opacity:.3}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
`;

// ── Constants ──────────────────────────────────────────────────────────
const DIFFS  = ["easy","medium","hard"];
const TOPICS = ["arrays","strings","math","greedy","dp","graphs","sorting","trees"];
const GAME_SECS = {easy:300,medium:600,hard:900};

const PISTON_LANGS = {
  python:     {language:"python",    version:"3.10.0"},
  javascript: {language:"javascript",version:"18.15.0"},
  cpp:        {language:"c++",       version:"10.2.0"},
  java:       {language:"java",      version:"15.0.2"},
};

const STARTERS = {
  python:`def solve():
    line = input()
    # your solution
    print(line)
solve()`,
  javascript:`const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
// your solution
console.log(lines[0]);`,
  cpp:`#include <bits/stdc++.h>
using namespace std;
int main(){
    ios::sync_with_stdio(false);cin.tie(0);
    // your solution
    return 0;
}`,
  java:`import java.util.*;
public class Main{
    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        // your solution
    }
}`,
};

// ── Helpers ────────────────────────────────────────────────────────────
function fmt(s){
  if(s==null||s<0)return "0:00";
  const m=Math.floor(s/60),sec=s%60;
  return `${m}:${sec.toString().padStart(2,"0")}`;
}

async function runCode(lang,code,stdin=""){
  const {language,version}=PISTON_LANGS[lang];
  const r=await fetch("https://emkc.org/api/v2/piston/execute",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({language,version,files:[{content:code}],stdin})
  });
  if(!r.ok)throw new Error("Piston error "+r.status);
  return (await r.json()).run;
}

async function generateProblem(diff,topic){
  const r=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model:"claude-sonnet-4-20250514",max_tokens:1000,
      system:`Generate a competitive programming problem. Return ONLY valid JSON:
{"title":"...","statement":"...","input":"...","output":"...","examples":[{"input":"...","output":"...","explanation":"..."}],"constraints":["..."],"hint":"..."}`,
      messages:[{role:"user",content:`${diff} problem about ${topic}. Original, correct examples.`}]
    })
  });
  const d=await r.json();
  return JSON.parse((d.content?.[0]?.text||"").replace(/```json|```/g,"").trim());
}

// ── Countdown hook ─────────────────────────────────────────────────────
function useCountdown(initial,onZero){
  const [t,setT]=useState(initial);
  const idRef=useRef(null);
  const cbRef=useRef(onZero);
  cbRef.current=onZero;
  const start=useCallback(()=>{
    idRef.current=setInterval(()=>{
      setT(p=>{if(p<=1){clearInterval(idRef.current);cbRef.current?.();return 0;}return p-1;});
    },1000);
  },[]);
  const stop=useCallback(()=>clearInterval(idRef.current),[]);
  const reset=useCallback(v=>{clearInterval(idRef.current);setT(v);},[]);
  useEffect(()=>()=>clearInterval(idRef.current),[]);
  return{t,start,stop,reset};
}

// ── WebSocket hook ─────────────────────────────────────────────────────
function useWS(onMessage){
  const wsRef=useRef(null);
  const [connState,setConnState]=useState("idle"); // idle|connecting|connected|error

  const connect=useCallback(()=>{
    setConnState("connecting");
    const ws=new WebSocket(WS_URL);
    wsRef.current=ws;
    ws.onopen =()=>setConnState("connected");
    ws.onclose=()=>setConnState("idle");
    ws.onerror=()=>setConnState("error");
    ws.onmessage=(e)=>{
      try{onMessage(JSON.parse(e.data));}catch{}
    };
    return ws;
  },[onMessage]);

  const send=useCallback((msg)=>{
    if(wsRef.current?.readyState===WebSocket.OPEN)
      wsRef.current.send(JSON.stringify(msg));
  },[]);

  const close=useCallback(()=>{
    wsRef.current?.close();
    wsRef.current=null;
    setConnState("idle");
  },[]);

  useEffect(()=>()=>wsRef.current?.close(),[]);

  return{send,connect,close,connState};
}

// ══════════════════════════════════════════════════════════════════════
export default function App(){
  const [screen,setScreen]=useState("lobby");
  const [diff,setDiff]=useState("medium");
  const [topic,setTopic]=useState("arrays");
  const [mode,setMode]=useState(null); // solo|host|join

  // multiplayer
  const [roomCode,setRoomCode]=useState("");
  const [joinCode,setJoinCode]=useState("");
  const [isHost,setIsHost]=useState(false);
  const [oppOnline,setOppOnline]=useState(false);
  const [myId,setMyId]=useState(null);
  const [wsError,setWsError]=useState("");
  const [copied,setCopied]=useState(false);

  // game
  const [problem,setProblem]=useState(null);
  const [lang,setLang]=useState("python");
  const [code,setCode]=useState(STARTERS.python);
  const [output,setOutput]=useState(null);
  const [running,setRunning]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [oppStatus,setOppStatus]=useState("online");
  const [oppFinished,setOppFinished]=useState(false);
  const [oppDisconnected,setOppDisconnected]=useState(false);
  const [result,setResult]=useState(null);
  const startRef=useRef(null);
  const botTimerRef=useRef(null);
  const totalTime=GAME_SECS[diff];
  const BOT_TIMES={easy:[90,200],medium:[200,420],hard:[380,750]};

  // ── WS message handler ───────────────────────────────────────────────
  const handleWsMessage=useCallback((msg)=>{
    switch(msg.type){
      case "room_created":
        setMyId(msg.playerId);
        setRoomCode(msg.roomCode);
        setScreen("waiting");
        break;
      case "room_joined":
        setMyId(msg.playerId);
        setScreen("waiting");
        break;
      case "player_joined":
        setOppOnline(true);
        break;
      case "game_start":
        setProblem(msg.problem);
        setCode(STARTERS[lang]);
        setOutput(null);
        setSubmitted(false);
        setOppFinished(false);
        setOppDisconnected(false);
        startRef.current=Date.now();
        setScreen("game_ready"); // triggers effect below
        break;
      case "opponent_status":
        setOppStatus(msg.status);
        break;
      case "opponent_finished":
        setOppFinished(true);
        setOppStatus("solved ✓");
        break;
      case "opponent_disconnected":
        setOppDisconnected(true);
        setOppStatus("disconnected");
        break;
      case "error":
        setWsError(msg.message);
        break;
    }
  // eslint-disable-next-line
  },[lang]);

  const{send,connect,close,connState}=useWS(handleWsMessage);

  // ── Countdown ────────────────────────────────────────────────────────
  const handleTimeout=useCallback(()=>{
    if(submitted)return;
    clearTimeout(botTimerRef.current);
    setResult({type:"timeout",elapsed:totalTime});
    setScreen("result");
  },[submitted,totalTime]);

  const{t:time,start:startTimer,stop:stopTimer,reset:resetTimer}=useCountdown(totalTime,handleTimeout);

  // Start timer when game_ready
  useEffect(()=>{
    if(screen==="game_ready"){
      resetTimer(totalTime);
      setScreen("game");
      setTimeout(()=>startTimer(),100);
    }
  },[screen,resetTimer,totalTime,startTimer]);

  // Opponent finished → lose
  useEffect(()=>{
    if(oppFinished&&!submitted&&screen==="game"){
      stopTimer();
      const el=Math.round((Date.now()-startRef.current)/1000);
      setResult({type:"lose",elapsed:el});
      setScreen("result");
    }
  // eslint-disable-next-line
  },[oppFinished]);

  // ── SOLO ─────────────────────────────────────────────────────────────
  async function handleSolo(){
    setMode("solo");
    setScreen("loading");
    try{
      const p=await generateProblem(diff,topic);
      setProblem(p);
      setCode(STARTERS[lang]);
      setOutput(null);
      setSubmitted(false);
      setOppFinished(false);
      setOppStatus("thinking...");
      startRef.current=Date.now();

      const[lo,hi]=BOT_TIMES[diff];
      const delay=(lo+Math.random()*(hi-lo))*1000;
      setTimeout(()=>setOppStatus("typing..."),delay*.25);
      setTimeout(()=>setOppStatus("running tests..."),delay*.6);
      setTimeout(()=>setOppStatus("got WA..."),delay*.78);
      botTimerRef.current=setTimeout(()=>{setOppFinished(true);setOppStatus("solved ✓");},delay);

      resetTimer(totalTime);
      setScreen("game");
      setTimeout(()=>startTimer(),100);
    }catch(e){
      setScreen("lobby");
      alert("AI error — try again");
    }
  }

  // ── HOST ─────────────────────────────────────────────────────────────
  function handleHost(){
    setMode("host");
    setIsHost(true);
    setOppOnline(false);
    setWsError("");
    const ws=connect();
    ws.onopen=()=>{
      send({type:"create_room",diff,topic,name:"You"});
    };
  }

  // ── JOIN ─────────────────────────────────────────────────────────────
  function handleJoin(){
    const code=joinCode.trim().toUpperCase();
    if(code.length<4){setWsError("Enter a valid room code");return;}
    setMode("join");
    setIsHost(false);
    setWsError("");
    const ws=connect();
    ws.onopen=()=>{
      send({type:"join_room",roomCode:code,name:"You"});
    };
  }

  // ── HOST starts game ─────────────────────────────────────────────────
  async function handleStartGame(){
    setScreen("loading");
    try{
      const p=await generateProblem(diff,topic);
      send({type:"start_game",problem:p});
      // host also receives game_start via server broadcast
    }catch(e){
      setScreen("waiting");
      alert("AI error — try again");
    }
  }

  // ── RUN code ─────────────────────────────────────────────────────────
  async function handleRun(){
    setRunning(true);
    setOutput({type:"run",text:"> Running on Piston engine..."});
    send({type:"player_status",status:"running tests..."});
    try{
      const r=await runCode(lang,code,"");
      if(r.stderr&&!r.stdout){
        setOutput({type:"err",text:`> Runtime Error\n${r.stderr.slice(0,400)}`});
        send({type:"player_status",status:"got an error..."});
      }else{
        setOutput({type:"ok",text:`> Output:\n${(r.stdout||"(no output)").slice(0,400)}${r.stderr?"\n[stderr]: "+r.stderr.slice(0,150):""}`});
        send({type:"player_status",status:"testing..."});
      }
    }catch(e){
      setOutput({type:"err",text:`> Connection error: ${e.message}`});
    }
    setRunning(false);
  }

  // ── SUBMIT ───────────────────────────────────────────────────────────
  async function handleSubmit(){
    if(submitted)return;
    setRunning(true);
    setOutput({type:"run",text:"> Submitting solution..."});
    send({type:"player_status",status:"submitting..."});
    try{
      const r=await runCode(lang,code,"");
      const ok=!r.stderr||r.stdout;
      stopTimer();
      clearTimeout(botTimerRef.current);
      const el=Math.round((Date.now()-startRef.current)/1000);
      if(ok){
        setSubmitted(true);
        setOutput({type:"ok",text:`> Accepted ✓\n> Output: ${(r.stdout||"").slice(0,200)}\n> Time: ${fmt(el)}`});
        send({type:"player_finished",elapsed:el});
        setResult({type:"win",elapsed:el});
        setScreen("result");
      }else{
        setOutput({type:"err",text:`> Wrong Answer / Error\n${(r.stderr||"").slice(0,300)}`});
        send({type:"player_status",status:"got WA..."});
      }
    }catch(e){
      setOutput({type:"err",text:`> Error: ${e.message}`});
    }
    setRunning(false);
  }

  // ── RESTART ──────────────────────────────────────────────────────────
  function handleRestart(){
    clearTimeout(botTimerRef.current);
    stopTimer();
    close();
    setScreen("lobby");
    setMode(null);
    setRoomCode("");
    setJoinCode("");
    setProblem(null);
    setResult(null);
    setOppStatus("online");
    setOppFinished(false);
    setOppOnline(false);
    setSubmitted(false);
    setWsError("");
  }

  function copyCode(){
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(()=>setCopied(false),2000);
  }

  const tc=time<30?"urg":time<60?"warn":"ok";
  const connLabel={idle:"offline",connecting:"connecting...",connected:"connected",error:"error"};
  const connClass={idle:"connecting",connecting:"connecting",connected:"connected",error:"error"};

  return(
    <>
      <style>{css}</style>
      <div className="app">

        {/* ── LOBBY ── */}
        {screen==="lobby"&&(
          <div className="lobby">
            <div className="logo">CODE<span>BLITZ</span></div>
            <div className="tagline">AI-Generated · Real Execution · Live Multiplayer</div>

            <div className="card">
              <div className="sec">// difficulty</div>
              <div className="diff-grid">
                {DIFFS.map(d=>(
                  <button key={d} className={`dbtn${diff===d?` sel ${d}`:""}`} onClick={()=>setDiff(d)}>
                    {d==="easy"?"[ EASY ]":d==="medium"?"[ MEDIUM ]":"[ HARD ]"}
                  </button>
                ))}
              </div>
              <div className="sec">// topic</div>
              <div className="topic-grid">
                {TOPICS.map(t=>(
                  <button key={t} className={`tbtn${topic===t?" sel":""}`} onClick={()=>setTopic(t)}>{t}</button>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="sec">// game mode</div>
              <div className="mode-grid">
                <button className="mode-btn" onClick={handleSolo}>
                  <span className="mi">🤖</span>vs AI Bot
                  <span className="ml">solo practice</span>
                </button>
                <button className="mode-btn" onClick={handleHost}>
                  <span className="mi">🔗</span>Host Room
                  <span className="ml">invite a friend</span>
                </button>
              </div>
              <div className="divider">or join existing room</div>
              <div className="join-row">
                <input className="join-input" placeholder="ROOM CODE" value={joinCode}
                  onChange={e=>setJoinCode(e.target.value.toUpperCase())} maxLength={6}/>
                <button className="big-btn green" onClick={handleJoin}>JOIN →</button>
              </div>
              {wsError&&<div className="err-msg">⚠ {wsError}</div>}
            </div>
          </div>
        )}

        {/* ── WAITING ── */}
        {screen==="waiting"&&(
          <div className="wait-screen">
            <div className="wait-title">
              {isHost?"// YOUR ROOM":"// WAITING FOR HOST"}
            </div>

            <div className={`conn-badge ${connClass[connState]}`}>
              <span className="conn-dot"/>
              server: {connLabel[connState]}
            </div>

            {isHost&&(
              <div className="room-code-box">
                <div className="room-code">{roomCode}</div>
                <div className="room-sub">Send this code to your opponent</div>
                <button className="copy-btn" onClick={copyCode}>
                  {copied?"✓ copied!":"📋 copy code"}
                </button>
              </div>
            )}
            {!isHost&&(
              <div className="room-code-box">
                <div className="room-code" style={{fontSize:"1.6rem"}}>{joinCode.toUpperCase()}</div>
                <div className="room-sub">Waiting for host to start the game...</div>
              </div>
            )}

            <div className="pstatus">
              <div className="pstat online">
                <div className="dot"/>
                <span>You</span>
                <span style={{color:"var(--muted)",fontSize:".65rem"}}>ready</span>
              </div>
              <span style={{color:"var(--muted)"}}>vs</span>
              <div className={`pstat ${oppOnline?"online":"offline"}`}>
                <div className="dot"/>
                <span>Opponent</span>
                <span style={{color:"var(--muted)",fontSize:".65rem"}}>{oppOnline?"ready":"waiting..."}</span>
              </div>
            </div>

            {isHost&&(
              <button className="big-btn green full" disabled={!oppOnline} onClick={handleStartGame}>
                {oppOnline?"⚡ START GAME":"WAITING FOR OPPONENT..."}
              </button>
            )}
            {!isHost&&!oppOnline&&(
              <div style={{color:"var(--muted)",fontSize:".75rem",padding:"12px 0",textAlign:"center"}}>
                Host will start once both players are ready...
              </div>
            )}
            <div style={{height:8}}/>
            <button className="big-btn outline full" onClick={handleRestart}>✕ Leave Room</button>
          </div>
        )}

        {/* ── LOADING ── */}
        {screen==="loading"&&(
          <div className="loading-screen">
            <div className="spinner"/>
            <div className="load-title">GENERATING PROBLEM</div>
            <div className="load-sub">// AI crafting a {diff} {topic} challenge...</div>
          </div>
        )}

        {/* ── GAME ── */}
        {screen==="game"&&problem&&(
          <div className="game">
            <div className="game-header">
              <div className="prow">
                <div className="ptag you">
                  <div className="pdot"/>
                  <span>YOU</span>
                </div>
                <span style={{color:"var(--muted)"}}>vs</span>
                <div className="ptag opp">
                  <div className="pdot"/>
                  <span>{mode==="solo"?"BOT":"OPPONENT"}</span>
                  <span className="opp-st">{oppStatus}</span>
                </div>
              </div>
              <div className={`timer ${tc}`}>{fmt(time)}</div>
              <div className={`dbadge ${diff}`}>{diff.toUpperCase()}</div>
            </div>

            {oppFinished&&!submitted&&(
              <div className="alert-banner cyan">⚡ Opponent solved it! Submit fast or lose!</div>
            )}
            {oppDisconnected&&(
              <div className="alert-banner red">⚠ Opponent disconnected</div>
            )}

            <div className="game-body">
              <div className="panel">
                <div className="ph"><span>// problem</span><span style={{color:"var(--cyan)"}}>{topic}</span></div>
                <div className="prob-body">
                  <div className="prob-title">{problem.title}</div>
                  <div className="ps"><p>{problem.statement}</p></div>
                  <div className="ps"><h4>Input</h4><p>{problem.input}</p></div>
                  <div className="ps"><h4>Output</h4><p>{problem.output}</p></div>
                  <div className="ps">
                    <h4>Examples</h4>
                    {problem.examples?.map((ex,i)=>(
                      <div key={i} className="ex">
                        <div><strong style={{color:"var(--muted)",fontSize:".67rem"}}>IN:</strong> {ex.input}</div>
                        <div><strong style={{color:"var(--muted)",fontSize:".67rem"}}>OUT:</strong> {ex.output}</div>
                        {ex.explanation&&<div style={{color:"var(--muted)",fontSize:".72rem",marginTop:3}}>// {ex.explanation}</div>}
                      </div>
                    ))}
                  </div>
                  <div className="ps">
                    <h4>Constraints</h4>
                    {problem.constraints?.map((c,i)=><div key={i} style={{color:"var(--muted)",fontSize:".78rem"}}>• {c}</div>)}
                  </div>
                  {problem.hint&&(
                    <div style={{marginTop:14,padding:"7px 11px",borderLeft:"2px solid var(--yellow)",color:"var(--yellow)",fontSize:".72rem"}}>
                      💡 {problem.hint}
                    </div>
                  )}
                </div>
              </div>

              <div className="panel" style={{display:"flex",flexDirection:"column"}}>
                <div className="ph">
                  <span>// solution</span>
                  <select className="lang-sel" value={lang}
                    onChange={e=>{setLang(e.target.value);setCode(STARTERS[e.target.value]);}}>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                  </select>
                </div>
                <textarea className="ce" value={code} onChange={e=>setCode(e.target.value)}
                  spellCheck={false}
                  onKeyDown={e=>{
                    if(e.key==="Tab"){
                      e.preventDefault();
                      const s=e.target.selectionStart;
                      setCode(c=>c.slice(0,s)+"    "+c.slice(e.target.selectionEnd));
                      setTimeout(()=>{e.target.selectionStart=e.target.selectionEnd=s+4;},0);
                    }
                  }}
                />
                {output&&(
                  <div className={`out ${output.type}`}>
                    <pre>{output.text}</pre>
                  </div>
                )}
                <div className="ef">
                  <button className="btn-run" onClick={handleRun} disabled={running}>
                    {running?"...":"▶ RUN"}
                  </button>
                  <button className="btn-sub" onClick={handleSubmit} disabled={running||submitted}>
                    {submitted?"SUBMITTED ✓":"⚡ SUBMIT"}
                  </button>
                  <button onClick={handleRestart}
                    style={{marginLeft:"auto",background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:".68rem"}}>
                    ✕ quit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {screen==="result"&&result&&(
          <div className="result-screen">
            <div className="ri">
              {result.type==="win"?"🏆":result.type==="timeout"?"⏱":"💀"}
            </div>
            <div className={`rt ${result.type==="win"?"win":result.type==="timeout"?"timeout":"lose"}`}>
              {result.type==="win"?"VICTORY":result.type==="timeout"?"TIMEOUT":"DEFEATED"}
            </div>
            <div className="rsub">
              {result.type==="win"?"Your solution passed — opponent still grinding!"
                :result.type==="timeout"?"Time ran out. Keep practising!"
                :"Opponent was faster. You'll get them next time."}
            </div>
            <div className="rstats">
              <div><div className="sl">Your time</div>
                <div className="sv" style={{color:"var(--green)"}}>{fmt(result.elapsed)}</div></div>
              <div><div className="sl">Difficulty</div>
                <div className="sv" style={{color:diff==="easy"?"var(--green)":diff==="medium"?"var(--yellow)":"var(--red)"}}>{diff.toUpperCase()}</div></div>
              <div><div className="sl">Topic</div>
                <div className="sv" style={{color:"var(--cyan)",fontSize:".85rem"}}>{topic}</div></div>
              <div><div className="sl">Result</div>
                <div className="sv" style={{fontSize:".85rem",color:result.type==="win"?"var(--green)":"var(--red)"}}>
                  {result.type==="win"?"AC ✓":"—"}</div></div>
            </div>
            <button className="big-btn green full" onClick={handleRestart}>[ PLAY AGAIN ]</button>
          </div>
        )}
      </div>
    </>
  );
}
