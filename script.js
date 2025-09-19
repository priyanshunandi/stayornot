let bars = $('bars');
if(!bars){ 
  bars = document.createElement('div'); 
  bars.id = 'bars'; 
  document.getElementById('result').appendChild(bars); 
}
bars.innerHTML = '';

Object.keys(comps).forEach(k=>{
  const val = comps[k];
  const row = document.createElement('div'); 
  row.className = 'bar-row';

  const label = document.createElement('div'); 
  label.className = 'bar-label'; 
  label.textContent = k;

  const track = document.createElement('div'); 
  track.className = 'bar-track';

  const fill = document.createElement('div'); 
  fill.className = 'bar-fill'; 
  fill.style.width = '0%';

  const percent = document.createElement('div'); 
  percent.className = 'bar-percent'; 
  percent.textContent = val + '%';

  // assign tone based on value
  if(val <= 40) percent.classList.add('low');
  else if(val <= 70) percent.classList.add('mid');
  else percent.classList.add('high');

  track.appendChild(fill); 
  row.appendChild(label); 
  row.appendChild(track); 
  row.appendChild(percent);
  bars.appendChild(row);

  setTimeout(()=>{ fill.style.width = val + '%'; }, 80);
});







