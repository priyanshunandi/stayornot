// Simple scoring and recommendation engine for "Stay or Move"

function $(id){return document.getElementById(id)}

document.addEventListener('DOMContentLoaded', ()=>{
  // Wire up outputs for range inputs
  ['growthOps','learningOps','workLife','mentalHealth','satisfaction','commute'].forEach(id=>{
    const el = $(id), out = $(id+'Val');
    if(el && out){ el.addEventListener('input', ()=> out.textContent = el.value); out.textContent = el.value }
  });

  // Buttons
  $('analyze').addEventListener('click', analyze);
  $('reset').addEventListener('click', ()=>{ $('quiz').reset(); document.getElementById('result').classList.add('hidden'); });

  // Pagination: show/hide pages cPage1..cPage5
  let currentPage = 1;
  const totalPages = 5;
  function showPage(n){
    const direction = n > currentPage ? 'right' : 'left';
    for(let i=1;i<=totalPages;i++){
      const p = document.getElementById('cPage'+i);
      if(!p) continue;
      if(i===n){
        p.style.display = '';
        p.classList.remove('leave-left','leave-right');
        p.classList.add('enter');
      } else {
        p.classList.remove('enter');
        p.classList.add(direction === 'right' ? 'leave-left' : 'leave-right');
        // hide after transition
        setTimeout(()=>{ if(i!==n) p.style.display = 'none'; }, 360);
      }
    }
    currentPage = n;
  const prev = document.getElementById('prevPage');
  const next = document.getElementById('nextPage');
  if(prev) prev.disabled = n===1;
  if(next){
    if(n===totalPages){
      next.style.display = 'none';
    } else {
      next.style.display = '';
      next.textContent = '▶';
    }
  }
  }
  showPage(1);
  const prevBtn = $('prevPage'); const nextBtn = $('nextPage');
  if(prevBtn) prevBtn.addEventListener('click', ()=>{ if(currentPage>1) showPage(currentPage-1); });
  if(nextBtn) nextBtn.addEventListener('click', ()=>{ if(currentPage<totalPages) showPage(currentPage+1); else { /* last page: focus analyze */ $('analyze').focus(); } });

  // Support scheduling handlers (optional callback form)
  const mentalBtn = $('mentalSupport');
  const cbForm = $('callbackForm');
  if(mentalBtn && cbForm){ mentalBtn.addEventListener('click', ()=> cbForm.classList.toggle('hidden')) }
  const cancel = $('cancelCallback'); if(cancel){ cancel.addEventListener('click', ()=> cbForm.classList.add('hidden')) }
  const send = $('sendCallback'); if(send){ send.addEventListener('click', sendCallbackRequest) }
});

