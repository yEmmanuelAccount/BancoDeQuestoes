function getQuery(){ 
  const s = new URLSearchParams(location.search);
  return {
    period: s.get('period'),
    subject: s.get('subject'),
    list: s.get('list')
  };
}

let currentIndex = 0;
let questions = [];
let answered = {}; // { [questionId]: { selection: 'A', correct: true } }
const qparams = getQuery();

const metaDiv = document.getElementById('meta');
const qa = document.getElementById('question-area');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const confirmBtn = document.getElementById('confirmBtn');
const backLink = document.getElementById('backLink');

function showError(msg){
  qa.innerHTML = `<div class="q-card"><p class="muted">${msg}</p></div>`;
  prevBtn.style.display = "none";
  nextBtn.style.display = "none";
  confirmBtn.style.display = "none";
}

// build back link to lists
function setBackLink(){
  if(!backLink) return;
  const href = `lists.html?period=${encodeURIComponent(qparams.period||'')}&subject=${encodeURIComponent(qparams.subject||'')}`;
  backLink.href = href;
}

// render meta header
function setMeta(title){
  if(!metaDiv) return;
  metaDiv.innerHTML = `<h1>${title}</h1>`;
}

// helper function to apply pre-selection style (blue border)
function applyPreSelection(selectedId){
  const options = qa.querySelectorAll('.option');
  options.forEach(label => {
    label.classList.remove('pre-selected');
    if (label.getAttribute('data-optid') === selectedId) {
      label.classList.add('pre-selected');
    }
  });
}

// render a single question by index
function renderQuestion(i){
  if(!questions || questions.length===0){
    showError('Nenhuma questão nessa lista.');
    return;
  }
  if(i < 0) i = 0;
  if(i >= questions.length) i = questions.length - 1;
  currentIndex = i;

  const q = questions[i];
  const qnum = i + 1;

  // build card
  const wasAnswered = !!answered[q.id];
  const prevSelection = wasAnswered ? answered[q.id].selection : null;

  let html = `<div class="q-card">`;
  html += `<div class="q-statement">${qnum}. ${q.statement || ''}</div>`;

  // choices (fallback to alternatives)
  const choices = q.options || q.alternatives || [];
  if(!choices || choices.length === 0){
    html += `<p class="muted">Esta questão não tem alternativas cadastradas.</p>`;
    html += `</div>`;
    qa.innerHTML = html;
    // Visibilidade dos botões ajustada
    prevBtn.style.display = (currentIndex>0) ? "" : "none";
    nextBtn.style.display = (currentIndex < questions.length - 1) ? "" : "none";
    confirmBtn.style.display = "none";
    return;
  }

  html += `<div class="options">`;
  choices.forEach(o=>{
    // each option: ensure id and text exist
    const oid = o.id || '';
    const checked = (prevSelection && prevSelection === oid) ? 'checked' : '';
    
    // Adiciona a classe 'pre-selected' se for a opção marcada (mas ainda não confirmada)
    const preSelectedClass = !wasAnswered && prevSelection === oid ? 'pre-selected' : '';

    // Adiciona classes para feedback visual se a questão foi respondida
    let optionClass = '';
    let explanationHTML = ''; // Novo: container para explicação
    
    if (wasAnswered) {
        const correctAns = answered[q.id].correct;
        const correctId = q.answer || q.correct || null;
        
        // Determina a classe de cor (correct/wrong)
        if (oid === prevSelection && !correctAns) {
            optionClass = 'wrong'; // Selecionada e errada
        } else if (oid === correctId) {
            optionClass = 'correct'; // Certa
        } else if (oid === prevSelection && correctAns) {
            optionClass = 'selected correct'; // Selecionada e certa
        } else if (oid !== correctId && oid === prevSelection) {
            optionClass = 'wrong'; // Selecionada e errada
        }
        
        // Gera o HTML da justificativa individual
        const explanationText = o.explanation || '';
        if (explanationText) {
            // A cor da borda será determinada pela classe 'correct' ou 'incorrect'
            const expClass = oid === correctId ? 'correct' : 'incorrect';
            explanationHTML = `<div class="option-explanation ${expClass}">
                ${explanationText}
            </div>`;
        }
    }


    html += `<label class="option ${optionClass} ${preSelectedClass}" data-optid="${oid}">
      <input type="radio" name="choice" value="${oid}" ${checked} ${wasAnswered ? 'disabled' : ''}>
      <span class="opt-id">${oid}</span>
      <span class="opt-text">${o.text || ''}</span>
      ${wasAnswered ? explanationHTML : ''} </label>`;
  });
  html += `</div>`; // options

  // Não há mais área de explicação geral (#exp-placeholder)
  html += `</div>`; // q-card

  qa.innerHTML = html;

  // wire events to radios (only if not answered)
  if(!wasAnswered){
    const radios = qa.querySelectorAll('input[type=radio][name=choice]');
    radios.forEach(r=>{
      r.addEventListener('change', ()=> {
        // enable confirm button when selection exists
        confirmBtn.disabled = !qa.querySelector('input[type=radio][name=choice]:checked');
        
        // Aplica o highlight de pré-seleção
        applyPreSelection(r.value);
      });
    });
    // Garante que o estado inicial de highlight é aplicado se já houver uma seleção
    if (prevSelection) {
        applyPreSelection(prevSelection);
    }
    confirmBtn.disabled = !qa.querySelector('input[type=radio][name=choice]:checked');
  } else {
    confirmBtn.disabled = true;
  }

  // prev/next buttons visibility
  // Apenas ajusta a visibilidade aqui para quando está sendo renderizado, o confirmSelection faz o resto.
  prevBtn.style.display = (currentIndex>0) ? "" : "none";
  nextBtn.style.display = wasAnswered ? ((currentIndex < questions.length - 1) ? "" : "none") : "none";
  confirmBtn.style.display = wasAnswered ? "none" : "";
}

