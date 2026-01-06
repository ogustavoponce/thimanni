// --- 1. CONFIGURAÇÃO FIREBASE (SUAS CHAVES) ---
const firebaseConfig = {
    apiKey: "AIzaSyBKRf-fSGJvYO8aZlQfxNbBMdWUXLZP9dA",
    authDomain: "thimanni-bbd0d.firebaseapp.com",
    projectId: "thimanni-bbd0d",
    storageBucket: "thimanni-bbd0d.firebasestorage.app",
    messagingSenderId: "782988538430",
    appId: "1:782988538430:web:f0721cf0832d44b6cb576f",
    measurementId: "G-H87S5SBHW5"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// --- 2. VARIÁVEIS GLOBAIS ---
let userData = {
    sexo: 'Masculino',
    idade: 25,
    peso: 70,
    altura: 170,
    meta: 'Definição',
    nivel: 'Iniciante',
    local: 'Academia',
    dias: '4 dias',
    lesao: 'Nenhuma',
    foco: 'Geral'
};
let isRegistering = false; 

// --- 3. NAVEGAÇÃO ---
function nextStep(stepId) {
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    const next = document.getElementById(stepId);
    if(next){
        next.classList.remove('hidden');
        next.classList.add('active');
        window.scrollTo(0, 0); 
    }
}

function startQuizFlow() {
    toggleModal('login-modal');
    nextStep('step-1-gender');
}

function selectOption(category, value, nextStepId) {
    userData[category] = value;
    if (nextStepId === 'step-loading') {
        startLoadingProcess();
    } else {
        nextStep(nextStepId);
    }
}

function validateBio(nextStepId) {
    const i = document.getElementById('input-idade').value;
    const p = document.getElementById('input-peso').value;
    const a = document.getElementById('input-altura').value;

    if (!i || !p || !a) {
        alert("Preencha todos os dados.");
        return;
    }
    userData.idade = i;
    userData.peso = p;
    userData.altura = a;
    nextStep(nextStepId);
}

// --- 4. LOADING ---
function startLoadingProcess() {
    nextStep('step-loading');
    const txt = document.getElementById('loading-txt');
    const sub = document.getElementById('loading-sub');
    
    const steps = [
        { t: "Calculando IMC...", s: "Processando biometria..." },
        { t: "Analisando Metabolismo...", s: `Baseado em ${userData.idade} anos...` },
        { t: "Montando Painel...", s: "Gerando diagnóstico..." }
    ];

    let i = 0;
    const interval = setInterval(() => {
        if (i < steps.length) {
            txt.innerText = steps[i].t;
            sub.innerText = steps[i].s;
            i++;
        } else {
            clearInterval(interval);
            nextStep('step-lead-capture');
        }
    }, 1200);
}

// --- 5. CADASTRO DE LEAD ---
const leadForm = document.getElementById('lead-form');
if(leadForm) {
    leadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        isRegistering = true; 

        const name = document.getElementById('reg-name').value;
        const phone = document.getElementById('reg-phone').value;
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        const passConf = document.getElementById('reg-pass-conf').value;
        const btn = e.target.querySelector('button');

        if(pass !== passConf) { alert("Senhas diferentes!"); return; }
        if(pass.length < 6) { alert("Senha curta (mín 6)."); return; }

        btn.innerText = "ACESSANDO PAINEL...";
        btn.disabled = true;

        auth.createUserWithEmailAndPassword(email, pass)
            .then((cred) => {
                return db.collection('usuarios').doc(cred.user.uid).set({
                    nome: name,
                    telefone: phone,
                    email: email,
                    quizData: userData,
                    nomeTreino: "Treino Personalizado",
                    status: "lead", // Entra como LEAD
                    dataCadastro: new Date()
                }).catch(err => {
                    console.error("Erro banco:", err);
                    return true;
                });
            })
            .then(() => {
                // Sucesso: Vai para o Dashboard e Renderiza a Venda
                renderDashboardSales(name);
                nextStep('step-dashboard');
                
                isRegistering = false; 
                btn.disabled = false;
                btn.innerText = "ACESSAR MEU PAINEL";
            })
            .catch((error) => {
                let msg = "Erro ao cadastrar.";
                if(error.code === 'auth/email-already-in-use') msg = "E-mail já cadastrado. Faça login.";
                alert(msg);
                isRegistering = false;
                btn.innerText = "TENTAR NOVAMENTE";
                btn.disabled = false;
            });
    });
}

