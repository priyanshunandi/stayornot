// Simple scoring and recommendation engine for "Stay or Move"

function $(id){return document.getElementById(id)}

const elems = ['growthOps','learningOps','workLife','mentalHealth','satisfaction','commute'];

document.addEventListener('DOMContentLoaded', ()=>{
  elems.forEach(id=>{
    const el = $(id), out = $(id+'Val');
    if(el && out){ el.addEventListener('input', ()=> out.textContent = el.value); out.textContent = el.value }
  })

  $('analyze').addEventListener('click', analyze);
  $('reset').addEventListener('click', ()=>{ $('quiz').reset(); location.reload(); });
  // Support scheduling handlers
  const reqBtn = $('requestCallback');
  const cbForm = $('callbackForm');
  if(reqBtn){ reqBtn.addEventListener('click', ()=> cbForm.classList.remove('hidden')) }
  const cancel = $('cancelCallback'); if(cancel){ cancel.addEventListener('click', ()=> cbForm.classList.add('hidden')) }
  const send = $('sendCallback'); if(send){ send.addEventListener('click', sendCallbackRequest) }
  // Paid flow: detect ?paid=1 in URL and unlock paid features
  const urlParams = new URLSearchParams(window.location.search);
  const paid = urlParams.get('paid') === '1' || urlParams.get('dodopay') === '1' || urlParams.get('dodopaid') === '1';
  if(paid){
    // visually mark paid link and show a small confirmation
  const paidLink = $('paidLink'); if(paidLink){ paidLink.classList.add('paid'); paidLink.textContent = 'Payment received — Request your expert callback'; }
    // auto-open callback form after small delay
    setTimeout(()=>{ cbForm.classList.remove('hidden'); }, 700);
  }
})

