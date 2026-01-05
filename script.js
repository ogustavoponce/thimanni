// --- CONFIGURAÇÃO FIREBASE (MANTENHA A SUA) ---
const firebaseConfig = {
    apiKey: "AIzaSyBKRf-fSGJvYO8aZlQfxNbBMdWUXLZP9dA",
    authDomain: "thimanni-bbd0d.firebaseapp.com",
    projectId: "thimanni-bbd0d",
    storageBucket: "thimanni-bbd0d.firebasestorage.app",
    messagingSenderId: "782988538430",
    appId: "1:782988538430:web:f0721cf0832d44b6cb576f",
    measurementId: "G-H87S5SBHW5"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- DADOS DO USUÁRIO ---
let userData = {
    sexo: '',
    idade: 0,
    peso: 0,
    altura: 0,
    meta: '',
    nivel: '',
    local: '',
    dias: '',
    lesao: '',
    foco: ''
};

// Navegação
function nextStep(stepId) {
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    document.getElementById(stepId).classList.remove('hidden');
    document.getElementById(stepId).classList.add('active');
}

// Opção Selecionável
function selectOption(key, value, nextId) {
    userData[key] = value;
    if (nextId === 'step-loading') {
        startAnalysis(); // O show do cálculo
    } else {
        nextStep(nextId);
    }
}

// Validação da Biometria (Idade/Peso/Altura)
function validateBio(nextId) {
    const i = document.getElementById('input-idade').value;
    const p = document.getElementById('input-peso').value;
    const a = document.getElementById('input-altura').value;

    if (!i || !p || !a) {
        alert("Preencha todos os dados para que o cálculo seja preciso.");
        return;
    }
    
    userData.idade = i;
    userData.peso = p;
    userData.altura = a;
    nextStep(nextId);
}

// O CÁLCULO E LOADING (PULO DO GATO)
function startAnalysis() {
    nextStep('step-loading');
    const txt = document.getElementById('loading-txt');
    const sub = document.getElementById('loading-sub');
    
    // Sequência de frases para parecer IA
    const steps = [
        { t: "Calculando IMC...", s: "Processando peso e altura..." },
        { t: "Analisando Metabolismo...", s: `Baseado em ${userData.idade} anos...` },
        { t: "Verificando Lesões...", s: userData.lesao === 'Nenhuma' ? "Estrutura apta para carga..." : "Adaptando para segurança..." },
        { t: "Finalizando Plano...", s: `Foco total em: ${userData.foco}` }
    ];

    let count = 0;
    const interval = setInterval(() => {
        if (count < steps.length) {
            txt.innerText = steps[count].t;
            sub.innerText = steps[count].s;
            count++;
        } else {
            clearInterval(interval);
            showResults();
        }
    }, 1500);
}

function showResults() {
    // 1. Calcula IMC
    let alturaMetros = userData.altura / 100;
    let imc = (userData.peso / (alturaMetros * alturaMetros)).toFixed(1);

    // 2. Preenche a tela de vendas com DADOS REAIS
    document.getElementById('res-imc').innerText = imc;
    document.getElementById('res-idade').innerText = userData.idade; // Idade real
    
    // 3. O Texto "Médico"
    document.getElementById('txt-idade').innerText = userData.idade;
    document.getElementById('txt-dias').innerText = userData.dias.split(' ')[0]; // Pega só o número (ex: "4")
    document.getElementById('txt-foco').innerText = userData.foco;

    nextStep('step-sales');
}

function goToPayment() {
    alert("Redirecionando para o Checkout...");
    // window.location.href = "SEU_LINK_DE_PAGAMENTO";
}

// --- LOGIN/CADASTRO E DASHBOARD (Mantido igual) ---
let isLoginMode = true;

function toggleModal(modalId) { document.getElementById(modalId).classList.toggle('hidden'); }
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const btn = document.getElementById('auth-btn');
    const link = document.getElementById('toggle-link');
    const title = document.getElementById('modal-title');
    const text = document.getElementById('toggle-text');
    
    if (isLoginMode) {
        title.innerText = "Acesso Thimanni";
        btn.innerText = "ENTRAR";
        text.innerText = "Ainda não é aluno?";
        link.innerText = "Criar conta";
    } else {
        title.innerText = "Criar Nova Conta";
        btn.innerText = "CADASTRAR";
        text.innerText = "Já tem conta?";
        link.innerText = "Fazer Login";
    }
}

document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const btn = document.getElementById('auth-btn');
    
    btn.innerText = "...";

    if (isLoginMode) {
        auth.signInWithEmailAndPassword(email, password).then(() => {
            toggleModal('login-modal');
            btn.innerText = "ENTRAR";
        }).catch(err => { alert(err.message); btn.innerText = "ENTRAR"; });
    } else {
        auth.createUserWithEmailAndPassword(email, password).then((cred) => {
            return db.collection('usuarios').doc(cred.user.uid).set({
                nomeTreino: "Aguardando Pagamento",
                linkPdf: ""
            });
        }).then(() => {
            toggleModal('login-modal');
            alert("Conta criada!");
            btn.innerText = "CADASTRAR";
        }).catch(err => { alert(err.message); btn.innerText = "CADASTRAR"; });
    }
});

function logout() { auth.signOut(); }

auth.onAuthStateChanged((user) => {
    const navBtn = document.querySelector('.btn-login-nav');
    if (user) {
        document.getElementById('user-name').innerText = user.email.split('@')[0];
        loadUserPlan(user.uid);
        navBtn.innerHTML = '<i class="ri-dashboard-line"></i> Painel';
        navBtn.onclick = () => nextStep('step-dashboard');
    } else {
        navBtn.innerHTML = '<i class="ri-user-line"></i> Área do Aluno';
        navBtn.onclick = () => toggleModal('login-modal');
        if(document.getElementById('step-dashboard').classList.contains('active')) nextStep('step-home');
    }
});

function loadUserPlan(uid) {
    db.collection('usuarios').doc(uid).get().then((doc) => {
        if(doc.exists) {
            const data = doc.data();
            document.getElementById('user-plan-name').innerText = data.nomeTreino || "Processando...";
            const btn = document.getElementById('btn-download-pdf');
            if(data.linkPdf) {
                btn.href = data.linkPdf;
                btn.classList.remove('disabled');
            }
        }
    });
}