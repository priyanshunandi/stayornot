// script.js - cleaned and complete
// Simple scoring and recommendation engine for "Stay or Not"

function $(id){ return document.getElementById(id); }

document.addEventListener('DOMContentLoaded', () => {
  // Safe helper to wire range outputs
  ['growthOps','learningOps','workLife','mentalHealth','satisfaction','commute'].forEach(id=>{
    const el = $(id), out = $(id+'Val');
    if(el && out){
      el.addEventListener('input', ()=> out.textContent = el.value);
      out.textContent = el.value;
    }
  });

  // Buttons: attach only if present
  const analyzeBtn = $('analyze');
  if(analyzeBtn){
    analyzeBtn.addEventListener('click', (e)=>{
      // prevent accidental form submit
      e.preventDefault();
      if(!analyzeBtn.disabled) analyze();
    });
  }

  const resetBtn = $('reset');
  if(resetBtn){
    resetBtn.addEventListener('click', ()=> {
      const q = $('quiz'); if(q) q.reset();
      const res = $('result'); if(res) res.classList.add('hidden');
      // reset outputs for ranges if present
      ['growthOps','learningOps','workLife','mentalHealth','satisfaction','commute'].forEach(id=>{
        const el = $(id), out = $(id+'Val');
        if(el && out) out.textContent = el.value;
      });
      // hide callbacks if any
      const cb = $('callbackForm'); if(cb) cb.classList.add('hidden');
      // reset chart if exists
      if(window._miniChart){ try{ window._miniChart.destroy(); }catch(e){} window._miniChart = null; }
    });
  }

  // Pagination
  let currentPage = 1;
  const totalPages = 5;
  function showPage(n){
    if(typeof n !== 'number') return;
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
        // hide after transition
        (function(page,iLocal){
          setTimeout(()=>{ if(iLocal!==n) page.style.display = 'none'; }, 360);
        })(p,i);
      }
    }
    currentPage = n;
    // Prev/Next visibility + disabling
    const prev = $('prevPage');
    const next = $('nextPage');
    if(prev) prev.disabled = n===1;
    if(next){
      if(n===totalPages){
        next.style.display = 'none';
      } else {
        next.style.display = '';
        next.textContent = '▶';
      }
    }
    // Enable Analyze only on last page
    if(analyzeBtn) analyzeBtn.disabled = (n !== totalPages);
  }

  // initial display
  showPage(1);

  const prevBtn = $('prevPage');
  const nextBtn = $('nextPage');
  if(prevBtn) prevBtn.addEventListener('click', ()=>{ if(currentPage>1) showPage(currentPage-1); });
  if(nextBtn) nextBtn.addEventListener('click', ()=>{ if(currentPage<totalPages) showPage(currentPage+1); else { /* focus analyze */ if($('analyze')) $('analyze').focus(); } });

  // Optional callback UI toggles (if present)
  const mentalBtn = $('mentalSupport');
  const cbForm = $('callbackForm');
  if(mentalBtn && cbForm){ mentalBtn.addEventListener('click', ()=> cbForm.classList.toggle('hidden')) }
  const cancel = $('cancelCallback'); if(cancel){ cancel.addEventListener('click', ()=> { if(cbForm) cbForm.classList.add('hidden'); }); }
  const send = $('sendCallback'); if(send){ send.addEventListener('click', sendCallbackRequest); }
});