function analyze(){
  // Helper: get an input value from container `cPage1..cPage5` if present, otherwise from global id
  function getFromPages(selector){
    for(let i=1;i<=5;i++){
      const page = document.getElementById('cPage'+i);
      if(page){
        const el = page.querySelector(selector);
        if(el) return el;
      }
    }
    return document.querySelector(selector);
  }

  // Read inputs (try page containers first)
  const jobTitleEl = getFromPages('#jobTitle') || getFromPages('input[name=jobTitle]');
  const jobTitle = jobTitleEl ? (jobTitleEl.value||'').trim() : '';
  const years = Number((getFromPages('#yearsExp') || {}).value || 0);
  const curSal = Number((getFromPages('#currentSalary') || {}).value || 0);
  const indSal = Number((getFromPages('#industrySalary') || {}).value || 0);
  const incomeDep = Number((getFromPages('#incomeDependency') || {}).value || 1);
  const increment = Number((getFromPages('#increment') || {}).value || 0);
  const runway = Number((getFromPages('#runway') || {}).value || 0);
  const skillMatch = Number((getFromPages('#skillMatch') || {}).value || 0.5);
  const betterSkills = Number((getFromPages('#betterSkills') || {}).value || 0);
  const growthOps = Number((getFromPages('#growthOps') || {}).value || 0);
  const learningOps = Number((getFromPages('#learningOps') || {}).value || 0);
  const qual = Number((getFromPages('#qualification') || {}).value || 0.5);
  const workLife = Number((getFromPages('#workLife') || {}).value || 50);
  const mental = Number((getFromPages('#mentalHealth') || {}).value || 0);
  const satisfaction = Number((getFromPages('#satisfaction') || {}).value || 50);
  const commute = Number((getFromPages('#commute') || {}).value || 50);
  const culture = (getFromPages('#culture') || {}).value ? (getFromPages('#culture').value||'').trim() : '';
  const notes = (getFromPages('#notes') || {}).value ? (getFromPages('#notes').value||'').trim() : '';

  // Normalize components to 0..1 where higher means better for staying
  const salaryRel = indSal > 0 ? Math.min(1, curSal / indSal) : 0.8; // relative to industry
  const growthScore = growthOps/100;
  const learningScore = learningOps/100;
  const workLifeScore = workLife/100;
  const mentalScore = 1 - Math.min(1, mental/100); // lower mental impact -> higher score
  const satisfactionScore = satisfaction/100;

  // Weights (can be tuned)
  const weights = {
    salary: 0.18,
    incomeDependence: 0.12,
    growth: 0.15,
    learning: 0.12,
    skills: 0.12,
    workLife: 0.12,
    mental: 0.12,
    satisfaction: 0.07
  };

  // Skill-related composite
  const skillComposite = (skillMatch * 0.7) + (betterSkills * 0.3) * 1.0;

  // Compose final score
  const score = (
    salaryRel * weights.salary +
    (1 - incomeDep) * weights.incomeDependence +
    growthScore * weights.growth +
    learningScore * weights.learning +
    skillComposite * weights.skills +
    workLifeScore * weights.workLife +
    mentalScore * weights.mental +
    satisfactionScore * weights.satisfaction
  );

  // Normalize to 0..100 and map to 0..10 for display
  const finalScorePct = Math.round((score / Object.values(weights).reduce((a,b)=>a+b,0)) * 100);
  const finalScore = Math.round(finalScorePct/10);

  // Decide recommendation tiers
  let recommendation = '';
  const actions = [];
  let shortMsg = '';
  if(finalScorePct >= 75){
    recommendation = "Likely stay — You're in a relatively healthy position.";
    shortMsg = 'Strong alignment — staying is reasonable; keep building leverage.';
    actions.push('Keep documenting wins and career progress to strengthen future negotiations.');
    actions.push('If salary lags, prepare a data-backed case highlighting market rates and your impact.');
    actions.push('Consider a 6–12 month growth plan: stretch projects, mentorship, and learning goals.');
  } else if(finalScorePct >= 55){
    recommendation = "Consider improve & explore — You have reasons to stay but some gaps exist.";
    shortMsg = 'Mixed alignment — explore selectively while improving key gaps.';
    actions.push('Discuss growth and compensation openly with your manager; ask for a clear promotion path.');
    actions.push('Identify 2–3 skill upgrades or certifications that would raise your market value.');
    actions.push('Start passive job search (LinkedIn, recruiters) while you fix gaps; don\'t quit yet.');
  } else if(finalScorePct >= 40){
    recommendation = "Start looking — There are notable concerns worth exploring outside.";
    shortMsg = 'Mixed alignment — explore better options; update resume and talk to peers.';
    actions.push('Update your CV and LinkedIn; prioritize roles that fix the main gaps (pay, growth, people).');
    actions.push('If mental health or work-life balance is poor, consider short-term exit planning and safety net.');
    actions.push('Talk to peers or mentors for referrals and market insight.');
  } else {
    recommendation = "Strongly consider leaving — Multiple risk areas suggest moving on soon.";
    shortMsg = 'Low alignment — consider moving on and prioritise safety and wellbeing.';
    actions.push('If financially possible, plan a leave window and intensify job search immediately.');
    actions.push('Seek support (career coach, mental health resources) to manage transition stress.');
    actions.push('Prioritize roles with demonstrable growth, better compensation, and healthier culture.');
  }

  // Add personalized tweaks
  if(mental >= 60){ actions.unshift('Address mental health first: speak to a professional or HR where possible.'); }
  if(runway < 3 && incomeDep === 1){ actions.push('Boost emergency savings or secure a side income before risking a job change.'); }
  if(curSal < indSal * 0.85){ actions.push('Your pay is significantly below industry average — prepare to negotiate or seek market offers.'); }

  // Show results
  // Build a banner similar to the attached design
  const salaryDeltaPct = indSal > 0 ? Math.round(((curSal - indSal) / indSal) * 100) : 0;
  const salaryDeltaLabel = salaryDeltaPct === 0 ? 'Salary Δ 0.0%' : `${salaryDeltaPct > 0 ? 'Salary ↑' : 'Salary Δ'} ${Math.abs(salaryDeltaPct)}%`;

  const summaryNode = $('summary');
  summaryNode.innerHTML = '';
  const banner = document.createElement('div'); banner.className = 'result-banner';
  const top = document.createElement('div'); top.className = 'banner-row';
  const icon = document.createElement('div'); icon.className = 'badge-icon'; icon.textContent = 'i';
  const pills = document.createElement('div'); pills.className = 'pills';
  const catPill = document.createElement('span'); catPill.className = 'pill small'; catPill.textContent = shortMsg || 'Mixed alignment';
  const scorePill = document.createElement('span'); scorePill.className = 'pill'; scorePill.textContent = `Score ${Math.round(finalScorePct/10)}/10`;
  const salPill = document.createElement('span'); salPill.className = 'pill small'; salPill.textContent = salaryDeltaLabel;
  pills.appendChild(catPill); pills.appendChild(scorePill); pills.appendChild(salPill);
  top.appendChild(icon); top.appendChild(pills);
  const msg = document.createElement('div'); msg.className = 'banner-message'; msg.textContent = shortMsg || recommendation;
  const sub = document.createElement('div'); sub.className = 'banner-sub'; sub.textContent = `Context: ${jobTitle || '—'} ${culture? '• Culture: '+culture : ''} ${notes? '• Notes: '+notes : ''}`;
  banner.appendChild(top); banner.appendChild(msg); banner.appendChild(sub);
  summaryNode.appendChild(banner);
  // trigger entry animation
  requestAnimationFrame(()=>{ banner.classList.add('enter'); setTimeout(()=> banner.classList.remove('enter'), 800); });

  const list = $('actionsList'); list.innerHTML = '';
  actions.forEach(a=>{ const li = document.createElement('li'); li.textContent = a; list.appendChild(li) });

  // compute percent for visuals
  const pct = Math.max(0, Math.min(100, finalScorePct));

  // Render bars
  const comps = {
    'Salary vs Industry': Math.round(salaryRel*100),
    'Income dependence (lower is better)': Math.round((1-incomeDep)*100),
    'Growth opportunities': Math.round(growthScore*100),
    'Learning opportunities': Math.round(learningScore*100),
    'Skill fit / marketability': Math.round(skillComposite*100),
    'Work-life balance': Math.round(workLifeScore*100),
    'Mental health impact (lower better)': Math.round(mentalScore*100),
    'Job satisfaction': Math.round(satisfactionScore*100)
  };

  let bars = $('bars');
  if(!bars){ bars = document.createElement('div'); bars.id = 'bars'; document.getElementById('result').appendChild(bars); }
  bars.innerHTML = '';
  Object.keys(comps).forEach(k=>{
    const val = comps[k];
    const row = document.createElement('div'); row.className = 'bar-row';
    const label = document.createElement('div'); label.className = 'bar-label'; label.textContent = k;
    const track = document.createElement('div'); track.className = 'bar-track';
    const fill = document.createElement('div'); fill.className = 'bar-fill'; fill.style.width = '0%';
    const percent = document.createElement('div'); percent.style.width='48px'; percent.style.textAlign='right'; percent.style.marginLeft='8px'; percent.style.color='var(--muted)'; percent.textContent = val + '%';
    track.appendChild(fill); row.appendChild(label); row.appendChild(track); row.appendChild(percent);
    bars.appendChild(row);
    setTimeout(()=>{ fill.style.width = val + '%'; }, 80);
  });

  // Debug breakdown removed from UI to keep results clean

  // Update score card visuals
  const scoreNum = document.getElementById('scoreNum'); if(scoreNum) scoreNum.textContent = `${finalScore}/10`;
  const gaugeArc = document.getElementById('gaugeArc'); const gaugeText = document.getElementById('gaugeText');
  if(gaugeArc) gaugeArc.setAttribute('stroke-dasharray', `${pct},100`);
  if(gaugeText) gaugeText.textContent = `${finalScore}`;

  // Render mini Chart.js radar chart (radar gives a compact profile view)
  try{
    const mini = document.getElementById('miniChart');
    if(mini){
      const labels = Object.keys(comps);
      const data = labels.map(k=>comps[k]);
      if(window._miniChart) window._miniChart.destroy();
      window._miniChart = new Chart(mini.getContext('2d'),{
        type:'radar',
        data:{labels,datasets:[{
          label:'Profile',
          data,
          backgroundColor:'rgba(250,204,21,0.14)',
          borderColor:'#facc15',
          pointBackgroundColor:'#d4a017',
          pointRadius:3
        }]},
        options:{
          responsive:true,
          maintainAspectRatio:false,
          plugins:{legend:{display:false}},
          scales:{r:{beginAtZero:true,max:100,grid:{color:'rgba(15,23,42,0.06)'},angleLines:{color:'rgba(15,23,42,0.04)'},ticks:{display:false}}},
          elements:{line:{tension:0.3}}
        }
      });
    }
  }catch(e){console.warn('mini chart failed',e)}

  $('result').classList.remove('hidden');
  // animate score pop
  const scoreMeta = document.querySelector('.score-top .score-meta') || document.querySelector('.score-meta');
  if(scoreMeta){
    scoreMeta.classList.remove('score-pop');
    // force reflow then add class
    void scoreMeta.offsetWidth;
    scoreMeta.classList.add('score-pop');
  }
  window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
}

function sendCallbackRequest(){
  const name = $('cbName') ? $('cbName').value.trim() : '';
  const email = $('cbEmail') ? $('cbEmail').value.trim() : '';
  const note = $('cbNote') ? $('cbNote').value.trim() : '';
  if(!email){ alert('Please enter an email for contact'); return }
  const summary = `Name: ${name || '—'}\nEmail: ${email}\nJob: ${$('jobTitle').value || '—'}\nYears: ${$('yearsExp').value || '—'}\nSalary: ${$('currentSalary').value || '—'}\nSatisfaction: ${$('satisfaction').value || '—'}\nMental health: ${$('mentalHealth').value || '—'}\nNotes: ${$('notes').value || ''}\nUser note: ${note}`;
  const subject = encodeURIComponent('Callback request from StayOrNot user');
  const body = encodeURIComponent(summary);
  const to = 'therapist@example.com';
  const href = `mailto:${to}?subject=${subject}&body=${body}`;
  window.location.href = href;
}






