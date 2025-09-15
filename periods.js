fetch('data.json').then(r => r.json()).then(data => {
  const cards = document.getElementById('cards');
  const periods = data.periods || [];

  for (let i=0; i<Math.max(10, periods.length); i++){
    const p = periods[i] || {
      id: 'empty'+i, 
      title: (i<periods.length?periods[i].title: (i+1)+'º Período (vazio)'), 
      meta: ''
    };
    const a = document.createElement('a');
    a.className = 'card';
    a.href = `subjects.html?period=${encodeURIComponent(p.id)}`;
    a.innerHTML = `<div class="title">${p.title}</div><div class="subtitle">${p.meta || ''}</div>`;
    if (!periods[i]) {
      a.style.opacity = '0.5';
      a.onclick = (e)=>{ e.preventDefault(); };
    }
    cards.appendChild(a);
  }
}).catch(err => {
  console.error(err);
  document.getElementById('cards').innerText = 'Erro ao carregar os períodos.';
});
