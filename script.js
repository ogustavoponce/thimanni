// --- 1. SUA CONFIGURAÇÃO EXATA DO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyBKRf-fSGJvYO8aZlQfxNbBMdWUXLZP9dA",
    authDomain: "thimanni-bbd0d.firebaseapp.com",
    projectId: "thimanni-bbd0d",
    storageBucket: "thimanni-bbd0d.firebasestorage.app",
    messagingSenderId: "782988538430",
    appId: "1:782988538430:web:f0721cf0832d44b6cb576f",
    measurementId: "G-H87S5SBHW5"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- 2. LÓGICA DO QUIZ (ABERTO A TODOS) ---
let userAnswers = {};

function nextStep(stepId) {
    // Esconde todas as telas
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    
    // Mostra a próxima tela
    const next = document.getElementById(stepId);
    if(next) {
        next.classList.remove('hidden');
        next.classList.add('active');
    }
}

function selectOption(category, value, nextStepId) {
    userAnswers[category] = value;
    
    if (nextStepId === 'step-loading') {
        nextStep('step-loading');
        
        // Simula loading de 2 segundos antes de mostrar a venda
        setTimeout(() => {
            showResults();
        }, 2000);
    } else {
        nextStep(nextStepId);
    }
}

function showResults() {
    const planName = document.getElementById('plan-name');
    const resultFocus = document.getElementById('result-focus');
    
    // Customiza o texto final baseada na escolha
    if (userAnswers.objetivo === 'emagrecer') {
        planName.innerText = "PROTOCOLO DEFINIÇÃO EXTREMA";
        resultFocus.innerText = "queimar gordura e definir";
    } else {
        planName.innerText = "PROTOCOLO VOLUME TOTAL";
        resultFocus.innerText = "ganhar massa bruta";
    }
    
    nextStep('step-sales');
}

function goToPayment() {
    // Aqui você coloca o link do seu checkout (Kiwify/Hotmart)
    alert("Redirecionando para pagamento seguro...");
    // window.location.href = "SEU_LINK_AQUI";
}

// --- 3. SISTEMA DE LOGIN / CADASTRO (ÁREA DO ALUNO) ---
let isLoginMode = true;

function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.toggle('hidden');
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('modal-title');
    const btn = document.getElementById('auth-btn');
    const toggleText = document.getElementById('toggle-text');
    const toggleLink = document.getElementById('toggle-link');

    if (isLoginMode) {
        title.innerText = "Área do Aluno";
        btn.innerText = "ENTRAR";
        toggleText.innerText = "Ainda não tem acesso?";
        toggleLink.innerText = "Criar conta";
    } else {
        title.innerText = "Criar Nova Conta";
        btn.innerText = "CADASTRAR";
        toggleText.innerText = "Já tem cadastro?";
        toggleLink.innerText = "Fazer login";
    }
}

// Manipula o envio do formulário (Login ou Cadastro)
document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const btn = document.getElementById('auth-btn');
    
    const originalText = btn.innerText;
    btn.innerText = "...";
    btn.disabled = true;

    if (isLoginMode) {
        // LOGIN
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                toggleModal('login-modal');
                btn.innerText = originalText;
                btn.disabled = false;
            })
            .catch((error) => {
                alert("Erro ao entrar: " + error.message);
                btn.innerText = originalText;
                btn.disabled = false;
            });
    } else {
        // CADASTRO
        auth.createUserWithEmailAndPassword(email, password)
            .then((cred) => {
                // Cria documento vazio no Firestore para evitar erros
                return db.collection('usuarios').doc(cred.user.uid).set({
                    nomeTreino: "Analisando Pagamento...",
                    status: "novo"
                });
            })
            .then(() => {
                alert("Conta criada! Bem-vindo.");
                toggleModal('login-modal');
                btn.innerText = originalText;
                btn.disabled = false;
            })
            .catch((error) => {
                alert("Erro ao criar conta: " + error.message);
                btn.innerText = originalText;
                btn.disabled = false;
            });
    }
});

function logout() {
    auth.signOut();
}

// --- 4. GERENCIADOR DE ESTADO (LOGIN vs DESLOGADO) ---
auth.onAuthStateChanged((user) => {
    const navBtn = document.querySelector('.btn-login-nav');
    
    if (user) {
        // Se estiver logado
        console.log("Usuário logado:", user.email);
        
        // Carrega dados do usuário
        document.getElementById('user-name').innerText = user.email.split('@')[0];
        loadUserTraining(user.uid);

        // Se o usuário tentar logar de novo, já manda pro dashboard
        navBtn.innerHTML = '<i class="ri-dashboard-line"></i> Meu Painel';
        navBtn.onclick = () => nextStep('step-dashboard');
        
        // Se ele estava na home ou quiz, redireciona para dashboard (Opcional, removi para deixar livre)
        // nextStep('step-dashboard'); 
        
    } else {
        // Se estiver deslogado
        console.log("Sem usuário.");
        navBtn.innerHTML = '<i class="ri-user-line"></i> Já sou aluno';
        navBtn.onclick = () => toggleModal('login-modal');
        
        // Se estiver no dashboard, chuta pra fora
        const dashboard = document.getElementById('step-dashboard');
        if (dashboard.classList.contains('active')) {
            nextStep('step-home');
        }
    }
});

function loadUserTraining(uid) {
    const planNameEl = document.getElementById('user-plan-name');
    const btnDownload = document.getElementById('btn-download-pdf');

    db.collection('usuarios').doc(uid).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            planNameEl.innerText = data.nomeTreino || "Treino em Análise";
            
            if (data.linkPdf) {
                btnDownload.href = data.linkPdf;
                btnDownload.classList.remove('disabled');
                btnDownload.innerHTML = '<i class="ri-download-cloud-line"></i> BAIXAR TREINO COMPLETO';
            } else {
                planNameEl.innerText = "Aguardando liberação...";
                btnDownload.classList.add('disabled');
                btnDownload.innerHTML = 'Disponível após pagamento';
            }
        }
    });
}