// --- 1. CONFIGURAÇÃO FIREBASE (MANTENHA A SUA REAL AQUI!) ---
const firebaseConfig = {
    apiKey: "AIzaSyBKRf-fSGJvYO8aZlQfxNbBMdWUXLZP9dA",
    authDomain: "thimanni-bbd0d.firebaseapp.com",
    projectId: "thimanni-bbd0d",
    storageBucket: "thimanni-bbd0d.firebasestorage.app",
    messagingSenderId: "782988538430",
    appId: "1:782988538430:web:f0721cf0832d44b6cb576f",
    measurementId: "G-H87S5SBHW5"
};

// Inicializa
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- 2. DADOS DO USUÁRIO & FUNIL ---
let userData = {
    sexo: '',
    idade: '',
    peso: '',
    altura: '',
    musculos: [], // Array para guardar os músculos clicados
    nivel: ''
};

// Navegação Simples
function nextStep(stepId) {
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    const next = document.getElementById(stepId);
    next.classList.remove('hidden');
    next.classList.add('active');
}

// Opção Única (Sexo, Nível)
function selectOption(category, value, nextStepId) {
    userData[category] = value;
    
    if (nextStepId === 'step-loading') {
        startLoadingProcess(); // Inicia o show do loading
    } else {
        nextStep(nextStepId);
    }
}

// Validação dos Inputs (Idade/Peso)
function validateAndNext(nextStepId) {
    const idade = document.getElementById('input-idade').value;
    const peso = document.getElementById('input-peso').value;
    const altura = document.getElementById('input-altura').value;

    if(!idade || !peso || !altura) {
        alert("Por favor, preencha todas as medidas para calcularmos seu protocolo.");
        return;
    }

    userData.idade = idade;
    userData.peso = peso;
    userData.altura = altura;
    nextStep(nextStepId);
}

// LÓGICA DO BONECO (Músculos)
function toggleMuscle(btn, muscleName) {
    btn.classList.toggle('active'); // Muda a cor do botão
    
    if (userData.musculos.includes(muscleName)) {
        // Se já tem, remove
        userData.musculos = userData.musculos.filter(m => m !== muscleName);
    } else {
        // Se não tem, adiciona
        userData.musculos.push(muscleName);
    }
}

// O SHOW DO LOADING (Persuasão)
function startLoadingProcess() {
    nextStep('step-loading');
    
    const title = document.getElementById('loading-text');
    const sub = document.getElementById('loading-sub');
    
    const steps = [
        { t: "Calculando IMC...", s: `Baseado em ${userData.peso}kg e ${userData.altura}cm` },
        { t: "Analisando Biotipo...", s: "Verificando estrutura óssea" },
        { t: "Focando nos Músculos...", s: `Otimizando para: ${userData.musculos.join(', ') || 'Corpo todo'}` },
        { t: "Gerando Protocolo...", s: "Finalizando PDF personalizado" }
    ];

    let i = 0;
    const interval = setInterval(() => {
        if (i < steps.length) {
            title.innerText = steps[i].t;
            sub.innerText = steps[i].s;
            i++;
        } else {
            clearInterval(interval);
            showSalesPage();
        }
    }, 1500); // Muda a cada 1.5s
}

function showSalesPage() {
    // Preenche os dados na página de venda para parecer personalizado
    document.getElementById('res-sexo').innerText = userData.sexo === 'homem' ? 'Masculino' : 'Feminino';
    
    // Capitaliza a primeira letra do foco principal
    let foco = userData.musculos.length > 0 ? userData.musculos[0] : "Geral";
    document.getElementById('res-foco').innerText = foco.charAt(0).toUpperCase() + foco.slice(1);
    
    // Define nome do plano
    const planName = userData.sexo === 'homem' ? 'SHAPE SPARTANO' : 'CORPO DEUSA';
    document.getElementById('final-plan-name').innerText = planName;

    nextStep('step-sales');
}

function goToPayment() {
    alert("Redirecionando para Check-out Seguro...");
    // window.location.href = "SEU_LINK_KIWIFY_AQUI";
}

// --- 3. SISTEMA DE LOGIN (Mantido igual, mas conectado ao novo dashboard) ---
let isLoginMode = true;

function toggleModal(modalId) { document.getElementById(modalId).classList.toggle('hidden'); }

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const btn = document.getElementById('auth-btn');
    const link = document.getElementById('toggle-link');
    const text = document.getElementById('toggle-text');
    
    if (isLoginMode) {
        document.getElementById('modal-title').innerText = "Área do Aluno";
        btn.innerText = "ENTRAR";
        text.innerText = "Ainda não tem acesso?";
        link.innerText = "Criar conta";
    } else {
        document.getElementById('modal-title').innerText = "Criar Conta";
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
    
    if(isLoginMode) {
        auth.signInWithEmailAndPassword(email, password).then(() => {
            toggleModal('login-modal');
            btn.innerText = "ENTRAR";
        }).catch(err => { alert(err.message); btn.innerText = "ENTRAR"; });
    } else {
        auth.createUserWithEmailAndPassword(email, password).then((cred) => {
            return db.collection('usuarios').doc(cred.user.uid).set({
                nomeTreino: "Aguardando Pagamento",
                status: "novo"
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
        loadUserTraining(user.uid);
        navBtn.innerHTML = '<i class="ri-dashboard-line"></i> Painel';
        navBtn.onclick = () => nextStep('step-dashboard');
    } else {
        navBtn.innerHTML = '<i class="ri-user-line"></i> Já sou aluno';
        navBtn.onclick = () => toggleModal('login-modal');
        if(document.getElementById('step-dashboard').classList.contains('active')) nextStep('step-home');
    }
});

function loadUserTraining(uid) {
    db.collection('usuarios').doc(uid).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('user-plan-name').innerText = data.nomeTreino || "Analisando...";
            const btn = document.getElementById('btn-download-pdf');
            if (data.linkPdf) {
                btn.href = data.linkPdf;
                btn.classList.remove('disabled');
                btn.innerHTML = '<i class="ri-download-cloud-2-line"></i> BAIXAR TREINO PDF';
            }
        }
    });
}