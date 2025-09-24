function getQuery(){ 
  const s=new URLSearchParams(location.search); 
  return {period:s.get('period'), subject:s.get('subject')}; 
}
const q = getQuery();

fetch('data.json').then(r=>r.json()).then(data=>{
  const period = (data.periods||[]).find(p=>p.id===q.period);
  if(!period) return document.getElementById('list').innerText = 'Período não encontrado';
  const subject = (period.subjects||[]).find(s=>{
    const qsub = (q.subject||'').toString().toLowerCase();
    return s.id === q.subject
      || (s.id && s.id.toLowerCase() === qsub)
      || (s.title && s.title.toLowerCase() === qsub);
  });
  const title = document.getElementById('page-title');
  if(!subject) return title.innerText = 'Matéria não encontrada';
  title.innerText = `${period.title} — ${subject.title}`;
  const list = document.getElementById('list');
  if(!subject.lists || subject.lists.length===0){ 
    list.innerHTML = '<p class="muted">Nenhuma lista cadastrada.</p>'; 
    return; 
  }
  subject.lists.forEach(l=>{
    const a = document.createElement('a');
    a.href = `questions.html?period=${encodeURIComponent(period.id)}&subject=${encodeURIComponent(subject.id)}&list=${encodeURIComponent(l.id)}`;
    a.innerText = l.title;
    list.appendChild(a);
  });
}).catch(err=>{
  console.error(err); 
  document.getElementById('list').innerText='Erro ao carregar listas.' 
});
