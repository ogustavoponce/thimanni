// --- 1. CONFIGURAÇÃO DO FIREBASE ---
// COLE AQUI AS CHAVES QUE VOCÊ COPIOU DO CONSOLE
const firebaseConfig = {
    apiKey: "AIzaSyBKRf-fSGJvYO8aZlQfxNbBMdWUXLZP9dA",
    authDomain: "thimanni-bbd0d.firebaseapp.com",
    projectId: "thimanni-bbd0d",
    storageBucket: "thimanni-bbd0d.firebasestorage.app",
    messagingSenderId: "782988538430",
    appId: "1:782988538430:web:f0721cf0832d44b6cb576f",
    measurementId: "G-H87S5SBHW5"
  };

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- 2. SISTEMA DE LOGIN ---

// Escuta o envio do formulário de login
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Pega os valores dos inputs (assumindo que são o 1º e 2º inputs do form)
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    const btnSubmit = e.target.querySelector('button');

    // Feedback visual de carregamento
    const originalText = btnSubmit.innerText;
    btnSubmit.innerText = "Entrando...";
    btnSubmit.disabled = true;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Sucesso! O listener 'onAuthStateChanged' vai lidar com a tela
            toggleModal('login-modal'); // Fecha modal
            console.log("Logado com sucesso!");
        })
        .catch((error) => {
            // Tratamento de Erro Profissional
            let msg = "Erro ao entrar.";
            if (error.code === 'auth/wrong-password') msg = "Senha incorreta.";
            if (error.code === 'auth/user-not-found') msg = "E-mail não cadastrado.";
            if (error.code === 'auth/invalid-email') msg = "E-mail inválido.";
            
            alert(msg); // Idealmente, usar um Toast/Notificação customizada
            btnSubmit.innerText = originalText;
            btnSubmit.disabled = false;
        });
});

function logout() {
    auth.signOut().then(() => {
        alert("Desconectado.");
        // O listener vai redirecionar para a home
    });
}

// --- 3. GUARDIÃO DE ROTAS E DADOS ---

// Esse listener roda sempre que a página carrega ou o status de login muda
auth.onAuthStateChanged((user) => {
    if (user) {
        // --- USUÁRIO LOGADO ---
        console.log("Usuário detectado:", user.email);
        
        // 1. Esconde Home/Quiz e Mostra Dashboard
        nextStep('step-dashboard');
        
        // 2. Busca os dados do treino dele no Firestore
        loadUserTraining(user.uid);

        // Atualiza UI
        document.getElementById('user-name').innerText = user.email.split('@')[0]; // Exibe parte do email como nome provisório
        
        // Muda botão do menu
        const navBtn = document.querySelector('.btn-login');
        navBtn.innerHTML = '<i class="ri-user-check-line"></i> Meu Painel';
        navBtn.onclick = () => nextStep('step-dashboard');

    } else {
        // --- USUÁRIO DESLOGADO ---
        // Se estiver no dashboard, chuta pra home
        const dashboard = document.getElementById('step-dashboard');
        if (dashboard.classList.contains('active')) {
            nextStep('step-home');
        }
        
        // Reseta botão do menu
        const navBtn = document.querySelector('.btn-login');
        navBtn.innerHTML = '<i class="ri-user-3-line"></i> Área do Aluno';
        navBtn.onclick = () => toggleModal('login-modal');
    }
});

// Função para buscar o link do PDF no Banco de Dados
function loadUserTraining(uid) {
    const planNameEl = document.getElementById('user-plan-name');
    const btnDownload = document.getElementById('btn-download-pdf');

    // Acessa a coleção 'usuarios', documento com o ID do usuário
    db.collection('usuarios').doc(uid).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            
            // Preenche os dados na tela
            planNameEl.innerText = data.nomeTreino || "Treino Personalizado";
            
            if (data.linkPdf) {
                btnDownload.href = data.linkPdf;
                btnDownload.classList.remove('disabled');
                btnDownload.innerHTML = '<i class="ri-file-download-line"></i> BAIXAR MEU TREINO';
            } else {
                planNameEl.innerText = "Seu treino está sendo montado...";
            }
        } else {
            // Usuário existe no Auth, mas não tem dados no DB (Recém criado ou erro)
            planNameEl.innerText = "Nenhum plano ativo encontrado.";
        }
    }).catch((error) => {
        console.error("Erro ao buscar dados:", error);
    });
}

// ... (Mantenha as funções nextStep, toggleModal e lógica do Quiz anteriores aqui) ...
// Variável para saber se está tentando logar ou cadastrar
let isLoginMode = true; 

function toggleAuthMode() {
    isLoginMode = !isLoginMode; // Inverte o modo
    
    const title = document.getElementById('modal-title');
    const btn = document.getElementById('auth-btn');
    const toggleText = document.getElementById('toggle-text');
    const toggleLink = document.getElementById('toggle-link');

    if (isLoginMode) {
        title.innerText = "Acesso Thimanni";
        btn.innerText = "ENTRAR NA PLATAFORMA";
        toggleText.innerText = "Ainda não é aluno?";
        toggleLink.innerText = "Criar conta agora";
    } else {
        title.innerText = "Criar Nova Conta";
        btn.innerText = "CADASTRAR E ENTRAR";
        toggleText.innerText = "Já tem conta?";
        toggleLink.innerText = "Fazer Login";
    }
}

// Listener do Formulário (Serve para os dois)
document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const btn = document.getElementById('auth-btn');
    
    btn.innerText = "Processando...";
    btn.disabled = true;

    if (isLoginMode) {
        // --- MODO LOGIN ---
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                toggleModal('login-modal');
                btn.disabled = false;
            })
            .catch((error) => {
                alert("Erro ao entrar: " + error.message);
                btn.innerText = "ENTRAR NA PLATAFORMA";
                btn.disabled = false;
            });
    } else {
        // --- MODO CADASTRO ---
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Cria o registro vazio no banco de dados para não dar erro
                db.collection('usuarios').doc(userCredential.user.uid).set({
                    nomeTreino: "Aguardando Avaliação...",
                    status: "novo"
                });
                
                toggleModal('login-modal');
                alert("Conta criada com sucesso! Bem-vindo ao time.");
                btn.disabled = false;
            })
            .catch((error) => {
                alert("Erro ao cadastrar: " + error.message);
                btn.innerText = "CADASTRAR E ENTRAR";
                btn.disabled = false;
            });
    }
});