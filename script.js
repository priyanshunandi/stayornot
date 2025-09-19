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

  // Pagination
  let currentPage = 1;
  const totalPages = 5;

  window.showPage = function(n){
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

  showPage(1);

  $('prevPage').addEventListener('click', ()=>{ if(currentPage>1) showPage(currentPage-1); });
  $('nextPage').addEventListener('click', ()=>{ if(currentPage<totalPages) showPage(currentPage+1); });
  $('analyze').addEventListener('click', analyze);
});













