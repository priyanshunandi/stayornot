function $(id){ return document.getElementById(id); }

document.addEventListener('DOMContentLoaded', ()=>{
  // Sync sliders with outputs
  ['growthOps','learningOps','workLife','mentalHealth','satisfaction','commute'].forEach(id=>{
    const el = $(id), out = $(id+'Val');
    if(el && out){ 
      el.addEventListener('input', ()=> out.textContent = el.value); 
      out.textContent = el.value; 
    }
  });

  // Pagination
  let currentPage = 1;
  const totalPages = 5;

  function showPage(n){
    const direction = n > currentPage ? 'right' : 'left';
    for(let i=1;i<=totalPages;i++){
      const p = $('cPage'+i);
      if(!p) continue;
      if(i===n){
        p.style.display = '';
        p.classList.remove('leave-left','leave-right');
        p.classList.add('enter');
      } else {
        p.classList.remove('enter');
        p.classList.add(direction === 'right' ? 'leave-left' : 'leave-right');
        setTimeout(()=>{ if(i!==n) p.style.display = 'none'; }, 360);
      }
    }
    currentPage = n;
    $('prevPage').disabled = n===1;

    // toggle Analyze state
    if(n===totalPages){
      $('nextPage').style.display = 'none';
      $('analyze').disabled = false;
      $('analyze').classList.remove('disabled');
      $('analyze').classList.add('pulse');
    } else {
      $('nextPage').style.display = '';
      $('analyze').disabled = true;
      $('analyze').classList.add('disabled');
      $('analyze').classList.remove('pulse');
    }
  }

  // Reset
  $('reset').addEventListener('click', ()=>{
    $('quiz').reset();
    $('result').classList.add('hidden');
    // reset outputs
    ['growthOps','learningOps','workLife','mentalHealth','satisfaction','commute'].forEach(id=>{
      const el = $(id), out = $(id+'Val');
      if(el && out) out.textContent = el.value;
    });
    // reset to first page
    showPage(1);
  });

  // Navigation
  $('prevPage').addEventListener('click', ()=>{ if(currentPage>1) showPage(currentPage-1); });
  $('nextPage').addEventListener('click', ()=>{ if(currentPage<totalPages) showPage(currentPage+1); });

  // Analyze button — always bound
  $('analyze').addEventListener('click', ()=>{
    if(!$('analyze').disabled) analyze();
  });

  // Start on page 1
  showPage(1);
});

