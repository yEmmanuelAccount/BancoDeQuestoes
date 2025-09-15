function getQuery(){ 
  const s=new URLSearchParams(location.search); 
  return {period:s.get('period'), subject:s.get('subject'), list:s.get('list')}; 
}

let currentIndex = 0;
let questions = [];
let answered = {}; 
const qparams = getQuery();

const metaDiv = document.getElementById('meta');
const qa = document.getElementById('question-area');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const confirmBtn = document.getElementById('confirmBtn');
const backLink = document.getElementById('backLink');

fetch('data.json').then(r=>r.json()).then(data=>{
  const period = (data.periods||[]).find(p=>p.id===qparams.period);
  if(!period) return qa.innerHTML = '<p>Período não encontrado</p>';
  const subject = (period.subjects||[]).find(s=>s.id===qparams.subject);
  if(!subject) return qa.innerHTML = '<p>Matéria não encontrada</p>';
  const list = (subject.lists||[]).find(l=>l.id===qparams.list);
  if(!list) return qa.innerHTML = '<p>Lista não encontrada</p>';

  metaDiv.innerHTML = `<h3>${period.title} › ${subject.title} › ${list.title}</h3>`;
  backLink.href = `lists.html?period=${encodeURIComponent(period.id)}&subject=${encodeURIComponent(subject.id)}`;
  questions = list.questions || [];
  if(questions.length === 0) qa.innerHTML = '<p>Nenhuma questão nessa lista.</p>';
  renderQuestion(currentIndex);
  updateButtons();
}).catch(err => {
  console.error(err);
  qa.innerHTML = '<p>Erro ao carregar questões.</p>';
});

function renderQuestion(i){
  qa.innerHTML = '';
  const q = questions[i];
  if(!q) return;

  const card = document.createElement('div');
  card.className = 'q-card';

  // enunciado
  const st = document.createElement('div');
  st.className = 'q-statement';
  st.innerText = `${i+1}. ${q.statement}`;
  card.appendChild(st);

  // alternativas
  const opts = document.createElement('div');
  opts.className = 'options';
  q.options.forEach(o=>{
    const opt = document.createElement('label');
    opt.className = 'option';
    opt.dataset.optid = o.id;

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'choice';
    radio.value = o.id;
    if(answered[q.id] && answered[q.id].selection === o.id) radio.checked = true;

    const header = document.createElement('div');
    header.className = 'option-header';

    const idBox = document.createElement('div'); 
    idBox.className='opt-id'; 
    idBox.innerText = o.id;

    const text = document.createElement('div'); 
    text.className='opt-text'; 
    text.innerText = o.text;

    header.appendChild(radio);
    header.appendChild(idBox);
    header.appendChild(text);

    opt.appendChild(header);

    // explicação associada à alternativa (inicialmente escondida)
    const expl = document.createElement('div');
    expl.className = 'explanation';
    expl.innerText = o.explanation;
    opt.appendChild(expl);

    opt.addEventListener('click', ()=>{
      if(opt.classList.contains('confirmed')) return;
      opt.querySelector('input').checked = true;
    });

    opts.appendChild(opt);
  });
  card.appendChild(opts);

  qa.appendChild(card);

  // se já foi confirmada antes, reaplica feedback
  if(answered[q.id] && answered[q.id].confirmed){
    applyFeedback(q, answered[q.id].selection, card);
  }
}

function getSelectedOption(){
  const sel = document.querySelector('input[name="choice"]:checked');
  return sel ? sel.value : null;
}

confirmBtn.addEventListener('click', ()=>{
  const q = questions[currentIndex];
  if(!q) return;
  const sel = getSelectedOption();
  if(!sel){ alert('Escolha uma alternativa antes de confirmar.'); return; }

  answered[q.id] = { selection: sel, confirmed: true };
  const card = document.querySelector('.q-card');
  applyFeedback(q, sel, card);
});

function applyFeedback(question, selection, cardElem){
  const optionElems = cardElem.querySelectorAll('.option');
  optionElems.forEach(el=>{
    el.classList.remove('correct','wrong');

    const id = el.dataset.optid;
    const expl = el.querySelector('.explanation');
    expl.style.display = "block"; // mostrar explicação

    if(id === question.answer){
      el.classList.add('correct');
    }
    if(id === selection && selection !== question.answer){
      el.classList.add('wrong');
    }
    el.classList.add('confirmed');
  });
}

prevBtn.addEventListener('click', ()=>{
  if(currentIndex>0){ 
    currentIndex--; 
    renderQuestion(currentIndex); 
    updateButtons(); 
  }
});

nextBtn.addEventListener('click', ()=>{
  if(currentIndex < questions.length -1){ 
    currentIndex++; 
    renderQuestion(currentIndex); 
    updateButtons(); 
  } else {
    showScore();
  }
});

function updateButtons(){
  prevBtn.disabled = currentIndex === 0;
  if(currentIndex === questions.length - 1){
    nextBtn.textContent = "Finalizar";
  } else {
    nextBtn.textContent = "Próxima";
  }
}

function showScore(){
  const total = questions.length;
  let correct = 0;
  questions.forEach(q=>{
    if(answered[q.id] && answered[q.id].selection === q.answer){
      correct++;
    }
  });

  qa.innerHTML = `
    <div class="q-card">
      <h2>Resultado Final</h2>
      <p>Você acertou <strong>${correct}</strong> de <strong>${total}</strong> questões.</p>
      <p>Percentual: <strong>${Math.round((correct/total)*100)}%</strong></p>
    </div>
  `;

  prevBtn.style.display = "none";
  nextBtn.style.display = "none";
  confirmBtn.style.display = "none";
}