// --- 6. RENDERIZADOR DO DASHBOARD DE VENDAS ---
function renderDashboardSales(userName) {
    // Esconde área de download, mostra área de venda
    document.getElementById('dash-active-area').classList.add('hidden');
    document.getElementById('dash-sales-area').classList.remove('hidden');

    // Atualiza status badge
    const badge = document.getElementById('user-status-badge');
    badge.className = 'badge-pending';
    badge.innerText = "AGUARDANDO ATIVAÇÃO";

    // Cálculo IMC
    let alturaMetros = userData.altura > 0 ? userData.altura / 100 : 1.70;
    let pesoReal = userData.peso > 0 ? userData.peso : 70;
    let imc = (pesoReal / (alturaMetros * alturaMetros)).toFixed(1);

    document.getElementById('res-imc').innerText = imc;
    document.getElementById('res-idade').innerText = userData.idade + " anos";

    // Lógica Médica
    let diagnosticoTexto = "";
    let prefixo = userName ? `${userName.split(' ')[0]}, ` : "";

    if (imc < 18.5) {
        diagnosticoTexto = `"${prefixo}seu IMC de ${imc} indica metabolismo acelerado. O protocolo foca em carga alta para ${userData.foco}."`;
    } else if (imc >= 18.5 && imc < 25) {
        diagnosticoTexto = `"${prefixo}seu IMC de ${imc} é equilibrado. Focaremos em definição muscular de ${userData.foco}."`;
    } else if (imc >= 25 && imc < 30) {
        diagnosticoTexto = `"${prefixo}com IMC de ${imc}, precisamos ativar queima de gordura e força para ${userData.foco}."`;
    } else {
        diagnosticoTexto = `"${prefixo}atenção ao IMC de ${imc}. O plano protege articulações enquanto secamos."`;
    }

    document.getElementById('diagnosis-text').innerText = diagnosticoTexto;
}

function goToPayment() {
    alert("Redirecionando para o Checkout...");
}

// --- 7. MODAL LOGIN ---
function toggleModal(modalId) { document.getElementById(modalId).classList.toggle('hidden'); }

const authForm = document.getElementById('auth-form');
if(authForm) {
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-password').value;
        const btn = document.getElementById('auth-btn');

        btn.innerText = "ENTRANDO...";
        btn.disabled = true;

        auth.signInWithEmailAndPassword(email, pass)
            .then(() => {
                toggleModal('login-modal');
                btn.innerText = "ENTRAR";
                btn.disabled = false;
            })
            .catch(err => { 
                alert("Erro: " + err.message); 
                btn.innerText = "ENTRAR"; 
                btn.disabled = false;
            });
    });
}

function logout() { 
    auth.signOut().then(() => nextStep('step-home')); 
}

// --- 8. OBSERVADOR DE ESTADO (AUTH) ---
auth.onAuthStateChanged((user) => {
    const navBtn = document.querySelector('.btn-login-nav');
    
    if (user) {
        if (isRegistering) return;
        
        console.log("Logado. Verificando acesso...");
        
        db.collection('usuarios').doc(user.uid).get().then(doc => {
            if(doc.exists) {
                const data = doc.data();
                
                // Nome
                const elName = document.getElementById('user-name');
                if(elName) elName.innerText = data.nome ? data.nome.split(' ')[0] : "Aluno";
                
                // Plano Nome
                const elPlan = document.getElementById('user-plan-name');
                if(elPlan) elPlan.innerText = data.nomeTreino || "Analisando...";

                if (data.status === 'lead') {
                    // LEAD: Renderiza a tela de Venda DENTRO do Dashboard
                    // Tenta recuperar dados do quiz salvos no banco se o userData estiver vazio
                    if(data.quizData) userData = data.quizData;
                    renderDashboardSales(data.nome);
                } else {
                    // ATIVO: Mostra Download
                    document.getElementById('dash-sales-area').classList.add('hidden');
                    document.getElementById('dash-active-area').classList.remove('hidden');
                    
                    const badge = document.getElementById('user-status-badge');
                    badge.className = 'badge-active';
                    badge.innerText = "ATIVO / VITALÍCIO";
                    
                    const btnDown = document.getElementById('btn-download-pdf');
                    if(btnDown && data.linkPdf) {
                        btnDown.href = data.linkPdf;
                        btnDown.classList.remove('disabled');
                    }
                }
                
                // Só redireciona se não estivermos no fluxo de quiz
                const current = document.querySelector('.screen.active');
                if(current.id === 'step-home' || current.id === 'step-dashboard') {
                    nextStep('step-dashboard');
                }

            } else {
                nextStep('step-dashboard');
            }
        });

        if(navBtn) {
            navBtn.innerHTML = '<i class="ri-dashboard-line"></i> Painel';
            navBtn.onclick = () => nextStep('step-dashboard');
        }

    } else {
        if(navBtn) {
            navBtn.innerHTML = '<i class="ri-user-line"></i> Área do Aluno';
            navBtn.onclick = () => toggleModal('login-modal');
        }
    }
});