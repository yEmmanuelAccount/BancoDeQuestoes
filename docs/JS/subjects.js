function getQuery() {
  const qs = new URLSearchParams(location.search);
  return { period: qs.get('period') };
}
const q = getQuery();

fetch('data.json').then(r=>r.json()).then(data=>{
  const period = (data.periods||[]).find(p=>p.id===q.period);
  const list = document.getElementById('list');
  const title = document.getElementById('page-title');
  if(!period) { title.innerText = 'Período não encontrado'; return; }
  title.innerText = `Matérias — ${period.title}`;
  if(!period.subjects || period.subjects.length===0){ 
    list.innerHTML = '<p class="muted">Nenhuma matéria cadastrada.</p>'; 
    return; 
  }
  period.subjects.forEach(s=>{
    const a = document.createElement('a');
    a.href = `lists.html?period=${encodeURIComponent(period.id)}&subject=${encodeURIComponent(s.id)}`;
    a.innerText = s.title;
    list.appendChild(a);
  });
}).catch(err=>{
  console.error(err);
  document.getElementById('list').innerText = 'Erro ao carregar as matérias.';
});
