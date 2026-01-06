// --- 1. CONFIGURAÇÃO FIREBASE (COLOQUE SUAS CHAVES REAIS AQUI) ---
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
// Flag para impedir que o AuthStateChanged jogue pro dashboard durante o cadastro
let isRegistering = false; 

// --- 3. NAVEGAÇÃO ---
function nextStep(stepId) {
    console.log("Indo para tela:", stepId);
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    const next = document.getElementById(stepId);
    if(next){
        next.classList.remove('hidden');
        next.classList.add('active');
    } else {
        console.error("Tela não encontrada:", stepId);
    }
}

// Opção Simples
function selectOption(category, value, nextStepId) {
    userData[category] = value;
    if (nextStepId === 'step-loading') {
        startLoadingProcess();
    } else {
        nextStep(nextStepId);
    }
}

// Validação Biometria
function validateBio(nextStepId) {
    const i = document.getElementById('input-idade').value;
    const p = document.getElementById('input-peso').value;
    const a = document.getElementById('input-altura').value;

    if (!i || !p || !a) {
        alert("Preencha todos os dados para o cálculo funcionar.");
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
        { t: "Calculando IMC...", s: "Processando peso e altura..." },
        { t: "Analisando Metabolismo...", s: `Baseado em ${userData.idade} anos...` },
        { t: "Finalizando Plano...", s: "Gerando diagnóstico..." }
    ];

    let i = 0;
    const interval = setInterval(() => {
        if (i < steps.length) {
            txt.innerText = steps[i].t;
            sub.innerText = steps[i].s;
            i++;
        } else {
            clearInterval(interval);
            // MANDA PARA O CADASTRO
            nextStep('step-lead-capture');
        }
    }, 1200);
}

// --- 5. CADASTRO DE LEAD (A CORREÇÃO ESTÁ AQUI) ---
const leadForm = document.getElementById('lead-form');
if(leadForm) {
    leadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Ativa a flag para travar redirecionamentos automáticos
        isRegistering = true;

        const name = document.getElementById('reg-name').value;
        const phone = document.getElementById('reg-phone').value;
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        const passConf = document.getElementById('reg-pass-conf').value;
        const btn = e.target.querySelector('button');

        if(pass !== passConf) { alert("As senhas não conferem!"); return; }
        if(pass.length < 6) { alert("Senha muito curta (mínimo 6)."); return; }

        btn.innerText = "GERANDO PLANO...";
        btn.disabled = true;

        auth.createUserWithEmailAndPassword(email, pass)
            .then((cred) => {
                console.log("Usuário criado no Auth:", cred.user.uid);
                
                // Salva no Firestore
                return db.collection('usuarios').doc(cred.user.uid).set({
                    nome: name,
                    telefone: phone,
                    email: email,
                    quizData: userData,
                    nomeTreino: "Aguardando Pagamento",
                    status: "lead",
                    dataCadastro: new Date()
                });
            })
            .then(() => {
                console.log("Dados salvos no Firestore.");
                // SUCESSO! Agora forçamos a ida para a venda
                showResults(name);
                
                // Desativa flag e libera botão (apenas visualmente, já trocou de tela)
                isRegistering = false; 
                btn.disabled = false;
                btn.innerText = "VER MEU DIAGNÓSTICO";
            })
            .catch((error) => {
                console.error("Erro no cadastro:", error);
                let msg = "Erro ao cadastrar.";
                if(error.code === 'auth/email-already-in-use') msg = "E-mail já existe. Tente fazer login.";
                alert(msg);
                
                isRegistering = false;
                btn.innerText = "TENTAR NOVAMENTE";
                btn.disabled = false;
            });
    });
}