// Main analyze function (safe, with fallbacks)
function analyze(){
  try {
    // Helper to prefer page-contained inputs
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

    // Read inputs (with safe fallbacks)
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

    // Weights (tunable)
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

    const skillComposite = (skillMatch * 0.7) + (betterSkills * 0.3) * 1.0;

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

    const finalScorePct = Math.round((score / Object.values(weights).reduce((a,b)=>a+b,0)) * 100);
    const finalScore = Math.round(finalScorePct/10); // 0..10

    // Recommendation tiers
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

    if(mental >= 60){ actions.unshift('Address mental health first: speak to a professional or HR where possible.'); }
    if(runway < 3 && incomeDep === 1){ actions.push('Boost emergency savings or secure a side income before risking a job change.'); }
    if(curSal < indSal * 0.85){ actions.push('Your pay is significantly below industry average — prepare to negotiate or seek market offers.'); }

    // Build UI banner
    const salaryDeltaPct = indSal > 0 ? Math.round(((curSal - indSal) / indSal) * 100) : 0;
    const salaryDeltaLabel = salaryDeltaPct === 0 ? 'Salary Δ 0.0%' : `${salaryDeltaPct > 0 ? 'Salary ↑' : 'Salary Δ'} ${Math.abs(salaryDeltaPct)}%`;

    const summaryNode = $('summary');
    if(!summaryNode) throw new Error('Missing #summary node in DOM');
    summaryNode.innerHTML = '';

    const banner = document.createElement('div');
    // Auto tone class (1..3 low, 4..6 mid, 7+ high)
    let toneClass = 'score-mid';
    if(finalScore <= 3) toneClass = 'score-low';
    else if(finalScore >= 7) toneClass = 'score-high';
    banner.className = `result-banner ${toneClass}`;

    const top = document.createElement('div'); top.className = 'banner-row';
    const icon = document.createElement('div'); icon.className = 'badge-icon'; icon.textContent = 'i';
    const pills = document.createElement('div'); pills.className = 'pills';
    const catPill = document.createElement('span'); catPill.className = 'pill small'; catPill.textContent = shortMsg || 'Mixed alignment';
    const scorePill = document.createElement('span'); scorePill.className = 'pill'; scorePill.textContent = `Score ${finalScore}/10`;
    const salPill = document.createElement('span'); salPill.className = 'pill small'; salPill.textContent = salaryDeltaLabel;
    pills.appendChild(catPill); pills.appendChild(scorePill); pills.appendChild(salPill);
    top.appendChild(icon); top.appendChild(pills);
    const msg = document.createElement('div'); msg.className = 'banner-message'; msg.textContent = shortMsg || recommendation;
    const sub = document.createElement('div'); sub.className = 'banner-sub'; sub.textContent = `Context: ${jobTitle || '—'} ${culture? '• Culture: '+culture : ''} ${notes? '• Notes: '+notes : ''}`;
    banner.appendChild(top); banner.appendChild(msg); banner.appendChild(sub);
    summaryNode.appendChild(banner);

    // Animate banner entry lightly
    requestAnimationFrame(()=>{ banner.classList.add('enter'); setTimeout(()=> banner.classList.remove('enter'), 800); });

    // Populate actions list
    const list = $('actionsList');
    if(list){
      list.innerHTML = '';
      actions.forEach(a=>{
        const li = document.createElement('li'); li.textContent = a;
        list.appendChild(li);
      });
    }

    // Compose breakdown components array
    const pct = Math.max(0, Math.min(100, finalScorePct));
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

    // Render bars (clean)
    let bars = $('bars');
    const resultContainer = $('result');
    if(!bars && resultContainer){
      bars = document.createElement('div'); bars.id = 'bars';
      resultContainer.appendChild(bars);
    }
    if(!bars) throw new Error('Missing result container for bars');

    bars.innerHTML = '';
    Object.keys(comps).forEach(k=>{
      const val = comps[k];
      const row = document.createElement('div'); row.className = 'bar-row';

      const label = document.createElement('div'); label.className = 'bar-label'; label.textContent = k;

      const track = document.createElement('div'); track.className = 'bar-track';
      const fill = document.createElement('div'); fill.className = 'bar-fill'; fill.style.width = '0%';

      const percent = document.createElement('div'); percent.className = 'bar-percent'; percent.textContent = val + '%';
      // percent tone: low <=40, mid <=70, high >70
      if(val <= 40) percent.classList.add('low');
      else if(val <= 70) percent.classList.add('mid');
      else percent.classList.add('high');

      track.appendChild(fill);
      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(percent);
      bars.appendChild(row);

      // animate width
      setTimeout(()=>{ fill.style.width = val + '%'; }, 80);
    });

    // Update score display widgets if present
    const scoreNum = $('scoreNum'); if(scoreNum) scoreNum.textContent = `${finalScore}/10`;
    const gaugeArc = $('gaugeArc'); const gaugeText = $('gaugeText');
    if(gaugeArc) gaugeArc.setAttribute('stroke-dasharray', `${pct},100`);
    if(gaugeText) gaugeText.textContent = `${finalScore}`;

    // Render mini Chart.js radar (if available)
    try{
      const mini = $('miniChart') || $('miniChart') === null ? $('miniChart') : null; // safe get
      const canvas = $('miniChart');
      if(canvas && typeof Chart !== 'undefined'){
        const labels = Object.keys(comps);
        const data = labels.map(k=>comps[k]);
        if(window._miniChart){ try{ window._miniChart.destroy(); }catch(e){} window._miniChart = null; }
        window._miniChart = new Chart(canvas.getContext('2d'),{
          type:'radar',
          data:{ labels, datasets:[{
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
            scales:{ r:{ beginAtZero:true, max:100, grid:{color:'rgba(15,23,42,0.06)'}, angleLines:{color:'rgba(15,23,42,0.04)'}, ticks:{display:false} } },
            elements:{ line:{ tension:0.3 } }
          }
        });
      }
    } catch(e){
      console.warn('Chart rendering failed:', e);
    }

    // Show results
    const resultBlock = $('result');
    if(resultBlock) resultBlock.classList.remove('hidden');

    // Score pop animation
    const scoreMeta = document.querySelector('.score-top .score-meta') || document.querySelector('.score-meta');
    if(scoreMeta){
      scoreMeta.classList.remove('score-pop');
      void scoreMeta.offsetWidth;
      scoreMeta.classList.add('score-pop');
    }

    // Scroll to bottom smoothly where results are visible (if allowed)
    try{ window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); } catch(e){}
  } catch(err){
    console.error('Analyze failed:', err);
    alert('Something went wrong while analyzing — check console for details.');
  }
}

// Send callback (if used)
function sendCallbackRequest(){
  try {
    const name = $('cbName') ? $('cbName').value.trim() : '';
    const email = $('cbEmail') ? $('cbEmail').value.trim() : '';
    const note = $('cbNote') ? $('cbNote').value.trim() : '';
    if(!email){ alert('Please enter an email for contact'); return; }
    const summary = `Name: ${name || '—'}\nEmail: ${email}\nJob: ${$('jobTitle') ? $('jobTitle').value : '—'}\nYears: ${$('yearsExp') ? $('yearsExp').value : '—'}\nSalary: ${$('currentSalary') ? $('currentSalary').value : '—'}\nSatisfaction: ${$('satisfaction') ? $('satisfaction').value : '—'}\nMental health: ${$('mentalHealth') ? $('mentalHealth').value : '—'}\nNotes: ${$('notes') ? $('notes').value : ''}\nUser note: ${note}`;
    const subject = encodeURIComponent('Callback request from StayOrNot user');
    const body = encodeURIComponent(summary);
    const to = 'therapist@example.com';
    const href = `mailto:${to}?subject=${subject}&body=${body}`;
    window.location.href = href;
  } catch(e){
    console.error('Callback send failed', e);
    alert('Failed to prepare callback mail.');
  }
}