// confirm current selection
function confirmSelection(){
  const q = questions[currentIndex];
  const choices = q.options || q.alternatives || [];
  const selectedInput = qa.querySelector('input[type=radio][name=choice]:checked');
  if(!selectedInput){
    alert('Selecione uma alternativa antes de confirmar.');
    return;
  }
  const sel = selectedInput.value;
  const correctAnswer = q.answer || q.correct || null;
  const isCorrect = correctAnswer ? (sel === correctAnswer) : false;

  // store
  answered[q.id] = { selection: sel, correct: isCorrect };

  // Novo: Mapeia as opções da questão para fácil acesso à explicação
  const optionsMap = choices.reduce((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {});
  
  // update option visual feedback and inject explanations
  const optionLabels = qa.querySelectorAll('.option');
  
  optionLabels.forEach(label => {
    const optId = label.getAttribute('data-optid');
    const correctId = correctAnswer;
    const optionObj = optionsMap[optId] || {};
    const isThisCorrect = optId === correctId;
    
    // Remove o highlight de pré-seleção
    label.classList.remove('pre-selected');
    
    // Adiciona a classe 'confirmed'
    label.classList.add('confirmed'); // desabilita hover, etc

    // Aplica as classes de feedback de cor
    if (optId === sel && !isCorrect) {
      label.classList.add('wrong');
    } else if (isThisCorrect) {
      label.classList.add('correct');
    } else if (optId === sel && isCorrect) {
      label.classList.add('selected', 'correct');
    }

    // INJETA A JUSTIFICATIVA DENTRO DE CADA LABEL
    const explanationText = optionObj.explanation || '';
    if (explanationText) {
      const expClass = isThisCorrect ? 'correct' : 'incorrect';
      const explanationHtml = `<div class="option-explanation ${expClass}">
        ${explanationText}
      </div>`;
      // Injeta no final do label
      label.insertAdjacentHTML('beforeend', explanationHtml);
    }
    
  });

  // disable inputs
  const inputs = qa.querySelectorAll('input[type=radio][name=choice]');
  inputs.forEach(i => i.disabled = true);

  // BUGFIX: hide confirm, show navigation (especially 'next')
  confirmBtn.style.display = "none";
  nextBtn.style.display = (currentIndex < questions.length - 1) ? "" : "none";
  prevBtn.style.display = (currentIndex > 0) ? "" : "none"; // Garante que o prev também aparece
}

// navigate
function goNext(){
  if(currentIndex < questions.length - 1){
    renderQuestion(currentIndex + 1);
  } else {
    showResults();
  }
}
function goPrev(){
  if(currentIndex > 0){
    renderQuestion(currentIndex - 1);
  }
}

// show final results
function showResults(){
  const total = questions.length;
  let correct = 0;
  questions.forEach(q=>{
    if(answered[q.id] && answered[q.id].correct) correct++;
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

// load data.json and initialize
function init(){
  setBackLink();

  if(!qparams.period || !qparams.subject || !qparams.list){
    setMeta('Lista de questões');
    showError('Parâmetros insuficientes na URL. Esperado: period, subject, list.');
    return;
  }

  fetch('data.json').then(r=>{
    if(!r.ok) throw new Error('Erro ao carregar data.json');
    return r.json();
  }).then(data=>{
    const period = (data.periods || []).find(p => p.id === qparams.period);
    if(!period) { setMeta('Período não encontrado'); showError('Período não encontrado'); return; }
    // A busca por subject pode ser um pouco mais flexível: id ou title
    const subject = (period.subjects || []).find(s => s.id === qparams.subject || (s.id && s.id.toLowerCase() === (qparams.subject||'').toLowerCase() || (s.title && s.title.toLowerCase() === (qparams.subject||'').toLowerCase())));
    if(!subject) { setMeta('Matéria não encontrada'); showError('Matéria não encontrada'); return; }
    // A busca por list pode ser um pouco mais flexível: id ou title
    const list = (subject.lists || []).find(l => l.id === qparams.list || (l.id && l.id.toLowerCase() === (qparams.list||'').toLowerCase() || (l.title && l.title.toLowerCase() === (qparams.list||'').toLowerCase())));
    if(!list) { setMeta('Lista não encontrada'); showError('Lista não encontrada'); return; }

    setMeta(`${period.title} — ${subject.title} — ${list.title}`);

    // questions could be under list.questions or list.items or list.questionsList
    questions = list.questions || list.items || list.questionsList || [];

    // normalize each question (ensure id, statement, answer)
    questions = questions.map(q => ({
      id: q.id || q._id || `q_${Math.random().toString(36).slice(2,9)}`,
      statement: q.statement || q.title || q.prompt || '',
      options: q.options || q.alternatives || [],
      answer: q.answer || q.correct || q.resposta || null,
      explanation: q.explanation || q.note || ''
    }));

    if(questions.length === 0){
      showError('Nenhuma questão cadastrada nesta lista.');
      return;
    }

    // initial render
    renderQuestion(0);

  }).catch(err=>{
    console.error(err);
    showError('Erro ao carregar as questões. Veja o console para mais detalhes.');
  });

  // wire buttons
  if(prevBtn) prevBtn.addEventListener('click', goPrev);
  if(nextBtn) nextBtn.addEventListener('click', goNext);
  if(confirmBtn) confirmBtn.addEventListener('click', confirmSelection);
}

// start
init();