// =======================
// Analyze function
// =======================
function analyze(){
  function getFromPages(selector){
    for(let i=1;i<=5;i++){
      const page = $('cPage'+i);
      if(page){
        const el = page.querySelector(selector);
        if(el) return el;
      }
    }
    return document.querySelector(selector);
  }

  // Collect inputs
  const jobTitle = (getFromPages('#jobTitle')?.value||'').trim();
  const curSal = Number(getFromPages('#currentSalary')?.value||0);
  const indSal = Number(getFromPages('#industrySalary')?.value||0);
  const incomeDep = Number(getFromPages('#incomeDependency')?.value||1);
  const runway = Number(getFromPages('#runway')?.value||0);
  const skillMatch = Number(getFromPages('#skillMatch')?.value||0.5);
  const betterSkills = Number(getFromPages('#betterSkills')?.value||0);
  const growthOps = Number(getFromPages('#growthOps')?.value||0);
  const learningOps = Number(getFromPages('#learningOps')?.value||0);
  const workLife = Number(getFromPages('#workLife')?.value||50);
  const mental = Number(getFromPages('#mentalHealth')?.value||0);
  const satisfaction = Number(getFromPages('#satisfaction')?.value||50);
  const culture = (getFromPages('#culture')?.value||'').trim();
  const notes = (getFromPages('#notes')?.value||'').trim();

  // Score components
  const salaryRel = indSal>0 ? Math.min(1,curSal/indSal):0.8;
  const growthScore = growthOps/100;
  const learningScore = learningOps/100;
  const workLifeScore = workLife/100;
  const mentalScore = 1 - Math.min(1, mental/100);
  const satisfactionScore = satisfaction/100;
  const skillComposite = (skillMatch*0.7)+(betterSkills*0.3);

  const weights = {salary:.18,incomeDependence:.12,growth:.15,learning:.12,skills:.12,workLife:.12,mental:.12,satisfaction:.07};
  const score = (
    salaryRel*weights.salary +
    (1-incomeDep)*weights.incomeDependence +
    growthScore*weights.growth +
    learningScore*weights.learning +
    skillComposite*weights.skills +
    workLifeScore*weights.workLife +
    mentalScore*weights.mental +
    satisfactionScore*weights.satisfaction
  );
  const finalScorePct = Math.round((score/Object.values(weights).reduce((a,b)=>a+b,0))*100);
  const finalScore = Math.round(finalScorePct/10);

  // Recommendation
  let shortMsg="",actions=[];
  if(finalScorePct>=75){shortMsg="Strong alignment — staying is reasonable; keep building leverage.";actions=["Keep documenting wins.","Prepare a case for fair pay.","Plan a 6–12 month growth roadmap."];}
  else if(finalScorePct>=55){shortMsg="Mixed alignment — explore selectively while improving key gaps.";actions=["Discuss growth with manager.","Upgrade 2–3 skills.","Start passive job search."];}
  else if(finalScorePct>=40){shortMsg="Explore better options; update resume and talk to peers.";actions=["Update CV.","Plan exit if wellbeing is poor.","Seek referrals."];}
  else {shortMsg="Low alignment — consider moving on.";actions=["Plan job search soon.","Seek support.","Target healthier roles."];}

  if(mental>=60) actions.unshift("Address mental health first.");
  if(runway<3 && incomeDep===1) actions.push("Boost savings before risking change.");
  if(curSal<indSal*0.85) actions.push("You're paid below industry avg — negotiate or move.");

  // Banner
  const summaryNode=$('summary');summaryNode.innerHTML="";
  let toneClass='score-mid';if(finalScore<=3) toneClass='score-low'; else if(finalScore>=7) toneClass='score-high';
  const banner=document.createElement('div');banner.className=`result-banner ${toneClass}`;

  const top=document.createElement('div'); top.className='banner-row';
  const icon=document.createElement('div'); icon.className='badge-icon'; icon.textContent='i';
  const pills=document.createElement('div'); pills.className='pills';
  const cat=document.createElement('span'); cat.className='pill small'; cat.innerText=shortMsg;
  const scoreP=document.createElement('span'); scoreP.className='pill'; scoreP.innerText=`Score ${finalScore}/10`;
  const salDelta=indSal>0?Math.round(((curSal-indSal)/indSal)*100):0;
  const salP=document.createElement('span'); salP.className='pill small'; salP.innerText=`Salary Δ ${salDelta}%`;
  [cat,scoreP,salP].forEach(x=>pills.appendChild(x));
  top.appendChild(icon); top.appendChild(pills);
  const msg=document.createElement('div'); msg.className='banner-message'; msg.innerText=shortMsg;
  const sub=document.createElement('div'); sub.className='banner-sub'; sub.innerText=`Context: ${jobTitle||'—'} ${culture?'• '+culture:''} ${notes?'• '+notes:''}`;
  [top,msg,sub].forEach(x=>banner.appendChild(x));
  summaryNode.appendChild(banner);

  // Actions
  const list=$('actionsList');list.innerHTML="";
  actions.forEach(a=>{
    const li=document.createElement('li');
    li.innerText="✅ "+a;
    list.appendChild(li);
  });

  // Bars
  const comps={
    "Salary vs Industry":Math.round(salaryRel*100),
    "Income dependence":Math.round((1-incomeDep)*100),
    "Growth opportunities":Math.round(growthScore*100),
    "Learning opportunities":Math.round(learningScore*100),
    "Skill fit":Math.round(skillComposite*100),
    "Work-life balance":Math.round(workLifeScore*100),
    "Mental health":Math.round(mentalScore*100),
    "Job satisfaction":Math.round(satisfactionScore*100)
  };
  const bars=$('bars');bars.innerHTML="";
  Object.entries(comps).forEach(([k,val])=>{
    const row=document.createElement('div');row.className='bar-row';
    const label=document.createElement('div');label.className='bar-label';label.innerText=k;
    const track=document.createElement('div');track.className='bar-track';
    const fill=document.createElement('div');fill.className='bar-fill';fill.style.width='0%';
    const pct=document.createElement('div');pct.className='bar-percent';pct.innerText=val+"%";
    if(val<=40) pct.classList.add('low'); else if(val<=70) pct.classList.add('mid'); else pct.classList.add('high');
    track.appendChild(fill);[label,track,pct].forEach(x=>row.appendChild(x));bars.appendChild(row);
    setTimeout(()=>{fill.style.width=val+"%";},80);
  });

  // Score visuals
  if($('scoreNum')) $('scoreNum').innerText=`${finalScore}/10`;
  if($('gaugeArc')) $('gaugeArc').setAttribute('stroke-dasharray',`${finalScorePct},100`);
  if($('gaugeText')) $('gaugeText').innerText=finalScore;

  // Chart
  try{
    const ctx=$('miniChart')?.getContext('2d');
    if(ctx){
      if(window._miniChart) window._miniChart.destroy();
      window._miniChart=new Chart(ctx,{
        type:'radar',
        data:{labels:Object.keys(comps),datasets:[{data:Object.values(comps),backgroundColor:'rgba(250,204,21,0.14)',borderColor:'#facc15'}]},
        options:{plugins:{legend:{display:false}},scales:{r:{beginAtZero:true,max:100,ticks:{display:false}}}}
      });
    }
  }catch(e){console.warn(e);}

  // Show result with fade-in
  const resultEl=$('result');
  resultEl.classList.remove('hidden');
  resultEl.style.opacity=0;
  setTimeout(()=>{resultEl.style.transition="opacity 0.6s";resultEl.style.opacity=1;},30);

  window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
}