// --- 6. EXIBIÇÃO DO RESULTADO (VENDA) ---
function showResults(userName) {
    try {
        console.log("Calculando resultados...");

        // Proteção contra divisão por zero
        let alturaMetros = userData.altura > 0 ? userData.altura / 100 : 1.70;
        let pesoReal = userData.peso > 0 ? userData.peso : 70;
        let imc = (pesoReal / (alturaMetros * alturaMetros)).toFixed(1);

        // Preenche Tela
        document.getElementById('res-imc').innerText = imc;
        document.getElementById('res-idade').innerText = userData.idade + " anos";

        // Lógica Médica
        let diagnosticoTexto = "";
        let prefixo = userName ? `${userName.split(' ')[0]}, ` : "";

        if (imc < 18.5) {
            diagnosticoTexto = `"${prefixo}seu IMC de ${imc} indica metabolismo acelerado. Focaremos em carga alta para ${userData.foco}."`;
        } else if (imc >= 18.5 && imc < 25) {
            diagnosticoTexto = `"${prefixo}seu IMC de ${imc} é equilibrado. Focaremos em definição muscular de ${userData.foco}."`;
        } else if (imc >= 25 && imc < 30) {
            diagnosticoTexto = `"${prefixo}com IMC de ${imc}, precisamos ativar queima de gordura e força para ${userData.foco}."`;
        } else {
            diagnosticoTexto = `"${prefixo}atenção ao IMC de ${imc}. O plano será ajustado para proteger articulações enquanto secamos."`;
        }

        // Injeta Texto
        const diagElement = document.getElementById('diagnosis-text');
        if(diagElement) {
            diagElement.innerText = diagnosticoTexto;
        } else {
            // Fallback se o ID não existir
            const fallback = document.querySelector('.diagnosis p');
            if(fallback) fallback.innerText = diagnosticoTexto;
        }

        // Manda para a venda
        nextStep('step-sales');

    } catch (err) {
        console.error("Erro ao mostrar resultados:", err);
        // Se der erro, manda pra venda mesmo assim pra não perder o cliente
        nextStep('step-sales'); 
    }
}

function goToPayment() {
    alert("Redirecionando para o Checkout...");
    // window.location.href = "SEU_LINK_AQUI";
}

// --- 7. AUTH STATE & LOGIN ---
let isLoginMode = true;

function toggleModal(modalId) { document.getElementById(modalId).classList.toggle('hidden'); }
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const btn = document.getElementById('auth-btn');
    const title = document.getElementById('modal-title');
    
    if (isLoginMode) {
        title.innerText = "Acesso Thimanni";
        btn.innerText = "ENTRAR";
    } else {
        title.innerText = "Criar Nova Conta";
        btn.innerText = "CADASTRAR";
    }
}

// Listener do Login (Menu)
const authForm = document.getElementById('auth-form');
if(authForm) {
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-password').value;
        const btn = document.getElementById('auth-btn');

        btn.innerText = "...";

        if (isLoginMode) {
            auth.signInWithEmailAndPassword(email, pass).then(() => {
                toggleModal('login-modal');
                btn.innerText = "ENTRAR";
            }).catch(err => { alert("Erro: " + err.message); btn.innerText = "ENTRAR"; });
        } else {
            // Cadastro via Modal (Raro, mas possível)
            auth.createUserWithEmailAndPassword(email, pass).then((cred) => {
                return db.collection('usuarios').doc(cred.user.uid).set({
                    email: email,
                    status: "novo"
                });
            }).then(() => {
                toggleModal('login-modal');
                alert("Conta criada!");
                btn.innerText = "CADASTRAR";
            });
        }
    });
}

function logout() { 
    auth.signOut().then(() => nextStep('step-home')); 
}

// Observador de Login
auth.onAuthStateChanged((user) => {
    const navBtn = document.querySelector('.btn-login-nav');
    
    if (user) {
        // Se estivermos no meio do cadastro (flag true), NÃO faça nada,
        // deixe a função do formulário controlar a tela.
        if (isRegistering) {
            console.log("Usuário criado, aguardando transição manual...");
            return;
        }

        console.log("Usuário logado detectado.");
        
        // Atualiza Menu
        if(navBtn) {
            navBtn.innerHTML = '<i class="ri-dashboard-line"></i> Painel';
            navBtn.onclick = () => nextStep('step-dashboard');
        }

        // Carrega dados para o Dashboard
        db.collection('usuarios').doc(user.uid).get().then(doc => {
            if(doc.exists) {
                const data = doc.data();
                const elName = document.getElementById('user-name');
                const elPlan = document.getElementById('user-plan-name');
                const btnDown = document.getElementById('btn-download-pdf');

                if(elName) elName.innerText = data.nome ? data.nome.split(' ')[0] : "Aluno";
                if(elPlan) elPlan.innerText = data.nomeTreino || "Analisando...";
                if(btnDown && data.linkPdf) {
                    btnDown.href = data.linkPdf;
                    btnDown.classList.remove('disabled');
                }
            }
        });

    } else {
        // Deslogado
        if(navBtn) {
            navBtn.innerHTML = '<i class="ri-user-line"></i> Área do Aluno';
            navBtn.onclick = () => toggleModal('login-modal');
        }
    }
});