function analyze(){
  // Read inputs
  const jobTitle = $('jobTitle').value.trim();
  const years = Number($('yearsExp').value || 0);
  const curSal = Number($('currentSalary').value || 0);
  const indSal = Number($('industrySalary').value || 0);
  const incomeDep = Number($('incomeDependency').value || 1);
  const increment = Number($('increment').value || 0);
  const runway = Number($('runway').value || 0);
  const skillMatch = Number($('skillMatch').value || 0.5);
  const betterSkills = Number($('betterSkills').value || 0);
  const growthOps = Number($('growthOps').value || 0);
  const learningOps = Number($('learningOps').value || 0);
  const qual = Number($('qualification').value || 0.5);
  const workLife = Number($('workLife').value || 50);
  const mental = Number($('mentalHealth').value || 0);
  const satisfaction = Number($('satisfaction').value || 50);
  const commute = Number($('commute').value || 50);
  const culture = $('culture').value.trim();
  const notes = $('notes').value.trim();

  // Normalize components to 0..1 where higher means better for staying
  const salaryRel = indSal > 0 ? Math.min(1, curSal / indSal) : 0.8; // relative to industry
  const incScore = Math.max(-1, increment/20); // -5..5 capped
  const runwayScore = Math.min(1, Math.log2(1+runway)/6); // months -> score
  const growthScore = growthOps/100;
  const learningScore = learningOps/100;
  const workLifeScore = workLife/100;
  const mentalScore = 1 - Math.min(1, mental/100); // lower mental impact -> higher score
  const satisfactionScore = satisfaction/100;
  const commuteScore = commute/100;

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

  // Normalize to 0..100
  const finalScore = Math.round((score / Object.values(weights).reduce((a,b)=>a+b,0)) * 100);

  // Decide recommendation tiers
  let recommendation = '';
  const actions = [];
  if(finalScore >= 75){
    recommendation = "Likely stay — You're in a relatively healthy position.";
    actions.push('Keep documenting wins and career progress to strengthen future negotiations.');
    actions.push('If salary lags, prepare a data-backed case highlighting market rates and your impact.');
    actions.push('Consider a 6–12 month growth plan: stretch projects, mentorship, and learning goals.');
  } else if(finalScore >= 55){
    recommendation = "Consider improve & explore — You have reasons to stay but some gaps exist.";
    actions.push('Discuss growth and compensation openly with your manager; ask for a clear promotion path.');
    actions.push('Identify 2–3 skill upgrades or certifications that would raise your market value.');
    actions.push('Start passive job search (LinkedIn, recruiters) while you fix gaps; don\'t quit yet.');
  } else if(finalScore >= 40){
    recommendation = "Start looking — There are notable concerns worth exploring outside.";
    actions.push('Update your CV and LinkedIn; prioritize roles that fix the main gaps (pay, growth, people).');
    actions.push('If mental health or work-life balance is poor, consider short-term exit planning and safety net.');
    actions.push('Talk to peers or mentors for referrals and market insight.');
  } else {
    recommendation = "Strongly consider leaving — Multiple risk areas suggest moving on soon.";
    actions.push('If financially possible, plan a leave window and intensify job search immediately.');
    actions.push('Seek support (career coach, mental health resources) to manage transition stress.');
    actions.push('Prioritize roles with demonstrable growth, better compensation, and healthier culture.');
  }

  // Add personalized tweaks
  if(mental >= 60){ actions.unshift('Address mental health first: speak to a professional or HR where possible.'); }
  if(runway < 3 && incomeDep === 1){ actions.push('Boost emergency savings or secure a side income before risking a job change.'); }
  if(curSal < indSal * 0.85){ actions.push('Your pay is significantly below industry average — prepare to negotiate or seek market offers.'); }

  // Show results
  // Summary text
  $('summary').innerHTML = `<p><strong>${recommendation}</strong></p><p>Context: ${jobTitle || '—'} ${jobTitle && jobTitle.length? '•' : ''} ${culture? 'Culture: '+culture : ''} ${notes? '• Notes: '+notes : ''}</p>`;

  // Actions list
  const list = $('actionsList'); list.innerHTML = '';
  actions.forEach(a=>{ const li = document.createElement('li'); li.textContent = a; list.appendChild(li) });

  // Render gauge
  const gaugeArc = $('gaugeArc');
  const gaugeText = $('gaugeText');
  const pct = Math.max(0, Math.min(100, finalScore));
  // stroke-dasharray uses percent of circumference, so use pct,100
  gaugeArc.setAttribute('stroke-dasharray', `${pct},100`);
  gaugeText.textContent = `${pct}%`;

  // Render bars for components
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

  const bars = $('bars'); bars.innerHTML = '';
  Object.keys(comps).forEach(k=>{
    const val = comps[k];
    const row = document.createElement('div'); row.className = 'bar-row';
    const label = document.createElement('div'); label.className = 'bar-label'; label.textContent = k;
    const track = document.createElement('div'); track.className = 'bar-track';
    const fill = document.createElement('div'); fill.className = 'bar-fill'; fill.style.width = '0%';
    const percent = document.createElement('div'); percent.style.width='48px'; percent.style.textAlign='right'; percent.style.marginLeft='8px'; percent.style.color='var(--muted)'; percent.textContent = val + '%';
    track.appendChild(fill); row.appendChild(label); row.appendChild(track); row.appendChild(percent);
    bars.appendChild(row);
    // animate after a tick
    setTimeout(()=>{ fill.style.width = val + '%'; }, 50);
  });

  // keep raw breakdown for debugging (hidden)
  $('breakdown').textContent = JSON.stringify({
    finalScore,
    components:{
      salaryRel: Math.round(salaryRel*100)/100,
      incomeDependence: incomeDep,
      growthScore: Math.round(growthScore*100)/100,
      learningScore: Math.round(learningScore*100)/100,
      skillComposite: Math.round(skillComposite*100)/100,
      workLifeScore: Math.round(workLifeScore*100)/100,
      mentalScore: Math.round(mentalScore*100)/100,
      satisfactionScore: Math.round(satisfactionScore*100)/100,
    },
    weights
  }, null, 2);

  $('result').classList.remove('hidden');
  window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
}

function sendCallbackRequest(){
  const name = $('cbName').value.trim();
  const email = $('cbEmail').value.trim();
  const note = $('cbNote').value.trim();
  // Basic validation
  if(!email){ alert('Please enter an email for contact'); return }

  // Build a compact summary of key inputs to include in the email body
  const summary = `Name: ${name || '—'}\nEmail: ${email}\nJob: ${$('jobTitle').value || '—'}\nYears: ${$('yearsExp').value || '—'}\nSalary: ${$('currentSalary').value || '—'}\nSatisfaction: ${$('satisfaction').value || '—'}\nMental health: ${$('mentalHealth').value || '—'}\nNotes: ${$('notes').value || ''}\nUser note: ${note}`;

  const subject = encodeURIComponent('Callback request from StayOrNot user');
  const body = encodeURIComponent(summary);
  // Compose mailto — replace therapist@example.com with your service email
  const to = 'therapist@example.com';
  const href = `mailto:${to}?subject=${subject}&body=${body}`;
  // Open user's default mail client
  window.location.href = href;
}
